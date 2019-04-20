import { getValue } from "../modules/configuration";
import { promiseFileExistence, readJSON, FileError, FileErrorType, writeJSON, getFilesOfType, getDirectoriesRecursive, getFilesOfTypeRecursive } from "../utils/File";
import { Site, emptySite, SiteSection, BlogEntry, Blog, emptyBlog, emptyEntry, EntryOrder, parseSite, SITE_DATA_VERSION } from "../types/site";
import { log } from "../utils/Log";
import { Question, prompt, registerPrompt } from "inquirer";
import * as assert from 'assert';
import { migrateSiteData } from "../modules/migration";
import { formatDateTime } from "../modules/date";

const paramCase = require('param-case');
const titleCase = require('title-case');

// Register the datepicker plugin for inquirer
registerPrompt('datepicker', require('inquirer-datepicker'));

/** Files that can be used as source for a blog entry. */
const SUPPORTED_CONTENT_FILES = (/\.(htm|html)$/i);
const SUPPORTED_CSS_FILES = (/\.(css)$/i);

/** Maximum length for a tag. */
const MAX_TAG_LENGTH = 32;

type MenuValue = string | MenuChoice;

enum MenuChoice {
    NIL,
    ADD_NEW,
    CANCEL,
    CHANGE_ORDER,
    CHANGE_DIVS
};

/**
 * Load the blog data from JSON.
 *
 * @param contentFile File from which to load the blog data.
 */
function getSiteData(contentFile: string): Promise<Site> {
    return promiseFileExistence(contentFile)
    .then(readJSON)
    .then(parseSite)
    .then(migrateSiteData);
}

/**
 * Save the site to an output file.
 *
 * @param site Site to save.
 * @param filename Where to save it.
 */
function saveSite(site: Site, filename: string) {
    return writeJSON(filename, site);
}

/**
 * Add a section to the site.
 * @param site Site to work with.
 */
function addSection(site: Site): Promise<Site> {
    const sectionCreationQ: Question = {
        type: 'input',
        name: 'sectionName',
        message: 'Section Name (enter to cancel):',
        default: ''
    };

    return prompt([sectionCreationQ]).then((answers) =>{
        const { sectionName } = answers;
        if (!sectionName) {
            log('Add Section Cancelling...');
            return site;
        }

        const sectionKey = paramCase(sectionName);
        if (!sectionKey) {
            log(`Invalid section name: ${sectionName}`);
            return addSection(site);
        }

        const newSections: Record<string, SiteSection> = {
            ...site.sections
        };

        const newSection: Blog = {
            ...emptyBlog,
            name: sectionName,
            keyName: sectionKey,
        }

        newSections[sectionKey] = newSection;

        return {
            ...site,
            sections: newSections
        } as Site;
    });
}

/**
 * Return an array of all entries, with key and value as properties of
 * each returned object.
 *
 * @param site Site to read entries from.
 */
function entriesAsKvps(site: Site): {value: BlogEntry, key: string}[] {
    return Object.keys(site.entries).map((key) => {
        return {
            key,
            value: site.entries[key]
        };
    });
}

/**
 * Get a list of all used tags, sorted by frequency of use, most to least.
 *
 * @param site Site to get tags from.
 */
function getTags(site: Site): Array<string> {
    const tagMap: Record<string, number> = {};
    Object.keys(site.entries).forEach((key) => {
        const entry = site.entries[key];
        entry.tags.forEach(key => {
            if (!tagMap[key]) {
                tagMap[key] = 0;
            }
            tagMap[key]++;
        });
    });
    const foundKeys = Object.keys(tagMap);
    return foundKeys.sort((a, b) => {
        return tagMap[a] - tagMap[b];
    });
}

/**
 * Used to denote the state of adding more tags.
 */
type AddState = 'start' | 'continue' | 'finish';
const ADD_TAG_VALUE = '[New Tag(s)]';

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
function addNewTags(site: Site, entryKey: string, state: AddState = 'start'): Promise<Site> {
    if (state === 'finish') {
        return new Promise((resolve) => resolve(site));
    }

    const entry = site.entries[entryKey];

    const questions: Question[] = [{
        type: 'input',
        name: 'tag',
        message: "New Tag [Blank to Stop]",
        default: ''
    }];

    return prompt(questions).then((answers) => {
        const rawTag = answers['tag'];
        if (!rawTag) {
            return addNewTags(site, entryKey, 'finish');
        }

        const fixedTag = fixTag(rawTag);
        let returnSite = site;

        // Only add if it's valid and not already in there.
        if (!fixedTag) {
            log(`Invalid Tag: ${rawTag}`);
        } else if (entry.tags.indexOf(fixedTag) !== -1) {
            log(`Existing Tag: ${fixedTag}`);
        } else {
            if (fixedTag !== rawTag) {
                log(`Fixing Tag: \`${rawTag}\` => \`${fixedTag}\``);
            }

            returnSite = {
                ...site
            };
            const newEntries = {
                ...site.entries
            };
            newEntries[entryKey] = {
                ...entry
            };
            newEntries[entryKey].tags = [
                ...entry.tags
            ];
            newEntries[entryKey].tags.push(fixedTag);

            returnSite.entries = newEntries;
        }

        return addNewTags(returnSite, entryKey, 'continue');
    })
}

/**
 * Update the information for an article.
 *
 * @param site Site in which to edit the article.
 * @param articleKey Article to edit.
 */
function editArticle(inputSite: Site, articleKey: string): Promise<Site> {
    const tags = getTags(inputSite);
    tags.push(ADD_TAG_VALUE);
    const entry = inputSite.entries[articleKey];

    const questions: (Question | { format?: string[] })[] = [
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
        const addTagPos = answers['tags'].indexOf(ADD_TAG_VALUE);
        const wantsNewTags = addTagPos >= 0;
        if (wantsNewTags) {
            answers['tags'].splice(addTagPos, 1);
        }

        const newEntries: Record<string, BlogEntry> = {
            ...inputSite.entries
        };
        newEntries[articleKey] = {
            ...entry,
            title: answers['title'],
            tags: answers['tags'],
            date: answers['publish-date']
        };

        const newSite = {
            ...inputSite,
            entries: newEntries
        };

        if (wantsNewTags) {
            return addNewTags(newSite, articleKey);
        } else {
            return newSite;
        }
    })
}

function manuallySortEntries(site: Site, sectionKey: string): Promise<Site> {
    const choices = site.sections[sectionKey].entries.map((entryKey) => {
        return {
            value: entryKey as MenuValue,
            name: site.entries[entryKey].title
        };
    }).concat([
        {
            value: MenuChoice.CANCEL,
            name: '[Done]'
        }
    ]);

    const question: Question = {
        type: 'list',
        name: 'articleKey',
        message: 'Choose Article to Move',
        choices
    };

    return prompt([question])
    .then(answers => {
        const keyToMove: MenuValue = answers['articleKey'];
        if (keyToMove !== MenuChoice.CANCEL) {
            const lessChoices = [...choices];
            const indexToMove = lessChoices.findIndex((choice) => {
                return choice.value === keyToMove;
            });
            assert(indexToMove >= 0);
            lessChoices.splice(indexToMove, 1);
            const selectedTitle = site.entries[keyToMove].title;

            const reorderQ: Question = {
                type: 'list',
                message: `Place \'${selectedTitle}\' after which article?`,
                name: 'afterKey',
                choices: [
                    {
                        value: MenuChoice.NIL as MenuValue,
                        name: '[Make First Article]'
                    }
                ].concat(lessChoices)
            };

            return prompt([reorderQ])
            .then((answers) => {
                const afterKey = answers['afterKey'];

                // lessChoices doesn't include the NIL case, so add one to start by accounting for the -1 case
                // mapping to zero, and so on.
                const insertAtIndex = lessChoices.findIndex((choice) => {
                    return choice.value === afterKey;
                }) + 1;

                // TODO - I hate this.  Simplify the deep copy logic.
                const newSite: Site = {
                    ...site
                };
                newSite.sections = {
                    ...site.sections
                };
                newSite.sections[sectionKey] = {
                    ...newSite.sections[sectionKey]
                };
                newSite.sections[sectionKey].entries = [
                    ...site.sections[sectionKey].entries
                ];
                newSite.sections[sectionKey].entries.splice(indexToMove, 1);
                newSite.sections[sectionKey].entries.splice(insertAtIndex, 0, keyToMove as string);

                return newSite;
            }).then((site) => {
                return manuallySortEntries(site, sectionKey);
            });
        } else {
            return site;
        }
    })
}

/**
 * If the entries are to be sorted by date, update the order by their dates.
 *
 * @param inputSite Site where the articles live.
 * @param sectionKey Section to re-order.
 */
function autoSortEntries(inputSite: Site, sectionKey: string): Site {
    const section = inputSite.sections[sectionKey];
    const orderType = section.entryOrder || EntryOrder.DATE;
    if (orderType !== EntryOrder.DATE) {
        return inputSite;
    }

    const newEntries: string[] = [
        ...section.entries
    ];
    newEntries.sort((key1, key2) => {
        const entry1 = inputSite.entries[key1];
        const entry2 = inputSite.entries[key2];
        return entry2.date.getTime() - entry1.date.getTime();
    });

    const newSection: Blog = {
        ...section
    };
    newSection.entries = newEntries;

    const newSections: Record<string, Blog> = {
        ...inputSite.sections
    };

    newSections[sectionKey] = newSection;
    const newSite: Site = {
        ...inputSite,
        sections: newSections
    };

    return newSite;
}

/**
 *
 * @param site Site being updated.
 * @param sectionKey Section which is changing sort method.
 */
export function changeSectionSort(site: Site, sectionKey: string): Promise<Site> {
    const choices = [
        {
            value: EntryOrder.DATE,
            name: 'Date'
        },
        {
            value: EntryOrder.MANUAL,
            name: 'Manual'
        },
    ];
    const questions = [{
        type: 'list',
        name: 'order',
        choices,
        message: `Sort Method for: ${site.sections[sectionKey].name}`
    }];

    return prompt(questions).then(answers => {
        const newSite = {
            ...site,
            sections: {
                ...site.sections
             }
        } as Site;

        newSite.sections[sectionKey].entryOrder = answers['order'];

        if (answers['order'] === EntryOrder.DATE) {
            return autoSortEntries(site, sectionKey);
        } else {
            return manuallySortEntries(site, sectionKey);
        }
    });
}

/**
 * Remove from the filename all the leading characters pointing to the root folder.
 *
 * @param filename Filename to sanitize.
 */
function sanitizeContentFilename(filename: string): string {
    const htmlFolder = getValue<string>('htmlFolder');
    return filename.replace(htmlFolder, '').replace(/^\//, "");
}

/**
 * Make a key from a filename.
 *
 * @param filename Filename to make a key from.
 */
function makeFileKey(filename: string): string {
    const noExtension = filename.replace(/\.[^/.]+$/, "");
    return paramCase(noExtension);
}

/**
 * Add an article to a section in the site.
 *
 * @param site Site to which the article will be added.
 */
function addArticle(ogSite: Site, sectionKey: string): Promise<Site> {
    const htmlFolder = getValue<string>('htmlFolder');
    let newEntryKey;
    return getFilesOfTypeRecursive(htmlFolder, SUPPORTED_CONTENT_FILES)
    .then(rawFiles => rawFiles.map(sanitizeContentFilename))
    .then((allFiles) => {
        const existingEntries = entriesAsKvps(ogSite);
        const unusedFiles = allFiles.filter((file) => {
            if (existingEntries.findIndex((kvp) => kvp.value.file === file) >= 0) {
                return false;
            }

            if (ogSite.divs.indexOf(file) >= 0) return false;

            return true;
        });

        if (unusedFiles.length === 0) {
            // TODO: make this stand out better with red text, or a red x or something.
            log('No new entry files found in HTML dirctory.');
            return ogSite;
        }

        const addEntryQ: Question = {
            type: 'list',
            name: 'filename',
            choices: unusedFiles,
            message: 'Choose a file from which to create an entry.'
        }

        return prompt([addEntryQ])
        .then((answers) => {
            const { filename } = answers;
            const keyName = makeFileKey(filename);

            const alreadyExists = !!ogSite.entries[keyName];
            assert(!alreadyExists, `Key (${keyName}) collision on file ${filename} and ${ogSite.entries[keyName] && ogSite.entries[keyName].file}`);
            const newEntry = {
                ...emptyEntry
            };

            newEntry.file = filename;
            newEntry.keyName = keyName;
            newEntry.title = titleCase(keyName);

            // TODO: this seems really messy.  Is there a better way to prevent overwrite of the existing site object?
            const newSite: Site = {
                ...ogSite,
                entries: {
                    ...ogSite.entries
                },
                sections: {
                    ...ogSite.sections
                }
            };
            newSite.sections[sectionKey] = {
                ...newSite.sections[sectionKey]
            };

            newEntryKey = keyName;
            newSite.entries[keyName] = newEntry;
            newSite.sections[sectionKey].entries.unshift(keyName);

            return newSite;
        }).then((site) => {
            if (newEntryKey) {
                return editArticle(site, newEntryKey).then((site) => autoSortEntries(site, sectionKey));
            } else {
                return site;
            }
        });
    });
}

/**
 * Make changes to a section.
 * @param site Site to work with.
 * @param sectionKey Key to the section to work with.
 */
function manageSection(site: Site, sectionKey: string): Promise<Site> {
    log(`Managing Section: ${sectionKey}`);
    const entryOrder = site.sections[sectionKey].entryOrder;

    const articlePickerQ: Question = {
        type: 'list',
        name: 'userInput',
        message: 'Choose Article',
        choices: ([
            {
                value: MenuChoice.ADD_NEW as MenuValue,
                name: '[New Article]'
            },
            {
                value: MenuChoice.CHANGE_ORDER as MenuValue,
                name: '[Sort Order]'
            },
            {
                value: MenuChoice.CANCEL as MenuValue,
                name: '[Back]'
            }
        ]).concat(site.sections[sectionKey].entries.map((entryKey) => {
            const entry: BlogEntry = site.entries[entryKey];
            const name = entryOrder === EntryOrder.DATE ? `${formatDateTime(entry.date)} - ${entry.title}` : entry.title;
            return {
                value: entryKey as MenuValue,
                name
            };
        }))
    };

    return prompt([articlePickerQ])
    .then(answers => {
        const { userInput } = answers;
        if (userInput === MenuChoice.ADD_NEW) {
            return addArticle(site, sectionKey)
            .then((site) => manageSection(site, sectionKey));
        } else if (userInput === MenuChoice.CHANGE_ORDER) {
            return changeSectionSort(site, sectionKey)
            .then((site) => manageSection(site, sectionKey));
        } else if (userInput === MenuChoice.CANCEL) {
            return site;
        } else if (site.entries[userInput]) {
            return editArticle(site, userInput)
            .then((site) => autoSortEntries(site, sectionKey))
            .then((site) => manageSection(site, sectionKey));
        }
        return site;
    });
}

/**
 * Change which HTML files are applied to every page of the site.
 *
 * @param ogSite Input site.
 */
function applySiteDivs(ogSite: Site): Promise<Site> {
    return new Promise<Site>((resolve, _reject) => {
        const htmlFolder = getValue<string>('htmlFolder');
        getFilesOfTypeRecursive(htmlFolder, SUPPORTED_CONTENT_FILES)
            .then(rawFiles => rawFiles.map(sanitizeContentFilename))
            .then(divFiles => {
                // Filter out HTML used for articles.
                divFiles = divFiles.filter(divFile => {
                    return !ogSite.entries[makeFileKey(divFile)];
                });

                if (divFiles.length === 0) {
                    log(`No HTML files found in structure at: ${htmlFolder}`);
                    resolve(ogSite);
                }

                const questions: Question[] = [
                    {
                        type: 'checkbox',
                        name: 'divFiles',
                        choices: divFiles,
                        message: "Choose the HTML files to apply to entire site.",
                        default: ogSite.divs
                    }
                ];
                prompt(questions)
                    .then(answers => {
                        resolve({
                            ...ogSite,
                            divs: answers['divFiles']
                        });
                    });
            }).catch(err => {
                log(`Error applying new CSS: ${err}`);
                resolve(ogSite);
            });
    });
}

/**
 * Manage the site from the top level.
 * @param site Site to work with.
 */
function manageSiteTop(site: Site): Promise<Site> {
    const sectionPickerQ: Question = {
        type: 'list',
        name: 'section',
        message: 'Manage Site',
        choices: Object.keys(site.sections).map((key) => {
            return {
                value: key as MenuValue,
                name: site.sections[key].name
            };
        }).concat([
            {
                value: MenuChoice.ADD_NEW as MenuValue,
                name: '[New Section]'
            },
            {
                value: MenuChoice.CHANGE_DIVS as MenuValue,
                name: '[Change Site-Level HTML]'
            },
            {
                value: MenuChoice.CANCEL as MenuValue,
                name: '[Save & Quit]'
            }
        ])
    };

    return prompt([sectionPickerQ]).then((answers) => {
        const chosenSection = answers['section'];
        if (chosenSection === MenuChoice.ADD_NEW) {
            return addSection(site)
                .then(manageSiteTop);
        } else if (chosenSection === MenuChoice.CHANGE_DIVS) {
            return applySiteDivs(site)
                .then(manageSiteTop);
        } else if (chosenSection === MenuChoice.CANCEL) {
            return site;
        } else if (site.sections[chosenSection]) {
            return manageSection(site, chosenSection)
                .then(manageSiteTop);
        } else {
            log(`Unknown section: ${chosenSection}`);
        }

        return site;
    });
}

/**
 * Manage the content of the website via CLI.
 */
export function manageContent(): Promise<Site> {
    const contentFile = getValue<string>('contentFolder') + getValue<string>('contentFile');

    return getSiteData(contentFile)
    .catch((err: FileError) => {
        if (err.type === FileErrorType.DOES_NOT_EXIST) {
            log(`Content file does not exist.  Creating.`);
        } else {
            log(`Unknown error: ${err}`);
        }

        // Return an empty site.
        const newSite: Site = {
            ...emptySite
        };

        return saveSite(newSite, contentFile)
        .then(() => newSite);
    })
    .then(manageSiteTop)
    .then((site) => {
        return saveSite(site, contentFile)
        .then(() => {
            log(`Content saved to: ${contentFile}`);
            return site;
        });
    });
}