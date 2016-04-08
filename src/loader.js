import * as Fs from 'fs';
import * as Path from 'path';

const WEBBY_DOCUMENTATION_SECTIONS = [
  'description',
  'dependencies',
  'configuration',
  'commands',
  'notes',
  'author',
  'authors',
  'examples',
  'tags',
  'urls'
];

class Loader {
  /**
   * Public: provide variable way to load and parse hubot scripts.
   *
   * @params {object} robot   - A Robot instance.
   */
  constructor(robot) {
    this.robot = robot;
  }

  /**
   * Public: Loads a file in path.
   *
   * path - A String path on the filesystem.
   * file - A String filename in path on the filesystem.
   *
   * Returns nothing.
   */
  loadFile(path, file) {
    let ext = Path.extname(file);
    let fullPath = Path.join(path, Path.basename(file, ext));
    if (require.extensions[ext]) {
      let script;
      try {
        script = require(fullPath);
        if (typeof script === 'function') {
          script(this);
          this.parseHelp(Path.join(path, file));
        } else {
          this.robot.logger.warning(`Expected ${fullPath}
             to assign a function to module.exports, got ${typeof script}`);
        }
      } catch (error) {
        this.robot.logger.error(`Unable to load ${fullPath}: ${error.stack}`);
        process.exit(1);
      }
    }
  }

  /**
   * Public: Loads every script in the given path.
   *
   * @params {string} path - A String path on the filesystem.
   *
   * Returns nothing.
   */
  load(path) {
    this.robot.logger.debug(`Loading scripts from ${path}`);
    if (Fs.existsSync(path)) {
      let ref = Fs.readdirSync(path).sort();
      for (let file of ref) {
        this.loadFile(path, file);
      }
    }
  }

  /**
   * Private: load help info from a loaded script.
   *
   * @params {string} path - A String path to the file on disk.
   *
   * Returns nothing.
   */
  parseHelp(path) {
    this.robot.logger.debug(`Parsing help for ${path}`);
    let scriptName = Path.basename(path).replace(/\.(coffee|js)$/, '');
    let scriptDocumentation = {};
    let body = Fs.readFileSync(path, 'utf-8');
    let currentSection;
    let ref = body.split('\n');
    for (let line of ref) {
      if (!(line[0] === '#' || line.substr(0, 2) === '//')) {
        break;
      }
      let cleanedLine = line.replace(/^(#|\/\/)\s?/, '').trim();
      if (cleanedLine.length === 0) {
        continue;
      }
      if (cleanedLine.toLowerCase() === 'none') {
        continue;
      }
      let nextSection = cleanedLine.toLowerCase().replace(':', '');
      if (WEBBY_DOCUMENTATION_SECTIONS.indexOf(nextSection) >= 0) {
        currentSection = nextSection;
        scriptDocumentation[currentSection] = [];
      } else {
        if (currentSection) {
          scriptDocumentation[currentSection].push(cleanedLine.trim());
          if (currentSection === 'commands') {
            this.robot.commands.push(cleanedLine.trim());
          }
        }
      }
    }
  }

  /**
   * Public: Load scripts specified in the `hubot-scripts.json` file.
   *
   * path    - A String path to the hubot-scripts files.
   * scripts - An Array of scripts to load.
   *
   * Returns nothing.
   */
  loadHubotScripts(path, scripts) {
    this.robot.logger.debug(`Loading hubot-scripts from ${path}`);
    for (let script of scripts) {
      this.loadFile(path, script);
    }
  }

  /**
   * Public: Load scripts from packages specified in the
   * `external-scripts.json` file.
   *
   * @params packages - An Array of packages containing hubot scripts to load.
   *
   * Returns nothing.
   */
  loadExternalScripts(packages) {
    this.robot.logger.debug('Loading external-scripts from npm packages');
    try {
      if (packages instanceof Array) {
        for (let pkg of packages) {
          require(pkg)(this.robot);
        }
      } else {
        for (let pkg of packages) {
          require(pkg)(this.robot, packages[pkg]);
        }
      }
    } catch(error) {
      this.robot.logger.error(
        `Error loading scripts from npm package - ${error.stack}`);
      process.exit(1);
    }
  }
}

export default Loader;
