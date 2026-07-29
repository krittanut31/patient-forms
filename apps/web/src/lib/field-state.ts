import type { FieldState } from "@patient-forms/shared";

export type FieldStateKind = "empty" | "valid" | "invalid";

/**
 * The three states the detail view distinguishes.
 *
 * A field the patient typed into and then cleared reads as empty, same as one
 * never touched — from a nurse's side of the desk there is nothing to read
 * either way. `isValid` only decides anything once there is something there.
 */
export function fieldStateKind(state: FieldState | undefined): FieldStateKind {
  if (!state || state.value.trim() === "") return "empty";
  return state.isValid ? "valid" : "invalid";
}
