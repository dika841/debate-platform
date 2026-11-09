export const ERROR = {
	unexpectedTitle: "Something went wrong",
	unexpectedBody: "This page could not be loaded.",
	unexpectedNext: "Nothing was saved or lost. Try again.",
	forbiddenTitle: "You don't have access to this page",
	forbiddenBody: "Your account does not have the permission this page needs.",
	forbiddenNext: "If you think you should, ask an administrator to grant it.",
	serverUnreachableTitle: "Can't reach the server",
	serverUnreachableBody:
		"You have not been signed out. This is a connection problem, so nothing has been lost.",
	serverUnreachableNext: "Your session is still valid. Try again once the connection is back.",
	notFoundTitle: "Page not found",
	notFoundBody: "The page you are looking for does not exist or has been moved.",
	retry: "Try again",
	retrying: "Retrying…",
	goHome: "Back to home",
} as const;
