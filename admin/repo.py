# admin/repo.py
class InMemoryRepo:
    def __init__(self):
        # seed data
        self._stop_id = 3
        self.stops = [
            {"id": 1, "name": "KMITL Gate", "lat": 13.7295, "lng": 100.7750},
            {"id": 2, "name": "Dorm A",     "lat": 13.7302, "lng": 100.7765},
            {"id": 3, "name": "ECC",        "lat": 13.7313, "lng": 100.7776},
        ]

        self._bus_id = 1
        self.buses = [
            {"id": 1, "code": "A1", "status": "active", "driver": "Somchai",
             "plate": "กข-1234", "lat": 13.7298, "lng": 100.7763}
        ]

        # ★ routes
        self._route_id = 1
        self.routes = [
            {
                "id": 1,
                "name": "Campus Loop",
                "color": "#2f6cf7",
                # เส้นทางตัวอย่าง (lat,lng)
                "path": [
                    [13.7298, 100.7763],
                    [13.7306, 100.7772],
                    [13.7312, 100.7761],
                    [13.7300, 100.7752],
                ],
            }
        ]

    # ---------- stops ----------
    def list_stops(self):
        return self.stops

    def create_stop(self, data):
        self._stop_id += 1
        item = {"id": self._stop_id, **data}
        self.stops.append(item)
        return item

    def update_stop(self, stop_id, data):
        for s in self.stops:
            if s["id"] == stop_id:
                s.update(data)
                return s
        return None

    def delete_stop(self, stop_id):
        before = len(self.stops)
        self.stops = [s for s in self.stops if s["id"] != stop_id]
        return len(self.stops) != before

    # ---------- buses ----------
    def list_buses(self):
        return self.buses

    def create_bus(self, data):
        self._bus_id += 1
        item = {"id": self._bus_id, **data}
        self.buses.append(item)
        return item

    def update_bus(self, bus_id, data):
        for b in self.buses:
            if b["id"] == bus_id:
                b.update(data)
                return b
        return None

    def delete_bus(self, bus_id):
        before = len(self.buses)
        self.buses = [b for b in self.buses if b["id"] != bus_id]
        return len(self.buses) != before

    # ---------- routes (★ ใหม่) ----------
    def list_routes(self):
        return self.routes

    def create_route(self, data):
        self._route_id += 1
        item = {
            "id": self._route_id,
            "name": data.get("name", f"Route {self._route_id}"),
            "color": data.get("color", "#2f6cf7"),
            "path": data.get("path", []),
        }
        self.routes.append(item)
        return item

    def update_route(self, route_id, data):
        for r in self.routes:
            if r["id"] == route_id:
                r.update({
                    k: v for k, v in data.items()
                    if k in ("name", "color", "path")
                })
                return r
        return None

    def delete_route(self, route_id):
        before = len(self.routes)
        self.routes = [r for r in self.routes if r["id"] != route_id]
        return len(self.routes) != before
