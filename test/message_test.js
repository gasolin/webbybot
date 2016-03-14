/* eslint-env node, mocha */
// Assertions and Stubbing
import * as sinon from 'sinon';
import * as chai from 'chai';
chai.use(require('sinon-chai'));
let expect = chai.expect;
// bot classes
let User = require('../src/user');
let {Message, TextMessage, EnterMessage, CatchAllMessage} =
  require('../src/message');

describe('Message', function() {
  beforeEach(function() {
    this.user = new User({
      id: 1,
      name: 'hubottester',
      room: '#mocha'
    });
  });

  describe('Unit Tests', function() {
    describe('#finish', function() {
      it('marks the message as done', function() {
        let testMessage = new Message(this.user);

        expect(testMessage.done).to.not.be.ok;
        testMessage.finish();
        expect(testMessage.done).to.be.ok;
      });
    });

    describe('TextMessage', function() {
      describe('#match', function() {
        it('should perform standard regex matching', function() {
          let testMessage = new TextMessage(this.user, 'message123');

          expect(testMessage.match(/^message123$/)).to.be.ok;
          expect(testMessage.match(/^does-not-match$/)).to.not.be.ok;
        });
      });
    });
  });
});
