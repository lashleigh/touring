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

  $("#"+day.travel_mode).addClass("selected").removeClass("unselected");
  calcRoute();
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
  $(".save_waypoint").live("click", function() {
    var i = $(this).attr("id").split("_")[1];
    $.post("/waypoints/save_foursquare", {fq: foursquare_result_array[i].json})
  });

});
function drawPreviousNext() {
  if(prev_day) {
    var pathOptions = {
      path: google.maps.geometry.encoding.decodePath(prev_day.encoded_path),
      //levels: decodeLevels(prev_day.encoded_levels), I would need to add encoded levels first
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
  } else {
    ary = JSON.parse(day.google_waypoints).map(function(wpt) {return {location: new google.maps.LatLng(wpt[0], wpt[1]), stopover: false};})
  }

  var request = {
    origin: prev_day ? prev_day.stop_location : trip.start_location,
    destination: $("#day_stop_location").val(), 
    waypoints: ary,
    travelMode: google.maps.TravelMode[selectedMode],
    unitSystem: google.maps.UnitSystem[unit_system]
  };
  directionsService.route(request, function(response, status) {
    if (status == google.maps.DirectionsStatus.OK) {
      directionsDisplay.setDirections(response);
    }
  });
  $("#day_travel_mode").val(selectedMode);
}
function loadBlankDay() {
  $("#stop_locations").append('<dt><img alt="B" src="/images/b.png"></dt>'+
  '<dd><input size="40" type="text" value=""></dd>')
}
function getLatLng(w) {
  return new google.maps.LatLng(w.coords[0], w.coords[1]);
}
function getAddress(w) {
  return [w.address, w.city, w.state].join(", ");
}
function set_heights() {
  var base = window.innerHeight - $("header").outerHeight() - $("footer").outerHeight() - 10;
  var baseWidth = window.innerWidth - $("#detail_panel").outerWidth() -5;
  $("#detail_panel").css("margin-top", $("#topbar").outerHeight());
  $("#map_canvas").css("height", base+"px");
  $("#detail_panel").css("height", base-$("#topbar").outerHeight()+"px")
  $("#elevation_chart").css("width", baseWidth+"px");
}

