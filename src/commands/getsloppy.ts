import * as Configuration from '../modules/configuration';
import * as FileUtils from '../utils/File';
import * as Log from '../utils/Log';
import { Repository, Clone, Error as GitError } from 'nodegit';

/**
 * Look for a local repo, and if it doesn't exist, create it.
 *
 * @param {string} directory Directory where the repo should live locally.
 * @param {string} remoteUrl URL from which we retrieve origin.
 */
function createOrRetrieveRepo(directory: string, remoteUrl: string): PromiseLike<Repository> {
    return new Promise((resolve, reject) => {
        return Repository.open(directory).then((repo) => {
            resolve(repo);
        })
        .catch(err => {
            if (err.errno === GitError.CODE.ENOTFOUND) {
                // Repo doesn't exist.  Need to clone it in.
                Clone.clone(remoteUrl, directory).then(resolve, reject);
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
function getLatest(repo: Repository, branch: string) {
    const repoName = 'origin';
    return new Promise((resolve, reject) => {
        repo.checkoutBranch(branch).then(() => {
            console.log(`Updating Sloppy Joe from branch: ${branch}`);
            return repo.fetch(repoName);
        })
        .then(() => {
            const sourceBranch = `${repoName}/${branch}`;
            console.log(`Merging with ${sourceBranch}`);
            return repo.mergeBranches(branch, sourceBranch);
        })
        .then(() => {
            console.log("Complete");
            resolve();
        }, reject);
    });
}

/**
 * Command to retrieve the latest source from sloppy joe.
 */
export default function getsloppy() {
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

