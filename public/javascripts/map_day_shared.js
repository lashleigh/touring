function computeTotalDistance(result) {
  total = 0;
  var myroute = result.routes[0];
  for (i = 0; i < myroute.legs.length; i++) {
    total += myroute.legs[i].distance.value;
  }
  $("#day_distance").val(total); //Store in the database as meters

  if(unit_system == "IMPERIAL") {
    document.getElementById("total").innerHTML = total.toMiles() + " mi";
  } else { 
    document.getElementById("total").innerHTML = (total/1000) + " km";
  }
}
/** Convert kilomters to miles **/ 
if (typeof(Number.prototype.toMiles) === "undefined") {
  Number.prototype.toMiles = function() {
  return ((this / 1000) * 0.621371192).toFixed(1);
  }
}
/** Convert meters to feet **/ 
if (typeof(Number.prototype.toFeet) === "undefined") {
  Number.prototype.toFeet = function() {
  return (this *3.2808399);
  }
}
// Convert kilometer to miles
if (typeof(Number.prototype.km2mi) === "undefined") {
  Number.prototype.km2mi = function() {
  return (this *0.621371192);
  }
}

function save_waypoints(result) {
  $("#day_encoded_path").val(result.routes[0].overview_polyline.points);
  $("#day_stop_location").val(result.routes[0].legs[0].end_address);
  
  op = directionsDisplay.directions.routes[0].legs[0].via_waypoints
  path = [];
  $(op).each( function(i, a) {path.push([a.lat(), a.lng()])});
  $("#day_google_waypoints").val(JSON.stringify(path))
}
function drawPath(path) {
  // Create a PathElevationRequest object using the encoded overview_path
  var pathRequest = {
    'path': path,
    'samples': Math.min(path.length*2, 512)
  }
  // Initiate the path request.
  elevator.getElevationAlongPath(pathRequest, plotElevation);
}

// Takes an array of ElevationResult objects, draws the path on the map
// and plots the elevation profile on a Visualization API ColumnChart.
function plotElevation(results, status) {
  if (status == google.maps.ElevationStatus.OK) {
    elevations = results;
    var is_metric = (unit_system == "METRIC");

    var data = new google.visualization.DataTable();
    data.addColumn('number', 'Sample');
    data.addColumn('number', 'Elevation');
    var distance = 0;
    // TODO The code redundancy here is irritating
    if(is_metric) {
      var delta = (total/1000) / results.length
      for (var i = 1; i < results.length-1; i++) {
        var ele0 = (elevations[i-1].elevation + elevations[i].elevation)/2;
        var ele1 = (elevations[i].elevation + elevations[i+1].elevation)/2;
        if( ele0 < ele1) {
          netLoss += (ele1-ele0); 
        } else {
          netGain += (ele0-ele1);
        }
        distance +=delta;

        data.addRow([distance, ele0]);
      }
    } else {
      var delta = (total/1000).km2mi() / results.length
      for (var i = 1; i < results.length-1; i++) {
        var ele0 = (elevations[i-1].elevation + elevations[i].elevation)/2;
        var ele1 = (elevations[i].elevation + elevations[i+1].elevation)/2;
        if( ele0 < ele1) {
          netLoss += (ele1-ele0); 
        } else {
          netGain += (ele0-ele1);
        }
        distance +=delta;

        data.addRow([distance, ele0.toFeet()]);
      }
    }
    // Draw the chart using the data within its DIV.
    document.getElementById('elevation_chart').style.display = 'block';
    chart.draw(data, {
      width: 640,
      height: 200,
      legend: 'none',
      titleY: is_metric ? 'Elevation (m)' : 'Elevation (ft)',
      titleX: is_metric ? 'Distance (km)' : 'Distance (mi)'
    });
  }
  else {
    alert("Elevation request was not successful for the following reason: " + status);
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

function decodeLevels(encodedLevelsString) {
  var decodedLevels = [];

  for (var i = 0; i < encodedLevelsString.length; ++i) {
    var level = encodedLevelsString.charCodeAt(i) - 63;
    decodedLevels.push(level);
  }
  return decodedLevels;
}
function watch_waypoints() {
  var wpts = directionsDisplay.directions.routes[0].legs[0].via_waypoints;
  for(var i=0; i<wpts.length; i++) {
    var marker = new google.maps.Marker({
        map: map,
        position: new google.maps.LatLng(wpts[i].lat(), wpts[i].lng())
        });
    google.maps.event.addListener(marker, 'click', function() {
        alert("You clicked it");
    });
  }
}
