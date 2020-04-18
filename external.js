var OSRM = require('osrm');

var osrm = {
	"BUS": new OSRM('data/bus.osrm'),
	"TRAM": new OSRM('data/tram.osrm')
}

var argv = require('minimist')(process.argv.slice(2));

osrm[argv["_"][0]].route({
    coordinates: [
        [argv["_"][1], argv["_"][2]],
        [argv["_"][3], argv["_"][4]]
    ],
    geometries: 'geojson',
    overview: 'full'
}, function (err, result) {
	console.log(result.routes[0].duration);
});