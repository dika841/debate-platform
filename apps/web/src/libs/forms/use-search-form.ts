import { useForm } from "@tanstack/react-form";
import type { SubmitEvent } from "react";
import { SEARCH_DEBOUNCE_MS } from "./search-debounce.ts";

type SearchControl = {
	readonly value: string;
	readonly onChange: (value: string) => void;
};

export const useSearchForm = ({ value, onChange }: SearchControl) => {
	const form = useForm({
		defaultValues: { search: value },
		listeners: {
			onChangeDebounceMs: SEARCH_DEBOUNCE_MS,
			onChange: ({ formApi }) => onChange(formApi.state.values.search),
		},
		onSubmit: ({ value: values }) => onChange(values.search),
	});

	const onSubmit = (event: SubmitEvent<HTMLFormElement>): void => {
		event.preventDefault();
		void form.handleSubmit();
	};

	return { form, onSubmit };
};
