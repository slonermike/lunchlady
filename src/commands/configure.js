const inquirer = require('inquirer');

const Configuration = require('../modules/configuration');
const FileUtils = require('../utils/File');
const Log = require('../utils/Log');

/**
 * Fix the user input to be formatted more consistently.
 *
 * @param {Object} values Values as input by the user.
 */
const fixValues = function(values) {
    const fixedFolder = FileUtils.formatDirectory(values['htmlFolder']);
    if (fixedFolder !== values['htmlFolder']) {
        Log.log(`Fixing directory formatting: ${values['htmlFolder']} => ${fixedFolder}`);
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
 * @param {String} dir Directory to check.
 */
const unlinkIfSymlink = function(dir) {
    return new Promise((resolve, reject) => {
        FileUtils.exists(dir).then((fileExists) => {
            if (!fileExists) {
                resolve(dir);
            } else {
                return FileUtils.directoryIsSymlink(dir).then((isSymlink) => {
                    if (!isSymlink) {
                        reject(`Cannot unlink content folder which is not a symlink: ${dir}`);
                    } else {
                        reject(`Auto-unlink of content folder is not yet supported.  Delete symlink at ${dir} and run \`configure\` again`);
                    }
                });
            }
        });
    });
}

const configure = function () {

    const configFolder = Configuration.getValue('configFolder');

    // Link the directory if it doesn't exist.
    FileUtils.promiseDirectoryExistence(configFolder).then(() => {
        var configQuestions = [
            {
                name: 'htmlFolder',
                type: 'input',
                default: Configuration.getValue('htmlFolder')
            }
        ];

        return inquirer.prompt(configQuestions)
            .then(fixValues)
            .then(Configuration.writeValues)
            .then(() => {
                const newHtmlFolder = Configuration.getValue('htmlFolder');
                return FileUtils.promiseDirectoryExistence(newHtmlFolder, false)
                    .then(() => unlinkIfSymlink(Configuration.getValue('contentFolder')))
                    .then(() => FileUtils.symlink(newHtmlFolder, Configuration.getValue('contentFolder')))
                    .then(() => Log.log(`Content directory LINKED -- ${Configuration.getValue('contentFolder')} => ${Configuration.getValue('htmlFolder')}`));
            })
            .catch(err => Log.log(err));
    }).catch((err) => {
        Log.log(`Could not promise directory existence: ${err}`);
    });
}

module.exports = configure;
