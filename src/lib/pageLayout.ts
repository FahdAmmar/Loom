export type PageFont = "sans" | "serif" | "mono";
export type PageTextSize = "small" | "default" | "large";

export interface PageView {
  font: PageFont;
  textSize: PageTextSize;
  fullWidth: boolean;
}

export const DEFAULT_PAGE_VIEW: PageView = {
  font: "sans",
  textSize: "default",
  fullWidth: false,
};

// Full class names, so Tailwind can see them at build time.
const FONT_CLASSES: Record<PageFont, string> = {
  sans: "",
  serif: "font-serif",
  mono: "font-mono",
};
const TEXT_SIZE_CLASSES: Record<PageTextSize, string> = {
  small: "text-sm",
  default: "",
  large: "text-lg",
};
const FULL_WIDTH_CLASS = "max-w-none";

export interface PageLayoutClasses {
  widthClass: string;
  fontClass: string;
  sizeClass: string;
}

/** `globalWidthClass` is the app-wide column width; a page's own choice only overrides it for "full width". */
export function getPageLayoutClasses(
  view: Partial<PageView> | undefined,
  globalWidthClass: string,
): PageLayoutClasses {
  const merged = { ...DEFAULT_PAGE_VIEW, ...view };
  return {
    widthClass: merged.fullWidth ? FULL_WIDTH_CLASS : globalWidthClass,
    fontClass: FONT_CLASSES[merged.font],
    sizeClass: TEXT_SIZE_CLASSES[merged.textSize],
  };
}

export function isDefaultPageView(view: Partial<PageView> | undefined): boolean {
  const merged = { ...DEFAULT_PAGE_VIEW, ...view };
  return (
    merged.font === DEFAULT_PAGE_VIEW.font &&
    merged.textSize === DEFAULT_PAGE_VIEW.textSize &&
    merged.fullWidth === DEFAULT_PAGE_VIEW.fullWidth
  );
}
