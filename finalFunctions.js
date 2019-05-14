var map;
var Stamen_TonerLite;
var buffer;
var bufferFeatures;
var blockGroupFeature;

var getStationsOptions = () => {
  const allStations = stationRidership.features;

  return allStations.map((station, index) => {
    return {
      label: station.properties.name,
      value: index + 1,
      coordinates: station.geometry.coordinates,
      line: station.properties.line,
      ridership: station.properties.Ridership,
      pctChange: station.properties.PctChange,
      rank: station.properties.Rank
    };
  });
};

// Initialize Leaflet Draw
var drawControl = new L.Control.Draw({
  draw: {
    polyline: false,
    polygon: false,
    circle: false,
    circlemarker: false,
    marker: true,
    rectangle: false
  }
});

// Function to load map
var loadMap = (coordinates, zoom, buffer) => {
  map = L.map('map', {
    center: [coordinates[0], coordinates[1] - 0.005],
    zoom: zoom
  });
  Stamen_TonerLite = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    minZoom: 0,
    maxZoom: 19,
    ext: 'png'
  }).addTo(map);

  map.addControl(drawControl);
};


var drawBuffer = (e, map, radius) =>{
  if (bufferFeatures) {
    map.removeLayer(bufferFeatures);
  }
  // The type of shape
  var type = e.layerType;
  // The Leaflet layer for the shape
  layer = e.layer;
  // The unique Leaflet ID for the layer
  var id = L.stamp(layer);
  bufferFeatures = layer;

  if (type == 'marker'){
    buffer = turf.buffer(bufferFeatures.toGeoJSON(), radius, {units: 'kilometers'});
    bufferFeatures = L.geoJSON(buffer);
    map.addLayer(bufferFeatures);
  }

  var ptsWithin = turf.pointsWithinPolygon(stationRidership, bufferFeatures.toGeoJSON());
  $('#stationNumber').html('Wooo! We\'ve found ' + ptsWithin.features.length + ' stations within ' + radius + ' km.');
};

var state = {
  count: 0,
  markers: [],
  line: undefined,
};

// Leaflet Draw runs every time a marker is added to the map. When this happens
var coordinateFlip = () => {
  var coordinates = '';
  state.markers.forEach(i => {
    coordinates = coordinates + i._latlng.lng + ',' + i._latlng.lat + ';';
  });
  return coordinates.substring(0,coordinates.length - 1);
};

// Optimize route
var token = 'pk.eyJ1IjoibGFxLWFucWkiLCJhIjoiY2pzNnBoM205MGVrMDQzbXZ2NmJ6NTFnYSJ9.CEYqhti041-OUUvXOSzAOA';
var optimizedRoute = () => {
  $.ajax({
    url: 'https://api.mapbox.com/optimized-trips/v1/mapbox/walking/' + coordinateFlip() + '?access_token=' + token,
    success: function(routestring){
      var coordinate = decode(routestring.trips[0].geometry);
      state.line = L.polyline(coordinate).addTo(map);
    }
  });
};

var addRouteStop = (e, map) => {
  // The type of shape
  var type = e.layerType;
  // The Leaflet layer for the shape
  var layer = e.layer;
  // The unique Leaflet ID for the
  var id = L.stamp(layer);

  var marker = L.marker(layer._latlng);

  state.count = state.count + 1;
  state.markers.push(marker);
  map.addLayer(marker);

  if (state.count == 2) {
    optimizedRoute();
    $('#clear_markers_section').removeClass('hidden');
  } else if (state.count > 2) {
    if (state.line) {
      map.removeLayer(state.line)
    };
    optimizedRoute();
  }
};

var resetApplication = () => {
  _.each(state.markers, (marker) => {
    map.removeLayer(marker);
  });
  map.removeLayer(state.line);

  state.count = 0;
  state.markers = []
  state.line = undefined;
  $('#clear_markers_section').addClass('hidden');
}

// Styles
var mainStyles = [
  {
    radius: 5,
    color: "#71785d",
    fillColor:"#71785d",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
  },
  {
    radius: 5,
    color: "#c8cc95",
    fillColor:"#c8cc95",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
  },
  {
    radius: 5,
    fillColor: "#e09d28",
    color: "#e09d28",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
  },
  {
    radius: 5,
    fillColor: "#c9306b",
    color: "#c9306b",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
  }
];

// Selected styles
var selectedStyles = [
  {
    radius: 8,
    color: "#71785d",
    fillColor:"#71785d",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
  },
  {
    radius: 8,
    color: "#c8cc95",
    fillColor:"#c8cc95",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
  },
  {
    radius: 8,
    fillColor: "#e09d28",
    color: "#e09d28",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
  },
  {
    radius: 8,
    fillColor: "#c9306b",
    color: "#c9306b",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
  }
];

// Block group style
var blockGroupStyle = (feature) => {
  return {
    fillColor: getColor(feature.properties.Pop_Density_Normalized),
    weight: 0.2,
    opacity: 0.5,
    color: 'white',
    dashArray: '3',
    fillOpacity: 0.5
  };
}

// Get color for block group choropleth map
var getColor = (populationDensity) => {
  return populationDensity > 0.14 ? '#800026' :
         populationDensity > 0.12 ? '#BD0026' :
         populationDensity > 0.1  ? '#E31A1C' :
         populationDensity > 0.08 ? '#FC4E2A' :
         populationDensity > 0.06 ? '#FD8D3C' :
         populationDensity > 0.04 ? '#FEB24C' :
         populationDensity > 0.02 ? '#FED976' :
                                    '#FFEDA0';
}

// Add popup when a block is clicked
var blockGroupPopup = (feature, layer) => {
  // does this feature have a property named station?
  if (feature.properties) {
    layer.bindPopup('Population Density: ' + Math.round(feature.properties.Pop_Density) + '<br>'+ 'Job Density: ' + Math.round(feature.properties.Job_Density));
  }
}

// Selected station icon
var redIcon = L.icon({
  iconUrl: 'icons8-location-off-48.png',
  iconSize: [48, 48], // size of the icon
});

// Add popup when a staton is clicked
var ridershipPopup = (feature, layer) => {
  // does this feature have a property named station?
  if (feature.properties && feature.properties.Station) {
    layer.bindPopup('Name: ' + feature.properties.Station + '<br>'+ 'Line: ' + feature.properties.line + '<br>' + 'Average Weekday Ridership: ' +feature.properties.Ridership + '<br>' + 'Change from 2016 to 2017: ' + feature.properties.PctChange + '<br>' + 'Rank: ' + feature.properties.Rank);
  }
}

// All points in dataset
var allPoints = (data) => {
  return L.geoJson(data, {
    onEachFeature: ridershipPopup,
    pointToLayer: (feature, latlng) => {
      if (feature.properties.Ridership >= 278 && feature.properties.Ridership < 6087) {
        return L.circleMarker(latlng, mainStyles[0]);
      } else if (feature.properties.Ridership >= 6087 && feature.properties.Ridership < 9570) {
        return L.circleMarker(latlng, mainStyles[1]);
      } else if (feature.properties.Ridership >= 9570 && feature.properties.Ridership < 16759) {
        return L.circleMarker(latlng, mainStyles[2]);
      } else if (feature.properties.Ridership >= 16759) {
        return L.circleMarker(latlng, mainStyles[3]);
      }
    }
  });
};

// Line styles
var lineStyle = {
  'color': '#bcbcbc',
  'weight': 3,
  'opacity': 1
};

// selected points in dataset
var selectedPoints = (data, name) => {
  return L.geoJson(data, {
    onEachFeature: ridershipPopup,
    pointToLayer: (feature, latlng) => {
      if (feature.properties.Station == name) {
        return L.marker(latlng,{icon: redIcon});
      } else if (feature.properties.Ridership >= 278 && feature.properties.Ridership < 6087) {
        return L.circleMarker(latlng, selectedStyles[0]);
      } else if (feature.properties.Ridership >= 6087 && feature.properties.Ridership < 9570) {
        return L.circleMarker(latlng, selectedStyles[1]);
      } else if (feature.properties.Ridership >= 9570 && feature.properties.Ridership < 16759) {
        return L.circleMarker(latlng, selectedStyles[2]);
      } else if (feature.properties.Ridership >= 16759) {
        return L.circleMarker(latlng, selectedStyles[3]);
      }
    }
  });
};


var addStationLegend = (map) =>{
  var legend = L.control({position: 'bottomright'});
  legend.onAdd = (map) => {
    var div = L.DomUtil.create('div', 'info legend');
    labels = ['<strong>Categories</strong>'];

    for (var i = 0; i < stationLegendMap.length; i++) {
      div.innerHTML += '<p><i class="fa fa-circle" aria-hidden="true" style="color:' + stationLegendMap[i].color + '"></i>&nbsp;' + stationLegendMap[i].label + '</p>';
    }
    return div;
  }
  legend.addTo(map);
};

var addBlockGroupLegend = (map) =>{
  var legend = L.control({position: 'bottomright'});
  legend.onAdd = (map) => {
    var div = L.DomUtil.create('div', 'info legend');
    labels = ['<strong>Categories</strong>'];

    for (var i = 0; i < blockGroupLegendMap.length; i++) {
      div.innerHTML += '<p><i class="fa fa-square-full" aria-hidden="true" style="color:' + blockGroupLegendMap[i].color + '"></i>&nbsp;' + blockGroupLegendMap[i].label + '</p>';
    }
    return div;
  }
  legend.addTo(map);
};

var getBlockGroupLegend = (map) =>{
  var legend = L.control({position: 'bottomright'});
  legend.onAdd = (map) => {
    var div = L.DomUtil.create('div', 'info legend');
    labels = ['<strong>Categories</strong>'];

    for (var i = 0; i < blockGroupLegendMap.length; i++) {
      div.innerHTML += '<p><i class="fa fa-square-full" aria-hidden="true" style="color:' + blockGroupLegendMap[i].color + '"></i>&nbsp;' + blockGroupLegendMap[i].label + '</p>';
    }
    return div;
  }
  return legend;
};




var stationLegendMap = [
  {color: "#71785d", label: "Ridership below 1st quantile"},
  {color: "#c8cc95", label: "Ridership between 1st and 2nd quantile"},
  {color: "#e09d28", label: "Ridership between 2nd and 3rd quantile"},
  {color: "#c9306b", label: "Ridership above 3rd quantile"}
];

var blockGroupLegendMap = [
  {color: "#800026", label: "populationDensity > 0.14"},
  {color: "#BD0026", label: "0.12 < populationDensity < 0.14"},
  {color: "#E31A1C", label: "0.1 < populationDensity < 0.12"},
  {color: "#FC4E2A", label: "0.08 < populationDensity < 0.1"},
  {color: "#FD8D3C", label: "0.06 < populationDensity < 0.08"},
  {color: "#FEB24C", label: "0.04 < populationDensity < 0.06"},
  {color: "#FED976", label: "0.02 < populationDensity < 0.04"},
  {color: "#FFEDA0", label: "0 < populationDensity < 0.02"}
];


var getColor = (populationDensity) => {
  return populationDensity > 0.14 ? '#800026' :
         populationDensity > 0.12 ? '#BD0026' :
         populationDensity > 0.1  ? '#E31A1C' :
         populationDensity > 0.08 ? '#FC4E2A' :
         populationDensity > 0.06 ? '#FD8D3C' :
         populationDensity > 0.04 ? '#FEB24C' :
         populationDensity > 0.02 ? '#FED976' :
                                    '#FFEDA0';
}
