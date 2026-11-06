import { Store } from "@tanstack/store";

const MOBILE_BREAKPOINT = 768;

type TSidebarState = {
	open: boolean;
	openMobile: boolean;
	isMobile: boolean;
};

const isMobileViewport = (): boolean =>
	typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT;

export const sidebarStore = new Store<TSidebarState>({
	open: true,
	openMobile: false,
	isMobile: isMobileViewport(),
});

export const sidebarOpenSet = (open: boolean): void =>
	sidebarStore.setState((state) => ({ ...state, open }));

export const sidebarOpenMobileSet = (openMobile: boolean): void =>
	sidebarStore.setState((state) => ({ ...state, openMobile }));

const sidebarIsMobileSet = (isMobile: boolean): void =>
	sidebarStore.setState((state) => ({ ...state, isMobile }));

const watchViewport = (): void => {
	const query = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
	query.addEventListener("change", () =>
		sidebarIsMobileSet(isMobileViewport()),
	);
};

typeof window !== "undefined" && watchViewport();
