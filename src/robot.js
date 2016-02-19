'use strict';

// var Fs = require('fs');
var Log = require('log');
var Path = require('path');
// var HttpClient = require('scoped-http-client');
var EventEmitter = require('events').EventEmitter;
// var async = require('async');

var User = require('./user');
var Brain = require('./brain');
var Response = require('./response');
// var ref = require('./listener');
// var Listener = ref.Listener;
// var TextListener = ref.TextListener;
var ref1 = require('./message');
var EnterMessage = ref1.EnterMessage;
var LeaveMessage = ref1.LeaveMessage;
var TopicMessage = ref1.TopicMessage;
var CatchAllMessage = ref1.CatchAllMessage;
// var Middleware = require('./middleware');

console.log('Hello webby!');

var WEBBY_DEFAULT_ADAPTERS = [
  'shell'
];

class Robot {
  constructor(adapterPath, adapter, httpd, name = 'Webby', alias = false) {
    // if (this.adapterPath === null) {
    this.adapterPath = '.' + Path.join(__dirname, 'adapters');
    // }
    this.name = name;
    this.events = new EventEmitter;
    this.brain = new Brain(this);
    this.alias = alias;
    this.adapter = null;
    this.Response = Response;
    this.commands = [];
    this.listeners = [];
    // this.middleware = {
    //   listener: new Middleware(this),
    //   response: new Middleware(this),
    //   receive: new Middleware(this)
    // };
    this.logger = new Log(process.env.WEBBY_LOG_LEVEL || 'info');
    this.pingIntervalId = null;
    this.globalHttpOptions = {};
    // this.parseVersion();
    // if (httpd) {
    //   this.setupExpress();
    // } else {
    //   this.setupNullRouter();
    // }
    this.loadAdapter(adapter);
    this.adapterName = adapter;
    this.errorHandlers = [];
    this.on('error', (err, res) => {
      this.invokeErrorHandlers(err, res);
    });
    this.onUncaughtException = (err) => {
      return this.emit('error', err);
    };
    process.on('uncaughtException', this.onUncaughtException);
  }

  // load adapter
  loadAdapter(adapter) {
    this.logger.debug("Loading adapter " + adapter);
    try {
      // require('./adapters/shell');
      let path = WEBBY_DEFAULT_ADAPTERS.indexOf(adapter) >= 0 ?
        this.adapterPath + '/' + adapter : 'webby-' + adapter;
      this.adapter = require(path).use(this);
    } catch (error) {
      this.logger.error("Cannot load adapter " + adapter + " - " + error);
      process.exit(1);
    }
  }

  invokeErrorHandlers(err, res) {
    this.logger.error(err.stack);
    let results = [];
    this.errorHandlers.forEach(function(errorHandler) {
      try {
        results.push(errorHandler(err, res));
      } catch(error) {
        results.push(this.logger.error("while invoking error handler: " +
          error + "\n" + error.stack));
      }
    });

    return results;
  }

  /**
   * Public: A wrapper around the EventEmitter API to make usage
   * semantically better.
   *
   * @params {string} event    - The event name.
   * @params {object} listener - A Function that is called with the
   *                             event parameter when event happens.
   *
   * Returns nothing.
   */
  on(event, ...args) {
    this.events.on(event, ...args);
  }

  /**
   * Public: A wrapper around the EventEmitter API to make usage
   * semantically better.
   *
   * @params {string} event   - The event name.
   * @params {string[]} args...  - Arguments emitted by the event
   *
   * Returns nothing.
   */
  emit(event, ...args) {
    this.events.emit(event, ...args);
  }

  /**
   * Public: Kick off the event loop for the adapter
   *
   * Returns nothing.
   */
  run() {
    this.emit('running');
    this.adapter.run();
  }
}

module.exports = Robot;
