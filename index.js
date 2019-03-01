#!/usr/bin/env node
const getsloppy = require('./commands/getsloppy');
const addEntry = require('./commands/addEntry');
const configure = require('./commands/configure');
const Configuration = require('./modules/configuration');
const Log = require('./utils/Log');

let instructions = {};

const printInstructions = function () {
    Log.log("\nUsage: 'lunchlady <command>', where <command> is one of:\n");
    for (let key in instructions) {
        let description = instructions[key].description ? ' - ' + instructions[key].description : '';
        Log.log('\t' + key + description);
    }
}

instructions = {
    'get-sloppy': {
        cmd: getsloppy,
        description: 'Initialize the sloppy joe repo so that we can see what we\'re working on.'
    },
    'add': {
        cmd: addEntry,
        description: 'Create a new blog entry from the existing html files in the content folder'
    },
    'configure': {
        cmd: configure,
        description: 'Configure the local source and server destination of your blog files.'
    },
    'help': {
        cmd: printInstructions,
        description: 'Display this help message.'
    },
    'publish': {
        cmd: () => console.log('TODO: implement this.  Check timestamps on html files and copy over new ones.'),
        description: 'Copy your blog content into the sloppy joe.'
    }
}

let command = process.argv[2];
if (!command || !instructions[command]) {
    command = 'help';
}

Configuration.loadValues()
    .catch((_msg) => {
        if (command != 'configure')
            Log.log(`No stored configuration available -- run 'lunchlady configure'`)}
    ).then(() => {
        instructions[command].cmd()
    });
