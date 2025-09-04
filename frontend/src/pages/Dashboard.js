 import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState } from "react";
import useSocket from "../hooks/useSocket";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import "./Dashboard.css"; // ✅ Import CSS

// Fix Leaflet default marker issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function Dashboard() {
  const { socket, isConnected } = useSocket();
  const [vehicles, setVehicles] = useState([]);
  const [trafficData, setTrafficData] = useState([]);
  const [finesData, setFinesData] = useState([]);
  const [alerts, setAlerts] = useState([]); // 🚨 live alerts
  const [violationStats, setViolationStats] = useState([]); // 🍩 donut data

  // Fetch violation type stats
  useEffect(() => {
    async function fetchViolationStats() {
      try {
        const res = await fetch("http://localhost:5000/api/violations/stats");
        const data = await res.json();
        setViolationStats(data);
      } catch (err) {
        console.error("Error fetching violation stats:", err);
      }
    }
    fetchViolationStats();
  }, []);

  // Socket listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on("vehicleUpdate", (data) => {
      setVehicles((prev) => {
        const updated = [...prev];
        const idx = updated.findIndex(
          (v) => v.id === data.id || v._id === data._id
        );
        if (idx !== -1) updated[idx] = { ...updated[idx], ...data };
        else updated.push(data);
        return updated;
      });
    });

    socket.on("trafficStats", (data) => setTrafficData(data || []));
    socket.on("finesStats", (data) => setFinesData(data || []));
    socket.on("alert", (alert) =>
      setAlerts((prev) => [alert, ...prev].slice(0, 50))
    );

    return () => {
      socket.off("vehicleUpdate");
      socket.off("trafficStats");
      socket.off("finesStats");
      socket.off("alert");
    };
  }, [socket, isConnected]);

  const COLORS = ["#ff4d4f", "#1890ff", "#faad14", "#722ed1", "#13c2c2"];

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Live Traffic Dashboard</h2>

      {/* Connection status */}
      <p className={isConnected ? "status-connected" : "status-disconnected"}>
        {isConnected ? "🟢 Connected to server" : "🔴 Disconnected"}
      </p>

      {/* Map */}
      <div className="map-container">
        <MapContainer
          center={[20.5937, 78.9629]}
          zoom={5}
          className="map"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          {vehicles
            .filter((v) => v.lat != null && v.lng != null)
            .map((v) => (
              <Marker key={v.id || v._id} position={[v.lat, v.lng]}>
                <Popup>
                  <b>Vehicle ID:</b> {v.id || v._id} <br />
                  <b>Speed:</b> {v.speed || 0} km/h <br />
                  <b>Status:</b> {v.status || "Unknown"}
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </div>

      {/* Charts row */}
      <div className="charts-row">
        {/* Congestion */}
        <div className="chart-card">
          <h3 className="chart-title">Congestion Levels</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={trafficData.length ? trafficData : [{ time: "", congestion: 0 }]}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="congestion" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Fines */}
        <div className="chart-card">
          <h3 className="chart-title">Fines Collected</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={finesData.length ? finesData : [{ day: "", fines: 0 }]}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="fines" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Second row */}
      <div className="charts-row">
        {/* 🍩 Violation Types */}
        <div className="chart-card">
          <h3 className="chart-title">Violation Types</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={
                  violationStats.length
                    ? violationStats
                    : [{ name: "No Data", value: 1 }]
                }
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {(violationStats.length
                  ? violationStats
                  : [{ name: "No Data", value: 1 }]
                ).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 🚨 Live Alerts */}
        <div className="alert-box">
          <h3 className="chart-title">🚨 Live Violation Alerts</h3>
          {alerts.length === 0 ? (
            <p className="text-gray-600">No violations yet...</p>
          ) : (
            <ul className="alerts-list">
              {alerts.map((a, i) => (
                <li key={i} className="alert-item">
                  <div className="alert-content">
                    <span><b>Vehicle:</b> {a.vehicle}</span>
                    <span><b>Type:</b> {a.type}</span>
                    <span><b>Fine:</b> ₹{a.fine}</span>
                    <span><b>Speed:</b> {a.speed ?? "N/A"} km/h</span>
                    <span><b>Loc:</b> {a.lat ?? "N/A"}, {a.lng ?? "N/A"}</span>
                    <span><b>Time:</b> {a.timestamp ? new Date(a.timestamp).toLocaleString() : "N/A"}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
