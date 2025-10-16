/* =====================================================
   🚌 KMITL Shuttle Tracking - Smooth Realtime Demo
   ===================================================== */

// ===== 0️⃣ Global Variables =====
let map;
let buses = [];
let busMarkers = {};      // เก็บ marker ของแต่ละรถ
let routeAlertStatus = {}; // สถานะแจ้งเตือนสายรถ
let stopAlertStatus = {};  // สถานะแจ้งเตือนป้าย

// ===== 1️⃣ Initialize Map =====
function initMap() {
    map = L.map('map').setView([13.729, 100.776], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
}
initMap();

// ===== 2️⃣ Custom Icons =====
const busIcon = L.icon({ iconUrl: "/static/bus.png", iconSize: [32,32], iconAnchor: [16,16] });
const stopIcon = L.icon({ iconUrl: "/static/stop.png", iconSize: [28,28], iconAnchor: [14,14] });

// ===== 3️⃣ Fake Stops for Demo =====
const fakeStops = [
    { name: "หน้าตึกพระจอม", lat: 13.7294, lng: 100.776, arrivalTime: 0 },
    { name: "โรงอาหารกลาง", lat: 13.7299, lng: 100.778, arrivalTime: 5 },
    { name: "คณะวิศวกรรมศาสตร์", lat: 13.7303, lng: 100.774, arrivalTime: 12 },
    { name: "อาคารเรียนรวม", lat: 13.7287, lng: 100.773, arrivalTime: 20 }
];

// ===== 4️⃣ Load Stops on Map + Sidebar =====
function loadStops() {
    const stopList = document.getElementById("stopList");
    const allStops = document.getElementById("allStops");
    stopList.innerHTML = '';
    allStops.innerHTML = '';

    fakeStops.forEach(stop => {
        // Marker
        L.marker([stop.lat, stop.lng], { icon: stopIcon }).addTo(map).bindPopup(stop.name);

        // Sidebar lists
        [stopList, allStops].forEach(list => {
            const li = document.createElement("li");
            li.innerText = stop.name;
            li.onclick = () => map.setView([stop.lat, stop.lng], 18);
            list.appendChild(li);
        });
    });
}
loadStops();

// ===== 5️⃣ Render Route Stops in Panel =====
function renderRouteStops(routeLine) {
    const container = document.getElementById("routeStopsList");
    if (!container) return;
    container.innerHTML = '';

    const header = document.getElementById("busDetailHeader");
    if (header) header.innerText = `🚌 สาย ${routeLine} (ป้ายถัดไป)`;

    fakeStops.forEach(stop => {
        const stopId = `${routeLine}-${stop.name}`;

        const item = document.createElement('li');
        item.className = 'stop-item';

        const info = document.createElement('div');
        info.className = 'stop-info';
        info.innerText = stop.name;
        item.appendChild(info);

        const timeAlert = document.createElement('div');
        timeAlert.className = 'stop-time-alert';

        const timeDisplay = document.createElement('div');
        timeDisplay.className = 'stop-time';
        timeDisplay.innerText = stop.arrivalTime != null ? `${stop.arrivalTime} นาที` : '-- นาที';
        timeAlert.appendChild(timeDisplay);

        const alertBtn = document.createElement('button');
        const isActive = stopAlertStatus[stopId] || false;
        alertBtn.className = `alert-button ${isActive ? 'active' : ''}`;
        alertBtn.innerHTML = isActive ? '🔔' : '🔕';
        alertBtn.onclick = e => {
            e.stopPropagation();
            stopAlertStatus[stopId] = !isActive;
            renderRouteStops(routeLine);
            alert(stopAlertStatus[stopId] ? `ตั้งค่าแจ้งเตือน: รถสาย ${routeLine} ถึง ${stop.name}` : `ยกเลิกแจ้งเตือน ${stop.name}`);
        };

        timeAlert.appendChild(alertBtn);
        item.appendChild(timeAlert);

        item.onclick = () => map.setView([stop.lat, stop.lng], 18);
        container.appendChild(item);
    });
}

// ===== 6️⃣ Smooth Movement Function (วนรอบ + เริ่มคนละจุด) =====
function moveAlongRoute(busMarker, route, startIndex = 0, speed = 0.002) {
    let index = startIndex;

    function step() {
        if (route.length === 0) return;

        const [lat, lng] = route[index];
        const pos = busMarker.getLatLng();
        const latDiff = lat - pos.lat;
        const lngDiff = lng - pos.lng;

        if (Math.abs(latDiff) < 0.00001 && Math.abs(lngDiff) < 0.00001) {
            index++;
            if (index >= route.length) index = 0; // วนรอบ
        } else {
            busMarker.setLatLng([pos.lat + latDiff * speed, pos.lng + lngDiff * speed]);
        }

        requestAnimationFrame(step);
    }

    step();
}

// ===== 7️⃣ Load Bus Markers & Start Movement =====
function loadBuses() {
    buses.forEach((bus, i) => {
        const busId = bus.bus_id ?? bus.id;
        const lineName = bus.line ?? busId;

        // กำหนด route สำหรับรถคันนี้ (ใช้ fakeStops)
        const route = fakeStops.map(s => [s.lat, s.lng]);

        if (!busMarkers[busId]) {
            // เริ่มรถแต่ละคันจาก index ต่างกัน
            const startIndex = i % route.length;
            busMarkers[busId] = L.marker(route[startIndex], { icon: busIcon })
                .addTo(map)
                .bindPopup(`🚍 สาย ${lineName}`);

            moveAlongRoute(busMarkers[busId], route, startIndex, 0.01); // ปรับความเร็ว
        }
    });
}

// ===== 8️⃣ Load Bus List Sidebar =====
function loadBusList() {
    const busList = document.getElementById("busList");
    if (!busList) return;
    busList.innerHTML = '';

    buses.forEach(bus => {
        const busId = bus.bus_id ?? bus.id;
        const lineName = bus.line ?? busId;

        const li = document.createElement("li");
        li.className = 'bus-list-item';

        const nameDiv = document.createElement('div');
        nameDiv.innerText = `🚍 สาย ${lineName}`;
        nameDiv.style.flexGrow = '1';
        nameDiv.onclick = () => {
            showPanel(null, 'bus-detail');
            renderRouteStops(busId);
            const marker = busMarkers[busId];
            if (marker) { map.setView(marker.getLatLng(), 18); marker.openPopup(); }
        };

        const alertBtn = document.createElement('button');
        const isActive = routeAlertStatus[busId] || false;
        alertBtn.className = `alert-button ${isActive ? 'active' : ''}`;
        alertBtn.innerHTML = isActive ? '🔔' : '🔕';
        alertBtn.onclick = e => {
            e.stopPropagation();
            routeAlertStatus[busId] = !isActive;
            loadBusList();
        };

        li.appendChild(nameDiv);
        li.appendChild(alertBtn);
        busList.appendChild(li);
    });
}

// ===== 9️⃣ Sidebar Switching =====
function showPanel(event, panel) {
    document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.panel-content').forEach(el => el.classList.remove('active'));

    const targetPanel = document.getElementById(panel + '-panel');
    if (targetPanel) targetPanel.classList.add('active');
    if (event) event.currentTarget.classList.add('active');

    setTimeout(() => map.invalidateSize(), 200);
}

// ===== 🔟 Filter Stops =====
function filterStops() {
    const filter = document.getElementById("searchBox").value.toLowerCase();
    document.querySelectorAll("#stopList li").forEach(li => {
        li.style.display = li.innerText.toLowerCase().includes(filter) ? "" : "none";
    });
}

// ===== 1️⃣1️⃣ WebSocket Realtime =====
const ws = new WebSocket("ws://127.0.0.1:8000/realtime");

ws.onopen = () => console.log("✅ WebSocket connected");
ws.onmessage = event => {
    try {
        const data = JSON.parse(event.data);
        if (data.buses) {
            buses = data.buses;
            loadBuses();    // เคลื่อนที่รถ
            loadBusList();  // อัปเดตรายชื่อ sidebar
        }
    } catch(e) {
        console.error("❌ WS parse error:", e);
    }
};
ws.onerror = err => console.error("❌ WS Error", err);
ws.onclose = e => console.warn("⚠️ WS closed", e);
