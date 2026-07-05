document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('loader');
    const dashboardContent = document.getElementById('dashboard-content');
    const errorMessage = document.getElementById('error-message');

    // DOM Elements
    const bannerContentEl = document.querySelector('.banner-content');
    const bannerTitleEl = document.getElementById('banner-title');
    const bannerTimeCharacterEl = document.getElementById('banner-time-character');
    const bannerSubtitleEl = document.getElementById('banner-subtitle');
    const bannerDateEl = document.getElementById('banner-date');
    const bannerPrevTimeEl = document.getElementById('banner-prev-time');
    const bannerPrevCharacterEl = document.getElementById('banner-prev-character');
    const bannerNextTimeEl = document.getElementById('banner-next-time');
    const bannerNextCharacterEl = document.getElementById('banner-next-character');

    const weekNumEl = document.getElementById('week-num');
    const weekCreatureEl = document.getElementById('week-creature');
    const weekDescEl = document.getElementById('week-desc');

    const dayNameEl = document.getElementById('day-name');
    const dayThemeEl = document.getElementById('day-theme');
    const dayPropsEl = document.getElementById('day-props');

    const computedTimeEl = document.getElementById('computed-time');
    const timeCharacterEl = document.getElementById('time-character');
    const timePegEl = document.getElementById('time-peg');

    // Gallery elements
    const galleryGridEl = document.getElementById('gallery-grid');
    const galleryLoaderEl = document.getElementById('gallery-loader');
    const galleryEmptyEl = document.getElementById('gallery-empty');
    const gallerySubtitleEl = document.getElementById('gallery-subtitle');

    // Lightbox elements
    const lightboxEl = document.getElementById('lightbox');
    const lightboxStageEl = document.getElementById('lightbox-stage');
    const lightboxCounterEl = document.getElementById('lightbox-counter');
    const lightboxCloseEl = document.getElementById('lightbox-close');
    const lightboxPrevEl = document.getElementById('lightbox-prev');
    const lightboxNextEl = document.getElementById('lightbox-next');
    const lightboxHintEl = document.getElementById('lightbox-hint');

    // Time-travel elements
    const ttTrack = document.getElementById('tt-track');
    const ttPaneNextEl = document.getElementById('tt-pane-next');
    const ttPrevBtn = document.getElementById('tt-prev-btn');
    const ttNextBtn = document.getElementById('tt-next-btn');
    const ttReturnBtn = document.getElementById('tt-return-btn');

    /** Format YYMMDD + weekday into a human date string, forced to UTC so it
     *  never reinterprets the Pi-local calendar date through the viewer's own
     *  timezone (which could shift it near midnight). */
    function formatBannerDate(dateStr, weekday) {
        const year = 2000 + Number(dateStr.slice(0, 2));
        const month = Number(dateStr.slice(2, 4));
        const day = Number(dateStr.slice(4, 6));
        const formatted = new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
        });
        return weekday ? `${weekday}, ${formatted}` : formatted;
    }

    /**
     * Populate all UI elements from a /api/quadrant/:epochMs payload.
     * No values are cached based on "today" — everything renders directly
     * from the selected quadrant's payload.
     */
    function populateUI(data) {
        // Banner — current
        bannerTitleEl.textContent = data.weekCreature.creature;
        bannerTimeCharacterEl.textContent = data.timeCharacter.character;
        bannerSubtitleEl.textContent = `Week ${data.weekCreature.weekFormatted}`;
        bannerDateEl.textContent = formatBannerDate(data.date, data.dayTheme.weekday);

        // Banner — prev / next context
        if (data.prevTimeCharacter) {
            bannerPrevTimeEl.textContent = data.prevTimeCharacter.time;
            bannerPrevCharacterEl.textContent = data.prevTimeCharacter.character;
        }
        if (data.nextTimeCharacter) {
            bannerNextTimeEl.textContent = data.nextTimeCharacter.time;
            bannerNextCharacterEl.textContent = data.nextTimeCharacter.character;
        }
        // Week card
        weekNumEl.textContent = data.weekCreature.weekFormatted;
        weekCreatureEl.textContent = data.weekCreature.creature;
        weekDescEl.textContent = data.weekCreature.creature_description || 'A mystical guardian watching over this week.';

        // Day card
        dayNameEl.textContent = data.dayTheme.weekday;
        dayThemeEl.textContent = data.dayTheme.theme;
        dayPropsEl.textContent = data.dayTheme.props.join(', ');

        // Dynamic theme switching
        if (data.dayTheme && data.dayTheme.theme) {
            currentBackendTheme = data.dayTheme.theme;
            applyThemeFromSelect(currentBackendTheme);
        }

        // Time card
        computedTimeEl.textContent = data.computedTime;
        timeCharacterEl.textContent = data.timeCharacter.character;
        timePegEl.textContent = `Peg ${data.timeCharacter.peg}`;

        // Sync the clock hands to the SELECTED quadrant (not necessarily "now")
        const hour = Number(data.quadrant.slice(0, 2));
        const minute = Number(data.quadrant.slice(2, 4));
        updateClockFor(hour, minute);

        // Memory Gallery for this quadrant ships in the same payload
        renderGallery(data.assets || [], data.timeCharacter.character);
    }

    // ── Memory Gallery ──────────────────────────────────────────────────────
    // Tracks the assets currently rendered so the lightbox can navigate them.
    let galleryAssets = [];
    let lightboxIndex = 0;

    /** Format a ms timestamp as a short local clock time (e.g. "11:05 AM"). */
    function formatClock(ms) {
        return new Date(ms).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }

    /** Render the thumbnail grid from an asset list. */
    function renderGallery(assets, characterLabel) {
        galleryAssets = assets;
        galleryGridEl.innerHTML = '';

        const who = characterLabel ? ` for ${characterLabel}` : '';
        if (!assets.length) {
            galleryGridEl.classList.remove('has-items');
            gallerySubtitleEl.textContent = `No memories captured during this time${who}`;
            galleryEmptyEl.style.display = 'block';
            return;
        }

        galleryEmptyEl.style.display = 'none';
        galleryGridEl.classList.add('has-items');
        gallerySubtitleEl.textContent =
            `${assets.length} item${assets.length === 1 ? '' : 's'} captured this quadrant${who}`;

        assets.forEach((asset, i) => {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            item.setAttribute('role', 'button');
            item.setAttribute('tabindex', '0');
            item.setAttribute('aria-label', `Open media captured at ${formatClock(asset.timestamp)}`);

            let media;
            if (asset.mediaType === 'image') {
                media = document.createElement('img');
                media.loading = 'lazy';          // lazy loading per PRD
                media.src = asset.url;
                media.alt = `Captured ${formatClock(asset.timestamp)}`;
            } else if (asset.mediaType === 'video') {
                media = document.createElement('video');
                media.src = asset.url;
                media.muted = true;
                media.preload = 'metadata';
                item.appendChild(badge('▶ video'));
            } else {
                // text / pdf / json — show a document tile
                media = document.createElement('div');
                media.className = 'gallery-time';
                media.style.position = 'static';
                media.style.opacity = '1';
                item.appendChild(badge(asset.extension || 'doc'));
            }
            item.appendChild(media);

            // Hover time caption
            const time = document.createElement('div');
            time.className = 'gallery-time';
            time.textContent = formatClock(asset.timestamp);
            item.appendChild(time);

            // Mobile "+N more" overlay lives on the first tile only
            if (i === 0 && assets.length > 1) {
                const more = document.createElement('div');
                more.className = 'gallery-more active';
                more.textContent = `+${assets.length - 1} more`;
                item.appendChild(more);
            }

            item.addEventListener('click', () => openLightbox(i));
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openLightbox(i);
                }
            });
            galleryGridEl.appendChild(item);
        });
    }

    function badge(text) {
        const b = document.createElement('span');
        b.className = 'gallery-badge';
        b.textContent = text;
        return b;
    }

    // ── Lightbox / swipe viewer ─────────────────────────────────────────────
    function openLightbox(index) {
        if (!galleryAssets.length) return;
        lightboxIndex = index;
        renderLightbox();
        lightboxEl.classList.add('open');
        lightboxEl.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        lightboxEl.classList.remove('open');
        lightboxEl.setAttribute('aria-hidden', 'true');
        lightboxStageEl.innerHTML = '';
        document.body.style.overflow = '';
        mouseDragStart = null;
        touchMode = null;
    }

    function navLightbox(delta) {
        if (!galleryAssets.length) return;
        lightboxIndex = (lightboxIndex + delta + galleryAssets.length) % galleryAssets.length;
        renderLightbox();
    }

    // ── Zoom & pan (images only) ─────────────────────────────────────────────
    const ZOOM_MIN = 1;
    const ZOOM_MAX = 4;
    const ZOOM_TAP_SCALE = 2.5;
    let zoomScale = 1;
    let panX = 0;
    let panY = 0;

    /** The zoomable <img> in the stage, or null for video/text assets. */
    function getActiveImage() {
        return lightboxStageEl.querySelector('img');
    }

    function clampPan(img) {
        const stageRect = lightboxStageEl.getBoundingClientRect();
        const maxX = Math.max(0, (img.clientWidth * zoomScale - stageRect.width) / 2);
        const maxY = Math.max(0, (img.clientHeight * zoomScale - stageRect.height) / 2);
        panX = Math.min(maxX, Math.max(-maxX, panX));
        panY = Math.min(maxY, Math.max(-maxY, panY));
    }

    function applyZoom(img) {
        img.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomScale})`;
        img.classList.toggle('zoomed', zoomScale > 1.01);
    }

    function resetZoom() {
        zoomScale = 1;
        panX = 0;
        panY = 0;
    }

    /** Zoom toward a screen point, anchoring that point so it doesn't jump. */
    function zoomTo(img, newScale, anchorClientX, anchorClientY) {
        newScale = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, newScale));
        if (newScale === zoomScale) return;
        const stageRect = lightboxStageEl.getBoundingClientRect();
        const ox = anchorClientX - (stageRect.left + stageRect.width / 2);
        const oy = anchorClientY - (stageRect.top + stageRect.height / 2);
        const ratio = newScale / zoomScale;
        panX = ox - (ox - panX) * ratio;
        panY = oy - (oy - panY) * ratio;
        zoomScale = newScale;
        if (zoomScale <= ZOOM_MIN) { zoomScale = 1; panX = 0; panY = 0; }
        clampPan(img);
        applyZoom(img);
    }

    function toggleZoomAt(img, clientX, clientY) {
        if (zoomScale > 1) {
            resetZoom();
            applyZoom(img);
        } else {
            zoomTo(img, ZOOM_TAP_SCALE, clientX, clientY);
        }
    }

    function renderLightbox() {
        const asset = galleryAssets[lightboxIndex];
        lightboxStageEl.innerHTML = '';
        resetZoom();

        let node;
        if (asset.mediaType === 'image') {
            node = document.createElement('img');
            node.src = asset.url;
            node.alt = `Captured ${formatClock(asset.timestamp)}`;
            node.draggable = false;
            applyZoom(node); // sets identity transform, no visual change
        } else if (asset.mediaType === 'video') {
            node = document.createElement('video');
            node.src = asset.url;
            node.controls = true;
            node.autoplay = true;
        } else {
            node = document.createElement('div');
            node.className = 'lightbox-text';
            node.innerHTML = `<p>${asset.relativePath}</p>` +
                `<p><a href="${asset.url}" target="_blank" rel="noopener" style="color:#93c5fd">Open document ↗</a></p>`;
        }
        lightboxStageEl.appendChild(node);
        lightboxCounterEl.textContent =
            `${lightboxIndex + 1} / ${galleryAssets.length} · ${formatClock(asset.timestamp)}`;
        lightboxHintEl.style.display = asset.mediaType === 'image' ? 'block' : 'none';
    }

    lightboxCloseEl.addEventListener('click', closeLightbox);
    lightboxPrevEl.addEventListener('click', () => navLightbox(-1));
    lightboxNextEl.addEventListener('click', () => navLightbox(1));

    // Click on the dimmed backdrop (not the media) closes the viewer
    lightboxEl.addEventListener('click', (e) => {
        if (e.target === lightboxEl || e.target === lightboxStageEl) closeLightbox();
    });

    // Keyboard navigation (desktop)
    document.addEventListener('keydown', (e) => {
        if (!lightboxEl.classList.contains('open')) return;
        if (e.key === 'Escape') closeLightbox();
        else if (e.key === 'ArrowRight' && zoomScale === 1) navLightbox(1);
        else if (e.key === 'ArrowLeft' && zoomScale === 1) navLightbox(-1);
    });

    // Desktop: scroll/trackpad to zoom, anchored at the cursor
    lightboxStageEl.addEventListener('wheel', (e) => {
        const img = getActiveImage();
        if (!img) return;
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.2 : 1 / 1.2;
        zoomTo(img, zoomScale * factor, e.clientX, e.clientY);
    }, { passive: false });

    // Desktop: double-click to zoom in/out, anchored at the click point
    lightboxStageEl.addEventListener('dblclick', (e) => {
        const img = getActiveImage();
        if (!img) return;
        toggleZoomAt(img, e.clientX, e.clientY);
    });

    // Desktop: drag to pan while zoomed in
    let mouseDragStart = null;
    lightboxStageEl.addEventListener('mousedown', (e) => {
        const img = getActiveImage();
        if (!img || zoomScale <= 1) return;
        mouseDragStart = { x: e.clientX, y: e.clientY, panX, panY };
        img.style.transition = 'none';
        img.classList.add('dragging');
        e.preventDefault();
    });
    window.addEventListener('mousemove', (e) => {
        if (!mouseDragStart) return;
        const img = getActiveImage();
        if (!img) return;
        panX = mouseDragStart.panX + (e.clientX - mouseDragStart.x);
        panY = mouseDragStart.panY + (e.clientY - mouseDragStart.y);
        clampPan(img);
        applyZoom(img);
    });
    window.addEventListener('mouseup', () => {
        if (!mouseDragStart) return;
        mouseDragStart = null;
        const img = getActiveImage();
        if (img) { img.style.transition = ''; img.classList.remove('dragging'); }
    });

    // Touch: pinch-to-zoom, single-finger pan while zoomed, swipe-to-navigate
    // while at 1x, and double-tap to toggle zoom.
    let touchMode = null; // 'pinch' | 'pan' | 'swipe'
    let gestureStartX = 0;
    let gestureStartY = 0;
    let pinchStartDist = 0;
    let pinchStartScale = 1;
    let pinchStartPan = { x: 0, y: 0 };
    let pinchStartMid = { x: 0, y: 0 };
    let panDragStart = null;
    let lastTapTime = 0;
    let lastTapPos = { x: 0, y: 0 };

    const touchDist = (t0, t1) => Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
    const touchMid = (t0, t1) => ({ x: (t0.clientX + t1.clientX) / 2, y: (t0.clientY + t1.clientY) / 2 });

    lightboxEl.addEventListener('touchstart', (e) => {
        const img = getActiveImage();
        if (e.touches.length === 2 && img) {
            touchMode = 'pinch';
            pinchStartDist = touchDist(e.touches[0], e.touches[1]);
            pinchStartScale = zoomScale;
            pinchStartPan = { x: panX, y: panY };
            pinchStartMid = touchMid(e.touches[0], e.touches[1]);
            img.style.transition = 'none';
        } else if (e.touches.length === 1 && img && zoomScale > 1) {
            touchMode = 'pan';
            panDragStart = { x: e.touches[0].clientX, y: e.touches[0].clientY, panX, panY };
            img.style.transition = 'none';
        } else {
            touchMode = 'swipe';
            gestureStartX = e.touches[0].clientX;
            gestureStartY = e.touches[0].clientY;
        }
    }, { passive: true });

    lightboxEl.addEventListener('touchmove', (e) => {
        const img = getActiveImage();
        if (touchMode === 'pinch' && e.touches.length === 2 && img) {
            e.preventDefault();
            const ratio = (touchDist(e.touches[0], e.touches[1]) / pinchStartDist);
            const newScale = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, pinchStartScale * ratio));
            const stageRect = lightboxStageEl.getBoundingClientRect();
            const curMid = touchMid(e.touches[0], e.touches[1]);
            const ox = pinchStartMid.x - (stageRect.left + stageRect.width / 2);
            const oy = pinchStartMid.y - (stageRect.top + stageRect.height / 2);
            const scaleRatio = newScale / pinchStartScale;
            zoomScale = newScale;
            panX = ox - (ox - pinchStartPan.x) * scaleRatio + (curMid.x - pinchStartMid.x);
            panY = oy - (oy - pinchStartPan.y) * scaleRatio + (curMid.y - pinchStartMid.y);
            clampPan(img);
            applyZoom(img);
        } else if (touchMode === 'pan' && e.touches.length === 1 && img) {
            e.preventDefault();
            panX = panDragStart.panX + (e.touches[0].clientX - panDragStart.x);
            panY = panDragStart.panY + (e.touches[0].clientY - panDragStart.y);
            clampPan(img);
            applyZoom(img);
        }
    }, { passive: false });

    lightboxEl.addEventListener('touchend', (e) => {
        const img = getActiveImage();
        const t = e.changedTouches[0];
        const dx = t.clientX - gestureStartX;
        const dy = t.clientY - gestureStartY;
        const wasTap = touchMode !== 'pinch' && Math.abs(dx) < 10 && Math.abs(dy) < 10;

        if (wasTap && img) {
            const now = Date.now();
            const distFromLastTap = Math.hypot(t.clientX - lastTapPos.x, t.clientY - lastTapPos.y);
            if (now - lastTapTime < 300 && distFromLastTap < 40) {
                toggleZoomAt(img, t.clientX, t.clientY);
                lastTapTime = 0;
            } else {
                lastTapTime = now;
                lastTapPos = { x: t.clientX, y: t.clientY };
            }
        } else if (touchMode === 'swipe' && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
            navLightbox(dx < 0 ? 1 : -1);
        }

        if (zoomScale <= 1) { zoomScale = 1; panX = 0; panY = 0; }
        if (img) img.style.transition = '';
        touchMode = null;
    }, { passive: true });

    /**
     * Draw the analog clock: highlight active quadrant sector and position
     * hour + minute hands for a given hour/minute. Driven by the SELECTED
     * quadrant (populateUI), which may be a past quadrant during time travel.
     */
    function updateClockFor(hour, minute) {
        const hours12 = hour % 12;

        // ── Active quadrant sector ──────────────────────────────────────────
        const activeQuadrant = Math.floor(minute / 15); // 0, 1, 2, or 3
        document.querySelectorAll('.quadrant-sector').forEach((sector, i) => {
            sector.classList.toggle('active', i === activeQuadrant);
        });

        // ── Hand angles (0° = 12 o'clock, rotating clockwise) ──────────────
        // Convert to SVG coords: subtract 90° so 0 min points up
        const minDeg  = (minute / 60) * 360 - 90;
        const hourDeg = ((hours12 + minute / 60) / 12) * 360 - 90;

        const toRad = deg => deg * Math.PI / 180;

        // Minute hand — length 33 (longer, thinner)
        const minRad = toRad(minDeg);
        const minX = 50 + 33 * Math.cos(minRad);
        const minY = 50 + 33 * Math.sin(minRad);

        // Hour hand — length 22 (shorter, thicker)
        const hourRad = toRad(hourDeg);
        const hourX = 50 + 22 * Math.cos(hourRad);
        const hourY = 50 + 22 * Math.sin(hourRad);

        const hourHand = document.getElementById('clock-hour-hand');
        const minHand  = document.getElementById('clock-minute-hand');

        if (hourHand) { hourHand.setAttribute('x2', hourX.toFixed(2)); hourHand.setAttribute('y2', hourY.toFixed(2)); }
        if (minHand)  { minHand.setAttribute('x2',  minX.toFixed(2));  minHand.setAttribute('y2',  minY.toFixed(2)); }
    }

    // ── Time Travel ──────────────────────────────────────────────────────────
    // Quadrant boundaries in absolute UTC epoch ms line up exactly with
    // Pi-local :00/:15/:30/:45 boundaries (every real-world UTC offset is a
    // multiple of 15 minutes), so flooring Date.now() client-side is safe
    // regardless of the viewer's own timezone.
    const QUADRANT_MS = 15 * 60 * 1000;
    const CACHE_LIMIT = 60;
    const quadrantCache = new Map(); // epochMs -> payload

    let selectedEpochMs = null;
    let isLive = true;
    let nextRefreshTimer = null;
    let currentBackendTheme = '';

    function floorToQuadrant(ms) {
        return Math.floor(ms / QUADRANT_MS) * QUADRANT_MS;
    }

    function applyThemeFromSelect(backendThemeName) {
        const themeSelectEl = document.getElementById('theme-select');
        const selectedThemeOverride = themeSelectEl ? themeSelectEl.value : 'auto';
        let themeToApply = backendThemeName;
        if (selectedThemeOverride && selectedThemeOverride !== 'auto') {
            themeToApply = selectedThemeOverride;
        }
        
        if (themeToApply) {
            const themeClass = 'theme-' + themeToApply.toLowerCase().replace(/\s+/g, '-');
            document.body.className = document.body.className
                .split(' ')
                .filter(c => !c.startsWith('theme-'))
                .join(' ');
            document.body.classList.add(themeClass);
        }
    }

    function cacheSet(epochMs, payload) {
        quadrantCache.set(epochMs, payload);
        if (quadrantCache.size > CACHE_LIMIT) {
            quadrantCache.delete(quadrantCache.keys().next().value);
        }
    }

    /** Fetch a quadrant's combined metadata+gallery payload, using the cache
     *  unless force-refreshing (e.g. returning to a possibly-stale present). */
    function fetchQuadrant(epochMs, { force = false } = {}) {
        if (!force && quadrantCache.has(epochMs)) {
            return Promise.resolve(quadrantCache.get(epochMs));
        }
        return fetch(`/api/quadrant/${epochMs}`)
            .then((r) => {
                if (!r.ok) throw new Error('Quadrant request failed');
                return r.json();
            })
            .then((payload) => {
                cacheSet(payload.epochMs, payload);
                return payload;
            });
    }

    /** Warm the cache for the neighboring quadrants so a swipe feels instant. */
    function prefetchNeighbors(epochMs, liveNow) {
        fetchQuadrant(epochMs - QUADRANT_MS).catch(() => {});
        if (epochMs < liveNow) {
            fetchQuadrant(epochMs + QUADRANT_MS).catch(() => {});
        }
    }

    /** Load, render, and set navigation affordances for a given quadrant. */
    function showQuadrant(epochMs, { isInitial = false, force = false } = {}) {
        bannerContentEl.classList.add('tt-updating');
        galleryLoaderEl.style.display = 'block';

        return fetchQuadrant(Math.min(epochMs, floorToQuadrant(Date.now())), { force })
            .then((data) => {
                selectedEpochMs = data.epochMs;
                isLive = data.isLive;

                populateUI(data);
                galleryLoaderEl.style.display = 'none';
                bannerContentEl.classList.remove('tt-updating');

                ttReturnBtn.style.display = isLive ? 'none' : 'inline-block';
                ttNextBtn.disabled = isLive;
                ttPaneNextEl.classList.toggle('tt-pane-disabled', isLive);

                prefetchNeighbors(selectedEpochMs, floorToQuadrant(Date.now()));

                if (isInitial) {
                    loader.style.display = 'none';
                    dashboardContent.style.display = 'flex';
                }
            })
            .catch((err) => {
                console.error('[Memory Peg] Quadrant load failed:', err);
                bannerContentEl.classList.remove('tt-updating');
                galleryLoaderEl.style.display = 'none';
                if (isInitial) {
                    loader.style.display = 'none';
                    errorMessage.style.display = 'block';
                }
            });
    }

    /** Step the selected quadrant by ±1. Pauses live auto-refresh on first step away. */
    function navigate(delta) {
        if (selectedEpochMs === null) return;
        const liveNow = floorToQuadrant(Date.now());
        const target = selectedEpochMs + delta * QUADRANT_MS;
        if (target > liveNow) return; // never navigate into the future

        if (isLive && target < liveNow && nextRefreshTimer) {
            clearTimeout(nextRefreshTimer);
            nextRefreshTimer = null;
        }
        showQuadrant(target);
    }

    /** Exit time travel: snap back to the live quadrant and resume auto-refresh. */
    function returnToPresent() {
        if (nextRefreshTimer) clearTimeout(nextRefreshTimer);
        showQuadrant(floorToQuadrant(Date.now()), { force: true }).then(scheduleNextRefresh);
    }

    ttReturnBtn.addEventListener('click', returnToPresent);
    ttPrevBtn.addEventListener('click', () => navigate(-1));
    ttNextBtn.addEventListener('click', () => navigate(1));

    // ── Swipe gesture surface ────────────────────────────────────────────────
    // Invisible 3-pane CSS scroll-snap track. Debounced settle (~150ms) decides
    // which way the user swiped, then always recenters instantly — the track
    // carries no content itself, so recentering is invisible to the user.
    let settleTimer = null;

    function centerTrack() {
        const paneWidth = ttTrack.clientWidth;
        if (paneWidth) ttTrack.scrollTo({ left: paneWidth, behavior: 'auto' });
    }

    function handleTrackSettle() {
        const paneWidth = ttTrack.clientWidth;
        if (!paneWidth) return;
        const index = Math.round(ttTrack.scrollLeft / paneWidth); // 0=prev, 1=current, 2=next
        if (index === 0) navigate(-1);
        else if (index === 2 && !ttNextBtn.disabled) navigate(1);
        centerTrack();
    }

    ttTrack.addEventListener('scroll', () => {
        if (settleTimer) clearTimeout(settleTimer);
        settleTimer = setTimeout(handleTrackSettle, 150);
    });

    window.addEventListener('resize', centerTrack);

    // ── Live auto-refresh (chained setTimeout — no polling) ─────────────────
    function msUntilNextQuadrant() {
        const intoQuadrant = Date.now() % QUADRANT_MS;
        return (QUADRANT_MS - intoQuadrant) + 500; // small buffer so backend clock has ticked over
    }

    function refreshAtQuadrant() {
        if (!isLive) return; // safety net — timer is paused while time-traveling
        showQuadrant(floorToQuadrant(Date.now()), { force: true }).then(() => {
            console.log(`[Memory Peg] Refreshed at quadrant boundary — next in ${Math.round(msUntilNextQuadrant() / 1000)}s`);
            scheduleNextRefresh();
        });
    }

    function scheduleNextRefresh() {
        if (nextRefreshTimer) clearTimeout(nextRefreshTimer);
        const delay = msUntilNextQuadrant();
        console.log(`[Memory Peg] Next refresh in ${Math.round(delay / 1000)}s`);
        nextRefreshTimer = setTimeout(refreshAtQuadrant, delay);
    }

    /**
     * iOS Safari (and other mobile browsers) throttle or kill setTimeout when
     * the tab is backgrounded or the screen locks. Re-sync on return to tab —
     * but only in live mode; don't yank a time-traveling user back to present.
     */
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && isLive) {
            console.log('[Memory Peg] Tab visible — refreshing in case timer was throttled');
            refreshAtQuadrant();
        }
    });

    // ── Theme Selector Initializer ───────────────────────────────────────────
    const themeSelect = document.getElementById('theme-select');
    const savedTheme = localStorage.getItem('themeOverride');
    if (savedTheme && themeSelect) {
        themeSelect.value = savedTheme;
    }
    if (themeSelect) {
        themeSelect.addEventListener('change', () => {
            const val = themeSelect.value;
            localStorage.setItem('themeOverride', val);
            applyThemeFromSelect(currentBackendTheme);
        });
    }

    // ── Initial load ──────────────────────────────────────────────────────────
    centerTrack();
    showQuadrant(floorToQuadrant(Date.now()), { isInitial: true }).then(scheduleNextRefresh);
});
