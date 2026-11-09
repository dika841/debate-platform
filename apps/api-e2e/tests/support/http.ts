export const TEST_PASSWORD = "Password123!";

export type AuthUser = {
	readonly id: string;
	readonly name: string;
	readonly email: string;
	readonly role: string;
};

export type RpcErrorBody = {
	readonly defined?: boolean;
	readonly code?: string;
	readonly status?: number;
	readonly message?: string;
};

export type RpcEnvelope<T> = {
	readonly json?: T | RpcErrorBody;
	readonly meta?: unknown;
};

export type JsonResponse<T> = {
	readonly status: number;
	readonly body: T;
	readonly headers: Headers;
};

type RequestOptions = {
	readonly method?: string;
	readonly body?: string;
	readonly headers?: Record<string, string>;
};

const cookieValue = (raw: string): { readonly name: string; readonly value: string } | null => {
	const pair = raw.split(";", 1)[0];

	if (!pair) {
		return null;
	}

	const separator = pair.indexOf("=");

	if (separator <= 0) {
		return null;
	}

	return {
		name: pair.slice(0, separator).trim(),
		value: pair.slice(separator + 1),
	};
};

/**
 * Minimal cookie-aware HTTP agent. Every request goes over real HTTP to the
 * spawned API so tests exercise Hono, oRPC, Better Auth and PostgreSQL together.
 */
export class Agent {
	readonly baseUrl: string;
	readonly origin: string;
	readonly #cookies = new Map<string, string>();

	constructor(baseUrl: string, origin = "http://localhost:5173") {
		this.baseUrl = baseUrl.replace(/\/$/, "");
		this.origin = origin;
	}

	async request(path: string, options: RequestOptions = {}): Promise<Response> {
		const headers = new Headers(options.headers);

		if (!headers.has("origin")) {
			headers.set("origin", this.origin);
		}

		if (options.body !== undefined && !headers.has("content-type")) {
			headers.set("content-type", "application/json");
		}

		const cookie = this.cookieHeader();

		if (cookie.length > 0) {
			headers.set("cookie", cookie);
		}

		const response = await fetch(`${this.baseUrl}${path}`, {
			method: options.method ?? "GET",
			body: options.body,
			headers,
			redirect: "manual",
		});

		const setCookies = (
			response.headers as Headers & { getSetCookie?: () => string[] }
		).getSetCookie?.();

		for (const raw of setCookies ?? []) {
			const parsed = cookieValue(raw);

			if (!parsed) {
				continue;
			}

			if (parsed.value.length === 0 || /max-age=0(?:;|$)/i.test(raw)) {
				this.#cookies.delete(parsed.name);
				continue;
			}

			this.#cookies.set(parsed.name, parsed.value);
		}

		return response;
	}

	async json<T>(path: string, options: RequestOptions = {}): Promise<JsonResponse<T>> {
		const response = await this.request(path, options);
		const text = await response.text();
		const body = text.length > 0 ? (JSON.parse(text) as T) : (null as T);

		return {
			status: response.status,
			body,
			headers: response.headers,
		};
	}

	async rpc<T>(path: string, input: unknown = {}): Promise<JsonResponse<RpcEnvelope<T>>> {
		return this.json<RpcEnvelope<T>>(`/rpc/${path}`, {
			method: "POST",
			body: JSON.stringify({ json: input }),
		});
	}

	async rpcData<T>(path: string, input: unknown = {}): Promise<T> {
		const result = await this.rpc<T>(path, input);

		if (result.status < 200 || result.status >= 300) {
			throw new Error(`RPC ${path} failed with ${result.status}: ${JSON.stringify(result.body)}`);
		}

		const data = result.body.json as T | undefined;

		if (data === undefined) {
			throw new Error(`RPC ${path} returned no JSON payload`);
		}

		return data;
	}

	async signUp(name: string, email: string, password = TEST_PASSWORD): Promise<AuthUser> {
		const result = await this.json<{ readonly user: AuthUser }>("/api/auth/sign-up/email", {
			method: "POST",
			body: JSON.stringify({ name, email, password }),
		});

		if (result.status !== 200) {
			throw new Error(`Sign-up failed with ${result.status}: ${JSON.stringify(result.body)}`);
		}

		return result.body.user;
	}

	async signIn(email: string, password = TEST_PASSWORD): Promise<void> {
		const result = await this.json<{ readonly user: AuthUser }>("/api/auth/sign-in/email", {
			method: "POST",
			body: JSON.stringify({ email, password }),
		});

		if (result.status !== 200) {
			throw new Error(`Sign-in failed with ${result.status}: ${JSON.stringify(result.body)}`);
		}
	}

	async signOut(): Promise<void> {
		await this.json("/api/auth/sign-out", {
			method: "POST",
			body: JSON.stringify({}),
		});
		this.#cookies.clear();
	}

	cookieHeader(): string {
		return [...this.#cookies.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
	}
}

export const emailFor = (runId: string, label: string): string => `${runId}-${label}@example.com`;

export const usernameFor = (runId: string, label: string): string =>
	`${label}_${runId}`
		.replace(/[^a-z0-9_]/gi, "_")
		.toLowerCase()
		.slice(0, 30);

export const roomInput = (label: string) => ({
	title: `${label} debate`,
	motion: "This house would verify the debate platform end to end",
	description: "Integration test room created through the public HTTP API.",
	teamSize: 1,
	roundCount: 1,
	submissionDurationMinutes: 5,
	votingDurationMinutes: 5,
	spectatorVotingEnabled: true,
});

export const submissionContent = (label: string): string =>
	`${label} argument: structured debate needs clear evidence, measurable impacts and a concise comparison of both worlds.`;
