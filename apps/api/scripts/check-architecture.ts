import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const apiSource = join(root, "src");
const webSource = join(root, "../../apps/web/src");

const FORBIDDEN_DOMAIN_IMPORTS = [
	"hono",
	"@orpc/",
	"drizzle-orm",
	"zod",
	"#/platform/db",
	"#/platform/http",
];

const FORBIDDEN_WEB_IMPORTS = ["@app/database", "@app/auth", "@app/api"];

const listFiles = async (directory: string): Promise<readonly string[]> => {
	try {
		const entries = await readdir(directory, { withFileTypes: true });
		const nested = await Promise.all(
			entries.map(async (entry) => {
				const path = join(directory, entry.name);
				if (entry.isDirectory()) {
					return listFiles(path);
				}
				return entry.isFile() && entry.name.endsWith(".ts") ? [path] : [];
			}),
		);
		return nested.flat();
	} catch {
		return [];
	}
};

const importMatches = (source: string, specifiers: readonly string[]): readonly string[] =>
	specifiers.filter((specifier) => {
		const normalized = specifier.replace(/\/$/, "");
		const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		const pattern = new RegExp(`from\\s+["']${escaped}(?:["'/])`);
		return pattern.test(source);
	});

const violations: string[] = [];

const domainRoots = (await listFiles(join(apiSource, "modules")))
	.filter((file) => file.includes("/domain/"))
	.filter((file) => file.endsWith(".ts"));

for (const file of domainRoots) {
	const source = await readFile(file, "utf8");
	for (const specifier of importMatches(source, FORBIDDEN_DOMAIN_IMPORTS)) {
		violations.push(`${relative(root, file)}: domain imports "${specifier}"`);
	}
}

for (const file of await listFiles(webSource)) {
	const source = await readFile(file, "utf8");
	for (const specifier of importMatches(source, FORBIDDEN_WEB_IMPORTS)) {
		violations.push(`${relative(root, file)}: web imports backend package "${specifier}"`);
	}
}

if (violations.length > 0) {
	console.error("Architecture violations detected:");
	for (const violation of violations) {
		console.error(`- ${violation}`);
	}
	process.exit(1);
}

console.log("Architecture boundaries OK");
