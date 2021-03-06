var turf = require('@turf/turf')
var countries = require('./countries.json')
var codes = require('./codes.json')
var destinations = require('./destinations_data.json')

function iso3to2(iso3) {
    var code = codes.find(code => code['ISO3166-1-Alpha-3'] === iso3)
    return code ? code['ISO3166-1-Alpha-2'] : iso3
}

function iso3toId(iso3) {
    var destination = destinations.find(destination => destination.code === iso3to2(iso3))
    return destination ? destination.id : 0;
}

var lat = 0
var lon = 0
var step = 2.5
var halfStep = step / 2

var features = []

for (var lat = 80; lat > -80; lat -= step) {

    for (var lon = -180; lon < 180; lon += step) {

        var box = turf.polygon([[
            [lon - halfStep, lat + halfStep],
            [lon + halfStep, lat + halfStep],
            [lon + halfStep, lat - halfStep],
            [lon - halfStep, lat - halfStep],
            [lon - halfStep, lat + halfStep]
        ]])
        var circle = turf.circle(turf.point([lon, lat]), halfStep, 8, 'degrees')
        var circle = turf.point([lon, lat]);

        circle.properties.countries = []

        countries.features
            //.slice(0, 3)
            .filter(country => country.properties.name !== 'Antarctica')
            .forEach(country => {
            
            if (country.geometry.type === 'Polygon') {
                var intersection = turf.intersect(
                    box,
                    turf.polygon(country.geometry.coordinates)
                )
                if (intersection !== undefined) {
                    circle.properties.countries.push(iso3toId(country.id))
                }
            }
            if (country.geometry.type === 'MultiPolygon') {
                country.geometry.coordinates.forEach(polygon => {
                    var intersection = turf.intersect(
                        box,
                        turf.polygon(polygon)
                    )
                    if (intersection !== undefined) {
                        circle.properties.countries.push(iso3toId(country.id))
                    }
                })
            }
        })

        if (circle.properties.countries.length > 0) {
            features.push(circle)
        }

    }
}


console.log('<?php\n\nreturn [\n')

features.forEach(feature => {
    console.log(`    [
        'destination_ids' => [${feature.properties.countries}],
        'lat' => ${feature.geometry.coordinates[1]},
        'lon' => ${feature.geometry.coordinates[0]}
    ],`);
})

console.log('\n];\n')
