// ===== utils =====
const $ = (s, r = document) => r.querySelector(s);
async function api(url, opts = {}) {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...opts });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.status === 204 ? null : res.json();
}
const j = JSON.stringify;

// ===== globals =====
let map, stopLayer, busLayer;
const stopIcon = L.icon({ iconUrl: "admin-static/stop.png", iconSize: [26, 26], iconAnchor: [13, 25] });
const busIcon  = L.icon({ iconUrl: "admin-static/bus.png",  iconSize: [28, 28], iconAnchor: [14, 26] });

// ===== boot =====
document.addEventListener("DOMContentLoaded", async () => {
  try {
    if (typeof L === "undefined") {
      console.error("Leaflet not loaded");
      alert("โหลดแผนที่ไม่สำเร็จ (Leaflet)");
      return;
    }

    const mapEl = document.getElementById("map");
    if (!mapEl) {
      console.error("#map not found");
      return;
    }

    // ห้ามใช้ ?. ฝั่งซ้ายของ assignment → ใช้ตรวจ null แล้วค่อยเซ็ต
    if (!mapEl.style.height || mapEl.style.height === "0px") {
      mapEl.style.height = Math.max(480, Math.round(window.innerHeight * 0.75)) + "px";
    }

    map = L.map(mapEl, { zoomControl: true }).setView([13.7289, 100.7767], 16);
    const tiles = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 20,
    }).addTo(map);
    tiles.on("load", () => console.log("[tiles] loaded"));
    tiles.on("tileerror", (e) => console.warn("[tiles] error:", e));

    stopLayer = L.layerGroup().addTo(map);
    busLayer  = L.layerGroup().addTo(map);

    // ให้แผนที่คำนวณขนาดใหม่หลัง render
    setTimeout(() => map.invalidateSize(), 200);
    window.addEventListener("resize", () => {
      mapEl.style.height = Math.max(480, Math.round(window.innerHeight * 0.75)) + "px";
      map.invalidateSize();
    });

    await renderStopsSafe();
    await renderBusesSafe();
    setInterval(renderBusesSafe, 3000);

    const search = document.getElementById("search-stop");
    if (search) search.addEventListener("input", filterStopList);
  } catch (e) {
    console.error("boot error:", e);
  }
});

// ===== safe wrappers =====
async function renderStopsSafe() { try { await renderStops(); } catch (e) { console.warn("renderStops:", e); } }
async function renderBusesSafe() { try { await renderBuses(); } catch (e) { console.warn("renderBuses:", e); } }

// ===== stops =====
async function renderStops() {
  let stops = await api("/admin/api/stops").catch(() => []);
  if (!Array.isArray(stops)) stops = [];
  const list = document.getElementById("stop-list");
  if (list) list.innerHTML = "";
  stopLayer.clearLayers();

  stops.forEach((s) => {
    if (typeof s.lat !== "number" || typeof s.lng !== "number") return;
    const m = L.marker([s.lat, s.lng], { icon: stopIcon, draggable: true }).addTo(stopLayer);
    m.bindPopup(`<div><b>${s.name}</b><br>Lat ${s.lat}<br>Lng ${s.lng}</div>`);
    if (list) {
      const li = document.createElement("li");
      li.textContent = s.name;
      li.style.cursor = "pointer";
      li.onclick = () => { map.setView([s.lat, s.lng], 18); m.openPopup(); };
      list.appendChild(li);
    }
  });

  const kpiStops = document.getElementById("kpi-stops");
  if (kpiStops) kpiStops.textContent = String(stops.length);
}

// ===== buses =====
async function renderBuses() {
  let data = await api("/admin/api/buses").catch(() => []);
  if (!Array.isArray(data)) data = [];

  const kpiOnline = document.getElementById("kpi-online");
  if (kpiOnline) kpiOnline.textContent = String(data.filter((b) => b.status === "active").length || "—");

  busLayer.clearLayers();
  data.forEach((b) => {
    const lat = typeof b.lat === "number" ? b.lat : 13.729 + Math.random() * 0.002;
    const lng = typeof b.lng === "number" ? b.lng : 100.776 + Math.random() * 0.002;
    const m = L.marker([lat, lng], { icon: busIcon }).addTo(busLayer);
    m.bindPopup(`<div><b>${b.code || "BUS-" + b.id}</b><br>${b.status || ""}</div>`);
  });
}

// ===== search =====
function filterStopList() {
  const qEl = document.getElementById("search-stop");
  const list = document.getElementById("stop-list");
  if (!qEl || !list) return;
  const q = (qEl.value || "").trim().toLowerCase();
  list.querySelectorAll("li").forEach((li) => {
    li.style.display = li.textContent.toLowerCase().includes(q) ? "" : "none";
  });
}
