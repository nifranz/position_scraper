const PositionsDatabase = require('./database/PositionsDatabase');
const scrapePositions = require('./scraper/scraper');
const mailPositions = require('./mailer/mailer');

const fs = require('fs');
const path = require('path');
const logFilePath = path.join(__dirname, 'main.log');

// creating date constants
Date.prototype.addHours = function(h) {
    this.setTime(this.getTime() + (h*60*60*1000));
    return this;
  }
const dateString = (new Date().addHours(2).toISOString()).split(".")[0];
const currentDate = dateString.split("T")[0];
const currentTime = dateString.split("T")[1];

// Save the original console.log function
const originalConsoleLog = console.log;

// Create a write stream to the log file
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });
// Override the console.log function
console.log = function (message, prefix = '│') {
    // Write to the log file
    logStream.write("[" + dateString + "]:" + prefix + message + '\n');
  
    // Call the original console.log function to display the output in the console
    originalConsoleLog(message);
};
async function runScraperWorkflow() {
    return new Promise(async (resolve, reject) => {
        console.log("───────────────────────────────────────────────────────────────────────", "╭");
        console.log(`Starting scraper workflow. Current Date: ${currentDate} at ${currentTime} ...`);
        const positions = await scrapePositions();
        console.log("Found positions on the website:")
        if (!positions) {
            console.error("No positions found on the website")
            return;
        }
        console.log(positions)
    
        // insert each position into the database
        const db = new PositionsDatabase();
        for await (let position of positions) {
            await db.insertPosition(position);
        }
    
        let allPositions = await db.listPositions("all");
        originalConsoleLog("=== logging all positions currently present in db")
        for (let pos of allPositions) {
            originalConsoleLog(`╭ Position ID: ${pos.id}`);
            originalConsoleLog(`│ Position Title: ${pos.title}`);
            originalConsoleLog(`│ Last Seen: ${pos.last_seen}`);
            originalConsoleLog(`╰ Email Sent: ${pos.email_sent?"yes":"no"}`);
            originalConsoleLog("-")
        }
    
        // removing all positions that aren't present in the database and that arent present on the website for 10 days
        db.cleanDatabase(7);
    
        console.log("Scraper workflow ended")
        console.log("────────────────────────────────────────────────────────────────────────", "╰");
        resolve();
    })
}

async function runMailerWorkflow() {
    console.log("───────────────────────────────────────────────────────────────────────", "╭");
    console.log(`Starting mailer workflow. Current Date: ${currentDate} at ${currentTime} ...`);
    console.log(await mailPositions());
    console.log("Mailer workflow ended")
    console.log("────────────────────────────────────────────────────────────────────────", "╰");
}

async function run() {
    try {
        await runScraperWorkflow()
    } catch (e) {
        console.error("Error in scraper workflow: "+ e)
    }
    
    try {
        await runMailerWorkflow();
    } catch (e) {
        console.error("Error in mailer workflow:" + e)
    }
}

run();
