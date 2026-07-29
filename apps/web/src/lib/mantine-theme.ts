import { createTheme } from "@mantine/core";
import type { CSSVariablesResolver, MantineColorsTuple } from "@mantine/core";

/**
 * Mantine is the component layer; the palette stays where it was.
 *
 * Every value here either points at a custom property from globals.css or is
 * derived from one, so there is still exactly one place a colour is decided.
 * Mantine's own defaults — indigo primary, 36px inputs, 4px-scale radii — are
 * deliberately not inherited.
 */

/** Ramp around `--accent` (#0b6e7f). Index 7 is the token itself. */
const accent: MantineColorsTuple = [
  "#e6f4f6",
  "#cbe6ea",
  "#a3d3da",
  "#77bec9",
  "#52aab8",
  "#3597a8",
  "#1f8194",
  "#0b6e7f",
  "#075a68",
  "#044653",
];

const danger: MantineColorsTuple = [
  "#fdf0ef",
  "#fadbd8",
  "#f4b5af",
  "#ec8b82",
  "#e0655a",
  "#d24a3e",
  "#c33327",
  "#b42318",
  "#961a11",
  "#78140d",
];

export const theme = createTheme({
  colors: { accent, danger },
  primaryColor: "accent",
  primaryShade: 7,

  fontFamily: "var(--font-sans)",
  fontFamilyMonospace: "var(--font-mono)",
  headings: { fontFamily: "var(--font-sans)", fontWeight: "600" },

  // The type scale from globals.css, not Mantine's.
  fontSizes: {
    xs: "var(--text-xs)",
    sm: "var(--text-sm)",
    md: "var(--text-base)",
    lg: "var(--text-md)",
    xl: "var(--text-lg)",
  },

  radius: {
    xs: "var(--radius-chip)",
    sm: "var(--radius-field)",
    md: "var(--radius-field)",
    lg: "var(--radius-panel)",
    xl: "var(--radius-panel)",
  },
  defaultRadius: "sm",

  focusRing: "auto",
  cursorType: "pointer",

  components: {
    // 48px, not Mantine's 42px: the brief's floor is a 44px touch target and
    // some of these are tapped one-handed by someone standing up.
    Input: {
      defaultProps: { size: "md" },
      styles: { input: { minHeight: "3rem" } },
    },
    InputWrapper: {
      defaultProps: { size: "md" },
      styles: {
        label: { fontWeight: 500, marginBottom: "0.375rem" },
        description: { marginBottom: "0.375rem" },
        error: { marginTop: "0.375rem", fontWeight: 500 },
      },
    },
    Button: {
      defaultProps: { size: "md" },
      styles: { root: { minHeight: "3rem" } },
    },
    NativeSelect: { defaultProps: { size: "md" } },
    Select: { defaultProps: { size: "md" } },
  },
});

/**
 * Mantine's semantic variables re-pointed at ours. Written into `light` only —
 * the app is light-only, see the note in globals.css.
 */
export const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {},
  light: {
    "--mantine-color-body": "var(--surface)",
    "--mantine-color-text": "var(--ink)",
    "--mantine-color-dimmed": "var(--ink-muted)",
    "--mantine-color-default": "var(--surface)",
    "--mantine-color-default-hover": "var(--surface-sub)",
    "--mantine-color-default-border": "var(--line)",
    "--mantine-color-default-color": "var(--ink)",
    "--mantine-color-placeholder": "var(--ink-muted)",
    // Mantine resolves an input's resting border to `gray-4` rather than to
    // `default-border`. Remapped here rather than pinning `--input-bd` on the
    // component: that is an inline style, and it would win over the error and
    // focus states too, so a field with a bad value would lose its red border.
    "--mantine-color-gray-4": "var(--line)",
    "--mantine-color-gray-3": "var(--line-soft)",
    "--mantine-color-error": "var(--danger)",
    "--mantine-color-anchor": "var(--accent)",
  },
  dark: {},
});
