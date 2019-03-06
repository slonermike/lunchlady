/**
 * Idiotic script for adding blog entries in my idiotic blog.
 * It's not elegant or clever.  It's functional.
 * But not like, funtional programming functional.
 * Just regular functional.
 */
const inquirer = require('inquirer');

const Configuration = require('../modules/configuration');
const File = require('../utils/File');
const Log = require('../utils/Log');

const supportedFileTypes = (/\.(htm|html)$/i);

const addEntry = function() {
    const contentFolder = Configuration.getValue('contentFolder');
    const contentFile = contentFolder + Configuration.getValue('contentFile');
    const htmlFolder = Configuration.getValue('htmlFolder');

    // Default structure of file data.
    let existingData = {
        entries: []
    };

    let newFiles = [];
    File.promiseDirectoryExistence(contentFolder, false)
        .then(() => {
            return File.promiseFileExistence(contentFile)
                .then(File.readJSON)
                .then((data) => existingData = data)
                .catch(() => {
                    Log.log(`${contentFile} does not yet exist.`);
                });
        })
        .then(() => {
            // Filter to only htm/html files.
            return File.getFilesOfType(htmlFolder, supportedFileTypes)
        })
        .then((files) => {
            // Filter out files we've already assigned to an entry.
            newFiles = files.filter((filename) => {
                // Possible optimization.  O(n^2)
                if (existingData.entries) {
                    for (entry of existingData.entries) {
                        if (entry.file === filename) {
                            return false;
                        }
                    }
                }

                return true;
            });

            if (newFiles.length === 0) {
                Log.log(`No new entries found in content folder: ${contentFolder}`)
                return;
            }

            // Questions for setting up a blog entry.
            var addEntryQuestions = [
                {
                    type: 'list',
                    name: 'filename',
                    choices: newFiles,
                    message: 'Which file would you like to add to your blog?'
                },
                {
                    type: 'input',
                    name: 'title',
                    message: "What is the title of your blog entry?",
                },
                {
                    type: 'checkbox',
                    name: 'tags',

                    // TODO: make these dynamic.
                    choices: [
                        "GameDev",
                        "Parenting",
                        "WebDev",
                        "Javascript",
                        "Unity"
                    ],
                    message: "What tags would you like to apply?"
                }
            ];

            const applyAndWrite = function(answers) {
                const filename = answers['filename'];
                const newEntry = {
                    file: filename,
                    title: answers['title'],
                    tags: answers['tags']
                }
                existingData.entries.push(newEntry);
                return File.writeJSON(contentFile, existingData);
            }

            return inquirer.prompt(addEntryQuestions)
                .then(applyAndWrite)
                .then(() => Log.log("Content update successful."))
                .catch(Log.log);
        })
        .catch((err) => {
            Log.log(`Unable to add entry: ${err}`);
            Log.log('Have you run \`configure\` yet?');
        });
}

module.exports = addEntry;
