"use strict";
const chalk = require("chalk");
const Deployer = require("./../tools/deployer");
const Config = require("./../tools/config");
const Extractor = require("./../tools/extractor");
const Logger = require("./../tools/logger");

const extract = require('extract-zip');
const fs = require('fs');

const logger = new Logger();
logger.setVerbose(true);
logger.setLogger(true);

function packageFolderName(file) {
  let regex = /([^\.]*)\.([0-9|\.]*)\.zip/gi
  let match = regex.exec(file);
  if (match) {
      return match[1];
  }
  return null;
}

module.exports = async function ({config}) {
  if (!config) {
    console.log("Missing config file");
    process.exit(1);
  }
  const configFile = `${process.cwd()}/${config}`;

  const _config = Config.loadFile(configFile);
//   try {
//     let files = [];
//     const source = _config.getExtractSource();
//     const target = _config.getExtractDestination();
//     fs.readdirSync(source).forEach(file => {
//         files.push(file);
//     });
//     files.forEach(async (file) => {
//         let folderName = packageFolderName(file);
//         const filename = `${source}/${file}`;
//         if (folderName) {
//             console.log(`Extracting package: ${filename} | target ${target} | folder ${folderName}`);
//             await extract(`${filename}`, { dir: target });
//         }
//     })
//     console.log('Extraction complete');
// } catch (err) {
//     console.log('Error found in extraction');
//     console.log(err);
// }

  const extractor = new Extractor();
  const source = _config.getExtractSource();
  const destination = _config.getExtractDestination();
  const dep = await logger.createDepFolder();
  extractor
    .setLogger(logger)
    .setSource(source)
    .setDestination(destination)
    ;
  const result = await extractor.execute();
  console.log(result);
    // .then((res) => {
    //   console.log("Task completed");
    //   process.exit(0);
    // })
    // .catch((err) => {
    //   console.log(err);
    //   process.exit(1);
    // });

};