
console.log("App is working");

// global resets or starting points //
let isCelsius = false;
let lastWeatherData = null;
let currentCity = "";

// Private AccuWeather API Key // Replace with "YOUR_API_KEY" for Github //
// const API_KEY = "YOUR_API_KEY";
const API_KEY = "zpka_02429ca4d5034d448049446498632f6c_3f7104b2";


// API_KEY GET to store locationKey //
// Using City search URL from Accuweather //
async function getLocationKey(city) {
  const url = `https://dataservice.accuweather.com/locations/v1/cities/search?apikey=${API_KEY}&q=${city}`;

  const response = await fetch(url);
  const data = await response.json();
  console.log("Location data:", data);

  if (!data || data.length === 0) {
    throw new Error("City not found. Try a different spelling.");
  } 
  // returns the first/best result of the array of that city name
  return data[0].Key; 
}

// Second API call to get weather data using locationKey //
async function getWeather(locationKey) {
  const url = `https://dataservice.accuweather.com/currentconditions/v1/${locationKey}?apikey=${API_KEY}&details=true`;

  const response = await fetch(url);
  const data = await response.json();

  console.log("Weather data:", data);

    if (!data || data.length === 0) {
    throw new Error("Weather not found.");
  } 

  return data[0];
}


// Button click || enter keyboard event handler to capture city entered //
// If clicked //
const button = document.getElementById("searchBtn");
button.addEventListener("click", handleSearch);

// Enter key event (on input, NOT button) //
const input = document.getElementById("cityInput");
input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    handleSearch();
  }
});

async function handleSearch() {
  try {
    const city = document.getElementById("cityInput").value;
    console.log("City entered:", city);
    
    const locationKey = await getLocationKey(city);
    console.log("Location Key:", locationKey);

    currentCity = city; 

    const weather = await getWeather(locationKey); 
    console.log("Weather Data:", weather); 

    displayWeather(currentCity, weather);

  } catch (error) {
    console.error("Error:", error.message);
    showError("Error fetching data.");
  }
}

// Display weather results in UI //
function displayWeather(city, weather) {

  // Error to prevent crash //
  if (!weather) {
    showError("No weather data available. Try another spelling.");
    return;
  }

  lastWeatherData = weather;

  const weatherDisplayContainer = document.getElementById("weatherResult");

  const condition = weather?.WeatherText ?? "N/A";
  const humidity = weather?.RelativeHumidity ?? "N/A";
  const wind = weather?.Wind?.Speed?.Imperial?.Value ?? "N/A";
  const tempF = weather?.Temperature?.Imperial?.Value ?? "N/A";
  const tempC = weather?.Temperature?.Metric?.Value ?? "N/A";
  const temp = isCelsius ? `${tempC}°C` : `${tempF}°F`;

  // Use backticks ` & ${} string interpolation to insert variables //
  weatherDisplayContainer.innerHTML = `
  <h2>${city}</h2>
  <p>Temperature: ${temp}</p>
  <p>Condition: ${condition}</p>
  <p>Humidity: ${humidity}</p>
  <p>Wind Speed: ${wind}</p>
  `;
}

// Toggle Button °C / °F //
document.getElementById("toggleTemp").addEventListener("click", () => {
  isCelsius = !isCelsius;
  console.log("isCelsius:", isCelsius); 

  if (lastWeatherData) {
    displayWeather(currentCity, lastWeatherData);

  }
});

// Display error message // 
function showError(message) {
  console.log("ERROR:", message);

  const errorDiv = document.getElementById("errorMessage");
  
  errorDiv.textContent = message;

  document.getElementById("weatherResult").innerHTML = "";
}
