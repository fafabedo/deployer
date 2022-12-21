const Config = require("./config");

class DeployerManager {
  constructor() {
    this.config = null;
  }
  loadConfig(config) {
    this.config = Config.loadFile(config);
    console.log(this.config);
  }
}

module.exports = new DeployerManager();
