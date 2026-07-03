# Product Requirements Document (PRD)

# Memory Peg System -- Time Character Media Gallery

## Objective

Extend the Memory Peg System so each **time_character** automatically
displays all media captured during its corresponding 15-minute interval.

Initially support:

-   Images
-   Videos (Phase 2)
-   Text documents (Phase 3)

The gallery should work regardless of where the DataLake is stored.

------------------------------------------------------------------------

# DataLake Storage

The system **must not assume a single local folder**.

Instead, DataLake locations are configurable.

Supported sources:

-   Local filesystem
-   Synology Drive
-   Google Drive

Configuration example:

``` json
{
  "dataLakeSources": [
    {
      "id": "local",
      "type": "filesystem",
      "path": "/mnt/datalake"
    },
    {
      "id": "synology",
      "type": "filesystem",
      "path": "/Volumes/SynologyDrive/DataLake"
    },
    {
      "id": "google",
      "type": "filesystem",
      "path": "/Users/Oliver/Library/CloudStorage/GoogleDrive/DataLake"
    }
  ]
}
```

Future connector support may include native Synology and Google Drive
APIs.

------------------------------------------------------------------------

# Timestamp Resolution

Preferred filename format:

    YYMMDD-HHMMSS_<number>.ext

Examples:

    260703-110521_1.png
    260703-111116_11.png

If parsing fails:

1.  filesystem creation time
2.  filesystem modification time

------------------------------------------------------------------------

# Media Discovery

Aggregate files from **every configured DataLake source** into a single
logical collection.

Supported formats:

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

Do **not** recursively scan every request.

Maintain a metadata index.

Each record contains:

-   sourceId
-   absolutePath
-   relativePath
-   timestamp
-   mediaType
-   extension
-   filesize
-   hash (future)

Use file watchers (e.g. chokidar) for filesystem sources.

------------------------------------------------------------------------

# Time Character Matching

Reuse the existing Memory Peg scheduler.

    time_character
        ↓
    intervalStart
    intervalEnd
        ↓
    timestamp lookup

Return every asset where:

    intervalStart <= timestamp < intervalEnd

------------------------------------------------------------------------

# Backend API

    GET /api/gallery/:date/:timeCharacter

Returns chronological assets across every configured DataLake.

------------------------------------------------------------------------

# Desktop UX

-   Responsive gallery
-   Lazy loading
-   Click thumbnail
-   Fullscreen lightbox
-   Keyboard navigation

------------------------------------------------------------------------

# Mobile UX

-   Display first image
-   Tap to open viewer
-   Swipe through gallery
-   Pinch zoom (future)

------------------------------------------------------------------------

# Architecture

    Memory Peg Frontend
            │
    Gallery Component
            │
    Gallery API
            │
    Metadata Index
            │
    Filesystem Aggregator
       ├── Local
       ├── Synology Drive
       └── Google Drive

------------------------------------------------------------------------

# Future Enhancements

-   OCR search
-   Semantic search
-   Video thumbnails
-   Mixed media timeline
-   AI-generated summaries
-   Flashcards
-   Review mode

------------------------------------------------------------------------

# Acceptance Criteria

-   Supports multiple DataLake roots
-   Aggregates results transparently
-   Filename parsing with fallback
-   Correct interval matching
-   Desktop gallery
-   Mobile swipe viewer
-   Chronological ordering
-   Easily extensible to cloud connectors
