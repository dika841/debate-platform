import type * as React from "react";
import type { FC, ReactElement } from "react";
import { cn } from "../lib/utils.ts";
import { ChevronRightIcon } from "lucide-react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";

export const DropdownMenuSub: FC<
	React.ComponentProps<typeof DropdownMenuPrimitive.Sub>
> = (props): ReactElement => {
	return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />;
};

type TDropdownMenuSubTriggerProps = React.ComponentProps<
	typeof DropdownMenuPrimitive.SubTrigger
> & {
	inset?: boolean;
};

export const DropdownMenuSubTrigger: FC<TDropdownMenuSubTriggerProps> = (
	props,
): ReactElement => {
	const { className, inset, children, ...rest } = props;

	return (
		<DropdownMenuPrimitive.SubTrigger
			data-slot="dropdown-menu-sub-trigger"
			data-inset={inset}
			className={cn(
				"flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[inset]:pl-8 data-[state=open]:bg-accent data-[state=open]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
				className,
			)}
			{...rest}
		>
			{children}
			<ChevronRightIcon className="ml-auto size-4" />
		</DropdownMenuPrimitive.SubTrigger>
	);
};

export const DropdownMenuSubContent: FC<
	React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>
> = (props): ReactElement => {
	const { className, ...rest } = props;

	return (
		<DropdownMenuPrimitive.SubContent
			data-slot="dropdown-menu-sub-content"
			className={cn(
				"z-50 min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
				className,
			)}
			{...rest}
		/>
	);
};
