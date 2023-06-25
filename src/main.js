const PositionsDatabase = require('./database/PositionsDatabase');
const scrapePositions = require('./scraper/scraper');
async function run() {
    const positions = await scrapePositions();
    if (!positions) {
        console.error("No positions found on the website")
        return;
    }

    // insert each position into the database
    const db = new PositionsDatabase();
    for await (let position of positions) {
        console.log(position)
        await db.insertPosition(position);
        console.log("after");
    }

    let allPositions = await db.listPositions("all");
    console.log(allPositions)
    for (let pos of allPositions) {
        console.log("Position ID: ", pos.id);
        console.log("Position Title: ", pos.title);
        console.log("Last Seen: ", pos.last_seen);
        console.log("Email Sent?: ", pos.email_sent?"yes":"no");
        console.log("-------------------");
    }
}

run()