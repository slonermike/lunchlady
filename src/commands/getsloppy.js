const Configuration = require('../modules/configuration');
const FileUtils = require('../utils/File');
const Log = require('../utils/Log');
const Git = require('nodegit');

/**
 * Look for a local repo, and if it doesn't exist, create it.
 *
 * @param {string} directory Directory where the repo should live locally.
 * @param {string} remoteUrl URL from which we retrieve origin.
 */
const createOrRetrieveRepo = function(directory, remoteUrl) {
    return new Promise((resolve, reject) => {
        Git.Repository.open(directory).then(resolve)
        .catch(err => {
            if (err.errno === Git.Error.CODE.ENOTFOUND) {
                // Repo doesn't exist.  Need to clone it in.
                Git.Clone(remoteUrl, directory).then(resolve, reject);
            } else {
                reject(err);
            }
        });
    });
}

/**
 * Get the latest from the repository.
 *
 * @param {Repository} repo Repository from which to retrieve code.
 * @param {string} branch Name of the branch to get latest from.
 */
const getLatest = function(repo, branch) {
    return new Promise((resolve, reject) => {
        repo.checkoutBranch(branch).then(() => {
            console.log(`Updating from branch: ${branch}`)
            return repo.fetch('origin');
        }).then(() => {
            console.log("Complete");
            resolve();
        }, reject);
    });
}

/**
 * Command to retrieve the latest source from sloppy joe.
 */
const getsloppy = function () {
    const sloppyJoeFolder = Configuration.getValue('sloppyJoeFolder');
    const remoteUrl = Configuration.getValue('sloppyJoeOrigin');
    const branch = Configuration.getValue('sloppyJoeBranch');

    FileUtils.promiseDirectoryExistence(sloppyJoeFolder)
        .then((dir) => createOrRetrieveRepo(dir, remoteUrl))
        .then((repo) => getLatest(repo, branch))
        .catch(err => {
            // Something other than missing repo happened.  Report it raw.
            Log.log(`Error copying repo: ${remoteUrl}\nFrom branch: ${branch}\nInto directory: ${sloppyJoeFolder}`);
            Log.log(err);
        });
}

module.exports = getsloppy;