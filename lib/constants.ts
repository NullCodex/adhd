/**
 * Application-wide constants
 */

export const SECTIONS = [
  'what-is-adhd',
  'statistics',
  'assessments',
  'about-assessments',
  'other-assessments',
  'understanding-adhd',
  'medications',
] as const;

export type SectionId = typeof SECTIONS[number];

// Scroll configuration
export const SCROLL_CONFIG = {
  OFFSET: 100, // Offset for sticky navigation
  SCROLL_DETECTION_OFFSET: 150, // Offset for scroll position detection
  SCROLL_COMPLETE_DELAY: 800, // Delay for smooth scroll completion
  VERIFICATION_DELAY: 100, // Delay for scroll verification
  ACTIVE_CHECK_INTERVAL: 50, // Interval for active section check during scroll
  BOUNDARY_TOLERANCE: 50, // Tolerance for section boundary detection
} as const;

// Navigation configuration
export const NAV_CONFIG = {
  STICKY_OFFSET: 100,
  SCROLL_MARGIN_TOP: 24, // scroll-mt-24 equivalent
} as const;

// External link configuration
export const EXTERNAL_LINK_ATTRS = {
  target: '_blank',
  rel: 'noopener noreferrer',
} as const;

