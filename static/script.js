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
    // กำหนดเวลาถึงโดยประมาณ (นาที) สำหรับใช้ในการแสดงผล
    { name: "หน้าตึกพระจอม", lat: 13.7294, lng: 100.776, arrivalTime: 0 }, // ป้ายปัจจุบัน/ถัดไป 0 นาที
    { name: "โรงอาหารกลาง", lat: 13.7299, lng: 100.778, arrivalTime: 5 },  // 5 นาที
    { name: "คณะวิศวกรรมศาสตร์", lat: 13.7303, lng: 100.774, arrivalTime: 12 }, // 12 นาที
    { name: "อาคารเรียนรวม", lat: 13.7287, lng: 100.773, arrivalTime: 20 }, // 20 นาที (ป้ายสุดท้าย)
];

const fakeBuses = [
  { id: 1, line: "A", lat: 13.729, lng: 100.776 },
  { id: 2, line: "B", lat: 13.730, lng: 100.778 }
];

// *** เพิ่มตัวแปรสถานะแจ้งเตือน (หลัง Demo Data) ***
let routeAlertStatus = {}; // สำหรับสถานะแจ้งเตือนของสายรถ (ปุ่มหลัง 'สาย A (1)')
let stopAlertStatus = {};  // สำหรับสถานะแจ้งเตือนของป้ายรถ (ปุ่มใน Panel รายละเอียดรถ)

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

// ===== 4.1️⃣ Route Stop List with Alert Feature (NEW FUNCTION) =====
function renderRouteStops(routeLine) {
    // กำหนด Header ของ Panel
    const header = document.getElementById("busDetailHeader");
    if (header) {
        header.innerHTML = `🚌 สาย ${routeLine} (ป้ายถัดไป)`;
    }

    const container = document.getElementById("routeStopsList");
    if (!container) return;
    
    container.innerHTML = ''; 

    fakeStops.forEach((stop) => {
        const item = document.createElement('li');
        item.className = 'stop-item';
        // ใช้ ID ที่ไม่ซ้ำกันสำหรับสถานะแจ้งเตือนป้ายรถของแต่ละสาย
        const stopId = `${routeLine}-${stop.name}`; 

        // 1. ส่วนข้อมูลป้าย
        const info = document.createElement('div');
        info.className = 'stop-info';
        info.innerHTML = stop.name;
        item.appendChild(info);

        // 2. ส่วนเวลาและปุ่มแจ้งเตือน
        const timeAlert = document.createElement('div');
        timeAlert.className = 'stop-time-alert';

        const timeDisplay = document.createElement('div');
        timeDisplay.className = 'stop-time';
        // แสดงเวลา หรือ "-- นาที"
        timeDisplay.innerText = stop.arrivalTime === null ? "-- นาที" : `${stop.arrivalTime} นาที`;
        timeAlert.appendChild(timeDisplay);

        const alertBtn = document.createElement('button');
        
        const isAlertActive = stopAlertStatus[stopId] || false;
        alertBtn.className = `alert-button ${isAlertActive ? 'active' : ''}`;
        alertBtn.innerHTML = isAlertActive ? '🔔' : '🔕'; // 🔕 (Unicode U+1F515) คือ กระดิ่งมีขีดฆ่า

        alertBtn.onclick = (e) => {
            e.stopPropagation(); // ป้องกันไม่ให้ item.onclick (ซูมแผนที่) ทำงาน

            // สลับสถานะแจ้งเตือนป้าย
            stopAlertStatus[stopId] = !isAlertActive; 
            
            // อัปเดต UI (เรียก render ใหม่เพื่อให้สถานะปุ่มเปลี่ยนสี)
            renderRouteStops(routeLine);
            
            if (stopAlertStatus[stopId]) {
                alert(`ตั้งค่าแจ้งเตือน: จะแจ้งเตือนเมื่อรถสาย ${routeLine} ถึงป้าย ${stop.name} (${stop.arrivalTime} นาที)!`);
            } else {
                 alert(`ยกเลิกแจ้งเตือน: ${stop.name} ของสาย ${routeLine}`);
            }
        };
        
        timeAlert.appendChild(alertBtn);
        item.appendChild(timeAlert);
        container.appendChild(item);

        item.onclick = (e) => {
             // ซูมไปที่ตำแหน่งป้าย
             map.setView([stop.lat, stop.lng], 18);
        };
    });
}

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

// ===== 5.1️⃣ Bus List (Linking Bus Marker to Panel List) (MODIFIED) =====
function loadBusList() {
    const busList = document.getElementById("busList");
    if (!busList) return; 
    
    busList.innerHTML = ''; 

    fakeBuses.forEach(bus => {
        const busId = bus.id;
        const lineName = `สาย ${bus.line} (${bus.id})`;
        
        // --- 1. สร้าง li (ใช้ class bus-list-item) ---
        const li = document.createElement("li");
        li.className = "bus-list-item"; // ใช้ class เพื่อจัดรูปแบบ flex ใน CSS
        
        // 2. สร้างส่วนชื่อสายรถ (สำหรับคลิกเปลี่ยน Panel)
        const nameDiv = document.createElement('div');
        nameDiv.innerText = `🚍 ${lineName}`;
        nameDiv.style.flexGrow = '1'; 
        
        // *** โค้ดที่เปลี่ยนไปเพื่อรองรับการคลิกดูรายละเอียดป้าย ***
        nameDiv.onclick = () => {
            // 1. สลับไปที่ Panel รายละเอียดรถ
            showPanel(null, 'bus-detail'); 
            // 2. โหลดรายการป้ายพร้อมเวลา/ปุ่มแจ้งเตือน
            renderRouteStops(bus.line); 
            
            const marker = busMarkers[busId];
            if (marker) {
                map.setView(marker.getLatLng(), 18);
                marker.openPopup();
            }
        };

        // 3. สร้างปุ่มแจ้งเตือนของสายรถ (ปุ่มที่อยู่หลัง สาย A (1))
        const alertBtn = document.createElement('button');
        const isAlertActive = routeAlertStatus[busId] || false;
        
        alertBtn.className = `alert-button ${isAlertActive ? 'active' : ''}`;
        alertBtn.innerHTML = isAlertActive ? '🔔' : '🔕'; 

        alertBtn.onclick = (e) => {
            e.stopPropagation(); // ป้องกันไม่ให้ nameDiv.onclick ทำงาน

            routeAlertStatus[busId] = !isAlertActive; // สลับสถานะ
            
            // อัปเดต UI (เรียกตัวเองซ้ำเพื่ออัปเดตสถานะปุ่ม)
            loadBusList(); 
        };

        li.appendChild(nameDiv);
        li.appendChild(alertBtn);
        busList.appendChild(li);
    });
}

// **เรียกใช้ฟังก์ชันใหม่นี้ที่นี่**
loadBusList(); 



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

