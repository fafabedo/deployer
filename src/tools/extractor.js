const extract = require("extract-zip");
const fs = require("fs");

class Extractor {
  constructor() {
    this.debug = false;
    this._source = __dirname;
    this._destination = "/tmp";
    this._logger = null;
  }
  setDestination(_destination) {
    this._destination = _destination;
    return this;
  }
  setSource(_source) {
    this._source = _source;
    return this;
  }
  setLogger(_logger) {
    this._logger = _logger;
    return this;
  }
  getFolderName(file) {
    let regex = /([^\.]*)\.([0-9|\.]*)\.zip/gi;
    let match = regex.exec(file);
    if (match) {
      return match[1];
    }
    return null;
  }
  async execute() {
    return new Promise((resolve, reject) => {
      try {
        let files = [];
        const source = process.cwd() + "/" + this._source;
        const destination = process.cwd() + "/" + this._destination;
        fs.readdirSync(source).forEach((file) => {
          files.push(file);
        });
        files.forEach(async (file) => {
          let pluginName = this.getFolderName(file);
          if (pluginName) {
            this._logger && this._logger.info(`Extracting package: ${file} | target ${destination} | plugin ${pluginName}`);
            await extract(`${source}/${file}`, { dir: destination });
          }
        });
        this._logger && this._logger.info("Extraction completed");
        resolve(true);
      } catch (err) {
        this._logger.error(err);
        reject(err);
      }
    })
    
  }
}

module.exports = Extractor;