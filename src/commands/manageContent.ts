import { Configuration } from "../modules/configuration";
import { promiseFileExistence, readJSON, FileError, FileErrorType, writeJSONToFile, getFilesOfTypeRecursive, writeTextToFile, getSubdirectories, promiseDirectoryExistence } from "../utils/File";
import { Site, emptySite, SiteSection, BlogEntry, Blog, emptyBlog, emptyEntry, EntryOrder, parseSite } from "../types/site";
import { log, error } from "../utils/Log";
import { Question, prompt, registerPrompt } from "inquirer";
import * as assert from 'assert';
import { migrateSiteData } from "../modules/migration";
import { formatDateTime } from "../modules/date";
import { resolve } from "url";

const paramCase = require('param-case');
const titleCase = require('title-case');

// Register the datepicker plugin for inquirer
registerPrompt('datepicker', require('inquirer-datepicker'));

/** Files that can be used as source for a blog entry. */
const SUPPORTED_HTML_FILES = (/\.(htm|html)$/i);
const SUPPORTED_CSS_FILES = (/\.(css)$/i);

/** Maximum length for a tag. */
const MAX_TAG_LENGTH = 32;

type MenuValue = string | MenuChoice;

enum MenuChoice {
    NIL,
    ADD_NEW,
    RENAME,
    CANCEL,
    CHANGE_ORDER,
    CHANGE_THEME
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
    return writeJSONToFile(filename, site);
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
    });
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
 * Change the way the entries in a section are ordered.
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
function sanitizeFilename(filename: string, rootFolder: string): string {
    return filename.replace(rootFolder, '').replace(/^\//, "");
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
 * Select a section to move in order, then select where to
 * place it in the new order.
 *
 * @param site Site in which to reorder the sections.
 */
function reorderSections(site: Site): Promise<Site> {
    const choices = site.sectionOrder.map((sectionKey) => {
        return {
            value: sectionKey as MenuValue,
            name: site.sections[sectionKey].name
        };
    }).concat([
        {
            value: MenuChoice.CANCEL,
            name: '[Done]'
        }
    ]);

    const question: Question = {
        type: 'list',
        name: 'sectionKey',
        message: 'Choose Section to Move',
        choices
    };

    return prompt([question])
    .then(answers => {
        const keyToMove: MenuValue = answers['sectionKey'];
        if (keyToMove !== MenuChoice.CANCEL) {
            const lessChoices = [...choices];
            const indexToMove = lessChoices.findIndex((choice) => {
                return choice.value === keyToMove;
            });
            assert(indexToMove >= 0);
            lessChoices.splice(indexToMove, 1);
            const selectedTitle = site.sections[keyToMove].name;

            const reorderQ: Question = {
                type: 'list',
                message: `Place \'${selectedTitle}\' after which section?`,
                name: 'afterKey',
                choices: [
                    {
                        value: MenuChoice.NIL as MenuValue,
                        name: '[Make First Section]'
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
                newSite.sectionOrder.splice(indexToMove, 1);
                newSite.sectionOrder.splice(insertAtIndex, 0, keyToMove as string);

                return newSite;
            }).then((site) => {
                return reorderSections(site);
            });
        } else {
            return site;
        }
    });
}

function renameSection(ogSite: Site, ogKey: string): Promise<Site> {
    const renameQ: Question = {
        type: 'input',
        name: 'title',
        message: "Section Title",
        default: ogSite.sections[ogKey].name
    };

    return prompt([renameQ]).then((answers) => {
        const newName = answers['title'];
        const newKey = paramCase(newName);
        if (!newKey) {
            log(`Invalid section name: ${newName}`);
            return renameSection(ogSite, ogKey);
        }

        const newSection = {
            ...ogSite.sections[ogKey],
            name: newName,
            keyName: newKey
        };

        // TODO: Do we reference the section keys anywhere else?

        const newSite = {...ogSite};
        delete newSite.sections[ogKey];
        newSite.sections[newKey] = newSection;
        newSite.sectionOrder = newSite.sectionOrder.map(sectionKey => sectionKey === ogKey ? newKey : sectionKey);
        return newSite;
    });
}

/**
 * Create an article object from a filename.
 *
 * @param filename Filename where the content exists.
 */
function createArticle(filename: string): BlogEntry {
    filename = sanitizeFilename(filename, Configuration.contentFolder);

    const keyName = makeFileKey(filename);

    const newEntry = {
        ...emptyEntry
    };

    newEntry.file = filename;
    newEntry.keyName = keyName;
    newEntry.title = titleCase(keyName);

    return newEntry;
}

/**
 * Add an article object to the blog in a specified section.
 *
 * @param ogSite Site to which you'll add it.
 * @param sectionKey Section into which to add it.
 * @param entry Entry object to add.
 */
function addArticleToSection(ogSite: Site, sectionKey: string, entry: BlogEntry): Site {
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

    newSite.entries[entry.keyName] = entry;
    newSite.sections[sectionKey].entries.unshift(entry.keyName);

    return newSite;
}

/**
 * Add an article to a section in the site.
 *
 * @param site Site to which the article will be added.
 */
function addArticle(ogSite: Site, sectionKey: string): Promise<Site> {
    const htmlFolder = Configuration.contentFolder;
    let newEntryKey;
    return getFilesOfTypeRecursive(htmlFolder, SUPPORTED_HTML_FILES)
    .then(rawFiles => rawFiles.map(fileName => sanitizeFilename(fileName, Configuration.contentFolder)))
    .then((allFiles) => {
        const existingEntries = entriesAsKvps(ogSite);
        const unusedFiles = allFiles.filter((file) => {
            if (existingEntries.findIndex((kvp) => kvp.value.file === file) >= 0) {
                return false;
            }

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
            const newEntry = createArticle(filename);
            const keyName = newEntry.keyName;
            newEntryKey = keyName;

            const alreadyExists = !!ogSite.entries[keyName];
            assert(!alreadyExists, `Key (${keyName}) collision on file ${filename} and ${ogSite.entries[keyName] && ogSite.entries[keyName].file}`);

            return addArticleToSection(ogSite, sectionKey, newEntry);
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
                value: MenuChoice.RENAME as MenuValue,
                name: '[Rename Section]'
            },
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
        } else if (userInput === MenuChoice.RENAME) {
            return renameSection(site, sectionKey);
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
 * Retrieve all the appropriate files associated with a theme.
 *
 * @param theme Theme to get the files for.
 */
function getThemeFiles(theme: string): Promise<{
    css: string[],
    divs: Record<string, string[]>
}> {
    const files = {
        css: [],
        divs: {}
    };

    const specificThemeFolder = `${Configuration.themeFolder}/${theme}`;
    const cssFolder = `${specificThemeFolder}/css`;
    const cssPromise = promiseDirectoryExistence(cssFolder, false)
        .then(dirExists => {
            if (dirExists) {
                return getFilesOfTypeRecursive(cssFolder, SUPPORTED_CSS_FILES)
            } else {
                return [];
            }
        })
        .then(cssFiles => {
            files.css = cssFiles.map(cssFile => sanitizeFilename(cssFile, Configuration.themeFolder));
        }).catch(err => {
            if (err.type !== FileErrorType.DOES_NOT_EXIST) {
                error(`Error getting css files for theme: ${theme} -- ${err}`);
            }
            return [];
        });

    const htmlFolder = `${specificThemeFolder}/html`;
    const htmlPromise = promiseDirectoryExistence(htmlFolder, false)
        .then(dirExists => {
            if (dirExists) {
                return getFilesOfTypeRecursive(htmlFolder, SUPPORTED_HTML_FILES);
            } else {
                return [];
            }
        })
        .then(htmlFiles => {
            htmlFiles.forEach(rawFilename => {
                const nameWithCategory = sanitizeFilename(rawFilename, htmlFolder);
                const categoryLength = nameWithCategory.indexOf("/");

                let categoryName = 'headers';
                if (categoryLength <= 0) {
                    log(`Error retrieving category name for div html \'${rawFilename}\'.  Putting into \'headers\' category.`)
                } else {
                    categoryName = nameWithCategory.slice(0, categoryLength);
                }

                files.divs[categoryName] = files.divs[categoryName] || [];
                files.divs[categoryName].push(sanitizeFilename(rawFilename, Configuration.themeFolder));
            })
        }).catch(err => {
            if (err.type !== FileErrorType.DOES_NOT_EXIST) {
                error(`Error getting html files for theme: ${theme} -- ${err}`);
            }
            return [];
        });

    return Promise.all([cssPromise, htmlPromise]).then(() => files);
}

/**
 * Get all HTML & CSS associated with the site's themes and apply them
 *
 * @param site Site to apply themes for.
 */
function applyThemes(site: Site): Promise<Site> {
    const newSite: Site = {
        ...site,
        divs: {},
        css: []
    };
    const promises = site.themes.map(theme => {
        return getThemeFiles(theme).then(files => {
            newSite.divs = {
                ...newSite.divs,
                ...files.divs
            };
            newSite.css = [
                ...newSite.css,
                ...files.css
            ];
        });
    });

    // After all promises ahve completed, return the new site.
    return Promise.all(promises).then(() => {
        return newSite;
    }).catch(err => {
        error(`Error applying themes: ${err}`);
        return newSite;
    });
}

/**
 * Select the themes to be applied to the site.
 *
 * @param site Site to which the themes will be applied.
 */
function selectThemes(site: Site): Promise<Site> {
    return new Promise<Site>((resolve, _reject) => {
        const themeFolder = Configuration.themeFolder;
        getSubdirectories(themeFolder)
        .then(filenames => filenames.map((filename) => sanitizeFilename(filename, Configuration.themeFolder)))
        .then(folders => {
            const questions = [
                {
                    type: 'checkbox',
                    name: 'themes',
                    choices: folders,
                    message: 'Which themes would you like to apply?',
                    default: site.themes
                }
            ];

            prompt(questions).then((answers: { themes: string[] }) => {
                return {
                    ...site,
                    themes: answers.themes
                };
            })
            .then(applyThemes)
            .then(site => resolve(site));
        })
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
                value: MenuChoice.CHANGE_ORDER as MenuValue,
                name: '[Reorder Sections]'
            },
            {
                value: MenuChoice.CHANGE_THEME as MenuValue,
                name: '[Change Site Theme]'
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
        } else if (chosenSection === MenuChoice.CHANGE_ORDER) {
            return reorderSections(site)
                .then(manageSiteTop);
        } else if (chosenSection === MenuChoice.CHANGE_THEME) {
            return selectThemes(site)
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
 * Create an empty site and save it to the specified location
 *
 * @param contentFile Where to save the site data.
 */
export function createSite(contentFile: string): Promise<Site> {

    // Create a site with a 'Home' section.
    const defaultSectionKey = 'home';
    const newSite: Site = {
        ...emptySite,
        themes: ['default']
    };
    newSite.sections[defaultSectionKey] = {
        ...emptyBlog,
        name: 'Home',
        keyName: defaultSectionKey,
    };
    newSite.sectionOrder = [defaultSectionKey];

    const titleQuestion: Question = {
        type: 'input',
        name: 'title',
        message: "Site Title"
    }

    const articlePath = `${Configuration.contentFolder}dummy-entry.html`;
    const testEntryTitle = 'Site Created'
    const testEntryText = `
    <p>
        Congrats! You have successfully created your own Sloppy Joe
        site using Lunchlady.  Run \`lunchlady\` again to access
        Lunchlady's content management capabilities.
    </p>
    <p>
        This entry is found in your content folder at ${Configuration.contentFolder}.
        To create more entries, add them as HTML files in your content folder, then
        run \`lunchlady\` again, select \'[Manage Site]\', choose a section and select
        \`[New Article]\`.
    </p>
    <p>
        For more information about Lunchlady and Sloppy Joe, visit their GitHub Repositories.
        <ul>
            <li><a href="https://github.com/slonermike/lunchlady">Lunchlady on GitHub</a></li>
            <li><a href="https://github.com/slonermike/sloppy-joe">Sloppy Joe on GitHub</a></li>
        </ul>
    </p>
    `;

    return prompt([titleQuestion])
        .then(answers => {
            newSite.siteTitle = answers['title'];
            return newSite;
        })
        .then(applyThemes)
        .then((site) => {
            return writeTextToFile(articlePath, testEntryText)
            .then(() => {
                const newArticle = createArticle(articlePath);
                newArticle.title = testEntryTitle;
                return addArticleToSection(site, defaultSectionKey, newArticle);
            });
        })
        .then((site) => {
            saveSite(site, contentFile);
            return site;
        });
}

/**
 * Manage the content of the website via CLI.
 */
export function manageContent(): Promise<Site> {
    const contentFile = `${Configuration.contentFolder}${Configuration.contentFile}`;

    return getSiteData(contentFile)
    .catch((err: FileError) => {
        if (err.type === FileErrorType.DOES_NOT_EXIST) {
            log(`Content file does not exist at ${contentFile}.  Run initialization first.`);
        } else {
            log(`Unknown error: ${err}`);
        }
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