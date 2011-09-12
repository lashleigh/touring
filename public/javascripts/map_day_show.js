var rendererOptions = {
  draggable: true,
  suppressInfoWindows: true
  };
var directionsDisplay = new google.maps.DirectionsRenderer(rendererOptions);
var directionsService = new google.maps.DirectionsService();
var infowindow = new google.maps.InfoWindow();
var map;
var total;
var waypoint_markers = [];
var foursquare_markers = [];
var foursquare_results_ids = [];

var foursquare_result_array = [];
var australia = new google.maps.LatLng(-25.274398, 133.775136);
var elevator;
var chart;
var netLoss = 0, netGain = 0;

$(function() {
  set_heights();
  $(window).resize(set_heights);
  //chart = new google.visualization.ScatterChart(document.getElementById('elevation_chart'));
  elevator = new google.maps.ElevationService();

  var myOptions = {
    zoom: 7,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    center: australia
  };
  map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);

  directionsDisplay.setMap(map);
  directionsDisplay.setPanel(document.getElementById("directionsPanel"));

  google.maps.event.addListener(directionsDisplay, 'directions_changed', function() {
    computeTotalDistance(directionsDisplay.directions);
    save_waypoints(directionsDisplay.directions);
    drawPath(directionsDisplay.directions.routes[0].overview_path);
    watch_waypoints();
    });
  //Note that you could listen to the bounds_changed event but it fires continuously as the user pans; instead, the idle will fire once the user has stopped panning/zooming.
  google.maps.event.addListener(map, 'idle', function() {
    var bounds = map.getBounds();
    for(i=0; i<foursquare_markers.length; i++) {
      var boo = bounds.contains(foursquare_markers[i].position);
      if(boo) {
      foursquare_markers[i].setMap(map);
      $(foursquare_results_ids[i]).show();
      } else {
        foursquare_markers[i].setMap(null);
        $(foursquare_results_ids[i]).hide();
      }
    }
  });

  if(["DRIVING", "BICYCLING", "WALKING"].indexOf(day.travel_mode) != -1) {
    $("#"+day.travel_mode).addClass("selected").removeClass("unselected");
  } else {
    $("#DRIVING").addClass("selected").removeClass("unselected");
  }
  calcRoute(false);
  click_actions();
  tag_actions();
});
function drawPreviousNext() {
  if(day.prev_day) {
    var pathOptions = {
      path: google.maps.geometry.encoding.decodePath(day.prev_day.encoded_path),
      //levels: decodeLevels(day.prev_day.encoded_levels), I would need to add encoded levels first
      strokeColor: '#0000CC',
      opacity: 0.4,
      map: map
    }
    polyline = new google.maps.Polyline(pathOptions);
  }
  if(next_day) {
    var pathOptions = {
      path: google.maps.geometry.encoding.decodePath(next_day.encoded_path),
      strokeColor: '#0000CC',
      opacity: 0.4,
      map: map
    }
    polyline = new google.maps.Polyline(pathOptions);
  }
}
function calcRoute(waypoints) {
  var selectedMode = $(".travel_icons .selected").attr("id"); //"BICYCLING"; //document.getElementById("mode").value;
  var ary;
  if(waypoints) {
    ary = waypoints.map(function(wpt) {return {location: wpt, stopover: false};});
  } else if(day.google_waypoints.length > 0) {
    ary = JSON.parse(day.google_waypoints).map(function(wpt) {return {location: new google.maps.LatLng(wpt[0], wpt[1]), stopover: false};})
  } else {
    ary = [];
  }
  //ary.push({location: new google.maps.LatLng(day.stop_coords[0], day.stop_coords[1]), stopover: true})

  var request = {
    origin: day.prev_day ? day.prev_day.stop_location : trip.start_location,
    destination: $("#day_stop_location").val(), 
    //destination: day.next_id ? day.next_day.stop_location : trip.finish_location, //$("#day_stop_location").val(), 
    waypoints: ary,
    optimizeWaypoints: true,
    travelMode: google.maps.TravelMode[selectedMode],
    unitSystem: google.maps.UnitSystem[unit_system]
  };
  directionsService.route(request, function(response, status) {
    if (status == google.maps.DirectionsStatus.OK) {
      directionsDisplay.setDirections(response);
    } else {
      console.log(status);
    }

  });
  $("#day_travel_mode").val(selectedMode);
}
function set_heights() {
  var base = window.innerHeight - $("header").outerHeight() - $("footer").outerHeight();
  var map_width = Math.max(parseInt($("#content").css("min-width")), window.innerWidth)-$("aside#detail_panel").width()
  $("#map_canvas").css("height", base+"px");
  $("#map_canvas").css("width", map_width+"px");
  $("#detail_panel").css("height", base-$("#topbar").outerHeight()+"px")
  $("#detail_panel").css("margin-top", $("#topbar").outerHeight());
  $("#elevation_chart").css("width", map_width+"px");
  $("#elevation_chart").css("left", $("#map_canvas").position().left+"px");
  if(directionsDisplay.directions != undefined) {
    //drawPath(directionsDisplay.directions.routes[0].overview_path);
    // TODO redraw elevation after page resize
  }
}
function click_actions() {
  $(".adp-summary").live("click", function() {
    $(this).next().find(".adp-directions").toggle();
  })
  $(".travel_icons li").live("click", function() {
    $(".travel_icons li").removeClass("selected").addClass("unselected");
    $(this).removeClass("unselected").addClass("selected");
    calcRoute(false);
  });
  $(".detail_nav_icons li").live("click", function() {
    $(".detail_nav_icons li").removeClass("selected").addClass("unselected");
    $(this).removeClass("unselected").addClass("selected");
    $(".detail_alternate").hide();
    $("#"+$(this).attr("id")+"_details").show();
  });
  $("#search_fq").live("click", searchFoursquare);
  $(".save_place").live("click", function() {
    var i = $(this).attr("id").split("_")[1];
    $("#save_from_foursquare #fq_hash").val(JSON.stringify(foursquare_result_array[i].json))
    $.post("/places/save_foursquare", $("#save_from_foursquare").serialize(), function(res, text_status) {
      console.log(res);
      console.log(text_status);  
    })
  });
  $("#submit_tags").live("click", function() {
    $("#tags_day_id").val(day.id);
    $.post("/days/add_tag", $("#tags_form").serialize(), function(res, text_status) {
    if(res.errors) {
      alert(text_status);
    }
    else {
      for(var i=0; i<res.length; i++) {
        var matching_li = $(".tag_ul li:contains('"+res[i]+"')");
        for(var j=0; j<matching_li.length; j++) {
          if($(matching_li[j]).text() === res[i]){
            $(matching_li[j]).remove();
          }
        }
        // TODO this doesn't need to happen every time and shouldn't happen if the tag is not
        // successfully created.
        $(".no_tags").html("");
        $("#TAGS_details #the_tags").prepend("<div class='tag_item'><div class='live_tag'>"+res[i]+"</div></div>");
        $("#tag_string").val("");
      }
    }
    }, "json");
  return false;
  })
}
function tag_actions() {
  $(".tag_unused").live("click", function() {
    var current_text = $("#tag_string").val()
    $("#tag_string").val($(this).text() + " " + current_text)
    $(this).addClass("tag_used").removeClass("tag_unused");
    // TODO change the counts of the hover box on click
    // potentially append an x[int] to the tag string for
    // multiple clicks
    //var day_stat = $(this).next().find($(".day_stats .stat_num"));
    //day_stat.text(parseInt(day_stat.text())+1)
  });
  $(".tag_used").live("click", function() {
    var current_text = $("#tag_string").val();
    var tag_index = current_text.search($(this).text());
    if(tag_index != -1) {
      $("#tag_string").val(current_text.slice(0, tag_index)+current_text.slice(tag_index+$(this).text().length+1));
      $(this).addClass("tag_unused").removeClass("tag_used");
    }
    else if($("#the_tags .live_tag").text().search($(this).text()) == -1) {
      $("#tag_string").val($(this).text() + " " + current_text)
      $(this).addClass("tag_used").removeClass("tag_unused");
    }
  });
  $(".tag_item").live("mouseover", function() {
    $(this).find($(".tag_stats")).show();
  });
  $(".tag_item").live("mouseout", function() {
    $(this).find($(".tag_stats")).hide();
  });
}
