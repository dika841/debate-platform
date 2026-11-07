import type { Room } from "@app/api-contract";
import { Button } from "@app/components/ui/button";
import { Checkbox } from "@app/components/ui/checkbox";
import { Input } from "@app/components/ui/input";
import { Label } from "@app/components/ui/label";
import { Textarea } from "@app/components/ui/textarea";
import { ROOM } from "@app/messages";
import { useEffect, useState, type FormEvent } from "react";

export type RoomFormValues = {
	title: string;
	motion: string;
	description: string | null;
	teamSize: number;
	roundCount: number;
	submissionDurationMinutes: number;
	votingDurationMinutes: number;
	spectatorVotingEnabled: boolean;
};

const DEFAULT_VALUES: RoomFormValues = {
	title: "",
	motion: "",
	description: "",
	teamSize: 3,
	roundCount: 3,
	submissionDurationMinutes: 30,
	votingDurationMinutes: 30,
	spectatorVotingEnabled: true,
};

const fromRoom = (room: Room): RoomFormValues => ({
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
	const [values, setValues] = useState<RoomFormValues>(
		initial ? fromRoom(initial) : DEFAULT_VALUES,
	);

	useEffect(() => {
		if (initial) {
			setValues(fromRoom(initial));
		}
	}, [initial]);

	const update = <K extends keyof RoomFormValues>(key: K, value: RoomFormValues[K]): void => {
		setValues((current) => ({ ...current, [key]: value }));
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
		event.preventDefault();

		onSubmit({
			...values,
			title: values.title.trim(),
			motion: values.motion.trim(),
			description: values.description?.trim() ? values.description.trim() : null,
		});
	};

	return (
		<form className="space-y-6" onSubmit={handleSubmit}>
			<div className="space-y-2">
				<Label htmlFor="title">{ROOM.form.title}</Label>
				<Input
					id="title"
					value={values.title}
					onChange={(event) => update("title", event.target.value)}
					placeholder="Climate accountability debate"
					minLength={3}
					maxLength={120}
					required
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="motion">{ROOM.form.motion}</Label>
				<Textarea
					id="motion"
					value={values.motion}
					onChange={(event) => update("motion", event.target.value)}
					placeholder={ROOM.form.motionPlaceholder}
					minLength={5}
					maxLength={300}
					rows={3}
					required
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="description">{ROOM.form.description}</Label>
				<Textarea
					id="description"
					value={values.description ?? ""}
					onChange={(event) => update("description", event.target.value)}
					placeholder={ROOM.form.descriptionPlaceholder}
					maxLength={2000}
					rows={4}
				/>
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<div className="space-y-2">
					<Label htmlFor="teamSize">{ROOM.form.teamSize}</Label>
					<Input
						id="teamSize"
						type="number"
						min={1}
						max={5}
						value={values.teamSize}
						onChange={(event) => update("teamSize", toNumber(event.target.value, 3))}
						required
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="roundCount">{ROOM.form.roundCount}</Label>
					<Input
						id="roundCount"
						type="number"
						min={1}
						max={5}
						value={values.roundCount}
						onChange={(event) => update("roundCount", toNumber(event.target.value, 3))}
						required
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="submissionDurationMinutes">{ROOM.form.submissionDuration}</Label>
					<Input
						id="submissionDurationMinutes"
						type="number"
						min={5}
						max={120}
						value={values.submissionDurationMinutes}
						onChange={(event) =>
							update("submissionDurationMinutes", toNumber(event.target.value, 30))
						}
						required
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="votingDurationMinutes">{ROOM.form.votingDuration}</Label>
					<Input
						id="votingDurationMinutes"
						type="number"
						min={5}
						max={120}
						value={values.votingDurationMinutes}
						onChange={(event) => update("votingDurationMinutes", toNumber(event.target.value, 30))}
						required
					/>
				</div>
			</div>

			<div className="flex items-center gap-3">
				<Checkbox
					id="spectatorVotingEnabled"
					checked={values.spectatorVotingEnabled}
					onCheckedChange={(checked) => update("spectatorVotingEnabled", checked === true)}
				/>
				<Label htmlFor="spectatorVotingEnabled">{ROOM.form.spectatorVoting}</Label>
			</div>

			{error ? <p className="text-sm text-destructive">{error}</p> : null}

			<Button type="submit" disabled={pending}>
				{pending ? pendingLabel : submitLabel}
			</Button>
		</form>
	);
};
