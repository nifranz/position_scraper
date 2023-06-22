const { exec } = require('child_process');
const { error, log } = require('console');
const sqlite3 = require('sqlite3');

// defining trim function for strings
String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g, "");
};

async function retrieveUnsentPositions() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database('./positions.sqlite');

        const query = `SELECT * FROM positions WHERE email_sent = 0`;

        const positions = {}
        db.all(query, (err, rows) => {
            if(err) {
                reject(err)
                return;
            }

            rows.forEach((row) => {
                positions[row.id] = row.position;
            });

            resolve(positions)
        });
        db.close();
    });
}

async function run() {
    let positions;
    try {
        positions = await retrieveUnsentPositions();
    }
    catch (err) {
        console.error('Database error:', err.message);
        return;
    }
    unsentPositions = ""
    for (position of Object.values(positions)) {
        unsentPositions += `${position}\n`
    }

    console.log(unsentPositions)
    console.log(positions)
    console.log("Executing mail.sh")
    exec(`echo "${unsentPositions.trim()}" | sh ./mail.sh`, (error, stdout, stderr) => {
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