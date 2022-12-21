const yaml = require('js-yaml');
const fs   = require('fs');
const Stage = require("./stage");

class ConfigManager {
  constructor() {
    this._source = null;
    this._config = null;
  }
  loadFile(source) {
    if (source) {
      this._source = source;
    }
    try {
      const file = fs.readFileSync(this._source, 'utf8');
      this._config = yaml.load(file);
    }
    catch (e) {
      console.error(e);
    }
    return this;
  }
  config() {
    return this._config;
  }
  method() {
    return this._config.method || 'rsync';
  }
  projectPath() {
    return this._config.project_path || "/";
  }
  pluginsPath() {
    return this._config.project_path || "/";
  }
  stages() {
    const stages = this._config.stages;
    if (stages) {
      this._config.stages = [];
      stages.forEach(item => {
        const stage = new Stage();
        stage.load(item);
        this._config.stages.push(stage);
      })
    }
    return this._config.stages || [];
  }
  exclude() {
    return this._config.exclude || [];
  }

}

module.exports = new ConfigManager();
