import { prompt, Question } from 'inquirer';

import { log } from '../utils/Log';
import { getsloppy } from './getsloppy';
import { manageContent } from './manageContent';
import { Configuration } from '../modules/configuration'
import * as FileUtils from '../utils/File';
import setup from './setup';

export function mainMenu(): Promise<void> {
    return FileUtils.exists(`${Configuration.contentFolder}${Configuration.contentFile}`)
        .then(contentFileExists => {
            const choices = [];

            if (contentFileExists) {
                choices.push({
                    name: 'Fetch/Update Sloppy Joe Blog Client',
                    value: () => getsloppy(Configuration.sloppyJoeOrigin, Configuration.sloppyJoeBranch)
                });

                choices.push({
                    name: 'Manage Content',
                    value: manageContent
                });
            } else {
                choices.push({
                    name: 'Initialize Blog',
                    value: setup
                });
            }

            choices.push({
                name: 'Quit'
            });

            const questions: Question[] = [
                {
                    type: 'list',
                    name: 'command',
                    message: "Lunchlady says, \'wuddya want?\'",
                    choices
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
        })
}