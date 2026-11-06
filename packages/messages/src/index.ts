export const APP = {
	name: "Debate Platform",
	tagline: "Challenge Ideas, Not People.",
} as const;

export const NAV = {
	explore: "Explore",
	myDebates: "My Debates",
	createDebate: "Create Debate",
	notifications: "Notifications",
	profile: "Profile",
	admin: "Admin",
} as const;

export const HEALTH = {
	title: "System health",
	api: "API",
	database: "Database",
	status: "Status",
	checkedAt: "Checked at",
	loading: "Checking system health…",
	error: "Unable to reach the API",
	retry: "Retry",
} as const;

export const UI_MESSAGE = {
	MORE: "More",
	CLOSE: "Close",
	SIDEBAR_TOGGLE: "Toggle sidebar",
	SIDEBAR_TITLE: "Navigation",
	SIDEBAR_DESCRIPTION: "Primary application navigation",
} as const;

export const AUTH = {
	signIn: "Sign in",
	signOut: "Sign out",
	signUp: "Create account",
	sessionAnonymous: "Guest",
	sessionUnavailable: "Session unavailable",
} as const;
