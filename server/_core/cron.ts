import { deleteExpiredCodes } from "../db";

export async function cleanupExpiredCodes() {
  try {
    await deleteExpiredCodes();
    console.log("✅ Expired codes cleaned up");
  } catch (error) {
    console.error("❌ Failed to clean expired codes:", error);
  }
}

// যদি setInterval ব্যবহার করতে চান:
setInterval(cleanupExpiredCodes, 60 * 60 * 1000); // প্রতি ঘন্টায়