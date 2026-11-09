import type { Permission } from "@app/permissions";
import { ForbiddenError } from "./forbidden.ts";

type RouteContext = {
	permissions: readonly Permission[];
};

type RouteGuardInput = {
	context: RouteContext;
};

type CheckRoutePermissionsOptions = {
	permissions: readonly Permission[];
};

/** Throws a forbidden error instead of redirecting, so the error screen can explain it. */
export const checkRoutePermissions =
	(options: CheckRoutePermissionsOptions): ((input: RouteGuardInput) => void) =>
	(input): void => {
		const allowed = options.permissions.every((permission) =>
			input.context.permissions.includes(permission),
		);

		if (!allowed) {
			throw new ForbiddenError();
		}
	};
