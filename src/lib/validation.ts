import { z } from "zod";

export const uuid = z.string().uuid();
export const eventInput = z.object({
  title: z.string().trim().min(2).max(100),
  eventDate: z.string().datetime(),
  locationName: z.string().trim().max(160).optional().nullable(),
  description: z.string().trim().max(1000).optional().nullable(),
  opensAt: z.string().datetime(),
  closesAt: z.string().datetime(),
  orderId: uuid,
}).refine((v) => new Date(v.opensAt) < new Date(v.closesAt), {
  path: ["closesAt"], message: "Closing time must be after opening time",
});

export const verifyPinInput = z.object({
  pin: z.string().regex(/^\d{6}$/, "Enter the six-digit PIN"),
  guestName: z.string().trim().min(2).max(60),
});

export const uploadRequestInput = z.object({
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  expectedSize: z.number().int().positive().max(10 * 1024 * 1024),
  capturedAt: z.string().datetime().optional(),
  location: z.object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180) }).optional(),
});

export const uploadCompleteInput = z.object({ photoId: uuid });
