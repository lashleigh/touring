var rendererOptions = {
  draggable: true,
  suppressInfoWindows: true
  };
var directionsDisplay = new google.maps.DirectionsRenderer(rendererOptions);
var directionsService = new google.maps.DirectionsService();
var map;
var bounds = new google.maps.LatLngBounds();
var days = [];
var TouringGlobal = {
  mode: 'idle',
  directions_start: false,
  directions_end  : false,
  current_day : false
  };

$(function() {
  set_heights();
  $(window).resize(set_heights);
  $("#new_day #save_new_day").live("click", save_day_and_add_to_table);
  $("#new_day #search").live("click", insert_or_append_day);
  $("#new_day .cancel").live("click", cancel);
  $("#new_day #day_travel_mode").live("change", insert_or_append_day) 
  $("#wizard").live("click", function() {
    calc_route(route_options_for("wizard", false), true)
  });
  $("#show_new_day_form").click(function() {$("#new_day").show(); $("#new_wizard").hide();})

  var myOptions = {
    zoom: 8,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    center: coords_to_google_point(trip.start_coords)
  };
  map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
  var bikeLayer = new google.maps.BicyclingLayer();
  bikeLayer.setMap(map);

  directionsDisplay.setMap(map);
  directionsDisplay.setPanel(document.getElementById("directionsPanel"));

  google.maps.event.addListener(directionsDisplay, 'directions_changed', function() {
    if(TouringGlobal.mode =="insert" || TouringGlobal.mode =="append") {
      new_day_stats();
    } else if(TouringGlobal.mode =="edit") {
      edit_day_stats();
    }
    watch_for_inappropriate_drag();
  });

  more_methods_for_trip();
  drawStartMarker();
  for(var i =0; i< ordered_days.length; i++) { 
    days.push(new Day(ordered_days[i]));
  }
  //Without more than one day the map will go max zoom on a single point
  if(bounds.getNorthEast().toString() !== bounds.getSouthWest().toString()) {
    map.fitBounds(bounds)
  }
});
function drawStartMarker() {
  bounds.extend(trip.start_point);
  var marker = new google.maps.Marker({
    position: trip.start_point,
    map: map,
    title: trip.start_location,
    icon: "/assets/red_marker.png"
  }); 
}
function insert_or_append_day() {
  if($("#new_day").next().hasClass("day_row")) {
    TouringGlobal.mode = "insert"
    calc_route(route_options_for("insert", false), false);
  }
  else {
    TouringGlobal.mode = "append"
    calc_route(route_options_for("append", false), true);
  }
}

function calc_route(options, update_endpoints) {
  var request = {
    origin: options['origin'],  
    destination: options['destination'],
    waypoints: options['waypoints'],
    travelMode: google.maps.TravelMode[options['travel_mode']],
    unitSystem: google.maps.UnitSystem['IMPERIAL']
  }
  directionsService.route(request, function(response, status) {
    if (status == google.maps.DirectionsStatus.OK) {
      directionsDisplay.setMap(map)
      directionsDisplay.setDirections(response);
      enable_saving(true)
      if(update_endpoints) {
        nail_first_last();
      }
    } else {
      alert(status);
    }
  });
}
function nail_first_last() {
  var base = directionsDisplay.directions.routes[0].legs
  var current_start = base[0].start_location.toString()
  var current_end   = base[base.length-1].end_location.toString()
  if(TouringGlobal.mode === "insert") {
    TouringGlobal.directions_start = current_start 
    TouringGlobal.directions_end   = current_end
  } else if(TouringGlobal.mode==="edit") {
    var index = current_editable_day_index();
    TouringGlobal.directions_start = current_start //days[index-1] ? current_start : false;
    TouringGlobal.directions_end   = days[index+1] ? current_end   : false;
  } else if(TouringGlobal.mode==="append") {
    TouringGlobal.directions_start = current_start; //trip.last_day ? current_start : false;
    TouringGlobal.directions_end   = false
  }
}
function coords_to_google_waypoints(coords) {
  return coords.map(function(c){return {location: coords_to_google_point(c), stopover:false}}); 
}
function route_options_for(mode, first_time) {
  var to_return = {};
  if(mode == "insert") {
    var index = current_new_day_index();
    var prev_day = days[index-1] ? days[index-1].point : trip.start_point;
    var next_day = days[index].point;
    if(first_time) {
      var polyline = google.maps.geometry.encoding.decodePath(ordered_days[index].encoded_path);
      var half = Math.floor(polyline.length/2);
      var ary = [{location: polyline[half], stopover: true}]; typeof prev_day==="object" ? days[index-1]: false; 
    } else {
      var ary = [{location: coords_to_google_point(JSON.parse($("#new_day #day_stop_coords").val())), stopover:true}];
    }
    to_return['origin'] = prev_day;
    to_return['destination'] = next_day;
    to_return['waypoints'] = ary.concat(days[index].waypoints);
    to_return['travel_mode'] = $("#new_day #day_travel_mode :selected").val()
  } else if(mode == "edit") {
    var index = current_editable_day_index();
    if(index > 0 && index < ordered_days.length-1) {
      var prev_day = days[index-1].point;
      var next_day = days[index+1].point;
      if(first_time) {
        var ary = [{location: TouringGlobal.current_day.point, stopover:true}].concat(days[index].waypoints);
      }
    } else if(ordered_days.length == 1) {
      var prev_day = trip.start_point; 
      var next_day = days[0].point;
      var ary = [].concat(days[index].waypoints); 
    } else if(index ==0) {
      var prev_day = trip.start_point; 
      var next_day = days[1].point;
      if(first_time) {
        var ary = [{location: days[0].point, stopover: true}].concat(days[index].waypoints);
      }
    } else if(index ==ordered_days.length-1) {
      var prev_day = days[index-1].point;
      var ary = [].concat(days[index].waypoints); 
      if(first_time) {
        var next_day = days[index].point;
      } else {
        var id = TouringGlobal.current_day.day_id; 
        var next_day = coords_to_google_point(JSON.parse($(id+" #day_stop_coords").val())) 
      }
    }
    if(!ary) {
      var id = TouringGlobal.current_day.day_id; 
      var ary = [{location: coords_to_google_point(JSON.parse($(id+" #day_stop_coords").val())), stopover:true}];
    }
    if(first_time) {
      to_return['travel_mode'] = TouringGlobal.current_day.travel_mode
    } else {
      to_return['travel_mode'] = $(TouringGlobal.current_day.day_id+" #day_travel_mode :selected").val()
    }
    to_return['origin'] = prev_day;
    to_return['destination'] = next_day;
    to_return['waypoints'] = ary;
  } else if(mode=="append") {
    var last_point = trip.last_day ? day_to_google_point(trip.last_day) : trip.start_point;
    to_return['origin'] = last_point;
    to_return['destination'] = $("#new_day #day_stop_location").val();
    to_return['waypoints'] = [];
    to_return['travel_mode'] = $("#new_day #day_travel_mode :selected").val()
  }
  return to_return;
}

function watch_for_inappropriate_drag() {
  var base = directionsDisplay.directions.routes[0].legs
  var current_start = base[0].start_location.toString()
  var current_end   = base[base.length-1].end_location.toString()
  var warn = "You have just made your route discontinuous - This is not recommended"
  if(TouringGlobal.directions_start && TouringGlobal.directions_start !== current_start) {
    flash_warning(warn)
    calc_route(route_options_for(TouringGlobal.mode, false), false);
  }
  if(TouringGlobal.directions_end && TouringGlobal.directions_end !== current_end) {
    flash_warning(warn)
    calc_route(route_options_for(TouringGlobal.mode, false), false);
  }
}
function save_day_and_add_to_table() {
  var new_day_index = current_new_day_index();
  save_hidden_fields("#new_day #day");
  save_hidden_fields("#new_day #next_day");

  $.post('/create_new_day', $("#new_day").serialize(), function(data) {
    trip = data['trip'];
    ordered_days = data['ordered_days'];
    more_methods_for_trip();
    $(".day_row").remove();
    $("#indexable").prepend(data['dayhtml']);
    days.splice(new_day_index, 0, new Day(data['day']))
    save_next_day(data['next_day'], new_day_index) 
    TouringGlobal.mode = "idle"; //This is redundant but it stops the old polyline from getting drawn
    cancel();
  })
}
function more_methods_for_trip() {
  trip.last_day = ordered_days.length ? ordered_days[ordered_days.length-1] : false 
  trip.distance = trip.last_day ? trip.last_day.distance : 0.0
  trip.start_point = coords_to_google_point(trip.start_coords);
}
function cancel() {
  if(TouringGlobal.mode=="insert") {
    TouringGlobal.current_day.marker.setMap(map)
    TouringGlobal.current_day.polyline.setMap(map)
  }
  map.fitBounds(bounds)
  TouringGlobal.mode = "idle"
  TouringGlobal.current_day = false;
  TouringGlobal.directions_start = false;
  TouringGlobal.directions_end = false;
  directionsDisplay.setMap(null);
  unfade_neighbors();
  //clearForm();
  reset_new_form();
  enable_saving(false);
  $("#new_day").hide(); 
  $("#new_wizard").show();
}

function save_hidden_fields(parent_id) {
  if(parent_id.match(" #next_day") !== null) {
    var which = 1;
  } else {
    var which = 0;
  }

  var base = directionsDisplay.directions.routes[0].legs[which];
  if(base != undefined) {
    var overview_path =[];
    for(var i=0; i<base.steps.length; i++) {
      overview_path.push.apply(overview_path, base.steps[i].lat_lngs);
    }
    var path_as_array = overview_path.map(function(a) { return [a.lat(), a.lng()];});
 
    $(parent_id+"_stop_location").val(base.end_address);
    $(parent_id+"_stop_coords").val(JSON.stringify([base.end_location.lat(), base.end_location.lng()]))
    $(parent_id+"_encoded_path").val(google.maps.geometry.encoding.encodePath(overview_path));
    $(parent_id+"_route").val(JSON.stringify(path_as_array));
    $(parent_id+"_distance").val(base.distance.value)
    $(parent_id+"_google_waypoints").val(JSON.stringify(google_points_to_coords(base.via_waypoints)))
    
    if(TouringGlobal.mode=="append") {
      $(parent_id+"_travel_mode").val($("#new_day #day_travel_mode :selected").val())
    } else {
      $(parent_id+"_travel_mode").val($(TouringGlobal.current_day.day_id+" #day_travel_mode :selected").val())
    }
  }
}
function new_day_stats() {
  var base = directionsDisplay.directions.routes[0].legs[0];
  var dist = base.distance.value
  var total = meter_2_mile(trip.distance+dist)
  $("#new_day #new_distance").html(base.distance.text);
  $("#new_day #new_total").html(total);
  $("#new_day #day_stop_location").val(base.end_address);
  $("#new_day #day_stop_coords").val(JSON.stringify([base.end_location.lat(), base.end_location.lng()]))
}
function edit_day_stats() {
  var id = current_editable_id();
  var base = directionsDisplay.directions.routes[0].legs[0];
  var dist = base.distance.value
  var total = meter_2_mile(trip.distance+dist)
  $(id+" #new_distance").html(meter_2_mile(dist));
  $(id+" #new_total").html(total);
  $(id+" #day_stop_location").val(base.end_address);
  $(id+" #day_stop_coords").val(JSON.stringify([base.end_location.lat(), base.end_location.lng()]))
}
function set_heights() {
  var base = window.innerHeight - $("header").outerHeight() - $("footer").outerHeight();
  var map_width = Math.max(parseInt($("#content").css("min-width")), window.innerWidth)-$("#trip_days_wrap").width()
  $("#map_canvas").css("height", base+"px");
  $("#map_canvas").css("width", map_width+"px");
  $("#trip_days_wrap").css("height", base+"px")
}
function meter_2_mile(num) {
  return (num*0.000621371192).toFixed(1)+' mi'
}
function meter_2_kilometer(num) {
  return (num/1000).toFixed(1)+' km'
}
function day_to_google_point(day) {
  return coords_to_google_point(day.stop_coords);
}
function coords_to_google_point(coords) {
  return new google.maps.LatLng(coords[0], coords[1]);
}
function google_points_to_coords(points) {
  return points.map(function(w){return [w.lat(), w.lng()]})
}
function current_new_day_index() {
  return $("#indexable").children().index($("#new_day"));
}
function current_editable_day_index() {
  return $(".edit_day").index($(".edit_day:visible"));
}
function current_editable_id() {
  return "#"+$(".edit_day:visible").attr("id");
}
function enable_saving(bool) {
  if(bool) {
    $("#new_day #save_new_day").attr("disabled", false).removeClass("disable")
  } else {
    $("#new_day #save_new_day").attr("disabled", true).addClass("disable")
  }
}
function flash_warning(str) {
  $("#warning").html(str).show().delay(8000).fadeOut(2000)
}
