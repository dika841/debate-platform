import { env } from "#/platform/config/env.ts";
import { logger } from "#/platform/observability/logger.ts";

export type EmailMessage = {
	readonly to: string;
	readonly subject: string;
	readonly text: string;
};

export const sendEmail = async (message: EmailMessage): Promise<void> => {
	if (!env.RESEND_API_KEY) {
		if (env.NODE_ENV === "production") {
			logger.warn({ to: message.to, subject: message.subject }, "email.provider_missing");
			return;
		}

		logger.info(
			{ to: message.to, subject: message.subject, text: message.text },
			"email.dev_delivery",
		);
		return;
	}

	const response = await fetch("https://api.resend.com/emails", {
		method: "POST",
		headers: {
			authorization: `Bearer ${env.RESEND_API_KEY}`,
			"content-type": "application/json",
		},
		body: JSON.stringify({
			from: env.EMAIL_FROM,
			to: message.to,
			subject: message.subject,
			text: message.text,
		}),
	});

	if (!response.ok) {
		logger.error(
			{ status: response.status, to: message.to, subject: message.subject },
			"email.delivery_failed",
		);
		throw new Error("Email delivery failed");
	}
};
