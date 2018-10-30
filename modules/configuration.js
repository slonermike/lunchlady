const FileUtils = require('../utils/File');

const values = {
    configFolder: './config/',
    configFile: "config.json",
    contentFolder: './content/',
    contentFile: 'index.json'
}

/**
 * Retrieve a specific value from configuration.
 */
function getValue(key) {
    return values[key];
}

/**
 * Promise resolves the finalized data, rejects the error.
 */
function loadValues() {
    const fullConfigFile = values.configFolder + values.configFile;
    return new Promise((resolve, reject) => {
        FileUtils.promiseFileExistence(fullConfigFile)
            .then(FileUtils.readJSON)
            .then((data) => {
                setValues(data);
                resolve(data);
            })
            .catch((msg) => {
                reject(msg);
            });
    })
}

/**
 * Set a config value by the key provided.
 *
 * @param {String} key key of the entry in the settings.
 * @param {any} value Value assigned to the entry.
 */
function setValue(key, value) {
    values[key] = value;
}

/**
 * Assign all the values from the provided map to the current
 * configuration values.
 *
 * @param {object} valueMap Mapping of keys to values.
 */
function setValues(valueMap) {
    Object.assign(values, valueMap);
}

/**
 * Write the configuration values to file.
 * Resolve on write success.
 * Reject on failure w/ error message.
 *
 * @param {object} newValues Mapping of key/value pairs to apply before writing (optional).
 */
function writeValues(newValues = null) {
    if (newValues) {
        setValues(newValues);
    }

    const fullConfigFile = values.configFolder + values.configFile;
    return new Promise((resolve, reject) => {
        FileUtils.writeJSON(fullConfigFile, values).then(resolve).catch(reject);
    });
}

module.exports = {
    getValue,
    loadValues,
    setValue,
    setValues,
    writeValues
}