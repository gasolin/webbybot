var fs = require('fs');
var readline = require('readline');
var stream = require('stream');
var cline = require('cline');
var chalk = require('chalk');
var Robot = require('../robot');
var Adapter = require('../adapter');
var TextMessage = require('../message').TextMessage;

let historySize = process.env.HUBOT_SHELL_HISTSIZE != null ?
  parseInt(process.env.HUBOT_SHELL_HISTSIZE) : 1024;

let historyPath = '.hubot_history';

class Shell extends Adapter {
  send(envelope, ...strings) {
    for (let str in strings) {
      if (strings.hasOwnProperty(str)) {
        console.log(chalk.bold(str));
      }
    }
  }

  emote(envelope, ...strings) {
    for (let str in strings) {
      if (strings.hasOwnProperty(str)) {
        this.send(envelope, '* ' + str);
      }
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
    this.loadHistory(() => {
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
      let userId = process.env.HUBOT_SHELL_USER_ID || '1';
      if (userId.match(/\A\d+\z/)) {
        userId = parseInt(userId);
      }
      let userName = process.env.HUBOT_SHELL_USER_NAME || 'Shell';
      let user = this.robot.brain.userForId(userId, {
        name: userName,
        room: 'Shell'
      });
      this.receive(new TextMessage(user, input, 'messageId'));
    });

    this.cli.command('history', () => {
      let ref = this.cli.history();
      let results = [];
      ref.forEach(function(item) {
        results.push(console.log(item));
      });
      return results;
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
        history.forEach(function(item) {
          outstream.write(item + '\n');
        });
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
 *Private: load history from .hubot_history.
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
