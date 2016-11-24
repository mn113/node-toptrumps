var game = require('./game.js');    // == object {Card, Deck, Player, Utility, Gameloop, Playerlist}

// Fill theDeck from JSON file reads:
const fs = require('fs');
const path = require('path');
const baseDir = 'factbook_all/';
fs.readdir(baseDir, (err, files) => {
    files.forEach(file => {
        var c = path.parse(file).name;
        var card = new game.Card(c);

        // TEST
        console.log(
//            card.name,
            card.code,
/*            card.getProperty('capital.lat'),
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
            card.getProperty('transport.water'),*/
            card.getProperty('gdp.net'),
            card.getProperty('gdp.percapita'),
            card.getProperty('population.number'),
            card.getProperty('population.lgurban'),
            card.getProperty('population.density')
        );
    });
});
