import time

from fastapi.testclient import TestClient

import main
from storage import TelemetryStore


def reading(index, module="M03_SOLO_PROFUNDO"):
    return {
        "robot_id": "agbot_teste",
        "location": {"latitude": -29.1161 - index * 1e-5, "longitude": -51.2250},
        "status": {"battery_percent": 90 - index, "active_module": module},
        "module_telemetry": {"ph": 6.1},
        "environmental": {"soil_moisture_percent": 30 + index},
    }


def test_store_keeps_order_limit_and_latest(tmp_path):
    store = TelemetryStore(tmp_path / "t.db")
    now = time.time()
    for i in range(5):
        store.add(reading(i), received_at=now - 50 + i)
    points = store.history(minutes=5, limit=3)
    assert [p["moisture"] for p in points] == [32, 33, 34]  # as 3 mais recentes, em ordem
    assert points[-1]["module"] == "M03_SOLO_PROFUNDO"
    assert store.latest()["status"]["battery_percent"] == 86
    store.close()


def test_store_window_and_robot_filter(tmp_path):
    store = TelemetryStore(tmp_path / "t.db")
    now = time.time()
    store.add(reading(0), received_at=now - 3600)  # fora da janela de 30 min
    store.add(reading(1), received_at=now)
    other = reading(2)
    other["robot_id"] = "outro"
    store.add(other, received_at=now)
    assert len(store.history(minutes=30, limit=100)) == 2
    assert len(store.history(minutes=30, limit=100, robot_id="outro")) == 1
    store.close()


def test_store_tolerates_partial_payload(tmp_path):
    store = TelemetryStore(tmp_path / "t.db")
    store.add({"status": "texto inesperado", "location": None})
    point = store.history(minutes=1, limit=10)[0]
    assert point["lat"] is None and point["module"] is None
    store.close()


def test_history_endpoint_and_persistence(tmp_path, monkeypatch):
    db = tmp_path / "api.db"
    monkeypatch.setattr(main, "DB_PATH", str(db))
    with TestClient(main.app) as client:
        main.handle_message(main.app, reading(0))
        main.handle_message(main.app, reading(1))
        body = client.get("/telemetry/history", params={"minutes": 10}).json()
        assert body["count"] == 2
        assert client.get("/telemetry/history", params={"minutes": 0}).status_code == 422
    # Ao reiniciar, a última leitura volta do banco.
    with TestClient(main.app) as client:
        assert client.get("/telemetry/latest").json()["environmental"]["soil_moisture_percent"] == 31
