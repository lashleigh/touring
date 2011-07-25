var foursquare_result_array;
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
  $(".save_waypoint").live("click", function() {
  var i = $(this).attr("id").split("_")[1];
  console.log(foursquare_result_array[i].json);
    $.post("/waypoints/save_foursquare", {fq: foursquare_result_array[i].json})
  });
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
      if(res.nearby) { foursquare_result_array = res.nearby; }
      else if(res.places) { foursquare_result_array = res.places; }
      $(foursquare_result_array).each(drawSearchResult);
      map.fitBounds(bounds);
    }
    }, "json");
  return false;
}

function drawSearchResult(i, res) {
  res = res.json;
  var pos = new google.maps.LatLng(res.location.lat, res.location.lng);
  var marker = new google.maps.Marker({
    position: pos,
    map: map,
    title: res.name,
    //draggable: true,
  });
  new google.maps.event.addListener(marker, 'click', function() {
  infoWindow.setContent('<div class="place_form"><h2><a href="https://foursquare.com/venue/'+ res.id+'">'+res.name+'</a></h2></div>'+
                        '<input class="save_waypoint" id="save_'+i+'" name="commit" type="submit" value="Save">');
    infoWindow.open(map, marker);
  });
  bounds.extend(pos);
}
