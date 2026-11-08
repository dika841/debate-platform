export type ProxyMode = "cloudflare" | "proxy";

const IP_PATTERN = /^[0-9a-fA-F:.%]{2,64}$/;

const normalizeIp = (value: string | null): string | null => {
	if (!value) {
		return null;
	}

	const trimmed = value.trim().replace(/^\[/, "").replace(/\]$/, "");
	return IP_PATTERN.test(trimmed) ? trimmed : null;
};

/**
 * Resolves the client IP without trusting arbitrary client-supplied headers.
 *
 * - `cloudflare`: CF-Connecting-IP is only meaningful when the origin is locked
 *   to Cloudflare (or running as a Worker).
 * - `proxy`: X-Real-IP is set by nginx to `$remote_addr`; never use the first
 *   X-Forwarded-For entry, because clients can prepend forged values.
 */
export const resolveClientIp = (headers: Headers, mode: ProxyMode): string => {
	const preferredHeaders =
		mode === "cloudflare" ? ["cf-connecting-ip", "x-real-ip"] : ["x-real-ip"];

	for (const header of preferredHeaders) {
		const candidate = normalizeIp(headers.get(header));

		if (candidate) {
			return candidate;
		}
	}

	const forwarded = headers.get("x-forwarded-for");

	if (forwarded) {
		const entries = forwarded.split(",").map((entry) => entry.trim());

		for (let index = entries.length - 1; index >= 0; index -= 1) {
			const candidate = normalizeIp(entries[index] ?? "");
			if (candidate) {
				return candidate;
			}
		}
	}

	return "unknown";
};
