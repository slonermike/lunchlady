import { registerPrompt, prompt } from 'inquirer';
import * as FileUtils from '../utils/File';
import { log } from '../utils/Log';
import { ValueSet } from '../modules/configuration';
import { getValue } from '../modules/configuration';
import { writeValues } from '../modules/configuration';
import { getsloppy } from './getsloppy';
import { PathPrompt } from 'inquirer-path'

// Register the datepicker plugin for inquirer
registerPrompt('path', PathPrompt);

/**
 * Fix the user input to be formatted more consistently.
 *
 * @param values Values as input by the user.
 */
function fixValues(values: ValueSet): ValueSet {
    const fixedFolder = FileUtils.formatDirectory(values['htmlFolder']);
    if (fixedFolder !== values['htmlFolder']) {
        log(`Fixing directory formatting: ${values['htmlFolder']} => ${fixedFolder}`);
        values['htmlFolder'] = fixedFolder;
    }
    return values;
}

/**
 * If the directory exists and is a symlink, delete it.
 *
 * TODO: this actually just rejects if it exists.  Still need to figure out how
 * to correctly remove the existing symlink.
 *
 * @param dir Directory to check.
 */
function unlinkIfSymlink(dir: string): Promise<string> {
    return new Promise((resolve, reject) => {
        FileUtils.exists(dir).then((fileExists) => {
            if (!fileExists) {
                resolve(dir);
            } else {
                return FileUtils.directoryIsSymlink(dir).then((isSymlink) => {
                    if (!isSymlink) {
                        reject(`Cannot unlink content folder which is not a symlink: ${dir}`);
                    } else {
                        // TODO
                        reject(`Auto-unlink of content folder is not yet supported.  Delete symlink at ${dir} and run \`lunchlady setup\` again`);
                    }
                });
            }
        });
    });
}

/**
 * Retrieve the HTML directory from the user and link it to our
 * content folder in Sloppy Joe.
 */
function linkHtmlDirectory(): Promise<void> {
    const configFolder = getValue<string>('configFolder');

    return FileUtils.promiseDirectoryExistence(configFolder).then(() => {
        var configQuestions = [
            {
                message: 'Where is the HTML for your blog entries?',
                name: 'htmlFolder',
                type: 'path',
                default: getValue<string>('htmlFolder') || '~/',
                cwd: process.cwd(),
                directoryOnly: true
            }
        ];

        return prompt(configQuestions)
            .then(fixValues)
            .then(writeValues)
            .then(() => {
                const newHtmlFolder = getValue<string>('htmlFolder');
                return FileUtils.promiseDirectoryExistence(newHtmlFolder, false)
                    .then(() => unlinkIfSymlink(getValue('contentFolder')))
                    .then(() => FileUtils.symlink(newHtmlFolder, getValue<string>('contentFolder')))
                    .then(() => log(`Content directory LINKED -- ${getValue<string>('contentFolder')} => ${getValue<string>('htmlFolder')}`));
            })
            .catch(err => log(err));
    }).catch((err) => {
        log(`Could not promise directory existence: ${err}`);
    })
}

/**
 * Retrieves the Sloppy Joe repository, then links the local HTML source folder
 * into it.
 */
export function setup(): Promise<void> {
    const remoteUrl = getValue<string>('sloppyJoeOrigin');
    const branch = getValue<string>('sloppyJoeBranch');

    // TODO: let the user specify where to create the sloppy-joe repository.
    // Default to current folder w/ confirmation yes/no?
    const repoFolder = getValue<string>('sloppyJoeFolder')

    // Link the directory if it doesn't exist.
    return getsloppy(repoFolder, remoteUrl, branch)
    .then(linkHtmlDirectory)
    .then(() => log('Setup Complete!'))
    .catch(log);
}

export default setup;
