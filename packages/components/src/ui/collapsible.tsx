import type * as React from "react";
import type { FC, ReactElement } from "react";
import { Collapsible as CollapsiblePrimitive } from "radix-ui";

const Collapsible: FC<
	React.ComponentProps<typeof CollapsiblePrimitive.Root>
> = (props): ReactElement => {
	return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />;
};

const CollapsibleTrigger: FC<
	React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>
> = (props): ReactElement => {
	return (
		<CollapsiblePrimitive.CollapsibleTrigger
			data-slot="collapsible-trigger"
			{...props}
		/>
	);
};

const CollapsibleContent: FC<
	React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>
> = (props): ReactElement => {
	return (
		<CollapsiblePrimitive.CollapsibleContent
			data-slot="collapsible-content"
			{...props}
		/>
	);
};

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
