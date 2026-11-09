const SEARCH_HISTORY_LIMIT = 6;
const MIN_HISTORY_LENGTH = 2;

export const searchHistoryAdd = (
	history: readonly string[],
	value: string,
	limit = SEARCH_HISTORY_LIMIT,
): readonly string[] => {
	const term = value.trim();

	if (term.length < MIN_HISTORY_LENGTH) {
		return history;
	}

	const normalized = term.toLowerCase();
	return [term, ...history.filter((item) => item.toLowerCase() !== normalized)].slice(0, limit);
};

export const searchHistoryRead = (key: string): readonly string[] => {
	if (typeof window === "undefined") {
		return [];
	}

	try {
		const raw = window.localStorage.getItem(key);
		if (!raw) {
			return [];
		}

		const parsed: unknown = JSON.parse(raw);
		return Array.isArray(parsed)
			? parsed.filter((value): value is string => typeof value === "string").slice(0, 6)
			: [];
	} catch {
		return [];
	}
};

export const searchHistoryWrite = (key: string, history: readonly string[]): void => {
	if (typeof window === "undefined") {
		return;
	}

	try {
		window.localStorage.setItem(key, JSON.stringify(history));
	} catch {
		// Storage can be unavailable (private mode/quota); search still works without history.
	}
};

export const searchHistoryClear = (key: string): void => {
	if (typeof window === "undefined") {
		return;
	}

	try {
		window.localStorage.removeItem(key);
	} catch {
		// Ignore unavailable storage.
	}
};
