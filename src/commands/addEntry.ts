import { promiseDirectoryExistence, promiseFileExistence, readJSON } from "../utils/File";
import { Blog, Site, emptySite } from "../types/site";
import { editEntryAndApply, saveSite } from "./manage";

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

// Register the datepicker prompt.
inquirer.registerPrompt('datepicker', require('inquirer-datepicker'));

/**
 * Present the user with all valid entries that haven't been added to
 * the list and allow them to use those to build out a new entry.
 *
 * TODO: break this code up into smaller chunks.
 * TODO: merge the blog entry update/creation flow between here and `manage`
 *          -- Create an empty entry, then use the manage code update it.
 */
export function addEntry(): Promise<void> {
    const contentFolder = Configuration.getValue('contentFolder');
    const sloppyJoeFolder = Configuration.getValue('sloppyJoeFolder');
    const contentFile = sloppyJoeFolder + Configuration.getValue('contentFile');
    const htmlFolder = Configuration.getValue('htmlFolder');

    // Default structure of file data.
    let loadedSite: Site = emptySite;

    let newFiles = [];
    // Make sure we have the sloppy joe folder available.
    return promiseDirectoryExistence(sloppyJoeFolder, false)

    // And the content folder inside it.
        .then(() => promiseDirectoryExistence(contentFolder, false))

        // Then load in the content file if it exists.
        .then(() => {
            return promiseFileExistence(contentFile)
                // Read it in.
                .then(readJSON)
                .then((data) => loadedSite = data as Site)
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
                if (loadedSite.blog.entries) {
                    for (let entry of loadedSite.blog.entries) {
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
                }
            ];

            const createBarebonesEntry = function(answers) {
                return {
                    file: answers['filename'],
                    title: '',
                    tags: [],
                    date: new Date()
                };
            }

            return inquirer.prompt(addEntryQuestions)
                .then(createBarebonesEntry)
                .then((entry) => editEntryAndApply(loadedSite.blog, entry))
                .then((updatedBlog) => {
                    return {
                        ...loadedSite,
                        blog: updatedBlog
                    } as Site;
                })
                .then(saveSite)
                .then(() => Log.log("Content update successful."))
                .catch(Log.log);
        })
        .catch((err) => {
            Log.log(`Unable to add entry: ${err}`);
            Log.log('Have you run \`lunchlady setup\` yet?');
        });
}
