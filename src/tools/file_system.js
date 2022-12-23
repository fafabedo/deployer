const fs = require("fs");
const path = require("path");
const { NodeSSH } = require("node-ssh");
const Stage = require("./stage");

const ssh = new NodeSSH();

class FileSystemHelper {
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
  sshExec(command, cwd) {
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
  sshMkdir(path) {
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
  checkPermissions() {
    return new Promise((resolve, reject) => {
      const path = this._stage.getPath();
      this.sshExec(`touch _perm.txt`, path)
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
  checkFolder(path) {
    return new Promise((resolve, reject) => {
      this._logger.info(`Checking folder [${path}] ...`);
      this.sshExec(`ls ${path} -al`)
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
  createFolder(path) {
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
  checkFolderStructure() {
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
  getListReleases() {
    return new Promise((resolve, reject) => {
      this.sshExec(`ls -c -d -1 releases/*`, this._stage.getPath())
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
  createReleasePath() {
    return new Promise(async (resolve, reject) => {
      const path = this._stage.getPath();
      this.getListReleases()
      .then(async (releases) => {
        const last_release = releases && releases[0];
        const new_release = this.nextReleaseNumber(last_release);
        const releasePath = `${path}${new_release}`;
        const createReleasesFolder = await this.createFolder(releasePath);
        if (!createReleasesFolder) {
          this._logger.error("An error occurred creating release folder");
          reject(false);
        }
        this._logger.info({release: {last: last_release, new: new_release, path: createReleasesFolder}});
        resolve(releasePath);
      })
      .catch(err => {
        this._logger.error(err);
        reject(false);
      })
    })

  }
}

module.exports = FileSystemHelper;
