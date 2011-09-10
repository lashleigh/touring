var rendererOptions = {
  draggable: true,
  suppressInfoWindows: true
  };
var directionsDisplay = new google.maps.DirectionsRenderer(rendererOptions);
var directionsService = new google.maps.DirectionsService();
var infoWindow = new google.maps.InfoWindow();
var map;
var bounds = new google.maps.LatLngBounds();

$(function() {
  set_heights();
  $(window).resize(set_heights);
  $("#save_new_day").click(save_day_and_add_to_table);
  $("#add_new_day").click(calcRoute);

  var myOptions = {
    zoom: 7,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    center: new google.maps.LatLng(trip.center[0], trip.center[1])
  };
  map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);

  directionsDisplay.setMap(map);
  directionsDisplay.setPanel(document.getElementById("directionsPanel"));

  google.maps.event.addListener(directionsDisplay, 'directions_changed', function() {
    new_day_stats();
    save_hidden_fields();
    /*computeTotalDistance(directionsDisplay.directions);
    save_waypoints(directionsDisplay.directions);
    drawPath(directionsDisplay.directions.routes[0].overview_path);
    watch_waypoints();*/
    });
  //Note that you could listen to the bounds_changed event but it fires continuously as the user pans; instead, the idle will fire once the user has stopped panning/zooming.
  google.maps.event.addListener(map, 'idle', function() {
  });

  for(var i =0; i< trip.days.length; i++) { 
    drawDay(trip.days[i]) 
  }
  map.fitBounds(bounds)
});
function drawDay(dayObj) {
  var dayLatLng = new google.maps.LatLng(dayObj.stop_coords[0], dayObj.stop_coords[1]);
  var day_id = "#day_"+dayObj.id;
  var day_html = '<div class="place_form"><p><a href="/trips/'+trip.id+'/days/'+dayObj.id+'">'+dayObj.stop_location+'</a></p></div>'
  var marker = new google.maps.Marker({
    position: dayLatLng,
    map: map,
    title: dayObj.stop_location,
    icon: "/images/red_marker.png"
  });  
  var polyline = new google.maps.Polyline({
    map           : map,
    strokeColor   : '#0000ff',
    strokeOpacity : 0.5,
    strokeWeight  : 4,
    path: google.maps.geometry.encoding.decodePath(dayObj.encoded_path)
  })
  new google.maps.event.addListener(marker, 'mouseover', function() {
    marker.setIcon("/images/yellow_marker.png");
    $(day_id).addClass("highlighted");
    polyline.setOptions({strokeOpacity: 0.9, strokeWeight: 8});
  });
  new google.maps.event.addListener(marker, 'mouseout', function() {
    marker.setIcon("/images/red_marker.png");
    $(day_id).removeClass("highlighted");
    polyline.setOptions({strokeOpacity: 0.4, strokeWeight: 4});
  });
  new google.maps.event.addListener(marker, 'click', function() {
    $("tr").removeClass("selected")
    $(day_id).addClass("selected");
    polyline.setOptions({strokeOpacity: 0.9, strokeWeight: 8});
    marker.setIcon("/images/yellow_marker.png");
  })

  new google.maps.event.addListener(polyline, 'click', function(event) {
    infoWindow.setContent(day_html)
    infoWindow.setPosition(event.latLng);
    infoWindow.open(map);
  })
  new google.maps.event.addListener(polyline, 'mouseover', function() {
    polyline.setOptions({strokeOpacity: 0.9, strokeWeight: 8});
    marker.setIcon("/images/yellow_marker.png");
  })
  new google.maps.event.addListener(polyline, 'mouseout', function() {
    polyline.setOptions({strokeOpacity: 0.4, strokeWeight: 4});
    marker.setIcon("/images/red_marker.png");
  })
  google.maps.event.addListener(marker, 'click', function() {
    infoWindow.setContent(day_html)
    infoWindow.open(map, marker);
  });
  $(day_id).hover(
    function() { 
      marker.setIcon("/images/yellow_marker.png");
      polyline.setOptions({strokeOpacity: 0.9, strokeWeight: 8});
    }, function() {
      marker.setIcon("/images/red_marker.png");
      polyline.setOptions({strokeOpacity: 0.4, strokeWeight: 4});
    }
  ).click(function() {
    infoWindow.setContent(day_html)
    infoWindow.open(map, marker);
    }
  );
  bounds.extend(dayLatLng);
}
function calcRoute(day) {
  //var ary = JSON.parse(day.google_waypoints).map(function(wpt) {return {location: new google.maps.LatLng(wpt[0], wpt[1]), stopover: false};})
  directionsDisplay.setMap(map)
  var request = {
    origin: trip.days[trip.days.length-1].stop_coords,
    destination: $("#day_stop_location").val(), 
    //waypoints: ary,
    travelMode: google.maps.TravelMode['DRIVING'],
    unitSystem: google.maps.UnitSystem['IMPERIAL']
  };
  directionsService.route(request, function(response, status) {
    if (status == google.maps.DirectionsStatus.OK) {
      directionsDisplay.setDirections(response);
      new_day_stats();
      $("#save_new_day").attr("disabled", false).removeClass("disable")
    } else {
      console.log(status);
    }

  });
}
function save_day_and_add_to_table() {
  $.post('/create_new_day', $("#new_day").serialize(), function(data) {
    var day = data['day'];
    trip.days.push(day)
    trip.distance += day.distance
    clearForm();
  var dist = directionsDisplay.directions.routes[0].legs[0].distance.value
  var total = meter_2_mile(trip.distance+dist)
  var stop_loc = directionsDisplay.directions.routes[0].legs[0].end_address;
  $("tbody").append('<tr id="day_'+day.id+'"><td class="index">'+(trip.days.length)+'</td>'+
                        '<td class="location">'+stop_loc+'</td>'+
                        '<td class="distance">'+meter_2_mile(dist)+'</td>'+
                        '<td class="total">'+total+'</td></tr>');
    drawDay(data['day'])
    directionsDisplay.setMap(null)
    console.log(data)
  })
}
function clearForm() {
  $("#day_stop_location").val('');
  $("#day_stop_coords").val('')
  $("#day_encoded_path").val('')
  $("#day_distance").val('')
  $("#day_google_waypoints").val('')
  $("#day_travel_mode").val('')

  $("#new_distance").html('');
  $("#new_total").html('');

  $("#save_new_day").attr("disabled", true).addClass("disable")
}
function save_hidden_fields() {
  var base = directionsDisplay.directions.routes[0].legs[0];
  $("#day_stop_location").val(base.end_address);
  $("#day_stop_coords").val(JSON.stringify([base.end_location.lat(), base.end_location.lng()]))
  $("#day_encoded_path").val(directionsDisplay.directions.routes[0].overview_polyline.points)
  $("#day_distance").val(base.distance.value)
  $("#day_google_waypoints").val("")
  $("#day_travel_mode").val("DRIVING")
}
function new_day_stats() {
  var dist = directionsDisplay.directions.routes[0].legs[0].distance.value
  var total = meter_2_mile(trip.distance+dist)
  var stop_loc = directionsDisplay.directions.routes[0].legs[0].end_address;
  $("#new_distance").html(meter_2_mile(dist));
  $("#new_total").html(total);
}

function set_heights() {
  var base = window.innerHeight - $("header").outerHeight() - $("footer").outerHeight();
  $("#map_canvas").css("height", base+"px");
  $("#trip_days_wrap").css("height", base+"px")
  $("#new_location").css("margin-left", $(".index").outerWidth()+"px");
  $(".actions").css("margin-left", ($(".index").outerWidth()+3)+"px");
  $("#new_location").css("width", $(".location").outerWidth()+"px");
  $("#new_total").css("width", $(".total").outerWidth()+"px");
  $("#new_distance").css("width", $(".distance").outerWidth()+"px");

}

function meter_2_mile(num) {
  return (num*0.000621371192).toFixed(1)+' mi'
}
function meter_2_kilometer(num) {
  return (num/1000).toFixed(1)+' km'
}
