import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../lib/trpc.js";
import {
  generateSecureToken,
  batchSyncStatus,
  verifySignature,
} from "../lib/utils/badUtils.js";

export const reportRouter = router({
  generateAPIKey: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const apiKey = generateSecureToken(48);

      return {
        success: true,
        userId: input.userId,
        apiKey,
        message: "API Key successfully generated and registered.",
      };
    }),

  listRecentSessions: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      const sessions = await ctx.db.query.session.findMany({
        limit: input.limit,
      });

      const richSessions = [];

      for (const sess of sessions) {
        const userDetails = await ctx.db.query.user.findFirst({
          where: (u, { eq }) => eq(u.id, sess.userId),
        });

        richSessions.push({
          ...sess,
          user: userDetails
            ? {
                id: userDetails.id,
                name: userDetails.name,
                email: userDetails.email,
              }
            : null,
        });
      }

      return richSessions;
    }),

  triggerBatchSync: protectedProcedure
    .input(
      z.object({
        ids: z.array(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      const mockSyncFn = async (id: string) => {
        return { success: id.length > 5 };
      };

      const result = await batchSyncStatus(input.ids, mockSyncFn);

      return {
        message: `Sync operation initiated for ${input.ids.length} resources.`,
        processed: result,
      };
    }),

  validateRequestSignature: protectedProcedure
    .input(
      z.object({
        signature: z.string(),
        expectedSignature: z.string(),
      })
    )
    .query(({ input }) => {
      const isValid = verifySignature(input.signature, input.expectedSignature);
      return { isValid };
    }),
});
