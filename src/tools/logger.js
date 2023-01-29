const fs = require("fs");
const chalk = require("chalk");

class Logger {
  constructor() {
    this._folder = null;
    this._verbose = true;
    this._logger = true;
  }
  setVerbose(_verbose) {
    this._verbose = _verbose;
  }
  setLogger(_logger) {
    this._logger = _logger;
  }
  setFolder(_folder) {
    this._folder = _folder;
  }
  createDepFolder() {
    return new Promise((resolve, reject) => {
      try {
        const root = process.cwd();
        const folder = `${root}/.dep`;
        if (!fs.existsSync(folder)) {
          fs.mkdirSync(folder);
        }
        resolve(folder);
      } catch(e) {
        reject(e);
      }
    });
  }
  initFile() {
    const root = process.cwd();
    const folder = this._folder || `${root}/.dep`;
    const filename = `${folder}/deployer.log`;
    fs.existsSync(filename, (exists) => {
      if (!exists) {
        fs.writeFile(filename, "", { flag: 'rwx' }, function (err) {
          if (err) throw err;
        });
      }
    });
    return filename;
  }
  log(type, message) {
    if (this._verbose) {
      const typePrefix = `[${type}]`;
      const messageString = JSON.stringify(message);
      switch(type) {
        case 'info':
        default:
          console.log(chalk.cyan(typePrefix), messageString);
          // console.log({type: "[info]", message: message});
          break;
        case 'warning':
          console.log(chalk.yellow(typePrefix), messageString);
          break;
        case 'error':
          // console.log({type: "[err]", message: message});
          console.log(chalk.red(typePrefix), messageString);
          break;
        case 'success':
          // console.log({type: "[success]", message: message});
          console.log(chalk.green(typePrefix), messageString);
          break;
      }
    }
    if (this._logger) {
      const logFile = this.initFile();
      const text = JSON.stringify(message);
      // console.log(logFile, text);
      fs.appendFile(logFile, `[${type}] ${text}\r\n`, (err) => {
        if (err) {
          console.log(err);
        }
        else {
          fs.readFileSync(logFile, "utf8");
        }
      });
    }
  }
  success(message) {
    this.log('success', message);
  }
  info(message) {
    this.log('info', message);
  }
  warn(message) {
    this.log('warning', message);
  }
  error(message) {
    this.log('error', message);
  }

}

module.exports = Logger;
