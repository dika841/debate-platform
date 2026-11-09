import { ROLE, type Role } from "@app/permissions";
import { match, P } from "ts-pattern";

const isRole = (value: unknown): value is Role =>
	typeof value === "string" && (Object.values(ROLE) as readonly string[]).includes(value);

export const roleOf = (value: string | null | undefined): Role =>
	match(value)
		.with(P.when(isRole), (role) => role)
		.otherwise(() => ROLE.USER);
