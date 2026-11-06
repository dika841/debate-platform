import type * as React from "react";
import type { FC, ReactElement } from "react";
import { UI_MESSAGE } from "@app/messages";
import { match } from "ts-pattern";
import { cn } from "../lib/utils.ts";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "./sheet";
import {
	SIDEBAR_COLLAPSIBLE,
	SIDEBAR_SIDE,
	SIDEBAR_STATE,
	SIDEBAR_VARIANT,
	SIDEBAR_WIDTH_MOBILE,
	type TSidebarCollapsible,
	type TSidebarOpenState,
	type TSidebarSide,
	type TSidebarVariant,
	useSidebar,
} from "./sidebar-context.ts";

type TSidebarProps = React.ComponentProps<"div"> & {
	side?: TSidebarSide;
	variant?: TSidebarVariant;
	collapsible?: TSidebarCollapsible;
};

type TSidebarMobileProps = React.ComponentProps<typeof Sheet> & {
	side: TSidebarSide;
};

type TSidebarDesktopProps = React.ComponentProps<"div"> & {
	side: TSidebarSide;
	variant: TSidebarVariant;
	collapsible: TSidebarCollapsible;
	state: TSidebarOpenState;
};

const isFramed = (variant: TSidebarVariant): boolean =>
	match(variant)
		.with(SIDEBAR_VARIANT.FLOATING, (): boolean => true)
		.with(SIDEBAR_VARIANT.INSET, (): boolean => true)
		.otherwise((): boolean => false);

const SidebarStatic: FC<React.ComponentProps<"div">> = (
	props,
): ReactElement => {
	const { className, ...rest } = props;

	return (
		<div
			data-slot="sidebar"
			className={cn(
				"flex h-full w-(--sidebar-width) flex-col bg-sidebar text-sidebar-foreground",
				className,
			)}
			{...rest}
		/>
	);
};

const SidebarMobile: FC<TSidebarMobileProps> = (props): ReactElement => {
	const { side, children, ...rest } = props;

	return (
		<Sheet {...rest}>
			<SheetContent
				data-sidebar="sidebar"
				data-slot="sidebar"
				data-mobile="true"
				className="w-(--sidebar-width) bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
				style={
					{ "--sidebar-width": SIDEBAR_WIDTH_MOBILE } as React.CSSProperties
				}
				side={side}
			>
				<SheetHeader className="sr-only">
					<SheetTitle>{UI_MESSAGE.SIDEBAR_TITLE}</SheetTitle>
					<SheetDescription>{UI_MESSAGE.SIDEBAR_DESCRIPTION}</SheetDescription>
				</SheetHeader>
				<div className="flex h-full w-full flex-col">{children}</div>
			</SheetContent>
		</Sheet>
	);
};

const SidebarDesktop: FC<TSidebarDesktopProps> = (props): ReactElement => {
	const { side, variant, collapsible, state, className, children, ...rest } =
		props;
	const framed = isFramed(variant);

	return (
		<div
			className="group peer hidden text-sidebar-foreground md:block"
			data-state={state}
			data-collapsible={state === SIDEBAR_STATE.COLLAPSED ? collapsible : ""}
			data-variant={variant}
			data-side={side}
			data-slot="sidebar"
		>
			<div
				data-slot="sidebar-gap"
				className={cn(
					"relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear",
					"group-data-[collapsible=offcanvas]:w-0",
					"group-data-[side=right]:rotate-180",
					framed
						? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]"
						: "group-data-[collapsible=icon]:w-(--sidebar-width-icon)",
				)}
			/>
			<div
				data-slot="sidebar-container"
				className={cn(
					"fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear md:flex",
					side === SIDEBAR_SIDE.LEFT
						? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
						: "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
					framed
						? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]"
						: "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l",
					className,
				)}
				{...rest}
			>
				<div
					data-sidebar="sidebar"
					data-slot="sidebar-inner"
					className="flex h-full w-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow-sm"
				>
					{children}
				</div>
			</div>
		</div>
	);
};

export const Sidebar: FC<TSidebarProps> = (props): ReactElement => {
	const {
		side = SIDEBAR_SIDE.LEFT,
		variant = SIDEBAR_VARIANT.SIDEBAR,
		collapsible = SIDEBAR_COLLAPSIBLE.OFFCANVAS,
		...rest
	} = props;
	const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

	return match({ collapsible, isMobile })
		.with(
			{ collapsible: SIDEBAR_COLLAPSIBLE.NONE },
			(): ReactElement => <SidebarStatic {...rest} />,
		)
		.with(
			{ isMobile: true },
			(): ReactElement => (
				<SidebarMobile
					side={side}
					open={openMobile}
					onOpenChange={setOpenMobile}
					{...rest}
				/>
			),
		)
		.otherwise(
			(): ReactElement => (
				<SidebarDesktop
					side={side}
					variant={variant}
					collapsible={collapsible}
					state={state}
					{...rest}
				/>
			),
		);
};
