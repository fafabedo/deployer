const yaml = require('js-yaml');
const fs   = require('fs');

class ConfigManager {
  constructor() {
    this.source = null;
    this.config = null;
  }
  setSource(source) {
    this.source = source;
  }
  loadFile(source) {
    if (source) {
      this.source = source;
    }
    try {
      const file = fs.readFileSync(this.source, 'utf8');
      this.config = yaml.load(file);
      console.log(this.config);
    }
    catch (e) {
      console.log(e);
    }
    return this;
  }

}

module.exports = new ConfigManager();
