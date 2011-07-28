var rendererOptions = {
  draggable: true
  };
var directionsDisplayArray = []
var directionsDisplay = new google.maps.DirectionsRenderer(rendererOptions);;
var directionsService = new google.maps.DirectionsService();
var map;
var total;

var australia = new google.maps.LatLng(-25.274398, 133.775136);
var elevator;
var chart;
var netLoss = 0, netGain = 0;

$(function() {
  var myOptions = {
    zoom: 7,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    center: australia
  };
  map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
  // Create an ElevationService
  elevator = new google.maps.ElevationService();

  directionsDisplay.setMap(map);
  directionsDisplay.setPanel(document.getElementById("directionsPanel"));

  google.maps.event.addListener(directionsDisplay, 'directions_changed', function() {
    computeTotalDistance(directionsDisplay.directions);
    test();
  });
  $("#mode").val(day.travel_mode);
  calcRoute();
  $(".adp-summary").live("click", function() {
    $(this).next().find(".adp-directions").toggle();
  })
});

function calcRoute() {
  var selectedMode = document.getElementById("mode").value;

  var request = {
    origin: prev_day ? prev_day.stop_location : trip.start_location,
    destination: (day.stop_location != null) ? day.stop_location : trip.finish_location,
    //waypoints: ary,
    travelMode: google.maps.TravelMode[selectedMode],
    unitSystem: google.maps.UnitSystem.IMPERIAL
  };
  directionsService.route(request, function(response, status) {
    if (status == google.maps.DirectionsStatus.OK) {
      directionsDisplay.setDirections(response);
    }
  });
  $("#day_travel_mode").val(selectedMode);
}
function getLatLng(w) {
  return new google.maps.LatLng(w.coords[0], w.coords[1]);
}
function getAddress(w) {
  return [w.address, w.city, w.state].join(", ");
}
function computeTotalDistance(result) {
  total = 0;
  var myroute = result.routes[0];
  for (i = 0; i < myroute.legs.length; i++) {
    total += myroute.legs[i].distance.value;
  }
  total = Math.floor( (total / 100)*0.621371192) / 10;
  document.getElementById("total").innerHTML = total + " mi";
  $("#day_distance").val(total);
}
function test() {
  var op = directionsDisplay.directions.routes[0].overview_path;
  var path = [];
  $(op).each( function(i, a) {path.push([a.lat(), a.lng()])});
  drawPath(op); 

  var encodeString = google.maps.geometry.encoding.encodePath(op);
  $("#day_encoded_path").val(encodeString);
  
  op = directionsDisplay.directions.routes[0].legs[0].via_waypoints
  path = [];
  $(op).each( function(i, a) {path.push([a.lat(), a.lng()])});
  $("#day_google_waypoints").val(JSON.stringify(path))
}
function drawPath(path) {

  // Create a new chart in the elevation_chart DIV.
  chart = new google.visualization.ScatterChart(document.getElementById('elevation_chart'));

  // Create a PathElevationRequest object using this array.
  // Ask for 256 samples along that path.
  var pathRequest = {
    'path': path,
    'samples': 256
  }

  // Initiate the path request.
  elevator.getElevationAlongPath(pathRequest, plotElevation);
}

// Takes an array of ElevationResult objects, draws the path on the map
// and plots the elevation profile on a Visualization API ColumnChart.
function plotElevation(results, status) {
  if (status == google.maps.ElevationStatus.OK) {
    elevations = results;

    // Extract the elevation samples from the returned results
    // and store them in an array of LatLngs.
    var elevationPath = [];
    for (var i = 0; i < results.length; i++) {
      elevationPath.push(elevations[i].location);
    }

    // Display a polyline of the elevation path.
    var pathOptions = {
      path: elevationPath,
      strokeColor: '#0000CC',
      opacity: 0.4,
      map: map
    }
    polyline = new google.maps.Polyline(pathOptions);

    // Extract the data from which to populate the chart.
    // Because the samples are equidistant, the 'Sample'
    // column here does double duty as distance along the
    // X axis.
    var data = new google.visualization.DataTable();
    data.addColumn('number', 'Sample');
    data.addColumn('number', 'Elevation');
    var distance = 0;
    for (var i = 1; i < results.length-1; i++) {
      var ele0 = (elevations[i-1].elevation + elevations[i].elevation)/2;
      var ele1 = (elevations[i].elevation + elevations[i+1].elevation)/2;
      if( ele0 < ele1) {
        netLoss += (ele1-ele0); 
      } else {
        netGain += (ele0-ele1);
      }
      var y = haversine(results[i].location, results[i-1].location);
      distance +=y;
      data.addRow([distance, ele0]);//elevations[i].elevation]);
    }

    // Draw the chart using the data within its DIV.
    document.getElementById('elevation_chart').style.display = 'block';
    chart.draw(data, {
      width: 640,
      height: 200,
      legend: 'none',
      titleY: 'Elevation (m)',
      titleX: 'Distance (km)'
    });
  }
}

function haversine(pt1, pt2) {
  var lat1 = pt1.lat();
  var lon1 = pt1.lng();
  var lat2 = pt2.lat();
  var lon2 = pt2.lng();

  var R = 6371; // km
  var dLat = (lat2-lat1).toRad();
  var dLon = (lon2-lon1).toRad();
  var lat1 = lat1.toRad();
  var lat2 = lat2.toRad();

  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
  Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; 
  return d;
}
/** Converts numeric degrees to radians */
if (typeof(Number.prototype.toRad) === "undefined") {
  Number.prototype.toRad = function() {
  return this * Math.PI / 180;
  }
}

/** Converts radians to numeric (signed) degrees */
if (typeof(Number.prototype.toDeg) === "undefined") {
  Number.prototype.toDeg = function() {
  return this * 180 / Math.PI;
  }
}
