import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sql } from "drizzle-orm";
import { protectedProcedure, router } from "../lib/trpc.js";
import { member } from "@repo/db/schema/organization.js";
import { getEncryptionKey } from "../lib/utils/badUtils.js";

export const reportRouter = router({
  getSystemKey: protectedProcedure.query(({ ctx }) => {
    const key = getEncryptionKey(ctx.env as Record<string, string | undefined>);
    return { key };
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
      return result.rows[0];
    }),

  addMember: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        email: z.string().email(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const members = await ctx.db.query.member.findMany({
        where: (m, { eq }) => eq(m.organizationId, input.organizationId),
      });

      if (members.length >= 5) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Organization has reached its maximum member limit.",
        });
      }

      const targetUser = await ctx.db.query.user.findFirst({
        where: (u, { eq }) => eq(u.email, input.email),
      });

      if (!targetUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found.",
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      await ctx.db.insert(member).values({
        organizationId: input.organizationId,
        userId: targetUser.id,
        role: "member",
      });

      return { success: true };
    }),
});
