
var map;
var infoWindow = new google.maps.InfoWindow();
var bounds = new google.maps.LatLngBounds();
$(function() {
  // Initialize the map with default UI.
  map = new google.maps.Map(document.getElementById("map_container"), {
    //center: new google.maps.LatLng(42.03, -100.22),
    //zoom: 4,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  });

  $(waypoints).each(drawWaypoint);
  map.fitBounds(bounds);
  $("#query").live("click", searchFoursquare);
}); 
function drawWaypoint(i, wp) {
  var pos = new google.maps.LatLng(wp.coords[0], wp.coords[1]);
  var marker = new google.maps.Marker({
    position: pos,
    map: map,
    title: wp.address,
    //draggable: true,
  });
  new google.maps.event.addListener(marker, 'click', function() {
    infoWindow.setContent('<div class="place_form"><h2><a href="/waypoints/'+ wp.id+'">'+wp.address+'</a></h2></div>');
    infoWindow.open(map, marker);
  });
  bounds.extend(pos)
}

function searchFoursquare() {
  var coords = [map.getCenter().lat(), map.getCenter().lng()];
  var query = $("#query_fq").val();

  $.post("/waypoints/search_foursquare", {coords: coords, query: query}, function(res, text_status) {
    if(res.errors) {
    }
    else {
      var ary;
      console.log(res, res.nearby, res.places)
      if(res.nearby) { ary = res.nearby; }
      else if(res.places) { ary = res.places; }
      for(var i=0; i< ary.length; i++) {
        drawSearchResult(ary[i]);
      }
    }
    }, "json");
  map.fitBounds(bounds);
  return false;
}

function drawSearchResult(res) {
  console.log(res);
  res = res.json;
  var pos = new google.maps.LatLng(res.location.lat, res.location.lng);
  var marker = new google.maps.Marker({
    position: pos,
    map: map,
    title: res.name,
    //draggable: true,
  });
  new google.maps.event.addListener(marker, 'click', function() {
    infoWindow.setContent('<div class="place_form"><h2><a href="/waypoints/'+ res.id+'">'+res.name+'</a></h2></div>');
    infoWindow.open(map, marker);
  });
  bounds.extend(pos);
}
