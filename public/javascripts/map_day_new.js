var rendererOptions = {
  draggable: true
  };
var directionsDisplay;
var directionsService = new google.maps.DirectionsService();
var map;
var total;

var elevator, chart, geocoder;
var netLoss = 0, netGain = 0;

$(function() {
  // Initalize geocoder, elevator, chart
  geocoder = new google.maps.Geocoder();
  elevator = new google.maps.ElevationService();
  chart = new google.visualization.ScatterChart(document.getElementById('elevation_chart'));
  directionsDisplay = new google.maps.DirectionsRenderer(rendererOptions);;
  var latlng = new google.maps.LatLng(-34.397, 150.644);

  var myOptions = {
    zoom: 8,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    center: latlng
  };
  map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
  codeAddress();

  directionsDisplay.setPanel(document.getElementById("directionsPanel"));
  directionsDisplay.setMap(map);

  google.maps.event.addListener(directionsDisplay, 'directions_changed', function() {
    computeTotalDistance(directionsDisplay.directions);
    test(directionsDisplay.directions);
  });
  google.maps.event.addListener(map, 'click', calcRoute);
  $("#mode").val(day.travel_mode);
  $(".adp-summary").live("click", function() {
    $(this).next().find(".adp-directions").toggle();
  })
});

function calcRoute(event) {
  var selectedMode = document.getElementById("mode").value;

  var request = {
    origin: prev_day ? prev_day.stop_location : trip.start_location,
    destination: event.latLng, //(day.stop_location != null) ? day.stop_location : trip.finish_location,
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

function codeAddress() {
  var address = $(".start_location").text();
  geocoder.geocode( { 'address': address}, function(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
      map.setCenter(results[0].geometry.location);
      var marker = new google.maps.Marker({
          map: map,
          position: results[0].geometry.location
      });
    } else {
      alert("Geocode was not successful for the following reason: " + status);
    }
  });
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
function test(result) {
  var op = result.routes[0].overview_path;
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

  // Create a PathElevationRequest object using this array.
  // Ask for 256 samples along that path.
  var pathRequest = {
    'path': path,
    'samples': path.length*2
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
