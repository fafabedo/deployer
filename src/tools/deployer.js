const Config = require("./config");
const Rsync = require("./rsync");
const FileSystem = require("./file_system");
const fs = require("fs");
const Logger = require("./logger");

const logger = new Logger();
logger.setVerbose(true);
logger.setLogger(true);

const fsManager = new FileSystem();
fsManager.setLogger(logger);

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
    const username = stageConfig.getUsername();
    const exclude = stageConfig.getExclude();
    const rsync = new Rsync();
    const resultRsync = await rsync
      .setLogger(logger)
      .source(origin)
      .user(username)
      .setExclude(exclude)
      .destinationHost(host)
      .destinationPath(createRelease)
      .sync();

    // console.log(resultRsync);
  }
  async executeTask(config, host, task) {
    return new Promise((resolve, reject) => {
      this._task_callback = null;
      switch (task) {
        case "deploy:check":
          this._task_callback = this.taskCheck;
          break;
        case "deploy:release":
          this._task_callback = this.taskRelease;
          break;
        default:
          break;
      }
      if (!this._task_callback) {
        logger.info({task: task, status: "skipped"});
      }
      this._task_callback(config, host)
        .then((res) => {
          logger.success({task: task, host: host, completed: true});
        })
        .catch((err) => {
          logger.error(err);
        })
    });
  }
  async executeAllTasks(config) {
    return new Promise(async (resolve, reject) => {
      try {
        let results = [];
        const hosts = config.getHost();
        const tasks = config.getTasks();
        while (tasks.length > 0) {
          const task = tasks.shift();
          Promise.all(hosts.map((host) => this.executeTask(config, host, task)))
            .then((res) => {
              logger.success({ task: task, hosts: hosts.length, completed: true });
              resolve(res);
            })
            .catch((err) => {
              logger.error(err);
            });
        }
        resolve(results);
      } catch (e) {
        reject(e);
      }
    });
  }
  async execute() {
    return new Promise((resolve, reject) => {
      const stageConfig = this.stageConfig();
      logger.info(
        `Deployment ${stageConfig.getApplication()} 11-22-2022 - 11:11:22 `
      );
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
  async taskCheck(config, host) {
    return new Promise((resolve, reject) => {
      const fsManager = new FileSystem();
      fsManager.setLogger(logger).setHost(host).setStage(config);
      this.folderStructure(fsManager)
        .then((res) => {
          resolve(true);
        })
        .catch((err) => {
          logger.error(err);
          reject(err);
        });
    });
  }
  async taskRelease(config, host) {
    return new Promise((resolve, reject) => {
      const fsManager = new FileSystem();
      fsManager.setLogger(logger).setHost(host).setStage(config);
      this.createRelease(fsManager)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          logger.error(err);
          reject(err);
        });
    });
  }
}

module.exports = new DeployerManager();
