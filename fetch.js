var map;
var MARKER_MAP;
var infowindow;

var MAP_CENTER = { lat: 49.2681985, lng: -123.0017488, zoom: 17 };

function fetchStuff() {
	CENTRES.EX_LATLNGBOUNDS = new google.maps.LatLngBounds(new google.maps.LatLng(49.624121, -123.426610), new google.maps.LatLng(49.235120, -123.976766));
	MARKER_MAP = new google.maps.Map(document.getElementById('map'), {
		center: { lat: MAP_CENTER.lat, lng: MAP_CENTER.lng },
		zoom: MAP_CENTER.zoom
	});

    setInterval(function() { doSearch(CTR); }, 1000);
}

function doSearch(ind) {
    if (CTR < CENTRES.names.length) {
        var centre = { lat: CENTRES.lats[ind], lng: CENTRES.longs[ind]};

        map = new google.maps.Map(document.getElementById('fmap'), {
            center: centre,
            zoom: CENTRES.zooms[ind]
        });

        infowindow = new google.maps.InfoWindow();
        var service = new google.maps.places.PlacesService(map);
        switch (CENTRES.radii[ind]) {
            case -1:
                switch (CENTRES.names[ind]) {
                    case "Example of a special one you have to make bounds for":
                        console.log("Bounded nearby search for " + CENTRES.names[ind]);
                        console.log(CENTRES.EX_LATLNGBOUNDS);
                        service.nearbySearch({
                            bounds: CENTRES.EX_LATLNGBOUNDS,
                            type: ['establishment']
                        }, callback);
                        break;
                }
                break;
            default:
                console.log("Nearby search for " + CENTRES.names[ind]);
                service.nearbySearch({
                    location: centre,
                    radius: CENTRES.radii[ind],
                    type: ['establishment'],
                }, function(r, s, p) {
                    callback(r, s, p);
                });
                break;
        }
    } else if (CTR === CENTRES.names.length) {
	    console.log("Done!");
    }
    CTR++;
}

function callback(results, status, pagination) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
        if (results === undefined) {
            console.log("================== Undefined results??? ====================")
        } else { 
            console.log("Searching near " + results[0].name + " at " + results[0].vicinity);
        }
        for (var i = 0; i < results.length; i++) {
            createMarker(results[i]);
        }
        storeResults(results);
        if (pagination.hasNextPage) {
            setTimeout(function() {
                console.log("loading page");
                pagination.nextPage();
            }, 2500);
        } else {
            console.log("all results loaded.");
        }
    } else {
        console.log("======================= Places service status not OK: " + status);
    }
}

function createMarker(place) {
    var placeLoc = place.geometry.location;
    var marker = new google.maps.Marker({
        map: MARKER_MAP,
        position: place.geometry.location
    });

    google.maps.event.addListener(marker, 'click', function () {
        infowindow.setContent(place.name);
        infowindow.open(MARKER_MAP, this);
    });
}

function storeResults(result_list) {
    console.log("There are " + result_list.length + " locations")
    for (var res of result_list) {
        PLACE_LIST.push(res);
        for (var type of res.types) {
            if (TYPE_LIST.has(type)) {
                TYPE_LIST.set(type, TYPE_LIST.get(type) + 1);
            } else {
                TYPE_LIST.set(type, 1);
            }
        }
    }
    tl_s = [];
    for (var k of TYPE_LIST) {
        tl_s.push(k);
    }

    tl_s.sort(function (a, b) {
        return b[1] - a[1];
    });
    TYPE_LIST = new Map(tl_s);
    PLACESTATE_UPDATED = true;
}
