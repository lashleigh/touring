var map;
var bounds = new google.maps.LatLngBounds();
var infoWindow = new google.maps.InfoWindow();
var normalized;

$(function() {
  var myOptions = {
    zoom: 7,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    center: new google.maps.LatLng(45, -120)
  };
  map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);

  var d = trip.days.map(function(day) {return day.distance;});
  var maxDistance = Math.max.apply(null, d);
  var minDistance = Math.min.apply(null, d);
  // Multiplying by 180 mean that the min and max values will be at opposite sides of the color wheel
  normalized = d.map(function(num){return (num-minDistance)/(maxDistance-minDistance)*180 + 90;})
  set_stats();
  $(trip.days).each(drawDays);
  map.fitBounds(bounds);
});

function drawDays(i, day) {
  var pathOptions = {
    path: google.maps.geometry.encoding.decodePath(day.encoded_path),
    //levels: decodeLevels(prev_day.encoded_levels), I would need to add encoded levels first
    strokeColor: convert(normalized[i], 1, 1), //'#0000CC',
    opacity: 0.4,
    map: map
  }
  var polyline = new google.maps.Polyline(pathOptions);
  new google.maps.event.addListener(polyline, 'mouseover', function() {
    this.setOptions({strokeWeight: 8});
  });
  new google.maps.event.addListener(polyline, 'mouseout', function() {
    this.setOptions({strokeWeight: 4});
  });

  new google.maps.event.addListener(polyline, 'click', function(event) {  
  infoWindow.setContent('<div><p><a href="/trips/'+day.trip_id+'/days/'+trip.day_ids.indexOf(day.id)+'">'+day.stop_location+'</a></p><p>'+day.distance.toMiles()+' mi </p></div>');
    infoWindow.setPosition(event.latLng);
    infoWindow.open(map);
  });
  bounds.extend(pathOptions.path[0])
  bounds.extend(pathOptions.path[pathOptions.path.length-1])
}

function set_stats() {
  var total = trip.days.map(function(day) {return day.distance;}).reduce(function(a,b) {return a+b;})

  var num_days = trip.days.length; //( new Date(trip.finish_date) - new Date(trip.start_date)) /86400000.0;
  var rest_days = Math.round(num_days/7);
  var milesPerDay = (total / num_days).toMiles();
  $(".traveling_days strong").html(num_days)
  $(".rest_days strong").html(rest_days)
  $(".miles_per_day strong").html(milesPerDay)
}

