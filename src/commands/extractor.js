"use strict";
const chalk = require("chalk");
const Deployer = require("./../tools/deployer");
const Config = require("./../tools/config");
const Extractor = require("./../tools/extractor");
const Logger = require("./../tools/logger");

const logger = new Logger();
logger.setVerbose(true);
logger.setLogger(true);

module.exports = async function ({config}) {
  if (!config) {
    console.log("Missing config file");
    process.exit(1);
  }
  const configFile = `${process.cwd()}/${config}`;

  const _config = Config.loadFile(configFile);

  const extractor = new Extractor();
  const source = _config.getExtractSource();
  const destination = _config.getExtractDestination();
  extractor
    .setLogger(logger)
    .setSource(source)
    .setDestination(destination)
    .execute()
    .then((res) => {
      console.log("Task completed");
      // resolve(true);
      process.exit(0);
    })
    .catch((err) => {
      // reject(err);
      console.log(err);
      process.exit(1);
    });

};