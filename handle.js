var CENTRES = {
    names: ["Brentwood Town Centre"],

    radii: [160], // -1 if it's well-defined in google maps

    zooms: [18], // higher numbers mean smaller complexes

    lats:  [49.268312],

    longs: [-123.000469],
    
    places: [],

    printPlace: function(index) {
        console.log("Name: " + CENTRES.names[index]);
        console.log("Radius: " + ((CENTRES.radii == -1) ? "Doesn't matter" : CENTRES.radii[index]) + "m");
        console.log("Coordinates: " + CENTRES.lats[index] + ", " + CENTRES.longs[index]);
    },
    EX_LATLNGBOUNDS: null
};

var PLACESTATE_UPDATED = false;
var PLACE_LIST = [];
var WEIRD_PLACES = new Map(); // places that should be manually checked. format: str => place object
var TYPE_LIST = new Map();
var cur_push_index = -1;
var CTR = 0;
var TYPE_CONV_LOOKUP = new Map(); // map pitfall: [x] = y notation does NOT put any values into .values() whereas .set(x, y) does 
TYPE_CONV_LOOKUP.set("Restaurant", ["meal_delivery", "meal_takeaway", "restaurant", "cafe"]);
TYPE_CONV_LOOKUP.set("Food Store", ["convenience_store", "bakery", "food"]);
TYPE_CONV_LOOKUP.set("Drug Store", ["pharmacy", "health"]);
TYPE_CONV_LOOKUP.set("Fashion Store", ["clothing_store"]);
TYPE_CONV_LOOKUP.set("Dry Cleaners", ["laundry"]);
TYPE_CONV_LOOKUP.set("Financial Institution", ["atm", "accounting", "bank", "finance"]);
TYPE_CONV_LOOKUP.set("Insurance, Travel, Real Estate", ["real_estate_agency", "travel_agency", "insurance_agency"]);
TYPE_CONV_LOOKUP.set("Home Electronics", ["electronics_store"]);
TYPE_CONV_LOOKUP.set("Supermarket", ["grocery_or_supermarket"]);
TYPE_CONV_LOOKUP.set("Department Store", ["department_store"]);
TYPE_CONV_LOOKUP.set("Shoe Store", ["shoe_store"]);
TYPE_CONV_LOOKUP.set("Book Store", ["book_store"]);
TYPE_CONV_LOOKUP.set("Other", ["liquor_store", "bicycle_store", "hair_care", "jewelry_store", "florist", "pet_store", "movie_rental", "furniture_store", "home_goods_store", "store"]);
TYPE_CONV_LOOKUP.set("Not a store", ["shopping_mall", "gym", "rv_park", "lodging", "park", "fire_station", "hospital", "parking", "dentist", "bus_station", "school", "bar", "transit_station", "spa", "plumber", "art_gallery", "post_office", "library", "lawyer"]);

const HAVERSINE_R = 6371;

function Rad(n) {
    return n * Math.PI / 180;
}

function haversineDistance(p1, p2) {
    var lt1 = (p1.geometry === undefined) ? CENTRES.lats[p1] : p1.geometry.location.lat();
    var lg1 = (p1.geometry === undefined) ? CENTRES.longs[p1] : p1.geometry.location.lng();
    var lt2 = (p2.geometry === undefined) ? CENTRES.lats[p2] : p2.geometry.location.lat();
    var lg2 = (p2.geometry === undefined) ? CENTRES.longs[p2] : p2.geometry.location.lng();
    var latr = Rad(lt2 - lt1);
    var lngr = Rad(lg2 - lg1); 
    var a = Math.sin(latr/2) * Math.sin(latr/2) + Math.cos(Rad(lt1)) * Math.cos(Rad(lt2)) * Math.sin(lngr/2) * Math.sin(lngr/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return HAVERSINE_R * c; 
}

function sortPlacesIntoLocations() {
    if (PLACESTATE_UPDATED) {
        PLACESTATE_UPDATED = false;
        var ctr = 0;
        for (var p of PLACE_LIST) {
            var closest_centre = 0;
            var closest_dist = haversineDistance(p, 0);
            for (var i = 1; i < CENTRES.names.length; i++) {
                var dist = haversineDistance(p, i);
                if (dist < closest_dist) {
                    closest_dist = dist;
                    closest_centre = i;
                }
            }
            if (CENTRES.places[closest_centre] === undefined) {
                CENTRES.places[closest_centre] = [p];
            } else {
                CENTRES.places[closest_centre].push(p);
            }
            ctr++;
        }
        console.log("Sorted " + ctr + " places");
    } else {
        console.log("Nothing new to sort");
    }

    for (var i = 0; i < CENTRES.places.length; i++) { // deduplication
        CENTRES.places[i] = CENTRES.places[i].filter((el, i, arr) => arr.map(function(p){return JSON.stringify(p).slice(0, JSON.stringify(p).indexOf('"place_id"'))}).indexOf(JSON.stringify(el).slice(0, JSON.stringify(el).indexOf('"place_id"'))) === i) // Readable!
    }
}

function getPlaceIndicatorFunctions(places) { // return a map of "indicator functions" (types) sorted by count given an array of places
    var weird_ctr = 0;
    var typemap = new Map();
    for (var p of places) {
        var matched = false;
        for (var type of p.types) {
            for (var indf of TYPE_CONV_LOOKUP.keys()) {
                if (TYPE_CONV_LOOKUP.get(indf).indexOf(type) != -1) {
                    if (typemap.has(indf)) {
                        typemap.set(indf, typemap.get(indf).concat(p.name));
                    } else {
                        typemap.set(indf, [p.name]);
                    }
                    matched = true;
                    break;
                }
                if (matched) {
                    break;
                }
            }
        }
        if (!matched) {
            weird_ctr++;
            if (WEIRD_PLACES.has(CENTRES.names[CENTRES.places.indexOf(places)])) {
                WEIRD_PLACES.get(CENTRES.names[CENTRES.places.indexOf(places)]).push(p);
            } else {
                WEIRD_PLACES.set(CENTRES.names[CENTRES.places.indexOf(places)], [p]);
            }
        }
    }
    console.log("Sorted out " + places.length + " unique places at " + CENTRES.names[CENTRES.places.indexOf(places)] + ", " + weird_ctr + " could not be categorized.");
    tl_s = []; // sort
    for (var k of typemap) {
        tl_s.push(k);
    }

    tl_s.sort(function (a, b) {
        return b[1] - a[1];
    });

    typemap = new Map(tl_s);

    for (var k of typemap.keys()) { // dedup
        typemap.set(k, typemap.get(k).filter((el, i, arr) => arr.indexOf(el) === i));
    }

    return typemap;
}

function exportToCsv(filename, rows) { // ripped from https://stackoverflow.com/questions/14964035/how-to-export-javascript-array-info-to-csv-on-client-side
    var processRow = function (row) {
        var finalVal = '';
        for (var j = 0; j < row.length; j++) {
            var innerValue = row[j] === undefined ? '' : row[j].toString();
            if (row[j] instanceof Date) {
                innerValue = row[j].toLocaleString();
            };
            var result = innerValue.replace(/"/g, '""');
            if (result.search(/("|,|\n)/g) >= 0)
                result = '"' + result + '"';
            if (j > 0)
                finalVal += ',';
            finalVal += result;
        }
        return finalVal + '\n';
    };

    var csvFile = '';
    for (var i = 0; i < rows.length; i++) {
        csvFile += processRow(rows[i]);
    }

    var blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, filename);
    } else {
        var link = document.createElement("a");
        if (link.download !== undefined) { // feature detection
            // Browsers that support HTML5 download attribute
            var url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}

function prepareData(centre) {
    csv_arr = [["Centre", "Restaurant", "Food Store", "Drug Store", "Fashion Store", 
                "Dry Cleaners", "Financial Instution", "Insurance, Travel, Real Estate", 
                "Home Electronics", "Supermarket", "Department Store", "Shoe Store",
                "Book Store", "Other", "Total"]];
    sortPlacesIntoLocations();
    if (centre === undefined) {
        for (var i = 0; i < CENTRES.names.length; i++) {
            var con = [];
            con.push(CENTRES.names[i]);
            var indmap = getPlaceIndicatorFunctions(CENTRES.places[i]);
            console.log(indmap);
            var total = 0;
            for (var k of csv_arr[0].slice(1, csv_arr[0].length - 1)) {
                if (indmap.has(k)) {
                    con.push("" + indmap.get(k).length);
                    total += indmap.get(k).length;
                } else {
                    con.push("" + 0);
                }
            }
            con.push("" + total);
            csv_arr.push(con);
        }
    } else {
        var con = [];
        con.push(CENTRES.names[centre]);
        var indmap = getPlaceIndicatorFunctions(CENTRES.places[centre]);
        console.log(indmap);
        var total = 0;
        for (var k of csv_arr[0].slice(1, csv_arr[0].length - 1)) {
            if (indmap.has(k)) {
                con.push("" + indmap.get(k).length);
                total += indmap.get(k).length;
            } else {
                con.push("" + 0);
            }
        }
        con.push("" + total);
        csv_arr.push(con);
    }
    console.log(csv_arr);
    exportToCsv("processed.csv", csv_arr);
}

function exportWeirdPlaces() {
    var arr = [];
    for (var k of WEIRD_PLACES.keys()) {
        arr.push([k]);
        for (var pl of WEIRD_PLACES.get(k)) {
            arr.push([pl.name + " at " + pl.vicinity]);
        }
        arr.push([]);
    }
    exportToCsv("weird_places.txt", arr);
}