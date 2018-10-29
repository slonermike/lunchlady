const fs = require('fs');

const Log = require('./Log');

const exists = function(filename) {
    return new Promise((resolve) => {
        fs.exists(filename, (exists) => resolve(exists));
    });
}

/**
 * Create the directory if it doesn't already exist.
 *
 * @param {String} dirname Name of the directory to retrieve.
 */
const promiseDirectoryExistence = function(dirname) {
    return exists(dirname).then((exists) => {
        return new Promise((resolve, reject) => {
            if (exists) {
                resolve();
            } else {
                mkdir(dirname).then(resolve).catch(reject)
            }
        });
    }).catch(Log.log);
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

const mkdir = function (dirname) {
    return new Promise((resolve, reject) => {
        fs.mkdir(dirname, (err) => {
            if (err)
                reject(dirname)
            else
                resolve()
        });
    });
}

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

module.exports = {
    exists,
    mkdir,
    promiseDirectoryExistence,
    promiseFileExistence,
    readJSON,
    writeJSON
}