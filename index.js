#!/usr/bin/env node
const configure = require('./configure');

let instructions = {};

const printInstructions = function () {
    console.log("Usage: 'lunchlady <command>', where <command> is one of:");
    for (let key in instructions) {
        let description = instructions[key].description ? ' - ' + instructions[key].description : '';
        console.log('\t' + key + description);
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

instructions[command].cmd();
