'use strict';

class Response {
  /**
   * Public: Responses are sent to matching listeners. Messages know about the
   * content and user that made the original message, and how to reply back to
   * them.
   *
   * @params {object} robot   - A Robot instance.
   * @params {object} message - A Message instance.
   * @params {object} match   - A Match object from the successful Regex match.
   */
  constructor(robot, message, match) {
    this.robot = robot;
    this.message = message;
    this.match = match;
    this.envelope = {
      room: this.message.room,
      user: this.message.user,
      message: this.message
    };
  }

  /**
   * Public: Posts a message back to the chat source
   *
   * @params {...string} strings - One or more strings to be posted. The order of these strings
   *           should be kept intact.
   *
   * Returns nothing.
   */
  send(...strings) {
    this.runWithMiddleware('send', {plaintext: true}, ...strings);
  }

  /**
   * Public: Posts an emote back to the chat source
   *
   * @params {...string} strings - One or more strings to be posted. The order of these strings
   *           should be kept intact.
   *
   * Returns nothing.
   */
  emote(...strings) {
    this.runWithMiddleware('emote', {plaintext: true}, ...strings);
  }

  /**
   * Public: Posts a message mentioning the current user.
   *
   * @params {...string} strings - One or more strings to be posted. The order of these strings
   *           should be kept intact.
   *
   * Returns nothing.
   */
  reply(...strings) {
    this.runWithMiddleware('reply', {plaintext: true}, ...strings);
  }

  /**
   * Public: Posts a topic changing message
   *
   * @params {...string} strings - One or more strings to set as the topic of the
   *           room the bot is in.
   *
   * Returns nothing.
   */
  topic(...strings) {
    this.runWithMiddleware('topic', {plaintext: true}, ...strings);
  }

  /**
   * Public: Play a sound in the chat source
   *
   * @params {...string} strings - One or more strings to be posted as sounds to play. The order of
   *           these strings should be kept intact.
   *
   * Returns nothing.
   */
  play(...strings) {
    this.runWithMiddleware('play', ...strings);
  }

  /**
   * Public: Posts a message in an unlogged room
   *
   * @params {...string} strings - One or more strings to be posted. The order of these strings
   *           should be kept intact.
   *
   * Returns nothing.
   */
  locked(...strings) {
    this.runWithMiddleware('locked', {plaintext: true}, ...strings);
  }

  /**
   * Private: Call with a method for the given strings using response
   * middleware.
   */
  runWithMiddleware(methodName, opts, ...strings) {
    let callback = undefined;
    let copy = strings.slice(0);
    if (typeof copy[copy.length - 1] === 'function') {
      callback = copy.pop();
    }
    let context = {response: this, strings: copy, method: methodName};
    context.plaintext = opts.plaintext && opts.plaintext === true;
    let responseMiddlewareDone = () => {};
    let runAdapterSend = (_, done) => {
      let result = context.strings;
      callback && result.push(callback);
      this.robot.adapter[methodName](this.envelope, ...result);
      done();
    };
    this.robot.middleware.response.execute(context,
                                           runAdapterSend,
                                           responseMiddlewareDone);
  }

  /**
   * Public: Picks a random item from the given items.
   *
   * @params {object[]} items - An Array of items.
   *
   * @return {object} A random item.
   */
  random(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  /**
   * Public: Tell the message to stop dispatching to listeners
   *
   * Returns nothing.
   */
  finish() {
    this.message.finish();
  }

  /**
   * Public: Creates a scoped http client with chainable methods for
   * modifying the request. This doesn't actually make a request though.
   * Once your request is assembled, you can call `get()`/`post()`/etc to
   * send the request.
   *
   * @return {object} A ScopedClient instance.
   */
  http(url, options) {
    return this.robot.http(url, options);
  }
}

export default Response;
