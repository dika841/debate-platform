import { ERROR } from "@app/messages";

export class ServerUnreachableError extends Error {
	constructor() {
		super(ERROR.serverUnreachableTitle);
		this.name = "ServerUnreachableError";
	}
}

export const isServerUnreachable = (error: unknown): boolean =>
	error instanceof ServerUnreachableError;
