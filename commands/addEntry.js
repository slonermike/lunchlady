/**
 * Idiotic script for adding blog entries in my idiotic blog.
 * It's not elegant or clever.  It's functional.
 * But not like, funtional programming functional.
 * Just regular functional.
 */
const fs = require('fs');
const inquirer = require('inquirer');

const Log = require('../utils/Log');

const contentFolder = "./content/";
const jsonFile = "index.json";
const supportedFileTypes = (/\.(htm|html)$/i);

// Default data structure.
var jsonStructure = {
    entries: []
};

// TODO: convert this to be more async/promise-y.
//
const addEntry = function() {
    // Make the content directory if it doesn't exist.
    if (!fs.existsSync(contentFolder)) {
        fs.mkdirSync(contentFolder);
    }

    // Read the content file if it exists.
    if (fs.existsSync(contentFolder + jsonFile)) {
        var jsonText = fs.readFileSync(contentFolder + jsonFile);
        jsonStructure = JSON.parse(jsonText);
    }

    // Filter out non-html and existing content.
    const existingStuff = fs.readdirSync(contentFolder);
    const htmlFiles = existingStuff.filter((filename) => {
        const matches = filename.match(supportedFileTypes);
        if (!matches || matches.length === 0) {
            return false;
        }

        // Possible optimization.  O(n^2)
        for (entry of jsonStructure.entries) {
            if (entry.file === filename) {
                return false;
            }
        }

        return true;
    });

    // Bail if no new content available.
    if (!htmlFiles || htmlFiles.length === 0) {
        Log.log("No new html files found in content folder: " + contentFolder);
        process.exit(1);
    }

    // Questions for setting up a blog entry.
    var addEntryQuestions = [
        {
            type: 'list',
            name: 'filename',
            choices: htmlFiles,
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
            choices: [
                "GameDev",
                "Parenting",
                "WebDev",
                "Javascript",
                "Unity"
            ],
            message: "What tags would you like to apply?"
        }
    ]

    // Finalize.
    inquirer.prompt(addEntryQuestions).then(answers => {
        const filename = answers['filename'];
        const newEntry = {
            file: filename,
            title: answers['title'],
            tags: answers['tags']
        }
        jsonStructure.entries.push(newEntry);
        Log.log("Writing: \n" + JSON.stringify(jsonStructure));

        // Store new JSON.
        fs.writeFileSync(contentFolder + jsonFile, JSON.stringify(jsonStructure));
    })
}

module.exports = addEntry;
