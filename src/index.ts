#!/usr/bin/env node
import { log } from './utils/Log';
import { mainMenu } from './commands/mainMenu';

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
    'default': {
        cmd: mainMenu as () => Promise<never>,
        description: 'Interactive menu for managing your site.'
    },
    'help': {
        cmd: printInstructions,
        description: 'Display this help message.'
    }
};

let command = process.argv[2];
if (!command || !commands[command]) {
    command = 'default';
}

commands[command].cmd().catch((err) => log(`Error executing \`${command}\` instruction: ${err}`));;

