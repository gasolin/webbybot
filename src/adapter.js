import {EventEmitter} from 'events';

class Adapter extends EventEmitter {
  constructor(robot) {
    super();
    this.robot = robot;
  }

  /**
   * Public: Raw method for sending data back to the chat source. Extend this.
   *
   * @param {object} envelope - A Object with message, room and user details.
   * @param {string} strings  - One or more Strings for each message to send.
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
   * @param {object} envelope - A Object with message, room and user details.
   * @param {string} strings  - One or more Strings for each message to send.
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
   * @param {object} envelope - A Object with message, room and user details.
   * @param {string} strings  - One or more Strings for each message to send.
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
   * @param {object} envelope - A Object with message, room and user details.
   * @param {string} strings  - One or more Strings for each message to send.
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
   * @param {object} envelope - A Object with message, room and user details.
   * @param {string} strings  - One or more Strings for each message to send.
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
}

export default Adapter;
