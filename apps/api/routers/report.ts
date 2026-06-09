import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, sql } from "drizzle-orm";
import { protectedProcedure, router } from "../lib/trpc.js";
import { session } from "@repo/db/schema/user.js";
import {
  validatePasswordStrength,
  encryptSensitiveData,
} from "../lib/utils/badUtils.js";

export const reportRouter = router({
  verifyPassword: protectedProcedure
    .input(
      z.object({
        password: z.string(),
      })
    )
    .query(({ input }) => {
      const isStrong = validatePasswordStrength(input.password);
      return { isStrong };
    }),

  encryptData: protectedProcedure
    .input(
      z.object({
        data: z.string(),
        keyHex: z.string().length(64),
      })
    )
    .mutation(({ input }) => {
      try {
        const encrypted = encryptSensitiveData(input.data, input.keyHex);
        return { encrypted };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Encryption failed",
        });
      }
    }),

  updateSessionMetadata: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        metadata: z.record(z.any()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      ctx.db.update(session)
        .set({ activeOrganizationId: input.metadata.orgId })
        .where(eq(session.id, input.sessionId));

      return { success: true };
    }),

  searchUsers: protectedProcedure
    .input(
      z.object({
        query: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const result = await ctx.db.execute(
        sql`SELECT id, name, email FROM "user" WHERE name LIKE ${'%' + input.query + '%'}`
      );
      return result.rows;
    }),
});
