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
            return { county: county, hasWarning: false, error: true };
        }
        const data = await response.json();

        const currentWindKph = data.current?.wind_kph || 0; // Use optional chaining and default to 0
        const currentPrecipMm = data.current?.precip_mm || 0;

        let hasSevereForecast = false;
        if (data.forecast?.forecastday.length > 0) { // Optional chaining for forecastday
            // Check the next 6 hours of the forecast for severe conditions
            for (let i = 0; i < Math.min(data.forecast.forecastday[0].hour.length, 6); i++) {
                const hourData = data.forecast.forecastday[0].hour[i];
                if (hourData) {
                    // Example thresholds for "red warning" simulation:
                    // Wind over 60 kph (approx. 37 mph) OR precipitation over 5 mm/hour (heavy rain)
                    if (hourData.wind_kph > 60 || hourData.precip_mm > 5) {
                        hasSevereForecast = true;
                        break;
                    }
                }
            }
        }

        const isRedWarningCondition = (currentWindKph > 60 || currentPrecipMm > 5 || hasSevereForecast);

        return { county: county, hasWarning: isRedWarningCondition };

    } catch (error) {
        console.error(`Network or parsing error for ${county}:`, error);
        return { county: county, hasWarning: false, error: true };
    }
}

async function displayWeatherWarnings() {
    const countyListElement = document.getElementById('countyList');
    countyListElement.innerHTML = '<p class="loading-message">Loading weather data... This may take a moment due to multiple API calls.</p>'; // Show loading message
    document.getElementById('fetchWeatherBtn').disabled = true; // Disable button while loading

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
            listItem.textContent = county + ': ';

            const statusSpan = document.createElement('span');
            if (weatherStatus.error) {
                statusSpan.textContent = 'Error fetching';
                statusSpan.classList.add('status-error');
                statusSpan.title = "Could not retrieve data for this county. Check console for details.";
            } else if (weatherStatus.hasWarning) {
                statusSpan.textContent = 'YES';
                statusSpan.classList.add('status-yes');
            } else {
                statusSpan.textContent = 'NO';
                statusSpan.classList.add('status-no');
            }
            listItem.appendChild(statusSpan);
            ulElement.appendChild(listItem);
        }
    }
    document.getElementById('fetchWeatherBtn').disabled = false; // Re-enable button after loading
}

// Add event listener to the button
document.getElementById('fetchWeatherBtn').addEventListener('click', displayWeatherWarnings);