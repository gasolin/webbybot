'use strict';

class User {
  constructor(id, options = {}) {
    var k;
    this.id = id;
    for (k in options || {}) {
      this[k] = options[k];
    }
    this['name'] || (this['name'] = this.id.toString());
  }
}

module.exports = User
