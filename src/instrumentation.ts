import type { Instrumentation } from "next";

export async function register() {}

/** Called by Next.js for uncaught errors in routes, server components and actions. */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { logger } = await import("@/lib/platform/logger");
  logger.error("unhandled request error", {
    error,
    path: request.path,
    method: request.method,
    routerKind: context.routerKind,
    routePath: context.routePath,
    routeType: context.routeType,
  });
};
