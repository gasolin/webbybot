'use strict';

class User {
  constructor(id, options = {}) {
    this.id = id;
    let ref = options || {};
    for (let key of Object.keys(ref)) {
      this[key] = options[key];
    }
    this['name'] || (this['name'] = this.id.toString());
  }
}

module.exports = User;
