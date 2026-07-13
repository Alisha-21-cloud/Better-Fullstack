import { describe, expect, it } from "bun:test";

import { dependencyVersionMap } from "../src/utils/add-deps";
import {
  DEPENDENCY_UPDATE_POLICIES,
  getPinnedDependencyVersion,
} from "../src/utils/dependency-update-policy";
import {
  getUpdateType,
  selectAutomatedUpdates,
  type VersionInfo,
} from "../src/utils/dependency-checker";

const candidate = (name: string, updateType: VersionInfo["updateType"]): VersionInfo => ({
  name,
  current: "^1.0.0",
  latest: "^2.0.0",
  updateType,
});

describe("dependency update policy", () => {
  it("keeps every policy pin synchronized with the canonical version map", () => {
    for (const [name, policy] of Object.entries(DEPENDENCY_UPDATE_POLICIES)) {
      expect(dependencyVersionMap[name as keyof typeof dependencyVersionMap]).toBe(
        policy.pinnedVersion,
      );
      expect(getPinnedDependencyVersion(name)).toBe(policy.pinnedVersion);
    }
  });

  it("never automates downgrades", () => {
    const downgrade = candidate("example", "downgrade");

    expect(selectAutomatedUpdates([downgrade], "patch-minor")).toEqual([]);
    expect(selectAutomatedUpdates([downgrade], "all")).toEqual([]);
  });

  it("applies patch and minor updates in both modes", () => {
    const patch = candidate("patch-package", "patch");
    const minor = candidate("minor-package", "minor");

    expect(selectAutomatedUpdates([patch, minor], "patch-minor")).toEqual([patch, minor]);
    expect(selectAutomatedUpdates([patch, minor], "all")).toEqual([patch, minor]);
  });

  it("blocks majors unless the package is explicitly allowlisted", () => {
    const major = candidate("typescript", "major");

    expect(selectAutomatedUpdates([major], "patch-minor")).toEqual([]);
    expect(selectAutomatedUpdates([major], "all")).toEqual([]);
  });

  it("treats incompatible pre-1.0 range changes as breaking-equivalent", () => {
    expect(getUpdateType("^0.3.1", "^0.4.0")).toBe("major");
    expect(getUpdateType("^0.0.3", "^0.0.4")).toBe("major");
    expect(getUpdateType("^0.3.1", "^0.3.2")).toBe("patch");
  });
});
