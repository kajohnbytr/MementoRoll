import "server-only";
import { createHmac, randomBytes } from "node:crypto";
import argon2 from "argon2";
import { env } from "@/lib/env";

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function randomPin() {
  const value = randomBytes(4).readUInt32BE(0) % 1_000_000;
  return value.toString().padStart(6, "0");
}

export function hashOpaqueToken(value: string) {
  return createHmac("sha256", env().TOKEN_HASH_SECRET).update(value).digest("hex");
}

export const hashPin = (pin: string) => argon2.hash(pin, { type: argon2.argon2id });
export const verifyPin = (hash: string, pin: string) => argon2.verify(hash, pin);
