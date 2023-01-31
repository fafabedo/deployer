"use strict";
const Deployer = require("./../tools/deployer");
const Logger = require("./../tools/logger");

const logger = new Logger();
logger.setVerbose(true);
logger.setLogger(true);

module.exports = async function ({config, stage}) {
  console.log(process.cwd());
  if (!config) {
    console.log("Missing config file");
    process.exit(1);
  }
  if (!stage) {
    console.log("Missing stage");
    process.exit(1);
  }
  const configFile = `${process.cwd()}/${config}`;
  const depFolder = await logger.createDepFolder();
  console.log(depFolder);
  Deployer
    .stage(stage)
    .config(configFile)
    .execute()
    .then((res) => {
      // console.log(res);
      process.exit(0);
    })
    .catch((err) => {
      console.log(err);
      process.exit(0);
    })
};

