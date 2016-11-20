var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
// My modules:
var game = require('./game.js');    // == object {Card, Deck, Player, Utility, Gameloop}



module.exports = {
    comms: comms
};
