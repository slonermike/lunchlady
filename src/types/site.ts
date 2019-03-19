export interface Site {
    blog: Blog;
    sections: SiteSection[];
}

export const emptySite: Site = {
    blog: {
        entries: []
    },
    sections: []
};

export interface SiteSection {
    name: string;
}

export interface Blog {
    entries: BlogEntry[];
}

export interface BlogEntry {
    file: string,
    title: string,
    tags: string[],
    date: Date
}