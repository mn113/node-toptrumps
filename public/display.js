var socket = io();


function renderCountry(data) {
    var cdata = JSON.parse(data);
    var $card = $(".card");
    $card.find('h3').html(cdata.name);
    $card.find('button[name="population.number"]').html(cdata.population.number);
    $card.find('button[name="density"]').html(cdata.density);
}

function beginYourTurn() {
    // Enable buttons
    $(".card button").prop( "disabled", false );
}

function endYourTurn() {
    // Disable buttons
    $(".card button").prop( "disabled", true );
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
});
