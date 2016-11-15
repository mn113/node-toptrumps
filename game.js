'use strict';

const fs = require('fs');
const baseDir = 'factbook_all/';

// Define a card:
class Card {
    constructor(countryCode) {
        this.code = countryCode;
        // open file
        var countryJSON = JSON.parse(fs.readFileSync(baseDir + countryCode +'.json', 'utf8'));
        // Extract individual data pieces and store in my own structured object:
        this.name = Utility.assignOrNull(countryJSON, "Government", "Country name", "conventional short form");
        // Account for name aberrations:
        if (!this.name) { this.name = Utility.assignOrNull(countryJSON, "Government", "Country name", "Dutch short form"); }
        this.capital = {};
        var capname = Utility.assignOrNull(countryJSON, "Government", "Capital", "name");
        this.capital.name = capname ? capname.split(/[(,;\.\-\[]/)[0] : "unknown";
        this.capital.coords = Utility.assignOrNull(countryJSON, "Government", "Capital", "geographic coordinates");
        // Extract the lat and long values from coordinate string (also absolutify them):
        var coords = this.capital.coords ? this.capital.coords.split(",") : null;   // length 2
        if (coords !== null) {
            try {
                var lat = coords[0].trim().split(/\s/);  // length 3
                var long = coords[1].trim().split(/\s/); // length 3    // null ERROR in 'od'
                this.capital.lat = Math.abs(Utility.parseNumber(lat[0]) + Utility.parseNumber(lat[1])/60.0);
                this.capital.latsign = lat[2];
                this.capital.long = Math.abs(Utility.parseNumber(long[0]) + Utility.parseNumber(long[1])/60.0);
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
        this.area.total = Utility.parseNumber(Utility.assignOrNull(countryJSON, "Geography", "Area", "total"), "", "sq km");
        this.area.land = Utility.parseNumber(Utility.assignOrNull(countryJSON, "Geography", "Area", "land"), "", "sq km");
        this.area.water = Utility.parseNumber(Utility.assignOrNull(countryJSON, "Geography", "Area", "water"), "", "sq km");
        this.elevation = {};
        this.elevation.mean = Utility.parseNumber(Utility.assignOrNull(countryJSON, "Geography", "Elevation", "mean elevation"), "", "m");
        var elevExtremes = Utility.assignOrNull(countryJSON, "Geography", "Elevation", "elevation extremes");
        var elevs = elevExtremes ? elevExtremes.split("++") : null;
        if (elevs !== null) {
            try {
                this.elevation.lowest = Utility.parseNumber(elevs[0], "", "m");
                this.elevation.highest = Utility.parseNumber(elevs[1], "", "m");
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
        this.borders.land = Utility.parseNumber(Utility.assignOrNull(countryJSON, "Geography", "Land boundaries", "total"), "", "km");
        this.borders.coast =  Utility.parseNumber(Utility.assignOrNull(countryJSON, "Geography", "Coastline"), "", "km");
        this.borders.list = Utility.assignOrNull(countryJSON, "Geography", "Land boundaries", "border countries");
        // Split and count the comma-separated list of neighbours, or use zero:
        this.borders.number = this.borders.list ? this.borders.list.split(',').length : 0;
        this.transport = {};
        this.transport.road = Utility.parseNumber(Utility.assignOrNull(countryJSON, "Transportation", "Roadways", "total"), "", "km");
        this.transport.rail = Utility.parseNumber(Utility.assignOrNull(countryJSON, "Transportation", "Railways", "total"), "", "km");
        this.transport.water = Utility.parseNumber(Utility.assignOrNull(countryJSON, "Transportation", "Waterways"), "", "km");
        this.gdp = {};
        this.gdp.net = Utility.parseNumber(Utility.assignOrNull(countryJSON, "Economy", "GDP (official exchange rate)"), "$", "");
        this.gdp.percapita = Utility.parseNumber(Utility.assignOrNull(countryJSON, "Economy", "GDP - per capita (PPP)"), "$", "");
        this.population = {};
        this.population.number = Utility.parseNumber(Utility.assignOrNull(countryJSON, "People and Society", "Population"));
        this.population.lgurban = Utility.parseNumber(Utility.assignOrNull(countryJSON, "People and Society", "Major urban areas - population"), "", "");
        this.population.lifexp = Utility.parseNumber(Utility.assignOrNull(countryJSON, "People and Society", "Life expectancy at birth", "total population"));
        this.population.youngest = Utility.parseNumber(Utility.assignOrNull(countryJSON, "People and Society", "Age structure", "0-14 years"), "", "%");
        this.population.oldest = Utility.parseNumber(Utility.assignOrNull(countryJSON, "People and Society", "Age structure", "65 years and over"), "", "%");
        this.population.medage = Utility.parseNumber(Utility.assignOrNull(countryJSON, "People and Society", "Median age", "total"));
        //this.population.births = parseNumber(assignOrNull(countryJSON, "People and Society", "Birth rate"), "", "%");
        // Calculate density manually:
        this.population.density = this.population.number / this.area.total;

        // Register in Deck
    }

    getProperty() {

    }
}

// Define a deck:
class Deck {
    constructor() {
        this.cards = [];
    }

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
    constructor(name, isComputer = false) {
        this.name = name;
        this.isComputer = isComputer;   // TOO SIMPLISTIC / HACKABLE?
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

// Various functions:
class Utility {

    // Test for and assign a 2- or 3-deep nested JSON property... or null:
    static assignOrNull(root, key1, key2, key3) {
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
    static parseNumber(text, prefix = '', suffix = '') {
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

    // Can fetch a deeply-nested property e.g. fetchFromObject(country, "transport.roads.paved")
    static fetchFromObject(obj, prop) {
        if(typeof obj === 'undefined') {
            return false;
        }
        var _index = prop.indexOf('.');
        if(_index > -1) {
            return Utility.fetchFromObject(obj[prop.substring(0, _index)], prop.substr(_index + 1));
        }
        return obj[prop];
    }

    // Compare an array of cards on a property and return winner:
    static compareCards(cards, prop) {
        cards.forEach(card => {
            console.log(card.name, prop, Utility.fetchFromObject(card, prop));
        });
        // Pick winner:
        try {
            var highest = cards.reduce((a,b) => {
                // Test for nulls:
                if (Utility.fetchFromObject(a, prop) === null) {
                    return b;
                }
                else if (Utility.fetchFromObject(b, prop) === null) {
                    return a;
                }
                // No nulls, compare values:
                return (Utility.fetchFromObject(a, prop) > Utility.fetchFromObject(b, prop)) ? a : b;
            });

            console.log(highest.name, "wins with", Utility.fetchFromObject(highest, prop));
            return highest;
        }
        catch (e) {
            return cards[0];    // quick fix
        }
        // TODO:
        //var lowest = cards.reduce((a,b) => {
        //    return (a < b) ? a : b;
        //});
    }
}

var computer = computer || new Player("Computer", true); // Singleton

// Define the main loop that runs the game, and related functions:
class Gameloop {
    constructor (players, comms) {
        this.running = false;
        this.waitInterval = null;    // setInterval placeholder
        this.playerList = players.active;
        this.waitList = players.waiting;
        this.round = 1;
        this.category = null;   // changes each round
        this.roundCards = [];
        this.lastWinner = computer;
        this.comms = comms;     // injected dependency

        console.log("Gameloop initialised.");
        //console.log(this.playerList);
        //console.log(this.waitList);
    }

    run() {
        this.running = true;
        // End condition:
        if (this.round === 20) {
            this.running = false;
            return;
        }
        // Play ad infinitum:
        if (!this.running || this.playerList.length + this.waitList.length <= 1) {
            this.running = false;
            return;
        }

        // Preamble:
        this.addWaitingPlayers();
        console.log("Round:", this.round);
        this.comms.updateGameText("<hr>");
        this.comms.updateGameText("Round " + this.round + ':');

        // Play cards:
        setTimeout(() => {
            this.playRoundPart1();  // -> waitForCategory() -> playRoundPart2 -> end of 3-part loop
        }, 500);
    }

    addWaitingPlayers() {
        // Move all waiting players to active list:
        while (this.waitList.length > 0) {
            var newPlayer = this.waitList.shift();
            this.playerList.push(newPlayer);
            this.comms.announcePlayer(newPlayer, 'in');
        }
    }

    playRoundPart1() {
        // Players play their cards into the "pot":
        this.playerList.forEach(player => {
            var card = player.playCard();
            this.roundCards.push(card);

            // Also let everybody see their top card:
            this.comms.sendCard(player, card);
        });

        // Somebody must now choose a category:
        this.comms.updateGameText("<span class='player'>" + this.lastWinner.name + "</span> to choose category...");
        this.waitForCategory();
    }

    waitForCategory() {
        // Start a timer, we don't want to wait all day:
        this.waitInterval = setInterval(function() {
            this.randomiseCategory();
            this.playRoundPart2();
        }.bind(this), 4000);

        // While we wait, ask for user input:
        if (this.lastWinner && this.lastWinner.cards[0]) {
            this.comms.categoryPrompt(this.lastWinner.sockid, this.lastWinner.cards[0]);
        }
        else {
            // If no winner, Computer chooses immediately:
            clearInterval(this.waitInterval);
            this.randomiseCategory();
            this.playRoundPart2();
        }
    }

    setCategory(cat) {
        this.category = cat;
        this.comms.updateGameText("<span class='player'>" + this.lastWinner.name + "</span> chose category <span class='category'>" + cat + "</span>");
        this.playRoundPart2();
    }

    randomiseCategory() {
        // TODO! randomisation
        if (!this.category) {
            this.category = "population.number";
            this.comms.updateGameText("Computer chose category <span class='category'>" + this.category + "</span>");
        }
    }

    playRoundPart2() {
        // Compare cards:
        this.comms.updateRoundStats();
        var winningCard = Utility.compareCards(this.roundCards, this.category),
            windex = this.roundCards.indexOf(winningCard),
            winningPlayer = this.playerList[windex];
        this.lastWinner = winningPlayer;

        this.comms.updateGameText("<span class='player'>" + winningPlayer.name + "</span> won with <span class='country'>" + winningCard.name + "</span> and gained " + (this.roundCards.length - 1) + " card(s).");
        this.lastWinner.wins++;
        // Reassign all played cards to winner:
        this.roundCards.forEach(card => {
            winningPlayer.receiveCard(card);
        });
        this.roundCards = [];

        // Round over!
        this.comms.updatePlayerList();
        this.category = null;
        this.round++;
        // Back to the beginning of the Gameloop!
        setTimeout(() => {
            this.run();
        }, 500);
    }
}


/**
 * Expose classes to parent file:
 */
module.exports = {
    // Classes:
    Card: Card,
    Deck: Deck,
    Player: Player,
    Utility: Utility,
    Gameloop: Gameloop
};
