#!/usr/bin/env node
import { getsloppy } from './commands/getsloppy';
import { addEntry } from './commands/addEntry';
import { manage } from './commands/manage';
import { setup } from './commands/setup';
import { log } from './utils/Log';
import { loadValues, getValue } from './modules/configuration';

interface AppCommand {
    cmd: () => Promise<void>;
    description: string;
}
let commands: Record<string, AppCommand> = {};

const printInstructions = function (): Promise<void> {
    return new Promise((resolve, _reject) => {
        log("\nUsage: 'lunchlady <command>', where <command> is one of:\n");
        for (let key in commands) {
            let description = commands[key].description ? ' - ' + commands[key].description : '';
            log('\t' + key + description);
        }
        resolve();
    });
}

commands = {
    'get-sloppy': {
        cmd: () => getsloppy(getValue('sloppyJoeFolder'), getValue('sloppyJoeOrigin'), getValue('sloppyJoeBranch')),
        description: 'Initialize or update the Sloppy Joe code.'
    },
    'setup': {
        cmd: setup,
        description: 'Set up Sloppy Joe and link it to the local HTML folder for your blog entries.'
    },
    'add': {
        cmd: addEntry,
        description: 'Create a new blog entry from the existing html files in the content folder.'
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
if (!command || !commands[command]) {
    command = 'help';
}

loadValues()
    .catch((_msg) => {
        if (command != 'setup')
            log(`No stored configuration available -- run 'lunchlady setup'`)}
    )
    .then(commands[command].cmd)
    .catch((err) => log(`Error executing \`${command}\` instruction: ${err}`));
