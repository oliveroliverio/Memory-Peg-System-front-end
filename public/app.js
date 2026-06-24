document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('loader');
    const dashboardContent = document.getElementById('dashboard-content');
    const errorMessage = document.getElementById('error-message');

    // DOM Elements
    const bannerTitleEl = document.getElementById('banner-title');
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

    // Fetch data from our own backend proxy API
    fetch('/api/getCharacters')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Hide loader, show content
            loader.style.display = 'none';
            dashboardContent.style.display = 'flex';
            
            // Populate Banner Data
            bannerTitleEl.textContent = data.weekCreature.creature;
            bannerSubtitleEl.textContent = `Week ${data.weekCreature.weekFormatted}`;
            
            // Populate Week Data
            weekNumEl.textContent = data.weekCreature.weekFormatted;
            weekCreatureEl.textContent = data.weekCreature.creature;
            weekDescEl.textContent = data.weekCreature.creature_description || 'A mystical guardian watching over this week.';

            // Populate Day Data
            dayNameEl.textContent = data.dayTheme.weekday;
            dayThemeEl.textContent = data.dayTheme.theme;
            dayPropsEl.textContent = data.dayTheme.props.join(', ');

            // Populate Time Data
            computedTimeEl.textContent = data.computedTime;
            timeCharacterEl.textContent = data.timeCharacter.character;
            timePegEl.textContent = `Peg ${data.timeCharacter.peg}`;
        })
        .catch(error => {
            console.error('Error fetching character data:', error);
            loader.style.display = 'none';
            errorMessage.style.display = 'block';
        });
});
