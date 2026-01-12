import express, { Request, Response } from "express";
import { autoActivate, autoComplete, autoCancelPending } from "../utils/cron"; // Sesuaikan path ke file utils tadi

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  // 1. Cek Password (Security)
  // Di Express, header biasanya lowercase 'authorization' atau ambil dari req.headers
  const authHeader = req.headers.authorization;

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // 2. Jalankan Mesin Cron
  try {
    await Promise.all([
      autoActivate(),
      autoComplete(),
      autoCancelPending(),
    ]);

    return res.status(200).json({
      success: true,
      message: "Cron jobs executed successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
