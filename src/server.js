import express from 'express';
import multipart from 'connect-multiparty';
import * as HttpClient from 'scoped-http-client';
import basicAuth from 'basic-auth';
import bodyParser from 'body-parser';

class NullRouter {
  /**
   * Setup an empty router object
   *
   * returns nothing
   */
  constructor(robot) {
    let msg = 'A script has tried registering a HTTP route while the HTTP ' +
          'server is disabled with --disabled-httpd.';
    robot.router = {
      get: () => robot.logger.warning(msg),
      post: () => robot.logger.warning(msg),
      put: () => robot.logger.warning(msg),
      delete: () => robot.logger.warning(msg)
    };
  }
}

class ExpressRouter {
  /**
   * Setup the Express server's defaults.
   *
   * Returns nothing.
   */
  constructor(robot) {
    let user = process.env.EXPRESS_USER;
    let pass = process.env.EXPRESS_PASSWORD;
    let stat = process.env.EXPRESS_STATIC;
    let port = process.env.EXPRESS_PORT || process.env.PORT || 8080;
    let address = process.env.EXPRESS_BIND_ADDRESS ||
      process.env.BIND_ADDRESS || '0.0.0.0';
    let xpoweredby = process.env.EXPRESS_XPOWEREDBY || true;

    let app = express();

    if (xpoweredby) {
      app.use(this.rewriteXPowerBy('webby/' + robot.name));
    }

    if (user && pass) {
      app.use(this.basicAuth(user, pass));
    }
    app.use(express.query());

    // configure app to use bodyParser()
    // this will let us get the data from a POST via
    // POST: {"name":"foo","color":"red"} or
    // POST: name=foo&color=red
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(bodyParser.json());
    // replacement for deprecated express.multipart/connect.multipart
    // limit to 100mb, as per the old behavior
    app.use(multipart({
      maxFilesSize: 100 * 1024 * 1024
    }));

    if (stat) {
      app.use(express.static(stat));
    }

    try {
      robot.server = app.listen(port, address);
      robot.router = app;
    } catch(error) {
      robot.logger.error(`Error trying to start HTTP server: ${error}\n
        ${error.stack}`);
      process.exit(1);
    }

    this.setupHeroku(robot);
  }

  /**
   *  X-Power-By header rewrite middleware for use with Express 4.x.
   *
   * @param   {string}   HTTP header name
   */
  rewriteXPowerBy(name) {
    return function(req, res, next) {
      // Switch off the default 'X-Powered-By: Express' header
      app.disable('x-powered-by');

      res.setHeader('X-Powered-By', name);
      next();
    }
  }

  /**
   * Simple basic auth middleware for use with Express 4.x.
   * refer https://davidbeath.com/posts/expressjs-40-basicauth.html
   *
   * @example
   * app.use('/api-requiring-auth', utils.basicAuth('username', 'password'));
   *
   * @param   {string}   username Expected username
   * @param   {string}   password Expected password
   * @returns {function} Express 4 middleware requiring the given credentials
   */
  basicAuth(username, password) {
    return function(req, res, next) {
      function unauthorized(res) {
        res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
        return res.send(401);
      };

      var user = basicAuth(req);

      if (!user || !user.name || !user.pass) {
        return unauthorized(res);
      };

      if (user.name === username && user.pass === password) {
        return next();
      } else {
        return unauthorized(res);
      }
    };
  }

  /**
   * keep bot alive if runtime environment is heroku
   */
  setupHeroku(robot) {
    let herokuUrl = process.env.HEROKU_URL;

    if (herokuUrl) {
      if (!/\/$/.test(herokuUrl)) {
        herokuUrl += '/';
      }
      setInterval(() => {
        HttpClient.create(herokuUrl + 'hubot/ping')
          .post((err, res, body) => {
            robot.logger.info('keep alive ping!');
          });
      }, 5 * 60 * 1000);
    }
  }
}

export {
  ExpressRouter,
  NullRouter
};
