const Rsync = require('rsync');

class RsyncManager {
  constructor() {
    this._source = null;
    this._shell = 'ssh';
    this._flags = 'azr';
    this.user = null;
    this._destination_host = '127.0.0.1';
    this._destination_path = '/tmp';
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
  user(_user) {
    this._user = _user;
    return this;
  }
  destinationHost(host) {
    this._destination_host = host;
    return this;
  }
  destinationPath(path) {
    this._destination_path = path;
    return path;
  }
  execute() {
    const destination = `${this._user}@${this._destination_host}:${this._destination_path}`;
    const rsync = new Rsync()
      .set('progress')
      .shell(this._shell)
      .flags(this._flags)
      .source(this._source)
      .destination(destination);
    rsync.execute(function(error, code, cmd) {
        console.log(error);
        console.log(code);
        console.log(cmd);
    });

  }
}
