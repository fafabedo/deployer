
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
  getHost() {
    return this._host;
  }
  getUsername() {
    return this._username;
  }
  getPassword() {
    return this._password;
  }
  getPrivateKey() {
    return this._private_key;
  }
  getPath() {
    return this._path;
  }
  getApplication() {
    return this._config && this._config.application || "app";
  }
  getProjectPath() {
    return this._config && this._config.project_path || "/";
  }
  getKeepReleases() {
    return this._config && this._config.keep_releases || 5;
  }
  getMethod() {
    return this._config && this._config.method || "rsync";
  }
  getExclude() {
    return this._config && this._config.exclude || [];
  }
  getSharedDirs() {
    return this._config && this._config.share_dirs || [];
  }
  getSharedFiles() {
    return this._config && this._config.shared_files;
  }
  getExtractSource() {
    return this._config && this._config.extract_source;
  }
  getExtractDestination() {
    return this._config && this._config.extract_destination;
  }
  getTasks() {
    return this._config && this._config.tasks || [
      "deploy:extract",
      "deploy:release",
      "deploy:shared",
      "deploy:symlink",
      "deploy:house_keeper",
      "deploy:success",
    ];
  }
}

module.exports = Stage;
