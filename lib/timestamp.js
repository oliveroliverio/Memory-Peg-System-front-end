'use strict';

/**
 * Timestamp resolution for DataLake assets.
 *
 * Preferred filename format (per PRD):
 *   YYMMDD-HHMMSS_<number>.ext   e.g. 260703-110521_1.png
 *
 * Resolution order:
 *   1. Parse the filename.
 *   2. Fall back to filesystem creation time (birthtime).
 *   3. Fall back to modification time (mtime).
 *
 * All parsed times are interpreted in the host's LOCAL timezone, because the
 * capture device and the Memory Peg quadrant scheduler both operate on local
 * wall-clock time.
 */

// YYMMDD-HHMMSS anywhere at the start of the basename, optional _<number> suffix.
const FILENAME_TS = /^(\d{2})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})/;

/**
 * Attempt to parse a timestamp from a filename.
 * @param {string} filename basename (may include extension)
 * @returns {Date|null} a Date in local time, or null if unparseable/invalid.
 */
function parseTimestampFromFilename(filename) {
    const match = FILENAME_TS.exec(filename);
    if (!match) return null;

    const [, yy, mm, dd, HH, MM, SS] = match.map(Number);
    // Two-digit year -> 2000-based (matches the capture pipeline's YY convention).
    const year = 2000 + yy;
    const date = new Date(year, mm - 1, dd, HH, MM, SS, 0);

    // Guard against rollover from invalid components (e.g. month 13, day 45).
    if (
        date.getFullYear() !== year ||
        date.getMonth() !== mm - 1 ||
        date.getDate() !== dd ||
        date.getHours() !== HH ||
        date.getMinutes() !== MM ||
        date.getSeconds() !== SS
    ) {
        return null;
    }
    return date;
}

/**
 * Resolve the canonical timestamp for an asset, applying the PRD fallback chain.
 * @param {string} filename basename
 * @param {import('fs').Stats} [stats] fs.Stats for birthtime/mtime fallback
 * @returns {{ date: Date, source: 'filename'|'birthtime'|'mtime' }}
 */
function resolveTimestamp(filename, stats) {
    const fromName = parseTimestampFromFilename(filename);
    if (fromName) return { date: fromName, source: 'filename' };

    if (stats) {
        // birthtimeMs can be 0 on filesystems that don't track creation time.
        if (stats.birthtimeMs && stats.birthtimeMs > 0) {
            return { date: new Date(stats.birthtimeMs), source: 'birthtime' };
        }
        return { date: new Date(stats.mtimeMs), source: 'mtime' };
    }

    // No filename match and no stats: caller must supply something; default to epoch.
    return { date: new Date(0), source: 'mtime' };
}

module.exports = { parseTimestampFromFilename, resolveTimestamp };
