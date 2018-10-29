const inquirer = require('inquirer');

const Configuration = require('../modules/configuration');
const FileUtils = require('../utils/File');
const Log = require('../utils/Log');


const configure = function () {

    const configFolder = Configuration.getValue('configFolder');

    // Make the directory if it doesn't exist.
    FileUtils.promiseDirectoryExistence(configFolder).then(() => {
        const contentFolder = Configuration.getValue('contentFolder');

        var configQuestions = [
            {
                name: 'contentFolder',
                type: 'input',
                default: contentFolder
            }
        ];

        // TODO: if input folder has alphanumeric at ends, add ./ at beginning and / at end.
        // TODO: make sure we have valid config folder provided.
        // TODO: for some reason, it never asks for a folder when none is there.
        return inquirer.prompt(configQuestions)
            .then(Configuration.writeValues)
            .catch(err => Log.log(err));
    }).catch((err) => {
        Log.log(`Could not promise directory existence: ${err}`);
    });
}

module.exports = configure;
