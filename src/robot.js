'use strict';

// var Fs = require('fs');
// var Log = require('log');
// var Path = require('path');
// var HttpClient = require('scoped-http-client');
// var EventEmitter = require('events').EventEmitter;
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

// require('./adapter');
console.log('Hello webby!');

var WEBBY_DEFAULT_ADAPTERS = [
  'shell'
];

class Robot {
  constructor(adapterPath, adapter, httpd, name = 'Webby', alias = false) {

  }
}

module.exports = Robot;
