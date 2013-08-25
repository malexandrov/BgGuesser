var newRound = (function () {
    var sv = new google.maps.StreetViewService();
    var initLatLng = { latitude: 42.7, longitude: 25.3 },
        initZoom = 7,
        svLatLng = 0,
        guessLatLng = 0;

    var latBoundaries = {
        min: 41.109776,
        max: 43.234527
    }, lngBoundaries = {
        min: 22.715764,
        max: 27.924406
    };
    
    var guessBtn = $('#make-guess-btn')[0],
        closeBtn = $('#close-result-btn'),
        guessMapCanvas = $('#guessing-map')[0],
        streetViewCanvas = $('#street-map')[0],
        resultMapCanvas = $('#result-map')[0],
        resultOverlayCanvas = $('#result-overlay')[0],
        resultText = $('#result-text')[0];
    
    var getRandom = function (min, max) {
        return Math.random() * (max - min + 1) + min;
    };

    var calculateDistanceKm = function (location1, location2) {
        var distance = google.maps.geometry.spherical.computeDistanceBetween(location1, location2) / 1000;
        return distance.toFixed(2);
    };

    var calculatePoints = function (distance) {
        var coeff = 0;
        if (distance < 500) {
            coeff = 2;
        } else if (distance < 200) {
            coeff = 4;
        } else if (distance < 100) {
            coeff = 6;
        } else if (distance < 10) {
            coeff = 10;
        }
        var points = coeff * Math.round(500 + (1 / 2 - distance - 5));
        return points > 0 ? points : 0;
    };

    var enableGuessBtn = function (button) {
        button.style.backgroundColor = '#0094ff';
        button.style.color = '#fff';
        button.onclick = results;
    };

    var disableGuessBtn = function (button) {
        button.style.backgroundColor = '#c6c6c6';
        button.style.color = '#808080';
        button.onclick = void (0);
    }

    function initializeGuessMap() {
        var guessMarker = undefined;
        var mapOptions = {
            zoom: initZoom,
            center: new google.maps.LatLng(initLatLng.latitude, initLatLng.longitude),
            mapTypeId: google.maps.MapTypeId.ROADMAP, //SATELLITE
            streetViewControl: false,
            mapTypeControl: false,
            zoomControlOptions: {
                style: google.maps.ZoomControlStyle.SMALL
            }
        };
        var guessMap = new google.maps.Map(guessMapCanvas, mapOptions);

        function addGuessMarker(map, location) {
            if (guessMarker) {
                guessMarker.setPosition(location);
            } else {
                guessMarker = new google.maps.Marker({
                    position: location,
                    map: map,
                    animation: google.maps.Animation.DROP
                });
                enableGuessBtn(guessBtn);
            }
        }

        google.maps.event.addListener(guessMap, 'click', function (event) { addGuessMarker(guessMap, event.latLng); guessLatLng = event.latLng; });
    };

    function initializeStreetView() {
        var panoramaOptions = {
            addressControl: false
        };
        var streetView = new google.maps.StreetViewPanorama(streetViewCanvas, panoramaOptions);
        var latLng = new google.maps.LatLng(getRandom(latBoundaries.min, latBoundaries.max),
            getRandom(lngBoundaries.min, lngBoundaries.max));

        sv.getPanoramaByLocation(latLng, 3000, function (data, status) {
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
    };

    function initializeRoundMap() {
        var resultMapOptions = {
            zoom: initZoom,
            center: new google.maps.LatLng(initLatLng.latitude, initLatLng.longitude),
            mapTypeId: google.maps.MapTypeId.ROADMAP, //SATELLITE
            streetViewControl: false,
            mapTypeControl: false,
            draggable: false,
            zoomControl: false,
            panControl: false,
            disableDoubleClickZoom: true
        };
        var resultMap = new google.maps.Map(resultMapCanvas, resultMapOptions);

        addMarkers(resultMap, svLatLng, guessLatLng);
        drawLine(resultMap, svLatLng, guessLatLng);

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
        };

        function addMarkers(targetMap, locationA, locationB) {
            var svMarkerA = new google.maps.Marker({
                position: locationA,
                map: targetMap,
                icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
            });
            var guessMarkerB = new google.maps.Marker({
                position: locationB,
                map: targetMap
            });
        };
    };

    function results() {
        var resultDistance = calculateDistanceKm(svLatLng, guessLatLng);
        var roundPoints = calculatePoints(resultDistance);

        resultText.innerHTML = 'Your guess was ' + resultDistance + 'km from the correct location and gives you ' + roundPoints + ' points.';
        resultOverlayCanvas.style.visibility = 'visible';
        closeBtn.click(newRound);

        initializeRoundMap();
    };

    function round() {
        resultOverlayCanvas.style.visibility = 'hidden';
        disableGuessBtn(guessBtn);
        initializeStreetView();
        initializeGuessMap();
    };

    return round;
})();

google.maps.event.addDomListener(window, 'load', newRound);





