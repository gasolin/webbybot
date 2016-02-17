'use strict';

/**
 * Represents an incoming message from the chat.
 *
 * @params {object} user A User instance that sent the message.
 * @params {boolean} done completed message
 */
class Message {
  constructor(user, done) {
    this.user = user;
    this.room = user.room;
    this.done = done != null ? done : false;
  }

  /**
   * Indicates that no other Listener should be called on this object.
   */
  finish() {
    return this.done = true;
  }
}

/**
 * Represents an incoming message from the chat.
 * @params {object} user - A User instance that sent the message.
 * @params {string} text - A String message.
 * @params {string} id   - A String of the message ID.
 */
class TextMessage extends Message {
  constructor(user, text, id) {
    super(user);
    this.user = user;
    this.text = text;
    this.id = id;
  }

  /**
   * Determines if the message matches the given regex.
   * @params {string} regex - A Regex to check.
   *
   * Returns a Match object or null.
   */
  match(regex) {
    return this.text.match(regex);
  }

  /**
   * String representation of a TextMessage.
   *
   * Returns the message text
   */
   toString() {
     return this.text;
   }
}

/**
 * Represents an incoming user entrance notification.
 * @params {object} user - A User instance for the user who entered.
 * @params {string} text - Always null.
 * @params {string} id   - A String of the message ID.
 */
class EnterMessage extends Message {}

/**
 * Represents an incoming user exit notification.
 * @params {object} user - A User instance for the user who left.
 * @params {string} text - Always null.
 * @params {string} id   - A String of the message ID.
 */
class LeaveMessage extends Message {}

/**
 * Represents an incoming topic change notification.
 * @params {object} user - A User instance for the user who changed the topic.
 * @params {string} text - A String of the new topic.
 * @params {string} id   - A String of the message ID.
 */
class TopicMessage extends Message {}

/**
 * Represents a message that no matchers matched.
 * @params {object} message - The original message.
 */
class CatchAllMessage extends Message {
  constructor(message) {
    super(message.user);
    this.message = message;
  }
}

module.exports = {
  Message: Message,
  TextMessage: TextMessage,
  EnterMessage: EnterMessage,
  LeaveMessage: LeaveMessage,
  TopicMessage: TopicMessage,
  CatchAllMessage: CatchAllMessage
};
