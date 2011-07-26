
var infoWindow = new google.maps.InfoWindow();
var bounds = new google.maps.LatLngBounds();

var rendererOptions = {
  draggable: true
};
var directionsDisplay = new google.maps.DirectionsRenderer(rendererOptions);;
var directionsService = new google.maps.DirectionsService();
var map;
var total;

var australia = new google.maps.LatLng(-25.274398, 133.775136);

$(function() {
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
  });

  calcRoute();
  $(".adp-summary").live("click", function() {
    $(this).next().find(".adp-directions").toggle();
  })
  $(".traveling_days .increment").live("click", function() {
    var num_days = parseInt($(".traveling_days strong").text())+1;
    $(".traveling_days strong").text(num_days)
    $(".rest_days strong").text(parseInt($(".rest_days strong").text())-1)
    $(".miles_per_day strong").text((total / num_days).toFixed(1))
  });
  $(".traveling_days .decrement").live("click", function() {
    var num_days = parseInt($(".traveling_days strong").text())-1;
    $(".traveling_days strong").text(num_days)
    $(".rest_days strong").text(parseInt($(".rest_days strong").text())+1)
    $(".miles_per_day strong").text((total / num_days).toFixed(1))
  });
  /*$(".increment").live("click", function() {
    var thing = $(this).parents(".incrementable").find("strong");
    var inc = parseInt(thing.text())+1
    console.log(thing, inc)
    $(thing).text(inc);
    update_stats();
    if(trip.fixed_dates == true) {
      
    }
  });
  $(".decrement").live("click", function() {
    var thing = $(this).parents(".incrementable").find("strong");
    var dec = parseInt(thing.text())-1
    thing.text(dec);
    update_stats();
  });*/
});

function calcRoute() {
  var selectedMode = document.getElementById("mode").value;
  var ary = [];
  /*for(var i = 1; i < waypoints.length-1; i++) {
    ary.push({location: getLatLng(waypoints[i]), stopover:true });
  }*/

  var request = {
    //origin: getLatLng(waypoints[0]),
    //destination: getLatLng(waypoints[waypoints.length-1]),
    origin: trip.starting_location,
    destination: trip.finish_location,
    //waypoints: ary,
    travelMode: google.maps.TravelMode[selectedMode],
    unitSystem: google.maps.UnitSystem.IMPERIAL
  };
  directionsService.route(request, function(response, status) {
    if (status == google.maps.DirectionsStatus.OK) {
      directionsDisplay.setDirections(response);
    }
  });
}
function getLatLng(w) {
  return new google.maps.LatLng(w.coords[0], w.coords[1]);
}
function getAddress(w) {
  return [w.address, w.city, w.state].join(", ");
}
function computeTotalDistance(result) {
  total = 0;
  var myroute = result.routes[0];
  for (i = 0; i < myroute.legs.length; i++) {
    total += myroute.legs[i].distance.value;
  }
  total = Math.floor( (total / 100)*0.621371192) / 10;
  document.getElementById("total").innerHTML = total + " mi";
  set_stats();
}
function set_stats() {
  var num_days = ( new Date(trip.finish_date) - new Date(trip.starting_date)) /86400000.0;
  var rest_days = num_days/7.0
  var milesPerDay = (total / num_days).toFixed(1);
  $(".traveling_days strong").html(num_days)
  $(".rest_days strong").html(rest_days)
  $(".miles_per_day strong").html(milesPerDay)
}
function update_stats() {
  var num_days = parseInt($(".traveling_days strong").text()) 
  var rest_days = parseInt($(".rest_days strong").text()) 
  var milesPerDay = (total / num_days).toFixed(1);
  $(".miles_per_day strong").html(milesPerDay)
}
