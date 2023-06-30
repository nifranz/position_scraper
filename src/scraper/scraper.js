const axios = require('axios');
const cheerio = require('cheerio');

const CONSTANTS = require('../constants');

module.exports = async function scrapePositions() {
    console.log("Scraping positions ...")
    // Download the HTML page
    const response = await axios.get(CONSTANTS.url);
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
    console.log("Done!")
    return positions;
}
