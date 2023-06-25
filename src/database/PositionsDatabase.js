const sqlite3 = require('sqlite3');

module.exports = class PositionsDatabase {
    connection = undefined;
    path = "./positions.sqlite"

    constructor() {
    }
    
    async openConnection() {
        console.log("opening");
        if (this.connection != undefined) {
            console.log("Connection already established");
            return;
        }
        this.connection = new sqlite3.Database(this.path);
    }

    async closeConnection() {
        console.log("closing");
        if (!this.connection) {
            console.log("No active connection.");
            return;
        }
        await this.connection.close();
        
        this.connection = undefined;
    }

    async initDB() {
        await this.openConnection();
        this.connection.run(
            `
            CREATE TABLE IF NOT EXISTS positions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                position TEXT UNIQUE,
                last_seen DATETIME,
                email_sent BOOLEAN DEFAULT 0
            )
            `
        );
        this.closeConnection();
    }

    async listPositions(filter) {
        await this.openConnection();
        let positions = []; 
        let query;

        switch (filter) {
            case "all":
                // no filter in query for all entries
                query = `SELECT * FROM positions`
                break;

            case "unsent":
                // filter for all unsent
                query = `SELECT * FROM positions WHERE email_sent = 0`;
                break;
        }

        let entries = await new Promise((resolve, reject) => {
            this.connection.all(query, (err, db_rows) => {
                if (err) {
                    console.log("Database error:", err.message);
                    reject();
                } else {
                    resolve(db_rows);
                }
            });
        })

        if (!entries) {
            console.log("No entries found");
            this.closeConnection();
            return;
        }

        for (let entry of entries) {
            let position = {
                "id": entry.id,
                "title": entry.position,
                "last_seen": entry.last_seen,
                "email_sent": entry.email_sent
            }
            positions.push(position);
        }
        await this.closeConnection();
        return positions;
    }

    async checkPosition(position) {
        this.openConnection();
        const checkQuery = `SELECT * FROM positions WHERE position = ?`;
        return new Promise((resolve, reject) => {
            this.connection.get(checkQuery, [position], (err, row) => {
                if (err) {
                    console.error("Database error:", err.message);
                    reject(-1)
                } else {
                    if (row) {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                }
            })
        })
    }
    
    async insertPosition(position) {
        // open a connection to the database
        await this.openConnection();
        let alreadyPresent = await this.checkPosition(position);
        console.log(alreadyPresent)

        return new Promise(async (resolve, reject) => {
            // get the current datetime
            const currentDate = new Date().toISOString();

            // if a row is already present in the database
            // update the present entry's last_seen attribute
            if (alreadyPresent) {
                const updateQuery = 
                    `
                    UPDATE positions SET last_seen = ? WHERE position = ?
                    `;
                console.log("connection:", this.connection)
                this.connection.run(updateQuery, [currentDate, position], async (err) => {
                    await this.closeConnection();
                    if (err) {
                        console.error('Database error:', err.message)
                        reject(err.message);
                    } else {
                        console.log("Sucessfully updated", position);
                        resolve();
                    }
                })
            } else if (!alreadyPresent) {
                // if no entry is present for the position title,
                // create a new one
                const insertQuery = 
                    `
                    INSERT INTO 
                        positions (position, last_seen) 
                        VALUES (?, ?)
                    `;
                console.log(position);
                await this.connection.run(insertQuery, [position, currentDate], async (err) => {
                    await this.closeConnection();
                    if (err) {
                        console.error('Database error:', err.message)
                        reject(err.message);
                    } else {
                        console.log("Sucessfully inserted ", position);
                        resolve();
                    }
                })
            }
        })
    }
}