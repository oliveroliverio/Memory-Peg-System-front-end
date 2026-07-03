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
    }

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
