#!/usr/bin/env node
'use strict';
var Path = require('path');
var Fs = require('fs');
var OptParse = require('optparse');
var Webby = require('./index');

var Switches = [
  [ '-a', '--adapter ADAPTER', 'The Adapter to use'],
  [ '-v', '--version',         'Displays the version of webby installed']
];

var adapter =  process.env.HUBOT_ADAPTER || 'shell';
var Options = {
  adapter: adapter
};

var Parser = new OptParse.OptionParser(Switches);
Parser.banner = 'Usage webby [options]';

Parser.on('adapter', function(opt, value) {
  console.log('Set adapter as ' + value);
  Options.adapter = value;
});

Parser.on('version', function(opt, value) {
  Options.version = true;
});

Parser.parse(process.argv);

var robot = Webby.loadBot(null, Options.adapter, true, 'Webby', false);

if (Options.version) {
  console.log(robot.version);
  process.exit(0);
}

var loadScripts = function() {
  var scriptsPath = Path.resolve('.', 'scripts');
  robot.load(scriptsPath);

  scriptsPath = Path.resolve('.', 'src', 'scripts');
  robot.load(scriptsPath);

  var hubotScripts = Path.resolve('.', 'hubot-scripts.json');
  if (Fs.existsSync(hubotScripts)) {
    var data = Fs.readFileSync(hubotScripts);
    if (data.length > 0) {
      try {
        var scripts = JSON.parse(data);
        var scriptsPath = Path.resolve('node_modules', 'hubot-scripts', 'src',
          'scripts');
        robot.loadHubotScripts(scriptsPath, scripts);
      } catch (err) {
        console.error('Error parsing JSON data from hubot-scripts.json: ' +
          err);
        process.exit(1);
      }
    }
  }

  var externalScripts = Path.resolve('.', 'external-scripts.json');
  if (Fs.existsSync(externalScripts)) {
    Fs.readFile(externalScripts, function(err, data) {
      if (data.length > 0) {
        var scripts;
        try {
          scripts = JSON.parse(data);
        } catch (error) {
          console.error('Error parsing JSON data from external-scripts.json: ' +
            error);
          process.exit(1);
        }
        robot.loadExternalScripts(scripts);
      }
    });
  }
};

// execute
robot.adapter.once('connected', loadScripts);
robot.run();
