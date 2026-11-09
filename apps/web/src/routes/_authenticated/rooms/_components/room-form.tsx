import type { Room } from "@app/api-contract";
import { Button } from "@app/components/ui/button";
import { Checkbox } from "@app/components/ui/checkbox";
import { FieldError, hasFieldError } from "@app/components/ui/field-error";
import { Input } from "@app/components/ui/input";
import { Label } from "@app/components/ui/label";
import { Textarea } from "@app/components/ui/textarea";
import { ROOM } from "@app/messages";
import { useForm } from "@tanstack/react-form";
import { roomFormSchema, type RoomFormInput } from "@/libs/room/schema.ts";

export type RoomFormValues = Omit<RoomFormInput, "description"> & {
	description: string | null;
};

const DEFAULT_VALUES: RoomFormInput = {
	title: "",
	motion: "",
	description: "",
	teamSize: 3,
	roundCount: 3,
	submissionDurationMinutes: 30,
	votingDurationMinutes: 30,
	spectatorVotingEnabled: true,
};

const fromRoom = (room: Room): RoomFormInput => ({
	title: room.title,
	motion: room.motion,
	description: room.description ?? "",
	teamSize: room.teamSize,
	roundCount: room.roundCount,
	submissionDurationMinutes: room.submissionDurationMinutes,
	votingDurationMinutes: room.votingDurationMinutes,
	spectatorVotingEnabled: room.spectatorVotingEnabled,
});

const toNumber = (value: string, fallback: number): number => {
	const parsed = Number.parseInt(value, 10);
	return Number.isNaN(parsed) ? fallback : parsed;
};

type RoomFormProps = {
	readonly initial?: Room;
	readonly submitLabel: string;
	readonly pendingLabel: string;
	readonly pending: boolean;
	readonly error?: string | null;
	readonly onSubmit: (values: RoomFormValues) => void;
};

export const RoomForm = ({
	initial,
	submitLabel,
	pendingLabel,
	pending,
	error,
	onSubmit,
}: RoomFormProps) => {
	const form = useForm({
		defaultValues: initial ? fromRoom(initial) : DEFAULT_VALUES,
		validators: {
			onChange: roomFormSchema,
			onSubmit: roomFormSchema,
		},
		onSubmit: ({ value }) => {
			onSubmit({
				...value,
				title: value.title.trim(),
				motion: value.motion.trim(),
				description: value.description.trim() ? value.description.trim() : null,
			});
		},
	});

	return (
		<form
			className="space-y-6"
			onSubmit={(event) => {
				event.preventDefault();
				void form.handleSubmit();
			}}
		>
			<form.Field name="title">
				{(field) => (
					<div className="space-y-2">
						<Label htmlFor="title">{ROOM.form.title}</Label>
						<Input
							id="title"
							name={field.name}
							placeholder="Climate accountability debate"
							aria-invalid={hasFieldError(field.state.meta.errorMap)}
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(event) => field.handleChange(event.target.value)}
						/>
						<FieldError errorMap={field.state.meta.errorMap} />
					</div>
				)}
			</form.Field>

			<form.Field name="motion">
				{(field) => (
					<div className="space-y-2">
						<Label htmlFor="motion">{ROOM.form.motion}</Label>
						<Textarea
							id="motion"
							name={field.name}
							placeholder={ROOM.form.motionPlaceholder}
							rows={3}
							aria-invalid={hasFieldError(field.state.meta.errorMap)}
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(event) => field.handleChange(event.target.value)}
						/>
						<FieldError errorMap={field.state.meta.errorMap} />
					</div>
				)}
			</form.Field>

			<form.Field name="description">
				{(field) => (
					<div className="space-y-2">
						<Label htmlFor="description">{ROOM.form.description}</Label>
						<Textarea
							id="description"
							name={field.name}
							placeholder={ROOM.form.descriptionPlaceholder}
							rows={4}
							aria-invalid={hasFieldError(field.state.meta.errorMap)}
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(event) => field.handleChange(event.target.value)}
						/>
						<FieldError errorMap={field.state.meta.errorMap} />
					</div>
				)}
			</form.Field>

			<div className="grid gap-4 sm:grid-cols-2">
				<form.Field name="teamSize">
					{(field) => (
						<div className="space-y-2">
							<Label htmlFor="teamSize">{ROOM.form.teamSize}</Label>
							<Input
								id="teamSize"
								name={field.name}
								type="number"
								min={1}
								max={5}
								aria-invalid={hasFieldError(field.state.meta.errorMap)}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(event) =>
									field.handleChange(toNumber(event.target.value, field.state.value))
								}
							/>
							<FieldError errorMap={field.state.meta.errorMap} />
						</div>
					)}
				</form.Field>

				<form.Field name="roundCount">
					{(field) => (
						<div className="space-y-2">
							<Label htmlFor="roundCount">{ROOM.form.roundCount}</Label>
							<Input
								id="roundCount"
								name={field.name}
								type="number"
								min={1}
								max={5}
								aria-invalid={hasFieldError(field.state.meta.errorMap)}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(event) =>
									field.handleChange(toNumber(event.target.value, field.state.value))
								}
							/>
							<FieldError errorMap={field.state.meta.errorMap} />
						</div>
					)}
				</form.Field>

				<form.Field name="submissionDurationMinutes">
					{(field) => (
						<div className="space-y-2">
							<Label htmlFor="submissionDurationMinutes">{ROOM.form.submissionDuration}</Label>
							<Input
								id="submissionDurationMinutes"
								name={field.name}
								type="number"
								min={5}
								max={120}
								aria-invalid={hasFieldError(field.state.meta.errorMap)}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(event) =>
									field.handleChange(toNumber(event.target.value, field.state.value))
								}
							/>
							<FieldError errorMap={field.state.meta.errorMap} />
						</div>
					)}
				</form.Field>

				<form.Field name="votingDurationMinutes">
					{(field) => (
						<div className="space-y-2">
							<Label htmlFor="votingDurationMinutes">{ROOM.form.votingDuration}</Label>
							<Input
								id="votingDurationMinutes"
								name={field.name}
								type="number"
								min={5}
								max={120}
								aria-invalid={hasFieldError(field.state.meta.errorMap)}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(event) =>
									field.handleChange(toNumber(event.target.value, field.state.value))
								}
							/>
							<FieldError errorMap={field.state.meta.errorMap} />
						</div>
					)}
				</form.Field>
			</div>

			<form.Field name="spectatorVotingEnabled">
				{(field) => (
					<div className="flex items-center gap-3">
						<Checkbox
							id="spectatorVotingEnabled"
							checked={field.state.value}
							onCheckedChange={(checked) => field.handleChange(checked === true)}
						/>
						<Label htmlFor="spectatorVotingEnabled">{ROOM.form.spectatorVoting}</Label>
					</div>
				)}
			</form.Field>

			{error ? <p className="text-sm text-destructive">{error}</p> : null}

			<Button type="submit" disabled={pending}>
				{pending ? pendingLabel : submitLabel}
			</Button>
		</form>
	);
};
