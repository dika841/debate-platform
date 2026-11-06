import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import { drizzle as drizzleNeon, type NeonDatabase } from "drizzle-orm/neon-serverless";
import { drizzle as drizzleNode } from "drizzle-orm/node-postgres";
import { Pool as NodePool } from "pg";
import * as schema from "./schema.ts";

export const DB_CONNECTION_TIMEOUT_MS = 5_000;

const LOCAL_DATABASE_HOSTS = new Set([
	"localhost",
	"127.0.0.1",
	"::1",
	"postgres",
	"host.docker.internal"
]);

const isLocalDatabase = (databaseUrl: string): boolean => {
	try {
		return LOCAL_DATABASE_HOSTS.has(new URL(databaseUrl).hostname);
	} catch {
		return false;
	}
};

export type Database = NeonDatabase<typeof schema>;

export type DatabaseHandle = {
	readonly db: Database;
	readonly close: () => Promise<void>;
};

export const databaseCreate = (databaseUrl: string): DatabaseHandle => {
	if (isLocalDatabase(databaseUrl)) {
		const pool = new NodePool({
			connectionString: databaseUrl,
			connectionTimeoutMillis: DB_CONNECTION_TIMEOUT_MS
		});

		return {
			// NodePgDatabase and NeonDatabase expose the same drizzle query API.
			db: drizzleNode({ client: pool, schema }) as unknown as Database,
			close: () => pool.end()
		};
	}

	// Use stateless HTTP in Cloudflare Workers to avoid hanging sockets between
	// isolate suspend/resume cycles.
	neonConfig.poolQueryViaFetch = true;

	const pool = new NeonPool({
		connectionString: databaseUrl,
		connectionTimeoutMillis: DB_CONNECTION_TIMEOUT_MS
	});

	return {
		db: drizzleNeon({ client: pool, schema }),
		close: () => pool.end()
	};
};

export type DatabaseTransaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

export const runInTransaction = async <T>(
	db: Database,
	work: (tx: DatabaseTransaction) => Promise<T>
): Promise<T> => db.transaction(work);

export { schema };
