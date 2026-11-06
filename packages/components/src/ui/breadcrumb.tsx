import { UI_MESSAGE } from "@app/messages";
import type * as React from "react";
import type { FC, ReactElement } from "react";
import { cn } from "../lib/utils.ts";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import { Slot } from "radix-ui";

const Breadcrumb: FC<React.ComponentProps<"nav">> = (props): ReactElement => {
	return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />;
};

const BreadcrumbList: FC<React.ComponentProps<"ol">> = (
	props,
): ReactElement => {
	const { className, ...rest } = props;

	return (
		<ol
			data-slot="breadcrumb-list"
			className={cn(
				"flex flex-wrap items-center gap-1.5 text-sm break-words text-muted-foreground sm:gap-2.5",
				className,
			)}
			{...rest}
		/>
	);
};

const BreadcrumbItem: FC<React.ComponentProps<"li">> = (
	props,
): ReactElement => {
	const { className, ...rest } = props;

	return (
		<li
			data-slot="breadcrumb-item"
			className={cn("inline-flex items-center gap-1.5", className)}
			{...rest}
		/>
	);
};

type TBreadcrumbLinkProps = React.ComponentProps<"a"> & {
	asChild?: boolean;
};

const BreadcrumbLink: FC<TBreadcrumbLinkProps> = (props): ReactElement => {
	const { asChild, className, ...rest } = props;
	const Comp = asChild ? Slot.Root : "a";

	return (
		<Comp
			data-slot="breadcrumb-link"
			className={cn("transition-colors hover:text-foreground", className)}
			{...rest}
		/>
	);
};

const BreadcrumbPage: FC<React.ComponentProps<"span">> = (
	props,
): ReactElement => {
	const { className, ...rest } = props;

	return (
		<span
			data-slot="breadcrumb-page"
			aria-current="page"
			className={cn("font-normal text-foreground", className)}
			{...rest}
		/>
	);
};

const BreadcrumbSeparator: FC<React.ComponentProps<"li">> = (
	props,
): ReactElement => {
	const { children, className, ...rest } = props;

	return (
		<li
			data-slot="breadcrumb-separator"
			role="presentation"
			aria-hidden="true"
			className={cn("[&>svg]:size-3.5", className)}
			{...rest}
		>
			{children ?? <ChevronRight />}
		</li>
	);
};

const BreadcrumbEllipsis: FC<React.ComponentProps<"span">> = (
	props,
): ReactElement => {
	const { className, ...rest } = props;

	return (
		<span
			data-slot="breadcrumb-ellipsis"
			role="presentation"
			aria-hidden="true"
			className={cn("flex size-9 items-center justify-center", className)}
			{...rest}
		>
			<MoreHorizontal className="size-4" />
			<span className="sr-only">{UI_MESSAGE.MORE}</span>
		</span>
	);
};

export {
	Breadcrumb,
	BreadcrumbList,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbPage,
	BreadcrumbSeparator,
	BreadcrumbEllipsis,
};
