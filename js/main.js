var map, geojson, locationGroup;
function addLocationToMap(latlng) {
		var icon = L.icon({
			iconUrl: 'img/location.png',
			iconSize: [14,14]
		});
		locationGroup.clearLayers();
		locationGroup.addLayer(L.marker(latlng, {icon:icon}));
}

function getMaterials () {
  $.getJSON("materials.json", function (data) {
    $(data).each(function (i, mat) {
      $("select").append("<option>"+mat.Type+"</option>");
    });
  });
}

function mapProperty (pin) {
	$.ajax({
		url: 'https://maps.raleighnc.gov/arcgis/rest/services/Parcels/MapServer/find',
		dataType: 'jsonp',
		data: {
			f: 'json',
			searchFields: "PIN_NUM",
			returnGeometry: true,
			searchText: pin,
			layers: "0,1",
			sr: 4326
		},
	})
	.done(function(data) {
		if (data.results.length > 0) {
			//parcelGraphic.clearLayers();
			var geom = data.results[0].geometry;
			//agsGeometry = geom;
			$(geom.rings).each(function (i, r) {
				var ring = [];
				$(r).each(function(j, p) {

					ring.push({lon:p[0], lat:p[1]})

				});
				var poly = L.polygon(ring);//.addTo(parcelGraphic);
				map.fitBounds(poly.getBounds());
				geometry = poly;
        findNearest(poly.getBounds().getCenter());
        addLocationToMap(poly.getBounds().getCenter());
			});
			//checkSelectedValue(account);
		}
	});
}
function searchByAddress (address, type) {
	$.ajax({
		url: 'http://mapstest.raleighnc.gov/arcgis/rest/services/Parcels/MapServer/exts/PropertySOE/RealEstateSearch',
		dataType: 'jsonp',
		data: {
			f: 'json',
			type: type,
			values: '["'+address+'"]'
		},
	})
	.done(function(data) {
		account = data.Accounts[0];
		mapProperty(account.pin);
	});
}
function setAddressSearch () {
  $('.typeahead').typeahead({
			name: "address",
			remote:{
				url: "http://mapstest.raleighnc.gov/arcgis/rest/services/Parcels/MapServer/exts/PropertySOE/AutoComplete?f=json&type=address&input=%QUERY",
				filter: function (resp) {
					return resp.Results;
				}
			}
    }).on("typeahead:selected",function (obj, datum, dataset) {
		searchByAddress(datum.value, dataset);
	});;
}
function findNearest(latlng) {
  var distance = 0,
    closest = null;
  $(geojson.getLayers()).each(function(i, l) {
    var coords = L.latLng(l.feature.geometry.coordinates[1], l.feature.geometry.coordinates[0])//l.feature.geometry.coordinates.reverse();
    if (i === 0) {
      distance = latlng.distanceTo(coords);
    }
    if (latlng.distanceTo(coords) < distance) {
      distance = latlng.distanceTo(coords);
      closest = l;
    }
  });
  var toLocation = L.latLng(closest.feature.geometry.coordinates[1], closest.feature.geometry.coordinates[0]);
  //var toLocation = closest.feature.geometry.coordinates.reverse();
  //map.setView(closest.feature.geometry.coordinates.reverse(), 16);
  map.fitBounds(L.polyline([latlng, toLocation]).getBounds());
  var dirLink = "https://www.google.com/maps/dir/"+latlng.lat+","+latlng.lng+"/"+toLocation.lat+","+toLocation.lng;
  closest.getPopup().setContent(closest.getPopup().getContent()+"<br/><a class='directions' href='"+dirLink+"' target='_blank'>Get Directions</a>");
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
  locationGroup = L.featureGroup().addTo(map);
   var locate = L.control.locate().addTo(map);
   map.on("locationfound", function (loc) {
     locate.stopLocate();
     map.setView(loc.latlng, 17);
     findNearest(loc.latlng);
     addLocationToMap(loc.latlng);
   });
}
$(document).ready(function () {
  createMap();
  setAddressSearch();
  getMaterials();
});
