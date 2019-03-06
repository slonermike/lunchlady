const inquirer = require('inquirer');

const Configuration = require('../modules/configuration');
const File = require('../utils/File');
const Log = require('../utils/Log');

// Register the datepicker plugin for inquirer
inquirer.registerPrompt('datepicker', require('inquirer-datepicker'));

const getBlogData = function(contentFile) {
    return File.promiseFileExistence(contentFile).then(File.readJSON);
}

/**
 * Resolves to an updated version of the input entry.
 * Does not mutate the state of the input entry.
 *
 * @param {Object} entry Entry to be edited.
 */
const editEntry = function(entry) {
    const questions = [
        {
            type: 'input',
            name: 'title',
            message: "Entry Title",
            default: entry.title
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
            message: "Content Tags",
            default: entry.tags
        },
        {
            type: 'datepicker',
            name: 'publish-date',
            message: 'Publish date: ',
            format: ['Y', '/', 'MM', '/', 'DD', ' ', 'hh', ':', 'mm', ' ', 'A'],
            default: new Date(entry.date)
        }
    ];

    return inquirer.prompt(questions)
        .then((answers) => {
            return {
                file: entry.file,
                title: answers['title'],
                tags: answers['tags'],
                date: answers['publish-date']
            };
        });
}

/**
 * Allow the user to select a blog entry.
 * Resolves to the object describing the entry.
 *
 * @param {object} blogData Raw entry for the blog.
 */
const selectEntry = function(blogData) {
    const questions = [
        {
            type: 'list',
            name: 'index',
            message: 'Choose Entry',
            choices: blogData.entries.map((entry, index) => {
                return {
                    value: index,
                    name: `${entry.title}`
                };
            })
        }
    ];

    return inquirer.prompt(questions).then((entry) => {
        return blogData.entries[entry.index];
    });
}

/**
 * Add or update an entry to the blog.
 *
 * @param {object} blog Top-level blog object to update
 * @param {object} entry Entry data to write into the blog.
 */
const updateEntry = function(blog, entry) {
    // Look for an existing entry using the specified filename.
    const existingIndex = blog.entries.findIndex((existingEntry) => {
        return entry.file === existingEntry.file;
    });

    const newIndex = existingIndex >= 0 ? existingIndex : blog.entries.length;

    // TODO: We are updating the object in place.  Should we make a copy?
    blog.entries[newIndex] = entry;

    return blog;
}

/**
 * Let the user choose an entry to update, and update it.
 * Resolves to the updated blog object.
 *
 * @param {object} blog Blog from which the user will choose an item to update.
 */
const inputEntryUpdate = function(blog) {
    return selectEntry(blog)
    .then(editEntry)
    .then((newEntry) => updateEntry(blog, newEntry));
}

const manage = function() {
    const contentFolder = Configuration.getValue('contentFolder');
    const contentFile = contentFolder + Configuration.getValue('contentFile');

    getBlogData(contentFile)
    .then(inputEntryUpdate)
    .then((updatedBlog) => File.writeJSON(contentFile, updatedBlog))
    .catch((err) => {
        Log.log(`manage: ${err}`);
    });
}

module.exports = manage;
