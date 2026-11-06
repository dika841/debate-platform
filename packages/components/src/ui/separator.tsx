import type * as React from "react";
import type { FC, ReactElement } from "react";
import { cn } from "../lib/utils.ts";
import { Separator as SeparatorPrimitive } from "radix-ui";

const Separator: FC<React.ComponentProps<typeof SeparatorPrimitive.Root>> = (
	props,
): ReactElement => {
	const {
		className,
		orientation = "horizontal",
		decorative = true,
		...rest
	} = props;

	return (
		<SeparatorPrimitive.Root
			data-slot="separator"
			decorative={decorative}
			orientation={orientation}
			className={cn(
				"shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
				className,
			)}
			{...rest}
		/>
	);
};

export { Separator };
