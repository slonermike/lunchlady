export interface Site {
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
}

export interface BlogEntry {
    file: string,
    title: string,
    keyName: string,
    tags: string[],
    date: Date
}

export const emptySite: Site = {
    sections: {},
    entries: {}
};

export const emptyBlog: Blog = {
    name: '',
    keyName: '',
    entries: []
};

export const emptyEntry: BlogEntry = {
    file: '',
    keyName: '',
    title: '',
    tags: [],
    date: new Date()
};