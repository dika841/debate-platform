import { spawn, type ChildProcess } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import type { TestProject } from "vitest/node";

const REPO_ROOT = fileURLToPath(new URL("../../..", import.meta.url));
const API_PORT = Number(process.env.API_E2E_PORT ?? 3101);
const BASE_URL = `http://localhost:${API_PORT}`;
const STARTUP_TIMEOUT_MS = 60_000;

const apiEnv = (databaseUrl: string): NodeJS.ProcessEnv => ({
	...process.env,
	DATABASE_URL: databaseUrl,
	NODE_ENV: "test",
	LOG_LEVEL: "error",
	PORT: String(API_PORT),
	BETTER_AUTH_URL: BASE_URL,
	BETTER_AUTH_SECRET: "api-e2e-secret-api-e2e-secret-1234567890",
	WEB_ORIGIN: "http://localhost:5173",
});

const runCommand = (args: string[], env: NodeJS.ProcessEnv): Promise<void> =>
	new Promise((resolve, reject) => {
		const child = spawn("pnpm", args, {
			cwd: REPO_ROOT,
			env,
			stdio: ["ignore", "pipe", "pipe"],
		});

		let output = "";
		child.stdout?.on("data", (chunk: Buffer) => {
			output += chunk.toString();
		});
		child.stderr?.on("data", (chunk: Buffer) => {
			output += chunk.toString();
		});
		child.once("error", reject);
		child.once("exit", (code) => {
			if (code === 0) {
				resolve();
				return;
			}

			reject(new Error(`pnpm ${args.join(" ")} exited with code ${code}\n${output}`));
		});
	});

const apiIsHealthy = async (): Promise<boolean> => {
	try {
		const response = await fetch(`${BASE_URL}/health`, {
			signal: AbortSignal.timeout(1_500),
		});

		if (!response.ok) {
			return false;
		}

		const body = (await response.json()) as { readonly database?: string };
		return body.database === "up";
	} catch {
		return false;
	}
};

const waitForApi = async (child: ChildProcess): Promise<void> => {
	let output = "";
	child.stdout?.on("data", (chunk: Buffer) => {
		output += chunk.toString();
	});
	child.stderr?.on("data", (chunk: Buffer) => {
		output += chunk.toString();
	});

	const deadline = Date.now() + STARTUP_TIMEOUT_MS;

	while (Date.now() < deadline) {
		if (await apiIsHealthy()) {
			return;
		}

		if (child.exitCode !== null) {
			throw new Error(`API exited before becoming ready (code ${child.exitCode})\n${output}`);
		}

		await delay(250);
	}

	throw new Error(
		`API did not become healthy at ${BASE_URL} within ${STARTUP_TIMEOUT_MS}ms\n${output}`,
	);
};

const stopProcessGroup = async (child: ChildProcess): Promise<void> => {
	if (child.pid === undefined || child.exitCode !== null) {
		return;
	}

	const pid = child.pid;

	await new Promise<void>((resolve) => {
		let settled = false;
		const finish = (): void => {
			if (settled) {
				return;
			}

			settled = true;
			clearTimeout(timer);
			resolve();
		};

		const timer = setTimeout(() => {
			try {
				process.kill(-pid, "SIGKILL");
			} catch {
				// Already gone.
			}

			finish();
		}, 5_000);

		child.once("exit", finish);

		try {
			process.kill(-pid, "SIGTERM");
		} catch {
			try {
				child.kill("SIGTERM");
			} catch {
				finish();
			}
		}
	});
};

const removeTestUsers = async (databaseUrl: string, runId: string): Promise<void> => {
	const client = new Client({ connectionString: databaseUrl });

	await client.connect();

	try {
		await client.query("delete from users where email like $1", [`${runId}-%@example.com`]);
	} finally {
		await client.end();
	}
};

export default async function setup(
	project: TestProject,
): Promise<(() => Promise<void>) | undefined> {
	const runId = `it-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

	project.provide("apiBaseUrl", BASE_URL);
	project.provide("runId", runId);

	const databaseUrl = process.env.DATABASE_URL;

	if (!databaseUrl) {
		return undefined;
	}

	if (process.env.NODE_ENV === "production") {
		throw new Error("API integration tests refuse to run with NODE_ENV=production");
	}

	if (await apiIsHealthy()) {
		throw new Error(
			`A healthy API is already running on ${BASE_URL}. Stop it or set API_E2E_PORT to a free port.`,
		);
	}

	const env = apiEnv(databaseUrl);

	await runCommand(["--filter", "@app/api", "migrate"], env);

	const child = spawn("pnpm", ["--filter", "@app/api", "start"], {
		cwd: REPO_ROOT,
		env,
		detached: true,
		stdio: ["ignore", "pipe", "pipe"],
	});

	await waitForApi(child);

	return async () => {
		await stopProcessGroup(child);
		await removeTestUsers(databaseUrl, runId);
	};
}
