import { eq, desc, lt, and } from "drizzle-orm";
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from "drizzle-orm";
import * as schema from "../drizzle/schema";
import {
  users, scanCodes, scanResults, scanFiles, scanLogs,
} from "../drizzle/schema";
import { ENV } from './_core/env';

// Insert টাইপগুলি ইনফার করা
export type InsertUser = typeof users.$inferInsert;
export type InsertScanCode = typeof scanCodes.$inferInsert;
export type InsertScanResult = typeof scanResults.$inferInsert;
export type InsertScanFile = typeof scanFiles.$inferInsert;
export type InsertScanLog = typeof scanLogs.$inferInsert;

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: Pool | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _pool = new Pool({ connectionString: process.env.DATABASE_URL });
      _db = drizzle(_pool, { schema });
      console.log("✅ Database connected successfully");
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ---------- User functions ----------
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values: any = { openId: user.openId };
    if (user.name !== undefined) values.name = user.name;
    if (user.email !== undefined) values.email = user.email;
    if (user.loginMethod !== undefined) values.loginMethod = user.loginMethod;

    if (user.role !== undefined) {
      values.role = user.role;
    } else if (user.openId === "admin-user" || user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
    } else {
      values.role = 'user';
    }

    values.lastSignedIn = user.lastSignedIn || new Date();
    values.createdAt = new Date();
    values.updatedAt = new Date();

    await db.insert(schema.users).values(values).onConflictDoUpdate({
      target: schema.users.openId,
      set: {
        name: values.name,
        email: values.email,
        loginMethod: values.loginMethod,
        role: values.role,
        lastSignedIn: values.lastSignedIn,
        updatedAt: new Date(),
      },
    });
    console.log(`✅ User upserted: ${values.openId} (${values.role})`);
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(schema.users).where(eq(schema.users.openId, openId)).limit(1);
  return result[0];
}

// ---------- Scan Code functions ----------
export async function generateScanCode(userId: number, expirationHours: number = 24): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const code = generateRandomCode();
  const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000);
  await db.insert(schema.scanCodes).values({
    code,
    createdByUserId: userId,
    expiresAt,
    status: 'active',
  });
  return code;
}

export async function validateAndUseScanCode(code: string, deviceName: string): Promise<{ valid: boolean; codeId?: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(schema.scanCodes).where(eq(schema.scanCodes.code, code)).limit(1);
  if (!result.length) return { valid: false };
  const codeRecord = result[0];
  if (codeRecord.status !== 'active' || new Date() > codeRecord.expiresAt) {
    return { valid: false };
  }
  await db.update(schema.scanCodes).set({
    status: 'used',
    usedAt: new Date(),
    usedByDevice: deviceName,
  }).where(eq(schema.scanCodes.code, code));
  return { valid: true, codeId: codeRecord.id };
}

export async function getAllScanCodes() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(schema.scanCodes)
    .orderBy(desc(schema.scanCodes.createdAt));
}

export async function deleteScanCode(codeId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(schema.scanCodes).where(eq(schema.scanCodes.id, codeId));
}

export async function deleteExpiredCodes(): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const now = new Date();
  await db.delete(schema.scanCodes).where(
    and(
      eq(schema.scanCodes.status, 'active'),
      lt(schema.scanCodes.expiresAt, now)
    )
  );
}

// ---------- Scan Result functions ----------
export async function createScanResult(data: InsertScanResult) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const [result] = await db.insert(schema.scanResults).values(data).returning();
    return result;
  } catch (error) {
    console.error("❌ Database error in createScanResult:", error);
    // Error কে আরও বিস্তারিত message সহ throw করুন
    throw new Error(`Failed to create scan result: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function getAllScanResults() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(schema.scanResults)
    .orderBy(desc(schema.scanResults.createdAt));
}

export async function getScanResultWithFiles(scanResultId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.select().from(schema.scanResults).where(eq(schema.scanResults.id, scanResultId)).limit(1);
  if (!result) return null;
  const files = await db.select().from(schema.scanFiles).where(eq(schema.scanFiles.scanResultId, scanResultId));
  let scanKey: string | null = null;
  if (result.scanCodeId) {
    const [codeRow] = await db.select({ code: schema.scanCodes.code }).from(schema.scanCodes).where(eq(schema.scanCodes.id, result.scanCodeId)).limit(1);
    scanKey = codeRow?.code ?? null;
  }
  console.log(`[getScanResultWithFiles] Found ${files.length} files for scanResultId ${scanResultId}`);
  return { ...result, scanKey, files };
}

export async function addScanFiles(scanResultId: number, files: Omit<InsertScanFile, 'scanResultId'>[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (files.length === 0) return;

  const filesWithId = files.map(f => ({ ...f, scanResultId }));
  console.log(`[addScanFiles] Inserting ${filesWithId.length} files for scanResultId: ${scanResultId}`);

  try {
    await db.insert(schema.scanFiles).values(filesWithId);
    console.log(`[addScanFiles] Success`);

    // কাউন্ট আপডেট করি
    await updateScanResultCounts(scanResultId);
  } catch (error) {
    console.error("[addScanFiles] Error:", error);
    throw error;
  }
}

// নতুন ফাংশন: scan_result-এর কাউন্ট আপডেট করবে
async function updateScanResultCounts(scanResultId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // scan_files টেবিল থেকে risk_level অনুযায়ী কাউন্ট বের করি
  const counts = await db
    .select({
      riskLevel: schema.scanFiles.riskLevel,
      count: sql<number>`count(*)`,
    })
    .from(schema.scanFiles)
    .where(eq(schema.scanFiles.scanResultId, scanResultId))
    .groupBy(schema.scanFiles.riskLevel);

  const suspiciousCount = counts.find(c => c.riskLevel === 'suspicious')?.count || 0;
  const warningCount = counts.find(c => c.riskLevel === 'warning')?.count || 0;
  const moderateCount = counts.find(c => c.riskLevel === 'moderate')?.count || 0;
  const safeCount = counts.find(c => c.riskLevel === 'safe')?.count || 0;
  const total = suspiciousCount + warningCount + moderateCount + safeCount;

  await db
    .update(schema.scanResults)
    .set({
      totalFilesScanned: total,
      suspiciousCount,
      warningCount,
      moderateCount,
      safeCount,
    })
    .where(eq(schema.scanResults.id, scanResultId));

  console.log(`[updateScanResultCounts] Updated counts for scanResult ${scanResultId}: total=${total}, sus=${suspiciousCount}, warn=${warningCount}, mod=${moderateCount}, safe=${safeCount}`);
}

export async function updateScanResultStatus(
  scanResultId: number,
  status: 'in_progress' | 'completed' | 'failed',
  endTime?: Date,
  overallRiskLevel?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: any = { scanStatus: status };
  if (endTime) updateData.scanEndTime = endTime;
  if (overallRiskLevel) updateData.overallRiskLevel = overallRiskLevel;
  await db.update(schema.scanResults).set(updateData).where(eq(schema.scanResults.id, scanResultId));
}

/** Set scan result counts from scanner (so safe count and total are correct when scanner doesn't submit safe file rows) */
export async function setScanResultCounts(
  scanResultId: number,
  counts: { totalFilesScanned: number; suspiciousCount: number; warningCount: number; moderateCount: number; safeCount: number }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(schema.scanResults).set({
    totalFilesScanned: counts.totalFilesScanned,
    suspiciousCount: counts.suspiciousCount,
    warningCount: counts.warningCount,
    moderateCount: counts.moderateCount,
    safeCount: counts.safeCount,
  }).where(eq(schema.scanResults.id, scanResultId));
}

// ---------- Scan Log functions ----------
export async function addScanLog(log: InsertScanLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(schema.scanLogs).values(log);
}

export async function getScanLogs(scanResultId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(schema.scanLogs)
    .where(eq(schema.scanLogs.scanResultId, scanResultId))
    .orderBy(desc(schema.scanLogs.timestamp))
    .limit(limit);
}

export async function getRecentScanLogs(scanResultId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(schema.scanLogs)
    .where(eq(schema.scanLogs.scanResultId, scanResultId))
    .orderBy(desc(schema.scanLogs.timestamp))
    .limit(200);
}

// ---------- Helper ----------
function generateRandomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}