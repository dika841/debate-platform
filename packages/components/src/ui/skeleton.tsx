import type * as React from "react";
import type { FC, ReactElement } from "react";
import { cn } from "../lib/utils.ts";

const Skeleton: FC<React.ComponentProps<"div">> = (props): ReactElement => {
	const { className, ...rest } = props;

	return (
		<div
			data-slot="skeleton"
			className={cn("animate-pulse rounded-md bg-accent", className)}
			{...rest}
		/>
	);
};

export { Skeleton };
