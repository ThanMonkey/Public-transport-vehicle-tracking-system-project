/* ===================== utils ===================== */
function $(sel, root){ return (root||document).querySelector(sel); }
function esc(s){ s=String(s||""); return s.replace(/[&<>"']/g,function(m){return({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]);}); }
function api(url, opts){
  opts = opts || {};
  if (!opts.headers) opts.headers = {};
  opts.headers["Content-Type"] = "application/json";
  return fetch(url, opts).then(function(res){
    if(!res.ok){ return res.text().then(function(t){ throw new Error(res.status+" "+res.statusText+": "+t); }); }
    if(res.status===204) return null;
    return res.json();
  });
}
var j = JSON.stringify;

/* ===================== globals ===================== */
var map, stopLayer, busLayer;
var tempMarker = null;
var stopMarkers = new Map();
var busRefreshTimer = null;
var currentBase = null;

// ★ ปรับ path รูปให้เป็น absolute ในบริบท /admin
var stopIcon = L.icon({ iconUrl: "admin-static/stop.png", iconSize: [26,26], iconAnchor:[13,25] });
var busIcon  = L.icon({ iconUrl: "  admin-static/bus.png",  iconSize: [28,28], iconAnchor:[14,26] });

/* -------- Settings (defaults + persistence) -------- */
var defaultSettings = {
  mapStyle: "osm",
  refreshSec: 3,
  center: [13.7289, 100.7767],
  zoom: 16,
  showBusLabels: false,
  showStopLabels: false
};
var settings = loadSettings();

function loadSettings(){
  try{
    var raw = localStorage.getItem("adminSettings");
    if(!raw) return JSON.parse(JSON.stringify(defaultSettings));
    var obj = JSON.parse(raw);
    var out = JSON.parse(JSON.stringify(defaultSettings));
    Object.keys(obj||{}).forEach(function(k){ out[k] = obj[k]; });
    if(!(out.center && out.center.length===2)) out.center = defaultSettings.center.slice();
    if(typeof out.zoom !== "number") out.zoom = defaultSettings.zoom;
    if(typeof out.refreshSec !== "number" || out.refreshSec<1) out.refreshSec = defaultSettings.refreshSec;
    if(["osm","carto","toner"].indexOf(out.mapStyle)===-1) out.mapStyle = "osm";
    out.showBusLabels  = !!out.showBusLabels;
    out.showStopLabels = !!out.showStopLabels;
    return out;
  }catch(e){
    console.warn("loadSettings failed:", e);
    return JSON.parse(JSON.stringify(defaultSettings));
  }
}
function saveSettings(){
  try{ localStorage.setItem("adminSettings", JSON.stringify(settings)); }
  catch(e){ console.warn("saveSettings failed:", e); }
}

/* ===================== boot ===================== */
window.addEventListener("DOMContentLoaded", function(){
  try{
    var mapEl = $("#map");
    if(!mapEl){ console.error("#map not found"); return; }
    if(!mapEl.style.height || mapEl.style.height==="0px"){
      mapEl.style.height = Math.max(480, Math.round(window.innerHeight*0.75)) + "px";
    }

    map = L.map(mapEl, { zoomControl:true }).setView(settings.center, settings.zoom);
    setBaseLayer(settings.mapStyle); // ใช้สไตล์จาก settings

    stopLayer = L.layerGroup().addTo(map);
    busLayer  = L.layerGroup().addTo(map);

    // ★ Routes layers
    rtInitLayers();

    setTimeout(function(){ map.invalidateSize(); }, 200);
    window.addEventListener("resize", function(){
      mapEl.style.height = Math.max(480, Math.round(window.innerHeight*0.75)) + "px";
      map.invalidateSize();
    });

    Promise.all([renderStops(), renderBuses()]).then(function(){
      startBusTimer(); // เริ่ม refresh ตาม settings.refreshSec
    });

    var searchEl = $("#search-stop");
    if (searchEl) searchEl.addEventListener("input", filterStopList);

    wireSideMenuPanels();   // ค้นหา / ป้าย / ตั้งค่า / ★ สาย
  }catch(e){
    console.error("boot error:", e);
  }
});

/* ===================== base layers ===================== */
function setBaseLayer(style){
  if(currentBase){ map.removeLayer(currentBase); currentBase = null; }

  if(style==="carto"){
    currentBase = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",{
      subdomains:"abcd",
      maxZoom: 20,
      attribution: "© OpenStreetMap contributors © CARTO"
    });
  }else if(style==="toner"){
    currentBase = L.tileLayer("https://stamen-tiles.a.ssl.fastly.net/toner/{z}/{x}/{y}.png",{
      maxZoom: 20,
      attribution:"Map tiles by Stamen Design, CC BY 3.0 — Map data © OpenStreetMap"
    });
  }else{
    currentBase = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{
      maxZoom: 20,
      attribution:"© OpenStreetMap contributors"
    });
  }
  currentBase.addTo(map);
}

/* ===================== panels switch ===================== */
function showPanel(which){
  var pSearch = $("#panel-search");
  var pStops  = $("#panel-stops");
  var pSet    = $("#panel-settings");
  var pRoutes = $("#panel-routes"); // ★

  if (pSearch) pSearch.hidden = (which !== "search");
  if (pStops)  pStops.hidden  = (which !== "stops");
  if (pSet)    pSet.hidden    = (which !== "settings");
  if (pRoutes) pRoutes.hidden = (which !== "routes"); // ★
}
function setActiveSide(target){
  var items = document.querySelectorAll(".side .side-item");
  Array.prototype.forEach.call(items, function(el){
    el.classList.toggle("active", el === target);
  });
}
function wireSideMenuPanels(){
  var btnSearch   = $("#btn-search");
  var btnStops    = $("#btn-stops");
  var btnSettings = $("#btn-settings");
  var btnRoutes   = $("#btn-routes"); // ★ optional

  if (btnSearch){
    btnSearch.addEventListener("click", function(){
      setActiveSide(btnSearch);
      showPanel("search");
    });
  }
  if (btnStops){
    btnStops.addEventListener("click", function(){
      setActiveSide(btnStops);
      showPanel("stops");
      populateStopsPanel().then(bindStopsPanelButtonsOnce);
    });
  }
  if (btnSettings){
    btnSettings.addEventListener("click", function(){
      setActiveSide(btnSettings);
      showPanel("settings");
      populateSettingsPanel();
      bindSettingsButtonsOnce();
    });
  }
  if (btnRoutes){
    btnRoutes.addEventListener("click", function(){
      setActiveSide(btnRoutes);
      showPanel("routes");
      rtPopulatePanel();          // ★ โหลดรายการสาย + วาดเส้นทั้งหมด
      rtBindPanelOnce();          // ★ ผูกปุ่มสำหรับ routes (ครั้งเดียว)
    });
  }
}

/* ===================== stops on map ===================== */
function renderStops(){
  return api("/admin/api/stops").catch(function(){ return []; }).then(function(stops){
    if(!Array.isArray(stops)) stops = [];

    var list = $("#stop-list");
    if(list) list.innerHTML = "";

    stopLayer.clearLayers();
    stopMarkers.clear();

    stops.forEach(function(s){
      if(typeof s.lat!=="number" || typeof s.lng!=="number") return;

      var marker = L.marker([s.lat, s.lng], { icon: stopIcon, draggable:true }).addTo(stopLayer);
      stopMarkers.set(String(s.id), marker);

      if(settings.showStopLabels){
        marker.bindTooltip(s.name || ("Stop "+s.id), {permanent:true, direction:"top", className:"stop-label", offset:[0,-10]}).openTooltip();
      }

      marker.bindPopup(stopPopupHtml(s), {autoPan:true});
      marker.on("popupopen", function(){ bindStopPopupEvents(marker, s); });

      marker.on("drag", function(e){
        var ll = e.target.getLatLng();
        syncPanelStopLatLng(s.id, ll.lat, ll.lng);
      });
      marker.on("dragend", function(e){
        var ll = e.target.getLatLng();
        var next = { id:s.id, name:s.name, lat:ll.lat, lng:ll.lng };
        marker.setPopupContent(stopPopupHtml(next));
        bindStopPopupEvents(marker, next);
        syncPanelStopLatLng(s.id, ll.lat, ll.lng);
      });

      if(list){
        var li = document.createElement("li");
        li.textContent = s.name;
        li.style.cursor = "pointer";
        li.onclick = function(){ map.setView([s.lat, s.lng], 18); marker.openPopup(); };
        list.appendChild(li);
      }
    });

    var k = $("#kpi-stops");
    if(k) k.textContent = String(stops.length);
  });
}
function stopPopupHtml(s){
  var sid = String(s.id || "new");
  return ''+
  '<div class="quick-pop">'+
    '<div class="fw-semibold mb-1">ป้าย #'+sid+'</div>'+
    '<div class="mb-2"><label class="form-label form-label-sm">ชื่อ</label>'+
    '<input id="stop-name-'+sid+'" class="form-control form-control-sm" value="'+esc(s.name)+'"></div>'+
    '<div class="row g-1 mb-2">'+
      '<div class="col"><label class="form-label form-label-sm">Lat</label>'+
      '<input id="stop-lat-'+sid+'" class="form-control form-control-sm" value="'+s.lat+'"></div>'+
      '<div class="col"><label class="form-label form-label-sm">Lng</label>'+
      '<input id="stop-lng-'+sid+'" class="form-control form-control-sm" value="'+s.lng+'"></div>'+
    '</div>'+
    '<div class="d-flex gap-2">'+
      '<button id="stop-save-'+sid+'" class="btn btn-primary btn-sm">บันทึก</button>'+
      '<button id="stop-delete-'+sid+'" class="btn btn-outline-danger btn-sm">ลบ</button>'+
    '</div>'+
    '<div class="text-muted small mt-1">ลากหมุดเพื่อเลื่อนพิกัดได้</div>'+
  '</div>';
}
function bindStopPopupEvents(marker, s){
  var sid   = String(s.id || "new");
  var $name = document.getElementById("stop-name-"+sid);
  var $lat  = document.getElementById("stop-lat-"+sid);
  var $lng  = document.getElementById("stop-lng-"+sid);
  var $save = document.getElementById("stop-save-"+sid);
  var $del  = document.getElementById("stop-delete-"+sid);

  marker.off("dragend._sync");
  marker.on("dragend._sync", function(e){
    var ll = e.target.getLatLng();
    if($lat) $lat.value = ll.lat.toFixed(6);
    if($lng) $lng.value = ll.lng.toFixed(6);
  });

  if($save) $save.addEventListener("click", function(){
    var name = ($name && $name.value || "").trim();
    var lat  = parseFloat($lat && $lat.value);
    var lng  = parseFloat($lng && $lng.value);
    if(!name || isNaN(lat) || isNaN(lng)){ alert("ข้อมูลไม่ครบ"); return; }

    api("/admin/api/stops/"+s.id, {method:"PUT", body:j({name:name, lat:lat, lng:lng})})
      .then(function(){
        marker.setLatLng([lat,lng]);
        if(settings.showStopLabels){
          marker.unbindTooltip();
          marker.bindTooltip(name||("Stop "+s.id), {permanent:true, direction:"top", className:"stop-label", offset:[0,-10]}).openTooltip();
        }
        marker.closePopup();
        return renderStops();
      })
      .catch(function(e){ console.error(e); });
  });

  if($del) $del.addEventListener("click", function(){
    if(!confirm('ลบป้าย "'+(s.name||'')+'"?')) return;
    api("/admin/api/stops/"+s.id, {method:"DELETE"})
      .then(function(){ return renderStops(); })
      .catch(function(e){ console.error(e); });
  });
}
function syncPanelStopLatLng(id, lat, lng){
  var latEl = document.getElementById("ps-lat-"+id);
  var lngEl = document.getElementById("ps-lng-"+id);
  if(latEl) latEl.value = lat.toFixed(6);
  if(lngEl) lngEl.value = lng.toFixed(6);
}

/* ===================== buses on map ===================== */
function renderBuses(){
  return api("/admin/api/buses").catch(function(){ return []; }).then(function(data){
    if(!Array.isArray(data)) data = [];

    var online = data.filter(function(b){ return b.status==="active"; }).length || "—";
    var el = $("#kpi-online"); if(el) el.textContent = String(online);

    busLayer.clearLayers();

    data.forEach(function(b){
      var lat = (typeof b.lat==="number") ? b.lat : 13.729 + Math.random()*0.002;
      var lng = (typeof b.lng==="number") ? b.lng : 100.776 + Math.random()*0.002;
      var m = L.marker([lat,lng], {icon:busIcon}).addTo(busLayer);

      if(settings.showBusLabels){
        var code = b.code || b.line || ("BUS-"+b.id);
        m.bindTooltip(code, {permanent:true, direction:"top", className:"bus-label", offset:[0,-10]}).openTooltip();
      }

      m.bindPopup(busPopupHtml(b), {autoPan:true});
      m.on("popupopen", function(){ bindBusPopupEvents(m, b); });
    });
  });
}
function busPopupHtml(b){
  var bid = String(b.id || "new");
  var code = b.code || b.line || ("BUS-"+bid);
  var status = b.status || "active";
  var driver = b.driver || "";
  var plate  = b.plate  || "";
  var coords = (typeof b.lat==="number" && typeof b.lng==="number") ? (b.lat.toFixed(5)+", "+b.lng.toFixed(5)) : "—";

  return ''+
  '<div class="quick-pop">'+
    '<div class="fw-semibold mb-1">รถ #'+bid+' ('+esc(code)+')</div>'+
    '<div class="small text-muted mb-2">ตำแหน่งล่าสุด: '+coords+'</div>'+
    '<div class="row g-1 mb-2">'+
      '<div class="col-6"><label class="form-label form-label-sm">สถานะ</label>'+
      '<select id="bus-status-'+bid+'" class="form-select form-select-sm">'+
        '<option '+(status==="active"?"selected":"")+' value="active">active</option>'+
        '<option '+(status==="inactive"?"selected":"")+' value="inactive">inactive</option>'+
        '<option '+(status==="maintenance"?"selected":"")+' value="maintenance">maintenance</option>'+
      '</select></div>'+
      '<div class="col-6"><label class="form-label form-label-sm">ทะเบียน</label>'+
      '<input id="bus-plate-'+bid+'" class="form-control form-control-sm" value="'+esc(plate)+'"></div>'+
    '</div>'+
    '<div class="mb-2"><label class="form-label form-label-sm">คนขับ</label>'+
      '<input id="bus-driver-'+bid+'" class="form-control form-control-sm" value="'+esc(driver)+'">'+
    '</div>'+
    '<div class="d-flex gap-2">'+
      '<button id="bus-save-'+bid+'" class="btn btn-primary btn-sm">บันทึก</button>'+
      '<button id="bus-delete-'+bid+'" class="btn btn-outline-danger btn-sm">ลบ</button>'+
    '</div>'+
  '</div>';
}
function bindBusPopupEvents(marker, b){
  var bid     = String(b.id || "new");
  var $status = document.getElementById("bus-status-"+bid);
  var $plate  = document.getElementById("bus-plate-"+bid);
  var $driver = document.getElementById("bus-driver-"+bid);
  var $save   = document.getElementById("bus-save-"+bid);
  var $del    = document.getElementById("bus-delete-"+bid);

  if($save) $save.addEventListener("click", function(){
    var payload = {
      status: $status ? $status.value : b.status,
      plate : $plate  ? ($plate.value||"").trim()  : "",
      driver: $driver ? ($driver.value||"").trim() : ""
    };
    api("/admin/api/buses/"+b.id, {method:"PUT", body:j(payload)})
      .then(function(){ marker.closePopup(); return renderBuses(); })
      .catch(function(e){ console.error(e); });
  });
  if($del) $del.addEventListener("click", function(){
    if(!confirm("ลบรถคันนี้?")) return;
    api("/admin/api/buses/"+b.id, {method:"DELETE"})
      .then(function(){ return renderBuses(); })
      .catch(function(e){ console.error(e); });
  });
}

/* ===================== Stops Panel (จัดการป้าย) ===================== */
function populateStopsPanel(){
  var listEl = $("#stops-manage");
  if(!listEl) return Promise.resolve();

  return api("/admin/api/stops").catch(function(){ return []; }).then(function(stops){
    if(!Array.isArray(stops)) stops = [];
    listEl.innerHTML = "";

    stops.forEach(function(s){
      var card = document.createElement("div");
      card.className = "p-2 border rounded shadow-sm";
      card.innerHTML =
        '<div class="small text-muted mb-1">#'+s.id+'</div>'+
        '<div class="row g-1 align-items-center">'+
          '<div class="col-12"><input class="form-control form-control-sm" id="ps-name-'+s.id+'" value="'+esc(s.name)+'"></div>'+
          '<div class="col-6"><input class="form-control form-control-sm" id="ps-lat-'+ s.id+'" value="'+s.lat+'"></div>'+
          '<div class="col-6"><input class="form-control form-control-sm" id="ps-lng-'+ s.id+'" value="'+s.lng+'"></div>'+
        '</div>'+
        '<div class="d-flex gap-2 mt-2">'+
          '<button class="btn btn-primary btn-sm" id="ps-save-'+ s.id+'">บันทึก</button>'+
          '<button class="btn btn-outline-danger btn-sm" id="ps-del-'+  s.id+'">ลบ</button>'+
          '<button class="btn btn-outline-secondary btn-sm ms-auto" id="ps-focus-'+s.id+'">โฟกัสบนแผนที่</button>'+
        '</div>';
      listEl.appendChild(card);

      var $save  = document.getElementById("ps-save-"+s.id);
      var $del   = document.getElementById("ps-del-"+s.id);
      var $focus = document.getElementById("ps-focus-"+s.id);

      if($save) $save.addEventListener("click", function(){
        var name = (document.getElementById("ps-name-"+s.id).value||"").trim();
        var lat  = parseFloat(document.getElementById("ps-lat-"+ s.id).value);
        var lng  = parseFloat(document.getElementById("ps-lng-"+ s.id).value);
        if(!name||isNaN(lat)||isNaN(lng)){ alert("ข้อมูลไม่ครบ"); return; }
        api("/admin/api/stops/"+s.id, {method:"PUT", body:j({name:name, lat:lat, lng:lng})})
          .then(function(){
            var m = stopMarkers.get(String(s.id));
            if(m) {
              m.setLatLng([lat,lng]);
              if(settings.showStopLabels){
                m.unbindTooltip();
                m.bindTooltip(name||("Stop "+s.id), {permanent:true, direction:"top", className:"stop-label", offset:[0,-10]}).openTooltip();
              }
            }
            return renderStops();
          })
          .catch(function(e){ console.error(e); });
      });

      if($del) $del.addEventListener("click", function(){
        if(!confirm('ลบป้าย "'+(s.name||"")+'"?')) return;
        api("/admin/api/stops/"+s.id, {method:"DELETE"})
          .then(function(){ return populateStopsPanel().then(renderStops); })
          .catch(function(e){ console.error(e); });
      });

      if($focus) $focus.addEventListener("click", function(){
        map.setView([s.lat, s.lng], 18);
      });
    });
  });
}
function bindStopsPanelButtonsOnce(){
  var pickBtn   = $("#pick-on-map");
  var createBtn = $("#create-stop");
  var searchBox = $("#stops-search2");

  if(pickBtn && !pickBtn._wired){
    pickBtn._wired = true;
    pickBtn.addEventListener("click", function(){
      var c = map.getContainer(); c.style.cursor = "crosshair";
      var once = function(e){
        map.off("click", once);
        c.style.cursor = "";
        var lat = e.latlng.lat, lng = e.latlng.lng;
        var a = $("#new-lat"), b = $("#new-lng");
        if(a) a.value = lat.toFixed(6);
        if(b) b.value = lng.toFixed(6);
        if(tempMarker){ map.removeLayer(tempMarker); tempMarker=null; }
        tempMarker = L.marker([lat,lng], {icon:stopIcon}).addTo(map);
        setTimeout(function(){ if(tempMarker){ map.removeLayer(tempMarker); tempMarker=null; } }, 3000);
      };
      map.once("click", once);
      function onEsc(e){ if(e.key==="Escape"){ map.off("click", once); c.style.cursor=""; document.removeEventListener("keydown", onEsc);} }
      document.addEventListener("keydown", onEsc);
    });
  }
  if(createBtn && !createBtn._wired){
    createBtn._wired = true;
    createBtn.addEventListener("click", function(){
      var name = ($("#new-name") && $("#new-name").value || "").trim();
      var lat  = parseFloat($("#new-lat") && $("#new-lat").value);
      var lng  = parseFloat($("#new-lng") && $("#new-lng").value);
      if(!name || isNaN(lat) || isNaN(lng)){ alert("ข้อมูลไม่ครบ"); return; }
      api("/admin/api/stops", {method:"POST", body:j({name:name, lat:lat, lng:lng})})
        .then(function(){
          ["new-name","new-lat","new-lng"].forEach(function(id){ var el=document.getElementById(id); if(el) el.value=""; });
          return populateStopsPanel().then(renderStops);
        })
        .catch(function(e){ console.error(e); });
    });
  }
  if(searchBox && !searchBox._wired){
    searchBox._wired = true;
    searchBox.addEventListener("input", function(){
      var q = (searchBox.value||"").trim().toLowerCase();
      var cards = document.querySelectorAll("#stops-manage > div");
      Array.prototype.forEach.call(cards, function(card){
        card.style.display = card.textContent.toLowerCase().includes(q) ? "" : "none";
      });
    });
  }
}

/* ===================== Settings Panel ===================== */
function populateSettingsPanel(){
  if($("#set-map-style")) $("#set-map-style").value = settings.mapStyle;
  if($("#set-refresh"))   $("#set-refresh").value   = String(settings.refreshSec);
  if($("#set-zoom"))      $("#set-zoom").value      = String(settings.zoom);
  if($("#set-center-lat")) $("#set-center-lat").value = settings.center[0].toFixed(6);
  if($("#set-center-lng")) $("#set-center-lng").value = settings.center[1].toFixed(6);
  if($("#set-show-bus-labels"))  $("#set-show-bus-labels").checked  = !!settings.showBusLabels;
  if($("#set-show-stop-labels")) $("#set-show-stop-labels").checked = !!settings.showStopLabels;
}
function bindSettingsButtonsOnce(){
  var saveBtn = $("#set-save");
  var resetBtn= $("#set-reset");
  var pickBtn = $("#set-pick-center");

  if(pickBtn && !pickBtn._wired){
    pickBtn._wired = true;
    pickBtn.addEventListener("click", function(){
      var c = map.getContainer(); c.style.cursor="crosshair";
      var once = function(e){
        map.off("click", once);
        c.style.cursor="";
        var lat=e.latlng.lat, lng=e.latlng.lng;
        if($("#set-center-lat")) $("#set-center-lat").value = lat.toFixed(6);
        if($("#set-center-lng")) $("#set-center-lng").value = lng.toFixed(6);
        if(tempMarker){ map.removeLayer(tempMarker); tempMarker=null; }
        tempMarker = L.marker([lat,lng], {icon:stopIcon}).addTo(map);
        setTimeout(function(){ if(tempMarker){ map.removeLayer(tempMarker); tempMarker=null; } }, 2500);
      };
      map.once("click", once);
      function onEsc(e){ if(e.key==="Escape"){ map.off("click", once); c.style.cursor=""; document.removeEventListener("keydown", onEsc); } }
      document.addEventListener("keydown", onEsc);
    });
  }

  if(saveBtn && !saveBtn._wired){
    saveBtn._wired = true;
    saveBtn.addEventListener("click", function(){
      var ms   = $("#set-map-style") ? $("#set-map-style").value : "osm";
      var rf   = $("#set-refresh")   ? parseInt($("#set-refresh").value,10) : defaultSettings.refreshSec;
      var zoom = $("#set-zoom")      ? parseInt($("#set-zoom").value,10)    : defaultSettings.zoom;
      var lat  = $("#set-center-lat")? parseFloat($("#set-center-lat").value): settings.center[0];
      var lng  = $("#set-center-lng")? parseFloat($("#set-center-lng").value): settings.center[1];
      var busL = $("#set-show-bus-labels")  ? $("#set-show-bus-labels").checked  : settings.showBusLabels;
      var stopL= $("#set-show-stop-labels") ? $("#set-show-stop-labels").checked : settings.showStopLabels;

      if(isNaN(rf)||rf<1) rf = defaultSettings.refreshSec;
      if(isNaN(zoom)||zoom<3||zoom>20) zoom = defaultSettings.zoom;
      if(isNaN(lat)||isNaN(lng)){ alert("Center ไม่ถูกต้อง"); return; }

      var needTileChange = (settings.mapStyle !== ms);
      var needTimerChange= (settings.refreshSec !== rf);

      settings.mapStyle = ms;
      settings.refreshSec = rf;
      settings.center = [lat, lng];
      settings.zoom = zoom;
      settings.showBusLabels = !!busL;
      settings.showStopLabels = !!stopL;

      saveSettings();
      applySettings(needTileChange, needTimerChange);
    });
  }

  if(resetBtn && !resetBtn._wired){
    resetBtn._wired = true;
    resetBtn.addEventListener("click", function(){
      settings = JSON.parse(JSON.stringify(defaultSettings));
      saveSettings();
      populateSettingsPanel();
      applySettings(true, true);
    });
  }
}
function applySettings(changeTile, changeTimer){
  if(changeTile){ setBaseLayer(settings.mapStyle); }
  map.setView(settings.center, settings.zoom);

  if(changeTimer){ startBusTimer(); }
  renderStops();
  renderBuses();
}
function startBusTimer(){
  if(busRefreshTimer) clearInterval(busRefreshTimer);
  busRefreshTimer = setInterval(renderBuses, settings.refreshSec*1000);
}

/* ===================== search list (หน้า “ค้นหา”) ===================== */
function filterStopList(){
  var qEl = $("#search-stop");
  var list = $("#stop-list");
  if(!qEl || !list) return;
  var q = (qEl.value||"").trim().toLowerCase();
  var items = list.querySelectorAll("li");
  Array.prototype.forEach.call(items, function(li){
    li.style.display = li.textContent.toLowerCase().includes(q) ? "" : "none";
  });
}

// ===== Theme toggle (Light/Dark) =====
(function(){
  var KEY = "adminTheme";
  var btn = document.getElementById("btn-theme");
  function apply(theme){
    var t = (theme === "dark") ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", t);
    if (btn) btn.textContent = (t === "dark") ? "☀️" : "🌙";
  }
  var saved = localStorage.getItem(KEY) || "light";
  apply(saved);
  if (btn){
    btn.addEventListener("click", function(){
      var now = (localStorage.getItem(KEY) || "light");
      var next = (now === "dark") ? "light" : "dark";
      localStorage.setItem(KEY, next);
      apply(next);
    });
  }
})();

/* ===================================================== */
/* ==================== ROUTES (สาย) =================== */
/* ===================================================== */

// 3.1/3.2: เลเยอร์ + render + โหลดรายการ
let rtLayer, rtWorkLayer;
let rtDrawing = false, rtWorkCoords = [];
let rtWorkLine = null;

function rtInitLayers(){
  rtLayer = L.layerGroup().addTo(map);
  rtWorkLayer = L.layerGroup().addTo(map);
}
function rtRenderRoutesOnMap(list){
  if (!rtLayer) return;
  rtLayer.clearLayers();
  (list||[]).forEach(function(r){
    if (Array.isArray(r.path) && r.path.length >= 2){
      L.polyline(r.path, {color: r.color || "#2f6cf7", weight:5, opacity:.9})
        .addTo(rtLayer)
        .bindTooltip(r.name || ("Route "+r.id), {direction:"top"});
    }
  });
}
function rtPopulatePanel(){
  var box = $("#routes-manage");
  if (!box) return Promise.resolve();

  return api("/admin/api/routes").then(function(list){
    rtRenderRoutesOnMap(list||[]);
    var k = $("#kpi-routes"); if (k) k.textContent = String((list||[]).length || "—");

    box.innerHTML = "";
    (list||[]).forEach(function(r){
      var card = document.createElement("div");
      card.className = "panel p-3";
      card.innerHTML =
        '<div class="small text-muted mb-1">#'+r.id+' · จุดเส้น: '+(Array.isArray(r.path)?r.path.length:0)+'</div>'+
        '<div class="row g-1 align-items-center">'+
          '<div class="col-8"><input id="pr-name-'+r.id+'" class="form-control form-control-sm" value="'+esc(r.name||"")+'"></div>'+
          '<div class="col-4"><input id="pr-color-'+r.id+'" type="color" class="form-control form-control-color form-control-sm" value="'+esc(r.color||"#2f6cf7")+'"></div>'+
        '</div>'+
        '<div class="d-flex gap-2 mt-2">'+
          '<button class="btn btn-primary btn-sm" id="pr-save-'+r.id+'">บันทึก</button>'+
          '<button class="btn btn-outline-danger btn-sm" id="pr-del-'+r.id+'">ลบ</button>'+
          '<button class="btn btn-outline-secondary btn-sm ms-auto" id="pr-focus-'+r.id+'">โฟกัส</button>'+
        '</div>';
      box.appendChild(card);

      $("#pr-save-"+r.id)?.addEventListener("click", async function(){
        var name  = ($("#pr-name-"+r.id).value || "").trim();
        var color = $("#pr-color-"+r.id).value || "#2f6cf7";
        await api("/admin/api/routes/"+r.id, {method:"PUT", body:j({name:name, color:color})}).catch(console.error);
        rtPopulatePanel();
      });
      $("#pr-del-"+r.id)?.addEventListener("click", async function(){
        if(!confirm('ลบสาย "'+(r.name||"")+'"?')) return;
        await api("/admin/api/routes/"+r.id, {method:"DELETE"}).catch(console.error);
        rtPopulatePanel();
      });
      $("#pr-focus-"+r.id)?.addEventListener("click", function(){
        if (r.path && r.path.length){
          map.fitBounds(L.polyline(r.path).getBounds(), {padding:[20,20]});
        }
      });
    });
  }).catch(function(e){
    console.error(e);
  });
}

// 3.3: ผูกปุ่มใน panel routes (ค้นหา + วาด/บันทึก/ยกเลิก)
function rtBindPanelOnce(){
  var search = $("#routes-search");
  if (search && !search._wired){
    search._wired = true;
    search.addEventListener("input", function(){
      var q = (search.value || "").trim().toLowerCase();
      document.querySelectorAll("#routes-manage > .panel").forEach(function(card){
        card.style.display = card.textContent.toLowerCase().includes(q) ? "" : "none";
      });
    });
  }
  var bDraw   = $("#rt-new-draw");
  var bSave   = $("#rt-new-save");
  var bCancel = $("#rt-new-cancel");

  if (bDraw && !bDraw._wired){   bDraw._wired   = true; bDraw.addEventListener("click", rtStartDraw); }
  if (bSave && !bSave._wired){   bSave._wired   = true; bSave.addEventListener("click", rtSaveNew); }
  if (bCancel && !bCancel._wired){ bCancel._wired = true; bCancel.addEventListener("click", rtCancelDraw); }
}

// 3.4: วาดเส้นใหม่ / save / cancel
function rtStartDraw(){
  if (rtDrawing) return;
  rtDrawing = true; rtWorkCoords = [];
  rtWorkLayer.clearLayers();

  var color = $("#rt-new-color")?.value || "#2f6cf7";
  rtWorkLine = L.polyline([], {color: color, weight:5, dashArray:"6,6"}).addTo(rtWorkLayer);

  map.getContainer().style.cursor = "crosshair";
  map.on("click", rtDrawClick);
  document.addEventListener("keydown", rtDrawKeys);

  if($("#rt-new-save"))   $("#rt-new-save").disabled   = false;
  if($("#rt-new-cancel")) $("#rt-new-cancel").disabled = false;
}
function rtDrawClick(e){
  rtWorkCoords.push([e.latlng.lat, e.latlng.lng]);
  rtWorkLine.setLatLngs(rtWorkCoords);
}
function rtDrawKeys(e){
  if (!rtDrawing) return;
  if (e.key === "Escape"){ rtCancelDraw(); }
  if (e.key === "Backspace" || e.key === "Delete"){
    rtWorkCoords.pop(); rtWorkLine.setLatLngs(rtWorkCoords);
  }
}
function rtCancelDraw(){
  rtDrawing = false;
  map.off("click", rtDrawClick);
  document.removeEventListener("keydown", rtDrawKeys);
  map.getContainer().style.cursor = "";
  rtWorkLayer.clearLayers(); rtWorkCoords = [];
  if($("#rt-new-save"))   $("#rt-new-save").disabled   = true;
  if($("#rt-new-cancel")) $("#rt-new-cancel").disabled = true;
}
async function rtSaveNew(){
  var name  = ($("#rt-new-name")?.value || "").trim() || "Route";
  var color = $("#rt-new-color")?.value || "#2f6cf7";
  if (!rtDrawing || rtWorkCoords.length < 2){
    alert("ยังไม่ได้วาดเส้นทาง (อย่างน้อย 2 จุด)"); return;
  }
  await api("/admin/api/routes", {method:"POST", body:j({name:name, color:color, path: rtWorkCoords})}).catch(console.error);
  var nm = $("#rt-new-name"); if (nm) nm.value = "";
  rtCancelDraw();
  rtPopulatePanel();
}
