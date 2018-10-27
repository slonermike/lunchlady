const fs = require('fs');
const inquirer = require('inquirer');

const FileUtils = require('./FileUtils');

const configFolder = "./config/";
const configFile = "config.json";

const configure = function () {

    // Make the directory if it doesn't exist.
    FileUtils.exists(configFolder)
        .catch(FileUtils.mkdir);

    let config = {
        contentFolder: './content/'
    };

    const fullConfigFile = configFolder + configFile;
    FileUtils.exists(fullConfigFile)
        .then(FileUtils.readJSON)
        .catch((err) => {
            // File doesn't exist.  Use existing config.
            return config;
        })
        .then(data => {
            config = data;
        });

    var configQuestions = [
        {
            name: 'contentFolder',
            type: 'input',
            default: config.contentFolder
        }
    ];

    const writeConfigFile = function(data) {
        return new Promise((resolve, reject) => {
            FileUtils.writeJSON(fullConfigFile, data).catch(reject).then(resolve);
        });
    };

    // TODO: if input folder has alphanumeric at ends, add ./ at beginning and / at end.
    // TODO: make sure we have valid config folder provided.
    // TODO: for some reason, it never asks for a folder when none is there.
    inquirer.prompt(configQuestions).then(writeConfigFile).catch(err => console.log(err));

    return
}

module.exports = configure;
