import { registerPrompt, prompt, Question } from 'inquirer';

import { getValue } from '../modules/configuration';
import { log } from '../utils/Log';
import { promiseFileExistence, readJSON, writeJSON } from '../utils/File';
import { BlogEntry, Blog } from '../types/blog';

// Old-school.
const paramCase = require('param-case');

// Register the datepicker plugin for inquirer
registerPrompt('datepicker', require('inquirer-datepicker'));

/** Entry value for adding new tags. */
const ADD_TAG_VALUE = '[Create New Tags]';

/** Maximum length for a tag. */
const MAX_TAG_LENGTH = 32;

type AddState = 'start' | 'continue' | 'finish';

/**
 * Allow use of 'format' for the datepicker.
 */
type ManageQ = Question | {
    format?: string[]
};

/**z
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
function editEntry(entry: BlogEntry, blog: Blog): Promise<BlogEntry> {
    const tags = getBlogTags(blog);
    tags.push(ADD_TAG_VALUE);

    const questions: ManageQ[] = [
        {
            type: 'input',
            name: 'title',
            message: "Entry Title",
            default: entry.title
        },
        {
            type: 'datepicker',
            name: 'publish-date',
            message: 'Publish date: ',
            format: ['Y', '/', 'MM', '/', 'DD', ' ', 'hh', ':', 'mm', ' ', 'A'],
            default: new Date(entry.date)
        },
        {
            type: 'checkbox',
            name: 'tags',
            choices: tags,
            message: "Content Tags",
            default: entry.tags
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
        }).then(addNewTags);
}

/**
 * Fix the formatting & length of the tag.
 *
 * @param tag Tag to fix.
 */
function fixTag(tag: string): string {
    const newTag = paramCase(tag);
    if (tag.length > MAX_TAG_LENGTH) {
        return newTag.slice(0, MAX_TAG_LENGTH);
    } else {
        return newTag;
    }
}

/**
 * Add new tags to an entry, or do nothing if we didn't
 * request that.
 *
 * @param entry Entry to which we want to add new tags.
 */
function addNewTags(entry: BlogEntry, state: AddState = 'start'): Promise<BlogEntry> {
    if (state === 'start' ) {
        const addTagPos = entry.tags.indexOf(ADD_TAG_VALUE);
        if (addTagPos === -1) {
            state = 'finish';
        } else {
            // Remove the 'add tag' entry.
            entry.tags.splice(addTagPos, 1);
        }
    }

    if (state === 'finish') {
        return new Promise((resolve) => resolve(entry));
    }

    const questions: Question[] = [{
        type: 'input',
        name: 'tag',
        message: "New Tag [Blank to Stop]",
        default: ''
    }];

    return prompt(questions).then((answers) => {
        const rawTag = answers['tag'];
        if (!rawTag) {
            return addNewTags(entry, 'finish');
        }

        const fixedTag = fixTag(rawTag);

        // Only add if it's valid and not already in there.
        if (!fixedTag) {
            log(`Invalid Tag: ${rawTag}`);
        } else if (entry.tags.indexOf(fixedTag) !== -1) {
            log(`Existing Tag: ${fixedTag}`);
        } else {
            if (fixedTag !== rawTag) {
                log(`Fixing Tag: \`${rawTag}\` => \`${fixedTag}\``);
            }
            entry.tags.push(fixedTag);
        }

        return addNewTags(entry, 'continue');
    })
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
 * Get the list of all the tags used by the blog.
 *
 * @param blog Blog from which to retrieve the tags.
 */
function getBlogTags(blog: Blog): string[] {
    const foundTags: Record<string, boolean> = {};
    blog.entries.map((entry: BlogEntry) => {
        entry.tags.map((tag) => {
            foundTags[tag] = true;
        });
    });

    return Object.keys(foundTags);
}

/**
 * Edit an entry and save it to the blog.
 * @param blog Blog to save it to.
 * @param entry Entry to edit.
 */
export function editEntryAndSave(blog: Blog, entry: BlogEntry): Promise<void> {
    const contentFile = getValue('sloppyJoeFolder') + getValue('contentFile');
    return editEntry(entry, blog)
        .then((entry) => updateEntry(blog, entry))
        .then((updatedBlog) => writeJSON(contentFile, updatedBlog)).then(() => {
            console.log('Entry updated.');
        });
}

/**
 * Manage the blog at a high level.
 */
export function manage(): Promise<void> {
    const contentFile = getValue('sloppyJoeFolder') + getValue('contentFile');
    let loadedBlog: Blog;

    return getBlogData(contentFile)
    .then((blog) => {
        loadedBlog = blog;
        return selectEntry(blog);
    })
    .then((entry) => editEntryAndSave(loadedBlog, entry))
    .catch((err) => {
        log(`manage: ${err}`);
    }) as Promise<void>;
}

