import { prompt, Question } from 'inquirer';

import { log } from '../utils/Log';
import { getsloppy } from './getsloppy';
import { manageContent } from './manageContent';
import { getValue } from '../modules/configuration'

export function mainMenu(): Promise<void> {
    const questions: Question[] = [
        {
            type: 'list',
            name: 'command',
            message: "Lunchlady says, \'wuddya want?\'",
            choices: [
                {
                    name: 'Fetch/Update Sloppy Joe Blog Client',
                    value: () => getsloppy(getValue('sloppyJoeFolder'), getValue('sloppyJoeOrigin'), getValue('sloppyJoeBranch'))
                },
                {
                    name: 'Manage Content',
                    value: manageContent
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