import type * as React from "react";
import {
	type FC,
	type ReactElement,
	useCallback,
	useEffect,
	useMemo,
} from "react";
import { useStore } from "@tanstack/react-store";
import { match, P } from "ts-pattern";
import { useIsMobile } from "../hooks/use-mobile";
import { cn } from "../lib/utils.ts";
import {
	SIDEBAR_KEYBOARD_SHORTCUT,
	SIDEBAR_STATE,
	SIDEBAR_WIDTH,
	SIDEBAR_WIDTH_ICON,
	SidebarContext,
	type TSidebarContextProps,
} from "./sidebar-context.ts";
import {
	sidebarOpenMobileSet,
	sidebarOpenSet,
	sidebarStore,
} from "./sidebar-store.ts";
import { TooltipProvider } from "./tooltip";

type TOpenUpdate = boolean | ((value: boolean) => boolean);

type TSidebarProviderProps = React.ComponentProps<"div"> & {
	defaultOpen?: boolean;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
};

const resolveOpen = (update: TOpenUpdate, previous: boolean): boolean =>
	typeof update === "function" ? update(previous) : update;

const isToggleShortcut = (event: KeyboardEvent): boolean =>
	event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey);

export const SidebarProvider: FC<TSidebarProviderProps> = (
	props,
): ReactElement => {
	const {
		defaultOpen = true,
		open: openProp,
		onOpenChange,
		className,
		style,
		children,
		...rest
	} = props;

	const isMobile = useIsMobile();
	const openMobile = useStore(sidebarStore, (state) => state.openMobile);
	const storedOpen = useStore(sidebarStore, (state) => state.open);
	const open = openProp ?? storedOpen;

	useEffect(() => sidebarOpenSet(defaultOpen), [defaultOpen]);

	const setOpen = useCallback(
		(update: TOpenUpdate): void => {
			const next = resolveOpen(update, open);
			match(onOpenChange)
				.with(P.nullish, (): void => sidebarOpenSet(next))
				.otherwise((notify): void => notify(next));
		},
		[onOpenChange, open],
	);

	const setOpenMobile = useCallback(
		(update: TOpenUpdate): void =>
			sidebarOpenMobileSet(resolveOpen(update, openMobile)),
		[openMobile],
	);

	const toggleSidebar = useCallback(
		(): void =>
			match(isMobile)
				.with(true, (): void => setOpenMobile((value) => !value))
				.otherwise((): void => setOpen((value) => !value)),
		[isMobile, setOpen, setOpenMobile],
	);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent): void => {
			match(isToggleShortcut(event))
				.with(true, (): void => {
					event.preventDefault();
					toggleSidebar();
				})
				.otherwise((): undefined => undefined);
		};

		window.addEventListener("keydown", handleKeyDown);
		return (): void => window.removeEventListener("keydown", handleKeyDown);
	}, [toggleSidebar]);

	const state = open ? SIDEBAR_STATE.EXPANDED : SIDEBAR_STATE.COLLAPSED;

	const contextValue = useMemo<TSidebarContextProps>(
		() => ({
			state,
			open,
			setOpen,
			isMobile,
			openMobile,
			setOpenMobile,
			toggleSidebar,
		}),
		[state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar],
	);

	return (
		<SidebarContext.Provider value={contextValue}>
			<TooltipProvider delayDuration={0}>
				<div
					data-slot="sidebar-wrapper"
					style={
						{
							"--sidebar-width": SIDEBAR_WIDTH,
							"--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
							...style,
						} as React.CSSProperties
					}
					className={cn(
						"group/sidebar-wrapper flex min-h-svh w-full has-data-[variant=inset]:bg-sidebar",
						className,
					)}
					{...rest}
				>
					{children}
				</div>
			</TooltipProvider>
		</SidebarContext.Provider>
	);
};
