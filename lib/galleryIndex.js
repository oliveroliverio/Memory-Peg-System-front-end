'use strict';

const { resolveTimestamp } = require('./timestamp');
const { mediaTypeForExtension, extensionOf } = require('./mediaTypes');

const QUADRANT_MS = 15 * 60 * 1000;

/**
 * In-memory metadata index over a storage provider's DataLake.
 *
 * Instead of rescanning the filesystem on every request, we build the index
 * once and keep it current via the provider's watcher. Each record:
 *   { absolutePath, relativePath, timestamp (ms), isoTime, mediaType,
 *     extension, filesize, timestampSource }
 */
class GalleryIndex {
    constructor(provider) {
        this.provider = provider;
        /** @type {Map<string, object>} keyed by absolutePath */
        this.records = new Map();
        this.ready = false;
        this._closeWatcher = null;
    }

    /** Build a record from a provider AssetSource ({absolutePath, relativePath, stats}). */
    static buildRecord(src) {
        const basename = src.relativePath.split('/').pop();
        const extension = extensionOf(basename);
        const mediaType = mediaTypeForExtension(extension);
        const { date, source } = resolveTimestamp(basename, src.stats);
        return {
            absolutePath: src.absolutePath,
            relativePath: src.relativePath,
            timestamp: date.getTime(),
            isoTime: date.toISOString(),
            mediaType,
            extension,
            filesize: src.stats ? src.stats.size : 0,
            timestampSource: source,
        };
    }

    _upsert(src) {
        this.records.set(src.absolutePath, GalleryIndex.buildRecord(src));
    }

    /** Initial scan + attach the live watcher. Idempotent-ish; call once. */
    async start() {
        const sources = await this.provider.scan();
        for (const src of sources) this._upsert(src);
        this.ready = true;
        console.log(`[GalleryIndex] indexed ${this.records.size} assets from DataLake`);

        this._closeWatcher = this.provider.watch({
            onAdd: (src) => {
                this._upsert(src);
                console.log(`[GalleryIndex] +add ${src.relativePath} (${this.records.size} total)`);
            },
            onChange: (src) => this._upsert(src),
            onRemove: ({ absolutePath, relativePath }) => {
                if (this.records.delete(absolutePath)) {
                    console.log(`[GalleryIndex] -remove ${relativePath} (${this.records.size} total)`);
                }
            },
        });
    }

    async stop() {
        if (this._closeWatcher) await this._closeWatcher();
        this._closeWatcher = null;
    }

    /**
     * Return records whose timestamp falls in [start, end), sorted chronologically.
     * @param {Date|number} start interval start (inclusive)
     * @param {Date|number} end interval end (exclusive)
     */
    queryInterval(start, end) {
        const startMs = start instanceof Date ? start.getTime() : start;
        const endMs = end instanceof Date ? end.getTime() : end;
        const out = [];
        for (const rec of this.records.values()) {
            if (rec.timestamp >= startMs && rec.timestamp < endMs) out.push(rec);
        }
        out.sort((a, b) => a.timestamp - b.timestamp);
        return out;
    }

    /**
     * Query the 15-minute quadrant identified by a local date + start-of-quadrant time.
     * @param {number} year full year (e.g. 2026)
     * @param {number} month 1-12
     * @param {number} day 1-31
     * @param {number} hour 0-23 (quadrant start hour)
     * @param {number} minute 0/15/30/45 (quadrant start minute)
     */
    queryQuadrant(year, month, day, hour, minute) {
        const start = new Date(year, month - 1, day, hour, minute, 0, 0);
        const end = new Date(start.getTime() + QUADRANT_MS);
        return {
            intervalStart: start,
            intervalEnd: end,
            assets: this.queryInterval(start, end),
        };
    }

    stats() {
        const byType = {};
        for (const rec of this.records.values()) {
            byType[rec.mediaType] = (byType[rec.mediaType] || 0) + 1;
        }
        return { total: this.records.size, byType, ready: this.ready };
    }
}

module.exports = { GalleryIndex, QUADRANT_MS };
