import { useSelector } from "@tanstack/react-store";
import type { AppSession } from "@app/api-contract";
import { sessionStore } from "./session-store.ts";

/** Current signed-in session, without exposing transport details to components. */
export const useSession = (): AppSession | null =>
	useSelector(sessionStore, (state) => state.session);

/** Full session resolution, useful for distinguishing signed out from unreachable. */
export const useSessionResolution = () => useSelector(sessionStore, (state) => state);
