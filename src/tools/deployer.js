const Config = require("./config");

class DeployerManager {
  constructor() {
    this._config = null;
    this._stage = null;
  }
  config(config) {
    this._config = Config
      .loadFile(config);
    // console.log(this._config);
    return this;
  }
  stage(_stage) {
    this._stage = _stage;
    return this;
  }
  stageConfig() {
    const stages = this._config.stages();
    return stages.find(item => item.id() === this._stage);
  }
  execute() {
    const stageInfo = this.stageConfig();
  }

}

module.exports = new DeployerManager();
