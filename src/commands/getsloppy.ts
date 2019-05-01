import { log } from '../utils/Log';
import { Repository, Clone, Error as GitError, Branch } from 'nodegit';
import { getValue } from '../modules/configuration';
import { promiseDirectoryExistence, exists } from '../utils/File';

/**
 * Look for a local repo, and if it doesn't exist, create it.
 *
 * @param {string} directory Directory where the repo should live locally.
 * @param {string} remoteUrl URL from which we retrieve origin.
 */
function createOrRetrieveRepo(directory: string, remoteUrl: string): Promise<Repository> {
    return new Promise((resolve, reject) => {
        return Repository.open(directory).then((repo) => {
            resolve(repo);
        })
        .catch(err => {
            if (err.errno === GitError.CODE.ENOTFOUND) {
                // Repo doesn't exist.  Need to clone it in.
                Clone.clone(remoteUrl, directory)
                    .then(repo => resolve(repo))
                    .catch(reject);
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
        repo.fetch(repoName)
            .then(() => {
                // Checkout master so we can recreate the old branch at head.
                return repo.checkoutBranch('master')
                    .then(() => {
                        return repo.getBranchCommit(`refs/remotes/origin/${branch}`)
                            .then(headCommit => repo.createBranch(branch, headCommit, true))
                            .then(branchRef => {
                                repo.checkoutBranch(branchRef);
                                return branchRef;
                            })
                            .then(branchRef => Branch.setUpstream(branchRef, `${repoName}/${branch}`))
                            .then(() => resolve(repo));
                    });
            })
            .then(() => {
                log("Complete");
                resolve();
            }, reject);
    });
}

/**
 * Determine whether the sloppy joe folder exists, or needs to be created.
 */
export function sloppyFolderExists(): Promise<boolean> {
    return exists(getValue('sloppyJoeFolder'));
}

/**
 * Command to retrieve the latest source from sloppy joe.
 */
export function getsloppy(repoFolder: string, remoteUrl: string, branch: string): Promise<void> {
    return promiseDirectoryExistence(repoFolder)
        .then((dir) => createOrRetrieveRepo(dir, remoteUrl))
        .then((repo) => getLatest(repo, branch))
        .catch(err => {
            // Something other than missing repo happened.  Report it raw.
            log(`Error copying repo: ${remoteUrl}\nFrom branch: ${branch}\nInto directory: ${repoFolder}`);
            log(err);
        }) as Promise<void>;
}

