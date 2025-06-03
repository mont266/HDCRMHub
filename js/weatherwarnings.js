// Removed KPH_TO_MPH as we will now directly use MPH from the API
// const KPH_TO_MPH = 0.621371;

// --- DEFAULT THRESHOLDS ---
const DEFAULT_WIND_THRESHOLD_MPH = 37.28;
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


const apiKey = '34285941a5314c92a81123428252805'; // Replace with your WeatherAPI.com API key

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
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${county},UK&days=4&aqi=no&alerts=no`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Error fetching data for ${county}: Status ${response.status} - ${response.statusText}`);
            return { county: county, hasWarning: false, reason: ['Error fetching data'], hasHeatwave: false, heatwaveMessage: '', hasStormWarning: false, stormMessage: '', error: true };
        }
        const data = await response.json();

        const currentWindMph = data.current?.wind_mph || 0;
        const currentPrecipMm = data.current?.precip_mm || 0;

        let hasSevereForecast = false;
        let forecastReasonDetails = [];

        let hasStormWarning = false;
        let stormMessage = '';

        if (data.forecast?.forecastday) {
            for (const dayForecast of data.forecast.forecastday) {
                if (dayForecast.hour) {
                    for (const hourData of dayForecast.hour) {
                        const forecastWindMph = hourData.wind_mph;
                        const forecastPrecipMm = hourData.precip_mm;

                        let conditionsAtHour = [];
                        if (forecastWindMph > currentWindThresholdMph) {
                            conditionsAtHour.push(`Wind ${forecastWindMph.toFixed(1)}mph`);
                        }
                        if (forecastPrecipMm > currentRainThresholdMmHr) {
                            conditionsAtHour.push(`Rain ${forecastPrecipMm.toFixed(1)}mm/hr`);
                        }

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

                        if (forecastWindMph > currentWindThresholdMph && forecastPrecipMm > currentRainThresholdMmHr) {
                            if (!hasStormWarning) {
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

        let reasons = [];
        if (currentWindMph > currentWindThresholdMph || currentPrecipMm > currentRainThresholdMmHr) {
            let currentConditions = [];
            if (currentWindMph > currentWindThresholdMph) {
                currentConditions.push(`Wind ${currentWindMph.toFixed(1)} mph`);
            }
            if (currentPrecipMm > currentRainThresholdMmHr) {
                currentConditions.push(`Rain ${currentPrecipMm.toFixed(1)} mm/hr`);
            }
            reasons.push(`Current conditions: ${currentConditions.join(' & ')}`);
        }

        if (forecastReasonDetails.length > 0) {
            reasons.push('Forecasted severe conditions:');
            reasons = reasons.concat(forecastReasonDetails);
        }

        const isRedWarningCondition = (currentWindMph > currentWindThresholdMph || currentPrecipMm > currentRainThresholdMmHr || hasSevereForecast);

        let hasHeatwave = false;
        let heatwaveMessage = '';

        if (data.forecast?.forecastday && data.forecast.forecastday.length >= currentConsecutiveDays) {
            let consecutiveHotDays = 0;
            let heatwaveStartDayIndex = -1;

            for (let i = 0; i < data.forecast.forecastday.length; i++) {
                const day = data.forecast.forecastday[i].day;
                if (day.maxtemp_c >= currentHeatwaveThresholdC) {
                    if (consecutiveHotDays === 0) {
                        heatwaveStartDayIndex = i;
                    }
                    consecutiveHotDays++;
                } else {
                    consecutiveHotDays = 0;
                    heatwaveStartDayIndex = -1;
                }

                if (consecutiveHotDays >= currentConsecutiveDays) {
                    hasHeatwave = true;
                    let totalHeatwaveDays = 0;
                    for (let j = heatwaveStartDayIndex; j < data.forecast.forecastday.length; j++) {
                        if (data.forecast.forecastday[j].day.maxtemp_c >= currentHeatwaveThresholdC) {
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

// Global references for elements that are *always* in the DOM after initial load.
// These are assigned values in DOMContentLoaded.
let searchIcon;
let countySearchInput;
let filterToggleContainer;
let showWarningsToggle;
let searchContainer;

async function displayWeatherWarnings() {
    const countyListElement = document.getElementById('countyList');
    const fetchWeatherBtn = document.getElementById('fetchWeatherBtn');
    fetchWeatherBtn.disabled = true;

    // Hide search and filter elements at the start of loading.
    // They are assumed to be static in the HTML and not moved/destroyed by innerHTML.
    if (searchIcon) searchIcon.style.display = 'none';
    if (countySearchInput) {
        countySearchInput.classList.remove('active');
        countySearchInput.value = ''; // Clear search input
        countySearchInput.style.width = '0'; // Reset width for transition
        countySearchInput.style.opacity = '0'; // Reset opacity for transition
    }
    if (filterToggleContainer) filterToggleContainer.classList.remove('active');
    if (searchContainer) searchContainer.style.display = 'none'; // Hide the entire search container
    if (filterToggleContainer) filterToggleContainer.style.display = 'none'; // Hide the entire filter toggle container

    // Clear only the dynamic content area and show loading message
    countyListElement.innerHTML = '<p class="loading-message">Loading weather data... This may take a moment due to multiple API calls.</p>';

    let hasOverallError = false;
    const allCountyListItems = [];

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
            listItem.dataset.countyName = county.toLowerCase();
            listItem.dataset.hasWarning = weatherStatus.hasWarning.toString();

            const countySummaryDiv = document.createElement('div');
            countySummaryDiv.classList.add('county-summary');

            const countyNameGroup = document.createElement('div');
            countyNameGroup.classList.add('county-name-group');

            const countyNameSpan = document.createElement('span');
            countyNameSpan.classList.add('county-name-text');
            countyNameSpan.textContent = county;
            countyNameGroup.appendChild(countyNameSpan);

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

            if (weatherStatus.hasStormWarning) {
                const stormStatusSpan = document.createElement('span');
                stormStatusSpan.classList.add('tooltip-container');
                const stormIconSpan = document.createElement('span');
                stormIconSpan.classList.add('storm-icon');
                stormIconSpan.textContent = '⛈️';
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
            } else if (weatherStatus.hasWarning) {
                statusSpan.textContent = `YES`;
                countySummaryDiv.classList.add('clickable');

                if (weatherStatus.hasHeatwave || weatherStatus.hasStormWarning) {
                    statusSpan.classList.add('status-red');
                } else {
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
                    listItem.classList.toggle('expanded-parent');
                });
            }

            ulElement.appendChild(listItem);
            allCountyListItems.push(listItem);
        }
    }

    fetchWeatherBtn.disabled = false;

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

    // *******************************************************************
    // REMOVED: Lines that inserted search/filter elements into countyListElement.
    // These are no longer needed because the elements are assumed to be static in the HTML.
    // countyListElement.insertBefore(searchContainer, completionMessage.nextSibling);
    // countyListElement.insertBefore(filterToggleContainer, searchContainer.nextSibling);
    // *******************************************************************

    // Show the search icon and search bar, and filter toggle after data is loaded
    // These `if (element)` checks ensure elements exist before styling.
    if (searchIcon) searchIcon.style.display = 'block';
    if (countySearchInput) {
        countySearchInput.classList.add('active');
        countySearchInput.style.width = '100%';
        countySearchInput.style.opacity = '1';
    }
    if (filterToggleContainer) filterToggleContainer.classList.add('active');
    if (searchContainer) searchContainer.style.display = 'flex'; // Show the search container
    if (filterToggleContainer) filterToggleContainer.style.display = 'flex'; // Show the filter toggle container

    window.allCountyListItems = allCountyListItems;
    applyAllFilters(); // Apply filters initially after load
}


// --- Search and Filter Functionality Logic ---

document.addEventListener('DOMContentLoaded', () => {
    // Get initial references for elements that are always present in the DOM.
    // These assignments happen once when the page is fully loaded.
    searchIcon = document.getElementById('searchIcon');
    countySearchInput = document.getElementById('countySearchInput');
    filterToggleContainer = document.getElementById('filterToggleContainer');
    showWarningsToggle = document.getElementById('showWarningsToggle');
    searchContainer = document.getElementById('searchContainer'); // Ensure this is also referenced

    // Attach event listeners here, after the elements are guaranteed to be in the DOM
    if (countySearchInput) countySearchInput.addEventListener('input', applyAllFilters);
    if (showWarningsToggle) showWarningsToggle.addEventListener('change', applyAllFilters);
});


function applyAllFilters() {
    // Add checks here for robustness, although with the new HTML structure,
    // these should always be found via getElementById in DOMContentLoaded.
    if (!countySearchInput || !showWarningsToggle) {
        console.warn("applyAllFilters called before search/toggle elements are ready. This should ideally not happen now.");
        return;
    }

    const searchTerm = countySearchInput.value.toLowerCase();
    const showOnlyWarnings = showWarningsToggle.checked;
    const countyListItems = window.allCountyListItems || [];

    let anyCountiesVisible = false;
    const allCountrySections = document.querySelectorAll('.country-section');

    // Hide all sections initially to re-evaluate visibility
    allCountrySections.forEach(section => {
        section.style.display = 'none';
    });

    countyListItems.forEach(item => {
        const countyName = item.dataset.countyName;
        const hasWarning = item.dataset.hasWarning === 'true';

        let isVisibleBySearch = countyName.includes(searchTerm);
        let isVisibleByWarningToggle = !showOnlyWarnings || hasWarning;

        if (isVisibleBySearch && isVisibleByWarningToggle) {
            item.classList.remove('hidden');
            item.style.display = 'flex'; // Ensure flex display for visible items
            anyCountiesVisible = true;
            // Ensure parent country section is visible if this item is visible
            item.closest('.country-section').style.display = 'block';
        } else {
            item.classList.add('hidden');
            item.style.display = 'none'; // Hide immediately if not matching
        }
    });

    const countyListElement = document.getElementById('countyList');
    let noResultsMessage = countyListElement.querySelector('#noResultsMessage');
    if (!noResultsMessage) {
        noResultsMessage = document.createElement('p');
        noResultsMessage.id = 'noResultsMessage';
        noResultsMessage.classList.add('loading-message');
        noResultsMessage.style.color = '#e74c3c';
        countyListElement.appendChild(noResultsMessage);
    }

    if (!anyCountiesVisible && (searchTerm !== '' || showOnlyWarnings)) {
        noResultsMessage.textContent = `No counties found matching your criteria.`;
        noResultsMessage.style.display = 'block';
    } else {
        noResultsMessage.style.display = 'none';
    }
}


// --- Developer Tools Panel Logic ---

// These elements are also assumed to be static in the HTML and always present
const devToolsPanel = document.getElementById('developerTools');
const windInput = document.getElementById('windThreshold');
const rainInput = document.getElementById('rainThreshold');
const heatwaveInput = document.getElementById('heatwaveThreshold');
const consecutiveDaysInput = document.getElementById('consecutiveDays');
const applyBtn = document.getElementById('applyThresholdsBtn');
const resetBtn = document.getElementById('resetThresholdsBtn');

function loadThresholds() {
    currentWindThresholdMph = parseFloat(localStorage.getItem('dev_windThreshold')) || DEFAULT_WIND_THRESHOLD_MPH;
    currentRainThresholdMmHr = parseFloat(localStorage.getItem('dev_rainThreshold')) || DEFAULT_RAIN_THRESHOLD_MM_HR;
    currentHeatwaveThresholdC = parseFloat(localStorage.getItem('dev_heatwaveThreshold')) || DEFAULT_HEATWAVE_THRESHOLD_C;
    currentConsecutiveDays = parseInt(localStorage.getItem('dev_consecutiveDays')) || DEFAULT_CONSECUTIVE_DAYS;

    if (windInput) windInput.value = currentWindThresholdMph.toFixed(2);
    if (rainInput) rainInput.value = currentRainThresholdMmHr.toFixed(1);
    if (heatwaveInput) heatwaveInput.value = currentHeatwaveThresholdC;
    if (consecutiveDaysInput) consecutiveDaysInput.value = currentConsecutiveDays;
}

function saveThresholds() {
    currentWindThresholdMph = windInput ? parseFloat(windInput.value) : DEFAULT_WIND_THRESHOLD_MPH;
    currentRainThresholdMmHr = rainInput ? parseFloat(rainInput.value) : DEFAULT_RAIN_THRESHOLD_MM_HR;
    currentHeatwaveThresholdC = heatwaveInput ? parseFloat(heatwaveInput.value) : DEFAULT_HEATWAVE_THRESHOLD_C;
    currentConsecutiveDays = consecutiveDaysInput ? parseInt(consecutiveDaysInput.value) : DEFAULT_CONSECUTIVE_DAYS;

    localStorage.setItem('dev_windThreshold', currentWindThresholdMph);
    localStorage.setItem('dev_rainThreshold', currentRainThresholdMmHr);
    localStorage.setItem('dev_heatwaveThreshold', currentHeatwaveThresholdC);
    localStorage.setItem('dev_consecutiveDays', currentConsecutiveDays);
}

document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.shiftKey && event.key === 'F') {
        event.preventDefault();
        if (devToolsPanel) {
            if (devToolsPanel.style.display === 'none' || devToolsPanel.style.display === '') {
                devToolsPanel.style.display = 'flex';
                loadThresholds();
            } else {
                devToolsPanel.style.display = 'none';
            }
        }
    }
});

if (applyBtn) {
    applyBtn.addEventListener('click', () => {
        saveThresholds();
        displayWeatherWarnings();
    });
}

if (resetBtn) {
    resetBtn.addEventListener('click', () => {
        if (windInput) windInput.value = DEFAULT_WIND_THRESHOLD_MPH.toFixed(2);
        if (rainInput) rainInput.value = DEFAULT_RAIN_THRESHOLD_MM_HR.toFixed(1);
        if (heatwaveInput) heatwaveInput.value = DEFAULT_HEATWAVE_THRESHOLD_C;
        if (consecutiveDaysInput) consecutiveDaysInput.value = DEFAULT_CONSECUTIVE_DAYS;
        saveThresholds();
        displayWeatherWarnings();
    });
}

loadThresholds();

document.getElementById('fetchWeatherBtn').addEventListener('click', displayWeatherWarnings);