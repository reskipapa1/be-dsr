import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

// Import routes
import authRoutes from "./routes/authroute";
import databarangRoutes from "./routes/databarangroute";
import barangunitRoutes from "./routes/barangunitroute";
import lokasiRoutes from "./routes/lokasiroute";
import monitoringRoutes from "./routes/monitoringroute";
import peminjamanRoutes from "./routes/peminjamanroute";
import laporanRoutes from "./routes/laporanroute";
import cronRoute from "./routes/cronRoute";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware - UPDATE DISINI
// crossOriginResourcePolicy: { policy: "cross-origin" } PENTING agar frontend bisa akses resource
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } 
}));

// Daftar origin static yang diizinkan
const allowedOrigins =  [
  "http://localhost:3000",
  "https://fe-dsr.vercel.app",
  "https://be-dsr-sepia.vercel.app",
];

// Middleware CORS Manual yang Lebih Kuat
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Log request masuk agar kita tahu origin-nya apa
  console.log(`📡 Request from: ${origin || 'Unknown'} | Method: ${req.method} | Path: ${req.path}`);

  // IZINKAN JIKA:
  // 1. Origin ada di list allowedOrigins
  // 2. ATAU Origin berakhiran .vercel.app (untuk semua preview deployment)
  // 3. ATAU tidak ada origin (misal dari Postman/Server-to-Server)
  const isAllowed = 
    !origin || 
    allowedOrigins.includes(origin) || 
    (origin && origin.endsWith(".vercel.app"));

  if (isAllowed) {
    // Gunakan origin asli request agar browser senang
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    console.log(`✅ CORS Diizinkan untuk: ${origin}`);
  } else {
    console.log(`❌ CORS Ditolak untuk: ${origin}`);
  }

  // Handle preflight OPTIONS langsung disini
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  next();
});

// Body parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Routes
app.get("/", (_req: Request, res: Response) => {
  res.json({ success: true, message: "Backend DSR API is running", version: "1.0.1" });
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({ success: true, status: "healthy" });
});

const API_PREFIX = "/api";
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/databarang`, databarangRoutes);
app.use(`${API_PREFIX}/barangunit`, barangunitRoutes);
app.use(`${API_PREFIX}/lokasi`, lokasiRoutes);
app.use(`${API_PREFIX}/monitoring`, monitoringRoutes);
app.use(`${API_PREFIX}/peminjaman`, peminjamanRoutes);
app.use(`${API_PREFIX}/laporan`, laporanRoutes);
app.use("/api/cron", cronRoute); 

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: "Endpoint not found" });
});

// Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Global error:", err);
  res.status(500).json({ success: false, message: err.message || "Internal Server Error" });
});

// Server Start (Dev only)
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

export default app;
