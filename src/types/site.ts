import * as assert from 'assert';

export const SITE_DATA_VERSION = 2;

/**
 * Convert things that don't directly translate from JSON to
 * site data (such as dates) and return as a Site object.
 *
 * @param fileData File data to convert to site data.
 */
export function parseSite(fileData: Record<string, any>): Site {
    const entries: Record<string, any> = fileData['entries'];

    if (entries) {
        for (let key in entries) {
            const entry = entries[key];
            assert(typeof entry.date === 'string');
            entry.date = new Date(entry.date);
        }
    }
    return fileData as Site;
}

export enum EntryOrder {
    MANUAL,
    DATE
}

export interface Site {
    siteVersion: number;
    siteTitle: string;
    sections: Record<string, Blog>;
    sectionOrder: string[];
    entries: Record<string, BlogEntry>;
    themes: string[];
    divs: Record<string, string[]>; // Grouped according to the folder within the theme.
    css: string[];
}

export interface SiteSection {
    name: string;
    keyName: string;
}

export interface Blog {
    name: string;
    keyName: string;
    entries: string[];
    entryOrder: EntryOrder;
}

export interface BlogEntry {
    file: string,
    title: string,
    keyName: string,
    tags: string[],
    date: Date
}

export const emptySite: Site = {
    siteVersion: SITE_DATA_VERSION,
    siteTitle: '',
    sections: {},
    sectionOrder: [],
    entries: {},
    themes: [],
    divs: {},
    css: []
};

export const emptyBlog: Blog = {
    name: '',
    keyName: '',
    entries: [],
    entryOrder: EntryOrder.DATE
};

export const emptyEntry: BlogEntry = {
    file: '',
    keyName: '',
    title: '',
    tags: [],
    date: new Date()
};