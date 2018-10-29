#!/usr/bin/env node
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
    'configure': {
        cmd: configure,
        description: 'Configure the local source and server destination of your blog files.'
    },
    'help': {
        cmd: printInstructions,
        description: 'Display this help message.'
    }
}

let command = process.argv[2];
if (!command || !instructions[command]) {
    command = 'help';
}

Configuration.loadValues()
    .catch((msg) => Log.log(`No stored configuration available -- run 'lunchlady configure'`))
    .then(() => instructions[command].cmd());
