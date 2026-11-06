import { z } from "zod";

export const HEALTH_STATUS = {
	OK: "ok",
	DEGRADED: "degraded",
} as const;

export const healthCheckOutputSchema = z.object({
	status: z.enum([HEALTH_STATUS.OK, HEALTH_STATUS.DEGRADED]),
	service: z.string(),
	version: z.string(),
	time: z.string().datetime(),
	database: z.enum(["up", "down"]),
});

export type HealthCheckOutput = z.infer<typeof healthCheckOutputSchema>;
