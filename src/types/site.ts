import * as assert from 'assert';

export const SITE_DATA_VERSION = 0;

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
    sections: Record<string, Blog>;
    entries: Record<string, BlogEntry>;
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
    sections: {},
    entries: {}
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