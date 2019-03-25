import { getValue } from "../modules/configuration";
import { promiseFileExistence, readJSON, FileError, FileErrorType } from "../utils/File";
import { Site, emptySite, SiteSection } from "../types/site";
import { log } from "../utils/Log";
import { Question, prompt } from "inquirer";

const paramCase = require('param-case');

/**
 * Load the blog data from JSON.
 *
 * @param contentFile File from which to load the blog data.
 */
function getSiteData(contentFile: string): Promise<Site> {
    return promiseFileExistence(contentFile).then((filename) => readJSON(filename) as Promise<Site>);
}

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

        newSections[sectionKey] = {
            name: sectionName,
            keyName: sectionKey
        }

        return {
            ...site,
            sections: newSections
        } as Site;
    });
}

function manageSiteTop(site: Site): Promise<Site> {
    const sectionPickerQ: Question = {
        type: 'list',
        name: 'section',
        message: 'Manage Site',
        choices: Object.keys(site.sections).map((key) => {
            return {
                value: key,
                name: site.sections[key].name
            }
        }).concat([
            {
                value: 'add-new',
                name: '[Add New Section]'
            }
        ])
    }

    return prompt([sectionPickerQ]).then((answers) => {
        const chosenSection = answers['section'];

        // TODO: make this a variable.
        if (chosenSection === 'add-new') {
            return addSection(site);
        } else if (site.sections[chosenSection]) {
            log(`Chosen section: ${chosenSection}`);
        } else {
            log(`Unknown section: ${chosenSection}`);
        }

        return site;
    }).then((site) => {
        log(`Updated Site: ${JSON.stringify(site)}`);
        return site;
    })
}

export function manageContent() {
    const contentFile = getValue('sloppyJoeFolder') + getValue('contentFile');
    let loadedSite: Site;

    return getSiteData(contentFile)
    .catch((err: FileError) => {
        if (err.type === FileErrorType.DOES_NOT_EXIST) {
            log(`Content file does not exist.  Creating.`);
        }

        // Return an empty site.
        return {
            ...emptySite
        } as Site;
    })
    .then((site) => {
        loadedSite = site;
        return site;
    }).then(manageSiteTop);
}