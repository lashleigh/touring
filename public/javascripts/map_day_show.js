var rendererOptions = {
  draggable: true
  };
var directionsDisplay = new google.maps.DirectionsRenderer(rendererOptions);;
var directionsService = new google.maps.DirectionsService();
var map;
var total;

var australia = new google.maps.LatLng(-25.274398, 133.775136);
var elevator;
var chart;
var netLoss = 0, netGain = 0;

$(function() {
  chart = new google.visualization.ScatterChart(document.getElementById('elevation_chart'));
  elevator = new google.maps.ElevationService();

  var myOptions = {
    zoom: 7,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    center: australia
  };
  map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);

  directionsDisplay.setMap(map);
  directionsDisplay.setPanel(document.getElementById("directionsPanel"));

  google.maps.event.addListener(directionsDisplay, 'directions_changed', function() {
    computeTotalDistance(directionsDisplay.directions);
    save_waypoints(directionsDisplay.directions);
    drawPath(directionsDisplay.directions.routes[0].overview_path);
  });
  $("#mode").val(day.travel_mode);
  calcRoute();
  $(".adp-summary").live("click", function() {
    $(this).next().find(".adp-directions").toggle();
  })
});
function drawPreviousNext() {
  if(prev_day) {
    var pathOptions = {
      path: google.maps.geometry.encoding.decodePath(prev_day.encoded_path),
      //levels: decodeLevels(prev_day.encoded_levels), I would need to add encoded levels first
      strokeColor: '#0000CC',
      opacity: 0.4,
      map: map
    }
    polyline = new google.maps.Polyline(pathOptions);
  }
  if(next_day) {
    var pathOptions = {
      path: google.maps.geometry.encoding.decodePath(next_day.encoded_path),
      strokeColor: '#0000CC',
      opacity: 0.4,
      map: map
    }
    polyline = new google.maps.Polyline(pathOptions);
  }
}
function calcRoute() {
  var selectedMode = document.getElementById("mode").value;

  var request = {
    origin: prev_day ? prev_day.stop_location : trip.start_location,
    destination: (day.stop_location != null) ? day.stop_location : trip.finish_location,
    //waypoints: ary,
    travelMode: google.maps.TravelMode[selectedMode],
    unitSystem: google.maps.UnitSystem[unit_system]
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

