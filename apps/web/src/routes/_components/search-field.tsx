import { Input } from "@app/components/ui/input";
import { ROOM } from "@app/messages";
import { Clock, Search } from "lucide-react";
import { memo, useCallback, useId, useMemo, useState, type KeyboardEvent } from "react";
import {
	searchHistoryAdd,
	searchHistoryClear,
	searchHistoryRead,
	searchHistoryWrite,
} from "@/libs/forms/search-history.ts";
import { useSearchForm } from "@/libs/forms/use-search-form.ts";

const DEFAULT_STORAGE_KEY = "debate-platform:room-search";
const MAX_VISIBLE_ITEMS = 8;

type SearchFieldProps = {
	readonly value: string;
	readonly onChange: (value: string) => void;
	readonly suggestions?: readonly string[];
	readonly storageKey?: string;
};

type SearchItem = {
	readonly value: string;
	readonly kind: "recent" | "suggestion";
};

const buildItems = (
	value: string,
	recentSearches: readonly string[],
	suggestions: readonly string[],
): readonly SearchItem[] => {
	const query = value.trim().toLowerCase();
	const seen = new Set<string>();
	const items: SearchItem[] = [];

	for (const recent of recentSearches) {
		const normalized = recent.toLowerCase();

		if (seen.has(normalized) || normalized === query) {
			continue;
		}

		if (query && !normalized.includes(query)) {
			continue;
		}

		seen.add(normalized);
		items.push({ value: recent, kind: "recent" });
	}

	if (query) {
		for (const suggestion of suggestions) {
			const term = suggestion.trim();
			const normalized = term.toLowerCase();

			if (!term || seen.has(normalized) || normalized === query || !normalized.includes(query)) {
				continue;
			}

			seen.add(normalized);
			items.push({ value: term, kind: "suggestion" });
		}
	}

	return items.slice(0, MAX_VISIBLE_ITEMS);
};

const SearchFieldComponent = ({
	value,
	onChange,
	suggestions = [],
	storageKey = DEFAULT_STORAGE_KEY,
}: SearchFieldProps) => {
	const listboxId = useId();
	const { form, onSubmit } = useSearchForm({ value, onChange });
	const [open, setOpen] = useState(false);
	const [activeIndex, setActiveIndex] = useState(-1);
	const [recentSearches, setRecentSearches] = useState<readonly string[]>(() =>
		searchHistoryRead(storageKey),
	);

	const items = useMemo(
		() => buildItems(value, recentSearches, suggestions),
		[recentSearches, suggestions, value],
	);
	const visible = open && items.length > 0;

	const persistRecent = useCallback(
		(term: string): void => {
			setRecentSearches((current) => {
				const next = searchHistoryAdd(current, term);

				if (next !== current) {
					searchHistoryWrite(storageKey, next);
				}

				return next;
			});
		},
		[storageKey],
	);

	const selectItem = useCallback(
		(term: string): void => {
			form.setFieldValue("search", term);
			onChange(term);
			persistRecent(term);
			setOpen(false);
			setActiveIndex(-1);
		},
		[form, onChange, persistRecent],
	);

	const clearRecentSearches = useCallback((): void => {
		searchHistoryClear(storageKey);
		setRecentSearches([]);
		setActiveIndex(-1);
	}, [storageKey]);

	const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
		if (event.key === "ArrowDown") {
			if (items.length === 0) {
				return;
			}

			event.preventDefault();
			setOpen(true);
			setActiveIndex((current) => (current + 1) % items.length);
			return;
		}

		if (event.key === "ArrowUp") {
			if (items.length === 0) {
				return;
			}

			event.preventDefault();
			setOpen(true);
			setActiveIndex((current) => (current <= 0 ? items.length - 1 : current - 1));
			return;
		}

		if (event.key === "Escape") {
			setOpen(false);
			setActiveIndex(-1);
			return;
		}

		if (event.key === "Enter" && visible && activeIndex >= 0) {
			const active = items[activeIndex];

			if (active) {
				event.preventDefault();
				selectItem(active.value);
			}
		}
	};

	return (
		<form
			onSubmit={(event) => {
				persistRecent(form.state.values.search);
				setOpen(false);
				onSubmit(event);
			}}
			className="relative w-full sm:max-w-xs"
		>
			<Search className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
			<form.Field name="search">
				{(field) => (
					<>
						<Input
							id="room-search"
							name={field.name}
							type="search"
							role="combobox"
							aria-label={ROOM.searchLabel}
							aria-expanded={visible}
							aria-controls={visible ? listboxId : undefined}
							aria-autocomplete="list"
							aria-activedescendant={
								visible && activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined
							}
							placeholder={ROOM.searchPlaceholder}
							value={field.state.value}
							onFocus={() => {
								setOpen(true);
								setActiveIndex(-1);
							}}
							onBlur={() => {
								field.handleBlur();
								persistRecent(field.state.value);
								setOpen(false);
								setActiveIndex(-1);
							}}
							onChange={(event) => {
								field.handleChange(event.target.value);
								setOpen(true);
								setActiveIndex(-1);
							}}
							onKeyDown={handleKeyDown}
							className="pl-9"
						/>

						{visible ? (
							<div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-md">
								<div id={listboxId} role="listbox" className="max-h-64 overflow-y-auto p-1">
									{items.map((item, index) => (
										<button
											key={`${item.kind}-${item.value}`}
											type="button"
											id={`${listboxId}-${index}`}
											role="option"
											aria-selected={index === activeIndex}
											className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm ${
												index === activeIndex
													? "bg-accent text-accent-foreground"
													: "hover:bg-accent hover:text-accent-foreground"
											}`}
											onMouseDown={(event) => event.preventDefault()}
											onClick={() => selectItem(item.value)}
											onMouseEnter={() => setActiveIndex(index)}
										>
											{item.kind === "recent" ? (
												<Clock className="size-4 shrink-0 text-muted-foreground" />
											) : (
												<Search className="size-4 shrink-0 text-muted-foreground" />
											)}
											<span className="truncate">{item.value}</span>
										</button>
									))}
								</div>

								{recentSearches.length > 0 ? (
									<div className="border-t border-border/60 p-1">
										<button
											type="button"
											className="w-full rounded-sm px-2 py-1.5 text-left text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
											onMouseDown={(event) => event.preventDefault()}
											onClick={clearRecentSearches}
										>
											{ROOM.clearRecentSearches}
										</button>
									</div>
								) : null}
							</div>
						) : null}
					</>
				)}
			</form.Field>
		</form>
	);
};

export const SearchField = memo(SearchFieldComponent);
