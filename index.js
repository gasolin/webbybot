'use strict';
import User from './src/user';
import Brain from './src/brain';
import Robot from './src/robot';
import Adapter from './src/adapter';
import Response from './src/response';
import {
  Listener,
  TextListener,
} from './src/listener';
import {
  Message,
  TextMessage,
  EnterMessage,
  LeaveMessage,
  TopicMessage,
  CatchAllMessage,
} from './src/message';

export {
  User,
  Brain,
  Robot,
  Adapter,
  Response,
  Listener,
  TextListener,
  Message,
  TextMessage,
  EnterMessage,
  LeaveMessage,
  TopicMessage,
  CatchAllMessage,
};

export function loadBot(adapterPath, adapterName,
  enableHttpd, botName, botAlias) {
  return new Robot(adapterPath, adapterName, enableHttpd, botName, botAlias);
};
