var socket = io();


function renderCountry(cdata) {
    var $card = $(".card");
    $card.find('h3').html(cdata.name);
    $card.find('button[name="population.number"] span').html(cdata.population.number);
    $card.find('button[name="population.density"] span').html(cdata.population.density);
    $card.find('button[name="capital.lat"] span').html(cdata.capital.lat);
    $card.find('button[name="capital.long"] span').html(cdata.capital.long);
    $card.find('button[name="area.total"] span').html(cdata.area.total);
    $card.find('button[name="area.land"] span').html(cdata.area.land);
    $card.find('button[name="area.water"] span').html(cdata.area.water);
}

function beginYourTurn() {
    // Enable buttons
    $(".card button").prop( "disabled", false );
    // Message and timer:
    $(".msg").show();
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
    $(".msg").hide();
    $(".card button").prop( "disabled", true );
    // Default category:
    pickCategory('population.number');  // RANDOMISE
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
