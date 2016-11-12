// begin

const fs = require('fs');
const path = require('path');

var baseDir = 'factbook.json-master/all/';

function getStats(country) {
    // open file
    var countryJSON = JSON.parse(fs.readFileSync(baseDir + country +'.json', 'utf8'));

    var c = {};
    c.name = assignOrNull(countryJSON, "Government", "Country name", "conventional short form");
    c.capital = {};
    c.capital.string = assignOrNull(countryJSON, "Government", "Capital", "geographic coordinates");
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
    c.borders.number = assignOrNull(countryJSON, "Geography", "Land boundaries", "border countries")
    if (c.borders.number) { c.borders.number = c.borders.number.split(',').length; }
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
    c.population.density = c.population.number / c.area.total;

    return c;
}
//console.log(getStats('lu'));

function parseNumber(text) {


}


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
    catch (err) {
        return null;
    }
}

// Build main data object:
var countryIndex = {};
fs.readdir(baseDir, (err, files) => {
    files.forEach(file => {
        var c = path.parse(file).name;
        console.log("Loading", c);
        countryIndex[c] = getStats(c);
    });
    console.log(Object.keys(countryIndex).length + " countries loaded.");
});

setTimeout(function() {
    console.log(countryIndex.cc);    
}, 3000);
