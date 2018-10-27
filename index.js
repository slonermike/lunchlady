#!/usr/bin/env node
const configure = require('./configure');

let instructions = {};

const printInstructions = function () {
    console.log("Usage: 'lunchlady <command>'");

    let instructionList = "";
    for (let key in instructions) {
        instructionList += key + ", "
    }
    console.log("Where <command> is one of " + instructionList);
}

instructions = {
    'configure': configure,
    'help': printInstructions
}

let command = process.argv[2];
if (!command || !instructions[command]) {
    command = 'help';
}

instructions[command]();
