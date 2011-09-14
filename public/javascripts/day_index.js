var rendererOptions = {
  draggable: true,
  suppressInfoWindows: true
  };
var directionsDisplay = new google.maps.DirectionsRenderer(rendererOptions);
var directionsService = new google.maps.DirectionsService();
var infoWindow = new google.maps.InfoWindow();
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
  $("#new_day #cancel").live("click", cancel);

  var myOptions = {
    zoom: 8,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    center: coords_to_google_point(trip.start_coords) //new google.maps.LatLng(trip.center[0], trip.center[1])
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

  drawStartMarker();
  for(var i =0; i< trip.ordered_days.length; i++) { 
    days.push(new Day(trip.ordered_days[i], map, bounds)); //drawDay(trip.ordered_days[i], i) 
  }
  //Without more than one day the map will go max zoom on a single point
  if(bounds.getNorthEast().toString() !== bounds.getSouthWest().toString()) {
    map.fitBounds(bounds)
  }
});
function drawStartMarker() {
  var start_point = coords_to_google_point(trip.start_coords)
  bounds.extend(start_point);
  var marker = new google.maps.Marker({
    position: start_point,
    map: map,
    title: trip.start_location,
    icon: "/images/red_marker.png"
  }); 
}
function insert_or_append_day() {
  if($("#new_day").next().hasClass("day_row")) {
    TouringGlobal.mode = "insert"
    calc_route(route_options_for("insert", false));
  }
  else {
    TouringGlobal.mode = "append"
    calc_route(route_options_for("append", false));
  }
}

function calc_route(options) {
  directionsDisplay.setMap(map)
  var request = {
    origin: options['origin'],  
    destination: options['destination'],
    waypoints: options['waypoints'],
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
function route_options_for(mode, first_time) {
  var to_return = {};
  if(mode == "insert") {
    var index = current_new_day_index();
    if(index > 0) {
      var prev_day = days[index-1].point;
    } else {
      var prev_day = trip.start_location; //coords_to_google_point(trip.start_coords);
    }
    var next_day = days[index].point;
    if(first_time) {
      var polyline = google.maps.geometry.encoding.decodePath(trip.ordered_days[index].encoded_path);
      var half = Math.floor(polyline.length/2);
      var ary = [{location: polyline[half], stopover: true}];
      TouringGlobal.directions_start = typeof prev_day==="object" ? prev_day.toString() : false; 
      TouringGlobal.directions_end   = next_day.toString();
    } else {
      //var ary = [{location: coords_to_google_point(JSON.parse($("#new_day #day_stop_coords").val())), stopover:true}];
      var ary = [{location: $("#new_day #day_stop_location").val(), stopover:true}];
    }
    to_return['origin'] = prev_day;
    to_return['destination'] = next_day;
    to_return['waypoints'] = ary;
  } else if(mode == "edit") {
    var index = current_editable_day_index();
    if(index > 0 && index < trip.ordered_days.length-1) {
      var prev_day = days[index-1].point;
      var next_day = days[index+1].point;
      if(first_time) {
        var ary = [{location: day_to_google_point(trip.ordered_days[index]), stopover:true}];
        TouringGlobal.directions_start = prev_day.toString();
        TouringGlobal.directions_end   = next_day.toString();
      }
    } else if(index ==0) {
      var prev_day = trip.start_location; //coords_to_google_point(trip.start_coords);
      var next_day = days[0].point;
      if(first_time) {
        var polyline = google.maps.geometry.encoding.decodePath(trip.ordered_days[0].encoded_path);
        var half = Math.floor(polyline.length/2);
        var ary = [{location: polyline[half], stopover: true}];
        TouringGlobal.directions_start = false; //typeof prev_day==="object" ? prev_day.toString() : false; 
        TouringGlobal.directions_end   = next_day.toString(); //typeof next_day==="object" ? next_day.toString() : false;
      }
    } else if(index ==trip.ordered_days.length-1) {
      var prev_day = days[index-1].point;
      var next_day = days[index].point;
      if(first_time) {
        var ary = []; 
        TouringGlobal.directions_start = prev_day.toString();
        TouringGlobal.directions_end   = false;
      }
    }
    if(!first_time) {
      var id = TouringGlobal.current_day.day_id; 
      var ary = [{location: coords_to_google_point(JSON.parse($(id+" #day_stop_coords").val())), stopover:true}];
    }
    to_return['origin'] = prev_day;
    to_return['destination'] = next_day;
    to_return['waypoints'] = ary;
  } else if(mode=="append") {
    var last_point = trip.last_day ? day_to_google_point(trip.last_day) : trip.start_location;
    to_return['origin'] = last_point;
    to_return['destination'] = $("#new_day #day_stop_location").val();
    to_return['waypoints'] = [];
    to_return['mode'] = 'append';
    if(first_time) {
      TouringGlobal.directions_start = typeof last_point==="object" ? last_point.toString() : false; 
      TouringGlobal.directions_end   = false;
    }
  }
  return to_return;
}

function watch_for_inappropriate_drag() {
  var base = directionsDisplay.directions.routes[0].legs
  var current_start = base[0].start_location.toString()
  var current_end   = base[base.length-1].end_location.toString()
  if(TouringGlobal.directions_start && TouringGlobal.directions_start !== current_start) {
    flash_warning("It is not currently possible to edit endpoints while creating a new day")
    calc_route(route_options_for(TouringGlobal.mode, false));
  }
  if(TouringGlobal.directions_end && TouringGlobal.directions_end !== current_end) {
    flash_warning("It is not currently possible to edit endpoints while creating a new day")
    calc_route(route_options_for(TouringGlobal.mode, false));
  }
}
function save_day_and_add_to_table() {
  var new_day_index = current_new_day_index();
  save_hidden_fields("#new_day #day");
  save_hidden_fields("#new_day #next_day");

  $.post('/create_new_day', $("#new_day").serialize(), function(data) {
    trip = data['trip'];
    $(".day_row").remove();
    $("#indexable").prepend(data['dayhtml']);
    days.splice(new_day_index, 0, new Day(data['day'], map, bounds))
    
    if(data['next_day']) {
      //#TODO write a clean up function that removes a day 
      days[new_day_index+1].marker.setMap(null);
      days[new_day_index+1].polyline.setMap(null);
      days.splice(new_day_index+1, 1, new Day(data['next_day'], map, bounds))
    }
    cancel();
  })
}

function cancel() {
  TouringGlobal.mode = "idle"
  TouringGlobal.current_day = false;
  TouringGlobal.directions_start = false;
  TouringGlobal.directions_end = false;
  directionsDisplay.setMap(null);
  //clearForm();
  reset_new_form();
  enable_saving(false);
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
    $(parent_id+"_google_waypoints").val("")
    $(parent_id+"_travel_mode").val("DRIVING")
  }
}
function new_day_stats() {
  var base = directionsDisplay.directions.routes[0].legs[0];
  var dist = base.distance.value
  var total = meter_2_mile(trip.distance+dist)
  $("#new_day #new_distance").html(meter_2_mile(dist));
  $("#new_day #new_total").html(total);
  $("#new_day #day_stop_location").val(base.end_address);
  $("#new_day #day_stop_coords").val(JSON.stringify([base.end_location.lat(), base.end_location.lng()]))
}
function edit_day_stats() {
  var id = current_editable_id();
  save_hidden_fields(id+" #day");
  save_hidden_fields(id+" #next_day");
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