#!/usr/bin/env node
"use strict";

// const _ = require("lodash");
const resolveCwd = require("resolve-cwd");
const { yellow } = require("chalk");
const { Command } = require("commander");
../package.json
const packageJSON = require("../package.json");

const getLocalScript =
  (name) =>
  (...args) => {
    // const cmdPath = resolveCwd.silent(`./../lib/commands/${name}`);
    const cmdPath = `./../src/commands/${name}`;
    if (!cmdPath) {
      console.log(
        `Error loading the local ${yellow(
          name
        )} command. Strapi might not be installed in your "node_modules". You may need to run "npm install"`
      );
      process.exit(1);
    }

    const script = require(cmdPath);

    Promise.resolve()
      .then(() => {
        return script(...args);
      })
      .catch((error) => {
        console.error(
          `Error while running command ${name}: ${error.message || error}`
        );
        process.exit(1);
      });
  };

// Initial program setup
program
  .allowUnknownOption(true);

program.version(
  packageJSON.version,
  "-v, --version",
  "Output the version number"
);

program
  .command("version")
  .description("Output your deployer version")
  .action(() => {
    process.stdout.write(packageJSON.version + "\n");
    process.exit(0);
  });

program
  .command("extract:plugins")
  .alias("extract")
  .description("Extract plugins")
  .action(getLocalScript("extractor"));