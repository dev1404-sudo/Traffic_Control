import express from "express";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import connectDB from "./config/db.js";

// Models
import Vehicle from "./models/Vehicle.js";
import Tracking from "./models/Tracking.js";
import Violation from "./models/Fine.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import vehicleRoutes from "./routes/vehicleRoutes.js";
import trackingRoutes from "./routes/trackingRoutes.js";
import violationRoutes from "./routes/fineRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";
// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize app
const app = express();
app.use(express.json());
app.use(cors());

// Create HTTP server & bind socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // ✅ replace in production
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// Attach socket.io instance to all requests
app.use((req, res, next) => {
  req.io = io;
  next();
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/tracking", trackingRoutes);
app.use("/api/violations", violationRoutes);
app.use("/api/wallet", walletRoutes);
// Root endpoint
app.get("/", (req, res) => {
  res.send("🚦 Traffic Control & Fleet Monitoring API is running...");
});

// ============================
//   HELPER FUNCTION
// ============================
async function buildAlertFromViolation(vDoc) {
  try {
    const vehicle = await Vehicle.findById(vDoc.vehicle).lean();
    const latestTrack = await Tracking.findOne({ vehicle: vDoc.vehicle })
      .sort({ timestamp: -1 })
      .lean();

    return {
      vehicle: vehicle?.plateNumber || vehicle?._id?.toString() || "Unknown",
      type: vDoc.type,
      fine: vDoc.fine,
      speed: latestTrack?.speed ?? null,
      lat: latestTrack?.location?.lat ?? null,
      lng: latestTrack?.location?.lng ?? null,
      timestamp: vDoc.timestamp || vDoc.createdAt,
    };
  } catch (err) {
    console.error("❌ Error building violation alert:", err.message);
    return null;
  }
}

// ============================
//   SOCKET.IO LIVE UPDATES
// ============================
io.on("connection", async (socket) => {
  console.log("🟢 Client connected:", socket.id);

  // Vehicle Updates (latest positions from Tracking collection)
  setInterval(async () => {
    try {
      const latestTracking = await Tracking.find({})
        .sort({ timestamp: -1 })
        .limit(10)
        .populate("vehicle", "id status plateNumber");

      const vehicleData = latestTracking.map((t) => ({
        id: t.vehicle?._id,
        plateNumber: t.vehicle?.plateNumber,
        lat: t.location?.lat,
        lng: t.location?.lng,
        speed: t.speed,
        status: t.vehicle?.status || "Unknown",
      }));

      socket.emit("vehicleUpdate", vehicleData);
    } catch (err) {
      console.error("❌ Error fetching vehicle updates:", err.message);
    }
  }, 5000);

  // Traffic Stats
  setInterval(async () => {
    try {
      const trafficStats = await Tracking.aggregate([
        {
          $group: {
            _id: {
              $dateToString: { format: "%H:%M", date: "$timestamp" },
            },
            congestion: { $avg: "$congestionLevel" }, // requires field in Tracking
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 10 },
      ]);

      socket.emit(
        "trafficStats",
        trafficStats.map((t) => ({
          time: t._id,
          congestion: Math.round(t.congestion || 0),
        }))
      );
    } catch (err) {
      console.error("❌ Error fetching traffic stats:", err.message);
    }
  }, 7000);

  // Fines Stats
  setInterval(async () => {
    try {
      const finesStats = await Violation.aggregate([
        {
          $group: {
            _id: { $dayOfWeek: "$timestamp" },
            fines: { $sum: "$fine" },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      socket.emit(
        "finesStats",
        finesStats.map((f) => ({
          day: days[f._id - 1],
          fines: f.fines,
        }))
      );
    } catch (err) {
      console.error("❌ Error fetching fines stats:", err.message);
    }
  }, 10000);

  // ============================
  // 🚨 LIVE VIOLATION ALERTS
  // ============================
  try {
    // Send last 10 violations immediately
    const recentViolations = await Violation.find({})
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();

    for (const v of recentViolations) {
      const alert = await buildAlertFromViolation(v);
      if (alert) socket.emit("alert", alert);
    }

    // Watch for new violations in real time
    const changeStream = Violation.watch([], { fullDocument: "updateLookup" });
    changeStream.on("change", async (change) => {
      if (change.operationType === "insert") {
        const full = change.fullDocument;
        const alert = await buildAlertFromViolation(full);
        if (alert) socket.emit("alert", alert);
      }
    });

    socket.on("disconnect", () => {
      console.log("🔴 Client disconnected:", socket.id);
      changeStream.close();
    });
  } catch (err) {
    console.error("❌ Error setting up violation alerts:", err.message);
  }
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`🚦 Server running on port ${PORT}`)
);
