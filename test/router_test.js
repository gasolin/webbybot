/* eslint-env node, mocha */
// Assertions and Stubbing
import * as sinon from 'sinon';
import * as chai from 'chai';
import sinonChai from 'sinon-chai';
chai.use(sinonChai);
let expect = chai.expect;
// bot classes
import {ExpressRouter, NullRouter} from '../src/router';

describe('Router', function() {
  describe('Unit Tests', function() {
    beforeEach(function() {
      this.robot = {
        // Stub out event emitting
        logger: {
          warning: sinon.spy()
        }
      };
    });

    describe('#NullRouter', function() {
      it('get call logged', function() {
        new NullRouter(this.robot);
        this.robot.router.get();
        expect(this.robot.logger.warning).to.have.been.called;
      });
    });
  });
});
