// begin

const fs = require('fs');
const path = require('path');

var baseDir = 'factbook_all/';

function getStats(country) {
    // open file
    var countryJSON = JSON.parse(fs.readFileSync(baseDir + country +'.json', 'utf8'));

    // Extract individual data pieces and store in my own structured object:
    var c = {};
    c.name = assignOrNull(countryJSON, "Government", "Country name", "conventional short form");
    // Account for name aberrations:
    if (!c.name) c.name = assignOrNull(countryJSON, "Government", "Country name", "Dutch short form");
    c.capital = {};
    c.capital.string = assignOrNull(countryJSON, "Government", "Capital", "geographic coordinates");
    // Extract the lat and long values from coordinate string:
    c.capital.lat = c.capital.string ? Math.abs(c.capital.string.split(" ")[0] + c.capital.string.split(" ")[1]/60) : null;
    c.capital.long = c.capital.string ? Math.abs(c.capital.string.split(" ")[3] + c.capital.string.split(" ")[4]/60) : null;
    c.area = {};
    c.area.total = assignOrNull(countryJSON, "Geography", "Area", "total");
    c.area.land = assignOrNull(countryJSON, "Geography", "Area", "land");
    c.area.water = assignOrNull(countryJSON, "Geography", "Area", "water");
    c.elevation = {};
    c.elevation.mean = assignOrNull(countryJSON, "Geography", "Elevation", "mean elevation");
    c.elevation.lowest = assignOrNull(countryJSON, "Geography", "Elevation", "elevation extremes");
    c.borders = {};
    c.borders.land = assignOrNull(countryJSON, "Geography", "Land boundaries", "total");
    c.borders.coast =  assignOrNull(countryJSON, "Geography", "Coastline");
    c.borders.number = assignOrNull(countryJSON, "Geography", "Land boundaries", "border countries");
    // Split and count the comma-separated list of neighbours, or use zero:
    c.borders.number = c.borders.number ? c.borders.number.split(',').length : 0;
    c.transport = {};
    c.transport.road = assignOrNull(countryJSON, "Transportation", "Roadways", "total");
    c.transport.rail = assignOrNull(countryJSON, "Transportation", "Railways", "total");
    c.transport.water = assignOrNull(countryJSON, "Transportation", "Waterways");
    c.gdp = {};
    c.gdp.net = assignOrNull(countryJSON, "Economy", "GDP (official exchange rate)");
    c.gdp.percapita = assignOrNull(countryJSON, "Economy", "GDP - per capita (PPP)");
    c.population = {};
    c.population.number = assignOrNull(countryJSON, "People and Society", "Population");
    c.population.lgurban = assignOrNull(countryJSON, "People and Society", "Major urban areas - population");
    c.population.youngest = assignOrNull(countryJSON, "People and Society", "Age structure", "0-14 years");
    c.population.oldest = assignOrNull(countryJSON, "People and Society", "Age structure", "65 years and over");
    c.population.medage = assignOrNull(countryJSON, "People and Society", "Median age", "total");
    c.population.births = assignOrNull(countryJSON, "People and Society", "Birth rate");
    c.population.lifexp = assignOrNull(countryJSON, "People and Society", "Life expectancy at birth", "total population");
    // Calculate density manually:
    c.population.density = c.population.number / c.area.total;

    return c;
}


// Build main data object:
var countryIndex = {};
fs.readdir(baseDir, (err, files) => {
    files.forEach(file => {
        var c = path.parse(file).name;
//        console.log("Loading", c);
        countryIndex[c] = getStats(c);
    });
    console.log(Object.keys(countryIndex).length + " countries loaded.");
});

setTimeout(function() {
//    console.log(countryIndex.cc);
//    testAllData();
}, 2000);


// Test for and assign a 2- or 3-deep nested JSON property... or null:
function assignOrNull(root, key1, key2, key3) {
    try {
        // Key1 should always exist. Key2 may or may not.
        if (root[key1] && root[key1][key2]) {
            // Key3 is optional
            if (key3) {
                if (root[key1][key2][key3]) {
                    if (root[key1][key2][key3].text && typeof root[key1][key2][key3].text !== "undefined") {
                        return root[key1][key2][key3].text;
                    }
                }
            }
            // Just 2 keys:
            else {
                if (root[key1][key2].text && typeof root[key1][key2].text !== "undefined") {
                    return root[key1][key2].text;
                }
            }
        }
        return null;
    }
    catch (e) {
        return null;
    }
}


// Test imported data:
function testAllData() {
    var errors = {
        "name": 0,
        "caplat": 0,
        "borders": 0,
        "roads": 0,
        "popnum": 0
    };
    for (var key in countryIndex) {
        console.log(key);
        if (countryIndex.hasOwnProperty(key)) {
            try {
                var cdata = countryIndex[key];
                if (cdata.name === null) {
                	errors.name++;
                	console.log("NO NAME", key, cdata);
                }
                if (cdata.capital.lat === null) {
                	errors.caplat++;
                	console.log("NO CAPLAT", key, cdata);
                }
                if (cdata.borders.number === null) {
                	errors.borders++;
                	console.log("NO BORDERS", key, cdata);
                }
                if (cdata.transport.road === null) {
                	errors.roads++;
                	console.log("NO ROADS", key, cdata);
                }
                if (cdata.population.number === null) {
                	errors.popnum++;
                	console.log("NO POP", key, cdata);
                }
            } catch (e) {
                console.log(e);
            }
        }
    }
    console.log("Errors:", errors);
}


// Parse complex numerical values out of a text string:
function parseNumber(text, prefix = '', suffix = '') {
    // Find numerical sequence using regex:
    var re = new RegExp("(?:" + prefix + ")" + "[\\s]*([0-9\\.,])+[\\s]*" + "(?:" + suffix + ")");
//    console.log(re);
    var foundNum = re.exec(text)[0];
//    console.log("Found:", foundNum);
    // Strip commas & parseFloat it:
    return parseFloat(foundNum.replace(',', ''));
}
console.log("Area:", parseNumber("29,743 sq km", "", "sq km"));
console.log("Low:", parseNumber("lowest point: Debed River 400 m", "", "m"));
console.log("High:", parseNumber("highest point: Aragats Lerrnagagat' 4,090 m", "", "m"));
console.log("Pop:", parseNumber("3,051,250 (July 2016 est.)"));
console.log("Births:", parseNumber("13.3 births/1,000 population (2016 est.)"));
console.log("Percent:", parseNumber("13.3%", "", "%"));
console.log("Largest Urban:", parseNumber("THE VALLEY (capital) 1,000 (2014)", "", ""));
