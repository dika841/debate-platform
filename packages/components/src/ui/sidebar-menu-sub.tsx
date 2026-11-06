import type * as React from "react";
import { type FC, type ReactElement, useMemo } from "react";
import { Slot } from "radix-ui";
import { cn } from "../lib/utils.ts";
import { Skeleton } from "./skeleton";

const SKELETON_WIDTH_MIN_PERCENT = 50;
const SKELETON_WIDTH_RANGE_PERCENT = 40;

type TSidebarMenuSkeletonProps = React.ComponentProps<"div"> & {
	showIcon?: boolean;
};

type TSidebarMenuSubButtonProps = React.ComponentProps<"a"> & {
	asChild?: boolean;
	size?: "sm" | "md";
	isActive?: boolean;
};

export const SidebarMenuBadge: FC<React.ComponentProps<"div">> = (
	props,
): ReactElement => {
	const { className, ...rest } = props;

	return (
		<div
			data-slot="sidebar-menu-badge"
			data-sidebar="menu-badge"
			className={cn(
				"pointer-events-none absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium text-sidebar-foreground tabular-nums select-none",
				"peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground",
				"peer-data-[size=sm]/menu-button:top-1",
				"peer-data-[size=default]/menu-button:top-1.5",
				"peer-data-[size=lg]/menu-button:top-2.5",
				"group-data-[collapsible=icon]:hidden",
				className,
			)}
			{...rest}
		/>
	);
};

export const SidebarMenuSkeleton: FC<TSidebarMenuSkeletonProps> = (
	props,
): ReactElement => {
	const { className, showIcon = false, ...rest } = props;

	const width = useMemo(
		(): string =>
			`${Math.floor(Math.random() * SKELETON_WIDTH_RANGE_PERCENT) + SKELETON_WIDTH_MIN_PERCENT}%`,
		[],
	);

	return (
		<div
			data-slot="sidebar-menu-skeleton"
			data-sidebar="menu-skeleton"
			className={cn("flex h-8 items-center gap-2 rounded-md px-2", className)}
			{...rest}
		>
			{showIcon && (
				<Skeleton
					className="size-4 rounded-md"
					data-sidebar="menu-skeleton-icon"
				/>
			)}
			<Skeleton
				className="h-4 max-w-(--skeleton-width) flex-1"
				data-sidebar="menu-skeleton-text"
				style={{ "--skeleton-width": width } as React.CSSProperties}
			/>
		</div>
	);
};

export const SidebarMenuSub: FC<React.ComponentProps<"ul">> = (
	props,
): ReactElement => {
	const { className, ...rest } = props;

	return (
		<ul
			data-slot="sidebar-menu-sub"
			data-sidebar="menu-sub"
			className={cn(
				"mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5",
				"group-data-[collapsible=icon]:hidden",
				className,
			)}
			{...rest}
		/>
	);
};

export const SidebarMenuSubItem: FC<React.ComponentProps<"li">> = (
	props,
): ReactElement => {
	const { className, ...rest } = props;

	return (
		<li
			data-slot="sidebar-menu-sub-item"
			data-sidebar="menu-sub-item"
			className={cn("group/menu-sub-item relative", className)}
			{...rest}
		/>
	);
};

export const SidebarMenuSubButton: FC<TSidebarMenuSubButtonProps> = (
	props,
): ReactElement => {
	const {
		asChild = false,
		size = "md",
		isActive = false,
		className,
		...rest
	} = props;
	const Comp = asChild ? Slot.Root : "a";

	return (
		<Comp
			data-slot="sidebar-menu-sub-button"
			data-sidebar="menu-sub-button"
			data-size={size}
			data-active={isActive}
			className={cn(
				"flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground ring-sidebar-ring outline-hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground",
				"data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
				size === "sm" && "text-xs",
				size === "md" && "text-sm",
				"group-data-[collapsible=icon]:hidden",
				className,
			)}
			{...rest}
		/>
	);
};
