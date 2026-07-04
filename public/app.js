document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('loader');
    const dashboardContent = document.getElementById('dashboard-content');
    const errorMessage = document.getElementById('error-message');

    // DOM Elements
    const bannerTitleEl = document.getElementById('banner-title');
    const bannerTimeCharacterEl = document.getElementById('banner-time-character');
    const bannerSubtitleEl = document.getElementById('banner-subtitle');
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

    /**
     * Populate all UI elements from an API response payload.
     */
    function populateUI(data) {
        // Banner — current
        bannerTitleEl.textContent = data.weekCreature.creature;
        bannerTimeCharacterEl.textContent = data.timeCharacter.character;
        bannerSubtitleEl.textContent = `Week ${data.weekCreature.weekFormatted}`;

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

        // Sync the clock hands to current time
        updateClock();

        // Load the media captured during the current time-character quadrant
        const label = data && data.timeCharacter ? data.timeCharacter.character : '';
        loadGallery(label);
    }

    // ── Memory Gallery ──────────────────────────────────────────────────────
    // Tracks the assets currently rendered so the lightbox can navigate them.
    let galleryAssets = [];
    let lightboxIndex = 0;

    /**
     * Derive the DataLake gallery params from a Date:
     *   date     -> YYMMDD
     *   quadrant -> HHMM, minutes floored to the enclosing 15-min boundary.
     * Uses local time so it matches both the clock and the capture filenames.
     */
    function quadrantParams(d) {
        const yy = String(d.getFullYear()).slice(-2);
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const HH = String(d.getHours()).padStart(2, '0');
        const q = Math.floor(d.getMinutes() / 15) * 15;
        const MM = String(q).padStart(2, '0');
        return { date: `${yy}${mm}${dd}`, quadrant: `${HH}${MM}` };
    }

    /** Format a ms timestamp as a short local clock time (e.g. "11:05 AM"). */
    function formatClock(ms) {
        return new Date(ms).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }

    /**
     * Fetch and render all media for the current 15-minute quadrant.
     * @param {string} characterLabel current time-character name for the subtitle.
     */
    function loadGallery(characterLabel) {
        const { date, quadrant } = quadrantParams(new Date());
        galleryLoaderEl.style.display = 'block';
        galleryEmptyEl.style.display = 'none';

        fetch(`/api/gallery/${date}/${quadrant}`)
            .then((r) => {
                if (!r.ok) throw new Error('Gallery request failed');
                return r.json();
            })
            .then((payload) => {
                galleryLoaderEl.style.display = 'none';
                renderGallery(payload.assets || [], characterLabel);
            })
            .catch((err) => {
                console.error('[Memory Peg] Gallery load failed:', err);
                galleryLoaderEl.style.display = 'none';
                renderGallery([], characterLabel);
            });
    }

    /** Render the thumbnail grid from an asset list. */
    function renderGallery(assets, characterLabel) {
        galleryAssets = assets;
        galleryGridEl.innerHTML = '';

        const who = characterLabel ? ` for ${characterLabel}` : '';
        if (!assets.length) {
            galleryGridEl.classList.remove('has-items');
            gallerySubtitleEl.textContent = `No media captured this quadrant${who}`;
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
     * hour + minute hands based on the current local time.
     * Called on every populateUI (initial load, quadrant boundary, tab focus).
     */
    function updateClock() {
        const now = new Date();
        const hours   = now.getHours() % 12;
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();

        // ── Active quadrant sector ──────────────────────────────────────────
        const activeQuadrant = Math.floor(minutes / 15); // 0, 1, 2, or 3
        document.querySelectorAll('.quadrant-sector').forEach((sector, i) => {
            sector.classList.toggle('active', i === activeQuadrant);
        });

        // ── Hand angles (0° = 12 o'clock, rotating clockwise) ──────────────
        // Convert to SVG coords: subtract 90° so 0 min points up
        const minDeg  = (minutes / 60) * 360 - 90;
        const hourDeg = ((hours + minutes / 60) / 12) * 360 - 90;

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

    /**
     * Calculate milliseconds until the next 15-minute quadrant boundary.
     * e.g. if it's 9:07, returns ms until 9:15.
     */
    function msUntilNextQuadrant() {
        const now = new Date();
        const totalMinutes = now.getMinutes() * 60 + now.getSeconds();
        const quadrantSeconds = 15 * 60; // 900 seconds
        const secondsIntoCurrentQuadrant = totalMinutes % quadrantSeconds;
        const secondsUntilNext = quadrantSeconds - secondsIntoCurrentQuadrant;
        // Add a small buffer (500ms) so the backend clock has ticked over
        return secondsUntilNext * 1000 + 500;
    }

    /**
     * Fetch fresh data, update UI, then schedule the next quadrant refresh.
     */
    function refreshAtQuadrant() {
        fetch('/api/getCharacters')
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(data => {
                populateUI(data);
                console.log(`[Memory Peg] Refreshed at quadrant boundary — next in ${Math.round(msUntilNextQuadrant() / 1000)}s`);
                scheduleNextRefresh();
            })
            .catch(error => {
                console.error('[Memory Peg] Quadrant refresh failed:', error);
                // Still reschedule so we keep trying each quadrant
                scheduleNextRefresh();
            });
    }

    // Track the active timer so we can cancel it if the tab wakes from background
    let nextRefreshTimer = null;

    /**
     * Schedule a single setTimeout to fire at the next quadrant boundary.
     * Chains itself — no polling, no setInterval.
     */
    function scheduleNextRefresh() {
        if (nextRefreshTimer) clearTimeout(nextRefreshTimer);
        const delay = msUntilNextQuadrant();
        console.log(`[Memory Peg] Next refresh in ${Math.round(delay / 1000)}s`);
        nextRefreshTimer = setTimeout(refreshAtQuadrant, delay);
    }

    /**
     * iOS Safari (and other mobile browsers) throttle or kill setTimeout when
     * the tab is backgrounded or the screen locks. When the user returns to the
     * tab, immediately re-fetch so the display is never stale, then re-arm the
     * timer for the next boundary.
     */
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            console.log('[Memory Peg] Tab visible — refreshing in case timer was throttled');
            refreshAtQuadrant();
        }
    });

    // ── Initial load ──────────────────────────────────────────────────────────
    fetch('/api/getCharacters')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            loader.style.display = 'none';
            dashboardContent.style.display = 'flex';
            populateUI(data);
            // Arm the first quadrant-boundary refresh
            scheduleNextRefresh();
        })
        .catch(error => {
            console.error('[Memory Peg] Error fetching character data:', error);
            loader.style.display = 'none';
            errorMessage.style.display = 'block';
        });
});
