/**
 * Represents an incoming message from the chat.
 *
 * @param {object} user A User instance that sent the message.
 * @param {boolean} done completed message
 */
class Message {
  constructor(user, done = false) {
    this.user = user;
    this.room = user.room;
    this.done = done ? true : false;
  }

  /**
   * Indicates that no other Listener should be called on this object.
   */
  finish() {
    this.done = true;
  }
}

/**
 * Represents an incoming message from the chat.
 * @param {object} user - A User instance that sent the message.
 * @param {string} text - A String message.
 * @param {string} id   - A String of the message ID.
 */
class TextMessage extends Message {
  constructor(user, text, id) {
    super(user);
    this.text = text;
    this.id = id;
  }

  /**
   * Determines if the message matches the given regex.
   * @param {string} regex - A Regex to check.
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
 * @param {object} user - A User instance for the user who entered.
 * @param {string} text - Always null.
 * @param {string} id   - A String of the message ID.
 */
class EnterMessage extends Message {}

/**
 * Represents an incoming user exit notification.
 * @param {object} user - A User instance for the user who left.
 * @param {string} text - Always null.
 * @param {string} id   - A String of the message ID.
 */
class LeaveMessage extends Message {}

/**
 * Represents an incoming topic change notification.
 * @param {object} user - A User instance for the user who changed the topic.
 * @param {string} text - A String of the new topic.
 * @param {string} id   - A String of the message ID.
 */
class TopicMessage extends Message {}

/**
 * Represents a message that no matchers matched.
 * @param {object} message - The original message.
 */
class CatchAllMessage extends Message {
  constructor(message) {
    super(message.user);
    this.message = message;
  }
}

export {
  Message,
  TextMessage,
  EnterMessage,
  LeaveMessage,
  TopicMessage,
  CatchAllMessage
};
