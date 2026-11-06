import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/libs/orpc/index.ts";

export const useSession = () => useQuery(orpc.auth.getSession.queryOptions());

export const useHealth = () => useQuery(orpc.health.check.queryOptions());

export const useProfile = () => useQuery(orpc.users.getProfile.queryOptions());

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
