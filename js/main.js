var map, geojson;
function findNearest(latlng) {
  var distance = 0,
    closest = null;
  $(geojson.getLayers()).each(function(i, l) {
    var coords = l.feature.geometry.coordinates.reverse();
    if (i === 0) {
      distance = latlng.distanceTo(coords);
    }
    if (latlng.distanceTo(coords) < distance) {
      distance = latlng.distanceTo(coords);
      closest = l;
    }
  });
  map.setView(closest.feature.geometry.coordinates.reverse(), 16);
  closest.openPopup();
}
function createMap() {
  map = L.map('map').setView([35.81889, -78.64447], 11);
  L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}').addTo(map);
  $.getJSON("facilities.geojson", function (data) {
    geojson = L.geoJson(data, {
      onEachFeature: function (feature, layer) {
        layer.bindPopup('<strong>'+feature.properties.operator+'</strong><br/>'+feature.properties.type+'<br/>'+feature.properties.address);
      }
    }).addTo(map);
  });
   var locate = L.control.locate().addTo(map);
   map.on("locationfound", function (loc) {
     locate.stopLocate();
     map.setView(loc.latlng, 17);
     findNearest(loc.latlng);
   });
}
$(document).ready(function () {
  createMap();
});
