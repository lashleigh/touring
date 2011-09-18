function Day(day) {
  this.raw_day = day;

  this.point = coords_to_google_point(day.stop_coords);
  this.day_id = "#day_"+day.id;
  this.info_text = '<div class="place_form"><p><a href="/trips/'+trip.id+'/days/'+day.id+'">'+day.stop_location+'</a></p></div>';
  marker = new google.maps.Marker({
    position: this.point,
    map: map,
    title: day.stop_location,
    icon: "/images/red_marker.png"
  });  
  polyline = new google.maps.Polyline({
    map           : map,
    strokeColor   : '#9B30FF',
    strokeOpacity : 0.8,
    strokeWeight  : 4,
    path: google.maps.geometry.encoding.decodePath(day.encoded_path)
  })

  this.marker = marker;
  this.polyline = polyline;

  set_marker_events(this);
  set_polyline_events(this);
  set_div_events(this);
  set_div_button_events(this);
  bounds.extend(this.point);
}
//Day.prototype = new google.maps.MVCObject();

function set_marker_events(me) {
  google.maps.event.addListener(me.marker, 'mouseover', function() {
    me.marker.setIcon("/images/yellow_marker.png");
    $(me.day_id).addClass("highlighted");
    me.polyline.setOptions({strokeOpacity: 0.9, strokeWeight: 8});
  });
  google.maps.event.addListener(me.marker, 'mouseout', function() {
    me.marker.setIcon("/images/red_marker.png");
    $(me.day_id).removeClass("highlighted");
    me.polyline.setOptions({strokeOpacity: 0.8, strokeWeight: 4});
  });
  google.maps.event.addListener(me.marker, 'click', function() {
    me.polyline.setOptions({strokeOpacity: 0.9, strokeWeight: 8});
    me.marker.setIcon("/images/yellow_marker.png");
  })
}
function set_polyline_events(me) {
  google.maps.event.addListener(me.polyline, 'click', function(event) {
    flash_warning(me.info_text);
  })
  google.maps.event.addListener(me.polyline, 'mouseover', function() {
    me.polyline.setOptions({strokeOpacity: 0.9, strokeWeight: 8});
    me.marker.setIcon("/images/yellow_marker.png");
  })
  google.maps.event.addListener(me.polyline, 'mouseout', function() {
    me.polyline.setOptions({strokeOpacity: 0.8, strokeWeight: 4});
    me.marker.setIcon("/images/red_marker.png");
  })
  google.maps.event.addListener(me.marker, 'click', function() {
    flash_warning(me.info_text);
  });
}
function set_div_events(me) {
  $(me.day_id).live('mouseover', function() { 
    if(TouringGlobal.mode == "idle") {map.panTo(me.point);}
    me.marker.setIcon("/images/yellow_marker.png");
    me.polyline.setOptions({strokeOpacity: 0.9, strokeWeight: 8});
    $(this).find(".modify .button").removeClass("hidden")
  })
  $(me.day_id).live("mouseout", function() {
    me.marker.setIcon("/images/red_marker.png");
    me.polyline.setOptions({strokeOpacity: 0.8, strokeWeight: 4});
    $(this).find(".modify .button").addClass("hidden")
  })
  $(me.day_id).live("click", function() {
    flash_warning(me.info_text);
  });
}
function set_div_button_events(me) {
  $(me.day_id+" .edit").live("click", function() {
    TouringGlobal.mode = "edit"
    TouringGlobal.current_day = me;
    $(".edit_day").hide();
    $(me.day_id+" .edit_day").show();
    fade_neighbors(me);
    me.polyline.setMap(null);
    me.marker.setMap(null);
    calc_route(route_options_for("edit", true), true);
  });
  $(me.day_id+" .insert").live("click", function() {
    TouringGlobal.mode = "insert";
    TouringGlobal.current_day = me;
    fade_neighbors(me);
    me.polyline.setMap(null);
    me.marker.setMap(null)
    hijack_new_form_for_insert(me);
    calc_route(route_options_for("insert", true), true);
  });
  $(me.day_id+" .edit_day .save").live("click", function() {
    save_edited_day(me);
  });
  $(me.day_id+" .edit_day .cancel").live("click", function() {
    cancel_me(me);
    $(me.day_id+" .edit_day").hide();
  });
  $(me.day_id+" #day_travel_mode").change(function() {
    // By making it true changes in latlng due to bike
    // path vs road won't cause errors
    calc_route(route_options_for("edit", false), true)
  })
}
function save_edited_day(me) {
  var current_index = current_editable_day_index(); 
  save_hidden_fields(me.day_id+" #day");
  save_hidden_fields(me.day_id+" #next_day");
  $.post('/index_edit', $(me.day_id+' .edit_day').serialize(), function(data) {
    trip = data['trip'];
    more_methods_for_trip();
    $(".day_row").remove();
    $("#indexable").prepend(data['dayhtml']);
    me.marker.setMap(null);
    me.polyline.setMap(null);
    var trash = days.splice(current_index, 1, new Day(data['day']))
    delete trash; 

    save_next_day(data['next_day'], current_index) 
    cancel_me(days[current_index]);
  })
}
function save_next_day(next_day, index) {
  if(next_day) {
    //#TODO write a clean up function that removes a day 
    days[index+1].marker.setMap(null);
    days[index+1].polyline.setMap(null);
    var trash = days.splice(index+1, 1, new Day(next_day))
    delete trash
  }
} 
function cancel_me(me) {
  TouringGlobal.mode = "idle"
  TouringGlobal.current_day = false;
  TouringGlobal.directions_start = false;
  TouringGlobal.directions_end = false;
  unfade_neighbors(me);
  me.polyline.setMap(map);
  me.marker.setMap(map)
  directionsDisplay.setMap(null);
  map.fitBounds(bounds);

  $(me.day_id+" #day_travel_mode").val(me.raw_day.travel_mode);
}
function listener_for_editing(me) {
  save_hidden_fields(me.day_id+" #day");
  save_hidden_fields(me.day_id+" #next_day");
  var base = directionsDisplay.directions
  if(base) {
    base = base.routes[0].legs[0];
    var dist = base.distance.value
    var total = meter_2_mile(trip.distance+dist)
    $(me.day_id+" #new_distance").html(meter_2_mile(dist));
    $(me.day_id+" #new_total").html(total);
    $(me.day_id+" #day_stop_location").val(base.end_address);
    $(me.day_id+" #day_stop_coords").val(JSON.stringify([base.end_location.lat(), base.end_location.lng()]))
  }
}

function hijack_new_form_for_insert(me) {
  var new_day_div = $("#new_day");
  $("#new_day").remove();
  $(me.day_id).before(new_day_div); 

  $("#new_day #day_prev_id").val(me.raw_day.prev_id)
  $("#new_day #day_next_id").val(me.raw_day.id)
  $("#new_day #next_day_id").val(me.raw_day.id)
}
function reset_new_form() {
  var new_day_div = $("#new_day");
  $("#new_day").remove();
  $("#indexable").append(new_day_div); 

  $("#new_day .field           :input").val('');
  $("#new_day .next_day_fields :input").val('');
  $("#new_day #new_location    :input").val('');

  $("#new_day #new_distance").html('');
  $("#new_day #new_total").html('');

  $("#new_day #day_prev_id").val(trip.last_day.id)
  $("#new_day #day_next_id").val('')
  $("#new_day #next_day_id").val('')
}
function fade_neighbors(me) {
  $(".day_row").css("opacity", 0.4);
  $(me.day_id).css("opacity", 1.0);
  $(me.day_id).prev().css("opacity", 1.0);
  if(TouringGlobal.mode !== "insert") { $(me.day_id).next().css("opacity", 1.0); }
}
function unfade_neighbors() {
  $(".day_row").css("opacity", 1.0);
}
