'use strict';

// begin
const fs = require('fs');
const path = require('path');

// Define a card:
class Card {
    constructor(countryCode) {
        this.code = countryCode;
        // open file
        var countryJSON = JSON.parse(fs.readFileSync(baseDir + countryCode +'.json', 'utf8'));
        // Extract individual data pieces and store in my own structured object:
        this.name = assignOrNull(countryJSON, "Government", "Country name", "conventional short form");
        // Account for name aberrations:
        if (!this.name) { this.name = assignOrNull(countryJSON, "Government", "Country name", "Dutch short form"); }
        this.capital = {};
        this.capital.name = assignOrNull(countryJSON, "Government", "Capital", "name");
        this.capital.coords = assignOrNull(countryJSON, "Government", "Capital", "geographic coordinates");
        // Extract the lat and long values from coordinate string (also absolutify them):
        var coords = this.capital.coords ? this.capital.coords.split(",") : null;   // length 2
        if (coords !== null) {
            try {
                var lat = coords[0].trim().split(/\s/);  // length 3
                var long = coords[1].trim().split(/\s/); // length 3    // null ERROR in 'od'
                this.capital.lat = Math.abs(parseNumber(lat[0]) + parseNumber(lat[1])/60.0);
                this.capital.latsign = lat[2];
                this.capital.long = Math.abs(parseNumber(long[0]) + parseNumber(long[1])/60.0);
                this.capital.longsign = long[2];
                //console.log(countryCode, this.capital.lat, this.capital.latsign);
            }
            catch (e) {
                console.log(countryCode, e);
            }
        }
        else {
            this.capital.lat = null;
            this.capital.latsign = null;
            this.capital.long = null;
            this.capital.longsign = null;
        }
        this.area = {};
        this.area.total = parseNumber(assignOrNull(countryJSON, "Geography", "Area", "total"), "", "sq km");
        this.area.land = parseNumber(assignOrNull(countryJSON, "Geography", "Area", "land"), "", "sq km");
        this.area.water = parseNumber(assignOrNull(countryJSON, "Geography", "Area", "water"), "", "sq km");
        this.elevation = {};
        this.elevation.mean = parseNumber(assignOrNull(countryJSON, "Geography", "Elevation", "mean elevation"), "", "m");
        var elevExtremes = assignOrNull(countryJSON, "Geography", "Elevation", "elevation extremes");
        var elevs = elevExtremes ? elevExtremes.split("++") : null;
        if (elevs !== null) {
            try {
                this.elevation.lowest = parseNumber(elevs[0], "", "m");
                this.elevation.highest = parseNumber(elevs[1], "", "m");
            }
            catch (e) {
                console.log(countryCode, e);
            }
        }
        else {
            this.elevation.lowest = null;
            this.elevation.highest = null;
        }
        this.borders = {};
        this.borders.land = parseNumber(assignOrNull(countryJSON, "Geography", "Land boundaries", "total"), "", "km");
        this.borders.coast =  parseNumber(assignOrNull(countryJSON, "Geography", "Coastline"), "", "km");
        this.borders.list = assignOrNull(countryJSON, "Geography", "Land boundaries", "border countries");
        // Split and count the comma-separated list of neighbours, or use zero:
        this.borders.number = this.borders.list ? this.borders.list.split(',').length : 0;
        this.transport = {};
        this.transport.road = parseNumber(assignOrNull(countryJSON, "Transportation", "Roadways", "total"), "", "km");
        this.transport.rail = parseNumber(assignOrNull(countryJSON, "Transportation", "Railways", "total"), "", "km");
        this.transport.water = parseNumber(assignOrNull(countryJSON, "Transportation", "Waterways"), "", "km");
        this.gdp = {};
        this.gdp.net = parseNumber(assignOrNull(countryJSON, "Economy", "GDP (official exchange rate)"), "$", "");
        this.gdp.percapita = parseNumber(assignOrNull(countryJSON, "Economy", "GDP - per capita (PPP)"), "$", "");
        this.population = {};
        this.population.number = parseNumber(assignOrNull(countryJSON, "People and Society", "Population"));
        this.population.lgurban = parseNumber(assignOrNull(countryJSON, "People and Society", "Major urban areas - population"), "", "");
        this.population.lifexp = parseNumber(assignOrNull(countryJSON, "People and Society", "Life expectancy at birth", "total population"));
        this.population.youngest = parseNumber(assignOrNull(countryJSON, "People and Society", "Age structure", "0-14 years"), "", "%");
        this.population.oldest = parseNumber(assignOrNull(countryJSON, "People and Society", "Age structure", "65 years and over"), "", "%");
        this.population.medage = parseNumber(assignOrNull(countryJSON, "People and Society", "Median age", "total"));
        //this.population.births = parseNumber(assignOrNull(countryJSON, "People and Society", "Birth rate"), "", "%");
        // Calculate density manually:
        this.population.density = this.population.number / this.area.total;

        // Register in Deck
    }
    // Methods:

}

// Define a deck:
class Deck {
    constructor() {
        this.cards = [];
    }

    /*get cards() {
        return this.cards;
    }

    set cards(newCards) {
        this.cards = newCards;
    }
    */
    addCard(card) {
        this.cards.push(card);
    }

    getNextCard() {
        return this.cards.shift();
    }

    // Randomize array element order in-place (using Durstenfeld shuffle algorithm):
    shuffle() {
        for (var i = this.cards.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = this.cards[i];
            this.cards[i] = this.cards[j];
            this.cards[j] = temp;
        }
    }

    // Deal x cards to each of y players:
    dealCards(playerList, number) {
        var players = playerList.length,
            toDeal = players * number;
        for (var i = 0; i < toDeal; i++) {
            // Deal 1 card to each player and loop back around:
            var j = i % players;
            playerList[j].receiveCard(this.getNextCard());
            // Out of cards?:
            if (this.cards.length === 0) { break; }
        }
    }
}

// Define a player:
class Player {
    constructor(name) {
        this.name = name;
        this.wins = 0;
        this.cards = [];
    }

    receiveCard(card) {
        this.cards.push(card);
    }

    playCard() {
        return this.cards.shift();
    }

    status() {
        console.log(this.name, this.wins, this.cards.length, this.cards[0].name);
    }
}


// Test imported data:
function testAllData() {
    var errors = {
        "name": 0,
        "caplat": 0,
        "borders": 0,
        "roads": 0,
        "popnum": 0
    };
    for (var key in countryIndex) {
        if (countryIndex.hasOwnProperty(key)) {
            try {
                var cdata = countryIndex[key];
                if (cdata.name === null) {
                	errors.name++;
                	console.log("NO NAME", key, cdata);
                }
                if (cdata.capital.lat === null) {
                	errors.caplat++;
                	console.log("NO CAPLAT", key, cdata);
                }
                if (cdata.borders.number === null) {
                	errors.borders++;
                	console.log("NO BORDERS", key, cdata);
                }
                if (cdata.transport.road === null) {
                	errors.roads++;
                	console.log("NO ROADS", key, cdata);
                }
                if (cdata.population.number === null) {
                	errors.popnum++;
                	console.log("NO POP", key, cdata);
                }
            } catch (e) {
                console.log(e);
            }
        }
    }
    console.log("Errors:", errors);
}

// Test for and assign a 2- or 3-deep nested JSON property... or null:
function assignOrNull(root, key1, key2, key3) {
    try {
        // Key1 should always exist. Key2 may or may not.
        if (root[key1] && root[key1][key2]) {
            // Key3 is optional
            if (key3) {
                if (root[key1][key2][key3]) {
                    if (root[key1][key2][key3].text && typeof root[key1][key2][key3].text !== "undefined") {
                        return root[key1][key2][key3].text;
                    }
                }
            }
            // Just 2 keys:
            else {
                if (root[key1][key2].text && typeof root[key1][key2].text !== "undefined") {
                    return root[key1][key2].text;
                }
            }
        }
        return null;
    }
    catch (e) {
        return null;
    }
}

// Parse complex numerical values out of a text string:
function parseNumber(text, prefix = '', suffix = '') {
    // Find numerical sequence using regex:
    var re = new RegExp("(?:" + prefix + ")" + "[\\s]*([0-9\\.,])+[\\s]*" + "(?:" + suffix + ")");
    //console.log(re);
    try {
        var foundNum = re.exec(text)[0];
        //console.log("Found:", foundNum);
        // Strip commas:
        var commas = /,/g;
        var rawNum = foundNum.replace(commas, '');
        // parseFloat it:
        return parseFloat(rawNum);
    } catch (e) {
        //console.log(text, e);   // SHOWS MANY ERRORS: Cannot read property '0' of null in parseNumber()
        return 0;
    }
}
// Test cases:
/*{
    console.log("Area:", parseNumber("29,743 sq km", "", "sq km"));
    console.log("Low:", parseNumber("lowest point: Debed River 400 m", "", "m"));
    console.log("High:", parseNumber("highest point: Aragats Lerrnagagat' 4,090 m", "", "m"));
    console.log("Pop:", parseNumber("3,051,250 (July 2016 est.)"));
    console.log("Births:", parseNumber("13.3 births/1,000 population (2016 est.)"));
    console.log("Percent:", parseNumber("13.3%", "", "%"));
    console.log("Largest Urban:", parseNumber("THE VALLEY (capital) 1,000 (2014)", "", ""));
}*/

// Can fetch a deeply-nested property e.g. fetchFromObject(country, "transport.roads.paved")
function fetchFromObject(obj, prop) {
    if(typeof obj === 'undefined') {
        return false;
    }
    var _index = prop.indexOf('.');
    if(_index > -1) {
        return fetchFromObject(obj[prop.substring(0, _index)], prop.substr(_index + 1));
    }
    return obj[prop];
}

// Compare an array of cards on a property and return winner:
function compareCards(cards, prop) {
    cards.forEach(card => {
        console.log(card.name, fetchFromObject(card, prop));
    });
    // Pick winner:
    var highest = cards.reduce((a,b) => {
        // Test for nulls:
        if (fetchFromObject(a, prop) === null) {
            return b;
        }
        else if (fetchFromObject(b, prop) === null) {
            return a;
        }
        // No nulls, compare values:
        return (fetchFromObject(a, prop) > fetchFromObject(b, prop)) ? a : b;
    });
    //var lowest = cards.reduce((a,b) => {
    //    return (a < b) ? a : b;
    //});
    console.log(highest.name, "wins with", fetchFromObject(highest, prop));
    return highest;
}


class Gameloop {
    constructor () {
        this.running = false;
        this.round = 0;
        this.playerList = [];
    }

    run() {
        this.running = true;
        while (this.running) {
            this.round++;
            this.addWaitingPlayers();
            announceGameStage("Round", this.round, ':');
            // Ask for category:
            announceGameStage(activePlayer.name +" to choose category...");
            wait();
            announceGameStage(activePlayer.name +" chose "+ category);
            // Play ad infinitum:
            while (this.running && players.length > 1) {
                // Loop players:
                this.playRound(this.playerList, category);
                // End condition:
                if (this.round === 10) {
                    this.running = false;
                }
            }
        }
    }

    playRound(playerList, category) {
        // somebody must choose a category first
        if (typeof category === "undefined") {
            category = "population.number";
        }

        // Players play their cards into the "pot":
        var roundCards = [];
        playerList.forEach(player => {
            roundCards.push(player.playCard());
        });

        // Compare cards:
        var winningCard = compareCards(roundCards, category),
            windex = roundCards.indexOf(winningCard),
            winningPlayer = playerList[windex];
        console.log(winningPlayer.name, "won with", winningCard.name);

        // Reassign all played cards to winner:
        roundCards.forEach(card => {
            winningPlayer.receiveCard(card);
        });
    }

    addWaitingPlayers() {
        announce("Players joined");
    }

    waitForCategory() {

    }
}


// Build master deck of cards:
var theDeck = new Deck();
const baseDir = 'factbook_all/';
fs.readdir(baseDir, (err, files) => {
    files.forEach(file => {
        var c = path.parse(file).name;
        var card = new Card(c);
        theDeck.addCard(card);
    });
    console.log(theDeck.cards.length + " countries loaded.");
    theDeck.shuffle();
});


var computer = new Player("Computer");  // NEEDS SPECIAL ID
var players = [computer];

/*
setTimeout(function() {

    theDeck.dealCards(players, 20);
    console.log("Top card:", theDeck.cards[0].name);


}, 1500);   // Wait for countries to load first
*/

/**
 * Expose it to parent file:
 */
module.exports = {
    // Classes:
    Gameloop: Gameloop,
    Player: Player,
    Card: Card,
    Deck: Deck,
    // Vars:
    theDeck: theDeck,
    players: players
};
