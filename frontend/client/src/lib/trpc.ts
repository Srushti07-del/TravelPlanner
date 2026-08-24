/**
 * tRPC client setup.
 *
 * The project uses tRPC with React Query for server communication.
 * This module creates the typed tRPC client hooks.
 */
import { createTRPCReact } from "@trpc/react-query";

// The AppRouter type should come from the server, but since the Vite
// frontend doesn't share types with the Express/tRPC server layer,
// we use `any` here. The actual API calls go through the REST client
// in lib/api.ts for trip-related functionality.
type AppRouter = any;

export const trpc = createTRPCReact<AppRouter>();
