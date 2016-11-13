/*global io */

function modalNamePrompt() {
    $("#modal").load('name_prompt.html', function() {
        // Once the modal html is loaded, set up its behaviours:
        $('#namePrompt').modal('show');

        // Q&D field validation:
        $("#modal").on('change', '.modal-body input', function() {
            console.log(this);
            if (this.value.length > 0) {
                $("#namePrompt .modal-footer button").prop("disabled", false);
            }
            else {
                $("#namePrompt .modal-footer button").prop("disabled", true);
            }
        });

        // Submit button:
        $("#modal").on('click', '.modal-footer button', function() {
            var name = $("#namePrompt .modal-body input").val();
            // Sanitize name before submit:
            // TODO!
            socket.emit('myNameIs', name);
            // Close modal:
            $('#namePrompt').modal('hide');
        });
    });
}

function renderCountry(cdata) {
    var $card = $(".card");
    $card.find('h3').html(cdata.name);
    $card.find('h4:first-of-type span').html(cdata.capital.name);
    $card.find('button[name="capital.lat"] span').html(formatNumber(cdata.capital.lat, 'degrees') + cdata.capital.latsign);
    $card.find('button[name="capital.long"] span').html(formatNumber(cdata.capital.long, 'degrees') + cdata.capital.longsign);
    $card.find('button[name="area.total"] span').html(formatNumber(cdata.area.total, 'area'));
    $card.find('button[name="area.land"] span').html(formatNumber(cdata.area.land, 'area'));
    $card.find('button[name="area.water"] span').html(formatNumber(cdata.area.water, 'area'));
    $card.find('button[name="elevation.highest"] span').html(formatNumber(cdata.elevation.highest, 'height'));
    $card.find('button[name="elevation.lowest"] span').html(formatNumber(cdata.elevation.lowest, 'height'));
    $card.find('button[name="elevation.mean"] span').html(formatNumber(cdata.elevation.mean, 'height'));
    $card.find('button[name="borders.land"] span').html(formatNumber(cdata.borders.land, 'distance'));
    $card.find('button[name="borders.coast"] span').html(formatNumber(cdata.borders.coast, 'distance'));
    $card.find('button[name="borders.number"] span').html(cdata.borders.number +'('+ cdata.borders.list +')');
    $card.find('button[name="transport.road"] span').html(formatNumber(cdata.transport.road, 'distance'));
    $card.find('button[name="transport.rail"] span').html(formatNumber(cdata.transport.rail, 'distance'));
    $card.find('button[name="transport.water"] span').html(formatNumber(cdata.transport.water, 'distance'));
    $card.find('button[name="gdp.net"] span').html(formatNumber(cdata.gdp.net, 'money'));
    $card.find('button[name="gdp.percapita"] span').html(formatNumber(cdata.gdp.percapita, 'money'));
    $card.find('button[name="population.number"] span').html(formatNumber(cdata.population.number));
    $card.find('button[name="population.density"] span').html(formatNumber(cdata.population.density, 'density'));
    $card.find('button[name="population.lgurban"] span').html(formatNumber(cdata.population.lgurban));
    $card.find('button[name="population.lifexp"] span').html(formatNumber(cdata.population.lifexp, 'age'));
    $card.find('button[name="population.youngest"] span').html(formatNumber(cdata.population.youngest, 'age'));
    $card.find('button[name="population.oldest"] span').html(formatNumber(cdata.population.oldest, 'age'));
    $card.find('button[name="population.medage"] span').html(formatNumber(cdata.population.medage, 'age'));
}

function formatNumber(number, type) {
    if (number === null) {
        return "unknown";
    }
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

function renderPlayers(playerList) {
    var $list = $("#playerList");
    // Clear out:
    $list.html();
    playerList.forEach(player => {
        // Build new <li>:
        var li = $("<li>").attr("id", player.id);
        $("<strong>").html(player.name).appendTo(li);
        $("<span>").html(player.cards.length + ' cards').appendTo(li);
        $("<span>").html(player.wins + ' wins').appendTo(li);
        li.appendTo($list);
    });
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
}


// jQuery ready:
$(function() {
    // Event listeners:
    $('.card button').on('click', function(evt) {
        console.log(evt.target.name);   // ok
        // Send decision to socket.io server:
        socket.emit('categoryPicked', evt.target.name);
        return false;
    });
});


// Handle events from socket.io server:
var socket = io();

socket.on('namePrompt', function() {
    modalNamePrompt();
});

socket.on('categoryPrompt', function() {
    beginYourTurn();
});

socket.on('playerList', function(data) {
    console.log(data);
    var playerList = JSON.parse(data);
    renderPlayers(playerList);
});

socket.on('yourCard', function(data) {
    console.log(data);
    var cdata = JSON.parse(data);
    renderCountry(cdata);
});
