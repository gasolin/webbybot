#!/usr/bin/env node
var Path = require('path');
var Fs = require('fs');
var Webby = require('./index');

var robot = Webby.loadBot(null, 'shell', true, 'Webby', false);

var loadScripts = function() {
  var scriptsPath = Path.resolve('.', 'scripts');
  robot.load(scriptsPath);
  scriptsPath = Path.resolve('.', 'src', 'scripts');
  robot.load(scriptsPath);
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
        return robot.loadExternalScripts(scripts);
      }
    });
  }
};

// execute
robot.adapter.once('connected', loadScripts);
robot.run();
