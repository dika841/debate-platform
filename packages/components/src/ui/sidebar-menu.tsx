import type * as React from "react";
import type { FC, ReactElement } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { match, P } from "ts-pattern";
import { cn } from "../lib/utils.ts";
import { SIDEBAR_STATE, useSidebar } from "./sidebar-context.ts";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

const NO_TOOLTIP = "";

const sidebarMenuButtonVariants = cva(
	"peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm ring-sidebar-ring outline-hidden transition-[width,height,padding] group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
	{
		variants: {
			variant: {
				default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
				outline:
					"bg-background shadow-[0_0_0_1px_var(--sidebar-border)] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_var(--sidebar-accent)]",
			},
			size: {
				default: "h-8 text-sm",
				sm: "h-7 text-xs",
				lg: "h-12 text-sm group-data-[collapsible=icon]:p-0!",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

type TTooltipContentProps = React.ComponentProps<typeof TooltipContent>;

type TSidebarMenuButtonProps = React.ComponentProps<"button"> & {
	asChild?: boolean;
	isActive?: boolean;
	tooltip?: string | TTooltipContentProps;
} & VariantProps<typeof sidebarMenuButtonVariants>;

type TSidebarMenuActionProps = React.ComponentProps<"button"> & {
	asChild?: boolean;
	showOnHover?: boolean;
};

const tooltipPropsOf = (
	tooltip: string | TTooltipContentProps | undefined,
): TTooltipContentProps | null =>
	match(tooltip)
		.with(P.nullish, (): null => null)
		.with(NO_TOOLTIP, (): null => null)
		.with(P.string, (children): TTooltipContentProps => ({ children }))
		.otherwise((found): TTooltipContentProps => found);

export const SidebarMenu: FC<React.ComponentProps<"ul">> = (
	props,
): ReactElement => {
	const { className, ...rest } = props;

	return (
		<ul
			data-slot="sidebar-menu"
			data-sidebar="menu"
			className={cn("flex w-full min-w-0 flex-col gap-1", className)}
			{...rest}
		/>
	);
};

export const SidebarMenuItem: FC<React.ComponentProps<"li">> = (
	props,
): ReactElement => {
	const { className, ...rest } = props;

	return (
		<li
			data-slot="sidebar-menu-item"
			data-sidebar="menu-item"
			className={cn("group/menu-item relative", className)}
			{...rest}
		/>
	);
};

export const SidebarMenuButton: FC<TSidebarMenuButtonProps> = (
	props,
): ReactElement => {
	const {
		asChild = false,
		isActive = false,
		variant = "default",
		size = "default",
		tooltip,
		className,
		...rest
	} = props;
	const Comp = asChild ? Slot.Root : "button";
	const { isMobile, state } = useSidebar();

	const button = (
		<Comp
			data-slot="sidebar-menu-button"
			data-sidebar="menu-button"
			data-size={size}
			data-active={isActive}
			className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
			{...rest}
		/>
	);

	return match(tooltipPropsOf(tooltip))
		.with(P.nullish, (): ReactElement => button)
		.otherwise(
			(tooltipProps): ReactElement => (
				<Tooltip>
					<TooltipTrigger asChild>{button}</TooltipTrigger>
					<TooltipContent
						side="right"
						align="center"
						hidden={state !== SIDEBAR_STATE.COLLAPSED || isMobile}
						{...tooltipProps}
					/>
				</Tooltip>
			),
		);
};

export const SidebarMenuAction: FC<TSidebarMenuActionProps> = (
	props,
): ReactElement => {
	const { className, asChild = false, showOnHover = false, ...rest } = props;
	const Comp = asChild ? Slot.Root : "button";

	return (
		<Comp
			data-slot="sidebar-menu-action"
			data-sidebar="menu-action"
			className={cn(
				"absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground ring-sidebar-ring outline-hidden transition-transform peer-hover/menu-button:text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
				"after:absolute after:-inset-2 md:after:hidden",
				"peer-data-[size=sm]/menu-button:top-1",
				"peer-data-[size=default]/menu-button:top-1.5",
				"peer-data-[size=lg]/menu-button:top-2.5",
				"group-data-[collapsible=icon]:hidden",
				showOnHover &&
					"group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 peer-data-[active=true]/menu-button:text-sidebar-accent-foreground data-[state=open]:opacity-100 md:opacity-0",
				className,
			)}
			{...rest}
		/>
	);
};
