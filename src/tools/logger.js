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
      switch(type) {
        case 'info':
          console.log(chalk.white(message));
          break;
        case 'warning':
          console.log(chalk.yellow(message));
          break;
        case 'error':
          console.log(message);
          break;
        case 'success':
          console.log(message);
          break;
      }
    }
    if (this._logger) {
      const logFile = this.initFile();
      const text= JSON.stringify(message);
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
