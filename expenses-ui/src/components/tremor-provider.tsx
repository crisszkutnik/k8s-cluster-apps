import React from "react";

/**
 * TremorProvider wrapper component
 *
 * Tremor components work best when wrapped in this provider to ensure
 * proper context and styling. This is currently a simple wrapper but
 * can be extended with additional configuration as needed.
 */
export const TremorProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};
