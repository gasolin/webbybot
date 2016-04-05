import express from 'express';
import multipart from 'connect-multiparty';
import * as HttpClient from 'scoped-http-client';

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
      get: () => {
        robot.logger.warning(msg);
      },
      post: () => {
        robot.logger.warning(msg);
      },
      put: () => {
        robot.logger.warning(msg);
      },
      delete: () => {
        robot.logger.warning(msg);
      }
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

    let app = express();

    app.use((req, res, next) => {
      res.setHeader('X-Powered-By', 'webby/' + robot.name);
      next();
    });

    if (user && pass) {
      app.use(express.basicAuth(user, pass));
    }
    app.use(express.query());

    app.use(express.json());
    app.use(express.urlencoded());
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
