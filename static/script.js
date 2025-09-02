// สร้างแผนที่ Leaflet
var map = L.map('map').setView([13.7290, 100.7750], 16);

// ใช้ OSM เป็นแผนที่พื้นหลัง
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Marker เก็บ bus
var busMarkers = {};

// ฟังก์ชันอัปเดตตำแหน่งรถ
async function updateBusPositions() {
    let response = await fetch("/get_bus_positions");
    let buses = await response.json();

    buses.forEach(bus => {
        if (busMarkers[bus.bus_id]) {
            busMarkers[bus.bus_id].setLatLng([bus.lat, bus.lng]);
        } else {
            busMarkers[bus.bus_id] = L.marker([bus.lat, bus.lng])
                .addTo(map)
                .bindPopup(bus.bus_id);
        }
    });
}

// อัปเดตทุก 3 วินาที
setInterval(updateBusPositions, 3000);

// โหลดครั้งแรก
updateBusPositions();