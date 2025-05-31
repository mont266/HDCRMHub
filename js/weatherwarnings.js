const apiKey = '34285941a5314c92a81123428252805'; // Replace with your WeatherAPI.com API key

// Removed KPH_TO_MPH constant as we'll fetch MPH directly

// --- DEFAULT THRESHOLDS ---
// These are the original "Amber/Yellow" level thresholds, now used as defaults.
const DEFAULT_WIND_THRESHOLD_MPH = 37.28; // Approx 60 kph, now directly in MPH
const DEFAULT_RAIN_THRESHOLD_MM_HR = 5; // 5 mm/hr
const DEFAULT_HEATWAVE_THRESHOLD_C = 25; // 25°C
const DEFAULT_CONSECUTIVE_DAYS = 3;
// --- END DEFAULT THRESHOLDS ---

// --- DYNAMIC THRESHOLDS (These will be updated by Dev Tools) ---
let currentWindThresholdMph = DEFAULT_WIND_THRESHOLD_MPH;
let currentRainThresholdMmHr = DEFAULT_RAIN_THRESHOLD_MM_HR;
let currentHeatwaveThresholdC = DEFAULT_HEATWAVE_THRESHOLD_C;
let currentConsecutiveDays = DEFAULT_CONSECUTIVE_DAYS;
// --- END DYNAMIC THRESHOLDS ---

// Categorized and pre-sorted list of major UK counties
const ukCountiesByCategory = {
    "England": [
        "Bedfordshire", "Berkshire", "Bristol", "Buckinghamshire", "Cambridgeshire",
        "Cheshire", "Cornwall", "County Durham", "Cumbria", "Derbyshire",
        "Devon", "Dorset", "East Sussex", "Essex", "Gloucestershire",
        "Greater London", "Greater Manchester", "Hampshire", "Herefordshire",
        "Hertfordshire", "Isle of Wight", "Kent", "Lancashire", "Leicestershire",
        "Lincolnshire", "Merseyside", "Norfolk", "Northamptonshire", "Northumberland",
        "North Yorkshire", "Nottinghamshire", "Oxfordshire", "Rutland",
        "Shropshire", "Somerset", "South Yorkshire", "Staffordshire", "Suffolk",
        "Surrey", "Tyne and Wear", "Warwickshire", "West Midlands", "West Sussex",
        "West Yorkshire", "Wiltshire", "Worcestershire"
    ].sort(),
    "Scotland": [
        "Aberdeenshire", "Angus", "Argyll and Bute", "City of Edinburgh",
        "Clackmannanshire", "Dumfries and Galloway", "Dundee", "East Ayrshire",
        "East Dunbartonshire", "East Lothian", "East Renfrewshire", "Falkirk",
        "Fife", "Glasgow", "Highland", "Midlothian",
        "Moray", "Na h-Eileanan Siar", "North Ayrshire", "North Lanarkshire",
        "Orkney Islands", "Perth and Kinross", "Renfrewshire", "Scottish Borders",
        "Shetland Islands", "South Ayrshire", "South Lanarkshire", "Stirling",
        "West Dunbartonshire", "West Lothian"
    ].sort(),
    "Wales": [
        "Blaenau Gwent", "Bridgend", "Caerphilly", "Cardiff", "Carmarthenshire",
        "Ceredigion", "Conwy", "Denbighshire", "Flintshire", "Gwynedd",
        "Isle of Anglesey", "Merthyr Tydfil", "Monmouthshire", "Neath Port Talbot",
        "Newport", "Pembrokeshire", "Powys", "Rhondda Cynon Taf", "Swansea",
        "Torfaen", "Vale of Glamorgan", "Wrexham"
    ].sort(),
    "Northern Ireland": [
        "Antrim", "Ards", "Armagh", "Ballymena", "Ballymoney", "Banbridge",
        "Belfast", "Carrickfergus", "Castlereagh", "Coleraine",
        "Cookstown", "Craigavon", "Derry", "Down", "Dungannon",
        "Fermanagh", "Larne", "Limavady", "Lisburn", "Magherafelt",
        "Moyle", "Newry and Mourne", "Newtownabbey", "North Down", "Omagh",
        "Strabane"
    ].sort()
};


async function fetchWeatherForCounty(county) {
    // We can specify units in the API request or extract directly from response objects
    // WeatherAPI.com provides wind_mph directly
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${county},UK&days=4&aqi=no&alerts=no`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Error fetching data for ${county}: Status ${response.status} - ${response.statusText}`);
            return { county: county, hasWarning: false, reason: ['Error fetching data'], hasHeatwave: false, heatwaveMessage: '', hasStormWarning: false, stormMessage: '', error: true };
        }
        const data = await response.json();

        // --- Wind/Rain Warning Logic (extended to 4 days) ---
        // Directly use wind_mph from the API response
        const currentWindMph = data.current?.wind_mph || 0;
        const currentPrecipMm = data.current?.precip_mm || 0;

        let hasSevereForecast = false;
        let forecastReasonDetails = [];
        
        // --- Storm Warning Logic ---
        let hasStormWarning = false;
        let stormMessage = ''; // Will store details of the first triggered storm condition

        if (data.forecast?.forecastday) {
            for (const dayForecast of data.forecast.forecastday) {
                if (dayForecast.hour) {
                    for (const hourData of dayForecast.hour) {
                        // Directly use wind_mph from the API response for forecast
                        const forecastWindMph = hourData.wind_mph || 0;
                        const forecastPrecipMm = hourData.precip_mm || 0;

                        let conditionsAtHour = [];
                        if (forecastWindMph > currentWindThresholdMph) { // Use dynamic threshold
                            conditionsAtHour.push(`Wind ${forecastWindMph.toFixed(1)}mph`);
                        }
                        if (forecastPrecipMm > currentRainThresholdMmHr) { // Use dynamic threshold
                            conditionsAtHour.push(`Rain ${forecastPrecipMm.toFixed(1)}mm/hr`);
                        }
                        
                        // Check for general severe warning (wind OR rain)
                        if (conditionsAtHour.length > 0) {
                            hasSevereForecast = true;
                            const dateTime = new Date(hourData.time).toLocaleString('en-GB', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                            });
                            forecastReasonDetails.push(`${dateTime}: ${conditionsAtHour.join(', ')}`);
                        }

                        // Check for "storm" condition (wind AND rain simultaneously)
                        if (forecastWindMph > currentWindThresholdMph && forecastPrecipMm > currentRainThresholdMmHr) { // Use dynamic thresholds
                            if (!hasStormWarning) { // Only capture details of the first instance
                                hasStormWarning = true;
                                const stormDateTime = new Date(hourData.time).toLocaleString('en-GB', {
                                    weekday: 'short',
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                });
                                stormMessage = `Expected: ${stormDateTime} (Wind ${forecastWindMph.toFixed(1)}mph & Rain ${forecastPrecipMm.toFixed(1)}mm/hr)`;
                            }
                        }
                    }
                }
            }
        }


        let reasons = []; // Reasons for the "YES" dropdown
        if (currentWindMph > currentWindThresholdMph || currentPrecipMm > currentRainThresholdMmHr) { // Use dynamic thresholds
            let currentConditions = [];
            if (currentWindMph > currentWindThresholdMph) { // Use dynamic threshold
                currentConditions.push(`Wind ${currentWindMph.toFixed(1)} mph`);
            }
            if (currentPrecipMm > currentRainThresholdMmHr) { // Use dynamic threshold
                currentConditions.push(`Rain ${currentPrecipMm.toFixed(1)} mm/hr`);
            }
            reasons.push(`Current conditions: ${currentConditions.join(' & ')}`);
        }
        
        if (forecastReasonDetails.length > 0) {
            reasons.push('Forecasted severe conditions:');
            reasons = reasons.concat(forecastReasonDetails);
        }

        const isRedWarningCondition = (currentWindMph > currentWindThresholdMph || currentPrecipMm > currentRainThresholdMmHr || hasSevereForecast); // Use dynamic thresholds


        // --- Heatwave Logic ---
        let hasHeatwave = false;
        let heatwaveMessage = '';
        
        if (data.forecast?.forecastday && data.forecast.forecastday.length >= currentConsecutiveDays) { // Use dynamic consecutive days
            let consecutiveHotDays = 0;
            let heatwaveStartDayIndex = -1;

            for (let i = 0; i < data.forecast.forecastday.length; i++) {
                const day = data.forecast.forecastday[i].day;
                if (day.maxtemp_c >= currentHeatwaveThresholdC) { // Use dynamic threshold
                    if (consecutiveHotDays === 0) {
                        heatwaveStartDayIndex = i;
                    }
                    consecutiveHotDays++;
                } else {
                    consecutiveHotDays = 0;
                    heatwaveStartDayIndex = -1;
                }

                if (consecutiveHotDays >= currentConsecutiveDays) { // Use dynamic consecutive days
                    hasHeatwave = true;
                    let totalHeatwaveDays = 0;
                    for (let j = heatwaveStartDayIndex; j < data.forecast.forecastday.length; j++) {
                        if (data.forecast.forecastday[j].day.maxtemp_c >= currentHeatwaveThresholdC) { // Use dynamic threshold
                            totalHeatwaveDays++;
                        } else {
                            break;
                        }
                    }
                    heatwaveMessage = `Expected: ${totalHeatwaveDays} days > ${currentHeatwaveThresholdC}°C`;
                    break;
                }
            }
        }

        return { 
            county: county, 
            hasWarning: isRedWarningCondition, 
            reason: reasons.length > 0 ? reasons : ['No specific severe conditions detected.'],
            hasHeatwave: hasHeatwave,
            heatwaveMessage: heatwaveMessage,
            hasStormWarning: hasStormWarning,
            stormMessage: stormMessage       
        };

    } catch (error) {
        console.error(`Network or parsing error for ${county}:`, error);
        return { county: county, hasWarning: false, reason: ['Network/Parsing Error'], hasHeatwave: false, heatwaveMessage: '', hasStormWarning: false, stormMessage: '', error: true };
    }
}

async function displayWeatherWarnings() {
    const countyListElement = document.getElementById('countyList');
    countyListElement.innerHTML = '<p class="loading-message">Loading weather data... This may take a moment due to multiple API calls.</p>';
    document.getElementById('fetchWeatherBtn').disabled = true;

    let hasOverallError = false;

    for (const country in ukCountiesByCategory) {
        const countrySection = document.createElement('div');
        countrySection.classList.add('country-section');

        const countryHeading = document.createElement('h2');
        countryHeading.textContent = country;
        countrySection.appendChild(countryHeading);

        const ulElement = document.createElement('ul');
        ulElement.id = `list-${country.replace(/\s/g, '')}`;
        countrySection.appendChild(ulElement);

        countyListElement.appendChild(countrySection);

        for (const county of ukCountiesByCategory[country]) {
            const weatherStatus = await fetchWeatherForCounty(county);
            const listItem = document.createElement('li');

            const countySummaryDiv = document.createElement('div');
            countySummaryDiv.classList.add('county-summary');

            const countyNameGroup = document.createElement('div');
            countyNameGroup.classList.add('county-name-group');

            const countyNameSpan = document.createElement('span');
            countyNameSpan.classList.add('county-name-text');
            countyNameSpan.textContent = county;
            countyNameGroup.appendChild(countyNameSpan);

            // --- Heatwave Icon and Tooltip ---
            if (weatherStatus.hasHeatwave) {
                const heatwaveStatusSpan = document.createElement('span');
                heatwaveStatusSpan.classList.add('tooltip-container');
                
                const heatwaveIconSpan = document.createElement('span');
                heatwaveIconSpan.classList.add('heatwave-icon');
                heatwaveIconSpan.textContent = '🔥';
                heatwaveStatusSpan.appendChild(heatwaveIconSpan);

                const heatwaveTooltipSpan = document.createElement('span');
                heatwaveTooltipSpan.classList.add('tooltip-content');
                heatwaveTooltipSpan.textContent = `Heatwave ${weatherStatus.heatwaveMessage}`;
                heatwaveStatusSpan.appendChild(heatwaveTooltipSpan);

                countyNameGroup.appendChild(heatwaveStatusSpan);
            }

            // --- Storm Icon and Tooltip ---
            if (weatherStatus.hasStormWarning) {
                const stormStatusSpan = document.createElement('span');
                stormStatusSpan.classList.add('tooltip-container');
                
                const stormIconSpan = document.createElement('span');
                stormIconSpan.classList.add('storm-icon');
                stormIconSpan.textContent = '⛈️'; // Cloud with lightning and rain emoji
                stormStatusSpan.appendChild(stormIconSpan);

                const stormTooltipSpan = document.createElement('span');
                stormTooltipSpan.classList.add('tooltip-content');
                stormTooltipSpan.textContent = `Storm: ${weatherStatus.stormMessage}`;
                stormStatusSpan.appendChild(stormTooltipSpan);

                countyNameGroup.appendChild(stormStatusSpan);
            }

            countySummaryDiv.appendChild(countyNameGroup);


            const statusAndArrowDiv = document.createElement('div');
            statusAndArrowDiv.classList.add('status-and-arrow');

            const statusSpan = document.createElement('span');
            statusSpan.classList.add('status-text');
            
            if (weatherStatus.error) {
                statusSpan.textContent = 'Error fetching';
                statusSpan.classList.add('status-error');
                statusSpan.title = weatherStatus.reason.join(', ');
                hasOverallError = true;
            } else if (weatherStatus.hasWarning) { // Main wind/rain warning
                statusSpan.textContent = `YES`;
                countySummaryDiv.classList.add('clickable');
                
                // Determine if it's "Red-level YES" or "Amber-level YES"
                if (weatherStatus.hasHeatwave || weatherStatus.hasStormWarning) {
                    // If heatwave OR storm is present, it's a more severe condition
                    statusSpan.classList.add('status-red');
                } else {
                    // Only wind OR rain, but no heatwave AND no storm - less severe
                    statusSpan.classList.add('status-amber');
                }
                
                const arrowSpan = document.createElement('span');
                arrowSpan.classList.add('dropdown-arrow');
                arrowSpan.innerHTML = '&#9660;';
                statusAndArrowDiv.appendChild(arrowSpan);

            } else {
                statusSpan.textContent = 'NO';
                statusSpan.classList.add('status-no');
            }
            statusAndArrowDiv.appendChild(statusSpan);
            countySummaryDiv.appendChild(statusAndArrowDiv);
            listItem.appendChild(countySummaryDiv);

            const reasonContainerDiv = document.createElement('div');
            reasonContainerDiv.classList.add('warning-reason-container');

            if (weatherStatus.hasWarning && !weatherStatus.error) {
                weatherStatus.reason.forEach(detail => {
                    const detailP = document.createElement('p');
                    detailP.classList.add('warning-reason-detail');
                    detailP.textContent = detail;
                    reasonContainerDiv.appendChild(detailP);
                });
            }
            listItem.appendChild(reasonContainerDiv);

            if (weatherStatus.hasWarning && !weatherStatus.error) {
                countySummaryDiv.addEventListener('click', () => {
                    countySummaryDiv.classList.toggle('expanded');
                    reasonContainerDiv.classList.toggle('expanded');
                });
            }

            ulElement.appendChild(listItem);
        }
    }

    document.getElementById('fetchWeatherBtn').disabled = false;

    const currentLoadingMessage = countyListElement.querySelector('.loading-message');
    if (currentLoadingMessage) {
        currentLoadingMessage.remove();
    }

    const completionMessage = document.createElement('p');
    completionMessage.classList.add('loading-message');
    if (hasOverallError) {
        completionMessage.textContent = 'Loading complete, but some data could not be fetched (see errors).';
        completionMessage.style.color = '#f39c12';
    } else {
        completionMessage.textContent = 'Loading successful! Data last updated: ' + new Date().toLocaleTimeString();
        completionMessage.style.color = '#27ae60';
    }
    countyListElement.prepend(completionMessage);
}


// --- Developer Tools Panel Logic ---

const devToolsPanel = document.getElementById('developerTools');
const windInput = document.getElementById('windThreshold');
const rainInput = document.getElementById('rainThreshold');
const heatwaveInput = document.getElementById('heatwaveThreshold');
const consecutiveDaysInput = document.getElementById('consecutiveDays');
const applyBtn = document.getElementById('applyThresholdsBtn');
const resetBtn = document.getElementById('resetThresholdsBtn');

// Function to load thresholds from localStorage or use defaults
function loadThresholds() {
    currentWindThresholdMph = parseFloat(localStorage.getItem('dev_windThreshold')) || DEFAULT_WIND_THRESHOLD_MPH;
    currentRainThresholdMmHr = parseFloat(localStorage.getItem('dev_rainThreshold')) || DEFAULT_RAIN_THRESHOLD_MM_HR;
    currentHeatwaveThresholdC = parseFloat(localStorage.getItem('dev_heatwaveThreshold')) || DEFAULT_HEATWAVE_THRESHOLD_C;
    currentConsecutiveDays = parseInt(localStorage.getItem('dev_consecutiveDays')) || DEFAULT_CONSECUTIVE_DAYS;

    // Populate input fields with current values
    windInput.value = currentWindThresholdMph.toFixed(2);
    rainInput.value = currentRainThresholdMmHr.toFixed(1);
    heatwaveInput.value = currentHeatwaveThresholdC;
    consecutiveDaysInput.value = currentConsecutiveDays;
}

// Function to save thresholds to localStorage and update active variables
function saveThresholds() {
    currentWindThresholdMph = parseFloat(windInput.value);
    currentRainThresholdMmHr = parseFloat(rainInput.value);
    currentHeatwaveThresholdC = parseFloat(heatwaveInput.value);
    currentConsecutiveDays = parseInt(consecutiveDaysInput.value);

    localStorage.setItem('dev_windThreshold', currentWindThresholdMph);
    localStorage.setItem('dev_rainThreshold', currentRainThresholdMmHr);
    localStorage.setItem('dev_heatwaveThreshold', currentHeatwaveThresholdC);
    localStorage.setItem('dev_consecutiveDays', currentConsecutiveDays);
}

// Event listener for keyboard shortcut (Ctrl + Shift + T)
document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.shiftKey && event.key === 'T') {
        event.preventDefault(); // Prevent default browser action for this key combo
        if (devToolsPanel.style.display === 'none' || devToolsPanel.style.display === '') {
            devToolsPanel.style.display = 'flex';
            loadThresholds(); // Load current values when panel is shown
        } else {
            devToolsPanel.style.display = 'none';
        }
    }
});

// Event listeners for developer panel buttons
applyBtn.addEventListener('click', () => {
    saveThresholds();
    displayWeatherWarnings(); // Refresh weather data with new thresholds
});

resetBtn.addEventListener('click', () => {
    windInput.value = DEFAULT_WIND_THRESHOLD_MPH.toFixed(2);
    rainInput.value = DEFAULT_RAIN_THRESHOLD_MM_HR.toFixed(1);
    heatwaveInput.value = DEFAULT_HEATWAVE_THRESHOLD_C;
    consecutiveDaysInput.value = DEFAULT_CONSECUTIVE_DAYS;
    saveThresholds(); // Save defaults
    displayWeatherWarnings(); // Refresh weather data with default thresholds
});

// Initial load of thresholds when script runs (if dev panel is shown manually or later)
loadThresholds();

// Initial event listener for the main fetch button
document.getElementById('fetchWeatherBtn').addEventListener('click', displayWeatherWarnings);