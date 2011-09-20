var map;
var center;
var marker = new google.maps.Marker({draggable:true});
var geocoder = new google.maps.Geocoder;
$(function() {
  map = new google.maps.Map(document.getElementById("new_trip_map_canvas"), {
    zoom: 8,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    center: new google.maps.LatLng(45, -120)
  });

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showMap);
  } else {
    console.log('Please indicate your planned starting location');
  }
  google.maps.event.addListener(marker, 'dragend', function() {
    codeLatLng(marker.getPosition());
  })
})
function showMap(position) {
  var position = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
  map.setCenter(position);
  marker.setOptions({
    map:map,
    position:position
  })
}
function google_point_to_coords(point) {
  return [point.lat(), point.lng()]
}
function codeAddress(address) {
  geocoder.geocode( { 'address': address }, function(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
      console.log(results, results[0].formatted_address);
      map.setCenter(results[0].geometry.location);
      update_form(results[0]);
    } else {
      alert("Geocode was not successful for the following reason: " + status);
    }
  });

}
function codeLatLng(point) {
  geocoder.geocode( { 'location': point, 'bounds':map.getBounds()}, function(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
      console.log(results, results[0].formatted_address);
      update_form(results[0]);
    } else {
      alert("Geocode was not successful for the following reason: " + status);
    }
  });
}
function update_form(result) {
  map.panTo(marker.getPosition());
  var return_address = result.formatted_address;
  $("#trip_start_location").val(return_address);
  $("#trip_start_coords").val(JSON.stringify(google_point_to_coords(result.geometry.location)))
}
