// ====== Initialize Map ======
var map = L.map('map').setView([13.729, 100.776], 16);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// ====== Custom Icons ======
var busIcon = L.icon({
  iconUrl: "{{ url_for('static', filename='bus.png') }}",
  iconSize: [32, 32]
});

var stopIcon = L.icon({
  iconUrl: "{{ url_for('static', filename='stop.png') }}",
  iconSize: [28, 28]
});

var busMarkers = {};
var stopMarkers = [];

// ====== Load Stops ======
fetch("/api/stops")
  .then(res => res.json())
  .then(stops => {
    let stopList = document.getElementById("stopList");
    let allStops = document.getElementById("allStops");

    stops.forEach(s => {
      // Marker
      let marker = L.marker([s.lat, s.lng], { icon: stopIcon })
        .addTo(map)
        .bindPopup(s.name);
      stopMarkers.push({ name: s.name, marker: marker });

      // Stop list (2 ส่วน)
      let li1 = document.createElement("li");
      li1.innerText = s.name;
      li1.onclick = () => map.setView([s.lat, s.lng], 18);
      stopList.appendChild(li1);

      let li2 = li1.cloneNode(true);
      li2.onclick = () => map.setView([s.lat, s.lng], 18);
      allStops.appendChild(li2);
    });
  });

// ====== Load Buses ======
function loadBuses() {
  fetch("/api/buses")
    .then(res => res.json())
    .then(data => {
      data.forEach(bus => {
        let key = bus.id;
        if (busMarkers[key]) {
          busMarkers[key].setLatLng([bus.lat, bus.lng]);
        } else {
          busMarkers[key] = L.marker([bus.lat, bus.lng], { icon: busIcon })
            .addTo(map)
            .bindPopup("สาย " + bus.line);
        }
      });
    });
}
loadBuses();
setInterval(loadBuses, 5000);

// ====== Sidebar Switching ======
function showPanel(event, panel) {
  document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.panel-content').forEach(el => el.classList.remove('active'));

  document.getElementById(panel + '-panel').classList.add('active');
  event.currentTarget.classList.add('active');

  // ป้องกัน map ไม่โหลดเต็มหลังเปลี่ยนแท็บ
  setTimeout(() => map.invalidateSize(), 200);
}

// ====== Filter Search ======
function filterStops() {
  let filter = document.getElementById("searchBox").value.toLowerCase();
  let lis = document.getElementById("stopList").getElementsByTagName("li");
  for (let i = 0; i < lis.length; i++) {
    let text = lis[i].innerText.toLowerCase();
    lis[i].style.display = text.includes(filter) ? "" : "none";
  }
}

