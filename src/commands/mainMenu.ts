import { prompt, Question } from 'inquirer';

import { log } from '../utils/Log';
import { editBlog } from './manage';
import { addEntry } from './addEntry';
import { getsloppy } from './getsloppy';
import { getValue } from '../modules/configuration'

export function mainMenu(): Promise<void> {
    const questions: Question[] = [
        {
            type: 'list',
            name: 'command',
            message: "Lunchlady says, \'wuddya want?\'",
            choices: [
                {
                    name: 'Add Blog Entry',
                    value: addEntry
                },
                {
                    name: 'Update Blog Entry',
                    value: editBlog
                },
                {
                    name: 'Fetch/Update Sloppy Joe Blog Client',
                    value: () => getsloppy(getValue('sloppyJoeFolder'), getValue('sloppyJoeOrigin'), getValue('sloppyJoeBranch'))
                },
                {
                    name: 'Quit'
                }
            ]
        }
    ];

    return prompt(questions)
    .then((response: {command?: () => Promise<void>}) => {
        if (typeof response.command === 'function') {
            return response.command().then(mainMenu);
        } else {
            return new Promise<void>((resolve) => {
                log('Enjoy your slop!');
                resolve();
            });
        }
    });
}