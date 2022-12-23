const Config = require("./config");
const Rsync = require("./rsync");
const FileSystem = require("./file_system");
const fs = require("fs");
const Logger = require("./logger");

const logger = new Logger();
logger.setVerbose(false);
logger.setLogger(true);

class DeployerManager {
  constructor() {
    this._config = null;
    this._stage = null;
    this._log_folder = null;
  }
  config(config) {
    this._config = Config.loadFile(config);
    return this;
  }
  stage(_stage) {
    this._stage = _stage;
    return this;
  }
  stageConfig() {
    const stages = this._config.stages();
    return stages.find((item) => item.id() === this._stage);
  }
  fileSystem(config, host) {
    const fileSystem = FileSystem.setLogger(logger)
      .setHost(host)
      .setStage(config);
    return fileSystem;
  }
  folderStructure(fileSystem) {
    return new Promise(async (resolve, reject) => {
      try {
        const folderStructure = await fileSystem.checkFolderStructure();
        if (!folderStructure) {
          reject(
            "Occurr an error creating folder structure, check permissions"
          );
        }
        resolve(true);
      } catch (err) {
        reject(err);
      }
    });
  }
  createRelease(fileSystem) {
    return new Promise(async (resolve, reject) => {
      try {
        const createRelease = await fileSystem.createReleasePath();
        if (!createRelease) {
          reject(false);
        }
        resolve(createRelease);
      } catch (err) {
        console.error(err);
        reject(false);
      }
    });
  }
  async executeTask(stageConfig, host) {
    const fileSystem = this.fileSystem(stageConfig, host);
    // Check folder structure
    const folderStructure = await this.folderStructure(fileSystem);
    if (folderStructure !== true) {
      throw folderStructure;
    }

    // Create release folder
    const createRelease = await this.createRelease(fileSystem);
    if (!createRelease) {
      throw "Not able to create release folder";
    }

    // Upload build path
    const path = stageConfig && stageConfig._config.project_path;
    const origin = `${process.cwd()}/${path}`;
    const username = stageConfig.username();
    const exclude = stageConfig.exclude();
    const rsync = new Rsync();
    const resultRsync = await rsync
      .source(origin)
      .user(username)
      .setExclude(exclude)
      .destinationHost(host)
      .destinationPath(createRelease)
      .sync();

    // console.log(resultRsync);
  }
  async executeAllTasks(stageConfig) {
    return new Promise(async (resolve, reject) => {
      try {
        let results = [];
        const hosts = stageConfig.host();
        while (hosts.length > 0) {
          const host = hosts.shift();
          const resp = await this.executeTask(stageConfig, host);
          results.push(resp);
        }
        resolve(results);
      } catch (e) {
        reject(e);
      }
    });
  }
  execute() {
    return new Promise((resolve, reject) => {
      const stageConfig = this.stageConfig();
      this.executeAllTasks(stageConfig)
        .then((res) => {
          console.log(res);
          resolve(res);
        })
        .catch((err) => {
          console.error(err);
          reject(err);
        });
    });
  }
}

module.exports = new DeployerManager();
