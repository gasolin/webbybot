'use strict';

class User {
  constructor(id, options = {}) {
    this.id = id;
    for (let k in options || {}) {
      if (options.hasOwnProperty(k)) {
        this[k] = options[k];
      }
    }
    this['name'] || (this['name'] = this.id.toString());
  }
}

export default User;
