import type { CreateRoomInput, ListRoomsInput, UpdateRoomInput } from "@app/api-contract";
import {
	keepPreviousData,
	useInfiniteQuery,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { sessionRefresh } from "@/libs/auth/session.ts";
import { orpc } from "@/libs/orpc/index.ts";

type RefetchInterval =
	| number
	| false
	| ((query: { readonly state: { readonly data?: unknown } }) => number | false | undefined);

type LiveQueryOptions = {
	/** Poll while the query is active. Pass `false` to disable polling. */
	readonly refetchInterval?: RefetchInterval;
	/** Set to `false` to skip the request entirely. */
	readonly enabled?: boolean;
};

const polling = ({ refetchInterval }: LiveQueryOptions = {}) => ({
	refetchInterval: refetchInterval ?? false,
	refetchIntervalInBackground: false,
});

export const useHealth = () => useQuery(orpc.health.check.queryOptions());

export const useProfile = () => useQuery(orpc.users.getProfile.queryOptions());

type RoomsFeedInput = Omit<ListRoomsInput, "cursor">;

/**
 * Cursor-paginated room list. Only the first page is loaded up front, so the
 * landing and dashboard pages stay fast even when there are many debates.
 */
export const useInfiniteRooms = (input: RoomsFeedInput = { scope: "public" }) =>
	useInfiniteQuery({
		...orpc.rooms.list.infiniteOptions({
			input: (cursor: string | undefined) => ({ ...input, cursor }),
			initialPageParam: undefined,
			getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
		}),
		placeholderData: keepPreviousData,
	});

export const useInfiniteMyRooms = (search?: string) =>
	useInfiniteRooms({ scope: "mine", search: search?.trim() ? search.trim() : undefined });

export const useInfiniteJoinedRooms = (search?: string) =>
	useInfiniteRooms({ scope: "joined", search: search?.trim() ? search.trim() : undefined });

export const useMembers = (roomId: string, options?: LiveQueryOptions) =>
	useQuery({
		...orpc.memberships.list.queryOptions({ input: { roomId } }),
		enabled: roomId.length > 0 && (options?.enabled ?? true),
		...polling(options),
	});

export const useRoom = (id: string, options?: LiveQueryOptions) =>
	useQuery({
		...orpc.rooms.get.queryOptions({ input: { id } }),
		enabled: id.length > 0 && (options?.enabled ?? true),
		...polling(options),
	});

export const useRounds = (roomId: string, options?: LiveQueryOptions) =>
	useQuery({
		...orpc.rounds.list.queryOptions({ input: { roomId } }),
		enabled: roomId.length > 0 && (options?.enabled ?? true),
		...polling(options),
	});

export const useSubmissions = (roundId: string, options?: LiveQueryOptions) =>
	useQuery({
		...orpc.submissions.list.queryOptions({ input: { roundId } }),
		enabled: roundId.length > 0 && (options?.enabled ?? true),
		...polling(options),
	});

export const useVoteSummary = (roundId: string, options?: LiveQueryOptions) =>
	useQuery({
		...orpc.votes.summary.queryOptions({ input: { roundId } }),
		enabled: roundId.length > 0 && (options?.enabled ?? true),
		...polling(options),
	});

export const useRoomResults = (roomId: string, options?: LiveQueryOptions) =>
	useQuery({
		...orpc.results.getRoom.queryOptions({ input: { roomId } }),
		enabled: roomId.length > 0 && (options?.enabled ?? true),
		...polling(options),
	});

export const useReports = (status?: "PENDING" | "ACTIONED" | "DISMISSED", enabled = true) =>
	useQuery({
		...orpc.reports.list.queryOptions({
			input: status ? { status } : {},
		}),
		enabled,
		placeholderData: keepPreviousData,
	});

export const useAuditEvents = (enabled = true) =>
	useQuery({
		...orpc.audit.list.queryOptions({ input: { limit: 50 } }),
		enabled,
	});

export const useInfiniteNotifications = () =>
	useInfiniteQuery({
		...orpc.notifications.list.infiniteOptions({
			input: (cursor: string | undefined) => ({ cursor }),
			initialPageParam: undefined,
			getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
		}),
		placeholderData: keepPreviousData,
	});

export const useNotificationUnreadCount = (enabled = true) =>
	useQuery({
		...orpc.notifications.list.queryOptions({ input: { limit: 1 } }),
		enabled,
		refetchInterval: enabled ? 60_000 : false,
		refetchIntervalInBackground: false,
		select: (data) => data.unreadCount,
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
			queryClient.invalidateQueries({ queryKey: orpc.results.key() }),
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

const useInvalidateResults = () => {
	const queryClient = useQueryClient();

	return async (): Promise<void> => {
		await Promise.all([
			queryClient.invalidateQueries({ queryKey: orpc.results.key() }),
			queryClient.invalidateQueries({ queryKey: orpc.rounds.key() }),
			queryClient.invalidateQueries({ queryKey: orpc.rooms.key() }),
		]);
	};
};

export const useFinalizeRound = () => {
	const invalidateResults = useInvalidateResults();

	return useMutation({
		...orpc.results.finalizeRound.mutationOptions(),
		onSuccess: async () => {
			await invalidateResults();
		},
	});
};

export const useFinalizeRoom = () => {
	const invalidateResults = useInvalidateResults();

	return useMutation({
		...orpc.results.finalizeRoom.mutationOptions(),
		onSuccess: async () => {
			await invalidateResults();
		},
	});
};

export const useCreateReport = () => {
	const queryClient = useQueryClient();

	return useMutation({
		...orpc.reports.create.mutationOptions(),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: orpc.reports.key() });
		},
	});
};

export const useResolveReport = () => {
	const queryClient = useQueryClient();

	return useMutation({
		...orpc.reports.resolve.mutationOptions(),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: orpc.reports.key() });
		},
	});
};

const useInvalidateNotifications = () => {
	const queryClient = useQueryClient();

	return async (): Promise<void> => {
		await queryClient.invalidateQueries({ queryKey: orpc.notifications.key() });
	};
};

export const useMarkNotificationRead = () => {
	const invalidateNotifications = useInvalidateNotifications();

	return useMutation({
		...orpc.notifications.markRead.mutationOptions(),
		onSuccess: async () => {
			await invalidateNotifications();
		},
	});
};

export const useMarkAllNotificationsRead = () => {
	const invalidateNotifications = useInvalidateNotifications();

	return useMutation({
		...orpc.notifications.markAllRead.mutationOptions(),
		onSuccess: async () => {
			await invalidateNotifications();
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
		await sessionRefresh();
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
			await sessionRefresh();
		},
	});
};

export type { CreateRoomInput, UpdateRoomInput };
