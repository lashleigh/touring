function Day(day) {
  this.raw_day = day;

  this.point = coords_to_google_point(day.stop_coords);
  this.waypoints = coords_to_google_waypoints(day.google_waypoints);
  this.day_id = "#day_"+day.id;
  this.travel_mode = day.travel_mode;
  this.info_text = '<div class="place_form"><p><a href="/trips/'+trip.id+'/days/'+day.id+'">'+day.stop_location+'</a></p></div>';
  this.id      = day.id
  this.prev_id = day.prev_id
  this.next_id = day.next_id
  marker = new google.maps.Marker({
    position: this.point,
    map: map,
    title: day.stop_location,
    icon: "/assets/red_marker.png"
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
Day.prototype = {
  insert: insert_day,
  cancel: cancel_day, 
  destroy: remove_day,
  save: save_day,
  edit: edit_day,  
  prev_point : function() {return days[this.prev_id] ? days[this.prev_id].point : coords_to_google_point(trip.start_coords)}, 
  next_point : function() {return days[this.next_id] ? days[this.next_id].point : false},
  mode_match : function() {return days[this].travel_mode === (days[this.next_id] ? days[this.next_id].travel_mode : false )}
}
function edit_day() {
  TouringGlobal.mode = "edit"
  TouringGlobal.current_day = this;
  $(".edit_day").hide();
  $(this.day_id+" .edit_day").show();
  fade_neighbors(this);
  this.polyline.setMap(null);
  this.marker.setMap(null);
  calc_route(route_options_for("edit", true), true);
}
function cancel_day() {
  var me = TouringGlobal.current_day
  $(me.day_id+" .edit_day").hide();
  unfade_neighbors(me);
  me.polyline.setMap(map);
  me.marker.setMap(map)
  directionsDisplay.setMap(null);
  map.fitBounds(bounds);

  $(me.day_id).find("#day_travel_mode").val(me.travel_mode);
  TouringGlobal.mode = "idle"
  TouringGlobal.current_day = false;
  TouringGlobal.directions_start = false;
  TouringGlobal.directions_end = false;
  var pend = TouringGlobal.pending_deletion;
  if(pend) {
    days[pend.id] = pend;
    $(pend.day_id).show();
    pend.polyline.setMap(map);
    pend.marker.setMap(map);
    if(pend.next_id) {
      days[pend.next_id].prev_id = pend.id;
    } else if(pend.prev_id) {
      days[pend.prev_id].next_id = pend.id;
    }
    TouringGlobal.pending_deletion = false;
  }
}
function save_day() {
  var current_day = TouringGlobal.current_day
  save_hidden_fields(this.day_id+" #day");
  save_hidden_fields(this.day_id+" #next_day");
  if(TouringGlobal.pending_deletion) {
    $('#remove_'+TouringGlobal.pending_deletion.id).click(); 
    clean_the_trash(TouringGlobal.pending_deletion);
    TouringGlobal.pending_deletion = false;
  }

  $.post('/index_edit', $(this.day_id+" .edit_day").serialize(), function(data) {
    trip = data['trip'];
    ordered_days = data['ordered_days'];
    more_methods_for_trip();
    $(".day_row").remove();
    $("#indexable").prepend(data['dayhtml']);
    kill_the_trash(current_day)
    current_day.cancel();
    clean_the_trash(days[current_day.id])
    days[current_day.id] = new Day(data['day']);
    save_next_day(data['next_day']) 
  })
}
function kill_the_trash(me) {
  $(me.day_id).find(".edit").die()
  $(me.day_id).find(".insert").die()
  $(me.day_id).find(".remove").die()
  $(me.day_id).find(".edit_day .save").die()
  $(me.day_id).find(".edit_day .cancel").die()
}
function clean_the_trash(me) {
  google.maps.event.clearInstanceListeners(me.marker);
  google.maps.event.clearInstanceListeners(me.polyline);
  me.marker.setMap(null);
  me.polyline.setMap(null);
  //delete me; 
}
function insert_day() {
  TouringGlobal.mode = "insert";
  TouringGlobal.current_day = this;
  fade_neighbors(this);
  this.polyline.setMap(null);
  this.marker.setMap(null)
  hijack_new_form_for_insert(this);
  calc_route(route_options_for("insert", true), true);
}
function remove_day() {
  TouringGlobal.pending_deletion = this;
  $(this.day_id).hide();
  this.marker.setMap(null);
  this.polyline.setMap(null);
  delete days[this.id]
  if(this.next_id) {
    days[this.next_id].prev_id = this.prev_id;
    days[this.next_id].edit();
  } else if(this.prev_id) {
    days[this.prev_id].next_id = this.next_id;
    days[this.prev_id].edit();
  }
}
function set_marker_events(me) {
  google.maps.event.addListener(me.marker, 'mouseover', function() {
    me.marker.setIcon("/assets/yellow_marker.png");
    $(me.day_id).addClass("highlighted");
    me.polyline.setOptions({strokeOpacity: 0.9, strokeWeight: 8});
  });
  google.maps.event.addListener(me.marker, 'mouseout', function() {
    me.marker.setIcon("/assets/red_marker.png");
    $(me.day_id).removeClass("highlighted");
    me.polyline.setOptions({strokeOpacity: 0.8, strokeWeight: 4});
  });
  google.maps.event.addListener(me.marker, 'click', function() {
    me.polyline.setOptions({strokeOpacity: 0.9, strokeWeight: 8});
    me.marker.setIcon("/assets/yellow_marker.png");
  })
}
function set_polyline_events(me) {
  google.maps.event.addListener(me.polyline, 'click', function(event) {
    flash_warning(me.info_text);
  })
  google.maps.event.addListener(me.polyline, 'mouseover', function() {
    me.polyline.setOptions({strokeOpacity: 0.9, strokeWeight: 8});
    me.marker.setIcon("/assets/yellow_marker.png");
  })
  google.maps.event.addListener(me.polyline, 'mouseout', function() {
    me.polyline.setOptions({strokeOpacity: 0.8, strokeWeight: 4});
    me.marker.setIcon("/assets/red_marker.png");
  })
  google.maps.event.addListener(me.marker, 'click', function() {
    flash_warning(me.info_text);
  });
}
function set_div_events(me) {
  $(me.day_id).live('mouseover', function() { 
    if(TouringGlobal.mode == "idle") {map.panTo(me.point);}
    me.marker.setIcon("/assets/yellow_marker.png");
    me.polyline.setOptions({strokeOpacity: 0.9, strokeWeight: 8});
    $(this).find(".modify .button").removeClass("hidden")
  }).live("mouseout", function() {
    me.marker.setIcon("/assets/red_marker.png");
    me.polyline.setOptions({strokeOpacity: 0.8, strokeWeight: 4});
    $(this).find(".modify .button").addClass("hidden")
  }).live("click", function() {
    flash_warning(me.info_text);
  });
}
function set_div_button_events(me) {
  var cache = $(me.day_id);
  cache.find('.edit').live("click", function() {
    me.edit();
  });
  cache.find('.insert').live("click", function() {
    me.insert();
  });
  cache.find('.remove').live("click", function() {
    me.destroy();
  });
  cache.find('.edit_day .save').live("click", function() {
    me.save();
  });
  cache.find(".edit_day .cancel").live("click", function() {
    me.cancel();
  });
  cache.find("#day_travel_mode").change(function() {
    // By making it true changes in latlng due to bike
    // path vs road won't cause errors
    calc_route(route_options_for("edit", false), true)
  })
}

function save_next_day(next_day) {
  if(next_day) {
    kill_the_trash(days[next_day.id])
    clean_the_trash(days[next_day.id])
    days[next_day.id] = new Day(next_day);
  }
} 

function hijack_new_form_for_insert(me) {
  var new_day_div = $("#new_day");
  $("#new_day").remove();
  $(me.day_id).before(new_day_div); 

  $("#new_day").show(); 
  $("#new_wizard").hide();
  $("#new_day #day_prev_id").val(me.prev_id)
  $("#new_day #day_next_id").val(me.id)
  $("#new_day #next_day_id").val(me.id)
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
