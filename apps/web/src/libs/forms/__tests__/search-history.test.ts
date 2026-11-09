import { afterEach, describe, expect, it } from "vitest";
import {
	searchHistoryAdd,
	searchHistoryClear,
	searchHistoryRead,
	searchHistoryWrite,
} from "@/libs/forms/search-history.ts";

const STORAGE_KEY = "test:search-history";

afterEach(() => {
	searchHistoryClear(STORAGE_KEY);
});

describe("searchHistoryAdd", () => {
	it("adds the newest term first", () => {
		expect(searchHistoryAdd(["climate"], "energy")).toEqual(["energy", "climate"]);
	});

	it("deduplicates case-insensitively", () => {
		expect(searchHistoryAdd(["Climate", "energy"], "climate")).toEqual(["climate", "energy"]);
	});

	it("ignores terms shorter than two characters", () => {
		const history = ["climate"];

		expect(searchHistoryAdd(history, " c ")).toBe(history);
	});

	it("limits the history length", () => {
		const history = ["a1", "b2", "c3"];

		expect(searchHistoryAdd(history, "d4", 3)).toEqual(["d4", "a1", "b2"]);
	});
});

describe("search history storage", () => {
	it("round-trips a history list", () => {
		searchHistoryWrite(STORAGE_KEY, ["climate", "energy"]);

		expect(searchHistoryRead(STORAGE_KEY)).toEqual(["climate", "energy"]);
	});

	it("returns an empty list for malformed storage", () => {
		window.localStorage.setItem(STORAGE_KEY, "{not-json");

		expect(searchHistoryRead(STORAGE_KEY)).toEqual([]);
	});

	it("clears stored history", () => {
		searchHistoryWrite(STORAGE_KEY, ["climate"]);
		searchHistoryClear(STORAGE_KEY);

		expect(searchHistoryRead(STORAGE_KEY)).toEqual([]);
	});
});
