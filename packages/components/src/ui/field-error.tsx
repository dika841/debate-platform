import { type FC, Fragment, type ReactElement } from "react";
import { match, P } from "ts-pattern";

type TErrorMap = Partial<Record<string, unknown>>;

type TFieldErrorProps = {
	errors?: ReadonlyArray<unknown>;
	errorMap?: TErrorMap;
};

const firstIssue = (value: unknown): unknown =>
	match(value)
		.with(P.array(), (issues) => issues[0])
		.otherwise(() => undefined);

const resolve = (props: TFieldErrorProps): unknown =>
	match(props.errorMap)
		.with(P.nullish, () => firstIssue(props.errors))
		.otherwise((errorMap) =>
			match(firstIssue(errorMap.onBlur))
				.with(P.nullish, () => firstIssue(errorMap.onSubmit))
				.otherwise((issue) => issue),
		);

export const hasFieldError = (errorMap: TErrorMap): boolean =>
	firstIssue(errorMap.onBlur) !== undefined ||
	firstIssue(errorMap.onSubmit) !== undefined;

export const FieldError: FC<TFieldErrorProps> = (props): ReactElement =>
	match(resolve(props))
		.with({ message: P.string }, (issue) => (
			<p role="alert" className="text-xs text-destructive">
				{issue.message}
			</p>
		))
		.otherwise(() => <Fragment />);
