import * as fs from 'fs';
import * as beautify from 'json-beautify';

export class FileError {
    public type: FileErrorType;
    public message: string;

    constructor(type: FileErrorType, message: string) {
        this.type = type;
        this.message = message;
    }

    public toString() {
        return `Error ${this.type}: ${this.message}`;
    }
}

export enum FileErrorType {
    DOES_NOT_EXIST,
    READ_ERROR
}

/**
 * Check if a file already exists.
 * Resolves to true if the file exists, false if not.
 *
 * @param filename Filename to check for existence.
 */
export function exists(filename: string): Promise<boolean> {
    return new Promise((resolve) => {
        fs.exists(filename, (exists) => resolve(exists));
    });
}

/**
 * Create the directory if it doesn't already exist.
 *
 * @param dirname Name of the directory to retrieve.
 * @param createIfMissing True to auto-create the directory, false to reject if missing.
 */
export function promiseDirectoryExistence(dirname: string, createIfMissing: boolean = true): Promise<string> {
    return exists(dirname).then((exists) => {
        return new Promise<string>((resolve, reject) => {
            if (exists) {
                resolve(dirname);
            } else if (createIfMissing) {
                mkdir(dirname).then(resolve).catch(reject)
            } else {
                reject(new FileError(
                    FileErrorType.DOES_NOT_EXIST,
                    `File does not exist: ${dirname}`
                ));
            }
        });
    });
}

/**
 * Resolves w/ filename on success.
 * Rejects w/ filename on failure.
 *
 * @param filename File to check.
 */
export function promiseFileExistence(filename): Promise<string> {
    return new Promise((resolve, reject) => {
        fs.exists(filename, (exists) => {
            if (exists)
                resolve(filename);
            else {
                reject(new FileError(
                    FileErrorType.DOES_NOT_EXIST,
                    `File does not exist: ${filename}`
                ));
            }
        });
    });
}

function isDirectory(file: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
        fs.stat(file, (err, stats) => {
            if (err) {
                reject(err);
            } else if (stats.isDirectory()) {
                resolve(file);
            } else {
                resolve(null);
            }
        })
    })
}

/**
 * Get all subdirectories of a directory.
 *
 * @param directory Directory in which to find subdirectories.
 */
export function getSubdirectories(directory: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
        fs.readdir(directory, (err, files) => {
            if (err) {
                reject(new FileError(
                    FileErrorType.READ_ERROR,
                    `Read Error: ${err}`
                ));
            } else {
                const dirPromises: Promise<string | null>[] = [];
                files.forEach((file) => {
                    const fullFile = `${directory}/${file}`;
                    dirPromises.push(isDirectory(fullFile));
                });
                Promise.all(dirPromises).then(dirs => {
                    const validDirs = [];
                    dirs.forEach((dir) => dir ? validDirs.push(dir) : null);
                    resolve(validDirs);
                });
            }
        })
    });
}

/**
 * Get all the directories in and below the specified directory, including
 * the specified directory.
 *
 * @param directory Directory at which to start collecting directories.
 * @param foundDirs Accumulated mapping of found directories.
 */
export function getDirectoriesRecursive(directory: string, foundDirs: Record<string, boolean> = {}): Promise<string[]> {
    return new Promise<string[]>((resolve, _reject) => {
        foundDirs[directory] = true;
        getSubdirectories(directory)
        .then(subdirs => {
            Promise.all(subdirs.map(subdir => getDirectoriesRecursive(subdir, foundDirs)))
                .then(() => {
                    resolve(Object.keys(foundDirs));
                });
        });
    });
}

/**
 * Retrieve files from a directory for which the filename matches the provided
 * regular expression.
 *
 * @param directory Directory in which to look for files.
 * @param fileTypeRegex Regular experession defining accepable entries.
 */
export function getFilesOfType(directory: string, fileTypeRegex: RegExp): Promise<string[]> {
    return new Promise((resolve, reject) => {
        fs.readdir(directory, (err, files) => {
            if (err) {
                reject(new FileError(
                    FileErrorType.READ_ERROR,
                    `Read Error: ${err}`
                ));
            } else {
                // Filter out files that don't match the regex.
                const finalList = files.filter((filename) => {
                    const matches = filename.match(fileTypeRegex);
                    return matches && matches.length > 0;
                });
                resolve(finalList.map(file => `${directory}/${file}`));
            }
        })
    });
}

/**
 * Get all files in the directory and below it which satisfy the regex
 * with their filename.
 *
 * @param directory Directory at which to start the search.
 * @param fileTypeRegex Regex by which to identify desired filenames.
 */
export function getFilesOfTypeRecursive(directory: string, fileTypeRegex: RegExp): Promise<string[]> {
    return getDirectoriesRecursive(directory)
        .then((directories) => {
            const promises = directories.map((dir) => getFilesOfType(dir, fileTypeRegex));
            return Promise.all(promises)
                .then(fileSets => {
                    return [].concat.apply([], fileSets);
                });
        });
}

/**
 * Create a directory.
 * Resolves to the name of the created directory.
 *
 * @param dirname Directory to create.
 */
export function mkdir(dirname: string): Promise<string> {
    return new Promise((resolve, reject) => {
        fs.mkdir(dirname, (err) => {
            if (err)
                reject(dirname)
            else
                resolve(dirname)
        });
    });
}

/**
 * Remove a symbolic link.
 * Resolves to undefined.
 * @param {String} dirname Symbolic link to remove.
 */
export function unlink(dirname): Promise<void> {
    return new Promise((resolve, reject) => {
        fs.unlink(dirname, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        })
    });
}

/**
 * Create a symlink that points to an existing directory.
 * Resolves to the path to the created symlink.
 *
 * @param sourceDir Directory the symlink will point to.
 * @param linkDir Directory alias where the symlink will live.
 */
export function symlink(sourceDir: string, linkDir: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const linkDirNoSlash = removeTrailingSlash(linkDir);
        fs.symlink(sourceDir, linkDirNoSlash, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(linkDir);
            }
        });
    });
}

/**
 * Check if a directory is a symlink.
 *
 * @param dir Directory to check if it's a symlink.
 */
export function directoryIsSymlink(dir: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        fs.lstat(removeTrailingSlash(dir), (err, stats) => {
            if (err) {
                reject(err);
            } else {
                resolve(stats.isSymbolicLink());
            }
        });
    });
}

/**
 * Read and parse a JSON file.
 * Resolves to the parsed JSON block.
 *
 * @param filepath File from which we read the JSON.
 */
export function readJSON(filepath: string): Promise<Record<string, any>> {
    return new Promise((resolve, reject) => {
        fs.readFile(filepath, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(JSON.parse(data.toString()));
            }
        });
    });
}

/**
 * Write some text to a file (will clobber existing file)
 *
 * @param filepath File to which the text will be written.
 * @param text Text to write to file.
 */
export function writeTextToFile(filepath: string, text: string): Promise<void> {
    return new Promise((resolve, reject) => {
        fs.writeFile(filepath, text, (err) => {
            if (err) {
                reject(err)
            } else {
                resolve();
            }
        });
    });
}

/**
 * Write an object to a file as JSON.
 * Resolves w/o output.
 *
 * @param filepath File to which the JSON will be written.
 * @param data JS object from which the JSON is created.
 */
export function writeJSONToFile(filepath: string, data: object): Promise<void> {
    return writeTextToFile(filepath, beautify(data, null, 2));
}

/**
 * Remove the trailing slash from a directory path
 * @param directoryPath File path from which to remove a trailing slash.
 */
function removeTrailingSlash(directoryPath): string {
    return directoryPath.replace(/\/$/, "");
}

/**
 * Add a trailing slash to a directory path (if not present).
 * @param directoryPath Directory path to ensure has a trailing slash.
 */
function addTrailingSlash(directoryPath: string): string {
    return directoryPath.replace(/\/?$/, '/');
}

/**
 * If the path starts with alphanumeric value or _, add ./
 * @param directoryPath Directory path to ensure starts with / or ./
 */
function addLeadingDotSlash(directoryPath: string): string {
    if (directoryPath.match(/^[a-zA-Z0-9_]/)) {
        return `./${directoryPath}`;
    } else {
        return directoryPath;
    }
}

/**
 * Add a ./ at the beginning, unless it already starts with ./ or /
 * Add a / at the end unless it already ends with /
 * @param directoryPath Directory path to format.
 */
export function formatDirectory(directoryPath: string): string {
    return addLeadingDotSlash(addTrailingSlash(directoryPath));
}
