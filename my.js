'use strict';

// begin
const fs = require('fs');
const path = require('path');
const baseDir = 'factbook_all/';

// Define a card:
class Card {
    constructor(countryCode) {
        // open file
        var countryJSON = JSON.parse(fs.readFileSync(baseDir + countryCode +'.json', 'utf8'));
        // Extract individual data pieces and store in my own structured object:
        this.name = assignOrNull(countryJSON, "Government", "Country name", "conventional short form");
        // Account for name aberrations:
        if (!this.name) { this.name = assignOrNull(countryJSON, "Government", "Country name", "Dutch short form"); }
        this.capital = {};
        this.capital.coords = assignOrNull(countryJSON, "Government", "Capital", "geographic coordinates");
        // Extract the lat and long values from coordinate string (also absolutify them):
        var coords = this.capital.coords ? this.capital.coords.split(" ") : null;
        this.capital.lat = coords ? Math.abs(coords[0] + coords[1]/60) : null;
        this.capital.long = coords ? Math.abs(coords[3] + coords[4]/60) : null;
        this.area = {};
        this.area.total = parseNumber(assignOrNull(countryJSON, "Geography", "Area", "total"), "", "sq km");
        this.area.land = parseNumber(assignOrNull(countryJSON, "Geography", "Area", "land"), "", "sq km");
        this.area.water = parseNumber(assignOrNull(countryJSON, "Geography", "Area", "water"), "", "sq km");
        this.elevation = {};
        this.elevation.mean = parseNumber(assignOrNull(countryJSON, "Geography", "Elevation", "mean elevation"), "", "m");
        this.elevation.lowest = parseNumber(assignOrNull(countryJSON, "Geography", "Elevation", "elevation extremes"), "", "m");
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
        this.population.youngest = parseNumber(assignOrNull(countryJSON, "People and Society", "Age structure", "0-14 years"), "", "%");
        this.population.oldest = parseNumber(assignOrNull(countryJSON, "People and Society", "Age structure", "65 years and over"), "", "%");
        this.population.medage = parseNumber(assignOrNull(countryJSON, "People and Society", "Median age", "total"));
        this.population.births = parseNumber(assignOrNull(countryJSON, "People and Society", "Birth rate"), "", "%");
        this.population.lifexp = parseNumber(assignOrNull(countryJSON, "People and Society", "Life expectancy at birth", "total population"));
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
        console.log(text, e);
        return 0;
    }
}
// Test cases:
{
    console.log("Area:", parseNumber("29,743 sq km", "", "sq km"));
    console.log("Low:", parseNumber("lowest point: Debed River 400 m", "", "m"));
    console.log("High:", parseNumber("highest point: Aragats Lerrnagagat' 4,090 m", "", "m"));
    console.log("Pop:", parseNumber("3,051,250 (July 2016 est.)"));
    console.log("Births:", parseNumber("13.3 births/1,000 population (2016 est.)"));
    console.log("Percent:", parseNumber("13.3%", "", "%"));
    console.log("Largest Urban:", parseNumber("THE VALLEY (capital) 1,000 (2014)", "", ""));
}

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

//
function playRound(playerList, category) {
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


// Build main data object:
var countryIndex = {};  // old
var deck = new Deck();  // new
fs.readdir(baseDir, (err, files) => {
    files.forEach(file => {
        var c = path.parse(file).name;
        console.log("Loading", c);
        var card = new Card(c);
        countryIndex[c] = card;
        deck.addCard(card);
    });
    console.log(Object.keys(countryIndex).length + " countries loaded.");
});


setTimeout(function() {
//    testAllData();

    deck.shuffle();
    console.log("Top card:", deck.cards[0].name);

    var bill = new Player("Bill");
    var ben = new Player("Ben");
    var players = [bill, ben];

    deck.dealCards(players, 20);
    console.log("Top card:", deck.cards[0].name);

    bill.status();
    ben.status();

    var r = 5;
    while (r > 0) {
        playRound(players, 'area.total');
        bill.status();
        ben.status();
        r--;
    }

}, 1500);   // Wait for countries to load first
