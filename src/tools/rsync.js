const Rsync = require("rsync");
const { exec } = require("child_process");

class RsyncManager {
  constructor() {
    this._source = null;
    this._shell = "ssh";
    this._flags = "azr";
    this._env = null;
    this._logger = null;
    this._user = null;
    this._password = null;
    this._destination_host = "127.0.0.1";
    this._destination_path = "/tmp";
    this._exclude = null;
  }
  source(_source) {
    this._source = _source;
    return this;
  }
  shell(_shell) {
    this._shell = shell;
    return this;
  }
  flags(_flags) {
    this._flags = _flags;
    return this;
  }
  setLogger(_logger) {
    this._logger = _logger;
    return this;
  }
  user(_user) {
    this._user = _user;
    return this;
  }
  password(_password) {
    this._password = _password;
    return this;
  }
  destinationHost(host) {
    this._destination_host = host;
    return this;
  }
  destinationPath(path) {
    this._destination_path = path;
    return this;
  }
  setExclude(_exclude) {
    this._exclude = _exclude;
    return this;
  }
  sync() {
    return new Promise((resolve, reject) => {
      const destination = `${this._user}@${this._destination_host}:${this._destination_path}`;
      const rsync = new Rsync()
        .shell(this._shell)
        .flags(this._flags)
        .source(this._source)
        .destination(destination);
      if (this._exclude) {
        rsync.exclude(this._exclude);
      }
      const command = rsync.command();
      this._logger.info({rsync_command: command});
      let logData;
      rsync.execute(
        (error, code, cmd) => {
          resolve({ error, code, cmd, data: logData });
        },
        (data) => {
          logData += data;
        },
        (err) => {
          this._logger.error({class: "rsync", error: err});
          logData += err;
        }
      );
    });
  }
}

module.exports = RsyncManager;
