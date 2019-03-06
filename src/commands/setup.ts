import * as inquirer from 'inquirer';
import * as FileUtils from '../utils/File';
import { log } from '../utils/Log';
import { ValueSet } from '../modules/configuration';
import { getValue } from '../modules/configuration';
import { writeValues } from '../modules/configuration';
import { getsloppy } from './getsloppy';

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
    const configFolder = getValue('configFolder');

    return FileUtils.promiseDirectoryExistence(configFolder).then(() => {
        var configQuestions = [
            {
                name: 'htmlFolder',
                type: 'input',
                default: getValue('htmlFolder')
            }
        ];

        // TODO: Implement fuzzy-path inquirer plugin -- https://github.com/adelsz/inquirer-fuzzy-path
        return inquirer.prompt(configQuestions)
            .then(fixValues)
            .then(writeValues)
            .then(() => {
                const newHtmlFolder = getValue('htmlFolder');
                return FileUtils.promiseDirectoryExistence(newHtmlFolder, false)
                    .then(() => unlinkIfSymlink(getValue('contentFolder')))
                    .then(() => FileUtils.symlink(newHtmlFolder, getValue('contentFolder')))
                    .then(() => log(`Content directory LINKED -- ${getValue('contentFolder')} => ${getValue('htmlFolder')}`));
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
    // Link the directory if it doesn't exist.
    return getsloppy().then(linkHtmlDirectory).catch(log);
}

export default setup;
