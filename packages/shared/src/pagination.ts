export type PageRequest = {
	readonly cursor?: string | null;
	readonly limit: number;
};

export type Page<T> = {
	readonly items: readonly T[];
	readonly nextCursor: string | null;
};

export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 50;

export const pageRequest = (input?: Partial<PageRequest>): PageRequest => ({
	cursor: input?.cursor ?? null,
	limit: Math.min(Math.max(input?.limit ?? DEFAULT_PAGE_LIMIT, 1), MAX_PAGE_LIMIT)
});
