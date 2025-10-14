/* =====================================================
   🚌 KMITL Shuttle Tracking (Demo)
   ===================================================== */

// ===== 1️⃣ Map Initialization =====
var map = L.map('map').setView([13.729, 100.776], 16);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// ===== 2️⃣ Custom Icons =====
var busIcon = L.icon({
  iconUrl: "/static/bus.png",
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

var stopIcon = L.icon({
  iconUrl: "/static/stop.png",
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

// ===== 3️⃣ Demo Data =====
const fakeStops = [
  { name: "หน้าตึกพระจอม", lat: 13.7294, lng: 100.776 },
  { name: "โรงอาหารกลาง", lat: 13.7299, lng: 100.778 },
  { name: "คณะวิศวกรรมศาสตร์", lat: 13.7303, lng: 100.774 },
  { name: "อาคารเรียนรวม", lat: 13.7287, lng: 100.773 },
];

const fakeBuses = [
  { id: 1, line: "A", lat: 13.729, lng: 100.776 },
  { id: 2, line: "B", lat: 13.730, lng: 100.778 }
];

// ===== 4️⃣ Stop List =====
function loadStops() {
  const stopList = document.getElementById("stopList");
  const allStops = document.getElementById("allStops");

  fakeStops.forEach(s => {
    const marker = L.marker([s.lat, s.lng], { icon: stopIcon })
      .addTo(map)
      .bindPopup(s.name);

    // รายชื่อใน panel
    const li1 = document.createElement("li");
    li1.innerText = s.name;
    li1.onclick = () => map.setView([s.lat, s.lng], 18);
    stopList.appendChild(li1);

    const li2 = li1.cloneNode(true);
    li2.onclick = () => map.setView([s.lat, s.lng], 18);
    allStops.appendChild(li2);
  });
}
loadStops();

// ===== 5️⃣ Bus Movement (Simulated) =====
var busMarkers = {};

function loadBuses() {
  fakeBuses.forEach(bus => {
    if (busMarkers[bus.id]) {
      const newLat = bus.lat + (Math.random() - 0.5) * 0.0003;
      const newLng = bus.lng + (Math.random() - 0.5) * 0.0003;
      busMarkers[bus.id].setLatLng([newLat, newLng]);
    } else {
      busMarkers[bus.id] = L.marker([bus.lat, bus.lng], { icon: busIcon })
        .addTo(map)
        .bindPopup(`🚍 สาย ${bus.line}`);
    }
  });
}
loadBuses();
setInterval(loadBuses, 5000);

// ===== 6️⃣ Sidebar Switching =====
function showPanel(event, panel) {
  document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.panel-content').forEach(el => el.classList.remove('active'));

  const targetPanel = document.getElementById(panel + '-panel');
  if (targetPanel) targetPanel.classList.add('active');
  if (event) event.currentTarget.classList.add('active');

  // ปรับขนาดแผนที่ใหม่
  setTimeout(() => map.invalidateSize(), 200);
}

// ===== 7️⃣ Filter Stops =====
function filterStops() {
  const filter = document.getElementById("searchBox").value.toLowerCase();
  const lis = document.getElementById("stopList").getElementsByTagName("li");
  for (let i = 0; i < lis.length; i++) {
    const text = lis[i].innerText.toLowerCase();
    lis[i].style.display = text.includes(filter) ? "" : "none";
  }
}

// ===== 8️⃣ Toggle Dark Mode =====
const darkModeToggle = document.getElementById("darkModeToggle");
if (darkModeToggle) {
  darkModeToggle.addEventListener("change", (e) => {
    if (e.target.checked) {
      document.body.style.background = "#1e293b";
      document.querySelector(".panel").style.background = "#0f172a";
      document.querySelector(".panel").style.color = "#f8fafc";
    } else {
      document.body.style.background = "#f4f6fb";
      document.querySelector(".panel").style.background = "#fff";
      document.querySelector(".panel").style.color = "#1e293b";
    }
  });
}

// ===== ✅ Debug Log =====
console.log("✅ index.js Loaded Successfully");
