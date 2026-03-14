import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  generateScanCode,
  validateAndUseScanCode,
  getAllScanCodes,
  deleteScanCode,
  getAllScanResults,
  createScanResult,
  getScanResultWithFiles,
  addScanFiles,
  updateScanResultStatus,
  setScanResultCounts,
  addScanLog,
  getScanLogs,
  getRecentScanLogs,
} from "./db";

/** Adjust date so client formatBDTime (Asia/Dhaka) shows correct BD time (server may store as local). */
function dateForBD(d: Date | string | null | undefined): Date | null | undefined {
  if (d == null) return d;
  const t = typeof d === "string" ? new Date(d).getTime() : (d as Date).getTime();
  return new Date(t - 6 * 60 * 60 * 1000);
}

export const appRouter = router({
  system: systemRouter,

  // Scan Code Management
  scanCode: router({
    generate: publicProcedure
      .input(z.object({ expirationHours: z.number().int().min(1).max(720).default(24) }))
      .mutation(async ({ input }) => {
        try {
          const code = await generateScanCode(1, input.expirationHours);
          return { code, success: true };
        } catch (error) {
          console.error("❌ Error generating scan code:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error instanceof Error ? error.message : "Failed to generate scan code",
          });
        }
      }),

    list: publicProcedure.query(async () => {
      try {
        const codes = await getAllScanCodes();
        return codes.map((c) => ({
          ...c,
          createdAt: dateForBD(c.createdAt),
          expiresAt: dateForBD(c.expiresAt),
          usedAt: dateForBD(c.usedAt),
        }));
      } catch (error) {
        console.error("❌ Error listing scan codes:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch scan codes",
        });
      }
    }),

    validate: publicProcedure
      .input(z.object({ code: z.string(), deviceName: z.string() }))
      .mutation(async ({ input }) => {
        try {
          return await validateAndUseScanCode(input.code, input.deviceName);
        } catch (error) {
          console.error("❌ Error validating scan code:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error instanceof Error ? error.message : "Failed to validate scan code",
          });
        }
      }),

    // ✅ Now public – no login required
    delete: publicProcedure
      .input(z.object({ codeId: z.number() }))
      .mutation(async ({ input }) => {
        try {
          await deleteScanCode(input.codeId);
          return { success: true };
        } catch (error) {
          console.error("❌ Error deleting scan code:", error);
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error instanceof Error ? error.message : "Failed to delete scan code",
          });
        }
      }),
  }),

  // Scan Results Management
  scanResult: router({
    create: publicProcedure
      .input(z.object({
        scanCodeId: z.number(),
        deviceName: z.string(),
        osVersion: z.string().optional(),
        systemInfo: z.any().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          console.log("📝 Creating scan result with input:", input);
          
          const result = await createScanResult({
            scanCodeId: input.scanCodeId,
            deviceName: input.deviceName,
            osVersion: input.osVersion,
            systemInfo: input.systemInfo || null,
            scanStartTime: new Date(),
            scanStatus: 'in_progress',
          });
          
          console.log("✅ Scan result created:", result);
          return result;
        } catch (error) {
          console.error("❌ Error in scanResult.create:", error);
          
          let errorMessage = "Unknown error creating scan result";
          if (error instanceof Error) {
            errorMessage = error.message;
          }
          
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: errorMessage,
          });
        }
      }),

    list: publicProcedure.query(async () => {
      try {
        const results = await getAllScanResults();
        return results.map((r) => ({
          ...r,
          scanStartTime: dateForBD(r.scanStartTime),
          scanEndTime: dateForBD(r.scanEndTime),
          createdAt: dateForBD(r.createdAt),
        }));
      } catch (error) {
        console.error("❌ Error listing scan results:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch scan results",
        });
      }
    }),

    getWithFiles: publicProcedure
      .input(z.object({ scanResultId: z.number() }))
      .query(async ({ input }) => {
        try {
          const data = await getScanResultWithFiles(input.scanResultId);
          if (!data) return null;
          return {
            ...data,
            scanStartTime: dateForBD(data.scanStartTime),
            scanEndTime: dateForBD(data.scanEndTime),
            createdAt: dateForBD(data.createdAt),
            files: (data.files || []).map((f) => ({
              ...f,
              createdDate: dateForBD(f.createdDate),
              modifiedDate: dateForBD(f.modifiedDate),
            })),
          };
        } catch (error) {
          console.error("❌ Error getting scan result with files:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error instanceof Error ? error.message : "Failed to fetch scan result",
          });
        }
      }),

    updateStatus: publicProcedure
      .input(z.object({
        scanResultId: z.number(),
        status: z.enum(['in_progress', 'completed', 'failed']),
        overallRiskLevel: z.enum(['suspicious', 'warning', 'moderate', 'safe']).optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          await updateScanResultStatus(
            input.scanResultId,
            input.status,
            input.status === 'completed' ? new Date() : undefined,
            input.overallRiskLevel
          );
          return { success: true };
        } catch (error) {
          console.error("❌ Error updating scan result status:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error instanceof Error ? error.message : "Failed to update scan status",
          });
        }
      }),

    addFiles: publicProcedure
      .input(z.object({
        scanResultId: z.number(),
        files: z.array(z.object({
          filePath: z.string(),
          fileName: z.string(),
          fileType: z.string().optional(),
          fileSize: z.number().optional(),
          riskLevel: z.enum(['suspicious', 'warning', 'moderate', 'safe']),
          detectionReason: z.string().optional(),
          fileHash: z.string().optional(),
          isFiveMMod: z.boolean().optional(),
          isSystemFile: z.boolean().optional(),
          windowsDetails: z.string().optional(),
        })),
      }))
      .mutation(async ({ input }) => {
        try {
          await addScanFiles(input.scanResultId, input.files);
          return { success: true };
        } catch (error) {
          console.error("❌ Error adding scan files:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error instanceof Error ? error.message : "Failed to add files",
          });
        }
      }),

    setCounts: publicProcedure
      .input(z.object({
        scanResultId: z.number(),
        totalFilesScanned: z.number(),
        suspiciousCount: z.number(),
        warningCount: z.number(),
        moderateCount: z.number(),
        safeCount: z.number(),
      }))
      .mutation(async ({ input }) => {
        try {
          await setScanResultCounts(input.scanResultId, {
            totalFilesScanned: input.totalFilesScanned,
            suspiciousCount: input.suspiciousCount,
            warningCount: input.warningCount,
            moderateCount: input.moderateCount,
            safeCount: input.safeCount,
          });
          return { success: true };
        } catch (error) {
          console.error("❌ Error setting scan counts:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error instanceof Error ? error.message : "Failed to set scan counts",
          });
        }
      }),
  }),

  // Scan Logs Management
  scanLog: router({
    add: publicProcedure
      .input(z.object({
        scanResultId: z.number(),
        logLevel: z.enum(['INFO', 'SUCCESS', 'WARN', 'ERROR', 'DEBUG']).default('INFO'),
        message: z.string(),
        filePath: z.string().optional().default(''),
        progress: z.number().min(0).max(100).optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          await addScanLog({
            scanResultId: input.scanResultId,
            logLevel: input.logLevel,
            message: input.message,
            filePath: input.filePath,
            progress: input.progress,
            timestamp: new Date(),
          });
          return { success: true };
        } catch (error) {
          console.error("❌ Error adding scan log:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error instanceof Error ? error.message : "Failed to add log",
          });
        }
      }),

    getRecent: publicProcedure
      .input(z.object({ scanResultId: z.number() }))
      .query(async ({ input }) => {
        try {
          const logs = await getRecentScanLogs(input.scanResultId);
          return (logs || []).map((log) => ({ ...log, timestamp: dateForBD(log.timestamp) }));
        } catch (error) {
          console.error("❌ Error getting recent logs:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error instanceof Error ? error.message : "Failed to fetch logs",
          });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;