var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var game = require('./game.js');

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));

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
    autoSave:true
}));


// Socket.io:
io.on('connection', function(socket){

    // Log connections made:
    //console.log(socket.handshake);
    // Perform duplicate check:
    game.players.forEach(player => {
        if (player.id === socket.handshake.sessionId) {
            // Reject player because he's already connected:
            socket.disconnect(true);
        }
    });
    // sessionId was unused
    // Make a new player, add him, and update the game:
    socket.player = new game.Player("Joe-" + Date.now());   // PROMPT FOR NAME HERE
    socket.player.id = socket.handshake.sessionId;
    console.log('a user connected: ' + socket.player.name + " aka socket " + socket.player.id);
    game.players.push(socket.player);
    updatePlayerList();

    // Connection dropped:
    socket.on('disconnect', function(){
        console.log('user disconnected: ' + socket.player.name + socket.player.id);
    });

    // Listen to clients: MOVE INTO GAMELOOP
    socket.on('categoryPicked', function(cat){
        console.log('category:', cat);
        // Talk back:
        sendCard();
    });

});

// Server -> Client broadcasts
function announcePlayer(status) {
    //  Announce joins/leaves
    switch (status) {
        case 'in':
            io.emit('playerJoin', player.name + "joined the game.");
            break;
        case 'out':
            io.emit('playerLeave', player.name + "left the game.");
            break;
    }
}

function updatePlayerList() {
    //  Update player list
    io.emit('playerList', JSON.stringify(game.players));
}

function announceGameStage(type) {
    switch (status) {
        case 'roundStart':
            //  Announce each round start
            io.emit('roundStart', "Round " + round + " starting...");
            break;
        case 'categorySet':
            //  Announce category choice
            io.emit('categorySet', player + " chose category " + category);
            break;
        case 'statCheck':
            //  Announce round card stats
            var stats = [];
            roundCards.forEach(card => {
                stats.push(card.name + ": " + category + ": " + fetchFromObject(card, category));
            });
            io.emit('statCheck', stats);
            break;
        case 'roundOver':
            //  Announce winner
            io.emit('roundOver', player + " won that round with " + country.name + " and took " + rounCards.length + " cards.");
            break;
    }
}

function sendCard() {
    //  Send out 1 card per player
    io.emit('yourCard', JSON.stringify(game.theDeck.getNextCard()));
}

http.listen(5000, function() {
    console.log('listening on *:3000');
});
