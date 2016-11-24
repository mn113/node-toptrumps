'use strict';

const fs = require('fs');
const baseDir = 'factbook_all/';

// Define a card:
class Card {
    //Extract all required data from JSON and set it as Card properties:
    constructor(countryCode) {
        this.code = countryCode;
        // open file
        var countryJSON = JSON.parse(fs.readFileSync(baseDir + countryCode +'.json', 'utf8'));
        // Extract individual data pieces:
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
                this.capital.lat = Math.abs(Utility.parseNumber(lat[0]) + Utility.parseNumber(lat[1])/60.0).toFixed(2);
                this.capital.latsign = lat[2];
                this.capital.long = Math.abs(Utility.parseNumber(long[0]) + Utility.parseNumber(long[1])/60.0).toFixed(2);
                this.capital.longsign = long[2];
                //console.log(countryCode, this.capital.lat, this.capital.latsign);
            }
            catch (e) {
                console.log(countryCode, e);
            }
        }
        else {
            this.capital.lat = 0;
            this.capital.latsign = 'N';
            this.capital.long = 0;
            this.capital.longsign = 'W';
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
        this.borders.number = this.borders.list ? this.borders.list.split(', ').length : 0;

        this.transport = {};
        this.transport.road = Utility.parseNumber(Utility.assignOrNull(countryJSON, "Transportation", "Roadways", "total"), "", "km");
        this.transport.rail = Utility.parseNumber(Utility.assignOrNull(countryJSON, "Transportation", "Railways", "total"), "", "km");
        this.transport.water = Utility.parseNumber(Utility.assignOrNull(countryJSON, "Transportation", "Waterways"), "", "km");

        this.gdp = {};
        this.gdp.net = Utility.parseMoney(Utility.assignOrNull(countryJSON, "Economy", "GDP (purchasing power parity)"));
        this.gdp.percapita = Utility.parseMoney(Utility.assignOrNull(countryJSON, "Economy", "GDP - per capita (PPP)"));

        this.population = {};
        this.population.number = Utility.parseNumber(Utility.assignOrNull(countryJSON, "People and Society", "Population"));
        // Handle million vs non-million values in lgurban:
        this.population.lgurban = Utility.parseNumber(Utility.assignOrNull(countryJSON, "People and Society", "Major urban areas - population"), "", "");
        // Check for non-integer, e.g. 1.5 (million) and if so, multiply:
        if (this.population.lgurban % 1 !== 0) { this.population.lgurban *= 1000000; }

        this.population.lifexp = Utility.parseNumber(Utility.assignOrNull(countryJSON, "People and Society", "Life expectancy at birth", "total population"));
        this.population.youngest = Utility.parseNumber(Utility.assignOrNull(countryJSON, "People and Society", "Age structure", "0-14 years"), "", "%");
        this.population.oldest = Utility.parseNumber(Utility.assignOrNull(countryJSON, "People and Society", "Age structure", "65 years and over"), "", "%");
        this.population.medage = Utility.parseNumber(Utility.assignOrNull(countryJSON, "People and Society", "Median age", "total"));
        //this.population.births = parseNumber(assignOrNull(countryJSON, "People and Society", "Birth rate"), "", "%");
        // Calculate density manually:
        this.population.density = (this.population.number / this.area.total).toFixed(1);

        // Register in Deck
    }

    getProperty(prop) {
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

        return fetchFromObject(this, prop);
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

    addCards(cardArray) {
        cardArray.forEach(card => {
            this.addCard(card);
        });
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
        console.log(this.name, this.wins + " wins", this.cards.length + " cards");
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
            try {
                return parseFloat(rawNum);
            }
            catch (e) {
                console.log("NaN", rawNum);
                return rawNum;
            }
        } catch (e) {
            //console.log(text, e);   // SHOWS MANY ERRORS: Cannot read property '0' of null in parseNumber()
            return 0;
        }
    }

    // Parse monetary values out of a text string:
    static parseMoney(text) {
        // Find money sequence using regex: (e.g. $5.4 billion or $94,700)
        var re = new RegExp("[\\s]*([0-9\\.,])+[\\s]*" + "[mb]?(tr)?(illion)?");
        //console.log(re);
        try {
            var foundAmount = re.exec(text)[0];
            //console.log("Found:", foundAmount);
            // Strip commas:
            var commas = /,/g;
            var rawAmount = foundAmount.replace(commas, '');
            var firstPart = rawAmount.split(" ")[0];
            // Test how big a suffix the amount has:
            if (rawAmount.match("million")) {
                return 1000000 * parseFloat(firstPart);
            }
            else if (rawAmount.match("billion")) {
                return 1000000000 * parseFloat(firstPart);
            }
            else if (rawAmount.match("trillion")) {
                return 1000000000000 * parseFloat(firstPart);
            }
            else {
                return parseFloat(rawAmount);
            }
        } catch (e) {
            //console.log(text, e);   // SHOWS MANY ERRORS: Cannot read property '0' of null in parseNumber()
            return 0;
        }
    }

    // Compare an array of cards on a property and return winner:
    static compareCards(cards, prop) {
        cards.forEach(card => {
            console.log(card.code, card.name, prop, card.getProperty(prop));
        });
        // Pick winner:
        try {
            var highest = cards.reduce((a,b) => {
                // Test for nulls:
                if (a.getProperty(prop) === null) {
                    return b;
                }
                else if (b.getProperty(prop) === null) {
                    return a;
                }
                // No nulls, compare values:
                return (a.getProperty(prop) > b.getProperty(prop)) ? a : b;
            });

            console.log(highest.name, "wins with", highest.getProperty(prop));
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
    constructor (players, deck, comms) {
        this.running = false;
        this.players = players;     // instance of Playerlist class
        this.deck = deck;
        this.comms = comms;         // injected dependency
        this.waitTimeout = null;    // setTimeout placeholder
        this.round = 1;         // increments
        this.category = null;   // resets every round
        this.roundCards = [];   // resets every round
        this.lastWinner = this.players.waiting[0] || computer;

        console.log("Gameloop initialised.");
    }

    checkGameState() {
        // End conditions:
        if (!this.running ||
            this.players.active.length + this.players.waiting.length <= 1) {
            // Stop the loop:
            this.stop();
        }
    }

    run() {
        this.running = true;
        // Break out if stopped or paused:
        this.checkGameState();
        if (!this.running) return;

        // Preamble:
        this.addWaitingPlayers();
        console.log("Round:", this.round);
        this.comms.all.updateGameText("Round " + this.round + ':');

        // Play cards:
        setTimeout(() => {
            this.playRoundPart1();  // -> waitForCategory() -> playRoundPart2 -> playRoundPart3 -> run()
        }, 2000);
    }

    addWaitingPlayers() {
        console.log(this.players.waiting.length + " players waiting to join.");
        // Move all waiting players to active list:
        this.players.waiting.forEach(player => {
            this.players.movePlayer(player, 'waiting', 'active');
            this.comms.all.announcePlayer(player, 'in');
        });
    }

    playRoundPart1() {
        // Break out if stopped or paused:
        this.checkGameState();
        if (!this.running) return;

        // Players play their cards into the "pot":
        this.players.active.forEach(player => {
            var card = player.playCard();
            this.roundCards.push(card);

            // Also let everybody see their top card:
            if (!player.isComputer) {
                this.comms.specific.sendRoundCard(player, card); //  (also sends a message)
            }
        });

        // Somebody must now choose a category:
        try {
            if (this.lastWinner) {
                this.comms.all.updateGameText("<span class='player'>" + this.lastWinner.name + "</span> to choose category...", false);
            }
        }
        catch (e) {
            console.log(e);
        }
        this.comms.all.roundStart();
        this.waitForCategory();
    }

    // There are 3 ways out of this function.
    // 1. sendCategoryPrompt(this.lastWinner) -> playerSetCategory(cat) -> playRoundPart2()
    // 2. no lastWinner -> randomiseCategory() & playRoundPart2()
    // 3. timer expires -> randomiseCategory() & playRoundPart2()
    waitForCategory() {
        // Break out if stopped or paused:
        this.checkGameState();
        if (!this.running) return;

        // Start a timer, we don't want to wait all day:
        this.waitTimeout = setTimeout(function() {
            this.randomiseCategory();
            this.playRoundPart2();
        }.bind(this), 7000);

        console.info('LW', this.lastWinner.name, this.lastWinner.isComputer, this.lastWinner.sockid);
        // While we wait, ask for human input:
        if (this.lastWinner.isComputer) {
            // If no human winner, Computer chooses immediately:
            clearTimeout(this.waitTimeout);
            this.randomiseCategory();
            setTimeout(function() {
                this.playRoundPart2();
            }.bind(this), 1500);
        }
        else {
            // Human must choose:
            this.comms.specific.sendCategoryPrompt(this.lastWinner);
        }
    }

    playerSetCategory(cat) {
        this.category = cat;
        this.comms.all.updateGameText(" <span class='category'>" + cat + "</span> chosen.");
        // No need to keep on waiting:
        clearTimeout(this.waitTimeout);
        this.playRoundPart2();
    }

    randomiseCategory() {
        if (!this.category) {
            var options = [
                "population.number",
                "area.total",
                "elevation.highest",
                "capital.lat",
                "capital.long",
                "borders.land",
                "population.lifexp"
            ];
            // Select at random from above list:
            this.category = options[Math.floor(options.length * Math.random())];
            this.comms.all.updateGameText(" <span class='category'>" + this.category + "</span> randomly chosen.");
        }
    }

    playRoundPart2() {
        // Break out if stopped or paused:
        this.checkGameState();
        if (!this.running) return;

        // Compare cards:
        this.comms.all.updateRoundStats();
        var winningCard = Utility.compareCards(this.roundCards, this.category),
            windex = this.roundCards.indexOf(winningCard),
            winningPlayer = this.players.active[windex];
        this.lastWinner = winningPlayer;

        // Add delay:
        setTimeout(() => {
            this.playRoundPart3(winningCard);
        }, 1500);
    }

    playRoundPart3(winningCard) {
        // Break out if stopped or paused:
        this.checkGameState();
        if (!this.running) return;

        // Send win/loss Boolean to each player:
        this.players.active.forEach(player => {
            this.comms.specific.sendWinLoss(player, player === this.lastWinner);
        });

        // General stats/comms:
        this.lastWinner.wins++;
        this.comms.all.updateGameText("<span class='player'>" + this.lastWinner.name + "</span> won with <span class='country'>" + winningCard.name + "</span>", false);
        this.comms.all.updateGameText(" and gained " + (this.roundCards.length - 1) + " card(s).");
        this.comms.all.updateGameText("<hr>", false);   // prevent newline gap
        console.log("-----");   // <hr>
        this.comms.all.updatePlayerList(this.lastWinner);

        // Reassign all played cards to winner:
        this.roundCards.forEach(card => {
            try {
                this.lastWinner.receiveCard(card);
            }
            catch (e) {
                console.log(e);
            }
        });
        this.comms.all.updatePlayerList();

        // Check card totals:
        this.checkCards();

        // Round over!
        this.reset();
        this.comms.all.roundEnd();

        // Delay, then back to the beginning of the Gameloop!
        setTimeout(() => {
            this.run();
        }, 2000);
    }

    // Check everyone for zero cards left:
    checkCards() {
        this.players.active.forEach(player => {
            if (player.cards.length === 0) {
                if (!player.isComputer) {
                    // "You lost!"
                    this.comms.specific.gameOver(player, false);
                    this.pausePlayer(player);
                }
                else {
                    this.comms.all.updateGameText("The computer was defeated!");
                    // Deal computer back in:
                    this.deck.dealCards([computer], 20);
                    computer.status();
                }

            }
        });
        this.comms.all.updatePlayerList();
    }

    stop() {
        // Make Gameloop stop (when running condition is next checked):
        this.running = false;
        console.log("Gameloop stopped.");
        // Cleanup on aisle 3:
        this.reset();
        this.lastWinner = computer;
    }

    reset() {
        // Set default values for loop properties:
        clearTimeout(this.waitTimeout);
        this.round++;
        this.category = null;
        this.roundCards = [];
    }

    pausePlayer(player) {
        // Transfer player from active to paused list:
        this.players.movePlayer(player, 'active', 'paused');
        this.comms.all.announcePlayer(player, 'out');
        // The loop will then check if it should stop
    }

    resumePlayer(player) {
        // Transfer player from paused to waiting list:
        this.players.movePlayer(player, 'paused', 'waiting');
        // Give him cards:
        if (player.cards.length === 0) {
            this.deck.dealCards([player], 20);
        }
        // Restart the loop:
        if (!this.running) this.run();
    }

}

class Playerlist {
    constructor(players, comms) {
        this.active = players;
        this.waiting = [];
        this.paused = [];
        this.comms = comms;
    }

    addPlayer(player, list = 'waiting') {
        this[list].push(player);
    }

    removePlayer(player) {
        if (this.active.indexOf(player) !== -1) {
            this.active.splice(this.active.indexOf(player), 1);
        }
        else if (this.waiting.indexOf(player) !== -1) {
            this.waiting.splice(this.waiting.indexOf(player), 1);
        }
        else if (this.paused.indexOf(player) !== -1) {
            this.paused.splice(this.paused.indexOf(player), 1);
        }
        this.comms.all.updatePlayerList(); // HOW TO RUN THIS HERE?
    }

    movePlayer(player, from, to) {
        // Transfer a player between any 2 lists:
        var index = this[from].indexOf(player);
        if (index !== -1) {
            this[from].splice(index, 1);
            this[to].push(player);
        }
        this.comms.all.updatePlayerList();
        // Inform them:
        this.comms.specific.sendPlayerStatus(player, to);
    }

    getAll() {
        return {
            active: this.active,
            waiting: this. waiting,
            paused: this.paused
        };
    }

    toString(list) {
        var output = list + ': ' + this[list].length + ' [';
        this[list].forEach(player => {
            output += player.name + ', ';
        });
        return output + ']';
    }

    allToString() {
        return  this.toString('active') + '\n' +
                this.toString('waiting') + '\n' +
                this.toString('paused');
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
    Gameloop: Gameloop,
    Playerlist: Playerlist
};
