import { z } from "zod";

export type EnvSource = Record<string, string | undefined>;

const processSource = (): EnvSource => {
	if (typeof process === "undefined") {
		return {};
	}
	return process.env;
};

export class EnvValidationError extends Error {
	readonly issues: readonly string[];

	constructor(issues: readonly string[]) {
		super(`Invalid environment configuration:\n${issues.join("\n")}`);
		this.name = "EnvValidationError";
		this.issues = issues;
	}
}

export const envParse = <TSchema extends z.ZodType>(
	schema: TSchema,
	source: EnvSource = processSource()
): z.infer<TSchema> => {
	const parsed = schema.safeParse(source);

	if (!parsed.success) {
		const issues = parsed.error.issues.map((issue) => {
			const path = issue.path.length > 0 ? issue.path.join(".") : "environment";
			return `- ${path}: ${issue.message}`;
		});
		throw new EnvValidationError(issues);
	}

	return parsed.data;
};

export const envSafeParse = <TSchema extends z.ZodType>(
	schema: TSchema,
	source: EnvSource = processSource()
): { success: true; data: z.infer<TSchema> } | { success: false; error: EnvValidationError } => {
	try {
		return { success: true, data: envParse(schema, source) };
	} catch (error) {
		if (error instanceof EnvValidationError) {
			return { success: false, error };
		}
		throw error;
	}
};
