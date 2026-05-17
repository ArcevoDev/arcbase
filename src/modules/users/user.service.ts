import { UserRepository } from "./user.repository";
import { ApiError } from "@/lib/errors/api-error";
import { toPublicUserDTO, UpdateProfileInput } from "./user.dto";

export const UserService = {
  async updateProfile(userId: string, incomingData: UpdateProfileInput) {
    const user = await UserRepository.findById(userId);
    if (!user) throw ApiError.notFound("User profile configuration target not found");

    // Dynamic extraction ensures we only present values explicitly supplied by payload mutations
    const updatePayload: Parameters<typeof UserRepository.updateProfile>[1] = {};
    
    if (incomingData.displayName !== undefined) updatePayload.displayName = incomingData.displayName;
    if (incomingData.bio !== undefined) updatePayload.bio = incomingData.bio;
    if (incomingData.avatarUrl !== undefined) updatePayload.avatarUrl = incomingData.avatarUrl;
    if (incomingData.onboardingStep !== undefined) updatePayload.onboardingStep = incomingData.onboardingStep;
    if (incomingData.onboardingJson !== undefined) updatePayload.onboardingJson = incomingData.onboardingJson;

    const updatedUser = await UserRepository.updateProfile(userId, updatePayload);
    return toPublicUserDTO(updatedUser);
  },

  async getProfileByUsername(username: string) {
    const user = await UserRepository.findByUsername(username);
    if (!user) throw ApiError.notFound(`User account with handle '${username}' does not exist`);
    
    return toPublicUserDTO(user);
  }
};
