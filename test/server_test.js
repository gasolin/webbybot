/* eslint-env node, mocha */
// Assertions and Stubbing
import * as sinon from 'sinon';
import * as chai from 'chai';
import sinonChai from 'sinon-chai';
chai.use(sinonChai);
let expect = chai.expect;

import * as httpMocks from 'node-mocks-http';
// bot classes
import {ExpressRouter, NullRouter} from '../src/server';

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
        expect(this.robot.logger.warning).to.have.been.calledOnce;
      });
    });

    describe('#ExpressRouter', function() {
      it('basic auth', function() {
        process.env.EXPRESS_USER = 'test';
        process.env.EXPRESS_PASSWORD = 'testpasswd';
        let object = new ExpressRouter(this.robot);

        expect(this.robot.router).to.exist;

        delete this.robot.router;
        delete process.env.EXPRESS_USER;
        delete process.env.EXPRESS_PASSWORD;
      });

      it('static', function() {
        process.env.EXPRESS_STATIC = 'public';
        let object = new ExpressRouter(this.robot);

        expect(this.robot.server).to.exist;
        expect(this.robot.router).to.exist;

        delete this.robot.router;
        delete this.robot.server;
        delete process.env.EXPRESS_STATIC;
      });

      it('setupHeroku', function() {
        sinon.spy(global, 'setInterval');
        process.env.HEROKU_URL = 'http://example.heroku.com';
        let object = new ExpressRouter(this.robot);

        expect(global.setInterval).to.have.been.calledOnce;

        global.setInterval.restore();
        delete this.robot.router;
        delete this.robot.server;
        delete process.env.HEROKU_URL;
      });
    });

    describe('Middleware', function() {
      let req, res;
      beforeEach(function() {
        req = httpMocks.createRequest();
        res = httpMocks.createResponse();
      });

      it('rewriteXPowerBy', function(done) {
        let app = {
          disable: sinon.spy()
        };

        let object = new ExpressRouter(this.robot);
        object.rewriteXPowerBy(req, res, app, 'test')
          .then(() => {
            // expect(app.disable).to.have.been.calledOnce;

            delete this.robot.router;
            delete this.robot.server;
            done();
          });
      });

      it('basicAuthentication', function(done) {
        let object = new ExpressRouter(this.robot);
        object.basicAuthentication(req, res, 'user', 'password')
          .then(() => {
            // expect(app.disable).to.have.been.calledOnce;
            delete this.robot.router;
            delete this.robot.server;
            done();
          });
      });
    });
  });
});
