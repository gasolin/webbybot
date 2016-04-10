import * as Fs from 'fs';
import Log from 'log';
import * as Path from 'path';
import * as HttpClient from 'scoped-http-client';
import {EventEmitter} from 'events';
import * as async from 'async';
// support load coffee script plugins
import 'coffee-script/register';

import User from './user';
import Brain from './brain';
import Response from './response';
import {Listener, TextListener} from './listener';
import {EnterMessage, LeaveMessage, TopicMessage, CatchAllMessage}
  from './message';
import Middleware from './middleware';
import {ExpressRouter, NullRouter} from './router';

const WEBBY_DEFAULT_ADAPTERS = [
  'shell'
];

const WEBBY_DOCUMENTATION_SECTIONS = [
  'description',
  'dependencies',
  'configuration',
  'commands',
  'notes',
  'author',
  'authors',
  'examples',
  'tags',
  'urls'
];

class Robot {
  /**
   * Robots receive messages from a chat source (Campfire, irc, etc), and
   * dispatch them to matching listeners.
   *
   * @param {string} adapterPath -  A String of the path to built-in adapters
   *                                (defaults to src/adapters)
   * @param {string} adapter     - A String of the adapter name.
   * @param {boolean} httpd      - A Boolean whether to enable the HTTP daemon.
   * @param {string} name        - A String of the robot name,
   *                                defaults to Webby.
   *
   * Returns nothing.
   */
  constructor(adapterPath, adapterName, httpd, name = 'webby', alias = false) {
    if (this.adapterPath === undefined) {
      this.adapterPath = Path.join(__dirname, 'adapters');
    }
    this.name = name;
    this.events = new EventEmitter;
    this.brain = new Brain(this);
    this.alias = alias;
    this.adapter = null;
    this.Response = Response;
    this.commands = [];
    this.listeners = [];
    this.middleware = {
      listener: new Middleware(this),
      response: new Middleware(this),
      receive: new Middleware(this)
    };
    this.logger = new Log(process.env.WEBBY_LOG_LEVEL || 'info');
    this.pingIntervalId = null;
    this.globalHttpOptions = {};
    this.parseVersion();
    if (httpd) {
      new ExpressRouter(this);
    } else {
      new NullRouter(this);
    }
    this.adapterName = adapterName;
    this.loadAdapter(adapterName);

    this.errorHandlers = [];
    this.on('error', (err, res) => {
      this.invokeErrorHandlers(err, res);
    });
    this.onUncaughtException = (err) => {
      this.emit('error', err);
    };
    process.on('uncaughtException', this.onUncaughtException);
  }

  /**
   * Public: Adds a custom Listener with the provided matcher, options, and
   * callback
   *
   * @param matcher  - A Function that determines whether to call the callback.
   *            Expected to return a truthy value if the callback should be
   *            executed.
   * @param {object} options  - An Object of additional parameters keyed on
   *                             extension name (optional).
   * @param callback - A Function that is called with a Response object if the
   *            matcher function returns true.
   *
   * Returns nothing.
   */
  listen(matcher, options, callback) {
    this.listeners.push(new Listener(this, matcher, options, callback));
  }

  /**
   * Public: Adds a Listener that attempts to match incoming messages based on
   * a Regex.
   *
   * @param {string} regex - A Regex that determines if the callback should be
   *                          called.
   * @param {object} options  - An Object of additional parameters keyed on
   *                             extension name (optional).
   * @param callback - A Function that is called with a Response object.
   *
   * Returns nothing.
   */
  hear(regex, options, callback) {
    this.listeners.push(new TextListener(this, regex, options, callback));
  }

  /**
   * Public: Adds a Listener that attempts to match incoming messages directed
   * at the robot based on a Regex. All regexes treat patterns like they begin
   * with a '^'
   *
   * @param {string} regex - A Regex that determines if the callback
   *                          should be called.
   * @param {object} options - An Object of additional parameters keyed on
   *                            extension name (optional).
   * @param callback - A Function that is called with a Response object.
   *
   * Returns nothing.
   */
  respond(regex, options, callback) {
    this.hear(this.respondPattern(regex), options, callback);
  }

  /**
   * Public: Build a regular expression that matches messages addressed
   * directly to the robot
   *
   * @param {string} regex - A RegExp for the message part that follows the
   *                          robot's name/alias
   *
   * Returns RegExp.
   */
  respondPattern(regex) {
    let re = regex.toString().split('/');
    re.shift();
    let modifiers = re.pop();
    if (re[0] && re[0][0] === '^') {
      this.logger.warning('Anchors don\'t work well with respond, ' +
                          'perhaps you want to use \'hear\'');
      this.logger.warning('The regex in question was ' + regex.toString());
    }
    let pattern = re.join('/');
    let name = this.name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    let newRegex;
    if (this.alias) {
      let alias = this.alias.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      let ref = name.length > alias.length ?
        [name, alias] : [alias, name], a = ref[0], b = ref[1];
      newRegex = new RegExp('^\\s*[@]?(?:' + a + '[:,]?|' + b +
        '[:,]?)\\s*(?:' + pattern + ')', modifiers);
    } else {
      newRegex = new RegExp('^\\s*[@]?' + name + '[:,]?\\s*(?:' + pattern + ')',
        modifiers);
    }
    return newRegex;
  }

  /**
   * Public: Adds a Listener that triggers when anyone enters the room.
   *
   * @param {object} options  - An Object of additional parameters keyed on
   *                             extension name (optional).
   * @param callback - A Function that is called with a Response object.
   *
   * Returns nothing.
   */
  enter(options, callback) {
    this.listen(msg => msg instanceof EnterMessage, options, callback);
  }

  /**
   * Public: Adds a Listener that triggers when anyone leaves the room.
   *
   * @param {object} options  - An Object of additional parameters keyed on
   *                             extension name (optional).
   * @param callback - A Function that is called with a Response object.
   *
   * Returns nothing.
   */
  leave(options, callback) {
    this.listen(msg => msg instanceof LeaveMessage, options, callback);
  }

  /**
   * Public: Adds a Listener that triggers when anyone changes the topic.
   *
   * @param {object} options  - An Object of additional parameters keyed on
   *                             extension name (optional).
   * @param callback - A Function that is called with a Response object.
   *
   * Returns nothing.
   */
  topic(options, callback) {
    this.listen(msg => msg instanceof TopicMessage, options, callback);
  }

  /**
   * Public: Adds an error handler when an uncaught exception or user emitted
   * error event occurs.
   *
   * @param callback - A Function that is called with the error object.
   *
   * Returns nothing.
   */
  error(callback) {
    this.errorHandlers.push(callback);
  }

  /**
   * Calls and passes any registered error handlers for unhandled exceptions or
   * user emitted error events.
   *
   * @param {object} err - An Error object.
   * @param {object} res - An optional Response object that generated the error
   *
   * Returns nothing.
   */
  invokeErrorHandlers(err, res) {
    this.logger.error(err.stack);
    for (let errorHandler of this.errorHandlers) {
      try {
        errorHandler(err, res);
      } catch(error) {
        this.logger.error(`while invoking error handler:
          ${error}\n${error.stack}`);
      }
    }
  }

  /**
   * Public: Adds a Listener that triggers when no other text matchers match.
   *
   * @param {object} options  - An Object of additional parameters keyed on
   *                             extension name (optional).
   * @param callback - A Function that is called with a Response object.
   *
   * Returns nothing.
   */
  catchAll(options, callback) {
    if (callback == null) {
      callback = options;
      options = {};
    }
    this.listen(msg => msg instanceof CatchAllMessage, options, msg => {
      msg.message = msg.message.message;
      return callback(msg);
    });
  }

  /**
   * Public: Registers new middleware for execution after matching but before
   * Listener callbacks
   *
   * @param middleware - A function that determines whether or not a given
   *         matching Listener should be executed.
   *         The function is called with (context, next, done).
   *         If execution should continue (next middleware, Listener callback),
   *         the middleware should call the 'next' function with 'done' as an
   *         argument.
   *         If not, the middleware should call the 'done' function with
   *         no arguments.
   *
   * Returns nothing.
   */
  listenerMiddleware(middleware) {
    this.middleware.listener.register(middleware);
  }

  /**
   * Public: Registers new middleware for execution as a response to any
   * message is being sent.
   *
   * @param middleware - A function that examines an outgoing message and can
   *         modify it or prevent its sending. The function is called with
   *         (context, next, done). If execution should continue,
   *         the middleware should call next(done). If execution should stop,
   *         the middleware should call done(). To modify the outgoing message,
   *         set context.string to a new message.
   *
   * Returns nothing.
   */
  responseMiddleware(middleware) {
    this.middleware.response.register(middleware);
  }

  /**
   * Public: Registers new middleware for execution before matching
   *
   * @param middleware - A function that determines whether or not listeners
   *         should be checked.
   *         The function is called with (context, next, done).
   *         If ext, next, done). If execution should continue to the next
   *         middleware or matching phase, it should call the 'next'
   *         function with 'done' as an argument. If not, the middleware
   *         should call the 'done' function with no arguments.
   *
   * Returns nothing.
   */
  receiveMiddleware(middleware) {
    this.middleware.receive.register(middleware);
  }

  /**
   * Public: Passes the given message to any interested Listeners after running
   *         receive middleware.
   *
   * @param {object} message - A Message instance. Listeners can flag this
   *              message as 'done' to prevent further execution.
   *
   * @param cb - Optional callback that is called when message processing
   *              is complete
   *
   * Returns nothing.
   * Returns before executing callback
   */
  receive(message, cb) {
    // When everything is finished (down the middleware stack and back up),
    // pass control back to the robot
    this.middleware.receive.execute({
      response: new Response(this, message)
    }, this.processListeners.bind(this), cb);
  }

  /**
   * Private: Passes the given message to any interested Listeners.
   *
   * @param {object} context - A Message instance. Listeners can flag this
   *                            message as 'done' to prevent further execution.
   *
   * @param done - Optional callback that is called when message processing is
   *                complete
   *
   * Returns nothing.
   * Returns before executing callback
   */
  processListeners(context, done) {
    // Try executing all registered Listeners in order of registration
    // and return after message is done being processed
    let anyListenersExecuted = false;
    async.detectSeries(this.listeners, (listener, cb) => {
      try {
        listener.call(context.response.message, this.middleware.listener,
          function(listenerExecuted) {
            anyListenersExecuted = anyListenersExecuted || listenerExecuted;
            Middleware.ticker(function() {
              cb(context.response.message.done);
            });
          });
      } catch(error) {
        this.emit('error', error, new this.Response(
          this, context.response.message, []));
        cb(false);
      }
    }, () => {
      if (!(context.response.message instanceof CatchAllMessage) &&
        !anyListenersExecuted) {
        this.logger.debug('No listeners executed; falling back to catch-all');
        this.receive(new CatchAllMessage(context.response.message), done);
      } else {
        if (done != null) {
          process.nextTick(done);
        }
      }
    });
  }

  /**
   * Public: Loads a file in path.
   *
   * @param {string} path - A String path on the filesystem.
   * @param {string} file - A String filename in path on the filesystem.
   *
   * Returns nothing.
   */
  loadFile(path, file) {
    let ext = Path.extname(file);
    let fullPath = Path.join(path, Path.basename(file, ext));
    if (require.extensions[ext]) {
      let script;
      try {
        script = require(fullPath);
        if (typeof script === 'function') {
          script(this);
          this.parseHelp(Path.join(path, file));
        } else {
          this.logger.warning(`Expected ${fullPath}
             to assign a function to module.exports, got ${typeof script}`);
        }
      } catch (error) {
        this.logger.error(`Unable to load ${fullPath}: ${error.stack}`);
        process.exit(1);
      }
    }
  }

  /**
   * Public: Loads every script in the given path.
   *
   * @param {string} path - A String path on the filesystem.
   *
   * Returns nothing.
   */
  load(path) {
    this.logger.debug(`Loading scripts from ${path}`);
    if (Fs.existsSync(path)) {
      let ref = Fs.readdirSync(path).sort();
      for (let file of ref) {
        this.loadFile(path, file);
      }
    }
  }

  /**
   * Public: Load scripts specified in the `hubot-scripts.json` file.
   *
   * @param {string} path    - A String path to the hubot-scripts files.
   * @param {string[]} scripts - An Array of scripts to load.
   *
   * Returns nothing.
   */
  loadHubotScripts(path, scripts) {
    this.logger.debug(`Loading hubot-scripts from ${path}`);
    for (let script of scripts) {
      this.loadFile(path, script);
    }
  }

  /**
   * Public: Load scripts from packages specified in the
   * `external-scripts.json` file.
   *
   * @param {string[]} packages - An Array of packages containing hubot scripts to load.
   *
   * Returns nothing.
   */
  loadExternalScripts(packages) {
    this.logger.debug('Loading external-scripts from npm packages');
    try {
      if (packages instanceof Array) {
        for (let pkg of packages) {
          require(pkg)(this);
        }
      } else {
        for (let pkg of packages) {
          require(pkg)(this, packages[pkg]);
        }
      }
    } catch(error) {
      this.logger.error(
        `Error loading scripts from npm package - ${error.stack}`);
      process.exit(1);
    }
  }

  /**
   * Load the adapter Hubot is going to use.
   *
   * @param {string} path    - A String of the path to adapter if local.
   * @param {string} adapter - A String of the adapter name to use.
   *
   * Returns nothing.
   */
  loadAdapter(adapterName) {
    this.logger.debug(`Loading adapter ${adapterName}`);
    try {
      // require('./adapters/shell');
      let path = WEBBY_DEFAULT_ADAPTERS.indexOf(adapterName) >= 0 ?
        this.adapterPath + '/' + adapterName : 'hubot-' + adapterName;
      this.adapter = require(path).use(this);
    } catch (error) {
      this.logger.error(`Cannot load adapter ${adapterName} - ${error}`);
      process.exit(1);
    }
  }

  /**
   * Public: Help Commands for Running Scripts.
   *
   * Returns an Array of help commands for running scripts.
   */
  helpCommands() {
    return this.commands.sort();
  }

  /**
   * Private: load help info from a loaded script.
   *
   * @param {string} path - A String path to the file on disk.
   *
   * Returns nothing.
   */
  parseHelp(path) {
    this.logger.debug(`Parsing help for ${path}`);
    let scriptName = Path.basename(path).replace(/\.(coffee|js)$/, '');
    let scriptDocumentation = {};
    let body = Fs.readFileSync(path, 'utf-8');
    let line, cleanedLine, currentSection, nextSection;
    let ref = body.split('\n');
    for (let line of ref) {
      if (!(line[0] === '#' || line.substr(0, 2) === '//')) {
        break;
      }
      cleanedLine = line.replace(/^(#|\/\/)\s?/, '').trim();
      if (cleanedLine.length === 0) {
        continue;
      }
      if (cleanedLine.toLowerCase() === 'none') {
        continue;
      }
      nextSection = cleanedLine.toLowerCase().replace(':', '');
      if (WEBBY_DOCUMENTATION_SECTIONS.indexOf(nextSection) >= 0) {
        currentSection = nextSection;
        scriptDocumentation[currentSection] = [];
      } else {
        if (currentSection) {
          scriptDocumentation[currentSection].push(cleanedLine.trim());
          if (currentSection === 'commands') {
            this.commands.push(cleanedLine.trim());
          }
        }
      }
    }
  }

  /**
   * Public: A helper send function which delegates to the adapter's send
   * function.
   *
   * @param {object} envelope   - A Object with message, room and user details.
   * @param {...string} strings - One or more Strings for each message to send.
   *
   * Returns nothing.
   */
  send(envelope, ...strings) {
    this.adapter.send(envelope, ...strings);
  }

  /**
   * Public: A helper reply function which delegates to the adapter's reply
   * function.
   *
   * @param {object} envelope   - A Object with message, room and user details.
   * @param {...string} strings - One or more Strings for each message to send.
   *
   * Returns nothing.
   */
  reply(envelope, ...strings) {
    this.adapter.reply(envelope, ...strings);
  }

  /**
   * Public: A helper send function to message a room that the robot is in.
   *
   * @param {string} room    - String designating the room to message.
   * @param {...string} strings - One or more Strings for each message to send.
   *
   * Returns nothing.
   */
  messageRoom(room, ...strings) {
    let envelope = {room: room};
    this.adapter.send(envelope, ...strings);
  }

  /**
   * Public: A wrapper around the EventEmitter API to make usage
   * semantically better.
   *
   * @param {string} event    - The event name.
   * @param {object} listener - A Function that is called with the
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
   * @param {string} event   - The event name.
   * @param {string[]} args... - Arguments emitted by the event
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

  /**
   * Public: Gracefully shutdown the robot process
   *
   * Returns nothing.
   */
  shutdown() {
    if (this.pingIntervalId != null) {
      clearInterval(this.pingIntervalId);
    }
    process.removeListener('uncaughtException', this.onUncaughtException);
    this.adapter.close();
    this.brain.close();
  }

  /**
   * Public: The version of Webby from npm
   *
   * Returns a String of the version number.
   */
  parseVersion() {
    let pkg = require(Path.join(__dirname, '..', 'package.json'));
    this.version = pkg.version;
  }

  /**
   * Public: Creates a scoped http client with chainable methods for
   * modifying the request. This doesn't actually make a request though.
   * Once your request is assembled, you can call `get()`/`post()`/etc to
   * send the request.
   *
   * @param {string} url - String URL to access.
   * @param {object[]} options - Optional options to pass on to the client
   *
   * Examples:
   *
   *     robot.http("http://example.com")
   *       # set a single header
   *       .header('Authorization', 'bearer abcdef')
   *
   *       # set multiple headers
   *       .headers(Authorization: 'bearer abcdef', Accept: 'application/json')
   *
   *       # add URI query parameters
   *       .query(a: 1, b: 'foo & bar')
   *
   *       # make the actual request
   *       .get() (err, res, body) ->
   *         console.log body
   *
   *       # or, you can POST data
   *       .post(data) (err, res, body) ->
   *         console.log body
   *
   *    # Can also set options
   *    robot.http("https://example.com", {rejectUnauthorized: false})
   *
   * Returns a ScopedClient instance.
   */
  http(url, options) {
    return HttpClient.create(url, this.extend({}, this.globalHttpOptions,
      options)).header('User-Agent', 'Webby/' + this.version);
  }

  /**
   * Private: Extend obj with objects passed as additional args.
   *
   * Returns the original object with updated changes.
   */
  extend(obj, ...sources) {
    for (let source of sources) {
      Object.assign(obj, source);
    }
    return obj;
  }
}

export default Robot;
