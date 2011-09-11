var rendererOptions = {
  draggable: true,
  suppressInfoWindows: true
  };
var directionsDisplay = new google.maps.DirectionsRenderer(rendererOptions);
var directionsService = new google.maps.DirectionsService();
var infoWindow = new google.maps.InfoWindow();
var map;
var bounds = new google.maps.LatLngBounds();
var polylines_array = [];
var markers_array = [];

$(function() {
  set_heights();
  $(window).resize(set_heights);
  $("#save_new_day").live("click", save_day_and_add_to_table);
  $("#add_new_day").live("click", insert_or_append_day);
  $("#cancel").live("click", cancel);
  $(".insert").live("click", insert_new_day) 

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
    save_hidden_fields(0);
    /*computeTotalDistance(directionsDisplay.directions);
    save_waypoints(directionsDisplay.directions);
    drawPath(directionsDisplay.directions.routes[0].overview_path);
    watch_waypoints();*/
    });
  //Note that you could listen to the bounds_changed event but it fires continuously as the user pans; instead, the idle will fire once the user has stopped panning/zooming.
  google.maps.event.addListener(map, 'idle', function() {
  });

  for(var i =0; i< trip.ordered_days.length; i++) { 
    drawDay(trip.ordered_days[i], i) 
  }
  map.fitBounds(bounds)
});
function drawDay(dayObj, i) {
  var dayLatLng = day_to_google_point(dayObj); 
  var day_id = "#day_"+dayObj.id;
  var day_html = '<div class="place_form"><p><a href="/trips/'+trip.id+'/days/'+dayObj.id+'">'+dayObj.stop_location+'</a></p></div>';
  if(i > 0) {
    var prev_point = [day_to_google_point(trip.ordered_days[i-1])];
  } else {
    var prev_point = [];
  }
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
    path: prev_point.concat(google.maps.geometry.encoding.decodePath(dayObj.encoded_path))
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
  $(day_id).live('mouseover', function() { 
      marker.setIcon("/images/yellow_marker.png");
      polyline.setOptions({strokeOpacity: 0.9, strokeWeight: 8});
      $(this).find(".modify .button").removeClass("hidden")
  })
  $(day_id).live("mouseout", function() {
      marker.setIcon("/images/red_marker.png");
      polyline.setOptions({strokeOpacity: 0.4, strokeWeight: 4});
      $(this).find(".modify .button").addClass("hidden")
  })
  $(day_id).live("click", function() {
    infoWindow.setContent(day_html)
    infoWindow.open(map, marker);
    }
  );
  bounds.extend(dayLatLng);
}
function insert_or_append_day() {
  console.log("anything")
  if($("#new_day").next().hasClass("day_row")) {
    var index = $("#indexable").children().index($("#new_day"))
    calc_route_insert_before(index);
  }
  else {
    calcRoute();
  }
}
function calcRoute() {
  //var ary = JSON.parse(day.google_waypoints).map(function(wpt) {return {location: new google.maps.LatLng(wpt[0], wpt[1]), stopover: false};})
  directionsDisplay.setMap(map)
  var request = {
    origin: day_to_google_point(trip.last_day),
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
      $("#cancel").attr("disabled", false).removeClass("disable")
    } else {
      console.log(status);
    }

  });
}
function calc_route_insert_before(index) {
  directionsDisplay.setMap(map)
  var polyline = google.maps.geometry.encoding.decodePath(trip.ordered_days[index].encoded_path);
  var half = Math.floor(polyline.length/2);
  var prev_day = trip.ordered_days[index-1];
  var next_day = trip.ordered_days[index];
  var ary = [{location: polyline[half], stopover: true}];
  $("#day_prev_id").val(prev_day.id)
  $("#day_next_id").val(next_day.id)
  var request = {
    origin: day_to_google_point(prev_day), 
    destination: day_to_google_point(next_day), 
    waypoints: ary,
    travelMode: google.maps.TravelMode['DRIVING'],
    unitSystem: google.maps.UnitSystem['IMPERIAL']
  }
  directionsService.route(request, function(response, status) {
    if (status == google.maps.DirectionsStatus.OK) {
      directionsDisplay.setDirections(response);
      new_day_stats();
      $("#save_new_day").attr("disabled", false).removeClass("disable")
      $("#cancel").attr("disabled", false).removeClass("disable")
    } else {
      console.log(status);
    }
  });
}
function save_day_and_add_to_table() {
  var new_day_index = $("#indexable").children().index($("#new_day"));

  $.post('/create_new_day', $("#new_day").serialize(), function(data) {
    console.log(data)
    var day = data['day'];
    trip = data['trip'] //.distance += day.distance
    $(".day_row").remove();
    $("#indexable").append(data['dayhtml']);
    drawDay(day, new_day_index);
    cancel();
  })
}
function cancel() {
  directionsDisplay.setMap(null);
  clearForm();
  var new_day_form = $("#new_day");
  $("#new_day").remove();
  $("#indexable").append(new_day_form);
}
function clearForm() {
  $("#new_day .field :input").val('');
  $("#new_day #new_location :input").val('');
  $("#trip_id").val(trip.id);

  $("#new_distance").html('');
  $("#new_total").html('');

  $("#save_new_day").attr("disabled", true).addClass("disable")
  $("#cancel").attr("disabled", true).addClass("disable")
}
function save_hidden_fields(which) {
  if(which == 0) {
    var day = "#day";
  } else if(which == 1) {
    var day = "#next_day";
  }
  var base = directionsDisplay.directions.routes[0].legs[which];
  var overview_path =[];
  for(var i=0; i<base.steps.length; i++) {
    overview_path.push.apply(overview_path, base.steps[i].lat_lngs);
  }
  $(day+"_stop_location").val(base.end_address);
  $(day+"_stop_coords").val(JSON.stringify([base.end_location.lat(), base.end_location.lng()]))
  $(day+"_encoded_path").val(google.maps.geometry.encoding.encodePath(overview_path));
  $(day+"_distance").val(base.distance.value)
  $(day+"_google_waypoints").val("")
  $(day+"_travel_mode").val("DRIVING")
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

function insert_new_day() {
  var clicked_index = $(".insert").index(this);
  var new_day = $("#new_day")
  $("#new_day").remove()
  $("#"+$(this).attr("id").replace(/insert/,'day')).before(new_day)
  calc_route_insert_before(clicked_index);

  //var polylines_array[clicked_index].setMap(null)
  //var markers_array[clicked_index].setMap(null)
}
function day_to_google_point(day) {
  return new google.maps.LatLng(day.stop_coords[0], day.stop_coords[1]);
}
