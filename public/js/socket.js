



const socket = io('http://65.1.110.101:5000');  // Update to match server URL

let intervalId = null;


document.getElementById("addDriverBtn").addEventListener("click", () => {
  console.log('Click done');
  if (!intervalId) {
    intervalId = setInterval(() => {


      const referenceLongitude = 78.48572931611685; // mgbs
      const referenceLatitude = 17.378502778550786; // mgbs

      const maxOffset = 500 / 111000; // Approx. 500 meters in degrees

      // Generate random latitude and longitude within 500 meters
      const randomLongitude =
        referenceLongitude +
        ((Math.random() * 2 - 1) * maxOffset) /
          Math.cos(referenceLatitude * (Math.PI / 180));
      const randomLatitude =
        referenceLatitude + (Math.random() * 2 - 1) * maxOffset;

        driverId=(Math.random() * 2 - 1);
        console.log(driverId);

      // Emit the generated coordinates to the server
      socket.emit("addRandomDriver", {
        latitude: randomLatitude,
        longitude: randomLongitude,
        driverId: driverId
      });
    }, 1000); // Send data every second
  }
});

// Stop adding random drivers when "Stop Adding" button is clicked
document.getElementById("stopAddingBtn").addEventListener("click", () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
});

// Listen for newly added drivers
socket.on("driverAdded", (driver) => {
  const driversList = document.getElementById("driversList");
  const driverItem = document.createElement("li");
  driverItem.textContent = `ID: ${driver.driverId}, Location: (${driver.location.coordinates[1]}, ${driver.location.coordinates[0]})`;
  driversList.appendChild(driverItem);
});


socket.on("connect_error", (err) => {
  // the reason of the error, for example "xhr poll error"
  console.log(err.message);

  // some additional description, for example the status code of the initial HTTP response
  console.log(err.description);

  // some additional context, for example the XMLHttpRequest object
  console.log(err.context);
});
