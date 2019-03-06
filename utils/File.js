const fs = require('fs');

const Log = require('./Log');

/**
 * Check if a file already exists.
 * Resolves to true if the file exists, false if not.
 *
 * @param {String} filename Filename to check for existence.
 */
const exists = function(filename) {
    return new Promise((resolve) => {
        fs.exists(filename, (exists) => resolve(exists));
    });
}

/**
 * Create the directory if it doesn't already exist.
 *
 * @param {String} dirname Name of the directory to retrieve.
 * @param {boolean} createIfMissing True to auto-create the directory, false to reject if missing.
 */
const promiseDirectoryExistence = function(dirname, createIfMissing = true) {
    return exists(dirname).then((exists) => {
        return new Promise((resolve, reject) => {
            if (exists) {
                resolve(dirname);
            } else if (createIfMissing) {
                mkdir(dirname).then(resolve).catch(reject)
            } else {
                reject(`Directory does not exist: ${dirname}`)
            }
        });
    });
}

/**
 * Resolves w/ filename on success.
 * Rejects w/ filename on failure.
 *
 * @param {String} filename File to check.
 */
const promiseFileExistence = function(filename) {
    return new Promise((resolve, reject) => {
        fs.exists(filename, (exists) => {
            if (exists)
                resolve(filename);
            else {
                reject(`File does not exist: ${filename}`);
            }
        });
    });
}

/**
 * Retrieve files from a directory for which the filename matches the provided
 * regular expression.
 *
 * @param {String} directory Directory in which to look for files.
 * @param {Regex} fileTypeRegex Regular experession defining accepable entries.
 */
const getFilesOfType = function(directory, fileTypeRegex) {
    return new Promise((resolve, reject) => {
        fs.readdir(directory, (err, files) => {
            if (err) {
                reject(err);
            } else {
                // Filter out files that don't match the regex.
                const finalList = files.filter((filename) => {
                    const matches = filename.match(fileTypeRegex);
                    return matches && matches.length > 0;
                });
                resolve(finalList);
            }
        })
    });
}

/**
 * Create a directory.
 * Resolves to the name of the created directory.
 *
 * @param {String} dirname Directory to create.
 */
const mkdir = function (dirname) {
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
const unlink = function (dirname) {
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
 * @param {String} sourceDir Directory the symlink will point to.
 * @param {String} linkDir Directory alias where the symlink will live.
 */
const symlink = function (sourceDir, linkDir) {
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
 * Resolves to (isSymlink: boolean, dir: string)
 *
 * @param {String} dir Directory to check if it's a symlink.
 */
const directoryIsSymlink = function(dir) {
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
 * @param {String} filepath File from which we read the JSON.
 */
const readJSON = function (filepath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filepath, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(JSON.parse(data));
            }
        });
    });
}

/**
 * Write an object to a file as JSON.
 * Resolves w/o output.
 *
 * @param {String} filepath File to which the JSON will be written.
 * @param {object} data JS object from which the JSON is created.
 */
const writeJSON = function (filepath, data) {
    return new Promise((resolve, reject) => {
        fs.writeFile(filepath, JSON.stringify(data), (err) => {
            if (err) {
                reject(err)
            } else {
                resolve();
            }
        });
    })
}

/**
 * Remove the trailing slash from a directory path
 * @param {String} directoryPath File path from which to remove a trailing slash.
 */
const removeTrailingSlash = function(directoryPath) {
    return directoryPath.replace(/\/$/, "");
}

/**
 * Add a trailing slash to a directory path (if not present).
 * @param {String} directoryPath Directory path to ensure has a trailing slash.
 */
const addTrailingSlash = function(directoryPath) {
    return directoryPath.replace(/\/?$/, '/');
}

/**
 * If the path starts with alphanumeric value or _, add ./
 * @param {String} directoryPath Directory path to ensure starts with / or ./
 */
const addLeadingDotSlash = function(directoryPath) {
    if (directoryPath.match(/^[a-zA-Z0-9_]/)) {
        return `./${directoryPath}`;
    } else {
        return directoryPath;
    }
}

/**
 * Add a ./ at the beginning, unless it already starts with ./ or /
 * Add a / at the end unless it already ends with /
 * @param {String} directoryPath Directory path to format.
 */
const formatDirectory = function(directoryPath) {
    return addLeadingDotSlash(addTrailingSlash(directoryPath));
}

module.exports = {
    exists,
    getFilesOfType,
    mkdir,
    symlink,
    unlink,
    directoryIsSymlink,
    promiseDirectoryExistence,
    promiseFileExistence,
    readJSON,
    writeJSON,
    formatDirectory
}