var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));

app.get('/', function(request, response) {
    response.sendFile('display.html', {root: __dirname + '/public/'});
});

// Socket.io:
io.on('connection', function(socket){

    // Log connections made/dropped:
    console.log('a user connected');
    socket.on('disconnect', function(){
        console.log('user disconnected');
    });
    // Listen to clients:
    socket.on('categoryPicked', function(cat){
        console.log('category:', cat);
        // Talk back:
        io.emit('player1turn', { for: 'everyone' });
    });
});

http.listen(5000, function() {
    console.log('listening on *:3000');
});

//app.listen(app.get('port'), function() {
//  console.log("Node app is running at localhost:" + app.get('port'));
//});
