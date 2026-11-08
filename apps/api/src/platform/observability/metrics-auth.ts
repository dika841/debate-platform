export const isMetricsAuthorized = (input: {
	readonly authorization: string | undefined;
	readonly token: string | undefined;
	readonly production: boolean;
}): boolean => {
	if (!input.token) {
		return !input.production;
	}

	const expected = `Bearer ${input.token}`;
	const provided = input.authorization ?? "";

	if (provided.length !== expected.length) {
		return false;
	}

	let difference = 0;

	for (let index = 0; index < expected.length; index += 1) {
		difference |= expected.charCodeAt(index) ^ provided.charCodeAt(index);
	}

	return difference === 0;
};
