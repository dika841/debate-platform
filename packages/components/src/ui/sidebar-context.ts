import { createContext, useContext } from "react";
import { match, P } from "ts-pattern";

export const SIDEBAR_WIDTH = "16rem";
export const SIDEBAR_WIDTH_MOBILE = "18rem";
export const SIDEBAR_WIDTH_ICON = "3rem";
export const SIDEBAR_KEYBOARD_SHORTCUT = "b";

export const SIDEBAR_STATE = {
	EXPANDED: "expanded",
	COLLAPSED: "collapsed",
} as const;
export type TSidebarOpenState =
	(typeof SIDEBAR_STATE)[keyof typeof SIDEBAR_STATE];

export const SIDEBAR_SIDE = { LEFT: "left", RIGHT: "right" } as const;
export type TSidebarSide = (typeof SIDEBAR_SIDE)[keyof typeof SIDEBAR_SIDE];

export const SIDEBAR_VARIANT = {
	SIDEBAR: "sidebar",
	FLOATING: "floating",
	INSET: "inset",
} as const;
export type TSidebarVariant =
	(typeof SIDEBAR_VARIANT)[keyof typeof SIDEBAR_VARIANT];

export const SIDEBAR_COLLAPSIBLE = {
	OFFCANVAS: "offcanvas",
	ICON: "icon",
	NONE: "none",
} as const;
export type TSidebarCollapsible =
	(typeof SIDEBAR_COLLAPSIBLE)[keyof typeof SIDEBAR_COLLAPSIBLE];

export type TSidebarContextProps = {
	state: TSidebarOpenState;
	open: boolean;
	setOpen: (open: boolean) => void;
	openMobile: boolean;
	setOpenMobile: (open: boolean) => void;
	isMobile: boolean;
	toggleSidebar: () => void;
};

export const SidebarContext = createContext<TSidebarContextProps | null>(null);

export const useSidebar = (): TSidebarContextProps =>
	match(useContext(SidebarContext))
		.with(P.nullish, (): never => {
			throw new Error("useSidebar must be used within a SidebarProvider.");
		})
		.otherwise((context): TSidebarContextProps => context);
