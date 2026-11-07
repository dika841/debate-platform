const CURSOR_SEPARATOR = "|";

export type CursorValue = {
	readonly timestamp: Date;
	readonly id: string;
};

export const encodeCursor = ({ timestamp, id }: CursorValue): string =>
	btoa(`${timestamp.toISOString()}${CURSOR_SEPARATOR}${id}`);

export const decodeCursor = (cursor: string | null | undefined): CursorValue | null => {
	if (!cursor) {
		return null;
	}

	try {
		const raw = atob(cursor);
		const separatorIndex = raw.indexOf(CURSOR_SEPARATOR);

		if (separatorIndex === -1) {
			return null;
		}

		const timestamp = new Date(raw.slice(0, separatorIndex));
		const id = raw.slice(separatorIndex + 1);

		if (Number.isNaN(timestamp.getTime()) || id.length === 0) {
			return null;
		}

		return { timestamp, id };
	} catch {
		return null;
	}
};
