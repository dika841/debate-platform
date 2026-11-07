import type { CreateRoomInput, ListRoomsInput, UpdateRoomInput } from "@app/api-contract";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/libs/orpc/index.ts";

export const useSession = () => useQuery(orpc.auth.getSession.queryOptions());

export const useHealth = () => useQuery(orpc.health.check.queryOptions());

export const useProfile = () => useQuery(orpc.users.getProfile.queryOptions());

export const useRooms = (input: ListRoomsInput = { scope: "public" }) =>
	useQuery(orpc.rooms.list.queryOptions({ input }));

export const useMyRooms = () => useRooms({ scope: "mine" });

export const useJoinedRooms = () => useRooms({ scope: "joined" });

export const useMembers = (roomId: string) =>
	useQuery({
		...orpc.memberships.list.queryOptions({ input: { roomId } }),
		enabled: roomId.length > 0,
	});

export const useRoom = (id: string) =>
	useQuery({
		...orpc.rooms.get.queryOptions({ input: { id } }),
		enabled: id.length > 0,
	});

export const useRounds = (roomId: string) =>
	useQuery({
		...orpc.rounds.list.queryOptions({ input: { roomId } }),
		enabled: roomId.length > 0,
	});

export const useSubmissions = (roundId: string) =>
	useQuery({
		...orpc.submissions.list.queryOptions({ input: { roundId } }),
		enabled: roundId.length > 0,
	});

export const useVoteSummary = (roundId: string) =>
	useQuery({
		...orpc.votes.summary.queryOptions({ input: { roundId } }),
		enabled: roundId.length > 0,
	});

const useInvalidateRooms = () => {
	const queryClient = useQueryClient();

	return async (): Promise<void> => {
		await queryClient.invalidateQueries({ queryKey: orpc.rooms.key() });
	};
};

export const useCreateRoom = () => {
	const invalidateRooms = useInvalidateRooms();

	return useMutation({
		...orpc.rooms.create.mutationOptions(),
		onSuccess: async () => {
			await invalidateRooms();
		},
	});
};

export const useUpdateRoom = () => {
	const invalidateRooms = useInvalidateRooms();

	return useMutation({
		...orpc.rooms.update.mutationOptions(),
		onSuccess: async () => {
			await invalidateRooms();
		},
	});
};

export const usePublishRoom = () => {
	const invalidateRooms = useInvalidateRooms();

	return useMutation({
		...orpc.rooms.publish.mutationOptions(),
		onSuccess: async () => {
			await invalidateRooms();
		},
	});
};

export const useCancelRoom = () => {
	const invalidateRooms = useInvalidateRooms();

	return useMutation({
		...orpc.rooms.cancel.mutationOptions(),
		onSuccess: async () => {
			await invalidateRooms();
		},
	});
};

const useInvalidateMemberships = () => {
	const queryClient = useQueryClient();

	return async (): Promise<void> => {
		await Promise.all([
			queryClient.invalidateQueries({ queryKey: orpc.memberships.key() }),
			queryClient.invalidateQueries({ queryKey: orpc.rooms.key() }),
		]);
	};
};

export const useJoinRoom = () => {
	const invalidateMemberships = useInvalidateMemberships();

	return useMutation({
		...orpc.memberships.join.mutationOptions(),
		onSuccess: async () => {
			await invalidateMemberships();
		},
	});
};

export const useLeaveRoom = () => {
	const invalidateMemberships = useInvalidateMemberships();

	return useMutation({
		...orpc.memberships.leave.mutationOptions(),
		onSuccess: async () => {
			await invalidateMemberships();
		},
	});
};

export const useAutoAssignTeams = () => {
	const invalidateMemberships = useInvalidateMemberships();

	return useMutation({
		...orpc.assignments.autoAssign.mutationOptions(),
		onSuccess: async () => {
			await invalidateMemberships();
		},
	});
};

export const useSetTeam = () => {
	const invalidateMemberships = useInvalidateMemberships();

	return useMutation({
		...orpc.assignments.setTeam.mutationOptions(),
		onSuccess: async () => {
			await invalidateMemberships();
		},
	});
};

export const useFinalizeAssignments = () => {
	const invalidateMemberships = useInvalidateMemberships();

	return useMutation({
		...orpc.assignments.finalize.mutationOptions(),
		onSuccess: async () => {
			await invalidateMemberships();
		},
	});
};

const useInvalidateExecution = () => {
	const queryClient = useQueryClient();

	return async (): Promise<void> => {
		await Promise.all([
			queryClient.invalidateQueries({ queryKey: orpc.rounds.key() }),
			queryClient.invalidateQueries({ queryKey: orpc.submissions.key() }),
			queryClient.invalidateQueries({ queryKey: orpc.rooms.key() }),
		]);
	};
};

export const useStartDebate = () => {
	const invalidateExecution = useInvalidateExecution();

	return useMutation({
		...orpc.rounds.start.mutationOptions(),
		onSuccess: async () => {
			await invalidateExecution();
		},
	});
};

export const useAdvanceRound = () => {
	const invalidateExecution = useInvalidateExecution();

	return useMutation({
		...orpc.rounds.advance.mutationOptions(),
		onSuccess: async () => {
			await invalidateExecution();
		},
	});
};

export const useCreateSubmission = () => {
	const queryClient = useQueryClient();

	return useMutation({
		...orpc.submissions.create.mutationOptions(),
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: orpc.submissions.key() }),
				queryClient.invalidateQueries({ queryKey: orpc.rounds.key() }),
			]);
		},
	});
};

export const useCastVote = () => {
	const queryClient = useQueryClient();

	return useMutation({
		...orpc.votes.cast.mutationOptions(),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: orpc.votes.key() });
		},
	});
};

export const useInvalidateAccount = () => {
	const queryClient = useQueryClient();

	return async (): Promise<void> => {
		await Promise.all([
			queryClient.invalidateQueries({ queryKey: orpc.auth.key() }),
			queryClient.invalidateQueries({ queryKey: orpc.users.key() }),
		]);
	};
};

export const useUpdateProfile = () => {
	const queryClient = useQueryClient();

	return useMutation({
		...orpc.users.updateProfile.mutationOptions(),
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: orpc.users.key() }),
				queryClient.invalidateQueries({ queryKey: orpc.auth.key() }),
			]);
		},
	});
};

export type { CreateRoomInput, UpdateRoomInput };
