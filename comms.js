/* global game */

// Dependencies:
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var game = require('./game.js');

var comms = {};

// Server -> Client broadcasts
comms.namePrompt = function(socketid) {
    // Send prompt to this user only:
    io.to(socketid).emit('namePrompt', null);
};

comms.categoryPrompt = function(socketid) {
    // Send prompt to this user only:
    io.to(socketid).emit('categoryPrompt', null);
};

comms.announcePlayer = function(player, status) {
    //  Announce joins/leaves
    switch (status) {
        case 'in':
            io.emit('playerJoin', player.name + "joined the game.");
            break;
        case 'out':
            io.emit('playerLeave', player.name + "left the game.");
            break;
    }
};

comms.updatePlayerList = function() {
    //  Update player list
    io.emit('playerList', JSON.stringify(game.players));
};

comms.announceGameStage = function(type) {
    switch (type) {
        case 'roundStart':
            //  Announce each round start
            io.emit('roundStart', "Round " + game.loop.round + " starting...");
            break;
        case 'categorySet':
            //  Announce category choice
            io.emit('categorySet', game.loop.lastWinner.name + " chose category " + game.loop.category);
            break;
        case 'statCheck':
            //  Announce round card stats
            var stats = [];
            game.loop.roundCards.forEach(card => {
                // TODO! refactor...
                stats.push(card.name + ": " + game.loop.category + ": " + fetchFromObject(card, game.loop.category));
            });
            io.emit('statCheck', stats);
            break;
        case 'roundOver':
            //  Announce winner
            io.emit('roundOver', game.loop.lastWinner.name + " won that round and took " + game.loop.roundCards.length + " cards.");
            break;
    }
};

comms.sendCard = function(socketid) {
    //  Send out 1 card per player
    io.to(socketid).emit('yourCard', JSON.stringify(game.theDeck.getNextCard()));
};

module.exports = comms;
