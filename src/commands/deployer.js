"use strict";
const Deployer = require("./../tools/deployer");

module.exports = async function ({config, stage}) {
  // console.log("process.cwd(): ", process.cwd());
  // console.log(config)
  if (!config) {
    console.log("Missing config file");
    process.exit(1);
  }
  if (!stage) {
    console.log("Missing stage");
    process.exit(1);
  }
  const configFile = `${process.cwd()}/${config}`;
  Deployer
    .stage(stage)
    .config(configFile)
    .execute();
};

