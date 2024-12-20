// API configuration
const API_KEY = '880daf14ef43e4095f8e5f69b5f7a7f5';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const AIR_QUALITY_URL = 'https://api.openweathermap.org/data/2.5/air_pollution';

// DOM Elements
const searchInput = document.querySelector('.search-bar input');
const refreshBtn = document.querySelector('.refresh-btn');
const unitToggleBtns = document.querySelectorAll('.unit-toggle button');
const weatherIcon = document.querySelector('.weather-icon');
const temperatureDiv = document.querySelector('.temperature');
const dateDiv = document.querySelector('.date');
const weatherDescDiv = document.querySelector('.weather-desc');
const rainChanceDiv = document.querySelector('.rain-chance');
const locationSpan = document.querySelector('.location span');
const todayTab = document.querySelector('.tab:nth-child(1)');
const weekTab = document.querySelector('.tab:nth-child(2)');
const todayContent = document.querySelector('#today-content');
const weekContent = document.querySelector('#week-content');

// Initialize weather icons mapping
const weatherIcons = {
    '01d': '☀️',
    '01n': '🌙',
    '02d': '⛅',
    '02n': '☁️',
    '03d': '☁️',
    '03n': '☁️',
    '04d': '☁️',
    '04n': '☁️',
    '09d': '🌧️',
    '09n': '🌧️',
    '10d': '🌦️',
    '10n': '🌧️',
    '11d': '⛈️',
    '11n': '⛈️',
    '13d': '🌨️',
    '13n': '🌨️',
    '50d': '🌫️',
    '50n': '🌫️'
};

// Event Listeners
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        fetchWeather(searchInput.value);
    }
});

refreshBtn.addEventListener('click', () => {
    if (searchInput.value) {
        fetchWeather(searchInput.value);
    }
});

// Tab switching functionality
todayTab.addEventListener('click', () => {
    todayTab.classList.add('active');
    weekTab.classList.remove('active');
    todayContent.style.display = 'block';
    weekContent.style.display = 'none';
});

weekTab.addEventListener('click', async () => {
    weekTab.classList.add('active');
    todayTab.classList.remove('active');
    todayContent.style.display = 'none';
    weekContent.style.display = 'grid';
    if (searchInput.value) {
        await fetchWeeklyForecast(searchInput.value);
    }
});

unitToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        if (!btn.classList.contains('active')) {
            unitToggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (searchInput.value) {
                fetchWeather(searchInput.value);
            }
        }
    });
});

// Format date
function formatDate(date) {
    return date.toLocaleString('en-US', {
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Update weather UI
function updateWeatherUI(data, airQuality) {
    if (!data) return;

    const temp = Math.round(data.main.temp);
    const description = data.weather[0].description;
    const icon = data.weather[0].icon;
    const humidity = data.main.humidity;
    const visibility = (data.visibility / 1000).toFixed(1);
    const windSpeed = Math.round(data.wind.speed);
    const windDirection = data.wind.deg;
    const date = new Date();
    const sunriseTime = new Date(data.sys.sunrise * 1000);
    const sunsetTime = new Date(data.sys.sunset * 1000);
    const isDay = date > sunriseTime && date < sunsetTime;
    const uvIndex = calculateUVIndex(date, sunriseTime, sunsetTime, data.clouds.all);

    // Update UI elements
    weatherIcon.textContent = weatherIcons[icon] || '🌡️';
    const unit = document.querySelector('.unit-toggle button.active').textContent.trim();
temperatureDiv.textContent = `${temp}${unit}`;
    dateDiv.textContent = formatDate(new Date());
    weatherDescDiv.textContent = description;
    locationSpan.textContent = `${data.name}, ${data.sys.country}`;

    // Rain chance
    const rain = data.rain ? data.rain['1h'] || data.rain['3h'] || 0 : 0;
    const rainChance = Math.round((rain / 10) * 100); // Approximate percentage
    rainChanceDiv.textContent = `Rain - ${rainChance}%`;

    // Update highlights
    document.querySelector('.uv-meter .value').textContent = uvIndex;
    document.querySelector('.wind-status .value').textContent = windSpeed;
    document.querySelector('.wind-status .direction').textContent = getWindDirection(windDirection);
    document.querySelector('.sun-times .sunrise span').textContent = sunriseTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    document.querySelector('.sun-times .sunset span').textContent = sunsetTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    document.querySelector('.humidity .value').textContent = `${humidity}%`;
    document.querySelector('.humidity .status').textContent = getHumidityStatus(humidity);
    document.querySelector('.visibility .value').textContent = visibility;
    document.querySelector('.visibility .status').textContent = getVisibilityStatus(visibility);
    document.querySelector('.air-quality .value').textContent = airQuality;
    document.querySelector('.air-quality .status').textContent = getAirQualityStatus(airQuality);
}

// Helper functions for status text
function getHumidityStatus(humidity) {
    if (humidity <= 30) return 'Low';
    if (humidity <= 60) return 'Moderate';
    return 'High';
}

function getVisibilityStatus(visibility) {
    if (visibility <= 3) return 'Poor';
    if (visibility <= 7) return 'Average';
    return 'Good';
}

function getAirQualityStatus(aqi) {
    const statuses = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
    return statuses[aqi - 1] || 'Unknown';
}

function getWindDirection(degrees) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
}

function calculateUVIndex(currentTime, sunrise, sunset, cloudCover) {
    if (currentTime < sunrise || currentTime > sunset) return 0;

    // Get hours since sunrise
    const hoursSinceSunrise = (currentTime - sunrise) / (1000 * 60 * 60);
    const totalDaylight = (sunset - sunrise) / (1000 * 60 * 60);
    const middayOffset = Math.abs(hoursSinceSunrise - totalDaylight/2);

    // Base UV index based on time of day (highest at midday)
    let uvIndex = 10 - (middayOffset * 1.5);
    
    // Reduce for cloud cover
    uvIndex *= (1 - (cloudCover / 100) * 0.75);

    return Math.max(0, Math.min(11, Math.round(uvIndex)));
}

// Update weekly forecast UI
function updateWeeklyForecast(forecastList, units) {
    if (!forecastList) return;
    
    const weekContent = document.querySelector('#week-content');
    // Get one forecast per day (at noon)
    const dailyForecasts = forecastList.filter((item, index) => index % 8 === 0).slice(0, 5);
    
    weekContent.innerHTML = dailyForecasts.map(forecast => `
        <div class="forecast-day">
            <div class="day">${new Date(forecast.dt * 1000).toLocaleDateString('en-US', {weekday: 'short'})}</div>
            <div class="forecast-icon">${weatherIcons[forecast.weather[0].icon] || '🌡️'}</div>
            <div class="forecast-temp">${Math.round(forecast.main.temp)}°${units === 'metric' ? 'C' : 'F'}</div>
            <div class="forecast-desc">${forecast.weather[0].description}</div>
        </div>
    `).join('');
}

// Fetch weather data
async function fetchWeather(city) {
    try {
        const units = document.querySelector('.unit-toggle button.active').textContent.includes('C') ? 'metric' : 'imperial';
        
        // Fetch current weather
        const weatherResponse = await fetch(`${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=${units}`);
        if (!weatherResponse.ok) {
            throw new Error('City not found');
        }
        const weatherData = await weatherResponse.json();

        // Fetch air quality
        const aqResponse = await fetch(
            `${AIR_QUALITY_URL}?lat=${weatherData.coord.lat}&lon=${weatherData.coord.lon}&appid=${API_KEY}`
        );
        const aqData = await aqResponse.json();

        // Update UI
        updateWeatherUI(weatherData, aqData.list[0].main.aqi);

        // Fetch weekly forecast
        if (weekTab.classList.contains('active')) {
            await fetchWeeklyForecast(city);
        }

    } catch (error) {
        console.error('Error fetching weather data:', error);
        alert(error.message || 'Error fetching weather data. Please try again.');
    }
}

// Fetch weekly forecast
async function fetchWeeklyForecast(city) {
    try {
        const units = document.querySelector('.unit-toggle button.active').textContent.includes('C') ? 'metric' : 'imperial';
        
        // First get coordinates
        const coordResponse = await fetch(`${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=${units}`);
        const coordData = await coordResponse.json();
        
        // Then get 5-day forecast
        const forecastResponse = await fetch(
            `${BASE_URL}/forecast?lat=${coordData.coord.lat}&lon=${coordData.coord.lon}&appid=${API_KEY}&units=${units}`
        );
        const forecastData = await forecastResponse.json();
        
        // Update weekly forecast UI
        updateWeeklyForecast(forecastData.list, units);
    } catch (error) {
        console.error('Error fetching forecast:', error);
    }
}
