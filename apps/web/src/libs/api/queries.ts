import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/libs/orpc/index.ts";

export const useSession = () => useQuery(orpc.auth.getSession.queryOptions());

export const useHealth = () => useQuery(orpc.health.check.queryOptions());
