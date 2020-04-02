var fs = require('fs'),
    cheerio = require('cheerio'),
    request = require('sync-request');

const util = require('util');

var start = new Date();

var routeList = 'https://www.sctpiasi.ro/trasee/';
var apiURL = 'https://m-go-iasi.wink.ro/apiPublic/';

var data = {
    "agency": [
        "agency_id,agency_name,agency_url,agency_timezone,agency_lang,agency_phone,agency_fare_url,agency_email",
        "1,CTP Iaşi,https://www.sctpiasi.ro/,Europe/Bucharest,ro,0232267772,https://www.sctpiasi.ro/tarife/tarife-bilete-calatorie,exploatare@sctpiasi.ro"
    ],
    "stops": [
        "stop_id,stop_name,stop_desc,stop_lat,stop_lon"
    ],
    "routes": [
        "route_id,agency_id,route_short_name,route_type,route_color,route_text_color,route_long_name"
    ],
    "trips": [
        "route_id,service_id,trip_id,trip_headsign,direction_id,shape_id"
    ],
    "stop_times": [
        "trip_id,arrival_time,departure_time,stop_id,stop_sequence"
    ],
    "frequencies":[
    	"trip_id,start_time,end_time,headway_secs"
    ],
    "shapes": [
        "shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence"
    ],
    "calendar": [
        "service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date",
        "LV,1,1,1,1,1,0,0,20200301,20201230",
        "SD,0,0,0,0,0,1,1,20200301,20201230"
    ],
    "calendar_dates": [
        "service_id,date,exception_type"
    ]
};

function stopInList(id) {
    for (var i = 0; i < data.stops.length; i++) {
        if (data.stops[i].split(',')[0] == id) return true;
    }
    return false;
}

gdata = request('GET', routeList);
$ = cheerio.load(gdata.getBody('utf8'));

var localStopMatch={};

function processRoute(id){
	console.log('Processing route '+id);
	var ldata = request('GET', apiURL+"route/byId/"+id);
	ldata = JSON.parse(ldata.getBody('utf8'));
	if(!ldata.type) return false;
	if(ldata.data.routeWayLength){
		if(!localStopMatch[id]) localStopMatch[id] = [];
		localStopMatch[id][0] = ldata.data.routeWaypoints;
		for (var i = 0; i < ldata.data.routeWaypoints.length; i++) {
			if(ldata.data.routeWaypoints[i].stationID&&!stopInList(ldata.data.routeWaypoints[i].stationID))
				data.stops.push(ldata.data.routeWaypoints[i].stationID+","+ldata.data.routeWaypoints[i].name+",,"+ldata.data.routeWaypoints[i].lat+","+ldata.data.routeWaypoints[i].lng);
		}
		for (var i = 0; i < ldata.data.routeWayCoordinates.length; i++) {
			data.shapes.push(id+".0,"+ldata.data.routeWayCoordinates[i].lat+","+ldata.data.routeWayCoordinates[i].lng+","+i);
		}
	}
	if(ldata.data.routeRoundWayLength){
		if(!localStopMatch[id]) localStopMatch[id] = [];
		localStopMatch[id][1] = ldata.data.routeRoundWaypoints;
		for (var i = 0; i < ldata.data.routeRoundWaypoints.length; i++) {
			if(ldata.data.routeRoundWaypoints[i].stationID&&!stopInList(ldata.data.routeRoundWaypoints[i].stationID))
				data.stops.push(ldata.data.routeRoundWaypoints[i].stationID+","+ldata.data.routeRoundWaypoints[i].name+",,"+ldata.data.routeRoundWaypoints[i].lat+","+ldata.data.routeRoundWaypoints[i].lng);
		}
		for (var i = 0; i < ldata.data.routeRoundWayCoordinates.length; i++) {
			data.shapes.push(id+".1,"+ldata.data.routeRoundWayCoordinates[i].lat+","+ldata.data.routeRoundWayCoordinates[i].lng+","+i);
		}
	}
}

$('.tramvaie').find('ul').find('li').each(function(){
	data.routes.push($(this).find('a').attr('href').split('/')[2]+",1,"+$(this).find('.track_number').text()+",0,"+$(this).find('.track_number').attr('style').split('background:')[1].trim()+",#ffffff,"+$(this).find('.track_summary').text().trim());
})

$('.autobuze').find('ul').find('li').each(function(){
	data.routes.push($(this).find('a').attr('href').split('/')[2]+",1,"+$(this).find('.track_number').text()+",3,#a2238e,#ffffff,"+$(this).find('.track_summary').text().trim());
})

for (var i = 1; i < data.routes.length; i++) {
	processRoute(data.routes[i].split(',')[0]);
}

function msToHMS(ms) {
    var seconds = ms / 1000;
    var hours = parseInt(seconds / 3600);
    seconds = seconds % 3600;
    var minutes = parseInt(seconds / 60);
    seconds = seconds % 60;
    return (hours + ":" + minutes);
}

dirn = start.getTime();

if (!fs.existsSync("./output/" + dirn)) {
    console.log("Creating output subdirectory " + dirn);
    fs.mkdirSync("./output/" + dirn);
}

for (property in data) {
    fs.writeFileSync("./output/" + dirn + "/" + property + ".txt", data[property].join("\r\n"));
}

now = new Date();

console.log("Started at: " + start);
console.log("Ended at: " + now);
console.log("Duration: " + msToHMS(now - start));