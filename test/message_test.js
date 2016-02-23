/*eslint-env node, mocha */
'use strict';
// Assertions and Stubbing
let chai = require('chai');
let sinon = require('sinon');
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
        var testMessage = new Message(this.user);

        expect(testMessage.done).to.not.be.ok;
        testMessage.finish();
        expect(testMessage.done).to.be.ok;
      });
    });

    describe('TextMessage', function() {
      describe('#match', function() {
        it('should perform standard regex matching', function() {
          var testMessage = new TextMessage(this.user, 'message123');

          expect(testMessage.match(/^message123$/)).to.be.ok;
          expect(testMessage.match(/^does-not-match$/)).to.not.be.ok;
        });
      });
    });
  });
});
