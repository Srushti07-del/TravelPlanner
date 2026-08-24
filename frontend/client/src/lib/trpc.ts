/**
 * tRPC client setup.
 *
 * The project uses tRPC with React Query for server communication.
 * This module creates the typed tRPC client hooks.
 */
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../../server/routers";

export const trpc = createTRPCReact<AppRouter>();

