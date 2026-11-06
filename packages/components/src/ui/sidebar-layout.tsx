import type * as React from "react";
import type { FC, ReactElement } from "react";
import { Slot } from "radix-ui";
import { cn } from "../lib/utils.ts";
import { Input } from "./input";
import { Separator } from "./separator";

type TSidebarGroupLabelProps = React.ComponentProps<"div"> & {
	asChild?: boolean;
};

type TSidebarGroupActionProps = React.ComponentProps<"button"> & {
	asChild?: boolean;
};

export const SidebarInput: FC<React.ComponentProps<typeof Input>> = (
	props,
): ReactElement => {
	const { className, ...rest } = props;

	return (
		<Input
			data-slot="sidebar-input"
			data-sidebar="input"
			className={cn("h-8 w-full bg-background shadow-none", className)}
			{...rest}
		/>
	);
};

export const SidebarHeader: FC<React.ComponentProps<"div">> = (
	props,
): ReactElement => {
	const { className, ...rest } = props;

	return (
		<div
			data-slot="sidebar-header"
			data-sidebar="header"
			className={cn("flex flex-col gap-2 p-2", className)}
			{...rest}
		/>
	);
};

export const SidebarFooter: FC<React.ComponentProps<"div">> = (
	props,
): ReactElement => {
	const { className, ...rest } = props;

	return (
		<div
			data-slot="sidebar-footer"
			data-sidebar="footer"
			className={cn("flex flex-col gap-2 p-2", className)}
			{...rest}
		/>
	);
};

export const SidebarSeparator: FC<React.ComponentProps<typeof Separator>> = (
	props,
): ReactElement => {
	const { className, ...rest } = props;

	return (
		<Separator
			data-slot="sidebar-separator"
			data-sidebar="separator"
			className={cn("mx-2 w-auto bg-sidebar-border", className)}
			{...rest}
		/>
	);
};

export const SidebarContent: FC<React.ComponentProps<"div">> = (
	props,
): ReactElement => {
	const { className, ...rest } = props;

	return (
		<div
			data-slot="sidebar-content"
			data-sidebar="content"
			className={cn(
				"flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
				className,
			)}
			{...rest}
		/>
	);
};

export const SidebarGroup: FC<React.ComponentProps<"div">> = (
	props,
): ReactElement => {
	const { className, ...rest } = props;

	return (
		<div
			data-slot="sidebar-group"
			data-sidebar="group"
			className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
			{...rest}
		/>
	);
};

export const SidebarGroupLabel: FC<TSidebarGroupLabelProps> = (
	props,
): ReactElement => {
	const { className, asChild = false, ...rest } = props;
	const Comp = asChild ? Slot.Root : "div";

	return (
		<Comp
			data-slot="sidebar-group-label"
			data-sidebar="group-label"
			className={cn(
				"flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 ring-sidebar-ring outline-hidden transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
				"group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
				className,
			)}
			{...rest}
		/>
	);
};

export const SidebarGroupAction: FC<TSidebarGroupActionProps> = (
	props,
): ReactElement => {
	const { className, asChild = false, ...rest } = props;
	const Comp = asChild ? Slot.Root : "button";

	return (
		<Comp
			data-slot="sidebar-group-action"
			data-sidebar="group-action"
			className={cn(
				"absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground ring-sidebar-ring outline-hidden transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
				"after:absolute after:-inset-2 md:after:hidden",
				"group-data-[collapsible=icon]:hidden",
				className,
			)}
			{...rest}
		/>
	);
};

export const SidebarGroupContent: FC<React.ComponentProps<"div">> = (
	props,
): ReactElement => {
	const { className, ...rest } = props;

	return (
		<div
			data-slot="sidebar-group-content"
			data-sidebar="group-content"
			className={cn("w-full text-sm", className)}
			{...rest}
		/>
	);
};
