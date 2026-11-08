type Labels = Record<string, string | number>;

type CounterEntry = {
	readonly name: string;
	readonly labels: Labels;
	value: number;
};

const counters = new Map<string, CounterEntry>();

const labelKey = (labels: Labels): string =>
	Object.entries(labels)
		.map(([key, value]) => `${key}=${value}`)
		.sort()
		.join(",");

const counterKey = (name: string, labels: Labels): string => `${name}{${labelKey(labels)}}`;

const formatLabels = (labels: Labels): string => {
	const entries = Object.entries(labels).sort(([left], [right]) => left.localeCompare(right));

	if (entries.length === 0) {
		return "";
	}

	return `{${entries
		.map(([key, value]) => `${key}="${String(value).replaceAll('"', '\\"')}"`)
		.join(",")}}`;
};

export const metrics = {
	increment(name: string, labels: Labels = {}, amount = 1): void {
		const key = counterKey(name, labels);
		const existing = counters.get(key);

		if (existing) {
			existing.value += amount;
			return;
		}

		counters.set(key, { name, labels: { ...labels }, value: amount });
	},

	observeRequest(input: {
		readonly method: string;
		readonly route: string;
		readonly status: number;
		readonly durationMs: number;
	}): void {
		const base = { method: input.method, route: input.route };

		this.increment("http_requests_total", { ...base, status: input.status });
		this.increment(
			"http_request_duration_ms_total",
			base,
			Math.max(0, Math.round(input.durationMs)),
		);
		this.increment("http_request_duration_ms_count", base);
	},

	render(): string {
		const names = [...new Set([...counters.values()].map((entry) => entry.name))].sort();
		const lines: string[] = [];

		for (const name of names) {
			const type = name.endsWith("_total") || name.endsWith("_count") ? "counter" : "gauge";
			lines.push(`# TYPE ${name} ${type}`);

			const entries = [...counters.values()]
				.filter((entry) => entry.name === name)
				.sort((left, right) => labelKey(left.labels).localeCompare(labelKey(right.labels)));

			for (const entry of entries) {
				lines.push(`${entry.name}${formatLabels(entry.labels)} ${entry.value}`);
			}
		}

		return `${lines.join("\n")}\n`;
	},

	reset(): void {
		counters.clear();
	},
};
