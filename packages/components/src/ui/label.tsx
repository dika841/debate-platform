import type * as React from "react";
import type { FC, ReactElement } from "react";
import { cn } from "../lib/utils.ts";
import { Label as LabelPrimitive } from "radix-ui";

const Label: FC<React.ComponentProps<typeof LabelPrimitive.Root>> = (
	props,
): ReactElement => {
	const { className, ...rest } = props;

	return (
		<LabelPrimitive.Root
			data-slot="label"
			className={cn(
				"flex cursor-pointer items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
				className,
			)}
			{...rest}
		/>
	);
};

export { Label };
