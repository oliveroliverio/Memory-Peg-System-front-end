'use strict';

/**
 * Supported media extensions grouped by type, following the PRD's phased rollout.
 * All phases are registered so the index captures everything present in the
 * DataLake today; the frontend can choose which types to render.
 */
const MEDIA_TYPES = {
    // Phase 1 — images
    png: 'image',
    jpg: 'image',
    jpeg: 'image',
    webp: 'image',
    gif: 'image',
    // Phase 2 — video
    mp4: 'video',
    mov: 'video',
    mkv: 'video',
    webm: 'video',
    // Phase 3 — text/documents
    txt: 'text',
    md: 'text',
    pdf: 'text',
    json: 'text',
};

/**
 * @param {string} ext extension WITHOUT the leading dot (case-insensitive)
 * @returns {string|null} 'image' | 'video' | 'text', or null if unsupported.
 */
function mediaTypeForExtension(ext) {
    return MEDIA_TYPES[String(ext).toLowerCase()] || null;
}

/**
 * @param {string} filename
 * @returns {string} extension without the dot, lowercased ('' if none).
 */
function extensionOf(filename) {
    const dot = filename.lastIndexOf('.');
    if (dot < 0 || dot === filename.length - 1) return '';
    return filename.slice(dot + 1).toLowerCase();
}

function isSupported(filename) {
    return mediaTypeForExtension(extensionOf(filename)) !== null;
}

module.exports = { MEDIA_TYPES, mediaTypeForExtension, extensionOf, isSupported };
