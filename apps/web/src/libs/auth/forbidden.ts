import { ERROR } from "@app/messages";

export class ForbiddenError extends Error {
	constructor() {
		super(ERROR.forbiddenTitle);
		this.name = "ForbiddenError";
	}
}

export const isForbidden = (error: unknown): boolean => error instanceof ForbiddenError;
