export const LOG_LEVEL = {
	DEBUG: "debug",
	INFO: "info",
	WARN: "warn",
	ERROR: "error",
} as const;

export type LogLevel = (typeof LOG_LEVEL)[keyof typeof LOG_LEVEL];

const LEVEL_WEIGHT: Record<LogLevel, number> = {
	[LOG_LEVEL.DEBUG]: 10,
	[LOG_LEVEL.INFO]: 20,
	[LOG_LEVEL.WARN]: 30,
	[LOG_LEVEL.ERROR]: 40,
};

export type LogContext = Record<string, unknown>;

export type Logger = {
	debug(context: LogContext, message: string): void;
	info(context: LogContext, message: string): void;
	warn(context: LogContext, message: string): void;
	error(context: LogContext, message: string): void;
	child(context: LogContext): Logger;
};

export type LoggerOptions = {
	level?: LogLevel;
	base?: LogContext;
	sink?: (line: string) => void;
};

const defaultSink = (line: string): void => {
	console.log(line);
};

export const createLogger = (options: LoggerOptions = {}): Logger => {
	const level = options.level ?? LOG_LEVEL.INFO;
	const base = options.base ?? {};
	const sink = options.sink ?? defaultSink;

	const emit = (entryLevel: LogLevel, context: LogContext, message: string): void => {
		if (LEVEL_WEIGHT[entryLevel] < LEVEL_WEIGHT[level]) {
			return;
		}

		sink(
			JSON.stringify({
				level: entryLevel,
				time: new Date().toISOString(),
				message,
				...base,
				...context,
			}),
		);
	};

	return {
		debug: (context, message) => emit(LOG_LEVEL.DEBUG, context, message),
		info: (context, message) => emit(LOG_LEVEL.INFO, context, message),
		warn: (context, message) => emit(LOG_LEVEL.WARN, context, message),
		error: (context, message) => emit(LOG_LEVEL.ERROR, context, message),
		child: (context) =>
			createLogger({
				level,
				base: { ...base, ...context },
				sink,
			}),
	};
};
