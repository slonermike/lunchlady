#!/usr/bin/env node
import getsloppy from './commands/getsloppy';
import * as addEntry from './commands/addEntry';
import * as manage from './commands/manage';
import * as configure from './commands/configure';
import * as Configuration from './modules/configuration';
import Log from './utils/Log';

class CLIInstruction {
    cmd: () => void;
    description: string;
}
let instructions: Record<string, CLIInstruction> = {};

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
    'configure': {
        cmd: configure,
        description: 'Configure the local source and server destination of your blog files.'
    },
    'add': {
        cmd: addEntry,
        description: 'Create a new blog entry from the existing html files in the content folder'
    },
    'manage': {
        cmd: manage,
        description: 'Make edits to existing entries.'
    },
    'help': {
        cmd: printInstructions,
        description: 'Display this help message.'
    }
};

let command = process.argv[2];
if (!command || !instructions[command]) {
    command = 'help';
}

Configuration.loadValues()
    .catch((_msg) => {
        if (command != 'configure')
            Log.log(`No stored configuration available -- run 'lunchlady configure'`)}
    ).then(() => {
        instructions[command].cmd();
    }).catch((err) => Log.log(`Error executing \`${command}\` instruction: ${err}`));
