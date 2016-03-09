'use strict';
let fs = require('fs');
let readline = require('readline');
let stream = require('stream');
let cline = require('cline');
let chalk = require('chalk');

let Robot = require('../robot');
let Adapter = require('../adapter');
let TextMessage = require('../message').TextMessage;

let historySize = process.env.WEBBY_SHELL_HISTSIZE != null ?
  parseInt(process.env.WEBBY_SHELL_HISTSIZE) : 1024;

let historyPath = '.webby_history';

console.log('shell adapter loaded');

class Shell extends Adapter {
  send(envelope, ...strings) {
    for (let str of strings) {
      console.log(chalk.bold(str));
    }
  }

  emote(envelope, ...strings) {
    for (let str of strings) {
      this.send(envelope, '* ' + str);
    }
  }

  reply(envelope, ...strings) {
    strings = strings.map(function(s) {
      return envelope.user.name + ': ' + s;
    });
    return this.send(envelope, strings);
  }

  run() {
    this.buildCli();
    loadHistory((history) => {
      this.cli.history(history);
      this.cli.interact(this.robot.name + '> ');
      this.emit('connected');
    });
  }

  shutdown() {
    this.robot.shutdown();
    process.exit(0);
  }

  buildCli() {
    this.cli = cline();
    this.cli.command('*', (input) => {
      let userId = process.env.WEBBY_SHELL_USER_ID || '1';
      if (userId.match(/\A\d+\z/)) {
        userId = parseInt(userId);
      }
      let userName = process.env.WEBBY_SHELL_USER_NAME || 'Shell';
      let user = this.robot.brain.userForId(userId, {
        name: userName,
        room: 'Shell'
      });
      this.receive(new TextMessage(user, input, 'messageId'));
    });

    this.cli.command('history', () => {
      let ref = this.cli.history();
      for (let item of ref) {
        console.log(item);
      }
    });

    this.cli.on('history', (item) => {
      if (item.length > 0 && item !== 'exit' && item !== 'history') {
        return fs.appendFile(historyPath, item + '\n', (err) => {
          if (err) {
            return this.robot.emit('error', err);
          }
        });
      }
    });

    this.cli.on('close', () => {
      let history = this.cli.history();
      if (history.length > historySize) {
        let startIndex = history.length - historySize;
        history = history.reverse().splice(startIndex, historySize);
        let outstream = fs.createWriteStream(historyPath);
        outstream.on('finish', () => {
          return this.shutdown();
        });
        for (let item of history) {
          outstream.write(item + '\n');
        }
        outstream.end(() => {
          this.shutdown();
        });
      } else {
        this.shutdown();
      }
    });
  }
}

/**
 *Private: load history from .webby_history.
 *
 * callback - A Function that is called with the loaded history items (or an empty array if there is no history)
 */
var loadHistory = function(callback) {
  return fs.exists(historyPath, function(exists) {
    if (exists) {
      let instream = fs.createReadStream(historyPath);
      let outstream = new stream;
      outstream.readable = true;
      outstream.writable = true;
      let items = [];
      let rl = readline.createInterface({
        input: instream,
        output: outstream,
        terminal: false
      });
      rl.on('line', function(line) {
        line = line.trim();
        if (line.length > 0) {
          return items.push(line);
        }
      });
      rl.on('close', function() {
        callback(items);
      });
    } else {
      callback([]);
    }
  });
};

exports.use = function(robot) {
  return new Shell(robot);
};
