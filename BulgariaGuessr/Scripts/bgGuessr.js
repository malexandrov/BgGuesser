var initLatitude = 42.7,
    initLongitude = 25.3,
    initZoom = 7;
var STREETVIEW_MAX_RADIUS = 1000;
var guessMap,
    guessMarker;
var svLatLng;
var guessLatLng;
var MIN_LAT = 41.109776;
var MAX_LAT = 43.234527;
var MIN_LNG = 22.715764;
var MAX_LNG = 27.924406;
var guessBtn = document.getElementById('make-guess-btn');

function getRandom(min, max) {
    return Math.random() * (max - min + 1) + min;
}

function initializeGuessMap() {
    var mapOptions = {
        zoom: initZoom,
        center: new google.maps.LatLng(initLatitude, initLongitude),
        mapTypeId: google.maps.MapTypeId.ROADMAP, //SATELLITE
        streetViewControl: false,
        mapTypeControl: false,
        zoomControlOptions: {
            style: google.maps.ZoomControlStyle.SMALL
        }
    };
    guessMap = new google.maps.Map(document.getElementById('guessing-map'),
        mapOptions);
}

function initializeStreetView() {
    var sv = new google.maps.StreetViewService();
    var panoramaOptions = {
        addressControl: false
    };
    var streetView = new google.maps.StreetViewPanorama(document.getElementById('street-map'), panoramaOptions),
        latLng = new google.maps.LatLng(getRandom(MIN_LAT, MAX_LAT), getRandom(MIN_LNG, MAX_LNG));

    sv.getPanoramaByLocation(latLng, STREETVIEW_MAX_RADIUS, function (data, status) {
        if (status === google.maps.StreetViewStatus.OK) {
            streetView.setPano(data.location.pano);
            streetView.setPov({
                heading: getRandom(0, 360),
                pitch: 0
            });
            streetView.setVisible(true);
            svLatLng = data.location.latLng;
        } else {
            console.log('No street view available at ' + latLng + '. Retrying...');
            initializeStreetView();
        }
    });
}

function showResults() {
    var resultOverlay = document.getElementById('result-overlay'),
        resultText = document.getElementById('result-text'),
        resultDistance = calculateDistanceKm(svLatLng, guessLatLng),
        closeButton = document.getElementById('close-result-btn');
    closeButton.onclick = newGame;

    var resultMapOptions = {
        zoom: initZoom,
        center: new google.maps.LatLng(initLatitude, initLongitude),
        mapTypeId: google.maps.MapTypeId.ROADMAP, //SATELLITE
        streetViewControl: false,
        mapTypeControl: false,
        draggable: false,
        zoomControl: false,
        panControl: false,
        disableDoubleClickZoom: true
    };
    var resultMap = new google.maps.Map(document.getElementById('result-map'),
        resultMapOptions);

    addMarkers(resultMap, svLatLng, guessLatLng);
    drawLine(resultMap, svLatLng, guessLatLng);
    resultText.innerHTML = 'Your guess was ' + resultDistance + 'km from the correct location.';
    resultOverlay.style.visibility = 'visible';

    function drawLine(targetMap, locationA, locationB) {
        var lineCoordinates = [
            locationA,
            locationB
        ];
        var path = new google.maps.Polyline({
            path: lineCoordinates,
            strokeColor: '#FF0000',
            strokeOpacity: 1.0,
            strokeWeight: 2
        });

        path.setMap(targetMap);
    }

    function addMarkers(targetMap, locationA, locationB) {
        var svMarkerA = new google.maps.Marker({
            position: locationA,
            map: targetMap,
            icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
        }),
            guessMarkerB = new google.maps.Marker({
            position: locationB,
            map: targetMap
        });
    }

    function calculateDistanceKm(location1, location2) {
        var distance = google.maps.geometry.spherical.computeDistanceBetween(location1, location2) / 1000;
        return distance.toFixed(2);
    }

    return false;
}

function addGuessMarker(map, location) {
    if (guessMarker) {
        guessMarker.setPosition(location);
    } else {
        guessMarker = new google.maps.Marker({
            position: location,
            map: map,
            animation: google.maps.Animation.DROP
        });

        guessBtn.style.backgroundColor = '#0094ff';
        guessBtn.style.color = 'white';
        guessBtn.onclick = showResults;
    }
}

function newGame() {
    var resultOverlay = document.getElementById('result-overlay');
    resultOverlay.style.visibility = 'hidden';

    guessBtn.style.backgroundColor = '#c6c6c6';
    guessBtn.style.color = 'gray';
    guessBtn.onclick = void(0);

    guessMarker = undefined;

    initializeGuessMap();
    initializeStreetView();

    google.maps.event.addListener(guessMap, 'click', function (event) { addGuessMarker(guessMap, event.latLng); guessLatLng = event.latLng; });
}

google.maps.event.addDomListener(window, 'load', newGame());


