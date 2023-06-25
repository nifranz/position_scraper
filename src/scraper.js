
const axios = require('axios');
const cheerio = require('cheerio');
const PositionsDatabase = require("./database/PositionsDatabase.js");

const url = 'https://instinct3.de/career/';

async function scrapePositions() {
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
    return positions;
}

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