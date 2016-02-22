/* global describe, it, beforeEach, afterEach */
'use strict';
// Assertions and Stubbing
var chai = require('chai');
var sinon = require('sinon');
chai.use(require('sinon-chai'));
var expect = chai.expect;
var mockery = require('mockery');

var Robot = require('../src/robot');
var ref = require('../src/message');
var CatchAllMessage = ref.CatchAllMessage;
var EnterMessage = ref.EnterMessage;
var LeaveMessage = ref.LeaveMessage;
var TextMessage = ref.TextMessage;
var TopicMessage = ref.TopicMessage;
var Adapter = require('../src/adapter');

var ScopedHttpClient = require('scoped-http-client');

// Preload the Hubot mock adapter but substitute in the latest version of Adapter
mockery.enable();
mockery.registerAllowable('hubot-mock-adapter');
mockery.registerAllowable('lodash'); // hubot-mock-adapter uses lodash
// Force hubot-mock-adapter to use the latest version of Adapter
mockery.registerMock('hubot/src/adapter', Adapter);
// Load the mock adapter into the cache
require('hubot-mock-adapter');
// We're done with mockery
mockery.deregisterMock('hubot/src/adapter');
mockery.disable();

describe('Robot', function() {
  beforeEach(function() {
    this.robot = new Robot(null, 'mock-adapter', true, 'TestHubot');
    this.robot.alias = 'Hubot';
    this.robot.run;
    this.robot.on('error', function(name, err, response) {
      if ((err != null ? err.constructor : void 0) == null) {
        return;
      }
      if (err.constructor.name === 'AssertionError') {
        process.nextTick(function() {
          throw err;
        });
      }
    });
    this.user = this.robot.brain.userForId('1', {
      name: 'hubottester',
      room: '#mocha'
    });
  });

  afterEach(function() {
    this.robot.server.close();
    this.robot.shutdown();
  });

  describe('Unit Tests', function() {
    // describe('#http', function() {
    //   beforeEach(function() {
    //     var url = 'http://localhost';
    //     this.httpClient = this.robot.http(url);
    //   });
    //   it('creates a new ScopedHttpClient', function() {
    //     expect(this.httpClient).to.have.property('get');
    //     expect(this.httpClient).to.have.property('post');
    //   });
    //   it('passes options through to the ScopedHttpClient', function() {
    //     var agent, httpClient;
    //     agent = {};
    //     httpClient = this.robot.http('http://localhost', {
    //       agent: agent
    //     });
    //     expect(httpClient.options.agent).to.equal(agent);
    //   });
    //   it('sets a sane user agent', function() {
    //     expect(this.httpClient.options.headers['User-Agent']).to.contain('Webby');
    //   });
    //   it('merges in any global http options', function() {
    //     var agent, httpClient;
    //     agent = {};
    //     this.robot.globalHttpOptions = {
    //       agent: agent
    //     };
    //     httpClient = this.robot.http('http://localhost');
    //     expect(httpClient.options.agent).to.equal(agent);
    //   });
    //   it('local options override global http options', function() {
    //     var agentA, agentB, httpClient;
    //     agentA = {};
    //     agentB = {};
    //     this.robot.globalHttpOptions = {
    //       agent: agentA
    //     };
    //     httpClient = this.robot.http('http://localhost', {
    //       agent: agentB
    //     });
    //     expect(httpClient.options.agent).to.equal(agentB);
    //   });
    // });

    describe('#respondPattern', function() {
      it('matches messages starting with robot\'s name', function() {
        var match, pattern, testMessage, testRegex;
        testMessage = this.robot.name + 'message123';
        testRegex = /(.*)/;
        pattern = this.robot.respondPattern(testRegex);
        expect(testMessage).to.match(pattern);
        match = testMessage.match(pattern)[1];
        expect(match).to.equal('message123');
      });
      it('matches messages starting with robot\'s alias', function() {
        var match, pattern, testMessage, testRegex;
        testMessage = this.robot.alias + 'message123';
        testRegex = /(.*)/;
        pattern = this.robot.respondPattern(testRegex);
        expect(testMessage).to.match(pattern);
        match = testMessage.match(pattern)[1];
        expect(match).to.equal('message123');
      });
      it('does not match unaddressed messages', function() {
        var pattern, testMessage, testRegex;
        testMessage = 'message123';
        testRegex = /(.*)/;
        pattern = this.robot.respondPattern(testRegex);
        expect(testMessage).to.not.match(pattern);
      });
      it('matches properly when name is substring of alias', function() {
        var match1, match2, pattern, testMessage1, testMessage2, testRegex;
        this.robot.name = 'Meg';
        this.robot.alias = 'Megan';
        testMessage1 = this.robot.name + ' message123';
        testMessage2 = this.robot.alias + ' message123';
        testRegex = /(.*)/;
        pattern = this.robot.respondPattern(testRegex);
        expect(testMessage1).to.match(pattern);
        match1 = testMessage1.match(pattern)[1];
        expect(match1).to.equal('message123');
        expect(testMessage2).to.match(pattern);
        match2 = testMessage2.match(pattern)[1];
        expect(match2).to.equal('message123');
      });
      it('matches properly when alias is substring of name', function() {
        var match1, match2, pattern, testMessage1, testMessage2, testRegex;
        this.robot.name = 'Megan';
        this.robot.alias = 'Meg';
        testMessage1 = this.robot.name + ' message123';
        testMessage2 = this.robot.alias + ' message123';
        testRegex = /(.*)/;
        pattern = this.robot.respondPattern(testRegex);
        expect(testMessage1).to.match(pattern);
        match1 = testMessage1.match(pattern)[1];
        expect(match1).to.equal('message123');
        expect(testMessage2).to.match(pattern);
        match2 = testMessage2.match(pattern)[1];
        expect(match2).to.equal('message123');
      });
    });

    describe('#respondPattern', function() {
      it('matches messages starting with robot\'s name', function() {
        var match, pattern, testMessage, testRegex;
        testMessage = this.robot.name + 'message123';
        testRegex = /(.*)/;
        pattern = this.robot.respondPattern(testRegex);
        expect(testMessage).to.match(pattern);
        match = testMessage.match(pattern)[1];
        expect(match).to.equal('message123');
      });
      it('matches messages starting with robot\'s alias', function() {
        var match, pattern, testMessage, testRegex;
        testMessage = this.robot.alias + 'message123';
        testRegex = /(.*)/;
        pattern = this.robot.respondPattern(testRegex);
        expect(testMessage).to.match(pattern);
        match = testMessage.match(pattern)[1];
        expect(match).to.equal('message123');
      });
      it('does not match unaddressed messages', function() {
        var pattern, testMessage, testRegex;
        testMessage = 'message123';
        testRegex = /(.*)/;
        pattern = this.robot.respondPattern(testRegex);
        expect(testMessage).to.not.match(pattern);
      });
      it('matches properly when name is substring of alias', function() {
        var match1, match2, pattern, testMessage1, testMessage2, testRegex;
        this.robot.name = 'Meg';
        this.robot.alias = 'Megan';
        testMessage1 = this.robot.name + ' message123';
        testMessage2 = this.robot.alias + ' message123';
        testRegex = /(.*)/;
        pattern = this.robot.respondPattern(testRegex);
        expect(testMessage1).to.match(pattern);
        match1 = testMessage1.match(pattern)[1];
        expect(match1).to.equal('message123');
        expect(testMessage2).to.match(pattern);
        match2 = testMessage2.match(pattern)[1];
        expect(match2).to.equal('message123');
      });
      it('matches properly when alias is substring of name', function() {
        var match1, match2, pattern, testMessage1, testMessage2, testRegex;
        this.robot.name = 'Megan';
        this.robot.alias = 'Meg';
        testMessage1 = this.robot.name + ' message123';
        testMessage2 = this.robot.alias + ' message123';
        testRegex = /(.*)/;
        pattern = this.robot.respondPattern(testRegex);
        expect(testMessage1).to.match(pattern);
        match1 = testMessage1.match(pattern)[1];
        expect(match1).to.equal('message123');
        expect(testMessage2).to.match(pattern);
        match2 = testMessage2.match(pattern)[1];
        expect(match2).to.equal('message123');
      });
    });

    // describe('#listen', function() {
    //   it('registers a new listener directly', function() {
    //     expect(this.robot.listeners).to.have.length(0);
    //     this.robot.listen((function() {}), function() {});
    //     expect(this.robot.listeners).to.have.length(1);
    //   });
    // });

    // describe('#hear', function() {
    //   it('registers a new listener directly', function() {
    //     expect(this.robot.listeners).to.have.length(0);
    //     this.robot.hear(/.*/, function() {});
    //     expect(this.robot.listeners).to.have.length(1);
    //   });
    // });

    // describe('#respond', function() {
    //   it('registers a new listener using hear', function() {
    //     sinon.spy(this.robot, 'hear');
    //     this.robot.respond(/.*/, function() {});
    //     expect(this.robot.hear).to.have.been.called;
    //   });
    // });

    // describe('#enter', function() {
    //   it('registers a new listener using listen', function() {
    //     sinon.spy(this.robot, 'listen');
    //     this.robot.enter(function() {});
    //     expect(this.robot.listen).to.have.been.called;
    //   });
    // });

    // describe('#leave', function() {
    //   it('registers a new listener using listen', function() {
    //     sinon.spy(this.robot, 'listen');
    //     this.robot.leave(function() {});
    //     expect(this.robot.listen).to.have.been.called;
    //   });
    // });

    // describe('#topic', function() {
    //   it('registers a new listener using listen', function() {
    //     sinon.spy(this.robot, 'listen');
    //     this.robot.topic(function() {});
    //     expect(this.robot.listen).to.have.been.called;
    //   });
    // });

    // describe('#catchAll', function() {
    //   it('registers a new listener using listen', function() {
    //     sinon.spy(this.robot, 'listen');
    //     this.robot.catchAll(function() {});
    //     expect(this.robot.listen).to.have.been.called;
    //   });
    // });

    // describe('#receive', function() {
    //   it('calls all registered listeners', function(done) {
    //     var listener, testMessage;
    //     testMessage = new TextMessage(this.user, 'message123');
    //     listener = {
    //       call: function(response, middleware, cb) {
    //         return cb();
    //       }
    //     };
    //     sinon.spy(listener, 'call');
    //     this.robot.listeners = [listener, listener, listener, listener];
    //     this.robot.receive(testMessage, function() {
    //       expect(listener.call).to.have.callCount(8);
    //       return done();
    //     });
    //   });
    //   it('sends a CatchAllMessage if no listener matches', function(done) {
    //     var oldReceive, testMessage;
    //     testMessage = new TextMessage(this.user, 'message123');
    //     this.robot.listeners = [];
    //     oldReceive = this.robot.receive;
    //     this.robot.receive = function(message, cb) {
    //       expect(message).to.be["instanceof"](CatchAllMessage);
    //       expect(message.message).to.be.equal(testMessage);
    //       return cb();
    //     };
    //     sinon.spy(this.robot, 'receive');
    //     return oldReceive.call(this.robot, testMessage, (function(_this) {
    //       return function() {
    //         expect(_this.robot.receive).to.have.been.called;
    //         return done();
    //       };
    //     })(this));
    //   });
    //   it('does not trigger a CatchAllMessage if a listener matches', function(done) {
    //     var matchingListener, oldReceive, testMessage;
    //     testMessage = new TextMessage(this.user, 'message123');
    //     matchingListener = {
    //       call: function(message, middleware, cb) {
    //         return cb(true);
    //       }
    //     };
    //     oldReceive = this.robot.receive;
    //     this.robot.receive = sinon.spy();
    //     this.robot.listeners = [matchingListener];
    //     oldReceive.call(this.robot, testMessage, done);
    //     expect(this.robot.receive).to.not.have.been.called;
    //   });
    //   it('stops processing if a listener marks the message as done', function(done) {
    //     var listenerSpy, matchingListener, testMessage;
    //     testMessage = new TextMessage(this.user, 'message123');
    //     matchingListener = {
    //       call: function(message, middleware, cb) {
    //         message.done = true;
    //         return cb(true);
    //       }
    //     };
    //     listenerSpy = {
    //       call: sinon.spy()
    //     };
    //     this.robot.listeners = [matchingListener, listenerSpy];
    //     return this.robot.receive(testMessage, function() {
    //       expect(listenerSpy.call).to.not.have.been.called;
    //       done();
    //     });
    //   });
    //   it('gracefully handles listener uncaughtExceptions (move on to next listener)', function(done) {
    //     var badListener, goodListener, goodListenerCalled, testMessage, theError;
    //     testMessage = {};
    //     theError = new Error();
    //     badListener = {
    //       call: function() {
    //         throw theError;
    //       }
    //     };
    //     goodListenerCalled = false;
    //     goodListener = {
    //       call: function(_, middleware, cb) {
    //         goodListenerCalled = true;
    //         return cb(true);
    //       }
    //     };
    //     this.robot.listeners = [badListener, goodListener];
    //     this.robot.emit = function(name, err, response) {
    //       expect(name).to.equal('error');
    //       expect(err).to.equal(theError);
    //       return expect(response.message).to.equal(testMessage);
    //     };
    //     sinon.spy(this.robot, 'emit');
    //     return this.robot.receive(testMessage, (function(_this) {
    //       return function() {
    //         expect(_this.robot.emit).to.have.been.called;
    //         expect(goodListenerCalled).to.be.ok;
    //         done();
    //       };
    //     })(this));
    //   });
    //   it('executes the callback after the function returns when there are no listeners', function(done) {
    //     var finished, testMessage;
    //     testMessage = new TextMessage(this.user, 'message123');
    //     finished = false;
    //     this.robot.receive(testMessage, function() {
    //       expect(finished).to.be.ok;
    //       done();
    //     });
    //     return finished = true;
    //   });
    // });

    // describe('Listener Registration', function() {
    //   describe('#listen', function() {
    //     it('forwards the matcher, options, and callback to Listener', function() {
    //       var callback, matcher, options, testListener;
    //       callback = sinon.spy();
    //       matcher = sinon.spy();
    //       options = {};
    //       this.robot.listen(matcher, options, callback);
    //       testListener = this.robot.listeners[0];
    //       expect(testListener.matcher).to.equal(matcher);
    //       expect(testListener.callback).to.equal(callback);
    //       expect(testListener.options).to.equal(options);
    //     });
    //   });
    //   describe('#hear', function() {
    //     it('matches TextMessages', function() {
    //       var callback, result, testListener, testMessage, testRegex;
    //       callback = sinon.spy();
    //       testMessage = new TextMessage(this.user, 'message123');
    //       testRegex = /^message123$/;
    //       this.robot.hear(testRegex, callback);
    //       testListener = this.robot.listeners[0];
    //       result = testListener.matcher(testMessage);
    //       expect(result).to.be.ok;
    //     });
    //     it('does not match EnterMessages', function() {
    //       var callback, result, testListener, testMessage, testRegex;
    //       callback = sinon.spy();
    //       testMessage = new EnterMessage(this.user);
    //       testRegex = /.*/;
    //       this.robot.hear(testRegex, callback);
    //       testListener = this.robot.listeners[0];
    //       result = testListener.matcher(testMessage);
    //       expect(result).to.not.be.ok;
    //     });
    //   });
    //   describe('#respond', function() {
    //     it('matches TextMessages addressed to the robot', function() {
    //       var callback, result, testListener, testMessage, testRegex;
    //       callback = sinon.spy();
    //       testMessage = new TextMessage(this.user, 'TestHubot message123');
    //       testRegex = /message123$/;
    //       this.robot.respond(testRegex, callback);
    //       testListener = this.robot.listeners[0];
    //       result = testListener.matcher(testMessage);
    //       expect(result).to.be.ok;
    //     });
    //     it('does not match EnterMessages', function() {
    //       var callback, result, testListener, testMessage, testRegex;
    //       callback = sinon.spy();
    //       testMessage = new EnterMessage(this.user);
    //       testRegex = /.*/;
    //       this.robot.respond(testRegex, callback);
    //       testListener = this.robot.listeners[0];
    //       result = testListener.matcher(testMessage);
    //       expect(result).to.not.be.ok;
    //     });
    //   });
    //   describe('#enter', function() {
    //     it('matches EnterMessages', function() {
    //       var callback, result, testListener, testMessage;
    //       callback = sinon.spy();
    //       testMessage = new EnterMessage(this.user);
    //       this.robot.enter(callback);
    //       testListener = this.robot.listeners[0];
    //       result = testListener.matcher(testMessage);
    //       expect(result).to.be.ok;
    //     });
    //     it('does not match TextMessages', function() {
    //       var callback, result, testListener, testMessage;
    //       callback = sinon.spy();
    //       testMessage = new TextMessage(this.user, 'message123');
    //       this.robot.enter(callback);
    //       testListener = this.robot.listeners[0];
    //       result = testListener.matcher(testMessage);
    //       expect(result).to.not.be.ok;
    //     });
    //   });
    //   describe('#leave', function() {
    //     it('matches LeaveMessages', function() {
    //       var callback, result, testListener, testMessage;
    //       callback = sinon.spy();
    //       testMessage = new LeaveMessage(this.user);
    //       this.robot.leave(callback);
    //       testListener = this.robot.listeners[0];
    //       result = testListener.matcher(testMessage);
    //       expect(result).to.be.ok;
    //     });
    //     it('does not match TextMessages', function() {
    //       var callback, result, testListener, testMessage;
    //       callback = sinon.spy();
    //       testMessage = new TextMessage(this.user, 'message123');
    //       this.robot.leave(callback);
    //       testListener = this.robot.listeners[0];
    //       result = testListener.matcher(testMessage);
    //       expect(result).to.not.be.ok;
    //     });
    //   });
    //   describe('#topic', function() {
    //     it('matches TopicMessages', function() {
    //       var callback, result, testListener, testMessage;
    //       callback = sinon.spy();
    //       testMessage = new TopicMessage(this.user);
    //       this.robot.topic(callback);
    //       testListener = this.robot.listeners[0];
    //       result = testListener.matcher(testMessage);
    //       expect(result).to.be.ok;
    //     });
    //     it('does not match TextMessages', function() {
    //       var callback, result, testListener, testMessage;
    //       callback = sinon.spy();
    //       testMessage = new TextMessage(this.user, 'message123');
    //       this.robot.topic(callback);
    //       testListener = this.robot.listeners[0];
    //       result = testListener.matcher(testMessage);
    //       expect(result).to.not.be.ok;
    //     });
    //   });
    //   describe('#catchAll', function() {
    //     it('matches CatchAllMessages', function() {
    //       var callback, result, testListener, testMessage;
    //       callback = sinon.spy();
    //       testMessage = new CatchAllMessage(new TextMessage(this.user, 'message123'));
    //       this.robot.catchAll(callback);
    //       testListener = this.robot.listeners[0];
    //       result = testListener.matcher(testMessage);
    //       expect(result).to.be.ok;
    //     });
    //     it('does not match TextMessages', function() {
    //       var callback, result, testListener, testMessage;
    //       callback = sinon.spy();
    //       testMessage = new TextMessage(this.user, 'message123');
    //       this.robot.catchAll(callback);
    //       testListener = this.robot.listeners[0];
    //       result = testListener.matcher(testMessage);
    //       expect(result).to.not.be.ok;
    //     });
    //   });
    // });

    // describe('Message Processing', function() {
    //   it('calls a matching listener', function(done) {
    //     var testMessage;
    //     testMessage = new TextMessage(this.user, 'message123');
    //     this.robot.hear(/^message123$/, function(response) {
    //       expect(response.message).to.equal(testMessage);
    //       done();
    //     });
    //     return this.robot.receive(testMessage);
    //   });
    //   it('calls multiple matching listeners', function(done) {
    //     var listenerCallback, listenersCalled, testMessage;
    //     testMessage = new TextMessage(this.user, 'message123');
    //     listenersCalled = 0;
    //     listenerCallback = function(response) {
    //       expect(response.message).to.equal(testMessage);
    //       return listenersCalled++;
    //     };
    //     this.robot.hear(/^message123$/, listenerCallback);
    //     this.robot.hear(/^message123$/, listenerCallback);
    //     return this.robot.receive(testMessage, function() {
    //       expect(listenersCalled).to.equal(2);
    //       return done();
    //     });
    //   });
    //   it('calls the catch-all listener if no listeners match', function(done) {
    //     var listenerCallback, testMessage;
    //     testMessage = new TextMessage(this.user, 'message123');
    //     listenerCallback = sinon.spy();
    //     this.robot.hear(/^no-matches$/, listenerCallback);
    //     this.robot.catchAll(function(response) {
    //       expect(listenerCallback).to.not.have.been.called;
    //       expect(response.message).to.equal(testMessage);
    //       return done();
    //     });
    //     return this.robot.receive(testMessage);
    //   });
    //   it('does not call the catch-all listener if any listener matched', function(done) {
    //     var catchAllCallback, listenerCallback, testMessage;
    //     testMessage = new TextMessage(this.user, 'message123');
    //     listenerCallback = sinon.spy();
    //     this.robot.hear(/^message123$/, listenerCallback);
    //     catchAllCallback = sinon.spy();
    //     this.robot.catchAll(catchAllCallback);
    //     return this.robot.receive(testMessage, function() {
    //       expect(listenerCallback).to.have.been.called.once;
    //       expect(catchAllCallback).to.not.have.been.called;
    //       return done();
    //     });
    //   });
    //   it('stops processing if message.finish() is called synchronously', function(done) {
    //     var listenerCallback, testMessage;
    //     testMessage = new TextMessage(this.user, 'message123');
    //     this.robot.hear(/^message123$/, function(response) {
    //       return response.message.finish();
    //     });
    //     listenerCallback = sinon.spy();
    //     this.robot.hear(/^message123$/, listenerCallback);
    //     return this.robot.receive(testMessage, function() {
    //       expect(listenerCallback).to.not.have.been.called;
    //       return done();
    //     });
    //   });
    //   it('calls non-TextListener objects', function(done) {
    //     var testMessage;
    //     testMessage = new EnterMessage(this.user);
    //     this.robot.enter(function(response) {
    //       expect(response.message).to.equal(testMessage);
    //       return done();
    //     });
    //     return this.robot.receive(testMessage);
    //   });
    //   it('gracefully handles listener uncaughtExceptions (move on to next listener)', function(done) {
    //     var badListener, goodListener, goodListenerCalled, ref, testMessage, theError;
    //     testMessage = new TextMessage(this.user, 'message123');
    //     theError = new Error();
    //     this.robot.hear(/^message123$/, function() {
    //       throw theError;
    //     });
    //     goodListenerCalled = false;
    //     this.robot.hear(/^message123$/, function() {
    //       return goodListenerCalled = true;
    //     });
    //     ref = this.robot.listeners, badListener = ref[0], goodListener = ref[1];
    //     this.robot.emit = function(name, err, response) {
    //       expect(name).to.equal('error');
    //       expect(err).to.equal(theError);
    //       return expect(response.message).to.equal(testMessage);
    //     };
    //     sinon.spy(this.robot, 'emit');
    //     return this.robot.receive(testMessage, (function(_this) {
    //       return function() {
    //         expect(_this.robot.emit).to.have.been.called;
    //         expect(goodListenerCalled).to.be.ok;
    //         return done();
    //       };
    //     })(this));
    //   });
    //   describe('Listener Middleware', function() {
    //     it('allows listener callback execution', function(testDone) {
    //       var listenerCallback, testMessage;
    //       listenerCallback = sinon.spy();
    //       this.robot.hear(/^message123$/, listenerCallback);
    //       this.robot.listenerMiddleware(function(context, next, done) {
    //         return next(done);
    //       });
    //       testMessage = new TextMessage(this.user, 'message123');
    //       return this.robot.receive(testMessage, function() {
    //         expect(listenerCallback).to.have.been.called;
    //         return testDone();
    //       });
    //     });
    //     it('can block listener callback execution', function(testDone) {
    //       var listenerCallback, testMessage;
    //       listenerCallback = sinon.spy();
    //       this.robot.hear(/^message123$/, listenerCallback);
    //       this.robot.listenerMiddleware(function(context, next, done) {
    //         return done();
    //       });
    //       testMessage = new TextMessage(this.user, 'message123');
    //       return this.robot.receive(testMessage, function() {
    //         expect(listenerCallback).to.not.have.been.called;
    //         return testDone();
    //       });
    //     });
    //     it('receives the correct arguments', function(testDone) {
    //       var testListener, testMessage;
    //       this.robot.hear(/^message123$/, function() {});
    //       testListener = this.robot.listeners[0];
    //       testMessage = new TextMessage(this.user, 'message123');
    //       this.robot.listenerMiddleware((function(_this) {
    //         return function(context, next, done) {
    //           return process.nextTick(function() {
    //             expect(context.listener).to.equal(testListener);
    //             expect(context.response.message).to.equal(testMessage);
    //             expect(next).to.be.a('function');
    //             expect(done).to.be.a('function');
    //             return testDone();
    //           });
    //         };
    //       })(this));
    //       return this.robot.receive(testMessage);
    //     });
    //     return it('executes middleware in order of definition', function(testDone) {
    //       var execution, testMessage, testMiddlewareA, testMiddlewareB;
    //       execution = [];
    //       testMiddlewareA = function(context, next, done) {
    //         execution.push('middlewareA');
    //         return next(function() {
    //           execution.push('doneA');
    //           return done();
    //         });
    //       };
    //       testMiddlewareB = function(context, next, done) {
    //         execution.push('middlewareB');
    //         return next(function() {
    //           execution.push('doneB');
    //           return done();
    //         });
    //       };
    //       this.robot.listenerMiddleware(testMiddlewareA);
    //       this.robot.listenerMiddleware(testMiddlewareB);
    //       this.robot.hear(/^message123$/, function() {
    //         return execution.push('listener');
    //       });
    //       testMessage = new TextMessage(this.user, 'message123');
    //       return this.robot.receive(testMessage, function() {
    //         expect(execution).to.deep.equal(['middlewareA', 'middlewareB', 'listener', 'doneB', 'doneA']);
    //         return testDone();
    //       });
    //     });
    //   });
    //   describe('Receive Middleware', function() {
    //     it('fires for all messages, including non-matching ones', function(testDone) {
    //       var listenerCallback, middlewareSpy, testMessage;
    //       middlewareSpy = sinon.spy();
    //       listenerCallback = sinon.spy();
    //       this.robot.hear(/^message123$/, listenerCallback);
    //       this.robot.receiveMiddleware(function(context, next, done) {
    //         middlewareSpy();
    //         return next(done);
    //       });
    //       testMessage = new TextMessage(this.user, 'not message 123');
    //       return this.robot.receive(testMessage, function() {
    //         expect(listenerCallback).to.not.have.been.called;
    //         expect(middlewareSpy).to.have.been.called;
    //         testDone();
    //       });
    //     });
    //     it('can block listener execution', function(testDone) {
    //       var listenerCallback, middlewareSpy, testMessage;
    //       middlewareSpy = sinon.spy();
    //       listenerCallback = sinon.spy();
    //       this.robot.hear(/^message123$/, listenerCallback);
    //       this.robot.receiveMiddleware(function(context, next, done) {
    //         middlewareSpy();
    //         done();
    //       });
    //       testMessage = new TextMessage(this.user, 'message123');
    //       return this.robot.receive(testMessage, function() {
    //         expect(listenerCallback).to.not.have.been.called;
    //         expect(middlewareSpy).to.have.been.called;
    //         testDone();
    //       });
    //     });
    //     it('receives the correct arguments', function(testDone) {
    //       var testMessage;
    //       this.robot.hear(/^message123$/, function() {});
    //       testMessage = new TextMessage(this.user, 'message123');
    //       this.robot.receiveMiddleware(function(context, next, done) {
    //         expect(context.response.message).to.equal(testMessage);
    //         expect(next).to.be.a('function');
    //         expect(done).to.be.a('function');
    //         testDone();
    //         return next(done);
    //       });
    //       return this.robot.receive(testMessage);
    //     });
    //     it('executes receive middleware in order of definition', function(testDone) {
    //       var execution, testMessage, testMiddlewareA, testMiddlewareB;
    //       execution = [];
    //       testMiddlewareA = function(context, next, done) {
    //         execution.push('middlewareA');
    //         return next(function() {
    //           execution.push('doneA');
    //           return done();
    //         });
    //       };
    //       testMiddlewareB = function(context, next, done) {
    //         execution.push('middlewareB');
    //         return next(function() {
    //           execution.push('doneB');
    //           return done();
    //         });
    //       };
    //       this.robot.receiveMiddleware(testMiddlewareA);
    //       this.robot.receiveMiddleware(testMiddlewareB);
    //       this.robot.hear(/^message123$/, function() {
    //         return execution.push('listener');
    //       });
    //       testMessage = new TextMessage(this.user, 'message123');
    //       return this.robot.receive(testMessage, function() {
    //         expect(execution).to.deep.equal(['middlewareA', 'middlewareB', 'listener', 'doneB', 'doneA']);
    //         return testDone();
    //       });
    //     });
    //     it('allows editing the message portion of the given response', function(testDone) {
    //       var execution, testCallback, testMessage, testMiddlewareA, testMiddlewareB;
    //       execution = [];
    //       testMiddlewareA = function(context, next, done) {
    //         context.response.message.text = 'foobar';
    //         return next();
    //       };
    //       testMiddlewareB = function(context, next, done) {
    //         expect(context.response.message.text).to.equal("foobar");
    //         return next();
    //       };
    //       this.robot.receiveMiddleware(testMiddlewareA);
    //       this.robot.receiveMiddleware(testMiddlewareB);
    //       testCallback = sinon.spy();
    //       this.robot.hear(/^foobar$/, testCallback);
    //       testMessage = new TextMessage(this.user, 'message123');
    //       return this.robot.receive(testMessage, function() {
    //         expect(testCallback).to.have.been.called;
    //         return testDone();
    //       });
    //     });
    //   });
    //   describe('Response Middleware', function() {
    //     it('executes response middleware in order', function(testDone) {
    //       var listenerCallback, sendSpy, testMessage;
    //       this.robot.adapter.send = sendSpy = sinon.spy();
    //       listenerCallback = sinon.spy();
    //       this.robot.hear(/^message123$/, function(response) {
    //         return response.send("foobar, sir, foobar.");
    //       });
    //       this.robot.responseMiddleware(function(context, next, done) {
    //         context.strings[0] = context.strings[0].replace(/foobar/g, "barfoo");
    //         return next();
    //       });
    //       this.robot.responseMiddleware(function(context, next, done) {
    //         context.strings[0] = context.strings[0].replace(/barfoo/g, "replaced bar-foo");
    //         return next();
    //       });
    //       testMessage = new TextMessage(this.user, 'message123');
    //       return this.robot.receive(testMessage, function() {
    //         expect(sendSpy.getCall(0).args[1]).to.equal('replaced bar-foo, sir, replaced bar-foo.');
    //         testDone();
    //       });
    //     });
    //     it('allows replacing outgoing strings', function(testDone) {
    //       var listenerCallback, sendSpy, testMessage;
    //       this.robot.adapter.send = sendSpy = sinon.spy();
    //       listenerCallback = sinon.spy();
    //       this.robot.hear(/^message123$/, function(response) {
    //         return response.send("foobar, sir, foobar.");
    //       });
    //       this.robot.responseMiddleware(function(context, next, done) {
    //         context.strings = ["whatever I want."];
    //         return next();
    //       });
    //       testMessage = new TextMessage(this.user, 'message123');
    //       return this.robot.receive(testMessage, function() {
    //         expect(sendSpy.getCall(0).args[1]).to.deep.equal("whatever I want.");
    //         testDone();
    //       });
    //     });
    //     it('marks plaintext as plaintext', function(testDone) {
    //       var listenerCallback, method, plaintext, sendSpy, testMessage;
    //       this.robot.adapter.send = sendSpy = sinon.spy();
    //       listenerCallback = sinon.spy();
    //       this.robot.hear(/^message123$/, function(response) {
    //         return response.send("foobar, sir, foobar.");
    //       });
    //       this.robot.hear(/^message456$/, function(response) {
    //         return response.play("good luck with that");
    //       });
    //       method = void 0;
    //       plaintext = void 0;
    //       this.robot.responseMiddleware(function(context, next, done) {
    //         method = context.method;
    //         plaintext = context.plaintext;
    //         return next(done);
    //       });
    //       testMessage = new TextMessage(this.user, 'message123');
    //       return this.robot.receive(testMessage, (function(_this) {
    //         return function() {
    //           var testMessage2;
    //           expect(plaintext).to.equal(true);
    //           expect(method).to.equal("send");
    //           testMessage2 = new TextMessage(_this.user, 'message456');
    //           return _this.robot.receive(testMessage2, function() {
    //             expect(plaintext).to.equal(void 0);
    //             expect(method).to.equal("play");
    //             return testDone();
    //           });
    //         };
    //       })(this));
    //     });
    //     it('does not send trailing functions to middleware', function(testDone) {
    //       var asserted, postSendCallback, sendSpy, testMessage;
    //       this.robot.adapter.send = sendSpy = sinon.spy();
    //       asserted = false;
    //       postSendCallback = function() {};
    //       this.robot.hear(/^message123$/, function(response) {
    //         return response.send("foobar, sir, foobar.", postSendCallback);
    //       });
    //       this.robot.responseMiddleware(function(context, next, done) {
    //         expect(context.strings).to.deep.equal(["foobar, sir, foobar."]);
    //         expect(context.method).to.equal("send");
    //         asserted = true;
    //         return next();
    //       });
    //       testMessage = new TextMessage(this.user, 'message123');
    //       return this.robot.receive(testMessage, function() {
    //         expect(asserted).to.equal(true);
    //         expect(sendSpy.getCall(0).args[1]).to.equal('foobar, sir, foobar.');
    //         expect(sendSpy.getCall(0).args[2]).to.equal(postSendCallback);
    //         testDone();
    //       });
    //     });
    //   });
    // });
  });
});
