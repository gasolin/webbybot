'use strict';

var expect = require('chai').expect;
var User = require('../src/user');

describe('User', function() {
  return describe('new', function() {
    it('uses id as the default name', function() {
      var user;
      user = new User('hubot');
      return expect(user.name).to.equal('hubot');
    });
    it('sets attributes passed in', function() {
      var user;
      user = new User('hubot', {
        foo: 1,
        bar: 2
      });
      expect(user.foo).to.equal(1);
      return expect(user.bar).to.equal(2);
    });
    return it('uses name attribute when passed in, not id', function() {
      var user;
      user = new User('hubot', {
        name: 'tobuh'
      });
      return expect(user.name).to.equal('tobuh');
    });
  });
});
