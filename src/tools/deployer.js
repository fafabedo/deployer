const fs = require("fs");
const moment = require("moment");
const Config = require("./config");
const Rsync = require("./rsync");
const RemoteManager = require("./remote_manager");
const Logger = require("./logger");
const Extractor = require("./extractor");

const logger = new Logger();
logger.setVerbose(true);
logger.setLogger(true);

const remoteManager = new RemoteManager();
remoteManager.setLogger(logger);

class DeployerManager {
  constructor() {
    this._config = null;
    this._stage = null;
    this._log_folder = null;
    this._release = null;
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
  setRelease(_release) {
    this._release = _release;
  }
  folderStructure(remoteInstance) {
    return new Promise(async (resolve, reject) => {
      try {
        const folderStructure = await remoteInstance.checkFolderStructure();
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
  createRelease(remoteInstance) {
    return new Promise(async (resolve, reject) => {
      try {
        const createRelease = await remoteInstance.createReleasePath();
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
          this._task_callback = this.taskClear;
          break;
        case "deploy:symlink":
          this._task_callback = this.taskSymlink;
          break;
        case "deploy:shared":
          this._task_callback = this.taskShared;
          break;
        case "deploy:success":
          this._task_callback = function() {
            return new Promise((resolve, reject) => {
              resolve(true);
            })
          };
          break;
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
        logger.info("All task completed");
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
      const remoteInstance = new RemoteManager();
      remoteInstance.setLogger(logger).setHost(host).setStage(config);
      this.folderStructure(remoteInstance)
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
      const remoteInstance = new RemoteManager();
      remoteInstance.setLogger(logger).setHost(host).setStage(config);
      this.createRelease(remoteInstance)
        .then((releaseFolder) => {
          logger.success(`Release has been created [${releaseFolder}]`)
          this.setRelease(releaseFolder);
          const method = config.getMethod();
          this._update_callback = null;
          switch (method) {
            case "rsync":
              this._update_callback = this.updateCodeRsync;
              break;
            default:
              break;
          }
          this._update_callback(config, host, releaseFolder)
            .then((res) => {
              logger.success({ result: res });
              resolve(res);
            })
            .catch((err) => {
              reject(err);
            });
        })
        .catch((err) => {
          logger.error(err);
          reject(err);
        });
    });
  }
  async taskExtract(config, host) {
    return new Promise(async (resolve, reject) => {
      const extractor = new Extractor();
      const source = config.getExtractSource();
      const destination = config.getExtractDestination();
      extractor
        .setLogger(logger)
        .setSource(source)
        .setDestination(destination)
      
      const result = await extractor.execute();
      if (result) {
        resolve(true);
      } else {
        reject(result);
      }
      
    });
  }
  async taskSymlink(config, host) {
    return new Promise((resolve, reject) => {
      const remoteManager = new RemoteManager();
      remoteManager.setLogger(logger).setHost(host).setStage(config);
      remoteManager
        .updateSymlink(this._release)
        .then((res) => {
          resolve(true);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
  async taskClear(config, host) {
    return new Promise((resolve, reject) => {
      const remoteInstance = new RemoteManager();
      remoteInstance.setLogger(logger).setHost(host).setStage(config);
      remoteInstance
        .clearReleases()
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
  async taskShared(config, host) {
    return new Promise(async (resolve, reject) => {
      try {
        const dirs = await this.subTaskShareDirs(config, host);
        const files = await this.subTaskShareFiles(config, host);
        resolve(true);
      } catch (err) {
        reject(err)
      }
    });
  }
  async updateCodeRsync(config, host, releaseFolder) {
    return new Promise((resolve, reject) => {
      const path = config && config.getProjectPath();
      const origin = `${process.cwd()}/${path}`;
      const username = config.getUsername();
      const exclude = config.getExclude();
      const rsync = new Rsync();
      logger && logger.info({RSYNC: {origin: origin, host: host, destination: releaseFolder}});
      rsync
        .setLogger(logger)
        .source(origin)
        .user(username)
        .setExclude(exclude)
        .destinationHost(host)
        .destinationPath(releaseFolder)
        // .set('delete')
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
  async subTaskShareDirs(config, host) {
    return new Promise(async (resolve, reject) => {
      const remoteInstance = new RemoteManager();
      remoteInstance.setLogger(logger).setHost(host).setStage(config);
      const sharedDirs = config.getSharedDirs();
      while (sharedDirs.length > 0) {
        const directory = sharedDirs.shift();
        const result = await remoteInstance.sharedDirectory(directory, this._release);
        if (!result) {
          reject(result);
        }
      }
      resolve(true);
    });
  }
  async subTaskShareFiles(config, host) {
    return new Promise(async (resolve, reject) => {
      const remoteInstance = new RemoteManager();
      remoteInstance.setLogger(logger).setHost(host).setStage(config);
      const sharedFiles = config.getSharedFiles();
      while (sharedFiles.length > 0) {
        const file = sharedFiles.shift();
        const result = await remoteInstance.sharedFile(file, this._release);
        if (!result) {
          reject(result);
        }
      }
      resolve(true);
    });
  }
}

module.exports = new DeployerManager();
