var socket = io();


function renderCountry(cdata) {
    var $card = $(".card");
    $card.find('h3').html(cdata.name);
    $card.find('button[name="population.number"] span').html(formatNumber(cdata.population.number));
    $card.find('button[name="population.density"] span').html(formatNumber(cdata.population.density, 'density'));
    $card.find('button[name="capital.lat"] span').html(formatNumber(cdata.capital.lat, 'degrees') + cdata.capital.latsign);
    $card.find('button[name="capital.long"] span').html(formatNumber(cdata.capital.long, 'degrees') + cdata.capital.longsign);
    $card.find('button[name="area.total"] span').html(formatNumber(cdata.area.total, 'area'));
    $card.find('button[name="area.land"] span').html(formatNumber(cdata.area.land, 'area'));
    $card.find('button[name="area.water"] span').html(formatNumber(cdata.area.water, 'area'));
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

function formatNumber(number, type) {
    switch (type) {
        case 'distance':
            return number.toFixed(0) + 'km';
        case 'height':
            return number.toFixed(0) + 'm';
        case 'area':
            return number.toFixed(0) + 'km&sup2;';
        case 'percent':
            return number.toFixed(1) + '%';
        case 'money':
            return '$' + number.toFixed(0) + '%';   // comma-ize?
        case 'age':
            return number.toFixed(1) + ' years';
        case 'density':
            return number.toFixed(1) + '/km&sup2;';
        case 'degrees':
            return number.toFixed(2) + 'º';
        default:
            return number.toFixed(0);
    }
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
