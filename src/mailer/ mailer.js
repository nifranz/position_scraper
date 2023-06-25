const { exec } = require('child_process');
const CONSTANTS = require('../constants');
const PositionsDatabase = require('../database/PositionsDatabase.js')

// defining trim function for strings
String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g, "");
};

async function run() {
    let db = new PositionsDatabase();
    let positions;

    try {
        positions = await db.listPositions('unsent');
    } catch (e) {
        console.error(e);
    } 

    if (!positions) {
        console.log("No positions retrieved")
        return;
    }

    unsentPositions = ""
    for (position of Object.values(positions)) {
        unsentPositions += `${position}\n`
    }

    console.log(unsentPositions)
    console.log(positions)

    console.log("Executing mail.sh")
    exec(`echo "${unsentPositions.trim()}" | sh ./mail.sh ${CONSTANTS.email}`, (error, stdout, stderr) => {
        if (error) {
            console.error("Error executing script", error);
            return
        }
        console.log("Script output:", stdout);
        if (stderr) {
            console.error("Script error", stderr)
        }
    })

}

run();