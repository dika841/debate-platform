import { Client } from "pg";

let client: Client | null = null;

const connection = async (): Promise<Client> => {
	if (client) {
		return client;
	}

	const databaseUrl = process.env.DATABASE_URL;

	if (!databaseUrl) {
		throw new Error("DATABASE_URL is required for database helpers");
	}

	client = new Client({ connectionString: databaseUrl });
	await client.connect();

	return client;
};

export const execute = async (text: string, values: unknown[] = []): Promise<void> => {
	const connectionClient = await connection();
	await connectionClient.query(text, values);
};

export const closeDatabase = async (): Promise<void> => {
	if (!client) {
		return;
	}

	await client.end();
	client = null;
};
