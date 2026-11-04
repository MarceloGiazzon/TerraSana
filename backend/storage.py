"""Histórico de telemetria em SQLite.

Guarda cada leitura recebida do MQTT com os campos usados nos gráficos e no
mapa de umidade, além do JSON completo para consultas futuras.
"""

import json
import sqlite3
import threading
import time
from pathlib import Path
from typing import Any

SCHEMA = """
CREATE TABLE IF NOT EXISTS telemetry (
    id INTEGER PRIMARY KEY,
    received_at REAL NOT NULL,
    robot_id TEXT,
    module TEXT,
    latitude REAL,
    longitude REAL,
    battery_percent REAL,
    soil_moisture_percent REAL,
    payload TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_telemetry_received_at ON telemetry (received_at);
"""

PRUNE_EVERY = 500  # inserções entre limpezas de registros antigos


def _number(value: Any) -> float | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    return None


class TelemetryStore:
    def __init__(self, path: str | Path, retention_days: float = 7):
        self.path = Path(path)
        self.retention_s = retention_days * 86400
        if str(self.path) != ":memory:":
            self.path.parent.mkdir(parents=True, exist_ok=True)
        # O MQTT entrega no loop de eventos; os endpoints síncronos rodam no
        # threadpool do FastAPI. Uma conexão compartilhada protegida por lock basta.
        self._db = sqlite3.connect(self.path, check_same_thread=False)
        self._db.row_factory = sqlite3.Row
        self._lock = threading.Lock()
        self._inserts = 0
        with self._lock:
            self._db.execute("PRAGMA journal_mode=WAL")
            self._db.executescript(SCHEMA)

    def add(self, payload: dict[str, Any], received_at: float | None = None) -> None:
        received_at = received_at or time.time()
        location = payload.get("location") if isinstance(payload.get("location"), dict) else {}
        status = payload.get("status") if isinstance(payload.get("status"), dict) else {}
        environmental = payload.get("environmental") if isinstance(payload.get("environmental"), dict) else {}
        module = status.get("active_module")
        robot_id = payload.get("robot_id")
        row = (
            received_at,
            robot_id if isinstance(robot_id, str) else None,
            module if isinstance(module, str) else None,
            _number(location.get("latitude")),
            _number(location.get("longitude")),
            _number(status.get("battery_percent")),
            _number(environmental.get("soil_moisture_percent")),
            json.dumps(payload, ensure_ascii=False),
        )
        with self._lock:
            self._db.execute(
                "INSERT INTO telemetry (received_at, robot_id, module, latitude, longitude,"
                " battery_percent, soil_moisture_percent, payload) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                row,
            )
            self._inserts += 1
            if self._inserts % PRUNE_EVERY == 0:
                self._db.execute("DELETE FROM telemetry WHERE received_at < ?", (received_at - self.retention_s,))
            self._db.commit()

    def latest(self) -> dict[str, Any] | None:
        with self._lock:
            row = self._db.execute("SELECT payload FROM telemetry ORDER BY id DESC LIMIT 1").fetchone()
        return json.loads(row["payload"]) if row else None

    def history(self, minutes: float, limit: int, robot_id: str | None = None) -> list[dict[str, Any]]:
        since = time.time() - minutes * 60
        query = (
            "SELECT received_at, robot_id, module, latitude, longitude, battery_percent,"
            " soil_moisture_percent FROM telemetry WHERE received_at >= ?"
        )
        params: list[Any] = [since]
        if robot_id:
            query += " AND robot_id = ?"
            params.append(robot_id)
        # Pega as leituras mais recentes e devolve em ordem cronológica.
        query = f"SELECT * FROM ({query} ORDER BY id DESC LIMIT ?) ORDER BY received_at ASC"
        params.append(limit)
        with self._lock:
            rows = self._db.execute(query, params).fetchall()
        return [
            {
                "ts": round(row["received_at"], 3),
                "robot_id": row["robot_id"],
                "module": row["module"],
                "lat": row["latitude"],
                "lng": row["longitude"],
                "battery": row["battery_percent"],
                "moisture": row["soil_moisture_percent"],
            }
            for row in rows
        ]

    def close(self) -> None:
        with self._lock:
            self._db.close()
