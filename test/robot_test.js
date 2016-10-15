/* eslint-env node, mocha */
// Assertions and Stubbing
import * as sinon from 'sinon';
import * as chai from 'chai';
import sinonChai from 'sinon-chai';
chai.use(sinonChai);
let expect = chai.expect;
import * as mockery from 'mockery';

// bot classes
import Robot from '../src/robot';
import {CatchAllMessage, EnterMessage, LeaveMessage, TextMessage, TopicMessage}
  from '../src/message';
import Adapter from '../src/adapter';

// Preload the Hubot mock adapter but substitute in the latest version of Adapter
mockery.enable();
mockery.registerAllowable('hubot-mockadapter');
// Force hubot-mockadapter to use the latest version of Adapter
mockery.registerMock('webbybot/src/adapter', Adapter);
// Load the mock adapter into the cache
import 'hubot-mockadapter';
// We're done with mockery
mockery.deregisterMock('webbybot/src/adapter');
mockery.disable();

describe('Robot', function() {
  beforeEach(function() {
    this.robot = new Robot(null, 'mockadapter', true, 'TestHubot');
    this.robot.alias = 'Hubot';
    this.robot.run();
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
    describe('#http', function() {
      beforeEach(function() {
        this.httpClient = this.robot.http('http://localhost');
      });
      it('creates a new ScopedHttpClient', function() {
        expect(this.httpClient).to.have.property('get');
        expect(this.httpClient).to.have.property('post');
      });
      it('passes options through to the ScopedHttpClient', function() {
        let agent = {};
        let httpClient = this.robot.http('http://localhost', {
          agent: agent
        });
        expect(httpClient.options.agent).to.equal(agent);
      });
      it('sets a sane user agent', function() {
        expect(this.httpClient.options.headers['User-Agent'])
          .to.contain('Webby');
      });
      it('merges in any global http options', function() {
        let agent = {};
        this.robot.globalHttpOptions = {
          agent: agent
        };
        let httpClient = this.robot.http('http://localhost');
        expect(httpClient.options.agent).to.equal(agent);
      });
      it('local options override global http options', function() {
        let agentA = {};
        let agentB = {};
        this.robot.globalHttpOptions = {
          agent: agentA
        };
        let httpClient = this.robot.http('http://localhost', {
          agent: agentB
        });
        expect(httpClient.options.agent).to.equal(agentB);
      });
    });

    describe('#respondPattern', function() {
      it('matches messages starting with robot\'s name', function() {
        let testMessage = this.robot.name + 'message123';
        let testRegex = /(.*)/;
        let pattern = this.robot.respondPattern(testRegex);
        expect(testMessage).to.match(pattern);
        let match = testMessage.match(pattern)[1];
        expect(match).to.equal('message123');
      });
      it('matches messages starting with robot\'s alias', function() {
        let testMessage = this.robot.alias + 'message123';
        let testRegex = /(.*)/;
        let pattern = this.robot.respondPattern(testRegex);
        expect(testMessage).to.match(pattern);
        let match = testMessage.match(pattern)[1];
        expect(match).to.equal('message123');
      });
      it('does not match unaddressed messages', function() {
        let testMessage = 'message123';
        let testRegex = /(.*)/;
        let pattern = this.robot.respondPattern(testRegex);
        expect(testMessage).to.not.match(pattern);
      });
      it('matches properly when name is substring of alias', function() {
        this.robot.name = 'Meg';
        this.robot.alias = 'Megan';
        let testMessage1 = this.robot.name + ' message123';
        let testMessage2 = this.robot.alias + ' message123';
        let testRegex = /(.*)/;
        let pattern = this.robot.respondPattern(testRegex);
        expect(testMessage1).to.match(pattern);
        let match1 = testMessage1.match(pattern)[1];
        expect(match1).to.equal('message123');
        expect(testMessage2).to.match(pattern);
        let match2 = testMessage2.match(pattern)[1];
        expect(match2).to.equal('message123');
      });
      it('matches properly when alias is substring of name', function() {
        this.robot.name = 'Megan';
        this.robot.alias = 'Meg';
        let testMessage1 = this.robot.name + ' message123';
        let testMessage2 = this.robot.alias + ' message123';
        let testRegex = /(.*)/;
        let pattern = this.robot.respondPattern(testRegex);
        expect(testMessage1).to.match(pattern);
        let match1 = testMessage1.match(pattern)[1];
        expect(match1).to.equal('message123');
        expect(testMessage2).to.match(pattern);
        let match2 = testMessage2.match(pattern)[1];
        expect(match2).to.equal('message123');
      });
    });

    describe('#listen', function() {
      it('registers a new listener directly', function() {
        expect(this.robot.listeners).to.have.length(0);
        this.robot.listen(function() {}, function() {});
        expect(this.robot.listeners).to.have.length(1);
      });
    });

    describe('#hear', function() {
      it('registers a new listener directly', function() {
        expect(this.robot.listeners).to.have.length(0);
        this.robot.hear(/.*/, function() {});
        expect(this.robot.listeners).to.have.length(1);
      });
    });

    describe('#respond', function() {
      it('registers a new listener using hear', function() {
        sinon.spy(this.robot, 'hear');
        sinon.spy(this.robot, 'respondPattern');
        this.robot.respond(/.*/, function() {});
        expect(this.robot.hear).to.have.been.called;
        expect(this.robot.respondPattern).to.have.been.called;
      });
    });

    describe('#enter', function() {
      it('registers a new listener using listen', function() {
        sinon.spy(this.robot, 'listen');
        this.robot.enter(function() {});
        expect(this.robot.listen).to.have.been.called;
      });
    });

    describe('#leave', function() {
      it('registers a new listener using listen', function() {
        sinon.spy(this.robot, 'listen');
        this.robot.leave(function() {});
        expect(this.robot.listen).to.have.been.called;
      });
    });

    describe('#topic', function() {
      it('registers a new listener using listen', function() {
        sinon.spy(this.robot, 'listen');
        this.robot.topic(function() {});
        expect(this.robot.listen).to.have.been.called;
      });
    });

    describe('#error', function() {
      it('registers a new errorHandler directly', function() {
        expect(this.robot.errorHandlers).to.have.length(0);
        this.robot.error(function() {});
        expect(this.robot.errorHandlers).to.have.length(1);
      });
    });

    describe('#invokeErrorHandlers', function() {
      it('trigger  ErrorHandlers', function() {
        sinon.spy(this.robot.logger, 'error');
        this.robot.error(function() {});
        this.robot.onUncaughtException({stack: 'something bad happened'});
        expect(this.robot.logger.error).to.have.been.called;
      });
    });

    describe('#catchAll', function() {
      it('registers a new listener using listen', function() {
        sinon.spy(this.robot, 'listen');
        this.robot.catchAll(function() {});
        expect(this.robot.listen).to.have.been.called;
      });
    });

    describe('#receive', function() {
      it('calls all registered listeners', function(done) {
        let testMessage = new TextMessage(this.user, 'message123');
        let listener = {
          call: function(response, middleware, cb) {
            cb();
          }
        };
        sinon.spy(listener, 'call');
        this.robot.listeners = [listener, listener, listener, listener];
        this.robot.receive(testMessage, function() {
          expect(listener.call).to.have.callCount(8);
          done();
        });
      });
      it('sends a CatchAllMessage if no listener matches', function(done) {
        let testMessage = new TextMessage(this.user, 'message123');
        this.robot.listeners = [];
        let oldReceive = this.robot.receive;
        this.robot.receive = function(message, cb) {
          expect(message).to.be['instanceof'](CatchAllMessage);
          expect(message.message).to.be.equal(testMessage);
          cb();
        };
        sinon.spy(this.robot, 'receive');
        oldReceive.call(this.robot, testMessage, () => {
          expect(this.robot.receive).to.have.been.called;
          done();
        });
      });
      it('does not trigger a CatchAllMessage if a listener matches',
        function(done) {
          let testMessage = new TextMessage(this.user, 'message123');
          let matchingListener = {
            call: function(message, middleware, cb) {
              cb(true);
            }
          };
          let oldReceive = this.robot.receive;
          this.robot.receive = sinon.spy();
          this.robot.listeners = [matchingListener];
          oldReceive.call(this.robot, testMessage, done);
          expect(this.robot.receive).to.not.have.been.called;
        });
      it('stops processing if a listener marks the message as done',
        function(done) {
          let testMessage = new TextMessage(this.user, 'message123');
          let matchingListener = {
            call: function(message, middleware, cb) {
              message.done = true;
              cb(true);
            }
          };
          let listenerSpy = {
            call: sinon.spy()
          };
          this.robot.listeners = [matchingListener, listenerSpy];
          this.robot.receive(testMessage, function() {
            expect(listenerSpy.call).to.not.have.been.called;
            done();
          });
        });
      it('gracefully handles listener uncaughtExceptions ' +
        '(move on to next listener)', function(done) {
        let testMessage = {};
        let theError = new Error();
        let badListener = {
          call: function() {
            throw theError;
          }
        };
        let goodListenerCalled = false;
        let goodListener = {
          call: function(_, middleware, cb) {
            goodListenerCalled = true;
            cb(true);
          }
        };
        this.robot.listeners = [badListener, goodListener];
        this.robot.emit = function(name, err, response) {
          expect(name).to.equal('error');
          expect(err).to.equal(theError);
          expect(response.message).to.equal(testMessage);
        };
        sinon.spy(this.robot, 'emit');
        this.robot.receive(testMessage, () => {
          expect(this.robot.emit).to.have.been.called;
          expect(goodListenerCalled).to.be.ok;
          done();
        });
      });
      it('executes the callback after the function returns when ' +
        'there are no listeners', function(done) {
        let testMessage = new TextMessage(this.user, 'message123');
        let finished = false;
        this.robot.receive(testMessage, function() {
          expect(finished).to.be.ok;
          done();
        });
        finished = true;
      });
    });

    describe('#loadFile', function() {
      beforeEach(function() {
        this.sandbox = sinon.sandbox.create();
      });
      afterEach(function() {
        this.sandbox.restore();
      });
      it('should require the specified file', function() {
        let module = require('module');
        let script = sinon.spy(function(robot) {});
        this.sandbox.stub(module, '_load').returns(script);
        this.sandbox.stub(this.robot, 'parseHelp');
        this.robot.loadFile('./scripts', 'test-script.js');
        expect(module._load).to.have.been.calledWith('scripts/test-script');
      });
      describe('proper script', function() {
        beforeEach(function() {
          let module = require('module');
          this.script = sinon.spy(function(robot) {});
          this.sandbox.stub(module, '_load').returns(this.script);
          this.sandbox.stub(this.robot, 'parseHelp');
        });
        it('should call the script with the Robot', function() {
          this.robot.loadFile('./scripts', 'test-script.js');
          expect(this.script).to.have.been.calledWith(this.robot);
        });
        it('should parse the script documentation', function() {
          this.robot.loadFile('./scripts', 'test-script.js');
          expect(this.robot.parseHelp).to.have.been
            .calledWith('scripts/test-script.js');
        });
      });
      describe('non-Function script', function() {
        beforeEach(function() {
          let module = require('module');
          this.script = {};
          this.sandbox.stub(module, '_load').returns(this.script);
        });
        it('logs a warning', function() {
          sinon.stub(this.robot.logger, 'warning');
          this.robot.loadFile('./scripts', 'test-script.js');
          expect(this.robot.logger.warning).to.have.been.called;
        });
      });
    });

    describe('Listener Registration', function() {
      describe('#listen', function() {
        it('forwards the matcher, options, and callback to Listener',
          function() {
            let callback = sinon.spy();
            let matcher = sinon.spy();
            let options = {};
            this.robot.listen(matcher, options, callback);
            let testListener = this.robot.listeners[0];
            expect(testListener.matcher).to.equal(matcher);
            expect(testListener.callback).to.equal(callback);
            expect(testListener.options).to.equal(options);
          });
      });

      describe('#hear', function() {
        it('matches TextMessages', function() {
          let callback = sinon.spy();
          let testMessage = new TextMessage(this.user, 'message123');
          let testRegex = /^message123$/;
          this.robot.hear(testRegex, callback);
          let testListener = this.robot.listeners[0];
          let result = testListener.matcher(testMessage);
          expect(result).to.be.ok;
        });
        it('does not match EnterMessages', function() {
          let callback = sinon.spy();
          let testMessage = new EnterMessage(this.user);
          let testRegex = /.*/;
          this.robot.hear(testRegex, callback);
          let testListener = this.robot.listeners[0];
          let result = testListener.matcher(testMessage);
          expect(result).to.not.be.ok;
        });
      });

      describe('#respond', function() {
        it('matches TextMessages addressed to the robot', function() {
          let callback = sinon.spy();
          let testMessage = new TextMessage(this.user, 'TestHubot message123');
          let testRegex = /message123$/;
          this.robot.respond(testRegex, callback);
          let testListener = this.robot.listeners[0];
          let result = testListener.matcher(testMessage);
          expect(result).to.be.ok;
        });
        it('does not match EnterMessages', function() {
          let callback = sinon.spy();
          let testMessage = new EnterMessage(this.user);
          let testRegex = /.*/;
          this.robot.respond(testRegex, callback);
          let testListener = this.robot.listeners[0];
          let result = testListener.matcher(testMessage);
          expect(result).to.not.be.ok;
        });
      });

      describe('#enter', function() {
        it('matches EnterMessages', function() {
          let callback = sinon.spy();
          let testMessage = new EnterMessage(this.user);
          this.robot.enter(callback);
          let testListener = this.robot.listeners[0];
          let result = testListener.matcher(testMessage);
          expect(result).to.be.ok;
        });
        it('does not match TextMessages', function() {
          let callback = sinon.spy();
          let testMessage = new TextMessage(this.user, 'message123');
          this.robot.enter(callback);
          let testListener = this.robot.listeners[0];
          let result = testListener.matcher(testMessage);
          expect(result).to.not.be.ok;
        });
      });

      describe('#leave', function() {
        it('matches LeaveMessages', function() {
          let callback = sinon.spy();
          let testMessage = new LeaveMessage(this.user);
          this.robot.leave(callback);
          let testListener = this.robot.listeners[0];
          let result = testListener.matcher(testMessage);
          expect(result).to.be.ok;
        });
        it('does not match TextMessages', function() {
          let callback = sinon.spy();
          let testMessage = new TextMessage(this.user, 'message123');
          this.robot.leave(callback);
          let testListener = this.robot.listeners[0];
          let result = testListener.matcher(testMessage);
          expect(result).to.not.be.ok;
        });
      });

      describe('#topic', function() {
        it('matches TopicMessages', function() {
          let callback = sinon.spy();
          let testMessage = new TopicMessage(this.user);
          this.robot.topic(callback);
          let testListener = this.robot.listeners[0];
          let result = testListener.matcher(testMessage);
          expect(result).to.be.ok;
        });
        it('does not match TextMessages', function() {
          let callback = sinon.spy();
          let testMessage = new TextMessage(this.user, 'message123');
          this.robot.topic(callback);
          let testListener = this.robot.listeners[0];
          let result = testListener.matcher(testMessage);
          expect(result).to.not.be.ok;
        });
      });

      describe('#catchAll', function() {
        it('matches CatchAllMessages', function() {
          let callback = sinon.spy();
          let testMessage = new CatchAllMessage(
            new TextMessage(this.user, 'message123'));
          this.robot.catchAll(callback);
          let testListener = this.robot.listeners[0];
          let result = testListener.matcher(testMessage);
          expect(result).to.be.ok;
        });
        it('does not match TextMessages', function() {
          let callback = sinon.spy();
          let testMessage = new TextMessage(this.user, 'message123');
          this.robot.catchAll(callback);
          let testListener = this.robot.listeners[0];
          let result = testListener.matcher(testMessage);
          expect(result).to.not.be.ok;
        });
      });
    });

    describe('Message Processing', function() {
      it('calls a matching listener', function(done) {
        let testMessage = new TextMessage(this.user, 'message123');
        this.robot.hear(/^message123$/, function(response) {
          expect(response.message).to.equal(testMessage);
          done();
        });
        this.robot.receive(testMessage);
      });
      it('calls multiple matching listeners', function(done) {
        let testMessage = new TextMessage(this.user, 'message123');
        let listenersCalled = 0;
        let listenerCallback = function(response) {
          expect(response.message).to.equal(testMessage);
          listenersCalled++;
        };
        this.robot.hear(/^message123$/, listenerCallback);
        this.robot.hear(/^message123$/, listenerCallback);
        this.robot.receive(testMessage, function() {
          expect(listenersCalled).to.equal(2);
          done();
        });
      });
      it('calls the catch-all listener if no listeners match', function(done) {
        let testMessage = new TextMessage(this.user, 'message123');
        let listenerCallback = sinon.spy();
        this.robot.hear(/^no-matches$/, listenerCallback);
        this.robot.catchAll(function(response) {
          expect(listenerCallback).to.not.have.been.called;
          expect(response.message).to.equal(testMessage);
          done();
        });
        this.robot.receive(testMessage);
      });
      it('does not call the catch-all listener if any listener matched',
        function(done) {
          let testMessage = new TextMessage(this.user, 'message123');
          let listenerCallback = sinon.spy();
          this.robot.hear(/^message123$/, listenerCallback);
          let catchAllCallback = sinon.spy();
          this.robot.catchAll(catchAllCallback);
          this.robot.receive(testMessage, function() {
            expect(listenerCallback).to.have.been.called.once;
            expect(catchAllCallback).to.not.have.been.called;
            done();
          });
        });
      it('stops processing if message.finish() is called synchronously',
        function(done) {
          let testMessage = new TextMessage(this.user, 'message123');
          this.robot.hear(/^message123$/, function(response) {
            response.message.finish();
          });
          let listenerCallback = sinon.spy();
          this.robot.hear(/^message123$/, listenerCallback);
          this.robot.receive(testMessage, function() {
            expect(listenerCallback).to.not.have.been.called;
            done();
          });
        });
      it('calls non-TextListener objects', function(done) {
        let testMessage = new EnterMessage(this.user);
        this.robot.enter(function(response) {
          expect(response.message).to.equal(testMessage);
          done();
        });
        this.robot.receive(testMessage);
      });
      it('gracefully handles listener uncaughtExceptions ' +
        '(move on to next listener)', function(done) {
        let testMessage = new TextMessage(this.user, 'message123');
        let theError = new Error();
        this.robot.hear(/^message123$/, function() {
          throw theError;
        });
        let goodListenerCalled = false;
        this.robot.hear(/^message123$/, function() {
          goodListenerCalled = true;
        });
        let ref = this.robot.listeners;
        let badListener = ref[0];
        let goodListener = ref[1];
        this.robot.emit = function(name, err, response) {
          expect(name).to.equal('error');
          expect(err).to.equal(theError);
          expect(response.message).to.equal(testMessage);
        };
        sinon.spy(this.robot, 'emit');
        this.robot.receive(testMessage, () => {
          expect(this.robot.emit).to.have.been.called;
          expect(goodListenerCalled).to.be.ok;
          done();
        });
      });

      describe('Listener Middleware', function() {
        it('allows listener callback execution', function(testDone) {
          let listenerCallback = sinon.spy();
          this.robot.hear(/^message123$/, listenerCallback);
          this.robot.listenerMiddleware(function(context, next, done) {
            next(done);
          });
          let testMessage = new TextMessage(this.user, 'message123');
          this.robot.receive(testMessage, function() {
            expect(listenerCallback).to.have.been.called;
            testDone();
          });
        });
        it('can block listener callback execution', function(testDone) {
          let listenerCallback = sinon.spy();
          this.robot.hear(/^message123$/, listenerCallback);
          this.robot.listenerMiddleware(function(context, next, done) {
            done();
          });
          let testMessage = new TextMessage(this.user, 'message123');
          this.robot.receive(testMessage, function() {
            expect(listenerCallback).to.not.have.been.called;
            testDone();
          });
        });
        it('receives the correct arguments', function(testDone) {
          this.robot.hear(/^message123$/, function() {});
          let testListener = this.robot.listeners[0];
          let testMessage = new TextMessage(this.user, 'message123');
          this.robot.listenerMiddleware((context, next, done) => {
            process.nextTick(function() {
              expect(context.listener).to.equal(testListener);
              expect(context.response.message).to.equal(testMessage);
              expect(next).to.be.a('function');
              expect(done).to.be.a('function');
              testDone();
            });
          });
          this.robot.receive(testMessage);
        });
        it('executes middleware in order of definition', function(testDone) {
          let execution = [];
          let testMiddlewareA = function(context, next, done) {
            execution.push('middlewareA');
            next(function() {
              execution.push('doneA');
              done();
            });
          };
          let testMiddlewareB = function(context, next, done) {
            execution.push('middlewareB');
            next(function() {
              execution.push('doneB');
              done();
            });
          };
          this.robot.listenerMiddleware(testMiddlewareA);
          this.robot.listenerMiddleware(testMiddlewareB);
          this.robot.hear(/^message123$/, function() {
            execution.push('listener');
          });
          let testMessage = new TextMessage(this.user, 'message123');
          this.robot.receive(testMessage, function() {
            expect(execution).to.deep.equal(['middlewareA', 'middlewareB',
              'listener', 'doneB', 'doneA']);
            testDone();
          });
        });
      });

      describe('Receive Middleware', function() {
        it('fires for all messages, including non-matching ones',
          function(testDone) {
            let middlewareSpy = sinon.spy();
            let listenerCallback = sinon.spy();
            this.robot.hear(/^message123$/, listenerCallback);
            this.robot.receiveMiddleware(function(context, next, done) {
              middlewareSpy();
              next(done);
            });
            let testMessage = new TextMessage(this.user, 'not message 123');
            this.robot.receive(testMessage, function() {
              expect(listenerCallback).to.not.have.been.called;
              expect(middlewareSpy).to.have.been.called;
              testDone();
            });
          });
        it('can block listener execution', function(testDone) {
          let middlewareSpy = sinon.spy();
          let listenerCallback = sinon.spy();
          this.robot.hear(/^message123$/, listenerCallback);
          this.robot.receiveMiddleware(function(context, next, done) {
            middlewareSpy();
            done();
          });
          let testMessage = new TextMessage(this.user, 'message123');
          this.robot.receive(testMessage, function() {
            expect(listenerCallback).to.not.have.been.called;
            expect(middlewareSpy).to.have.been.called;
            testDone();
          });
        });
        it('receives the correct arguments', function(testDone) {
          this.robot.hear(/^message123$/, function() {});
          let testMessage = new TextMessage(this.user, 'message123');
          this.robot.receiveMiddleware(function(context, next, done) {
            expect(context.response.message).to.equal(testMessage);
            expect(next).to.be.a('function');
            expect(done).to.be.a('function');
            testDone();
            next(done);
          });
          this.robot.receive(testMessage);
        });
        it('executes receive middleware in order of definition',
          function(testDone) {
            let execution = [];
            let testMiddlewareA = function(context, next, done) {
              execution.push('middlewareA');
              next(function() {
                execution.push('doneA');
                done();
              });
            };
            let testMiddlewareB = function(context, next, done) {
              execution.push('middlewareB');
              next(function() {
                execution.push('doneB');
                done();
              });
            };
            this.robot.receiveMiddleware(testMiddlewareA);
            this.robot.receiveMiddleware(testMiddlewareB);
            this.robot.hear(/^message123$/, function() {
              return execution.push('listener');
            });
            let testMessage = new TextMessage(this.user, 'message123');
            this.robot.receive(testMessage, function() {
              expect(execution).to.deep.equal(['middlewareA', 'middlewareB',
                'listener', 'doneB', 'doneA']);
              testDone();
            });
          });
        it('allows editing the message portion of the given response',
          function(testDone) {
            let execution = [];
            let testMiddlewareA = function(context, next, done) {
              context.response.message.text = 'foobar';
              next();
            };
            let testMiddlewareB = function(context, next, done) {
              expect(context.response.message.text).to.equal('foobar');
              next();
            };
            this.robot.receiveMiddleware(testMiddlewareA);
            this.robot.receiveMiddleware(testMiddlewareB);
            let testCallback = sinon.spy();
            this.robot.hear(/^foobar$/, testCallback);
            let testMessage = new TextMessage(this.user, 'message123');
            this.robot.receive(testMessage, function() {
              expect(testCallback).to.have.been.called;
              testDone();
            });
          });
      });

      describe('Response Middleware', function() {
        it('executes response middleware in order', function(testDone) {
          let sendSpy;
          this.robot.adapter.send = sendSpy = sinon.spy();
          let listenerCallback = sinon.spy();
          this.robot.hear(/^message123$/, function(response) {
            return response.send('foobar, sir, foobar.');
          });
          this.robot.responseMiddleware(function(context, next, done) {
            context.strings[0] =
              context.strings[0].replace(/foobar/g, 'barfoo');
            next();
          });
          this.robot.responseMiddleware(function(context, next, done) {
            context.strings[0] =
              context.strings[0].replace(/barfoo/g, 'replaced bar-foo');
            next();
          });
          let testMessage = new TextMessage(this.user, 'message123');
          this.robot.receive(testMessage, function() {
            expect(sendSpy.getCall(0).args[1])
              .to.equal('replaced bar-foo, sir, replaced bar-foo.');
            testDone();
          });
        });
        it('allows replacing outgoing strings', function(testDone) {
          let sendSpy;
          this.robot.adapter.send = sendSpy = sinon.spy();
          let listenerCallback = sinon.spy();
          this.robot.hear(/^message123$/, function(response) {
            return response.send('foobar, sir, foobar.');
          });
          this.robot.responseMiddleware(function(context, next, done) {
            context.strings = ['whatever I want.'];
            next();
          });
          let testMessage = new TextMessage(this.user, 'message123');
          this.robot.receive(testMessage, function() {
            expect(sendSpy.getCall(0).args[1])
              .to.deep.equal('whatever I want.');
            testDone();
          });
        });
        it('marks plaintext as plaintext', function(testDone) {
          let sendSpy;
          this.robot.adapter.send = sendSpy = sinon.spy();
          let listenerCallback = sinon.spy();
          this.robot.hear(/^message123$/, function(response) {
            response.send('foobar, sir, foobar.');
          });
          this.robot.hear(/^message456$/, function(response) {
            response.play('good luck with that');
          });
          let method = void 0;
          let plaintext = void 0;
          this.robot.responseMiddleware(function(context, next, done) {
            method = context.method;
            plaintext = context.plaintext;
            next(done);
          });
          let testMessage = new TextMessage(this.user, 'message123');
          this.robot.receive(testMessage, () => {
            expect(plaintext).to.equal(true);
            expect(method).to.equal('send');
            var testMessage2 = new TextMessage(this.user, 'message456');
            this.robot.receive(testMessage2, () => {
              expect(plaintext).to.equal(void 0);
              expect(method).to.equal('play');
              testDone();
            });
          });
        });
        it('does not send trailing functions to middleware',
          function(testDone) {
            let sendSpy;
            this.robot.adapter.send = sendSpy = sinon.spy();
            let asserted = false;
            let postSendCallback = function() {};
            this.robot.hear(/^message123$/, function(response) {
              response.send('foobar, sir, foobar.', postSendCallback);
            });
            this.robot.responseMiddleware(function(context, next, done) {
              expect(context.strings).to.deep.equal(['foobar, sir, foobar.']);
              expect(context.method).to.equal('send');
              asserted = true;
              next();
            });
            let testMessage = new TextMessage(this.user, 'message123');
            this.robot.receive(testMessage, function() {
              expect(asserted).to.equal(true);
              expect(sendSpy.getCall(0).args[1])
                .to.equal('foobar, sir, foobar.');
              expect(sendSpy.getCall(0).args[2]).to.equal(postSendCallback);
              testDone();
            });
          });
      });
    });
  });
});
