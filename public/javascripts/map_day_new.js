var rendererOptions = {
  draggable: true
  };
var directionsDisplay;
var directionsService = new google.maps.DirectionsService();
var map;
var total;
var waypointMarkers = [];
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
    //checkWaypointMarkers();
    computeTotalDistance(directionsDisplay.directions);
    save_waypoints(directionsDisplay.directions);
    drawPath(directionsDisplay.directions.routes[0].overview_path);
  });
  google.maps.event.addListener(map, 'click', calcRoute);
  $("#mode").val(day.travel_mode);
  $(".adp-summary").live("click", function() {
    $(this).next().find(".adp-directions").toggle();
  })
});
function checkWaypointMarkers() {
  
  google.maps.event.addListener(marker, 'click', function() {
    console.log(this);
  });
}
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

