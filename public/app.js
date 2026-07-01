document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('loader');
    const dashboardContent = document.getElementById('dashboard-content');
    const errorMessage = document.getElementById('error-message');

    // DOM Elements
    const bannerTitleEl = document.getElementById('banner-title');
    const bannerTimeCharacterEl = document.getElementById('banner-time-character');
    const bannerSubtitleEl = document.getElementById('banner-subtitle');

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
        // Banner
        bannerTitleEl.textContent = data.weekCreature.creature;
        bannerTimeCharacterEl.textContent = data.timeCharacter.character;
        bannerSubtitleEl.textContent = `Week ${data.weekCreature.weekFormatted}`;

        // Week card
        weekNumEl.textContent = data.weekCreature.weekFormatted;
        weekCreatureEl.textContent = data.weekCreature.creature;
        weekDescEl.textContent = data.weekCreature.creature_description || 'A mystical guardian watching over this week.';

        // Day card
        dayNameEl.textContent = data.dayTheme.weekday;
        dayThemeEl.textContent = data.dayTheme.theme;
        dayPropsEl.textContent = data.dayTheme.props.join(', ');

        // Time card
        computedTimeEl.textContent = data.computedTime;
        timeCharacterEl.textContent = data.timeCharacter.character;
        timePegEl.textContent = `Peg ${data.timeCharacter.peg}`;
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
