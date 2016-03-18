/* eslint max-len: [2, 120, 4]*/
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
import {CatchAllMessage, EnterMessage, TextMessage} from '../src/message';
import Adapter from '../src/adapter';
import Response from '../src/response';
import Middleware from '../src/middleware';

// Preload the Hubot mock adapter but substitute
// in the latest version of Adapter
mockery.enable();
mockery.registerAllowable('hubot-mock-adapter');
mockery.registerAllowable('lodash'); // hubot-mock-adapter uses lodash
// Force hubot-mock-adapter to use the latest version of Adapter
mockery.registerMock('hubot/src/adapter', Adapter);
// Load the mock adapter into the cache
import 'hubot-mock-adapter';
// We're done with mockery
mockery.deregisterMock('hubot/src/adapter');
mockery.disable();


describe('Middleware', function() {
  describe('Unit Tests', function() {
    beforeEach(function() {
      this.robot = {
        // Stub out event emitting
        emit: sinon.spy()
      };

      this.middleware = new Middleware(this.robot);
    });

    describe('#execute', function() {
      it('executes synchronous middleware', function(testDone) {
        let testMiddleware = sinon.spy(function(context, next, done) {
          next(done);
        });

        this.middleware.register(testMiddleware);

        let middlewareFinished = function() {
          expect(testMiddleware).to.have.been.called;
          testDone();
        };

        this.middleware.execute(
          {},
          (_, done) => done(),
            middlewareFinished
        );
      });

      it('executes asynchronous middleware', function(testDone) {
        let testMiddleware = sinon.spy(function(context, next, done) {
          // Yield to the event loop
          process.nextTick(function() {
            next(done);
          });
        });

        this.middleware.register(testMiddleware);

        let middlewareFinished = function(context, done) {
          expect(testMiddleware).to.have.been.called;
          testDone();
        };

        this.middleware.execute(
          {},
          (_, done) => done(),
            middlewareFinished
        );
      });

      it('passes the correct arguments to each middleware', function(testDone) {
        let testContext = {};
        // Pull the Robot in scope for simpler callbacks
        let testRobot = this.robot;

        let testMiddleware = function(context, next, done) {
          // Break out of middleware error handling so assertion errors are
          // more visible
          process.nextTick(function() {
            // Check that variables were passed correctly
            expect(context).to.equal(testContext);
            next(done);
          });
        };

        this.middleware.register(testMiddleware);

        this.middleware.execute(
          testContext,
          (_, done) => done(),
            () => testDone()
        );
      });

      it('executes all registered middleware in definition order', function(testDone) {
        let middlewareExecution = [];

        let testMiddlewareA = function(context, next, done) {
          middlewareExecution.push('A');
          next(done);
        };

        let testMiddlewareB = function(context, next, done) {
          middlewareExecution.push('B');
          next(done);
        };

        this.middleware.register(testMiddlewareA);
        this.middleware.register(testMiddlewareB);

        let middlewareFinished = function() {
          expect(middlewareExecution).to.deep.equal(['A','B']);
          testDone();
        };

        this.middleware.execute(
          {},
          (_, done) => done(),
            middlewareFinished
        );
      });

      it('executes the next callback after the function returns when there is no middleware', function(testDone) {
        let finished = false;
        this.middleware.execute(
          {},
          () => {
            expect(finished).to.be.ok;
            testDone();
          },
          () => {}
        );
        finished = true;
      });

      it('always executes middleware after the function returns', function(testDone) {
        let finished = false;

        this.middleware.register(function(context, next, done) {
          expect(finished).to.be.ok;
          testDone();
        });

        this.middleware.execute({}, () => {}, () => {});
        finished = true;
      });

      it('creates a default "done" function', function(testDone) {
        let finished = false;

        this.middleware.register(function(context, next, done) {
          expect(finished).to.be.ok;
          testDone();
        });

        // we're testing the lack of a third argument here.
        this.middleware.execute({}, () => {});
        finished = true;
      });

      it('does the right thing with done callbacks', function(testDone) {
        // we want to ensure that the 'done' callbacks are nested correctly
        // (executed in reverse order of definition)
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

        this.middleware.register(testMiddlewareA);
        this.middleware.register(testMiddlewareB);

        let allDone = function() {
          expect(execution).to.deep.equal(['middlewareA', 'middlewareB', 'doneB', 'doneA']);
          testDone();
        };

        this.middleware.execute(
          {},
          // Short circuit at the bottom of the middleware stack
          (_, done) => done(),
            allDone
        );
      });

      it('defaults to the latest done callback if none is provided', function(testDone) {
        // we want to ensure that the 'done' callbacks are nested correctly
        // (executed in reverse order of definition)
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
          next();
        };

        this.middleware.register(testMiddlewareA);
        this.middleware.register(testMiddlewareB);

        let allDone = function() {
          expect(execution).to.deep.equal(['middlewareA', 'middlewareB', 'doneA']);
          testDone();
        };

        this.middleware.execute(
          {},
          // Short circuit at the bottom of the middleware stack
          (_, done) => done(),
            allDone
        );
      });

      describe('error handling', function() {
        it('does not execute subsequent middleware after the error is thrown', function(testDone) {
          let middlewareExecution = [];

          let testMiddlewareA = function(context, next, done) {
            middlewareExecution.push('A');
            next(done);
          };

          let testMiddlewareB = function(context, next, done) {
            middlewareExecution.push('B');
            throw new Error();
          };

          let testMiddlewareC = function(context, next, done) {
            middlewareExecution.push('C');
            next(done);
          };

          this.middleware.register(testMiddlewareA);
          this.middleware.register(testMiddlewareB);
          this.middleware.register(testMiddlewareC);

          let middlewareFinished = sinon.spy();
          let middlewareFailed = function() {
            expect(middlewareFinished).to.not.have.been.called;
            expect(middlewareExecution).to.deep.equal(['A','B']);
            testDone();
          };

          this.middleware.execute(
            {},
            middlewareFinished,
            middlewareFailed
          );
        });

        it('emits an error event', function(testDone) {
          let testResponse = {};
          let theError = new Error();

          let testMiddleware = function(context, next, done) {
            throw theError;
          };

          this.middleware.register(testMiddleware);

          this.robot.emit = sinon.spy(function(name, err, response) {
            expect(name).to.equal('error');
            expect(err).to.equal(theError);
            expect(response).to.equal(testResponse);
          });

          let middlewareFinished = sinon.spy();
          let middlewareFailed = function() {
            expect(this.robot.emit).to.have.been.called;
            testDone();
          }.bind(this);

          this.middleware.execute(
            {response: testResponse},
            middlewareFinished,
            middlewareFailed
          );
        });

        it('unwinds the middleware stack (calling all done functions)', function(testDone) {
          let extraDoneFunc = null;

          let testMiddlewareA = function(context, next, done) {
            // Goal: make sure that the middleware stack is unwound correctly
            extraDoneFunc = sinon.spy(done);
            next(extraDoneFunc);
          };

          let testMiddlewareB = function(context, next, done) {
            throw new Error();
          };

          this.middleware.register(testMiddlewareA);
          this.middleware.register(testMiddlewareB);

          let middlewareFinished = sinon.spy();
          let middlewareFailed = function() {
            // Sanity check that the error was actually thrown
            expect(middlewareFinished).to.not.have.been.called;

            expect(extraDoneFunc).to.have.been.called;
            testDone();
          };

          this.middleware.execute(
            {},
            middlewareFinished,
            middlewareFailed
          );
        });
      });
    });

    describe('#register', function() {
      it('adds to the list of middleware', function() {
        let testMiddleware = function(context, next, done) {};

        this.middleware.register(testMiddleware);

        expect(this.middleware.stack).to.include(testMiddleware);
      });

      it('validates the arity of middleware', function() {
        let testMiddleware = function(context, next, done, extra) {};

        expect(() => this.middleware.register(testMiddleware)).to.throw(/Incorrect number of arguments/);
      });
    });
  });

  // Per the documentation in docs/scripting.md
  // Any new fields that are exposed to middleware should be explicitly
  // tested for.
  describe('Public Middleware APIs', function() {
    beforeEach(function() {
      this.robot = new Robot(null, 'mock-adapter', true, 'TestHubot');
      this.robot.run();

      // Re-throw AssertionErrors for clearer test failures
      this.robot.on('error', function(name, err, response) {
        if (err && err.constructor && err.constructor.name === 'AssertionError') {
          process.nextTick(() => {throw err;});
        }
      });

      this.user = this.robot.brain.userForId('1', {
        name: 'hubottester',
        room: '#mocha'
      });

      // Dummy middleware
      this.middleware = sinon.spy((context, next, done) => next(done));

      this.testMessage = new TextMessage(this.user, 'message123');
      this.robot.hear(/^message123$/, (response) => {});
      this.testListener = this.robot.listeners[0];
    });

    afterEach(function() {
      this.robot.server.close();
      this.robot.shutdown();
    });

    describe('listener middleware context', function() {
      beforeEach(function() {
        this.robot.listenerMiddleware(function(context, next, done) {
          this.middleware.call(this, context, next, done);
        }.bind(this));
      });

      describe('listener', function() {
        it('is the listener object that matched', function(testDone) {
          this.robot.receive(this.testMessage, function() {
            expect(this.middleware).to.have.been.calledWithMatch(
              sinon.match.has('listener',
                              sinon.match.same(this.testListener)), // context
                              sinon.match.any,                        // next
                              sinon.match.any                         // done
            );
            testDone();
          }.bind(this));
        });

        it('has options.id (metadata)', function(testDone) {
          this.robot.receive(this.testMessage, function() {
            expect(this.middleware).to.have.been.calledWithMatch(
              sinon.match.has('listener',
                              sinon.match.has('options',
                                              sinon.match.has('id'))),        //  context
                                              sinon.match.any,                    //  next
                                              sinon.match.any                     //  done
            );
            testDone();
          }.bind(this));
        });
      });

      describe('response', function() {
        it('is a Response that wraps the message', function(testDone) {
          this.robot.receive(this.testMessage, function() {
            expect(this.middleware).to.have.been.calledWithMatch(
              sinon.match.has('response',
                              sinon.match.instanceOf(Response).and(
                                sinon.match.has('message',
                                                sinon.match.same(this.testMessage)))), // context
                                                sinon.match.any,                         // next
                                                sinon.match.any                          // done
            );
            testDone();
          }.bind(this));
        });
      });
    });

    describe('receive middleware context', function() {
      beforeEach(function() {
        this.robot.receiveMiddleware(function(context, next, done) {
          this.middleware.call(this, context, next, done);
        }.bind(this));
      });

      describe('response', function() {
        it('is a match-less Response object', function(testDone) {
          this.robot.receive(this.testMessage, function() {
            expect(this.middleware).to.have.been.calledWithMatch(
              sinon.match.has('response',
                              sinon.match.instanceOf(Response).and(
                                sinon.match.has('message',
                                                sinon.match.same(this.testMessage)))),  // context
                                                sinon.match.any,                              // next
                                                sinon.match.any                               // done
            );
            testDone();
          }.bind(this));
        });
      });
    });

    describe('next', function() {
      beforeEach(function() {
        this.robot.listenerMiddleware(function(context, next, done) {
          this.middleware.call(this, context, next, done);
        }.bind(this));
      });

      it('is a function with arity one', function(testDone) {
        this.robot.receive(this.testMessage, function() {
          expect(this.middleware).to.have.been.calledWithMatch(
            sinon.match.any,             // context
            sinon.match.func.and(
              sinon.match.has('length',
                              sinon.match(1))),        // next
                              sinon.match.any              // done
          );
          testDone();
        }.bind(this));
      });
    });

    describe('done', function() {
      beforeEach(function() {
        this.robot.listenerMiddleware(function(context, next, done) {
          this.middleware.call(this, context, next, done);
        }.bind(this));
      });

      it('is a function with arity zero', function(testDone) {
        this.robot.receive(this.testMessage, function() {
          expect(this.middleware).to.have.been.calledWithMatch(
            sinon.match.any,             // context
            sinon.match.any,             // next
            sinon.match.func.and(
              sinon.match.has('length', sinon.match(0))
            )        // done
          );
          testDone();
        }.bind(this));
      });
    });
  });
});
