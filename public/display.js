var socket = io();


function renderCountry(cdata) {
    var $card = $(".card");
    $card.find('h3').html(cdata.name);
    $card.find('button[name="population.number"]').html(cdata.population.number);
    $card.find('button[name="density"]').html(cdata.density);
}

function beginYourTurn() {
    // Enable buttons
    $(".card button").prop( "disabled", false );
    // Message and timer:
    $(".card > span").show();
    var seconds = 4;
    var countdown = setInterval(function() {
        seconds--;
        $("#countdown").html(seconds);
        // Out of time:
        if (seconds === 0) {
            clearInterval(countdown);
            endYourTurn();
        }
    }, 1000);
}

function endYourTurn() {
    // Hide message & disable buttons:
    $(".card > span").hide();
    $(".card button").prop( "disabled", true );
    // Default category:
    pickCategory('population.number');
}

function pickCategory(cat) {
    // Send decision to socket.io server:
    socket.emit('categoryPicked', cat);
}

// jQuery ready:
$(function() {

    // Event listeners:
    $('.card button').on('click', function(evt) {
        console.log(evt.target.name);   // ok
        pickCategory(evt.target.name);
        return false;
    });

    // Events from socket.io server:
    socket.on('yourCard', function(data) {
        console.log(data);
        var cdata = JSON.parse(data);
        renderCountry(cdata);
    });
});
