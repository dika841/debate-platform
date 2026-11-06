declare const brand: unique symbol;

export type Brand<T, B extends string> = T & { readonly [brand]: B };

export type UserId = Brand<string, "UserId">;
export type RoomId = Brand<string, "RoomId">;
export type TeamId = Brand<string, "TeamId">;
export type RoundId = Brand<string, "RoundId">;
export type MembershipId = Brand<string, "MembershipId">;
export type SubmissionId = Brand<string, "SubmissionId">;
export type VoteId = Brand<string, "VoteId">;

export const userId = (value: string): UserId => value as UserId;
export const roomId = (value: string): RoomId => value as RoomId;
export const teamId = (value: string): TeamId => value as TeamId;
export const roundId = (value: string): RoundId => value as RoundId;
export const membershipId = (value: string): MembershipId => value as MembershipId;
export const submissionId = (value: string): SubmissionId => value as SubmissionId;
export const voteId = (value: string): VoteId => value as VoteId;
