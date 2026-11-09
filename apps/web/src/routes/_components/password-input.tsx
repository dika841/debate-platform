import { Button } from "@app/components/ui/button";
import { Input } from "@app/components/ui/input";
import { cn } from "@app/components/lib/utils";
import { AUTH } from "@app/messages";
import { Eye, EyeOff } from "lucide-react";
import { useState, type ComponentProps } from "react";

type PasswordInputProps = Omit<ComponentProps<typeof Input>, "type">;

export const PasswordInput = ({ className, ...props }: PasswordInputProps) => {
	const [showPassword, setShowPassword] = useState(false);

	return (
		<div className="relative">
			<Input
				{...props}
				type={showPassword ? "text" : "password"}
				className={cn("pr-10", className)}
			/>
			<Button
				type="button"
				variant="ghost"
				size="icon-sm"
				className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground hover:bg-transparent hover:text-foreground"
				aria-label={showPassword ? AUTH.hidePassword : AUTH.showPassword}
				onClick={() => setShowPassword((current) => !current)}
			>
				{showPassword ? <EyeOff /> : <Eye />}
			</Button>
		</div>
	);
};
