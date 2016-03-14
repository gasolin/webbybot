/* eslint max-len: [2, 120, 4]*/
/* eslint-env node, mocha */
// Assertions and Stubbing
import * as sinon from 'sinon';
import * as chai from 'chai';
chai.use(require('sinon-chai'));
let expect = chai.expect;
// bot classes
let {CatchAllMessage, EnterMessage, TextMessage} = require('../src/message');
let {Listener, TextListener} = require('../src/listener');
let Response = require('../src/response');
let User = require('../src/user');

describe('Listener', function() {
  beforeEach(function() {
    // Dummy robot
    this.robot = {
      // Re-throw AssertionErrors for clearer test failures
      emit: function(name, err, response) {
        if (err.constructor.name === 'AssertionError') {
          process.nextTick(() => { throw err; });
        }
      },
      // Ignore log messages
      logger: {
        debug: () => {}
      },
      // Why is this part of the Robot object??
      Response: Response
    };

    // Test user
    this.user = new User({
      id: 1,
      name: 'hubottester',
      room: '#mocha',
    });
  });

  describe('Unit Tests', function() {
    describe('#call', function() {
      it('calls the matcher', function(done) {
        let callback = sinon.spy();
        let testMatcher = sinon.spy();
        let testMessage = {};

        let testListener = new Listener(this.robot, testMatcher, callback);
        testListener.call(testMessage, function(_) {
          expect(testMatcher).to.have.been.calledWith(testMessage);
          done();
        });
      });

      it('passes the matcher result on to the listener callback', function(done) {
        let matcherResult = {};
        let testMatcher = sinon.stub().returns(matcherResult);
        let testMessage = {};
        let listenerCallback = function(response) {
          expect(response.match).to.be.equal(matcherResult);
        };

        // sanity check; matcherResult must be truthy
        expect(matcherResult).to.be.ok;

        let testListener = new Listener(this.robot, testMatcher, listenerCallback);
        testListener.call(testMessage, function(result) {
          // sanity check; message should have been processed
          expect(testMatcher).to.have.been.called;
          expect(result).to.be.ok;

          done();
        });
      });

      describe('if the matcher returns true', function() {
        beforeEach(function() {
          this.createListener = function(cb) {
            return new Listener(this.robot, sinon.stub().returns(true), cb);
          };
        });

        it('executes the listener callback', function(done) {
          let listenerCallback = sinon.spy();
          let testMessage = {};

          let testListener = this.createListener(listenerCallback);
          testListener.call(testMessage, function(_) {
            expect(listenerCallback).to.have.been.called;
            done();
          });
        });


        it('returns true', function() {
          let testMessage = {};

          let testListener = this.createListener(() => {});
          let result = testListener.call(testMessage);
          expect(result).to.be.ok;
        });

        it('calls the provided callback with true', function(done) {
          let testMessage = {};

          let testListener = this.createListener(() => {});
          testListener.call(testMessage, function(result) {
            expect(result).to.be.ok;
            done();
          });
        });

        it('calls the provided callback after the function returns', function(done) {
          let testMessage = {};

          let testListener = this.createListener(() => {});
          let finished = false;
          testListener.call(testMessage, function(result) {
            expect(finished).to.be.ok;
            done();
          });
          finished = true;
        });

        it('handles uncaught errors from the listener callback', function(done) {
          let testMessage = {};
          let theError = new Error();

          let listenerCallback = function(response) {
            throw theError;
          };

          this.robot.emit = function(name, err, response) {
            expect(name).to.equal('error');
            expect(err).to.equal(theError);
            expect(response.message).to.equal(testMessage);
            done();
          };

          let testListener = this.createListener(listenerCallback);
          testListener.call(testMessage, sinon.spy());
        });

        it('calls the provided callback with true if ' +
           'there is an error thrown by the listener callback', function(done) {
          let testMessage = {};
          let theError = new Error();

          let listenerCallback = function(response) {
            throw theError;
          };

          let testListener = this.createListener(listenerCallback);
          testListener.call(testMessage, function(result) {
            expect(result).to.be.ok;
            done();
          });
        });

        it('calls the listener callback with a Response that wraps the Message', function(done) {
          let testMessage = {};

          let listenerCallback = function(response) {
            expect(response.message).to.equal(testMessage);
            done();
          };

          let testListener = this.createListener(listenerCallback);

          testListener.call(testMessage, sinon.spy());
        });

        it('passes through the provided middleware stack', function(testDone) {
          let testMessage = {};

          let testListener = this.createListener(() => {});
          let testMiddleware = {
            execute: function(context, next, done) {
              expect(context.listener).to.be.equal(testListener);
              expect(context.response).to.be.instanceof(Response);
              expect(context.response.message).to.be.equal(testMessage);
              expect(next).to.be.a('function');
              expect(done).to.be.a('function');
              testDone();
            }
          };

          testListener.call(testMessage, testMiddleware, sinon.spy());
        });

        it('executes the listener callback if middleware succeeds', function(testDone) {
          let listenerCallback = sinon.spy();
          let testMessage = {};

          let testListener = this.createListener(listenerCallback);

          testListener.call(testMessage, function(result) {
            expect(listenerCallback).to.have.been.called;
            // Matcher matched, so we return true
            expect(result).to.be.ok;
            testDone();
          });
        });

        it('does not execute the listener callback if middleware fails', function(testDone) {
          let listenerCallback = sinon.spy();
          let testMessage = {};

          let testListener = this.createListener(listenerCallback);
          let testMiddleware = {
            execute: function(context, next, done) {
              // Middleware fails
              done();
            }
          };

          testListener.call(testMessage, testMiddleware, function(result) {
            expect(listenerCallback).to.not.have.been.called;
            // Matcher still matched, so we return true
            expect(result).to.be.ok;
            testDone();
          });
        });

        it('unwinds the middleware stack if there is an error in the listener callback', function(testDone) {
          let listenerCallback = sinon.stub().throws(new Error());
          let testMessage = {};
          let extraDoneFunc = null;

          let testListener = this.createListener(listenerCallback);
          let testMiddleware = {
            execute: function(context, next, done) {
              extraDoneFunc = sinon.spy(done);
              next(context, extraDoneFunc);
            }
          };

          testListener.call(testMessage, testMiddleware, function(result) {
            // Listener callback was called (and failed)
            expect(listenerCallback).to.have.been.called;
            // Middleware stack was unwound correctly
            expect(extraDoneFunc).to.have.been.called;
            // Matcher still matched, so we return true
            expect(result).to.be.ok;
            testDone();
          });
        });
      });

      describe('if the matcher returns false', function() {
        beforeEach(function() {
          this.createListener = function(cb) {
            return new Listener(this.robot, sinon.stub().returns(false), cb);
          };
        });

        it('does not execute the listener callback', function(done) {
          let listenerCallback = sinon.spy();
          let testMessage = {};

          let testListener = this.createListener(listenerCallback);
          testListener.call(testMessage, function(_) {
            expect(listenerCallback).to.not.have.been.called;
            done();
          });
        });


        it('returns false', function() {
          let testMessage = {};

          let testListener = this.createListener(() => {});
          let result = testListener.call(testMessage);
          expect(result).to.not.be.ok;
        });

        it('calls the provided callback with false', function(done) {
          let testMessage = {};

          let testListener = this.createListener(() => {});
          testListener.call(testMessage, function(result) {
            expect(result).to.not.be.ok;
            done();
          });
        });

        it('calls the provided callback after the function returns', function(done) {
          let testMessage = {};

          let testListener = this.createListener(() => {});
          let finished = false;
          testListener.call(testMessage, function(result) {
            expect(finished).to.be.ok;
            done();
          });
          finished = true;
        });

        it('does not execute any middleware', function(done) {
          let testMessage = {};

          let testListener = this.createListener(() => {});
          let testMiddleware = {
            execute: sinon.spy()
          };

          testListener.call(testMessage, function(result) {
            expect(testMiddleware.execute).to.not.have.been.called;
            done();
          });
        });
      });
    });

    describe('#constructor', function() {
      it('requires a matcher', function() {
        expect(function() {
          new Listener(this.obot, undefined, {}, sinon.spy());
        }).to.throw(Error);
      });

      it('requires a callback', function() {
        // No options
        expect(function() {
          new Listener(this.robot, sinon.spy());
        }).to.throw(Error);
        // With options
        expect(function() {
          new Listener(this.robot, sinon.spy(), {});
        }).to.throw(Error);
      });

      it('gracefully handles missing options', function() {
        let testMatcher = sinon.spy();
        let listenerCallback = sinon.spy();
        let testListener = new Listener(this.robot, testMatcher, listenerCallback);
        // slightly brittle because we are testing for the default options Object
        expect(testListener.options).to.deep.equal({id: null});
        expect(testListener.callback).to.be.equal(listenerCallback);
      });

      it('gracefully handles a missing ID (set to null)', function() {
        let testMatcher = sinon.spy();
        let listenerCallback = sinon.spy();
        let testListener = new Listener(this.robot, testMatcher, {}, listenerCallback);
        expect(testListener.options.id).to.be.null;
      });
    });

    describe('TextListener', function() {
      describe('#matcher', function() {
        it('matches TextMessages', function() {
          let callback = sinon.spy();
          let testMessage = new TextMessage(this.user, 'test');
          testMessage.match = sinon.stub().returns(true);
          let testRegex = /test/;

          let testListener = new TextListener(this.robot, testRegex, callback);
          let result = testListener.matcher(testMessage);

          expect(result).to.be.ok;
          expect(testMessage.match).to.have.been.calledWith(testRegex);
        });

        it('does not match EnterMessages', function() {
          let callback = sinon.spy();
          let testMessage = new EnterMessage(this.user);
          testMessage.match = sinon.stub().returns(true);
          let testRegex = /test/;

          let testListener = new TextListener(this.robot, testRegex, callback);
          let result = testListener.matcher(testMessage);

          expect(result).to.not.be.ok;
          expect(testMessage.match).to.not.have.been.called;
        });
      });
    });
  });
});
