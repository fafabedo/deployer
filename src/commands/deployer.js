"use strict";
const Deployer = require("./../tools/deployer");

module.exports = async function ({config, stage}) {
  // console.log("process.cwd(): ", process.cwd());
  // console.log(config)
  const configFile = `${process.cwd()}/${config}`;
  Deployer
    .stage(stage)
    .config(configFile)
    .execute();
};

