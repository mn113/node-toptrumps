var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
// My modules:
var game = require('./game.js');    // == object {Card, Deck, Player, Utility, Gameloop}

// Configure Express app:
app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));


// Session management stuff using express-socket.io-session module:
var session = require("express-session")({
    secret: "my-secret",    // ?
    resave: true,
    saveUninitialized: true
});
var sharedsession = require("express-socket.io-session");
// Use express-session middleware for express
app.use(session);
// Use shared session middleware for socket.io
// setting autoSave:true
io.use(sharedsession(session, {
    autoSave:true   // ?
}));


// Build default things when server starts:
var computer = new game.Player("Computer", true); // NEEDS TO BE SINGLETON
game.players = {
    "active": [computer],
    "waiting": []
};

// Build empty deck of cards:
game.theDeck = new game.Deck();
// Fill theDeck from JSON file reads:
const fs = require('fs');
const path = require('path');
const baseDir = 'factbook_all/';
fs.readdir(baseDir, (err, files) => {
    files.forEach(file => {
        var c = path.parse(file).name;
        var card = new game.Card(c);
        game.theDeck.addCard(card);
    });
    console.log(game.theDeck.cards.length + " countries loaded.");
    game.theDeck.shuffle();
});


// Define all Server -> Client broadcast functions:
var comms = {

    namePrompt: function(socketid) {
        // Send prompt to this user only:
        console.log("sending namePrompt to", socketid);
        io.to(socketid).emit('namePrompt', "");   // NOT WORKING
    },

    updatePlayerList: function() {
        //  Update player list
        io.emit('playerList', JSON.stringify(game.players));
    },

    announcePlayer: function(player, status) {
        //  Announce joins/leaves
        switch (status) {
            case 'in':
                io.emit('output', player.name + "joined the game.");
                break;
            case 'out':
                io.emit('output', player.name + "left the game.");
                break;
        }
    },

    updateGameText: function(text) {
        io.emit('output', text);
/*        switch (type) {
            case 'roundStart':
                //  Announce each round start
                io.emit('output', "Round " + game.loop.round + " starting...");
                break;
            case 'categorySet':
                //  Announce category choice
                io.emit('output', game.loop.lastWinner.name + " chose category " + game.loop.category);
                break;
            case 'roundOver':
                //  Announce winner
                io.emit('output', game.loop.lastWinner.name + " won that round and took " + game.loop.roundCards.length + " cards.");
                break;
        }
*/    },

    updateRoundStats: function() {
        //  Announce round card stats
        var stats = [];
        game.loop.roundCards.forEach(card => {
            // TODO! refactor...
            stats.push(card.name + ": " + game.loop.category + ": " + game.Utility.fetchFromObject(card, game.loop.category));
        });
        io.emit('roundStats', stats);
    },

    sendCard: function(socketid) {
        //  Send out 1 card per player
        io.to(socketid).emit('yourCard', JSON.stringify(game.theDeck.getNextCard()));
    },

    categoryPrompt: function(socketid) {
        // Send prompt to this user only:
        io.to(socketid).emit('categoryPrompt', null);
    }
};


// Socket.io:
io.on('connection', function(socket){

    console.log("new connection:", socket.handshake.sessionID);
    // Log connections made:
    //console.log(socket.handshake);
    // Perform duplicate check:
    var allPlayers = game.players.active.concat(game.players.waiting);
    allPlayers.forEach(player => {
        if (player.sessid === socket.handshake.sessionID) {
            // Reject player because he's already connected:
            console.log("rejecting socket with sessionId", socket.handshake.sessionID);
            socket.disconnect(true);
        }
    });
    // sessionId was unused, allow to join:
    comms.namePrompt(socket.id);

    // Listen to clients:
    socket.on('myNameIs', function(name) {
        // Make a new player, add him, and update the game:
        // TODO: check if name exists, and add suffix
        socket.player = new game.Player(name);
        socket.player.sessid = socket.handshake.sessionID;
        socket.player.sockid = socket.id;
        console.log('a user connected: ' + socket.player.name + ' aka session ' + socket.player.sessid);
        // Register player:
        game.players.waiting.push(socket.player);
        comms.updatePlayerList();

        // Start game loop if not yet running:
        if (typeof game.loop === "undefined") {
            game.theDeck.shuffle();
            game.theDeck.dealCards(game.players.active, 25);
            game.loop = new game.Gameloop(game.players);
            game.loop.run();
        }
        console.log(game.players);
    });

    // Player chose his category:
    socket.on('categoryPicked', function(cat) {
        console.log('category:', cat);
        game.setCategory(cat);
    });

    // Connection dropped:
    socket.on('disconnect', function(socket){
        console.log('user disconnected');
        // Splice him out of both players arrays:
        game.players.active.splice(game.players.active.indexOf(socket.player), 1);
        game.players.waiting.splice(game.players.waiting.indexOf(socket.player), 1);    // SMELLY
        comms.updatePlayerList();
    });

});


// Always serve the main html file to visitors:
app.get('/', function(request, response) {
    response.sendFile('display.html', {root: __dirname + '/public/'});
});

// Start serving:
http.listen(5000, function() {
    console.log('listening on *:5000');
});
