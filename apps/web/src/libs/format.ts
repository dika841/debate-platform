const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
	dateStyle: "medium",
	timeStyle: "short",
});

/** Formats an ISO timestamp using a single shared `Intl.DateTimeFormat`. */
export const formatDateTime = (value: string | Date): string =>
	dateTimeFormatter.format(typeof value === "string" ? new Date(value) : value);
