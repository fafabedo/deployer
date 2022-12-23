
class Stage {
  constructor() {
    this._id = null;
    this._host = null;
    this._username = null;
    this._password = null;
    this._private_key = null;
    this._path = null;
    this._config = null;
  }
  load(stage, config) {
    this._id = stage && stage.id;
    this._host = stage && stage.host;
    this._username = stage && stage.username;
    this._password = stage && stage.password;
    this._private_key = stage && stage.private_key;
    this._path = stage && stage.path;
    this._config = config;
  }
  id() {
    return this._id;
  }
  group() {
    return this._group;
  }
  host() {
    return this._host;
  }
  username() {
    return this._username;
  }
  password() {
    return this._password;
  }
  privateKey() {
    return this._private_key;
  }
  path() {
    return this._path;
  }
  application() {
    return this._config && this._config.application;
  }
  getProjectPath() {
    return this._config && this._config.project_path;
  }
  keepReleases() {
    return this._config && this._config.keepReleases();
  }
  method() {
    return this._config && this._config.method();
  }
  exclude() {
    return this._config && this._config.exclude;
  }
  sharedDirs() {
    return this._config && this._config.sharedDirs();
  }
  sharedFiles() {
    return this._config && this._config.sharedFiles();
  }
  extractSource() {
    return this._config && this._config.extractSource();
  }
  extractDestination() {
    return this._config && this._config.extractDestination();
  }
}

module.exports = Stage;
