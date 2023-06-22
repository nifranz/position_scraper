
const axios = require('axios');
const cheerio = require('cheerio');
const sqlite3 = require('sqlite3')

// URL of the HTML page you want to download
const url = 'https://instinct3.de/career/';

// Function to search for the div with class name "info"
async function findAndWriteInfo() {
    // Download the HTML page
    const response = await axios.get(url);
    const html = response.data;

    // Load the HTML into Cheerio for parsing and manipulation
    const $ = cheerio.load(html);

    const ulElement = ($('.personio_shortcode')).find('ul')
    var positions = [];

    ulElement.find('li').each((index, element) => {
        const positionElement = $(element).find('.row_position');
        const position = positionElement.text().trim();
        if (position) {
            positions.push(positionElement.text().trim());
        }
    });

    for (position of positions) {
        insertIntoDatabase(position);
    }

    // Connect to the database
    const db = new sqlite3.Database('./positions.sqlite');

    // Select all entries from the descriptions table
    const query = `SELECT * FROM positions`;

    db.all(query, (err, rows) => {
    if (err) {
        console.error('Database error:', err.message);
        db.close();
        return;
    }

    // Log the retrieved entries to the console
    rows.forEach((row) => {
        console.log(`ID: ${row.id}`);
        console.log(`${row.position}`);
        console.log(`Last Seen: ${row.last_seen}`);
        console.log(`Email Sent?:`+ (row.email_sent) ? "no" : "yes")
        console.log('-------------------------');
    });

    // Close the database connection
    db.close();
    });
    
}

function insertIntoDatabase(position) {
    // connect to the database
    const db = new sqlite3.Database('./positions.sqlite');

    // // create db table if not exists
    db.run(
        `
        CREATE TABLE IF NOT EXISTS positions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            position TEXT UNIQUE,
            last_seen DATETIME,
            email_sent BOOLEAN DEFAULT 0
        )
        `
    );

    const currentDate = new Date().toISOString();
    // getting all unique positions already present in the db
    const checkQuery = `SELECT * FROM positions WHERE position = ?`
    db.get(checkQuery, [position], (err, row) => {
        if (err) {
            console.error('database error:', err.message);
            db.close();
            return;
        }

        if (row) {
            const updateQuery = 
                `
                UPDATE positions SET last_seen = ? WHERE position = ?
                `;
            db.run(updateQuery, [currentDate, position], (err) => {
                if (err) {
                    console.error('Database error:', err.message);
                }
            })
        } else {
            const insertQuery = 
                `
                INSERT INTO 
                    positions (position, last_seen) 
                    VALUES (?, ?)
                `;
            db.run(insertQuery, [position, currentDate], (err) => {
                if (err) {
                    console.error('Database error:', err.message)
                }
            })
        }
    })

    // Close the database connection
    db.close();
}

findAndWriteInfo()