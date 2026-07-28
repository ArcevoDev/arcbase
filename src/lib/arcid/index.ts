// Arc-ID integration barrel — import from here, not from individual files
export { arcid, ArcIDError } from "./client";
export type { ArcIDIdentity, LoginResult, RegisterResult, TokenBundle } from "./client";
export { verifyArcIDToken, extractIdentityId } from "./jwt";
export { getAuthContext, withAuth, withUser, withScope } from "./middleware";
export type { AuthContext } from "./middleware";
