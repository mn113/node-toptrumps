var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
// My modules:
var comms = require('./comms.js');
var game = require('./game.js');

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


// Socket.io:
io.on('connection', function(socket){

    console.log("new connection:", socket.handshake.sessionID);
    // Log connections made:
    //console.log(socket.handshake);
    // Perform duplicate check:
    game.players.forEach(player => {
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
        console.log('a user connected: ' + socket.player.name + " aka session " + socket.player.sessid);
        // Register player:
        game.players.push(socket.player);
        comms.updatePlayerList();

        // Start game loop if not yet running:
        if (typeof game.loop === "undefined") {
            game.theDeck.shuffle();
            game.theDeck.dealCards(game.players, 25);
            game.loop = new game.Gameloop();
            game.loop.run();
        }
    });

    // Connection dropped:
    socket.on('disconnect', function(socket){
        console.log('user disconnected');
        // Splice him out of players array:
        game.players.splice(game.players.indexOf(socket.player), 1);
        comms.updatePlayerList();
    });

    // Player chose his category:
    socket.on('categoryPicked', function(cat) {
        console.log('category:', cat);
        game.loop.category = cat;
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
