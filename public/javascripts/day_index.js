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
var polylines_array = [];
var markers_array = [];
var directions_start = false;
var directions_end = false;
var mode;

$(function() {
  set_heights();
  $(window).resize(set_heights);
  $("#new_day #save_new_day").live("click", save_day_and_add_to_table);
  $("#new_day #search").live("click", insert_or_append_day);
  $("#new_day #cancel").live("click", cancel);
  //$(".edit_day .cancel").live("click", cancel_edit);
  //$(".edit_day .save" ).live("click", save_edited_day);
  //$(".day_row .insert").live("click", insert_new_day) 
  //$(".day_row .edit"  ).live("click", edit_day)

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
    if(mode=="insert" || mode=="append") {
      new_day_stats();
    } else if(mode=="edit") {
      edit_day_stats();
    }
  //  watch_for_inappropriate_drag();
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
    mode = "insert"
    var options = route_options_for("insert", false)
    calc_route(options);
  }
  else {
    mode = "append"
    options = route_options_for("append", false);
    calc_route(options);
  }
}

function calc_route(options) {
  var first_time = (directionsDisplay.getMap() === undefined);
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
      //set_direction_start_end(first_time);
    } else {
      console.log(status);
    }
  });
}
function route_options_for(mode, first_time) {
  var to_return = {};
  if(mode == "insert") {
    var index = current_new_day_index();
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
      //var ary = [{location: coords_to_google_point(JSON.parse($("#new_day #day_stop_coords").val())), stopover:true}];
      var ary = [{location: $("#new_day #day_stop_location").val(), stopover:true}];
    }
    to_return['origin'] = prev_day;
    to_return['destination'] = day_to_google_point(next_day);
    to_return['waypoints'] = ary;
  } else if(mode == "edit") {
    var index = $(".edit_day").index($(".edit_day:visible"))
    if(index > 0 && index < trip.ordered_days.length-1) {
      var prev_day = day_to_google_point(trip.ordered_days[index-1]);
      var next_day = day_to_google_point(trip.ordered_days[index+1]);
    } else if(index ==0) {
      var prev_day = trip.start_location;
    } else if(index ==trip.ordered_days.length) {
      var next_day = trip.finish_location;
    }
    if(first_time) {
      var ary = [{location: day_to_google_point(trip.ordered_days[index]), stopover:true}];
    } else {
      var id = $(".edit_day:visible").attr("id");
      var ary = [{location: coords_to_google_point(JSON.parse($("#"+id+" #day_stop_coords").val())), stopover:true}];
    }
    set_prev_next_id(prev_day, next_day);
    to_return['origin'] = prev_day;
    to_return['destination'] = next_day;
    to_return['waypoints'] = ary;
  } else if(mode=="append") {
    var last_point = trip.last_day ? day_to_google_point(trip.last_day) : coords_to_google_point(trip.start_coords)
    to_return['origin'] = last_point;
    to_return['destination'] = $("#new_day #day_stop_location").val();
    to_return['waypoints'] = [];
    //set_prev_next_id(false, false);
  }
  return to_return;
}
function set_direction_start_end(first_time) {
  if(first_time) {
    var base = directionsDisplay.directions.routes[0].legs
    var current_start = base[0].start_location.toString()
    var current_end   = base[base.length-1].end_location.toString()
    directions_start = current_start;
    directions_end = current_end;
  }
}
function watch_for_inappropriate_drag() {
  var base = directionsDisplay.directions.routes[0].legs
  var current_start = base[0].start_location.toString()
  var current_end   = base[base.length-1].end_location.toString()
  if(directions_start && directions_start !== current_start) {
    flash_warning("It is not currently possible to edit endpoints while creating a new day")
    calc_route(route_options_for(mode, false));
  }
  if(directions_end && directions_end !== current_end) {
    flash_warning("It is not currently possible to edit endpoints while creating a new day")
    calc_route(route_options_for(mode, false));
  }
}
function save_day_and_add_to_table() {
  var new_day_index = current_new_day_index();
  save_hidden_fields("#new_day #day");
  save_hidden_fields("#new_day #next_day");

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

function save_edited_day() {
  var edited_day_index = current_editable_day_index();
  var edited_id = current_editable_id();
  save_hidden_fields(edited_id+" #day");
  save_hidden_fields(edited_id+" #next_day");

  $.post('/index_edit', $(edited_id).serialize(), function(data) {
    var day = data['day'];
    trip = data['trip'];
    $(".day_row").remove();
    $("#indexable").append(data['dayhtml']);
    markers_array.splice(edited_day_index, 1);
    polylines_array.splice(edited_day_index, 1);
    drawDay(day, edited_day_index);
    if(data['next_day']) {
      markers_array.splice(edited_day_index+1, 1)
      polylines_array.splice(edited_day_index+1, 1)
      drawDay(data['next_day'], edited_day_index+1)
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

function cancel_edit() {
  directionsDisplay.setMap(null);
  set_prev_next_id(false, false);
  //enable_saving(false);
  change_neighboring_opacity(1.0);

  //$(".edit_day").hide();
  $("#"+$(this).attr("id").replace(/cancel/,'edit_day')).hide();
}
function set_prev_next_id(prev_day, next_day) {
  if(mode=="insert" || mode=="append") {
    if(prev_day) {
      $("#new_day #day_prev_id").val(prev_day.id)
      directions_start = day_to_google_point(prev_day).toString();
    } else {
      if(trip.last_day) {
        $("#new_day #day_prev_id").val(trip.last_day.id)
        directions_start = day_to_google_point(trip.last_day).toString();
      } else {
        $("#new_day #day_prev_id").val('')
        directions_start = coords_to_google_point(trip.start_coords).toString();
      }
    }
    if(next_day) {
      $("#new_day #day_next_id").val(next_day.id)
      $("#new_day #next_day_id").val(next_day.id)
      directions_end = day_to_google_point(next_day).toString();
    } else {
      $("#new_day #day_next_id").val('')
      $("#new_day #next_day_id").val('')
      directions_end = false;
    }
  }
  if(mode=="edit") {
    if(prev_day) {
      directions_start = prev_day.toString();
    } else {
      directions_start = coords_to_google_point(trip.ordered_days[0].route[0]).toString();
    }
    if(next_day) {
      directions_end = next_day.toString();
    } else {
      directions_end = false;
    } 
  }
}
function clearForm() {
  $("#new_day .field :input").val('');
  $("#new_day #new_location :input").val('');
  $("#new_day #trip_id").val(trip.id);

  $("#new_day #new_distance").html('');
  $("#new_day #new_total").html('');
}
function save_hidden_fields(parent_id) {
  if(parent_id.match(" #next_day") !== null) {
    var which = 1;
  } else {
    var which = 0;
  }
  var base = directionsDisplay.directions //.routes[0].legs[which];
  if(base != undefined) {
    base = base.routes[0].legs[which];
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
  mode = "insert";
  change_neighboring_opacity(1.0);

  var new_day = $("#new_day")
  $("#new_day").remove()
  $("#"+$(this).attr("id").replace(/insert/,'day')).before(new_day)
  change_neighboring_opacity(0.2);
  calc_route(route_options_for("insert", true));
}
function edit_day() {
  mode = "edit"
  //change_neighboring_opacity(1.0);
  $(".edit_day").hide()
  $("#"+$(this).attr("id").replace(/edit/,'edit_day')).show()
  //change_neighboring_opacity(0.2);
  calc_route(route_options_for("edit", true))
}
function day_to_google_point(day) {
  return coords_to_google_point(day.stop_coords);
}
function coords_to_google_point(coords) {
  return new google.maps.LatLng(coords[0], coords[1]);
}
function change_neighboring_opacity(opacity) {
  if(mode=="insert") {
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
      //modify_some_markers(null, index-1, index);
      polylines_array[index].setMap(null);
    }
  } else if(mode=="edit") {
    var index = current_editable_day_index();
    var rows = $(".day_row");
    rows.css("opacity", opacity);
    $(rows[index]).css("opacity", 1.0)
    if(opacity==1.0) {
      all_visibilty(markers_array, map);
      all_visibilty(polylines_array, map);
    } else {
      //modify_some_markers(null, index-1, index);
      polylines_array[index].setMap(null);
      markers_array[index].setMap(null);
      if(polylines_array[index+1]) {polylines_array[index+1].setMap(null);}
    }
  }
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

function flash_warning(str) {
  $("#warning").html(str).show().delay(8000).fadeOut(2000)
}
