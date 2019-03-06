import { registerPrompt, prompt, Question } from 'inquirer';

import { getValue } from '../modules/configuration';
import { log } from '../utils/Log';
import { promiseFileExistence, readJSON, writeJSON } from '../utils/File';
import { BlogEntry, Blog } from '../types/blog';

// Register the datepicker plugin for inquirer
registerPrompt('datepicker', require('inquirer-datepicker'));

/**
 * Allow use of 'format' for the datepicker.
 */
type ManageQ = Question | {
    format?: string[]
};

/**
 * Load the blog data from JSON.
 *
 * @param contentFile File from which to load the blog data.
 */
function getBlogData(contentFile: string): Promise<Blog> {
    return promiseFileExistence(contentFile).then((filename) => readJSON(filename) as Promise<Blog>);
}

/**
 * Resolves to an updated version of the input entry.
 * Does not mutate the state of the input entry.
 *
 * @param entry Entry to be edited.
 */
function editEntry(entry: BlogEntry): Promise<BlogEntry> {
    const questions: ManageQ[] = [
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

    return prompt(questions as Question[])
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
 * @param blogData Raw entry for the blog.
 */
function selectEntry(blogData: Blog): Promise<BlogEntry> {
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

    return prompt(questions).then((entry: {index: number}) => {
        return blogData.entries[entry.index];
    });
}

/**
 * Add or update an entry to the blog.
 *
 * @param blog Top-level blog object to update
 * @param entry Entry data to write into the blog.
 */
function updateEntry(blog: Blog, entry: BlogEntry): Blog {
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
 * @param blog Blog from which the user will choose an item to update.
 */
function inputEntryUpdate(blog: Blog): Promise<Blog> {
    return selectEntry(blog)
    .then(editEntry)
    .then((newEntry) => updateEntry(blog, newEntry));
}

export function manage(): Promise<void> {
    const contentFolder = getValue('contentFolder');
    const contentFile = contentFolder + getValue('contentFile');

    return getBlogData(contentFile)
    .then(inputEntryUpdate)
    .then((updatedBlog) => writeJSON(contentFile, updatedBlog))
    .catch((err) => {
        log(`manage: ${err}`);
    }) as Promise<void>;
}

