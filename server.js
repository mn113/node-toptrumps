var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
// My modules:
var game = require('./game.js');    // == object {Card, Deck, Player, Utility, Gameloop}

// Configure Express app:
app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));
// Always serve the main html file to visitors:
app.get('/', function(request, response) {
    response.sendFile('display.html', {root: __dirname + '/public/'});
});

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

// Start serving:
server.listen(5000, function() {
    console.log('listening on *:5000');
});


// Build default things when server starts:
var computer = computer || new game.Player("Computer", true); // Singleton
game.players = new game.Playerlist([computer]);

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
    game.theDeck.dealCards(game.players.active, 25);
});

// Define all Server -> Client broadcast functions:
var comms = {
    // To every user:
    all: {
        announcePlayer: function(player, status) {
            //  Announce joins/leaves:
            if (status === 'in') {
                this.updateGameText("<span class='player'>" + player.name + "</span> joined the game.");
            }
            else if (status === 'out') {
                this.updateGameText("<span class='player'>" + player.name + "</span> left the game.");
            }
        },

        updatePlayerList: function(lastWinner = null) {
            //  Update player list
            console.log(game.loop.players);
            io.emit('playerList', JSON.stringify(game.loop.players), JSON.stringify(lastWinner));
        },

        updateGameText: function(clientText, newLine = true) {
            if (newLine) clientText += '\r\n';
            io.emit('output', clientText);
        },

        updateRoundStats: function() {
            //  Announce round card stats:
            game.loop.roundCards.forEach(card => {
                var name = "<span class='country'>" + card.name + "</span>";
                var value = "<span class='data'>" + card.getProperty(game.loop.category) + "</span>";
                comms.all.updateGameText("&gt; " + name + ": " + value);
            });
        },

        roundStart: function() {
            io.emit('roundStart', "");
        },

        roundEnd: function() {
            io.emit('roundEnd', "");
        }
    },

    // To a specific user:
    specific: {
        sendNamePrompt: function(socketid) {
            // Prompt new client for a name (Player not created yet):
            io.to(socketid).emit('namePrompt', "");
        },

        sendCategoryPrompt: function(player) {
            // Prompt specific user to select the round category:
            io.to(player.sockid).emit('output', "Please choose your category...", false);
            io.to(player.sockid).emit('categoryPrompt', "");
        },

        sendRoundCard: function(player, card) {
            //  Let a player see his top card:
            io.to(player.sockid).emit('yourCard', JSON.stringify(card));
            io.to(player.sockid).emit('output', "You have drawn <span class='country'>" + card.name + "</span>. ", false);
        },

        sendWinLoss: function(player, didWin) {
            io.to(player.sockid).emit('winLoss', didWin);
        }
    }
};


// Socket.io:
io.on('connection', function(socket) {

    // Log connections made:
    console.log("new connection:", socket.handshake.sessionID);
    // Perform duplicate check:
    var allPlayers = game.players.active.concat(game.players.waiting.concat(game.players.paused));
    console.log(allPlayers.length + " players online:", allPlayers);
    allPlayers.forEach(player => {
        if (player.sessid === socket.handshake.sessionID) {
            // Reject player because he's already connected:
            console.log("rejecting socket with sessionId", socket.handshake.sessionID);
            socket.disconnect(true);
            return;
        }
    });
    // sessionId was unused, allow to join:
    comms.specific.sendNamePrompt(socket.id);

    // Listen to clients:
    socket.on('myNameIs', function(inputName) {
        // Make a new player, add him, and update the game:
        // Check if name exists, and add suffix
        allPlayers.forEach(existingPlayer => {
            if (existingPlayer.name === inputName) {
                inputName += '*';
            }
        });
        // Create player & assign Socket.io ids:
        socket.player = new game.Player(inputName);
        socket.player.sessid = socket.handshake.sessionID;
        socket.player.sockid = socket.id;
        console.log('a user connected: ' + socket.player.name + ' aka session ' + socket.player.sessid);
        // Register player:
        game.theDeck.dealCards([socket.player], 25);
        game.players.waiting.push(socket.player);

        // Start game loop if not yet running:
        if (typeof game.loop === "undefined") {
            game.loop = new game.Gameloop(game.players, comms);
            game.loop.run();
        }
        else if (game.loop && game.loop.running) {
            // Let player join existing, running game loop:
            console.log("Joining running loop");
        }
        else {
            // Game loop exists but needs restarting:
            game.loop.run();
        }
        console.log(game.players);
    });

    // Player chooses his category:
    socket.on('categoryPicked', function(cat) {
        console.log('category:', cat);
        game.loop.playerSetCategory(cat);
    });

    // Player pauses/resumes his involvement:
    socket.on('pause', function(bool) {
        // Get player with sockid == socket.id:
        if (bool) {
            game.players.pausePlayer(socket.id);
        }
        else {
            game.players.resumePlayer(socket.id);
        }
    });

    // Connection dropped:
    socket.on('disconnect', function(socket){
        console.log('user disconnected');
        // Splice him out of all players arrays:
        game.players.removePlayer(socket.player);
        comms.all.updatePlayerList();
    });

});
