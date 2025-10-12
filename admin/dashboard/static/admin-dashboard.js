// ===== utils =====
const $ = (s, r=document)=>r.querySelector(s);
const esc = s => (s||"").replace(/[&<>"']/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
async function api(url, opts={}) {
  const res = await fetch(url, { headers: {"Content-Type":"application/json"}, ...opts });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.status===204 ? null : res.json();
}
const j = JSON.stringify;

// ===== globals =====
let map, stopLayer, busLayer;
const stopIcon = L.icon({ iconUrl: "/admin-static/stop.png", iconSize:[26,26], iconAnchor:[13,25] });
const busIcon  = L.icon({ iconUrl: "/admin-static/bus.png",  iconSize:[28,28], iconAnchor:[14,26] });

// ===== boot =====
window.addEventListener("DOMContentLoaded", async ()=>{
  const el = document.getElementById("map");
  if (!el) return;
  if (!el.style.height) el.style.height = "70vh";

  map = L.map("map", { zoomControl:true }).setView([13.7289,100.7767], 16);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution:"© OpenStreetMap", maxZoom:20 }).addTo(map);
  stopLayer = L.layerGroup().addTo(map);
  busLayer  = L.layerGroup().addTo(map);

  await Promise.all([renderStops(), renderBuses()]);
  setInterval(renderBuses, 3000);

  $("#search-stop")?.addEventListener("input", filterStopList);
});

// ===== stops =====
async function renderStops(){
  let stops = await api("/admin/api/stops");
  if (!Array.isArray(stops)) stops = [];
  const list = $("#stop-list"); if (list) list.innerHTML = "";
  stopLayer.clearLayers();

  stops.forEach(s=>{
    if (typeof s.lat !== "number" || typeof s.lng !== "number") return;
    const marker = L.marker([s.lat, s.lng], {icon: stopIcon, draggable:true}).addTo(stopLayer);
    marker.bindPopup(stopPopupHtml(s), {autoPan:true});
    marker.on("popupopen", () => bindStopPopupEvents(marker, s));
    marker.on("dragend", e=>{
      const {lat,lng} = e.target.getLatLng();
      marker.setPopupContent(stopPopupHtml({...s, lat, lng}));
      bindStopPopupEvents(marker, {...s, lat, lng});
    });

    if (list){
      const li = document.createElement("li");
      li.textContent = s.name;
      li.style.cursor = "pointer";
      li.onclick = ()=>{ map.setView([s.lat, s.lng], 18); marker.openPopup(); };
      list.appendChild(li);
    }
  });

  $("#kpi-stops")?.textContent = String(stops.length);
}
function stopPopupHtml(s){
  return `
    <div class="quick-pop">
      <div class="fw-semibold mb-1">ป้าย #${s.id ?? "-"}</div>
      <div class="mb-2">
        <label class="form-label form-label-sm">ชื่อ</label>
        <input id="stop-name" class="form-control form-control-sm" value="${esc(s.name)}">
      </div>
      <div class="row g-1 mb-2">
        <div class="col"><label class="form-label form-label-sm">Lat</label><input id="stop-lat" class="form-control form-control-sm" value="${s.lat}"></div>
        <div class="col"><label class="form-label form-label-sm">Lng</label><input id="stop-lng" class="form-control form-control-sm" value="${s.lng}"></div>
      </div>
      <div class="d-flex gap-2">
        <button id="stop-save" class="btn btn-primary btn-sm">บันทึก</button>
        <button id="stop-delete" class="btn btn-outline-danger btn-sm">ลบ</button>
      </div>
      <div class="text-muted small mt-1">ลากหมุดเพื่อเลื่อนพิกัดได้</div>
    </div>`;
}
function bindStopPopupEvents(marker, s){
  document.getElementById("stop-save")?.addEventListener("click", async ()=>{
    const name = (document.getElementById("stop-name")?.value || "").trim();
    const lat  = parseFloat(document.getElementById("stop-lat")?.value);
    const lng  = parseFloat(document.getElementById("stop-lng")?.value);
    if (!name || Number.isNaN(lat) || Number.isNaN(lng)) return alert("ข้อมูลไม่ครบ");
    await api(`/admin/api/stops/${s.id}`, {method:"PUT", body:j({name, lat, lng})});
    marker.setLatLng([lat,lng]); alert("บันทึกแล้ว");
  });
  document.getElementById("stop-delete")?.addEventListener("click", async ()=>{
    if (!confirm(`ลบป้าย "${s.name}" ?`)) return;
    await api(`/admin/api/stops/${s.id}`, {method:"DELETE"});
    await renderStops();
  });
}

// ===== buses =====
async function renderBuses(){
  let data = await api("/admin/api/buses");
  if (!Array.isArray(data)) data = [];
  $("#kpi-online")?.textContent = String(data.filter(b=>b.status==="active").length || "—");

  busLayer.clearLayers();
  data.forEach(b=>{
    const lat = typeof b.lat==="number" ? b.lat : 13.729 + Math.random()*0.002;
    const lng = typeof b.lng==="number" ? b.lng : 100.776 + Math.random()*0.002;
    const m = L.marker([lat, lng], {icon: busIcon}).addTo(busLayer);
    m.bindPopup(busPopupHtml(b), {autoPan:true});
    m.on("popupopen", () => bindBusPopupEvents(m, b));
  });
}
function busPopupHtml(b){
  const code = b.code || b.line || `BUS-${b.id}`;
  return `
    <div class="quick-pop">
      <div class="fw-semibold mb-1">รถ #${b.id ?? "-"} (${esc(code)})</div>
      <div class="row g-1 mb-2">
        <div class="col-6">
          <label class="form-label form-label-sm">สถานะ</label>
          <select id="bus-status" class="form-select form-select-sm">
            <option ${b.status==="active"?"selected":""} value="active">active</option>
            <option ${b.status==="inactive"?"selected":""} value="inactive">inactive</option>
            <option ${b.status==="maintenance"?"selected":""} value="maintenance">maintenance</option>
          </select>
        </div>
        <div class="col-6">
          <label class="form-label form-label-sm">ทะเบียน</label>
          <input id="bus-plate" class="form-control form-control-sm" value="${esc(b.plate||"")}">
        </div>
      </div>
      <div class="mb-2">
        <label class="form-label form-label-sm">คนขับ</label>
        <input id="bus-driver" class="form-control form-control-sm" value="${esc(b.driver||"")}">
      </div>
      <div class="d-flex gap-2">
        <button id="bus-save" class="btn btn-primary btn-sm">บันทึก</button>
        <button id="bus-delete" class="btn btn-outline-danger btn-sm">ลบ</button>
      </div>
    </div>`;
}
function bindBusPopupEvents(marker, b){
  document.getElementById("bus-save")?.addEventListener("click", async ()=>{
    const payload = {
      status: document.getElementById("bus-status")?.value || b.status,
      plate : (document.getElementById("bus-plate")?.value || "").trim(),
      driver: (document.getElementById("bus-driver")?.value || "").trim(),
    };
    await api(`/admin/api/buses/${b.id}`, {method:"PUT", body:j(payload)});
    alert("บันทึกแล้ว");
  });
  document.getElementById("bus-delete")?.addEventListener("click", async ()=>{
    if (!confirm("ลบรถคันนี้?")) return;
    await api(`/admin/api/buses/${b.id}`, {method:"DELETE"});
    await renderBuses();
  });
}

// ===== search =====
function filterStopList(){
  const q = ($("#search-stop")?.value || "").trim().toLowerCase();
  $("#stop-list")?.querySelectorAll("li").forEach(li=>{
    li.style.display = li.textContent.toLowerCase().includes(q) ? "" : "none";
  });
}
