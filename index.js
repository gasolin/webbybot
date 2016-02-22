var Path = require('path');
var Fs = require('fs');

var User = require('./src/user');
var Brain = require('./src/brain');
var Robot = require('./src/robot');
var Adapter = require('./src/adapter');
var Response = require('./src/response');
// var ref = require('./listener');
var ref = {Listener: {}, TextListener: {}};
var Listener = ref.Listener;
var TextListener = ref.TextListener;
var ref1 = require('./src/message');
var Message = ref1.Message;
var TextMessage = ref1.TextMessage;
var EnterMessage = ref1.EnterMessage;
var LeaveMessage = ref1.LeaveMessage;
var TopicMessage = ref1.TopicMessage;
var CatchAllMessage = ref1.CatchAllMessage;

module.exports = {
  User: User,
  Brain: Brain,
  Robot: Robot,
  Adapter: Adapter,
  Response: Response,
  Listener: Listener,
  TextListener: TextListener,
  Message: Message,
  TextMessage: TextMessage,
  EnterMessage: EnterMessage,
  LeaveMessage: LeaveMessage,
  TopicMessage: TopicMessage,
  CatchAllMessage: CatchAllMessage,
};

module.exports.loadBot = function(adapterPath, adapterName,
  enableHttpd, botName, botAlias) {
  return new Robot(adapterPath, adapterName, enableHttpd, botName, botAlias);
};

var robot = module.exports.loadBot(null, 'shell', true, 'Webby', false);
var loadScripts = function() {
  let scriptsPath = Path.resolve('.', 'scripts');
  robot.load(scriptsPath);
  scriptsPath = Path.resolve('.', 'src', 'scripts');
  robot.load(scriptsPath);
  let externalScripts = Path.resolve('.', 'external-scripts.json');
  if (Fs.existsSync(externalScripts)) {
    Fs.readFile(externalScripts, function(err, data) {
      if (data.length > 0) {
        let scripts;
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
