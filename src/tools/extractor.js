const extract = require('extract-zip');
const fs = require('fs');

class Extractor {
  constructor() {
    this.debug = false;
    this.source = __dirname;
    this.destination = "/tmp";
  }
  setDebug(debug) {
    this.debug = debug;
  }
  setDestination(destination) {
    this.destination = destination;
  }
  setSource(source) {
    this.source = source;
  }
  getFolderName(file) {
    let regex = /([^\.]*)\.([0-9|\.]*)\.zip/gi
    let match = regex.exec(file);
    if (match) {
        return match[1];
    }
    return null;
  }
  extract() {
    try {
      let files = [];
      if (options) {
          console.log(`Destination: `);
      }
      fs.readdirSync('./packages').forEach(file => {
          files.push(file);
      });
      files.forEach(async (file) => {
          let folderName = this.getFolderName(file);
          if (folderName) {
              console.log(`Extracting package: ${file} | target ${target} | folder ${folderName}`);
              await extract(`./packages/${file}`, { dir: target });
          }
      })
      console.log('Extraction complete');
  } catch (err) {
      console.log('Error found in extraction');
      console.log(err);
  }
  }
}