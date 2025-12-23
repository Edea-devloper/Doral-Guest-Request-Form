import * as strings from "GuestRequestFromDashboardWebPartStrings";

// The direction for the interface (ltr - left-to-right, rtl - right-to-left). It defines whether to use English or Hebrew localization.
let direction: "ltr" | "rtl" = "ltr";
// All the resources are provided in English and Hebrew. The Hebrew ones have got the same title with the _He suffix at the end.
const hebrewSuffix = "_He";

// Initialize the language to use: English for lrt, and Hebrew for rtl.
export function initializeLocalization(dir: "ltr" | "rtl"): void {
    direction = dir;
}

export function getDirection(): "ltr" | "rtl" {
  return direction;
}

// Get the localized resource depending on the initialized language.
export function getLocalizedString(resourceId: string): string {
    const allStrings = strings as any;

    if (direction === "ltr") {
      return allStrings[resourceId];
    } else {
      return allStrings[resourceId + hebrewSuffix];
    }
}