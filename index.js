'use strict';
var User = require('./src/user');
var Brain = require('./src/brain');
var Robot = require('./src/robot');
var Adapter = require('./src/adapter');
var Response = require('./src/response');
var ref = require('./src/listener');
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
