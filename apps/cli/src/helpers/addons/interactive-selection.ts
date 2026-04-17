import { isCancel, log, select, type Option } from "@clack/prompts";

import { isSilent } from "../../utils/context";
import { exitCancelled } from "../../utils/errors";

type AddonSelectParams<T extends string> = {
  addonName: string;
  message: string;
  options: Option<T>[];
  defaultValue: T;
};

type PromptEnvironment = {
  silent?: boolean;
  stdinIsTTY?: boolean;
  stdoutIsTTY?: boolean;
  ci?: string | undefined;
};

export function shouldPromptForAddonSelection({
  silent = isSilent(),
  stdinIsTTY = process.stdin.isTTY === true,
  stdoutIsTTY = process.stdout.isTTY === true,
  ci = process.env.CI,
}: PromptEnvironment = {}): boolean {
  return !silent && stdinIsTTY && stdoutIsTTY && ci !== "true";
}

export async function selectAddonOptionOrDefault<T extends string>({
  addonName,
  message,
  options,
  defaultValue,
}: AddonSelectParams<T>): Promise<T> {
  if (!shouldPromptForAddonSelection()) {
    const fallback = options.find((option) => option.value === defaultValue);
    if (!isSilent() && fallback) {
      log.info(`Using default ${addonName} template: ${fallback.label}`);
    }
    return defaultValue;
  }

  const selection = await select<T>({
    message,
    options,
    initialValue: defaultValue,
  });

  if (isCancel(selection)) {
    return exitCancelled("Operation cancelled");
  }

  return selection;
}
