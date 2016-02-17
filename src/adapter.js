'use strict';

var EventEmitter = require('events').EventEmitter;

class Adapter extends EventEmitter {
  constructor(robot) {
    super();
    this.robot = robot;
  }

  /**
   * Public: Raw method for sending data back to the chat source. Extend this.
   *
   * @params {object} envelope - A Object with message, room and user details.
   * @params {string} strings  - One or more Strings for each message to send.
   *
   * Returns nothing.
   */
  send(envelope, ...strings) {
    this.envelope = envelope;
    this.strings = strings;
  }

  /**
   * Public: Raw method for sending emote data back to the chat source.
   * Defaults as an alias for send
   *
   * @params {object} envelope - A Object with message, room and user details.
   * @params {string} strings  - One or more Strings for each message to send.
   *
   * Returns nothing.
   */
  emote(envelope, ...strings) {
    this.envelope = envelope;
    this.strings = strings;
    this.send(envelope, ...strings);
  }

  /**
   * Public: Raw method for building a reply and sending it back to the chat
   * source. Extend this.
   *
   * @params {object} envelope - A Object with message, room and user details.
   * @params {string} strings  - One or more Strings for each message to send.
   *
   * Returns nothing.
   */
  reply(envelope, ...strings) {
    this.envelope = envelope;
    this.strings = strings;
  }

  /**
   * Public: Raw method for setting a topic on the chat source. Extend this.
   *
   * @params {object} envelope - A Object with message, room and user details.
   * @params {string} strings  - One or more Strings for each message to send.
   *
   * Returns nothing.
   */
  topic(envelope, ...strings) {
    this.envelope = envelope;
    this.strings = strings;
  }

  /**
   * Public: Raw method for playing a sound in the chat source. Extend this.
   *
   * @params {object} envelope - A Object with message, room and user details.
   * @params {string} strings  - One or more Strings for each message to send.
   *
   * Returns nothing.
   */
  play(envelope, ...strings) {
    this.envelope = envelope;
    this.strings = strings;
  }

  /**
   * Public: Raw method for invoking the bot to run. Extend this.
   *
   * Returns nothing.
   */
  run() {}

  /**
   * Public: Raw method for shutting the bot down. Extend this.
   *
   * Returns nothing.
   */
  close() {}

  /**
   * Public: Dispatch a received message to the robot.
   *
   * Returns nothing.
   */
  receive(message) {
    this.robot.receive(message);
  }

  /**
   * @deprecated
   * Public: Get an Array of User objects stored in the brain.
   *
   * Returns an Array of User objects.
   */
  users() {
    this.robot.logger.warning(
      'users() is deprecated, use robot.brain.users()');
  }

  /**
   * @deprecated
   * Public: Get a User object given a unique identifier.
   *
   * Returns a User instance of the specified user.
   */
  userForId(id, options) {
    this.robot.logger.warning(
      'userForId() is deprecated, use robot.brain.userForId()');
  }

  /**
   * @deprecated
   * Public: Get a User object given a name.
   *
   * Returns a User instance for the user with the specified name.
   */
  userForName(name) {
    this.robot.logger.warning(
      'userForName() is deprecated, use robot.brain.userForName()');
  }

  /**
   * @deprecated
   * Public: Get all users whose names match fuzzyName. Currently, match
   * means 'starts with', but this could be extended to match initials,
   * nicknames, etc.
   *
   * Returns an Array of User instances matching the fuzzy name.
   */
  usersForRawFuzzyName(name) {
    this.robot.logger.warning(
      'usersForRawFuzzyName() is deprecated, use robot.brain.usersForRawFuzzyName()');
  }

  /**
   * @deprecated
   * Public: If fuzzyName is an exact match for a user, returns an array with
   * just that user. Otherwise, returns an array of all users for which
   * fuzzyName is a raw fuzzy match (see usersForRawFuzzyName).
   *
   * Returns an Array of User instances matching the fuzzy name.
   */
  usersForFuzzyName(name) {
    this.robot.logger.warning(
     'usersForFuzzyName() is deprecated, use robot.brain.usersForFuzzyName()');
  }

  /**
   * @deprecated
   * Public: Creates a scoped http client with chainable methods for
   * modifying the request. This doesn't actually make a request though.
   * Once your request is assembled, you can call `get()`/`post()`/etc to
   * send the request.
   *
   * Returns a ScopedClient instance.
   */
  http(url) {
    this.robot.logger.warning(
      'http() is deprecated, use robot.http()');
  }
}

module.exports = Adapter;
