export interface Blog {
    entries: BlogEntry[];
}

export interface BlogEntry {
    file: string,
    title: string,
    tags: string[],
    date: Date
}