import { registerPrompt, prompt, Question } from 'inquirer';

import { getValue } from '../modules/configuration';
import { log } from '../utils/Log';
import { promiseFileExistence, readJSON, writeJSON } from '../utils/File';
import { BlogEntry, Blog, Site } from '../types/site';

// Old-school.
const paramCase = require('param-case');

// Register the datepicker plugin for inquirer
registerPrompt('datepicker', require('inquirer-datepicker'));

/** Entry value for adding new tags. */
const ADD_TAG_VALUE = '[Create New Tags]';

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
function getSiteData(contentFile: string): Promise<Site> {
    return promiseFileExistence(contentFile).then((filename) => readJSON(filename) as Promise<Site>);
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
    const maxLength = getValue('maxTagLength');

    if (tag.length > maxLength) {
        return newTag.slice(0, maxLength);
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
function addNewTags(entry: BlogEntry, state: 'start' | 'continue' | 'finish' = 'start'): Promise<BlogEntry> {
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
 * @param blog Blog to apply it to.
 * @param entry Entry to edit.
 */
export function editEntryAndApply(blog: Blog, entry: BlogEntry): Promise<Blog> {
    return editEntry(entry, blog)
        .then((entry) => updateEntry(blog, entry));
}

/**
 * Export the site to `sloppy-joe`
 *
 * @param site Site to export.
 */
export function saveSite(site: Site) {
    const contentFile = getValue('sloppyJoeFolder') + getValue('contentFile');
    return writeJSON(contentFile, site);
}

/**
 * Manage the blog at a high level.
 */
export function editBlog(): Promise<void> {
    const contentFile = getValue('sloppyJoeFolder') + getValue('contentFile');
    let loadedSite: Site;

    return getSiteData(contentFile)
    .then((site) => {
        loadedSite = site;
        return selectEntry(site.blog);
    })
    .then((entry) => editEntryAndApply(loadedSite.blog, entry))
    .then((updatedBlog) => {
        return {
            ...loadedSite,
            blog: updatedBlog
        } as Site;
    })
    .then(saveSite)
    .then(() => log('Site Updated'))
    .catch((err) => {
        log(`manage: ${err}`);
    }) as Promise<void>;
}

