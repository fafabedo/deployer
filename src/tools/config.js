const yaml = require("js-yaml");
const fs = require("fs");
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
      const file = fs.readFileSync(this._source, "utf8");
      this._config = yaml.load(file);
    } catch (e) {
      console.error(e);
    }
    return this;
  }
  config() {
    return this._config;
  }
  application() {
    return this._config && this._config.application || "app";
  }
  keepReleases() {
    return this._config && this._config.keep_releases || 5;
  }
  method() {
    return this._config && this._config.method || "rsync";
  }
  projectPath() {
    return this._config && this._config.project_path || "/";
  }
  exclude() {
    return this._config && this._config.exclude || null;
  }
  sharedDirs() {
    return this._config && this._config.share_dirs || [];
  }
  sharedFiles() {
    return this._config && this._config.shared_files || [];
  }
  getExtractSource() {
    return this._config && this._config.extract_source || "html/extractor/packages";
  }
  getExtractDestination() {
    return this._config && this._config.extract_destination || "html/wp-content/plugins";
  }
  stages() {
    const stages = this._config.stages;
    if (stages) {
      this._config.stages = [];
      stages.forEach((item) => {
        const stage = new Stage();
        stage.load(item, this._config);
        this._config.stages.push(stage);
      });
    }
    return this._config.stages || [];
  }
  tasks() {
    return (
      this._config && this._config.tasks || [
        "deploy:extract",
        "deploy:release",
        "deploy:shared",
        "deploy:success",
      ]
    );
  }
}

module.exports = new ConfigManager();
