const Config = require("./config");
const Rsync = require("./rsync");

class DeployerManager {
  constructor() {
    this._config = null;
    this._stage = null;
  }
  config(config) {
    this._config = Config.loadFile(config);
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
    const stageConfig = this.stageConfig();
    stageConfig.host().forEach(host => {
      Rsync
        .source(this._config.projectPath())
        .destinationHost(host)
        .destinationPath(stageConfig.destinationPath());
    })


  }

}

module.exports = new DeployerManager();
