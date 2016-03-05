# Webbybot

[![Build Status](https://travis-ci.org/gasolin/webby.png)](https://travis-ci.org/gasolin/webbybot) [![Dependency Status](https://david-dm.org/gasolin/webbybot.svg)](https://david-dm.org/gasolin/webbybot)

Webbybot is ported from [Hubot](https://github.com/github/hubot) project by Github.

The differences:

* Port hubot from coffeescript to es6 (plain JS) with babel.
* Auto continue integration with Travis CI.
* Auto linting with eslint.
* Still support hubot plugins written in coffeescript.

## Setup Development

```
$ npm install -g mocha
```

## Build

run command

```
$ npm run build
```

## Add plugins

```
$ npm install hubot-calculator hubot-diagnostics
```

Add external-scripts.json file which contain:

```
[
  "hubot-diagnostics",
  "hubot-calculator"
]
```

## Run

run command

```
$ node ./bin/webby.js
webby > ping
webby > PONG
webby > echo hello
webby > hello
webby > webby calc 1 + 1
webby > 2
```

## Test

```
$ npm test
```

## Lint
```
$ npm run lint
```
