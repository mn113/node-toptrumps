var game = require('./game.js');    // == object {Card, Deck, Player, Utility, Gameloop, Playerlist}

// Build empty deck of cards:
var theDeck = new game.Deck();
// Fill theDeck from JSON file reads:
const fs = require('fs');
const path = require('path');
const baseDir = 'factbook_all/';
fs.readdir(baseDir, (err, files) => {
    files.forEach(file => {
        var c = path.parse(file).name;
        var card = new game.Card(c);
        theDeck.addCard(card);

        // TEST 1
/*        console.log(
            card.name,
            card.code,
            card.getProperty('capital.lat'),
            card.getProperty('capital.long'),
            card.getProperty('area.land'),
            card.getProperty('area.water'),
            card.getProperty('elevation.lowest'),
            card.getProperty('elevation.mean'),
            card.getProperty('elevation.highest'),
            card.getProperty('borders.land'),
            card.getProperty('borders.coast'),
            card.getProperty('borders.number'),
            card.getProperty('transport.road'),
            card.getProperty('transport.rail'),
            card.getProperty('transport.water'),
            card.getProperty('gdp.net'),
            card.getProperty('gdp.percapita'),
            card.getProperty('population.number'),
            card.getProperty('population.lgurban'),
            card.getProperty('population.density')
        );*/
    });
    console.log(theDeck.cards.length + " countries loaded.");
    theDeck.shuffle();
});

// TEST 2
setTimeout(function() {
    for (var i = 0; i < 30; i++) {
        var c1 = theDeck.getNextCard();
        var c2 = theDeck.getNextCard();
        game.Utility.compareCards([c1, c2], 'capital.lat');
        game.Utility.compareCards([c1, c2], 'capital.long');
    }
}, 2000);
