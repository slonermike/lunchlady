const fs = require('fs');

const exists = function(filename) {
    return new Promise((resolve, reject) => {
        fs.exists(filename, (exists) => exists ? resolve(filename) : reject(filename));
    });
}

const mkdir = function (dirname) {
    return new Promise((resolve, reject) => {
        fs.mkdir(dirname, () => {
            if (error)
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
        fs.writeFile(filepath, JSON.stringify(data), (err) => {if (err) reject(err)});
    })
}

module.exports = {
    exists,
    mkdir,
    readJSON,
    writeJSON
}