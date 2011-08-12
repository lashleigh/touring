function computeTotalDistance(result) {
  total = 0;
  var myroute = result.routes[0];
  for (i = 0; i < myroute.legs.length; i++) {
    total += myroute.legs[i].distance.value;
  }
  $("#day_distance").val(total); //Store in the database as meters
}
function toMiles(num) {
  return num*0.000621371192;
}
function toFeet(num) {
  return num*3.2808399;
}

function save_waypoints(result) {
  $("#day_encoded_path").val(result.routes[0].overview_polyline.points);
  $("#day_stop_location").val(result.routes[0].legs[0].end_address);
  
  var path = directionsDisplay.directions.routes[0].legs[0].via_waypoints.map(function(a) { return [a.lat(), a.lng()];})
  $("#day_google_waypoints").val(JSON.stringify(path))
}
function drawPath(path) {
  // Create a PathElevationRequest object using the encoded overview_path
  var pathRequest = {
    'path': path,
    'samples': Math.min(path.length*2, 512)
  }
  // Initiate the path request.
  elevator.getElevationAlongPath(pathRequest, draw_with_raphael);
}
function draw_elevation_d3(results, status) {
  var elevations = results.map(function(r) { return r.elevation; });
  var smooth = [];
  for(var i=0; i < elevations.length-1; i++) {
    smooth[i] = (elevations[i]+elevations[i+1])/2;
  }
  total = 80000;
  var w = $("#elevation_chart").innerWidth(), //560,
      h = $("#elevation_chart").innerHeight(), // d3.max(elevations),
      n = 4,
      m = elevations.length,
      x = d3.scale.linear().domain([0, m - 1]).range([0, w]),
      y = d3.scale.linear().domain([0, d3.max(elevations)]).range([h - 20, 20]),
      z = d3.scale.linear().domain([0, Math.PI/4, Math.PI / 2, 3*Math.PI/4, Math.PI]).range(["#f00", "#ff0", "#000", "#0ff", "#0f0"]);
  
  var svg = d3.select("#elevation_chart").append("svg:svg")
    .attr("width", w)
    .attr("height", h);

  var line = d3.svg.line()
    .x(function(d) { return x(d[0]); })
    .y(function(d) { return y(d[1]); });

    var g = svg.selectAll("g")
    .data([elevations])
    .enter().append("svg:g");

    var path = g.selectAll("path")
    .data(segments)
    .enter().append("svg:path")
    .attr("d", line)
    .style("stroke", function(d) { return z(Math.atan2(d[1][0] - d[0][0], d[1][1] - d[0][1])); });

    var circle = g.selectAll("circle")
    .data(Object)
    .enter().append("svg:circle")
    .attr("cx", function(d, i) { return x(i); })
    .attr("cy", function(d, i) { return y(d); })
    .attr("r", 3);
};
  // Produce an array of two-element arrays [x,y] for each segment of values.
function segments(values) {
  var segments = [], i = 0, n = values.length
    while (++i < n) segments.push([[i - 1, values[i - 1]], [i, values[i]]]);
  return segments;
}
function draw_with_raphael(results, status) {
  $("#elevation_chart").html("");
  var r = Raphael("elevation_chart");
  r.g.txtattr.font = "12px 'Fontin Sans', Fontin-Sans, sans-serif";
  var elevations = results;
  var x=[];
  var y=[];
  var delta = toMiles(total) / results.length
  var distance = 0;
  for (var i = 1; i < results.length-1; i++) {
    var ele0 = (elevations[i-1].elevation + elevations[i].elevation)/2;
    var ele1 = (elevations[i].elevation + elevations[i+1].elevation)/2;
    if( ele0 < ele1) {
      netLoss += (ele1-ele0); 
    } else {
      netGain += (ele0-ele1);
    }
    distance +=delta;
    x.push(distance);
    y.push(toFeet(ele0));
    //data.addRow([distance, ele0.toFeet()]);
  }
  var width = window.innerWidth-$("#detail_panel").outerWidth()-30;
  var background = r.rect(20,20,width,175, 10);

  background.attr({
    //fill: "90-#fff-#000",
    fill: "#000",
    opacity: 0.5
  });
  var w = $("#elevation_chart").innerWidth(), 
      h = $("#elevation_chart").innerHeight(),
      wpad = 50,
      hpad = 30;
  var lines = r.g.linechart(wpad, hpad, w-wpad, h-hpad-20, x, y, {nostroke: false, axis: "0 0 1 1", symbol: "o", smooth: true}).hoverColumn(function () {
    this.tags = r.set();
    for (var i = 0; i < results.length-2; i++) {
      this.tags.push(r.g.tag(this.x, this.y[i], this.values[i], 160, 10).insertBefore(this).attr([{fill: "#fff"}, {fill: this.symbols[i].attr("fill")}]));
    }
  }, function () {
    this.tags && this.tags.remove();
  });
  lines.symbols.attr({r: 3});
  // lines.lines[0].animate({"stroke-width": 6}, 1000);
  // lines.symbols[0].attr({stroke: "#fff"});
  // lines.symbols[0][1].animate({fill: "#f00"}, 1000);
};

// Takes an array of ElevationResult objects, draws the path on the map
// and plots the elevation profile on a Visualization API ColumnChart.
function plotElevation(results, status) {
  if (status == google.maps.ElevationStatus.OK) {
    elevations = results;
    var is_metric = (unit_system == "METRIC");

    var data = new google.visualization.DataTable();
    data.addColumn('number', 'Sample');
    data.addColumn('number', 'Elevation');
    var distance = 0;
    // TODO The code redundancy here is irritating
    if(is_metric) {
      var delta = (total/1000) / results.length
      for (var i = 1; i < results.length-1; i++) {
        var ele0 = (elevations[i-1].elevation + elevations[i].elevation)/2;
        var ele1 = (elevations[i].elevation + elevations[i+1].elevation)/2;
        if( ele0 < ele1) {
          netLoss += (ele1-ele0); 
        } else {
          netGain += (ele0-ele1);
        }
        distance +=delta;

        data.addRow([distance, ele0]);
      }
    } else {
      var delta = toMiles(total) / results.length
      for (var i = 1; i < results.length-1; i++) {
        var ele0 = (elevations[i-1].elevation + elevations[i].elevation)/2;
        var ele1 = (elevations[i].elevation + elevations[i+1].elevation)/2;
        if( ele0 < ele1) {
          netLoss += (ele1-ele0); 
        } else {
          netGain += (ele0-ele1);
        }
        distance +=delta;

        data.addRow([distance, toFeet(ele0)]);
      }
    }
    // Draw the chart using the data within its DIV.
    document.getElementById('elevation_chart').style.display = 'block';
    chart.draw(data, {
      width: 640,
      height: 200,
      legend: 'none',
      titleY: is_metric ? 'Elevation (m)' : 'Elevation (ft)',
      titleX: is_metric ? 'Distance (km)' : 'Distance (mi)'
    });
  }
  else {
    alert("Elevation request was not successful for the following reason: " + status);
  }
}

function haversine(pt1, pt2) {
  var lat1 = pt1.lat();
  var lon1 = pt1.lng();
  var lat2 = pt2.lat();
  var lon2 = pt2.lng();

  var R = 6371; // km
  var dLat = (lat2-lat1).toRad();
  var dLon = (lon2-lon1).toRad();
  var lat1 = lat1.toRad();
  var lat2 = lat2.toRad();

  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
  Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; 
  return d;
}
function toRad(num) {
  return num*Math.PI / 180;
}
function toDeg(num) {
  return num*180 / Math.PI;
}

function decodeLevels(encodedLevelsString) {
  var decodedLevels = [];

  for (var i = 0; i < encodedLevelsString.length; ++i) {
    var level = encodedLevelsString.charCodeAt(i) - 63;
    decodedLevels.push(level);
  }
  return decodedLevels;
}
function watch_waypoints() {
  clear_markers(waypoint_markers);
  var wpts = directionsDisplay.directions.routes[0].legs[0].via_waypoints;
  for(var i=0; i<wpts.length; i++) {
    var marker = new google.maps.Marker({
        map: map,
        //icon: "/images/blue_dot.png",
        position: new google.maps.LatLng(wpts[i].lat(), wpts[i].lng()),
        title: i.toString()
        });
    waypoint_markers.push(marker);
    google.maps.event.addListener(marker, 'click', function() {
        infowindow.setContent("double click to delete this waypoint");
        infowindow.open(map, this);
    });
    google.maps.event.addListener(marker, 'dblclick', function() {
        wpts.splice(parseInt(this.title), 1);
        calcRoute(wpts);
        directionsDisplay.setOptions({ preserveViewport: true, draggable: true});
    });
  }
}
function clear_markers(ma) {
  if(ma) {
    for(var i=0; i<ma.length; i++){
      ma[i].setMap(null);
    }
    ma.length = 0;
  }
}
function convert(h, s, v) {
  var chroma = s*v;
  var hPrime = (h%360)/60;
  var x = chroma* (1-Math.abs(hPrime % 2 - 1))

  var rgb_prime = rgbPrime(Math.floor(hPrime), chroma, x);

  var m = v-chroma;
  var rgb = []
  var hex = [] 
  for(i = 0; i<3; i++) {
    rgb[i] = 255*(rgb_prime[i]+m);
    hex[i] = toHex(rgb[i]);  
  }
  return "#"+hex.join("");
}
function rgbPrime(exp, chroma, x) {
  switch(exp) {
    case 0: return [chroma, x, 0]; break;
    case 1: return [x, chroma, 0]; break;
    case 2: return [0, chroma, x]; break;
    case 3: return [0, x, chroma]; break;
    case 4: return [x, 0, chroma]; break;
    case 5: return [chroma, 0, x]; break;
  }
}
function toHex(n) {
 n = parseInt(n,10);
 if (isNaN(n)) return "00";
 n = Math.max(0,Math.min(n,255));
 return "0123456789ABCDEF".charAt((n-n%16)/16)
      + "0123456789ABCDEF".charAt(n%16);
}

function searchFoursquare() {
  clear_markers(foursquare_markers);
  foursquare_results_ids.length = 0;
  $("#VENUES_details #fq_errors").html("");
  $("#VENUES_details #fq_results").html("");

  var coords = [map.getCenter().lat(), map.getCenter().lng()];
  $("#coords").val(coords);
  $.post("/waypoints/search_foursquare", $("#foursquare_form").serialize(), function(res, text_status) {
    if(res.errors) {
      $("#VENUES_details #fq_errors").html('<div class="fq_errors">'+res.errors+'</div>');
    }
    else {
      if(res.nearby) { foursquare_result_array = res.nearby; }
      else if(res.places) { foursquare_result_array = res.places; }
      if(foursquare_result_array.length > 0) {
        $("#VENUES_details #fq_results").html(foursquare_result_array.length.toString() + " venues were found");
        $(foursquare_result_array).each(drawSearchResult);
      } else {
        $("#VENUES_details #fq_errors").html('Sorry no venues were found that match '+$("#query_fq").val());
      }
    }
    }, "json");
  return false;
}

function drawSearchResult(i, res) {
  res = res.json;
  var venue_id = "venue_"+res.id;
  var pos = new google.maps.LatLng(res.location.lat, res.location.lng);
  var marker = new google.maps.Marker({
    position: pos,
    map: map,
    title: res.name,
    icon: "/images/red_marker.png"
    //draggable: true,
  });
  foursquare_markers.push(marker);
  foursquare_results_ids.push("#"+venue_id);
  new google.maps.event.addListener(marker, 'click', function() {
    infowindow.setContent('<div class="place_form"><h2><a href="https://foursquare.com/venue/'+ res.id+'">'+res.name+'</a></h2></div>'+
                          '<input class="save_waypoint" id="save_'+i+'" name="commit" type="submit" value="Save">');
    infowindow.open(map, marker);
  });
  new google.maps.event.addListener(marker, 'mouseover', function() {
    $("#"+venue_id).animate({backgroundColor: "#005555"}, 'fast'); 
  });
  new google.maps.event.addListener(marker, 'mouseout', function() {
    $("#"+venue_id).animate({backgroundColor: "#ffffff"}, 'fast'); 
  });
  $("#VENUES_details #fq_results").append('<div id="'+venue_id+'">'+res.name+'  '+res.location.city+', '+res.location.state+'</div>');
  $("#"+venue_id).hover(
    function() { 
      marker.setIcon("/images/yellow_marker.png");
      $(this).animate({backgroundColor: "#005555"}, 'fast'); 
    }, function() {
      marker.setIcon("/images/red_marker.png");
      $(this).animate({backgroundColor: "#ffffff"}, 'fast'); 
    }
  ).click(function() {
    map.panTo(pos);
    map.setZoom(14);
    infowindow.setContent('<div class="place_form"><h2><a href="https://foursquare.com/venue/'+ res.id+'">'+res.name+'</a></h2></div>'+
                          '<input class="save_waypoint" id="save_'+i+'" name="commit" type="submit" value="Save">');
    infowindow.open(map, marker);
    }
  );

}
function venue_html(v) {
  return '<div id="venue_'+v.id+'">'+v.name+'  '+v.location.city+', '+v.location.state+'</div>'
}
