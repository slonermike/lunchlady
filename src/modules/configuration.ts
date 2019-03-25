import * as FileUtils from '../utils/File';

export type ValueSet = Record<string, any>;

const values: ValueSet = {
    configFolder: './config/',
    configFile: "config.json",
    contentFolder: './sloppy-joe/public/content/',
    htmlFolder: null,
    sloppyJoeFolder: './sloppy-joe/',
    sloppyJoeOrigin: 'https://github.com/slonermike/sloppy-joe.git',
    sloppyJoeBranch: 'version/0.2',
    contentFile: 'content.json',
    maxTagLength: 32
};

const noWriteValues: Record<string, boolean> = {
    sloppyJoeBranch: true
};

/**
 * Retrieve a specific value from configuration.
 */
export function getValue(key: string) {
    return values[key];
}

/**
 * Promise resolves the finalized data, rejects the error.
 */
export function loadValues(): Promise<ValueSet> {
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
 * @param key key of the entry in the settings.
 * @param value Value assigned to the entry.
 */
export function setValue(key: string, value: any) {
    values[key] = value;
}

/**
 * Assign all the values from the provided map to the current
 * configuration values.
 *
 * @param valueMap Mapping of keys to values.
 */
export function setValues(valueMap: ValueSet): void {
    Object.assign(values, valueMap);
}

/**
 * Write the configuration values to file.
 * Resolve on write success.
 * Reject on failure w/ error message.
 *
 * @param newValues Mapping of key/value pairs to apply before writing (optional).
 */
export function writeValues(newValues?: ValueSet): Promise<void> {
    if (newValues) {
        setValues(newValues);
    }

    const fullConfigFile = values.configFolder + values.configFile;

    const writtenValues: ValueSet = {};
    for (let key of Object.keys(values)) {
        if (!noWriteValues[key]) {
            writtenValues[key] = values[key];
        }
    }

    return FileUtils.writeJSON(fullConfigFile, writtenValues);
}
