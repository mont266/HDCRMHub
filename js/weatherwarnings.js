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
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${county},UK&days=1&aqi=no&alerts=no`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Error fetching data for ${county}: Status ${response.status} - ${response.statusText}`);
            return { county: county, hasWarning: false, reason: ['Error fetching data'], error: true }; // Reason as array
        }
        const data = await response.json();

        const currentWindKph = data.current?.wind_kph || 0;
        const currentPrecipMm = data.current?.precip_mm || 0;

        let hasSevereForecast = false;
        let forecastReasonDetails = []; // Will hold formatted forecast strings

        // --- WEATHER WARNING THRESHOLDS (Original values) ---
        const WIND_THRESHOLD_KPH = 5; // Wind over 60 kph (approx. 37 mph)
        const RAIN_THRESHOLD_MM_HR = 0.1; // Precipitation over 5 mm/hour (heavy rain)
        // --- END WEATHER WARNING THRESHOLDS ---


        if (data.forecast?.forecastday.length > 0) {
            // Check the next 6 hours of the forecast for severe conditions
            for (let i = 0; i < Math.min(data.forecast.forecastday[0].hour.length, 6); i++) {
                const hourData = data.forecast.forecastday[0].hour[i];
                if (hourData) {
                    let conditionsAtHour = [];
                    if (hourData.wind_kph > WIND_THRESHOLD_KPH) {
                        conditionsAtHour.push(`Wind ${hourData.wind_kph.toFixed(1)}kph`);
                    }
                    if (hourData.precip_mm > RAIN_THRESHOLD_MM_HR) {
                        conditionsAtHour.push(`Rain ${hourData.precip_mm.toFixed(1)}mm/hr`);
                    }
                    if (conditionsAtHour.length > 0) {
                        hasSevereForecast = true;
                        forecastReasonDetails.push(`At ${hourData.time.slice(11, 16)}: ${conditionsAtHour.join(', ')}`);
                    }
                }
            }
        }

        let reasons = []; // This will be the array of user-friendly reason strings

        if (currentWindKph > WIND_THRESHOLD_KPH || currentPrecipMm > RAIN_THRESHOLD_MM_HR) {
            let currentConditions = [];
            if (currentWindKph > WIND_THRESHOLD_KPH) {
                currentConditions.push(`Wind ${currentWindKph.toFixed(1)} kph`);
            }
            if (currentPrecipMm > RAIN_THRESHOLD_MM_HR) {
                currentConditions.push(`Rain ${currentPrecipMm.toFixed(1)} mm/hr`);
            }
            reasons.push(`Current conditions: ${currentConditions.join(' & ')}`);
        }
        
        if (forecastReasonDetails.length > 0) {
            reasons.push('Forecasted severe conditions:');
            reasons = reasons.concat(forecastReasonDetails); // Add individual forecast details
        }


        const isRedWarningCondition = (currentWindKph > WIND_THRESHOLD_KPH || currentPrecipMm > RAIN_THRESHOLD_MM_HR || hasSevereForecast);

        return { 
            county: county, 
            hasWarning: isRedWarningCondition, 
            // Return the array of reasons
            reason: reasons.length > 0 ? reasons : ['No specific severe conditions detected.']
        };

    } catch (error) {
        console.error(`Network or parsing error for ${county}:`, error);
        return { county: county, hasWarning: false, reason: ['Network/Parsing Error'], error: true };
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

            // --- County Summary (Clickable Area) ---
            const countySummaryDiv = document.createElement('div');
            countySummaryDiv.classList.add('county-summary');

            const countyNameSpan = document.createElement('span');
            countyNameSpan.classList.add('county-name-text');
            countyNameSpan.textContent = county;
            countySummaryDiv.appendChild(countyNameSpan);

            const statusAndArrowDiv = document.createElement('div');
            statusAndArrowDiv.classList.add('status-and-arrow');

            const statusSpan = document.createElement('span');
            statusSpan.classList.add('status-text');
            
            if (weatherStatus.error) {
                statusSpan.textContent = 'Error fetching';
                statusSpan.classList.add('status-error');
                statusSpan.title = weatherStatus.reason.join(', '); // Join for tooltip
                hasOverallError = true;
            } else if (weatherStatus.hasWarning) {
                statusSpan.textContent = `YES`;
                statusSpan.classList.add('status-yes');
                countySummaryDiv.classList.add('clickable');
                
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

            // --- Warning Reason (Collapsible Content) ---
            const reasonContainerDiv = document.createElement('div');
            reasonContainerDiv.classList.add('warning-reason-container');

            if (weatherStatus.hasWarning && !weatherStatus.error) {
                // Now, iterate through the array of reasons and create a <p> for each
                weatherStatus.reason.forEach(detail => {
                    const detailP = document.createElement('p');
                    detailP.classList.add('warning-reason-detail');
                    detailP.textContent = detail;
                    reasonContainerDiv.appendChild(detailP);
                });
            }
            listItem.appendChild(reasonContainerDiv);

            // --- Event Listener for Click-to-Expand ---
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

document.getElementById('fetchWeatherBtn').addEventListener('click', displayWeatherWarnings);