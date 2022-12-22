
class Stage {
  constructor() {
    this._id = null;
    this._host = null;
    this._username = null;
    this._password = null;
    this._destination_path = null;
  }
  load(stage) {
    this._id = stage && stage.id;
    this._host = stage && stage.host;
    this._username = stage && stage.username;
    this._password = stage && stage.password;
    this._destination_path = stage && stage.destination_path;
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
  destinationPath() {
    return this._destination_path;
  }
}

module.exports = Stage;
