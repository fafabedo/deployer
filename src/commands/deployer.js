"use strict";
const Deployer = require("./../tools/deployer");

module.exports = async function ({config}) {
  // console.log("process.cwd(): ", process.cwd());
  // console.log(config)
  const configFile = `${process.cwd()}/${config}`;
  console.log(configFile);
  const deployer = Deployer.loadConfig(configFile);
  console.log(deployer);
};

