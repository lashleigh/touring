var map;
var bounds = new google.maps.LatLngBounds();
var infoWindow = new google.maps.InfoWindow();

$(function() {
  // Initialize the map with default UI.
  map = new google.maps.Map(document.getElementById("map_container"), {
    //center: new google.maps.LatLng(venues[0].coords[0], venues[0].coords[1]),
    //zoom: 4,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  });
  $(venues).each(drawVenue);
  map.fitBounds(bounds);
});
function drawVenue(i, v) {
  var venueLatLng = new google.maps.LatLng(v.coords[0], v.coords[1]);

  var marker = new google.maps.Marker({
    position: venueLatLng,
    map: map,
    title: v.name,
    fillColor: '#00ff00',
    fillOpacity: 0.7,
  });
  new google.maps.event.addListener(marker, 'click', function() {
    infoWindow.setContent('<div class="place_form"><h2>'+v.name+'</h2></div>');
    infoWindow.open(map, marker);
  });
  bounds.extend(venueLatLng)
}
