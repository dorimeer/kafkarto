var options = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0
};

var geo;

function success(pos) {
  geo = pos.coords;
  console.log(`position: Latitude: ${geo.latitude} Longitude: ${geo.longitude} accuracy: ${geo.accuracy} meters.`);
}

function error(err) {
  console.warn(`ERROR(${err.code}): ${err.message}`);
}

navigator.geolocation.getCurrentPosition(success, error, options);

