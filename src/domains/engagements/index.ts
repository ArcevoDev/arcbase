// ── Services & Repositories ────────────────────────────────────────────
export { SavedResourceService } from "./saved-resource.service";
export { SavedResourceRepository } from "./saved-resource.repository";
export { ReactionService } from "./reaction.service";
export { ReactionRepository } from "./reaction.repository";
export { FollowService } from "./follow.service";
export { FollowRepository } from "./follow.repository";

// ── Flows ──────────────────────────────────────────────────────────────
// saveResourceFlow / unsaveResourceFlow are owned by @/domains/resources,
// so they are NOT re-exported here to avoid a naming clash in the global
// domain barrel (domains/index.ts).
export { addReactionFlow } from "./flows/add-reaction.flow";
export { removeReactionFlow } from "./flows/remove-reaction.flow";
export { followUserFlow } from "./flows/follow-user.flow";
export { unfollowUserFlow } from "./flows/unfollow-user.flow";