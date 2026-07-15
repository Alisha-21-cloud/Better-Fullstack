import type { CompatibilityAnalysisResult, CompatibilityCategory } from "@better-fullstack/types";

import {
  analyzeStackCompatibility as analyzeStackCompatibilityShared,
  getCategoryDisplayName,
  getDisabledReason as getDisabledReasonShared,
  hasPWACompatibleFrontend,
  hasTauriCompatibleFrontend,
  isOptionCompatible as isOptionCompatibleShared,
  validateProjectName,
} from "@better-fullstack/types";

import type { StackState, TECH_OPTIONS } from "@/lib/constant";

export {
  getCategoryDisplayName,
  hasPWACompatibleFrontend,
  hasTauriCompatibleFrontend,
  validateProjectName,
};

export type CompatibilityResult = CompatibilityAnalysisResult;

export const analyzeStackCompatibility = (stack: StackState): CompatibilityResult => {
  return analyzeStackCompatibilityShared(stack);
};

// appShells is a UI-only split of the appPlatforms category (both write into
// config.addons); the compatibility engine only knows "appPlatforms".
const toCompatibilityCategory = (category: keyof typeof TECH_OPTIONS): CompatibilityCategory =>
  (category === "appShells" ? "appPlatforms" : category) as CompatibilityCategory;

export const getDisabledReason = (
  currentStack: StackState,
  category: keyof typeof TECH_OPTIONS,
  optionId: string,
): string | null => {
  return getDisabledReasonShared(currentStack, toCompatibilityCategory(category), optionId);
};

export const isOptionCompatible = (
  currentStack: StackState,
  category: keyof typeof TECH_OPTIONS,
  optionId: string,
): boolean => {
  return isOptionCompatibleShared(currentStack, toCompatibilityCategory(category), optionId);
};

export const getVisibleOptions = (
  currentStack: StackState,
  category: keyof typeof TECH_OPTIONS,
  options: (typeof TECH_OPTIONS)[keyof typeof TECH_OPTIONS],
) => {
  if (category !== "auth") return options;

  switch (currentStack.ecosystem) {
    case "go":
      return options.filter((option) => option.id === "go-better-auth" || option.id === "none");
    case "typescript":
      return options.filter((option) => option.id !== "go-better-auth");
    default:
      return options.filter((option) => option.id === "none");
  }
};
