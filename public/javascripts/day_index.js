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
  $("#new_day #save_new_day").live("click", save_day_and_add_to_table);
  $("#new_day #add_new_day").live("click", insert_or_append_day);
  $("#new_day #cancel").live("click", cancel);
  $(".edit_day .cancel").live("click", cancel_edit);
  //$(".edit_day .save").live("click", save_edit);
  $(".insert").live("click", insert_new_day) 
  $(".day_row .edit").live("click", edit_day)

  var myOptions = {
    zoom: 8,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    center: new google.maps.LatLng(trip.center[0], trip.center[1])
  };
  map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
  var bikeLayer = new google.maps.BicyclingLayer();
  bikeLayer.setMap(map);

  directionsDisplay.setMap(map);
  directionsDisplay.setPanel(document.getElementById("directionsPanel"));

  google.maps.event.addListener(directionsDisplay, 'directions_changed', function() {
    new_day_stats();
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
    strokeColor   : '#9B30FF',
    strokeOpacity : 0.8,
    strokeWeight  : 4,
    path: prev_point.concat(google.maps.geometry.encoding.decodePath(dayObj.encoded_path))
  })
  markers_array.splice(i, 0, marker);
  polylines_array.splice(i, 0, polyline);
  new google.maps.event.addListener(marker, 'mouseover', function() {
    marker.setIcon("/images/yellow_marker.png");
    $(day_id).addClass("highlighted");
    polyline.setOptions({strokeOpacity: 0.9, strokeWeight: 8});
  });
  new google.maps.event.addListener(marker, 'mouseout', function() {
    marker.setIcon("/images/red_marker.png");
    $(day_id).removeClass("highlighted");
    polyline.setOptions({strokeOpacity: 0.8, strokeWeight: 4});
  });
  new google.maps.event.addListener(marker, 'click', function() {
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
    polyline.setOptions({strokeOpacity: 0.8, strokeWeight: 4});
    marker.setIcon("/images/red_marker.png");
  })
  google.maps.event.addListener(marker, 'click', function() {
    infoWindow.setContent(day_html)
    infoWindow.open(map, marker);
  });
  $(day_id).live('mouseover', function() { 
    map.panTo(dayLatLng);
    marker.setIcon("/images/yellow_marker.png");
    polyline.setOptions({strokeOpacity: 0.9, strokeWeight: 8});
    $(this).find(".modify .button").removeClass("hidden")
  })
  $(day_id).live("mouseout", function() {
    marker.setIcon("/images/red_marker.png");
    polyline.setOptions({strokeOpacity: 0.8, strokeWeight: 4});
    $(this).find(".modify .button").addClass("hidden")
  })
  $(day_id).live("click", function() {
    infoWindow.setContent(day_html)
    infoWindow.open(map, marker);
  });
  bounds.extend(dayLatLng);
}
function insert_or_append_day() {
  if($("#new_day").next().hasClass("day_row")) {
    var index = current_new_day_index();
    calc_route_insert_before(index, false);
  }
  else {
    calcRoute();
  }
}
function calcRoute() {
  //var ary = JSON.parse(day.google_waypoints).map(function(wpt) {return {location: new google.maps.LatLng(wpt[0], wpt[1]), stopover: false};})
  directionsDisplay.setMap(map)
  set_prev_next_id(false, false);
  var request = {
    origin: day_to_google_point(trip.last_day),
    destination: $("#new_day #day_stop_location").val(), 
    //waypoints: ary,
    travelMode: google.maps.TravelMode['DRIVING'],
    unitSystem: google.maps.UnitSystem['IMPERIAL']
  };
  directionsService.route(request, function(response, status) {
    if (status == google.maps.DirectionsStatus.OK) {
      directionsDisplay.setDirections(response);
      enable_saving(true);
    } else {
      console.log(status);
    }

  });
}
function calc_route_insert_before(index, first_time) {
  directionsDisplay.setMap(map)
  var next_day = trip.ordered_days[index];
  if(index > 0) {
    var prev_day = day_to_google_point(trip.ordered_days[index-1]);
    set_prev_next_id(trip.ordered_days[index-1], next_day);
  } else {
    var prev_day = trip.start_location;
    set_prev_next_id(false, next_day);
  }
  if(first_time) {
    var polyline = google.maps.geometry.encoding.decodePath(trip.ordered_days[index].encoded_path);
    var half = Math.floor(polyline.length/2);
    var ary = [{location: polyline[half], stopover: true}];
  } else {
    var ary = [{location: $("#new_day #day_stop_location").val(), stopover:true}];
  }

  var request = {
    origin: prev_day,  
    destination: day_to_google_point(next_day),  
    waypoints: ary,
    travelMode: google.maps.TravelMode['DRIVING'],
    unitSystem: google.maps.UnitSystem['IMPERIAL']
  }
  directionsService.route(request, function(response, status) {
    if (status == google.maps.DirectionsStatus.OK) {
    directionsDisplay.setDirections(response);
      enable_saving(true)
    } else {
      console.log(status);
    }
  });
}
function save_day_and_add_to_table() {
  var new_day_index = current_new_day_index();
  save_hidden_fields(0);
  save_hidden_fields(1);

  $.post('/create_new_day', $("#new_day").serialize(), function(data) {
    var day = data['day'];
    trip = data['trip'] //.distance += day.distance
    $(".day_row").remove();
    $("#indexable").append(data['dayhtml']);
    drawDay(day, new_day_index);
    if(data['next_day']) {
      markers_array.splice(new_day_index+1, 1)
      polylines_array.splice(new_day_index+1, 1)
      drawDay(data['next_day'], new_day_index+1)
    }
    cancel();
  })
}
function cancel() {
  directionsDisplay.setMap(null);
  clearForm();
  enable_saving(false);
  set_prev_next_id(false, false);
  change_neighboring_opacity(1.0);

  var new_day_form = $("#new_day");
  $("#new_day").remove();
  $("#indexable").append(new_day_form);
}
function set_prev_next_id(prev_day, next_day) {
  if(prev_day) {
    $("#new_day #day_prev_id").val(prev_day.id)
  } else {
    $("#new_day #day_prev_id").val(trip.last_day.id)
  }
  if(next_day) {
    $("#new_day #day_next_id").val(next_day.id)
    $("#new_day #next_day_id").val(next_day.id)
  } else {
    $("#new_day #day_next_id").val('')
    $("#new_day #next_day_id").val('')
  }
}
function clearForm() {
  $("#new_day .field :input").val('');
  $("#new_day #new_location :input").val('');
  $("#new_day #trip_id").val(trip.id);

  $("#new_day #new_distance").html('');
  $("#new_day #new_total").html('');
}
function save_hidden_fields(which) {
  if(which == 0) {
    var day = "#day";
  } else if(which == 1) {
    var day = "#next_day";
  }
  var base = directionsDisplay.directions.routes[0].legs[which];
  if(base != undefined) {
    var overview_path =[];
    for(var i=0; i<base.steps.length; i++) {
      overview_path.push.apply(overview_path, base.steps[i].lat_lngs);
    }
    var path_as_array = overview_path.map(function(a) { return [a.lat(), a.lng()];});
 
    $("#new_day "+day+"_stop_location").val(base.end_address);
    $("#new_day "+day+"_stop_coords").val(JSON.stringify([base.end_location.lat(), base.end_location.lng()]))
    $("#new_day "+day+"_encoded_path").val(google.maps.geometry.encoding.encodePath(overview_path));
    $("#new_day "+day+"_route").val(JSON.stringify(path_as_array));
    $("#new_day "+day+"_distance").val(base.distance.value)
    $("#new_day "+day+"_google_waypoints").val("")
    $("#new_day "+day+"_travel_mode").val("DRIVING")
  }
}
function new_day_stats() {
  var dist = directionsDisplay.directions.routes[0].legs[0].distance.value
  var total = meter_2_mile(trip.distance+dist)
  var stop_loc = directionsDisplay.directions.routes[0].legs[0].end_address;
  $("#new_day #new_distance").html(meter_2_mile(dist));
  $("#new_day #new_total").html(total);
  $("#new_day #day_stop_location").val(directionsDisplay.directions.routes[0].legs[0].end_address);
}

function set_heights() {
  var base = window.innerHeight - $("header").outerHeight() - $("footer").outerHeight();
  var map_width = Math.max(parseInt($("#content").css("min-width")), window.innerWidth)-$("#trip_days_wrap").width()
  $("#map_canvas").css("height", base+"px");
  $("#map_canvas").css("width", map_width+"px");
  $("#trip_days_wrap").css("height", base+"px")
  //$("#new_location").css("margin-left", $(".index").outerWidth()+"px");
  //$(".actions").css("margin-left", $(".index").outerWidth()+"px");
  //$("#new_location").css("width", $(".location").outerWidth()+"px");
  //$("#new_total").css("width", $(".total").outerWidth()+"px");
  //$("#new_distance").css("width", $(".distance").outerWidth()+"px");
}

function meter_2_mile(num) {
  return (num*0.000621371192).toFixed(1)+' mi'
}
function meter_2_kilometer(num) {
  return (num/1000).toFixed(1)+' km'
}

function insert_new_day() {
  change_neighboring_opacity(1.0);
  var clicked_index = $(".insert").index(this);
  var new_day = $("#new_day")
  $("#new_day").remove()
  $("#"+$(this).attr("id").replace(/insert/,'day')).before(new_day)
  change_neighboring_opacity(0.2);

  calc_route_insert_before(clicked_index, true);

}
function day_to_google_point(day) {
  return new google.maps.LatLng(day.stop_coords[0], day.stop_coords[1]);
}
function change_neighboring_opacity(opacity) {
  var index = current_new_day_index();
  var rows = $(".day_row");
  for(var i=0; i< index-1; i++) {
    $(rows[i]).css("opacity", opacity);
  }
  for(var i=index+1; i<= rows.length; i++) {
    $(rows[i]).css("opacity", opacity);
  }
  if(opacity==1.0) {
    all_visibilty(markers_array, map);
    all_visibilty(polylines_array, map);
  } else {
    modify_some_markers(null, index-1, index);
    polylines_array[index].setMap(null);
  }
}
function current_new_day_index() {
  return $("#indexable").children().index($("#new_day"));
}
function enable_saving(bool) {
  if(bool) {
    $("#new_day #save_new_day").attr("disabled", false).removeClass("disable")
    $("#new_day #cancel").attr("disabled", false).removeClass("disable")
  } else {
    $("#save_new_day").attr("disabled", true).addClass("disable")
    $("#cancel").attr("disabled", true).addClass("disable")
  }
}
function all_visibilty(which_array, how) {
  for(var i=0; i< which_array.length; i++) {
    which_array[i].setMap(how);
  }
}
function modify_some_markers(how, lower, upper) {
  for(var i=lower; i <= upper; i++) {
    if(i>= 0 && i < markers_array.length) { markers_array[i].setMap(how); }
  }
}
function edit_day() {
  var clicked_index = $(".edit").index(this);
  $(".edit_day").hide()
  $("#"+$(this).attr("id").replace(/edit/,'edit_day')).show()
}
function cancel_edit() {
  $("#"+$(this).attr("id").replace(/cancel/,'edit_day')).hide();
}
