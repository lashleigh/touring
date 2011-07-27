var rendererOptions = {
  draggable: true
};
var directionsDisplay = new google.maps.DirectionsRenderer(rendererOptions);;
var directionsService = new google.maps.DirectionsService();
var map;
var total;

var australia = new google.maps.LatLng(-25.274398, 133.775136);
var day_index;

$(function() {
  day_index = parseInt($(location).attr('href').split("/").pop());
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
    destination: day ? day.stop_location : "Aberdeen, WA",
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
  var encodeString = google.maps.geometry.encoding.encodePath(op);
  $("#day_encoded_path").val(encodeString);
  
  op = directionsDisplay.directions.routes[0].legs[0].via_waypoints
  path = [];
  $(op).each( function(i, a) {path.push([a.lat(), a.lng()])});
  $("#day_google_waypoints").val(JSON.stringify(path))
}
