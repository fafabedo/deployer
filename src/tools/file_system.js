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
    if (this._stage.password()) {
      return {
        host: this._host,
        username: this._stage.username(),
        password: this._stage.password(),
      };
    }
    if (this._stage.privatekey()) {
      return {
        host: this._host,
        username: this._stage.username(),
        privateKeyPath: this._stage.privatekey(),
      };
    }
  }
  getReleasesPath() {
    const path = this._stage.path();
    return `${path}releases`;
  }
  getSharedPath() {
    const path = this._stage.path();
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
      const path = this._stage.path();
      this.sshExec(`touch _perm.txt`, path)
        .then((result) => {
          if (result.stdout) {
            resolve(true);
          }
          if (result.stderr) {
            this._logger.error(result.stderr);
            // console.error(result.stderr)
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
      // console.log(`Checking folder [${path}] ...`);
      this.sshExec(`ls ${path} -al`)
        .then((result) => {
          if (result.stdout) {
            // console.log(`[${path}] folder checked`);
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
          // console.error(err);
          reject(false);
        });
    });
  }
  createFolder(path) {
    return new Promise((resolve, reject) => {
      this._logger.info(`Creating folder [${path}] ...`);
      this.sshMkdir(`${path}`)
        .then((result) => {
          // console.log(`[${path}] folder created`);
          this._logger.info(`[${path}] folder created`);
          resolve(true);
        })
        .catch((err) => {
          this._logger.error(err);
          // console.log(`error mkdir operation`, err);
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
      this.sshExec(`ls -c -d -1 releases/*`, this._stage.path())
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
      const path = this._stage.path();
      this.getListReleases()
      .then(async (releases) => {
        this._logger.info(releases);
        // console.log(releases);
        const last_release = releases && releases[0];
        console.log(last_release);
        this._logger.info({last: last_release});
        const new_release = this.nextReleaseNumber(last_release);
        this._logger.info({next: new_release});
        // console.log(new_release);
        const releasePath = `${path}${new_release}`;
        const createReleasesFolder = await this.createFolder(releasePath);
        if (!createReleasesFolder) {
          reject(false);
        }
        resolve(releasePath);
      })
      .catch(err => {
        reject(false);
      })
    })

  }
}

module.exports = new FileSystemHelper();
