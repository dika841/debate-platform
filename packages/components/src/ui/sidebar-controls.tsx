import type * as React from "react";
import type { FC, ReactElement } from "react";
import { UI_MESSAGE } from "@app/messages";
import { PanelLeftIcon } from "lucide-react";
import { cn } from "../lib/utils.ts";
import { Button } from "./button";
import { useSidebar } from "./sidebar-context.ts";

export const SidebarTrigger: FC<React.ComponentProps<typeof Button>> = (
	props,
): ReactElement => {
	const { className, onClick, ...rest } = props;
	const { toggleSidebar } = useSidebar();

	return (
		<Button
			data-sidebar="trigger"
			data-slot="sidebar-trigger"
			variant="ghost"
			size="icon"
			className={cn("size-7", className)}
			onClick={(event) => {
				onClick?.(event);
				toggleSidebar();
			}}
			{...rest}
		>
			<PanelLeftIcon />
			<span className="sr-only">{UI_MESSAGE.SIDEBAR_TOGGLE}</span>
		</Button>
	);
};

export const SidebarRail: FC<React.ComponentProps<"button">> = (
	props,
): ReactElement => {
	const { className, ...rest } = props;
	const { toggleSidebar } = useSidebar();

	return (
		<button
			data-sidebar="rail"
			data-slot="sidebar-rail"
			aria-label={UI_MESSAGE.SIDEBAR_TOGGLE}
			tabIndex={-1}
			onClick={toggleSidebar}
			title={UI_MESSAGE.SIDEBAR_TOGGLE}
			className={cn(
				"absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-sidebar-border sm:flex",
				"in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize",
				"[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
				"group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full hover:group-data-[collapsible=offcanvas]:bg-sidebar",
				"[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
				"[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
				className,
			)}
			{...rest}
		/>
	);
};

export const SidebarInset: FC<React.ComponentProps<"main">> = (
	props,
): ReactElement => {
	const { className, ...rest } = props;

	return (
		<main
			data-slot="sidebar-inset"
			className={cn(
				"relative flex w-full flex-1 flex-col bg-background",
				"md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2",
				className,
			)}
			{...rest}
		/>
	);
};
