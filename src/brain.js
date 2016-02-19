'use strict';

var EventEmitter = require('events').EventEmitter;
var User = require('./user');

class Brain extends EventEmitter {
  /**
   * Represents somewhat persistent storage for the robot. Extend this.
   *
   * Returns a new Brain with no external storage.
   */
  constructor(robot) {
    super();
    this.data = {
      users: {},
      _private: {}
    };
    this.autoSave = true;

    return robot.on('running', () => {
      this.resetSaveInterval(5);
    });
  }

  /**
   * Public: Store key-value pair under the private namespace and extend
   * existing @data before emitting the 'loaded' event.
   *
   * Returns the instance for chaining.
   */
  set(key, value) {
    let pair;
    if (key === Object(key)) {
      Object.keys(key).forEach((item) => {
        this.data._private[item] = key[item];
      });
    } else {
      this.data._private[key] = value;
    }
    this.emit('loaded', this.data);
    return this;
  }

  /**
   * Public: Get value by key from the private namespace in this.data
   * or return null if not found.
   *
   * Returns the value.
   */
  get(key) {
    let ref;
    return (ref = this.data._private[key]) != null ? ref : null;
  }

  /**
   * Public: Remove value by key from the private namespace in this.data
   * if it exists.
   *
   * Returns the instance for chaining.
   */
  remove(key) {
    if (this.data._private[key] != null) {
      delete this.data._private[key];
    }
    return this;
  }

  /**
   * Public: Emits the 'save' event so that 'brain' scripts can handle
   * persisting.
   *
   * Returns nothing.
   */
  save() {
    this.emit('save', this.data);
  }

  /**
   * Public: Emits the 'close' event so that 'brain' scripts can handle closing.
   *
   * Returns nothing.
   */
  close() {
    clearInterval(this.saveInterval);
    this.save();
    this.emit('close');
  }

  /**
   * Public: Enable or disable the automatic saving
   *
   * @params {boolean} enabled - A boolean whether to autosave or not
   *
   * Returns nothing
   */
  setAutoSave(enabled) {
    this.autoSave = enabled;
  }

  /**
   * Public: Reset the interval between save function calls.
   *
   * @params {integer} seconds - An Integer of seconds between saves.
   *
   * Returns nothing
   */
  resetSaveInterval(seconds) {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
    }
    this.saveInterval = setInterval(() => {
      if (this.autoSave) {
        return this.save();
      }
    }, seconds * 1000);
  }

  /**
   * Public: Merge keys loaded from a DB against the in memory representation.
   *
   * Caveats: Deeply nested structures don't merge well.
   *
   * Returns nothing
   */
  mergeData(data) {
    for (let k in data || {}) {
      if (data.hasOwnProperty(k)) {
        this.data[k] = data[k];
      }
    }
    this.emit('loaded', this.data);
  }

  /**
   * Public: Get an Array of User objects stored in the brain.
   *
   * Returns an Array of User objects.
   */
  users() {
    return this.data.users;
  }

  /**
   * Public: Get a User object given a unique identifier.
   *
   * Returns a User instance of the specified user.
   */
  userForId(id, options) {
    let user = this.data.users[id];
    if (!user) {
      user = new User(id, options);
      this.data.users[id] = user;
    }
    if (options && options.room && (!user.room || user.room !== options.room)) {
      user = new User(id, options);
      this.data.users[id] = user;
    }
    return user;
  }

  /**
   * Public: Get a User object given a name.
   *
   * Returns a User instance for the user with the specified name.
   */
  userForName(name) {
    let result = null;
    let userName;
    let lowerName = name.toLowerCase();
    let users = this.data.users;
    for (let k in users || {}) {
      if (users.hasOwnProperty(k)) {
        userName = users[k]['name'];
        if (userName != null &&
          userName.toString().toLowerCase() === lowerName) {
          result = users[k];
        }
      }
    }
    return result;
  }

  /**
   * Public: Get all users whose names match fuzzyName. Currently, match
   * means 'starts with', but this could be extended to match initials,
   * nicknames, etc.
   *
   * Returns an Array of User instances matching the fuzzy name.
   */
  usersForRawFuzzyName(fuzzyName) {
    let lowerFuzzyName = fuzzyName.toLowerCase();
    let ref = this.data.users || {};
    let results = [];
    let user;
    for (let key in ref) {
      if (ref.hasOwnProperty(key)) {
        user = ref[key];
        if (user.name.toLowerCase().lastIndexOf(lowerFuzzyName, 0) === 0) {
          results.push(user);
        }
      }
    }
    return results;
  }

  /**
   * Public: If fuzzyName is an exact match for a user, returns an array with
   * just that user. Otherwise, returns an array of all users for which
   * fuzzyName is a raw fuzzy match (see usersForRawFuzzyName).
   *
   * Returns an Array of User instances matching the fuzzy name.
   */
  usersForFuzzyName(fuzzyName) {
    let matchedUsers = this.usersForRawFuzzyName(fuzzyName);
    let lowerFuzzyName = fuzzyName.toLowerCase();
    let user;
    for (let i = 0, len = matchedUsers.length; i < len; i++) {
      user = matchedUsers[i];
      if (user.name.toLowerCase() === lowerFuzzyName) {
        return [user];
      }
    }
    return matchedUsers;
  }
}

module.exports = Brain;
