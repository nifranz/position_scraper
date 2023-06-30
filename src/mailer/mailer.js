const { exec } = require('child_process');
const path = require('path')

const CONSTANTS = require('../constants');
const PositionsDatabase = require('../database/PositionsDatabase.js');

// defining trim function for strings
String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g, "");
};

module.exports = async function mailPositions() {
    return new Promise(async (resolve, reject) => {
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
    
        let unsentPositions = ""
        for (let position of positions) {
            unsentPositions += `${position.title}\n`
        }
    
        console.log(unsentPositions)
        if (!unsentPositions) {
            resolve("No new positions to send!")
            return;
        }
        console.log("Executing mail.sh")
        let script_path = path.join(__dirname, "send_mail.sh")
        let recipient_email = CONSTANTS.email;
        exec(`echo "${unsentPositions.trim()}" | sh ${script_path} ${recipient_email}`, (error, stdout, stderr) => {
            if (error) {
                console.error("Error executing script", error);
                reject()
                return;
            }
            console.log("Script output:", stdout);
            if (stderr) {
                console.error("Script error", stderr)
                reject()
                return
            }
            // in case of successfull script execution mark any position as sent
            for (let position of positions) {
                console.log("╭ marking position as sent:"+ position+ "...")
                db.markPositionAsSent(position.title);
            }
        })
        resolve(`Sent ${positions.length} positions`);
    })

}