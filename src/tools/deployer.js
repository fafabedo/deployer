const fs = require("fs");
const moment = require("moment");
const Config = require("./config");
const Rsync = require("./rsync");
const FileSystem = require("./file_system");
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
          logger.error("error creating release folder");
          reject(false);
        }
        resolve(createRelease);
      } catch (err) {
        logger.error(err);
        reject(false);
      }
    });
  }
  async executeTask(config, host, task) {
    return new Promise((resolve, reject) => {
      this._task_callback = null;
      switch (task) {
        case "deploy:extract":
          this._task_callback = this.taskExtract;
          break;
        case "deploy:check":
          this._task_callback = this.taskCheck;
          break;
        case "deploy:release":
          this._task_callback = this.taskRelease;
          break;
        case "deploy:clear":
        case "deploy:success":
        default:
          break;
      }
      if (!this._task_callback) {
        logger.info({ task: task, status: "skipped" });
        resolve(true);
        return;
      }
      logger.info({ task: task, status: "processing" });
      this._task_callback(config, host)
        .then((res) => {
          logger.success({ task: task, host: host, completed: true });
          resolve(true);
        })
        .catch((err) => {
          logger.error(err);
          reject(err);
        });
    });
  }
  async executeTaskAllHosts(config, hosts, task) {
    return new Promise((resolve, reject) => {
      Promise.all(hosts.map((host) => this.executeTask(config, host, task)))
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
  async executeAllTasks(config) {
    return new Promise(async (resolve, reject) => {
      try {
        let results = [];
        const hosts = config.getHost();
        const tasks = config.getTasks();
        logger.info({ tasks: tasks });
        while (tasks.length > 0) {
          const task = tasks.shift();
          const resp = await this.executeTaskAllHosts(config, hosts, task);
          results.push(resp);
        }
        logger.info("all task completed");
        resolve(results);
      } catch (e) {
        reject(e);
      }
    });
  }
  async execute() {
    return new Promise((resolve, reject) => {
      const stageConfig = this.stageConfig();
      const date = moment().format("YYYY/MM/DD hh:mm:ss");
      const app = stageConfig.getApplication();
      logger.info(`Processing deployment ${app} ${date} `);
      this.executeAllTasks(stageConfig)
        .then((res) => {
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
        .then((releaseFolder) => {
          const method = config.getMethod();
          this._update_callback = null;
          switch(method) {
            case "rsync":
              this._update_callback = this.updateCodeRsync;
              break;
            default:
              break;
          }
          this._update_callback(config, host, releaseFolder)
            .then((res) => {
              logger.success({result: res});
              resolve(res);
            })
            .catch((err) => {
              reject(err);
            })
        })
        .catch((err) => {
          logger.error(err);
          reject(err);
        });
    });
  }
  async taskExtract(config, host) {
    return new Promise((resolve, reject) => {
      resolve(true);
    });
  }
  async taskClear(config, host) {
    return new Promise((resolve, reject) => {
      const fsManager = new FileSystem();
      fsManager.setLogger(logger).setHost(host).setStage(config);
      const releases = fsManager.getListReleases();
    });
  }
  async updateCodeRsync(config, host, releaseFolder) {
    return new Promise((resolve, reject) => {
      const path = config && config.getProjectPath();
      const origin = `${process.cwd()}/${path}`;
      const username = config.getUsername();
      const exclude = config.getExclude();
      const rsync = new Rsync();
      rsync
        .setLogger(logger)
        .source(origin)
        .user(username)
        .setExclude(exclude)
        .destinationHost(host)
        .destinationPath(releaseFolder)
        .sync()
        .then((result) => {
          resolve(result);
        })
        .catch((err) => {
          logger.error("rsync error");
          reject(err);
        });
    });
  }
}

module.exports = new DeployerManager();
