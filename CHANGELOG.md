v3.2.1 (2016/5/18)
========
* return router instance of server
* move adapterPath as parameter of loadAdapter
* support set default adapter via WEBBY_CURRENT_ADAPTER environment parameter

v3.1.2 (2016/5/7)
========
* use shx for cross platform npm script
* sync with hubot 2.19

v3.1.1 (2016/4/19)
========
* migrate to express 4
* support EXPRESS_XPOWEREDBY environment parameter to disable X-Powered-By header

v3.0.1 (2016/4/13)
========
* remove dependency of babel-plugin-add-module-exports
* port index.js to module import syntax
* fix jsdoc

v3.0.0 (2016/4/6)
========
* add webby-template as a working webby bot sample
* add webby-plugin and docs for write plugin with plain js
* add back from hubot: keep heroku alive setup in express router
* move express and null router setup to router.js
* add gitter badge and forum

v0.3.0 (2016/3/30)
========
* update template usage
* support .env file for environment variables
* move to MIT license
* add release script

v0.2.3 (2016/3/24)
========
* use hubot-mockadapter instead of hubot-mock-adapter
* add more unit tests to increase test coverage
* add .editorconfig for source convention
* fix some 'flag undefined' bug #56

v0.2.0 (2016/3/17)
========

* Use es6 module with import and export
* Use ES6 for..of loop to replace forEach and for..in loop
* replace var to let
* Update dependency library versions
* Convert .eslintrc to json format
* Add test coverage and npm version badges
* provide webbybot demo template https://github.com/gasolin/webby_template

v0.1.6 (2016/3/10)
========

* Support switch adapter via commandline or ENV param
* Use ES6 for..of loop to replace forEach and for..in loop #37
* Support ES6 module export
* Publish to npm
* Add How to replace Hubot to Webbybot guide

v0.1 (2016/3/4)
========

* Port hubot from coffeescript to es6 (plain JS) with babel.
* Auto continue integration with Travis CI.
* Auto linting with eslint.
* Still support hubot plugins written in coffeescript.
