import { cva, type VariantProps } from "class-variance-authority";
import type { FC, HTMLAttributes, ReactElement } from "react";
import { cn } from "../lib/utils.ts";

const badgeVariants = cva(
	"inline-flex items-center rounded-sm px-2 py-0.5 font-mono text-[10px] font-semibold tracking-[0.14em] uppercase",
	{
		variants: {
			variant: {
				default: "bg-primary text-primary-foreground",
				secondary: "bg-secondary text-secondary-foreground",
				destructive: "bg-destructive text-white",
				outline: "border border-border text-foreground",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

type TBadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export const Badge: FC<TBadgeProps> = (props): ReactElement => {
	const { className, variant, ...rest } = props;

	return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...rest} />;
};
