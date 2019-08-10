
var lp, map, taipei, service, infowindow, origin, destination, directionsService, directionsDisplay, geocoder, DistanceMatrix, distanceResponse, d
var markers = []
var point = []
var dist = []
var hostnameRegexp = new RegExp('^https?://.+?/');
var MARKER_PATH = 'https://developers.google.com/maps/documentation/javascript/images/marker_green';

function initMap() {
  taipei = new google.maps.LatLng(25.0499358, 121.537079);
  directionsService = new google.maps.DirectionsService;
  map = new google.maps.Map(document.getElementById('map'), {
    center: taipei,
    zoom: 15,
    mapTypeControl: false,
    fullscreenControl: false,
  });
  // ------------------------------------

  directionsDisplay = new google.maps.DirectionsRenderer;
  directionsDisplay.setMap(map);
  document.getElementById('distance').addEventListener('change', function () {
    clearMarkers()
    clearResults()
    directionsDisplay.setMap(null);
    map.setZoom(15)
  })
  document.getElementById('mode').addEventListener('change', function () {
    calculateAndDisplayRoute(directionsService, directionsDisplay);
  });
  document.getElementById('foodmode').addEventListener('change', function () {
    clearMarkers()
    clearResults()
    directionsDisplay.setMap(null);
    map.setZoom(15)
  })

  // ----------------------------------------
  infoWindow = new google.maps.InfoWindow({
    content: document.getElementById('info-content')
  });
  service = new google.maps.places.PlacesService(map);
  google.maps.event.addListener(map, "click", function (event) {
    clearMarkers()
    clearResults()
    document.querySelector("#distance").value <= 500 ? map.setZoom(17) : document.querySelector("#distance").value < 1100 ? map.setZoom(16) : map.setZoom(15)
    var foodmode = document.getElementById('foodmode').value
    origin = event.latLng
    point.push(new google.maps.Marker({
      map: map,
      position: origin,
      animation: google.maps.Animation.BOUNCE,
    }))
    map.setCenter(origin);
    var request = {
      location: origin,
      // bounds: map.getBounds(),
      radius: document.querySelector("#distance").value,
      type: [foodmode]
    };
    service.nearbySearch(request, search);
    directionsDisplay.setMap(null);


  })
  // -------------------------------------------------------------------------------
  geocoder = new google.maps.Geocoder;
  DistanceMatrix = new google.maps.DistanceMatrixService;
}
function distance(e) {
  var selectedMode = document.getElementById('mode').value;
  DistanceMatrix.getDistanceMatrix({
    origins: [origin],
    destinations: e,
    travelMode: selectedMode,
    unitSystem: google.maps.UnitSystem.METRIC,
    avoidHighways: false,
    avoidTolls: false
  }, function (response, status) {
    if (status !== 'OK') {
      alert('Error was: ' + status);
    } else {
      distanceResponse = response.rows[0].elements;
      document.getElementById('iw-distance').textContent = distanceResponse[0].distance.text
    }
  });
}

// -------------------------------------------
function calculateAndDisplayRoute(directionsService, directionsDisplay) {
  var selectedMode = document.getElementById('mode').value;
  directionsService.route({
    origin: origin,
    destination: destination,
    travelMode: google.maps.TravelMode[selectedMode]
  }, function (response, status) {
    if (status == 'OK') {
      directionsDisplay.setDirections(response);
    } else {
      window.alert('Directions request failed due to ' + status);
    }
  });
}
// --------------------------------------------------------------------------------------------------
function search(results, status) {
  if (status == google.maps.places.PlacesServiceStatus.OK) {
    for (var i = 0; i < results.length; i++) {
      var markerLetter = String.fromCharCode('A'.charCodeAt(0) + (i % 26));
      var markerIcon = MARKER_PATH + markerLetter + '.png';
      addMarker({ coords: results[i].geometry.location }, markerIcon);
      markers[i].placeResult = results[i];
      dist.push(results[i].geometry.location)
      google.maps.event.addListener(markers[i], 'click', function () { destination = this.position; distance([destination]) });
      google.maps.event.addListener(markers[i], 'click', showInfoWindow);

      setTimeout(dropMarker(i, results[i]), i * 100);
      addResult(results[i], i)
    }
  }
}

function addMarker(place, markerIcon) {
  markers.push(new google.maps.Marker({
    position: place.coords,
    animation: google.maps.Animation.DROP,
    icon: markerIcon
  }))
}
function clearMarkers() {
  markers.forEach(e => e.setMap(null))
  markers = []
  point.forEach(e => e.setMap(null))
  point = []
  dist = []
}

function dropMarker(i, result) {
  return function () {
    markers[i].setMap(map)
  };
}

function addResult(result, i) {
  var results = document.getElementById('results');
  var markerLetter = String.fromCharCode('A'.charCodeAt(0) + (i % 26));
  var markerIcon = MARKER_PATH + markerLetter + '.png';

  var li = document.createElement('li');

  li.style.backgroundColor = (i % 2 === 0 ? 'rgba(255, 40, 40, 0.4)' : 'rgba(255, 20, 20, 0.5)');
  li.onclick = function () {
    google.maps.event.trigger(markers[i], 'click');
  };

  var icon = document.createElement('img');
  icon.src = markerIcon;
  icon.setAttribute('class', 'placeIcon');
  var name = document.createTextNode(result.name);
  li.appendChild(icon);
  li.appendChild(name);
  results.appendChild(li);
}
function clearResults() {
  var results = document.getElementById('results');
  while (results.childNodes[0]) {
    results.removeChild(results.childNodes[0]);
  }
}

// ------------------------------------------------------
function showInfoWindow() {
  directionsDisplay.setMap(map);
  calculateAndDisplayRoute(directionsService, directionsDisplay);
  var marker = this;
  service.getDetails({ placeId: marker.placeResult.place_id },
    function (place, status) {
      if (status !== google.maps.places.PlacesServiceStatus.OK) {
        return;
      }
      infoWindow.open(map, marker);
      buildIWContent(place);
    });
}

function buildIWContent(place) {
  document.getElementById('iw-icon').innerHTML = '<img' + ' src="' + place.icon + '"/>';
  if (place.website) {
    document.getElementById('iw-url').innerHTML = '<b><a href="' + place.website +
      '">' + place.name + '</a></b>';
  } else {
    document.getElementById('iw-url').innerHTML = '<b><a href="' + place.url +
      '">' + place.name + '</a></b>'
  }
  document.getElementById('iw-address').textContent = place.vicinity;

  if (place.opening_hours) {
    if (place.opening_hours.open_now) {
      document.getElementById('iw-opening').textContent = "Open Now";
    } else {
      document.getElementById('iw-opening').textContent = "Close";
    }
  } else {
    document.getElementById('iw-opening').style.display = "none";
  }

  if (place.formatted_phone_number) {
    document.getElementById('iw-phone-row').style.display = '';
    document.getElementById('iw-phone').textContent =
      place.formatted_phone_number;
  } else {
    document.getElementById('iw-phone-row').style.display = 'none';
  }
  if (place.rating) {
    var ratingHtml = '';
    for (var i = 0; i < 5; i++) {
      if (place.rating < (i + 0.5)) {
        ratingHtml += '&#10025;';
      } else {
        ratingHtml += '&#10029;';
      }
      document.getElementById('iw-rating-row').style.display = '';
      document.getElementById('iw-rating').innerHTML = ` ${place.rating} ${ratingHtml} (${place.user_ratings_total})`;
    }
  } else {
    document.getElementById('iw-rating-row').style.display = 'none';
  }

  if (place.website) {
    var fullUrl = place.website;
    var website = hostnameRegexp.exec(place.website);
    if (website === null) {
      website = 'http://' + place.website + '/';
      fullUrl = website;
    }
    document.getElementById('iw-website-row').style.display = '';
    document.getElementById('iw-website').innerHTML = `<a href="${website}">${website}<a>`;;
  } else {
    document.getElementById('iw-website-row').style.display = 'none';
  }
}
