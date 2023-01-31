const fs = require("fs");
const path = require("path");
const { NodeSSH } = require("node-ssh");
const Stage = require("./stage");

const ssh = new NodeSSH();

class RemoteManager {
  constructor() {
    this._path = null;
    this._stage = null;
    this._host = null;
    this._logger = null;
  }
  setHost(host) {
    this._host = host;
    return this;
  }
  setStage(stage) {
    this._stage = stage;
    return this;
  }
  setLogger(logger) {
    this._logger = logger;
    return this;
  }
  getCredentials() {
    if (this._stage.getPassword()) {
      return {
        host: this._host,
        username: this._stage.getUsername(),
        password: this._stage.getPassword(),
      };
    }
    if (this._stage.getPrivatekey()) {
      return {
        host: this._host,
        username: this._stage.getUsername(),
        privateKeyPath: this._stage.getPrivatekey(),
      };
    }
  }
  getReleasesPath() {
    const path = this._stage.getPath();
    return `${path}releases`;
  }
  getSharedPath() {
    const path = this._stage.getPath();
    return `${path}shared`;
  }
  ssh() {
      if (!this._stage) {
        throw "No stage is set";
      }
      if (!this._host) {
        throw "No host is set";
      }
      let credentials = this.getCredentials();
      return ssh.connect(credentials);
  }
  async sshExec(command, params) {
    return new Promise((resolve, reject) => {
      try {
        this.ssh()
          .then(() => {
            ssh
              .exec(command, [])
              .then((result) => {
                resolve(result);
              })
              .catch((err) => {
                reject(err);
              });
          })
          .catch((err) => {
            this._logger.error(err);
            reject(err);
          });
      } catch (err) {
        reject(err);
      }
    });
  }
  async sshExecCommand(command, cwd) {
    return new Promise((resolve, reject) => {
      try {
        this.ssh()
          .then(() => {
            ssh
              .execCommand(command, { cwd: cwd })
              .then((result) => {
                resolve(result);
              })
              .catch((err) => {
                reject(err);
              });
          })
          .catch((err) => {
            this._logger.error(err);
            reject(err);
          });
      } catch (err) {
        reject(err);
      }
    });
  }
  async sshMkdir(path) {
    return new Promise((resolve, reject) => {
      try {
        this.ssh()
          .then(() => {
            ssh
              .mkdir(path, 'exec')
              .then((result) => {
                resolve(result);
              })
              .catch((err) => {
                reject(err);
              });
          })
          .catch((err) => {
            reject(err);
          });
      } catch (err) {
        reject(err);
      }
    });
  }
  async checkPermissions() {
    return new Promise((resolve, reject) => {
      const path = this._stage.getPath();
      this.sshExecCommand(`touch _perm.txt`, path)
        .then((result) => {
          if (result.stdout) {
            resolve(true);
          }
          if (result.stderr) {
            this._logger.error(result.stderr);
            reject(false);
          }
          reject(false);
        })
        .catch((err) => {
          this._logger.error(err);
          // console.error(err);
          reject(false);
        });
    });
  }
  async checkFolder(path) {
    return new Promise((resolve, reject) => {
      this._logger.info(`Checking folder [${path}] ...`);
      this.sshExecCommand(`ls ${path} -al`)
        .then((result) => {
          if (result.stdout) {
            this._logger.info(`[${path}] folder checked`);
            resolve(true);
          }
          if (result.stderr) {
            resolve(false);
          }
          reject(false);
        })
        .catch((err) => {
          this._logger.error(err);
          reject(false);
        });
    });
  }
  async checkFile(path) {
    return new Promise((resolve, reject) => {
      this._logger.info(`Checking file [${path}] ...`);
      this.sshExecCommand(`stat -f ${path}`)
        .then((result) => {
          if (result.stdout) {
            this._logger.info(`[${path}] file exists`);
            resolve(true);
          }
          if (result.stderr) {
            resolve(false);
          }
          reject(false);
        })
        .catch((err) => {
          this._logger.error(err);
          reject(false);
        });
    });
  }
  async createEmptyFile(path) {
    return new Promise((resolve, reject) => {
      this._logger.info(`Creating file [${path}] ...`);
      this.sshExecCommand(`touch ${path}`)
        .then((result) => {
          if (result.stdout) {
            this._logger.info(`[${path}] file created`);
            resolve(true);
          }
          if (result.stderr) {
            resolve(false);
          }
          reject(false);
        })
        .catch((err) => {
          this._logger.error(err);
          reject(false);
        });
    });
  }
  async removeFile(path) {
    return new Promise((resolve, reject) => {
      this._logger.info(`Removing file [${path}] ...`);
      this.sshExecCommand(`rm -f ${path}`)
        .then((result) => {
          this._logger.info(`[${path}] file removed`);
          resolve(true);
        })
        .catch((err) => {
          this._logger.error(err);
          reject(false);
        });
    });
  }
  async createFolder(path) {
    return new Promise((resolve, reject) => {
      this._logger.info(`Creating folder [${path}] ...`);
      this.sshMkdir(`${path}`)
        .then((result) => {
          this._logger.info(`[${path}] folder created`);
          resolve(true);
        })
        .catch((err) => {
          this._logger.error(err);
          reject(false);
        });
    });
  }
  async removeFolder(path) {
    return new Promise((resolve, reject) => {
      this._logger.info(`Removing folder [${path}] ...`);
      this.sshExecCommand(`rm -rf ${path}`)
        .then((result) => {
          this._logger.info(`[${path}] folder removed`);
          resolve(true);
        })
        .catch((err) => {
          this._logger.error(err);
          reject(false);
        });
    });
  }
  async checkFolderStructure() {
    return new Promise(async (resolve, reject) => {
      let folderCheck = true;
      const releasesCheck = await this.checkFolder(this.getReleasesPath());
      if (!releasesCheck) {
        const createReleasesFolder = await this.createFolder(this.getReleasesPath());
        if (!createReleasesFolder) {
          folderCheck = false;
        }
      }
      const sharedCheck = await this.checkFolder(this.getSharedPath());
      if (sharedCheck !== true) {
        const createSharedFolder = await this.createFolder(this.getSharedPath());
        if (!createSharedFolder) {
          folderCheck = false;
        }
      }
      if (!folderCheck) {
        reject(folderCheck);
      }
      resolve(folderCheck);
    });
  }
  async getListReleases() {
    return new Promise((resolve, reject) => {
      this.sshExecCommand(`ls -c -d -1 releases/*`, this._stage.getPath())
        .then((result) => {
          if (result.code === 1) {
            reject(result.stderr);
          }
          const releases = result.stdout.split('\n');
          resolve(releases);
        })
        .catch(err => {
          reject(err);
        })
    })
  }
  sortReleasesByNumber(items) {
    const results = items && items.sort();
    return results.reverse();
  }
  nextReleaseNumber(release) {
    if (!release) {
      return `releases/1`;
    }
    let regex = /releases\/([0-9]*)/i;
    let matches = regex.exec(release);
    if (matches) {
      const releaseNumber = parseInt(matches[1]) + 1;
      return `releases/${releaseNumber}`;
    }
    return `releases/1`;
  }
  async createReleasePath() {
    return new Promise(async (resolve, reject) => {
      const path = this._stage.getPath();
      this.getListReleases()
      .then(async (releases) => {
        const items = this.sortReleasesByNumber(releases);
        const last_release = items && items[0];
        const new_release = this.nextReleaseNumber(last_release);
        const releasePath = `${path}${new_release}`;
        const createReleasesFolder = await this.createFolder(releasePath);
        if (!createReleasesFolder) {
          this._logger && this._logger.error("An error occurred creating release folder");
          this._stage.setRelease(new_release);
          reject(false);
        }
        this._logger && this._logger.info({release: {last: last_release, new: new_release, path: createReleasesFolder}});
        resolve(releasePath);
      })
      .catch(err => {
        this._logger.error(err);
        reject(false);
      })
    })

  }
  async clearReleases() {
    return new Promise(async (resolve, reject) => {
      const path = this._stage.getPath();
      const keep = this._stage.getKeepReleases();
      this._logger && this._logger.info({path: path, keep: keep});
      this.getListReleases()
      .then(async (releases) => {
        if (releases.length <= keep) {
          resolve(true);
        }
        while (releases.length > keep) {
          const olderRelease = releases.pop();
          const releasePath = `${path}${olderRelease}`;
          const removedFolder = await this.removeFolder(releasePath);
          if (!removedFolder) {
            this._logger && this._logger.error("An error occurred removing release folder")
          }
        }
        resolve(releases);
      })
      .catch(err => {
        this._logger.error(err);
        reject(false);
      })
    });
  }
  async updateSymlink(releasePath) {
    return new Promise(async (resolve, reject) => {
      try {
        const path = this._stage.getPath();
        const current = `${path}current`;
        let command = `unlink ${current} && ln -s ${releasePath} ${current}`;
        const exists = await this.checkFolder(current);
        if (!exists) {
          command = `ln -s ${releasePath} ${current}`;
        }
        this._logger.info(command);
        this.sshExec(command, [])
          .then((res) => {
            this._logger.info(`Symlink created [unlink current && ln -s ${releasePath} ${current}] `);
            resolve(true);
          })
          .catch((err) => {
            reject(err);
          });
      } catch (err) {
        reject(err);
      }
    });
  }
  async sharedDirectory(sourcePath, releasePath) {
    return new Promise(async (resolve, reject) => {
      const mainPath = this._stage.getPath();
      const source = `${mainPath}shared/${sourcePath}`
      const destination = `${releasePath}/${sourcePath}`;
      const exists = await this.checkFolder(source);
      if (!exists) {
        const created = await this.createFolder(source);
      }
      const destExists = await this.checkFolder(destination);
      if (!!destExists) {
        const removed = await this.removeFolder(destination);
      }
      const command = `ln -s ${source} ${destination}`;
      this.sshExec(command, [])
        .then((res) => {
          this._logger.info(`Symlink created [${command}]`);
          resolve(true);
        })
        .catch((err) => {
          this._logger.error("sharedDirectory error " + err.message)
          reject(err);
        });
    });
  }
  async sharedFile(sourcePath, releasePath) {
    return new Promise(async (resolve, reject) => {
      const mainPath = this._stage.getPath();
      const source = `${mainPath}shared/${sourcePath}`
      const destination = `${releasePath}/${sourcePath}`;
      const exists = await this.checkFile(source);
      if (!exists) {
        const created = await this.createEmptyFile(source);
      }
      console.log(destination);
      const destExists = await this.checkFile(destination);
      if (!!destExists) {
        const removed = await this.removeFile(destination);
      }
      const command = `ln -s ${source} ${destination}`;
      this.sshExec(command, [])
        .then((res) => {
          this._logger.info(`Symlink created [${command}]`);
          resolve(true);
        })
        .catch((err) => {
          this._logger.error("sharedFile error " + err.message)
          reject(err);
        });
    });
  }
}

module.exports = RemoteManager;
