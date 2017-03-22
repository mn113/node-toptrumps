/*global io */

var display = (function() {

    function modalNamePrompt() {
        $("#modal").load('name_prompt.html', function() {
            // Once the modal html is loaded, set up its behaviours:
            $('#namePrompt').modal({
                backdrop: "static",
                keyboard: false,
                show: true
            });

            // Q&D field validation:
            $("#modal").on('keyup', '.modal-body input', function(evt) {
                // Name must have length:
                if (this.value.length > 0 && this.value !== 'Computer') {
                    // Enter submits if valid:
                    if (evt.which === 13) submitForm();
                    $("#namePrompt button").prop("disabled", false);
                }
                else {
                    $("#namePrompt button").prop("disabled", true);
                }

            });

            // Submit button:
            $("#modal").on('click', 'button', submitForm);
        });

        function submitForm() {
            var name = $("#namePrompt .modal-body input").val();
            // Sanitize name before submit:
            // TODO!
            socket.emit('myNameIs', name);
            // Close modal:
            $('#namePrompt').modal('hide');
        }
    }

    function renderCountry(cdata) {
        setFlag(cdata.code);
        setMap(cdata.code);
        var $card = $(".card");
        $card.find('h3').html(cdata.name);
        $card.find('h4:first-of-type span').html(cdata.capital.name);
        $card.find('a[name="capital.lat"] span').html(formatNumber(cdata.capital.lat, 'degrees') + cdata.capital.latsign);
        $card.find('a[name="capital.long"] span').html(formatNumber(cdata.capital.long, 'degrees') + cdata.capital.longsign);
        $card.find('a[name="area.total"] span').html(formatNumber(cdata.area.total, 'area'));
        $card.find('a[name="area.land"] span').html(formatNumber(cdata.area.land, 'area'));
        $card.find('a[name="area.water"] span').html(formatNumber(cdata.area.water, 'area'));
        $card.find('a[name="elevation.highest"] span').html(formatNumber(cdata.elevation.highest, 'height'));
        $card.find('a[name="elevation.lowest"] span').html(formatNumber(cdata.elevation.lowest, 'height'));
        $card.find('a[name="elevation.mean"] span').html(formatNumber(cdata.elevation.mean, 'height'));
        $card.find('a[name="borders.land"] span').html(formatNumber(cdata.borders.land, 'distance'));
        $card.find('a[name="borders.coast"] span').html(formatNumber(cdata.borders.coast, 'distance'));
        $card.find('a[name="borders.number"] span').html(cdata.borders.number);
        $card.find('a[name="transport.road"] span').html(formatNumber(cdata.transport.road, 'distance'));
        $card.find('a[name="transport.rail"] span').html(formatNumber(cdata.transport.rail, 'distance'));
        $card.find('a[name="transport.water"] span').html(formatNumber(cdata.transport.water, 'distance'));
        $card.find('a[name="gdp.net"] span').html(formatNumber(cdata.gdp.net, 'money'));
        $card.find('a[name="gdp.percapita"] span').html(formatNumber(cdata.gdp.percapita, 'money'));
        $card.find('a[name="population.number"] span').html(formatNumber(cdata.population.number));
        $card.find('a[name="population.density"] span').html(formatNumber(cdata.population.density, 'density'));
        $card.find('a[name="population.lgurban"] span').html(formatNumber(cdata.population.lgurban));
        $card.find('a[name="population.lifexp"] span').html(formatNumber(cdata.population.lifexp, 'age'));
        $card.find('a[name="population.medage"] span').html(formatNumber(cdata.population.medage, 'age'));
        $card.find('a[name="population.youngest"] span').html(formatNumber(cdata.population.youngest, 'percent'));
        $card.find('a[name="population.oldest"] span').html(formatNumber(cdata.population.oldest, 'percent'));
    }

    function formatNumber(number, type) {
        if (number === null) {
            return "unknown";
        }
        // Perform formatting based on requested type:
        var nf = new Intl.NumberFormat({ maximumFractionDigits: 0 });   // round it off     // NO Intl in SAFARI
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

    function renderPlayers(playerList, lastWinner) {
        var $table1 = $("#player-list-pane .playing"),
            $table2 = $("#player-list-pane .waiting");
        // Clear out:
        $table1.html("");
        $table2.html("");
        playerList.active.forEach(function(player) {
            // Build new <tr>:
            var tr = $("<tr>").attr("id", player.id);
            $("<td>").html(player.name).appendTo(tr);
            $("<td>").addClass("win-tot").html(player.wins + '&nbsp;wins').appendTo(tr);
            $("<td>").addClass("card-tot").html(player.cards.length + '&nbsp;cards').appendTo(tr);
            tr.appendTo($table1);
            // Style the lastWinner's name (if existing):
            if (lastWinner && player.name === lastWinner.name) { tr.addClass("leader"); }
        });
        var outPlayers = playerList.waiting.concat(playerList.paused);
        outPlayers.forEach(function(player) {
            // Build new <li>:
            var tr = $("<tr>").attr("id", player.id);
            $("<td>").html(player.name).appendTo(tr);
            tr.appendTo($table2);
        });
    }

    function beginYourTurn() {
        // Enable links:
        $(".card").addClass("your-turn");
        // Message and timer:
        $("#msg").show();
        $("#timer").show().removeClass("paused");
        var seconds = 8;
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
        // Hide message & disable links:
        $("#msg").hide();
        $("#timer").hide().addClass("paused");
        $(".card").removeClass("your-turn");
    }

    function smile(didWin) {
        var status = didWin ? 'win' : 'loss';
        // Insert a smiley face:
        var $face = $('<svg id="face"><use xlink:href="img/face.svg#'+ status +'"></use></svg>');
        $face.appendTo("body");
        // CSS animation runs automatically
        // Remove element when done:
        setTimeout(function() {
            $face.remove();
        }, 1000);
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
        var imgDir = "/img/flags_iso_64px/",
            imgSrc;
        try {
            imgSrc = imgDir + window.codesTable[code].toUpperCase() + ".png";
        }
        catch (e) {
            imgSrc = imgDir + "_unknown.png";
        }

        // Insert into flag holder element:
        $(".card .flag").html('<img src="'+ imgSrc +'">');
    }

    function setMap(code) {
        // Convert NA code to ISO code:
        var mapDir = "/img/mapsicon/all/",
            mapSrc;
        try {
            mapSrc = mapDir + window.codesTable[code] + "/96.png";
        }
        catch (e) {
            mapSrc = "";
        }

        // Insert into flag holder element:
        $(".card .map").html('<img src="'+ mapSrc +'">');
    }

    function flipCard(inOut) {
        var $cont = $(".flip-container");
        if (inOut === 'in') {
            // Flip it in:
            $cont.removeClass("pre-flip");
        }
        else if (inOut === 'out') {
            // Slide it out:
            $cont.addClass("post-flip");
            // Reset position offscreen:
            setTimeout(function() {
                $cont.addClass("pre-flip").removeClass("post-flip");
            }, 1000);
        }
        //console.log("flipped", inOut);
    }

    function modalInfo() {
        $("#modal").load('info.html', function() {
            // Once the modal html is loaded, set up its behaviours:
            $('#info').modal('show');
        });
    }

    // Expose publicly:
    return {
        modalNamePrompt: modalNamePrompt,
        renderCountry: renderCountry,
        formatNumber: formatNumber,
        renderPlayers: renderPlayers,
        beginYourTurn: beginYourTurn,
        endYourTurn: endYourTurn,
        smile: smile,
        renderOutput: renderOutput,
        flipCard: flipCard,
        modalInfo: modalInfo
    };
}());


// jQuery ready:
$(function() {
    // Card click event listener:
    $('.card-front a').on('click', function(evt) {
        evt.preventDefault();

        // Only act if currently in turn:
        if ($('.card').hasClass("your-turn")) {
            // Send decision to socket.io server:
            socket.emit('categoryPicked', evt.currentTarget.name);
            display.endYourTurn();
        }
    });

    // Leave button:
    $('#leave').on('click', function() {
        $('#join').show();
        $(this).hide();
        socket.emit('pause', true);
    });

    // join button:
    $('#join').on('click', function() {
        $('#leave').show();
        $(this).hide();
        socket.emit('pause', false);
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

    // Flips card manually:
    $(document).keydown(function(evt) {
        if (evt.keyCode === 70) display.flipCard('in');     // f
        if (evt.keyCode === 71) display.flipCard('out');    // g
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

socket.on('roundStart', function() {
    display.flipCard('in');
});

socket.on('roundEnd', function() {
    display.flipCard('out');
});

socket.on('categoryPrompt', function() {
    //console.log("received categoryPrompt");
    display.beginYourTurn();
});

socket.on('playerList', function(data, lastWinner) {
    var playerList = JSON.parse(data);
    //console.log(playerList);
    lastWinner = JSON.parse(lastWinner);
    display.renderPlayers(playerList, lastWinner);
});

socket.on('yourCard', function(data) {
    var country = JSON.parse(data);
    display.renderCountry(country);
});

socket.on('winLoss', function(didWin) {
    display.smile(didWin);
    // Make body edge flash:
    var flashClass = didWin ? "win" : "lose";
    $("body").addClass(flashClass);
    setTimeout(function() {
        $("body").removeClass(flashClass);
    }, 1000);
});

socket.on('gameOver', function(didWin) {
    if (!didWin) {
        window.alert("Game over! You lost all your cards.");
    }
});

socket.on('output', function(data) {
    display.renderOutput(data);
});

socket.on('playerStatus', function(status) {
    $("body").removeClass("active waiting paused").addClass(status);     // active, waiting, paused
});
