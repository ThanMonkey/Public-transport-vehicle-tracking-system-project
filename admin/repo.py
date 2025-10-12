from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional

@dataclass
class InMemoryRepo:
    buses: List[Dict[str, Any]] = field(default_factory=lambda: [
        {"id": 1, "code": "BUS-01", "plate": "1กก-1234", "status": "active",   "driver": "Somchai", "lat": 13.7292, "lng": 100.7765},
        {"id": 2, "code": "BUS-02", "plate": "2ขข-5678", "status": "inactive", "driver": "Somsri",  "lat": 13.7305, "lng": 100.7755},
    ])
    stops: List[Dict[str, Any]] = field(default_factory=lambda: [
        {"id": 1, "name": "KMITL Gate", "lat": 13.7297, "lng": 100.7782},
        {"id": 2, "name": "Dorm A",     "lat": 13.7269, "lng": 100.7761},
        {"id": 3, "name": "ECC",        "lat": 13.7319, "lng": 100.7780},
    ])

    def _next(self, items: List[Dict[str, Any]]) -> int:
        return (max([i["id"] for i in items]) + 1) if items else 1

    # buses
    def list_buses(self): return self.buses
    def create_bus(self, data: Dict[str, Any]):
        data["id"] = self._next(self.buses); self.buses.append(data); return data
    def update_bus(self, bus_id: int, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        for b in self.buses:
            if b["id"] == bus_id:
                b.update({k: v for k, v in data.items() if v is not None}); return b
        return None
    def delete_bus(self, bus_id: int) -> bool:
        n = len(self.buses); self.buses = [b for b in self.buses if b["id"] != bus_id]; return len(self.buses) < n

    # stops
    def list_stops(self): return self.stops
    def create_stop(self, data: Dict[str, Any]):
        data["id"] = self._next(self.stops); self.stops.append(data); return data
    def update_stop(self, stop_id: int, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        for s in self.stops:
            if s["id"] == stop_id:
                s.update({k: v for k, v in data.items() if v is not None}); return s
        return None
    def delete_stop(self, stop_id: int) -> bool:
        n = len(self.stops); self.stops = [s for s in self.stops if s["id"] != stop_id]; return len(self.stops) < n
