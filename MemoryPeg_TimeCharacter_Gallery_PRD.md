# Product Requirements Document (PRD)

# Memory Peg System -- Time Character Media Gallery

## Objective

Extend the Memory Peg System so each **time_character** automatically
displays all media captured during its corresponding 15-minute interval.

The Raspberry Pi 5 is the canonical host for the DataLake.

------------------------------------------------------------------------

# Canonical DataLake Location

**Primary DataLake**

``` text
/home/olivero54/DATALAKE
```

This directory is the single source of truth for all captured artifacts.

All backend services, gallery APIs, indexers, and future AI processing
should reference this location by default.

------------------------------------------------------------------------

# Directory Layout

``` text
/home/olivero54/DATALAKE
├── images/
├── videos/
├── text/
├── metadata/
└── (future folders as needed)
```

------------------------------------------------------------------------

# Timestamp Resolution

Preferred filename format:

``` text
YYMMDD-HHMMSS_<number>.ext
```

If a filename cannot be parsed:

1.  Use filesystem creation time.
2.  Fall back to modification time.

------------------------------------------------------------------------

# Supported Media

## Phase 1

-   png
-   jpg
-   jpeg
-   webp
-   gif

## Phase 2

-   mp4
-   mov
-   mkv
-   webm

## Phase 3

-   txt
-   md
-   pdf
-   json

------------------------------------------------------------------------

# Indexing

Maintain a metadata index instead of rescanning the filesystem on every
request.

Each indexed record contains:

-   absolutePath
-   relativePath
-   timestamp
-   mediaType
-   extension
-   filesize
-   optional hash

Use a filesystem watcher (e.g. chokidar) to detect changes under:

``` text
/home/olivero54/DATALAKE
```

------------------------------------------------------------------------

# Time Character Matching

Reuse the existing Memory Peg scheduler.

    time_character
          ↓
    intervalStart
    intervalEnd
          ↓
    asset timestamp

Include assets where:

``` text
intervalStart <= timestamp < intervalEnd
```

------------------------------------------------------------------------

# Backend API

``` http
GET /api/gallery/:date/:timeCharacter
```

Returns all assets for the requested interval sorted chronologically.

------------------------------------------------------------------------

# Desktop UX

-   Responsive gallery grid
-   Lazy loading
-   Click thumbnail → fullscreen lightbox
-   Keyboard navigation

------------------------------------------------------------------------

# Mobile UX

-   Display first image
-   Tap to open fullscreen viewer
-   Swipe through remaining assets
-   Future: pinch-to-zoom

------------------------------------------------------------------------

# Future Architecture

The current implementation targets the local Raspberry Pi DataLake.

Future versions may support additional providers (Synology, Google
Drive, S3, Dropbox, etc.) behind a common provider abstraction, but
**the current implementation should assume the canonical DataLake is
located at**:

``` text
/home/olivero54/DATALAKE
```

This simplifies implementation and avoids unnecessary storage
abstraction until additional providers are required.

------------------------------------------------------------------------

# Acceptance Criteria

-   Reads media from `/home/olivero54/DATALAKE`
-   Correct timestamp parsing and fallback
-   Correct 15-minute interval matching
-   Desktop gallery/lightbox
-   Mobile swipe viewer
-   Chronological ordering
-   Extensible architecture for future storage providers
