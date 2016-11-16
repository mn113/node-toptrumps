/*global io */

var display = (function() {

    function modalNamePrompt() {
        $("#modal").load('name_prompt.html', function() {
            // Once the modal html is loaded, set up its behaviours:
            $('#namePrompt').modal('show');

            // Q&D field validation:
            $("#modal").on('keyup', '.modal-body input', function() {
                //console.log(this.value);
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
        setFlag(cdata.code);
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
        $card.find('button[name="borders.number"] span').html(cdata.borders.number);
        $card.find('button[name="transport.road"] span').html(formatNumber(cdata.transport.road, 'distance'));
        $card.find('button[name="transport.rail"] span').html(formatNumber(cdata.transport.rail, 'distance'));
        $card.find('button[name="transport.water"] span').html(formatNumber(cdata.transport.water, 'distance'));
        $card.find('button[name="gdp.net"] span').html(formatNumber(cdata.gdp.net, 'money'));
        $card.find('button[name="gdp.percapita"] span').html(formatNumber(cdata.gdp.percapita, 'money'));
        $card.find('button[name="population.number"] span').html(formatNumber(cdata.population.number));
        $card.find('button[name="population.density"] span').html(formatNumber(cdata.population.density, 'density'));
        $card.find('button[name="population.lgurban"] span').html(formatNumber(cdata.population.lgurban));
        $card.find('button[name="population.lifexp"] span').html(formatNumber(cdata.population.lifexp, 'age'));
        $card.find('button[name="population.medage"] span').html(formatNumber(cdata.population.medage, 'age'));
        $card.find('button[name="population.youngest"] span').html(formatNumber(cdata.population.youngest, 'percent'));
        $card.find('button[name="population.oldest"] span').html(formatNumber(cdata.population.oldest, 'percent'));
    }

    function formatNumber(number, type) {
        if (number === null) {
            return "unknown";
        }
        // Perform formatting based on requested type:
        var nf = new Intl.NumberFormat({ maximumFractionDigits: 0 });   // round it off
        switch (type) {
            case 'distance':
                return nf.format(number) + 'm';
            case 'height':
                return nf.format(number) + 'm';
            case 'area':
                return nf.format(number) + 'km&sup2;';
            case 'density':
                return nf.format(number) + '/km&sup2;';
            case 'age':
                nf = new Intl.NumberFormat({ minimumFractionDigits: 1, maximumFractionDigits: 1 });    // .1
                return nf.format(number) + ' years';
            case 'degrees':
                nf = new Intl.NumberFormat({ maximumFractionDigits: 1 });    // .1
                return nf.format(number) + 'º ';
            case 'percent':
                nf = new Intl.NumberFormat({ style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 });    // .1
                return nf.format(number) + '%';
            case 'money':
                nf = new Intl.NumberFormat({ style: 'currency', currency: '$', maximumFractionDigits: 0 });
                return nf.format(number);
            default:
                return nf.format(number);
        }
    }

    function renderPlayers(playerList) {
        //console.log("Re-rendering playerList");
        var $list1 = $("#player-list .playing"),
            $list2 = $("#player-list .waiting");
        // Clear out:
        $list1.html("");
        $list2.html("");
        playerList.active.forEach(player => {
            // Build new <li>:
            var li = $("<li>").attr("id", player.id);
            $("<strong>").html(player.name).appendTo(li);
            $("<span>").addClass("win-tot").html(player.wins + '&nbsp;wins').appendTo(li);
            $("<span>").addClass("card-tot").html(player.cards.length + '&nbsp;cards').appendTo(li);
            li.appendTo($list1);
        });
        playerList.waiting.forEach(player => {
            // Build new <li>:
            var li = $("<li>").attr("id", player.id);
            $("<strong>").html(player.name).appendTo(li);
            li.appendTo($list2);
        });
    }

    function beginYourTurn() {
        // Enable buttons
        $(".card button").prop( "disabled", false );
        // Message and timer:
        $("#msg").show();
        var seconds = 5;
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
        $("#msg").hide();
        $(".card button").prop( "disabled", true );
    }

    function renderOutput(data) {
        var $box = $("#output-box");

        if (data === "<hr>") {
            // Horizontal rule:
            $("<hr>").addClass("dashed-line").appendTo($box);
        }
        else {
            // Build new line:
            var span = $("<span>").html(data);
            span.appendTo($box);
        }
        // Auto-scrolldown:
        $box.scrollTop($box[0].scrollHeight);
    }

    function setFlag(code) {
        // Convert NA code to ISO code:
        var imgSrc;
        try {
            imgSrc = "/flag_icons/gif/" + window.codesTable[code] + ".gif";
        }
        catch (e) {
            imgSrc = "/flag_icons/noflag.gif";
        }

        // Insert into flag holder element:
        $(".card .flag").html('<img src="'+ imgSrc +'">');
    }

    function flipCard() {
        document.querySelector(".flip-container").classList.toggle("flipped");
        console.log("flipped");
    }

    // Expose publicly:
    return {
        modalNamePrompt: modalNamePrompt,
        renderCountry: renderCountry,
        formatNumber: formatNumber,
        renderPlayers: renderPlayers,
        beginYourTurn: beginYourTurn,
        endYourTurn: endYourTurn,
        renderOutput: renderOutput,
        flipCard: flipCard
    };
}());


// jQuery ready:
$(function() {
    // Event listeners:
    $('.card button').on('click', function(evt) {
        evt.preventDefault();
        var category = evt.currentTarget;

        // Find the button itself (not the span):
/*        if (evt.target === 'span') {
            category = evt.target.parent.name;
        }
        else {
            category = evt.target.name;
        }*/
        console.log(category);   // ok

        // Send decision to socket.io server:
        socket.emit('categoryPicked', category);
    });

    // Load country codes lookup table from CSV file:
    $.ajax({
        type: "GET",
        url: "country-codes-lookup.csv",
        dataType: "text",
        success: function(data) {
            // Convert CSV data to JS object:
            var allTextLines = data.split(/\r/);   //?
            console.info(allTextLines.length + " codes found.");
            window.codesTable = {};

            for (var i = 0; i < allTextLines.length; i++) {
                var codes = allTextLines[i].split(',');
                if (codes.length === 2) {
                    window.codesTable[codes[0]] = codes[1];
                }
            }
            console.info("Table generated:", window.codesTable);
        }
    });

    // f flips card manually:
    $('document').on('keyup', function(evt) {
        if (evt.keyCode === 70) display.flipCard();
    });

});


// Handle events from socket.io server:
var socket = io();

//setInterval(function() {
//    document.title = socket.id;
//}, 5000);

socket.on('namePrompt', function() {
    console.log("received namePrompt");
    display.modalNamePrompt();
});

/*socket.on('gameStart', function() {
    console.log("received gameStart");
    // Clear previous games:
    $("#output-box").html("");
});*/

socket.on('categoryPrompt', function() {
    console.log("received categoryPrompt");
    display.beginYourTurn();
});

socket.on('playerList', function(data) {
    //console.log('playerList', data);
    var playerList = JSON.parse(data);
    display.renderPlayers(playerList);
});

socket.on('yourCard', function(data) {
    //console.log('yourCard', data);
    var country = JSON.parse(data);
    display.renderCountry(country);
    display.flipCard();
});

socket.on('output', function(data) {
    //console.log('output', data);
    display.renderOutput(data);
});
