const yaml = require('js-yaml');
const fs   = require('fs');

class Config {
  constructor() {
    this.source = __dirname + "/../../../deployer.yml"
  }
}