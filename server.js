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

    console.log("new connection:", socket.handshake.sessionID);
    // Log connections made:
    //console.log(socket.handshake);
    // Perform duplicate check:
    game.players.forEach(player => {
        if (player.id === socket.handshake.sessionID) {
            // Reject player because he's already connected:
            console.log("rejecting socket with sessionId", socket.handshake.sessionID);
            socket.disconnect(true);
        }
    });
    //console.log(socket)
    // sessionId was unused, allow to join:
    namePrompt(socket.id);

    // Connection dropped:
    socket.on('disconnect', function(){
        console.log('user disconnected');
    });

    // Listen to clients:
    socket.on('myNameIs', function(name) {
        // Make a new player, add him, and update the game:
        // TODO: check if name exists, and add suffix
        socket.player = new game.Player(name);
        socket.player.id = socket.handshake.sessionId;
        console.log('a user connected: ' + socket.player.name + " aka socket " + socket.player.id);
        game.players.push(socket.player);
        updatePlayerList();

        // Start game loop if not yet running:
        if (typeof game.loop === "undefined") {
            game.loop = new game.Gameloop();
            game.loop.run();
        }
    });

    // MOVE INTO GAMELOOP
    socket.on('categoryPicked', function(cat){
        console.log('category:', cat);
        // Talk back:
        sendCard();
    });

});

// Server -> Client broadcasts
function namePrompt(socketid) {
    // Send prompt to this user only:
    io.to(socketid).emit('namePrompt', null);
}

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

function sendCard(socketid) {
    //  Send out 1 card per player
    io.to(socketid).emit('yourCard', JSON.stringify(game.theDeck.getNextCard()));
}

http.listen(5000, function() {
    console.log('listening on *:3000');
});
