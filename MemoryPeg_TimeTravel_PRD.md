# Product Requirements Document (PRD)

# Memory Peg System -- Time Travel Banner Navigation

## Objective

Add a horizontal swipe-based **Time Travel** feature to the Memory Peg
banner. Users may navigate backward through 15-minute Memory Peg
quadrants and return forward only up to the current live quadrant. As
the selected quadrant changes, all temporal metadata and the Memory
Gallery update dynamically.

## Functional Requirements

-   Banner supports left/right swipe navigation.
-   One logical stop = one 15-minute quadrant.
-   Apple-like inertial scrolling with momentum and snap-to-quadrant.
-   Users cannot navigate into the future beyond the current time.
-   Overscrolling into the future should produce a subtle elastic
    bounce.

## Dynamic Updates

Every selected quadrant recomputes: - Time Character - Clock Time -
Calendar Date - Day Theme - Week Number - Week Creature - Memory Gallery

No values should be cached based on the current day; all are derived
from the selected timestamp.

## Memory Gallery

When scrolling settles: 1. Determine the selected quadrant. 2. Compute
interval start/end. 3. Load media for that interval. 4. Replace gallery
without reloading the page.

API: GET /api/gallery/:date/:timeCharacter

## Live Mode

Default state follows the current time. Entering time travel pauses live
updates. Provide a 'Return to Present' button that restores the current
quadrant and resumes automatic updates.

## Performance

-   Update gallery only after scroll snapping.
-   Debounce updates (\~150 ms).
-   Prefetch previous and next quadrants.
-   Cache recently viewed quadrants.

## Edge Cases

-   Empty intervals display 'No memories captured during this time.'
-   Crossing midnight updates date and day theme.
-   Crossing week boundaries updates week creature and week number.

## Recommended Implementation

-   CSS Scroll Snap
-   Framer Motion (or Motion One) for inertia/animation
-   Smooth transitions between banner metadata
-   60 FPS target

## Acceptance Criteria

-   Apple-like inertial scrolling
-   Exact snapping to 15-minute quadrants
-   No navigation beyond the present
-   Dynamic updates for Time Character, Day Theme, Week Creature, Date,
    and Gallery
-   'Return to Present' exits time-travel mode
