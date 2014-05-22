var map, geojson, locationGroup, materials, point;
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
		materials = data;
    $(data).each(function (i, mat) {
			var option = $("<option>"+mat.Type+"</option>").appendTo("select");
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
			var geom = data.results[0].geometry,
					poly = L.multiPolygon([]),
					latlngs = [];
			$(geom.rings).each(function (i, r) {
				var ring = [];
				$(r).each(function(j, p) {

					ring.push({lon:p[0], lat:p[1]})

				});
				latlngs.push(ring);
			});
			poly.setLatLngs(latlngs);
			findNearest(poly.getBounds().getCenter());
			addLocationToMap(poly.getBounds().getCenter());
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

function getPlaceTypes () {
	var material = $("select option:selected").val(),
		list = [];
	var matches = $(materials).filter(function () {
		return this.Type === material;
	});
	if (matches.length > 0) {
		if (matches[0].convenience) {
			list.push("convenience");
		}
		if (matches[0].multimaterial) {
			list.push("multimaterial");
		}
		if (matches[0].household) {
			list.push("household");
		}
		if (matches[0].municipal) {
			list.push("municipal");
		}
	}
	return list;
}

function findNearest(latlng) {

  var placeTypes = getPlaceTypes(),
		distance = 0,
    closest = null,
		cnt = 0;
	point = latlng;
  $(geojson.getLayers()).each(function(i, l) {
		if ($.inArray(l.feature.properties.category, placeTypes) > -1) {
			var coords = L.latLng(l.feature.geometry.coordinates[1], l.feature.geometry.coordinates[0])//l.feature.geometry.coordinates.reverse();
			if (cnt === 0) {
				distance = latlng.distanceTo(coords);
				closest = l;
			}
			if (latlng.distanceTo(coords) < distance) {
				distance = latlng.distanceTo(coords);
				closest = l;
			}
			cnt += 1;
		}
  });
  var toLocation = L.latLng(closest.feature.geometry.coordinates[1], closest.feature.geometry.coordinates[0]);
  //var toLocation = closest.feature.geometry.coordinates.reverse();
  //map.setView(closest.feature.geometry.coordinates.reverse(), 16);
  map.fitBounds([latlng, toLocation], {padding: [100,100]});
  var dirLink = "https://www.google.com/maps/dir/"+latlng.lat+","+latlng.lng+"/"+toLocation.lat+","+toLocation.lng;
  //closest.getPopup().setContent(closest.getPopup().getContent()+"<br/><a class='directions' href='"+dirLink+"' target='_blank'>Get Directions</a>");
  closest.openPopup();
	//alert($(".leaflet-popup").length);
	$(".leaflet-popup-content .directions").remove();
	$(".leaflet-popup-content").append("<div class='directions'><br/><a href='"+dirLink+"' target='_blank'>Get Directions</a></div>");
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
	$("select").change(function () {
		if (point) {
			findNearest(point);
		}
	});
});
