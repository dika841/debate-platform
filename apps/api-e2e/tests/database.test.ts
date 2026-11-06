import { databaseCreate } from "@app/database";
import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";

const databaseUrl = process.env.DATABASE_URL;

describe.skipIf(!databaseUrl)("database integration", () => {
	it("connects to PostgreSQL and executes a query", async () => {
		const handle = databaseCreate(databaseUrl as string);

		try {
			const result = await handle.db.execute(sql`select 1 as value`);
			expect(result.rows.length).toBe(1);
		} finally {
			await handle.close();
		}
	});
});
