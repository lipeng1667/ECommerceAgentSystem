import type { AllMallId } from '../types/domain';

export function parseAllMallId(value: string | undefined): AllMallId | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function formatAllMallId(value: AllMallId) {
  return String(value);
}
