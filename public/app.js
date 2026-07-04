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
            const themeClass = 'theme-' + data.dayTheme.theme.toLowerCase().replace(/\s+/g, '-');
            document.body.className = document.body.className
                .split(' ')
                .filter(c => !c.startsWith('theme-'))
                .join(' ');
            document.body.classList.add(themeClass);
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
    }

    function navLightbox(delta) {
        if (!galleryAssets.length) return;
        lightboxIndex = (lightboxIndex + delta + galleryAssets.length) % galleryAssets.length;
        renderLightbox();
    }

    function renderLightbox() {
        const asset = galleryAssets[lightboxIndex];
        lightboxStageEl.innerHTML = '';

        let node;
        if (asset.mediaType === 'image') {
            node = document.createElement('img');
            node.src = asset.url;
            node.alt = `Captured ${formatClock(asset.timestamp)}`;
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
        else if (e.key === 'ArrowRight') navLightbox(1);
        else if (e.key === 'ArrowLeft') navLightbox(-1);
    });

    // Touch swipe navigation (mobile)
    let touchStartX = 0;
    let touchStartY = 0;
    lightboxEl.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });
    lightboxEl.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].screenX - touchStartX;
        const dy = e.changedTouches[0].screenY - touchStartY;
        // Horizontal swipe dominates -> navigate; else ignore (allow vertical scroll)
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
            navLightbox(dx < 0 ? 1 : -1);
        }
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

    function floorToQuadrant(ms) {
        return Math.floor(ms / QUADRANT_MS) * QUADRANT_MS;
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

    // ── Initial load ──────────────────────────────────────────────────────────
    centerTrack();
    showQuadrant(floorToQuadrant(Date.now()), { isInitial: true }).then(scheduleNextRefresh);
});
