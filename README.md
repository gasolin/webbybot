# Webbybot

[![Build Status](https://travis-ci.org/gasolin/webby.png)](https://travis-ci.org/gasolin/webbybot) [![codecov.io](https://codecov.io/github/gasolin/webbybot/coverage.svg?branch=master)](https://codecov.io/github/gasolin/webbybot?branch=master) [![Dependency Status](https://david-dm.org/gasolin/webbybot.svg)](https://david-dm.org/gasolin/webbybot) [![npm](https://img.shields.io/npm/v/webbybot.svg)](https://www.npmjs.com/package/webbybot)

Webbybot is ported from [Hubot](https://github.com/github/hubot) project by Github.

The Differences:

* Port hubot from coffeescript to es6 (plain JS) with babel.
* Auto continue integration with Travis CI.
* Auto linting with eslint.

The Same:

* Still support hubot plugins written in coffeescript.
* Can reuse all hubot adapters*

# How to try Webbybot

```
$ git clone https://github.com/gasolin/webby_template.git demo
$ cd demo
$ npm install
$ ./bin/webby
```

# How to replace Hubot to Webbybot

Refer to [Getting Started With Hubot](https://hubot.github.com/docs/),
Install hubot generator first

```
npm install -g yo generator-hubot
```

Then generate your robot with
```
yo hubot
```

1. Enter the folder, edit `bin/hubot` and replace `hubot` to `webby`.

2. install webbybot package

```
npm install --save webbybot
```

3. modify adapter's dependency

Let's take telegram adapter for example. Edit `node_modules/hubot-telegram/src/telegram.coffee` and replace first line `require 'hubot'` to `require 'webbybot'`.

start your bot as normal

```
./bin/hubot
```

Tested with `hubot-telegram` and `hubot-messenger`.

# Development

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
$ node ./bin/webby
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
