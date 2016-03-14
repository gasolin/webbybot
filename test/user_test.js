/* eslint-env node, mocha */
import {expect} from 'chai';
// bot classes
let User = require('../src/user');

describe('User', function() {
  return describe('new', function() {
    it('uses id as the default name', function() {
      let user = new User('hubot');

      expect(user.name).to.equal('hubot');
    });

    it('sets attributes passed in', function() {
      let user = new User('hubot', {
        foo: 1,
        bar: 2
      });

      expect(user.foo).to.equal(1);
      expect(user.bar).to.equal(2);
    });

    it('uses name attribute when passed in, not id', function() {
      let user = new User('hubot', {
        name: 'tobuh'
      });

      expect(user.name).to.equal('tobuh');
    });
  });
});
