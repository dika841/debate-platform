import { Button } from "@app/components/ui/button";
import { ERROR } from "@app/messages";
import { Link } from "@tanstack/react-router";

export const NotFound = () => (
	<div className="flex min-h-[60vh] items-center justify-center p-6 text-foreground">
		<div className="max-w-md space-y-3 text-center">
			<p className="text-sm font-medium text-muted-foreground">404</p>
			<h1 className="text-xl font-semibold">{ERROR.notFoundTitle}</h1>
			<p className="text-sm text-muted-foreground">{ERROR.notFoundBody}</p>
			<Button variant="outline" asChild>
				<Link to="/">{ERROR.goHome}</Link>
			</Button>
		</div>
	</div>
);
