import { useStore } from "@tanstack/react-store";
import { sidebarStore } from "../ui/sidebar-store.ts";

export const useIsMobile = (): boolean =>
	useStore(sidebarStore, (state) => state.isMobile);
