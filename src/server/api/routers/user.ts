import { feedbackFormSchema } from "@/lib/utils";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";

export const userRouter = createTRPCRouter({
  getUsersDocs: protectedProcedure.query(async ({ ctx }) => {
    const docs = await ctx.prisma.user.findUnique({
      where: {
        id: ctx?.session?.user?.id,
      },
      select: {
        documents: {
          select: {
            createdAt: true,
            title: true,
            isVectorised: true,
            id: true,
            ownerId: true,
          },
        },
        collaboratorateddocuments: {
          select: {
            document: {
              select: {
                createdAt: true,
                title: true,
                isVectorised: true,
                id: true,
                ownerId: true,
              },
            },
          },
        },
      },
    });

    const combinedUserDocs = [
      ...(docs?.documents ?? []),
      ...(docs?.collaboratorateddocuments?.map((collab) => collab.document) ??
        []),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return combinedUserDocs.map((doc) => ({
      ...doc,
      isCollab: doc.ownerId !== ctx?.session?.user?.id,
    }));
  }),
  submitFeedback: publicProcedure
    .input(feedbackFormSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.feedback.create({
        data: {
          message: input.message,
          type: input.type,
          ...(input.email ? { contact_email: input.email } : {}),
          ...(ctx?.session?.user?.id
            ? {
                user: {
                  connect: {
                    id: ctx?.session?.user?.id,
                  },
                },
              }
            : {}),
        },
      });
    }),
});
