// File: src/utils/cron.ts

import prisma from "../prismaClient"; // Sesuaikan path import ini
import dayjs from "dayjs";
import {
  StatusP,
  StatusB,
  StatusBooking,
  StatusLokasi,
} from "../../generated/prisma"; // Sesuaikan path ini

// --------------------------------------------------------
// Tambahkan kata "export" di depan const
// --------------------------------------------------------

export const autoActivate = async () => {
  try {
    const now = new Date();
    const bookings = await prisma.peminjamanP.findMany({
      where: {
        status: StatusP.booking,
        verifikasi: StatusBooking.diterima,
        waktuMulai: { lte: now },
      },
      include: { items: true, lokasi: true },
    });

    if (bookings.length === 0) return;
    console.log(`[CRON] Found ${bookings.length} booking(s) to activate`);

    for (const booking of bookings) {
      // ... (Isi logika sama persis seperti sebelumnya) ...
       await prisma.$transaction(async (tx) => {
        await tx.peminjamanP.update({
          where: { id: booking.id },
          data: { status: StatusP.aktif },
        });

        const nupList = booking.items.map((item) => item.nupBarang);
        if (nupList.length > 0) {
            await tx.barangUnit.updateMany({
                where: { nup: { in: nupList } },
                data: { status: StatusB.TidakTersedia },
            });
        }

        if (booking.kodeLokasi) {
          await tx.dataLokasi.update({
            where: { kode_lokasi: booking.kodeLokasi },
            data: { status: StatusLokasi.dipinjam },
          });
        }
      });
      console.log(`[CRON] ✓ Booking ${booking.id} activated`);
    }
  } catch (error) {
    console.error("[CRON] Auto-activate error:", error);
  }
};

export const autoComplete = async () => {
  // ... (Copy isi fungsi autoComplete di sini) ...
   try {
    const now = new Date();
    const activeBookings = await prisma.peminjamanP.findMany({
      where: {
        status: StatusP.aktif,
        waktuSelesai: { lte: now },
      },
      include: { items: true, lokasi: true },
    });

    if (activeBookings.length === 0) return;
    console.log(`[CRON] Found ${activeBookings.length} active booking(s) to complete`);

    for (const booking of activeBookings) {
      await prisma.$transaction(async (tx) => {
        await tx.peminjamanP.update({
          where: { id: booking.id },
          data: { status: StatusP.selesai },
        });

        const nupList = booking.items.map((item) => item.nupBarang);
        if (nupList.length > 0) {
            await tx.barangUnit.updateMany({
                where: { nup: { in: nupList } },
                data: { status: StatusB.Tersedia },
            });
        }

        if (booking.kodeLokasi) {
          await tx.dataLokasi.update({
            where: { kode_lokasi: booking.kodeLokasi },
            data: { status: StatusLokasi.tidakDipinjam },
          });
        }
      });
      console.log(`[CRON] ✓ Booking ${booking.id} completed`);
    }
  } catch (error) {
    console.error("[CRON] Auto-complete error:", error);
  }
};

export const autoCancelPending = async () => {
  // ... (Copy isi fungsi autoCancelPending di sini) ...
   try {
    const cutoffTime = dayjs().subtract(1, "minute").toDate();
    const pendingBookings = await prisma.peminjamanP.findMany({
      where: {
        verifikasi: StatusBooking.pending,
        status: StatusP.booking,
        createdAt: { lte: cutoffTime },
      },
      include: { items: true, lokasi: true },
    });

    if (pendingBookings.length === 0) return;
    console.log(`[CRON] Found ${pendingBookings.length} pending booking(s) to cancel`);

    for (const booking of pendingBookings) {
      await prisma.$transaction(async (tx) => {
        await tx.peminjamanP.update({
          where: { id: booking.id },
          data: {
            status: StatusP.batal,
            verifikasi: StatusBooking.ditolak,
          },
        });

        const nupList = booking.items.map((item) => item.nupBarang);
        if (nupList.length > 0) {
            await tx.barangUnit.updateMany({
                where: { nup: { in: nupList } },
                data: { status: StatusB.Tersedia },
            });
        }

        if (booking.kodeLokasi) {
          await tx.dataLokasi.update({
            where: { kode_lokasi: booking.kodeLokasi },
            data: { status: StatusLokasi.tidakDipinjam },
          });
        }
      });
      console.log(`[CRON] ✓ Pending booking ${booking.id} auto-cancelled`);
    }
  } catch (error) {
    console.error("[CRON] Auto-cancel error:", error);
  }
};
