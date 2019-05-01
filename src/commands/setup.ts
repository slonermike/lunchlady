import { registerPrompt, prompt } from 'inquirer';
import * as FileUtils from '../utils/File';
import { log } from '../utils/Log';
import { Configuration } from '../modules/configuration';
import { getsloppy } from './getsloppy';
import { PathPrompt } from 'inquirer-path'
import { createSite } from './manageContent';

// Register the datepicker plugin for inquirer
registerPrompt('path', PathPrompt);

/**
 * Retrieves the Sloppy Joe repository, then links the local HTML source folder
 * into it.
 */
export function setup(): Promise<void> {
    const remoteUrl = Configuration.sloppyJoeOrigin;
    const branch = Configuration.sloppyJoeBranch;

    // Link the directory if it doesn't exist.
    return getsloppy(remoteUrl, branch)
    .then(() => FileUtils.promiseDirectoryExistence(Configuration.contentFolder))
    .then(() => createSite(`${Configuration.contentFolder}${Configuration.contentFile}`))
    .then(() => log('Your blog has been created!  Run `npm install` and `npm run start` to see your blog!'))
    .catch(log);
}

export default setup;
