#!/usr/bin/env node
'use strict';
var Path = require('path');
var Fs = require('fs');
var Webby = require('./index');

var robot = Webby.loadBot(null, 'shell', true, 'Webby', false);

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
