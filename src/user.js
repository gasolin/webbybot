'use strict';

class User {
  constructor(id, options = {}) {
    var k;
    this.id = id;
    for (k in options || {}) {
      if (options.hasOwnProperty(k)) {
        this[k] = options[k];
      }
    }
    this['name'] || (this['name'] = this.id.toString());
  }
}

module.exports = User;
