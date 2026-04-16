// start //
console.log("App is working");

// global resets or starting points //
let isCelsius = false;
let lastWeatherData = null;
let currentCity = "";

// Private AccuWeather API Key // Replace with "YOUR_API_KEY" for Github //
const API_KEY = "YOUR_API_KEY";

// Button click || enter keyboard event handler to capture city entered //
// If clicked //
const button = document.getElementById("searchBtn");
button.addEventListener("click", handleSearch);

// enter button //
const input = document.getElementById("cityInput");
input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    handleSearch();
  }
});

// Searchbar Typing Event Listener //
const myInput = document.getElementById("cityInput");
let lastValue = myInput.value;

myInput.addEventListener("keyup", () => {
  const currentValue = myInput.value;
  console.log("keyup currentValue:", currentValue);

  // If current value changes, call the function
  if (currentValue !== null && currentValue !== lastValue) {
    autoComplete(currentValue);
    // Update lastValue so the function doesn't run again until another change
    lastValue = currentValue;
  }
});

async function handleSearch() {
  // clear old UI error message first
  document.getElementById("errorMessage").textContent = "";

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
    showError(error.message);
  }
}

async function autoComplete(currentValue) {
  const options = {
    method: "GET",
    headers: { Authorization: `Bearer ${API_KEY}` },
  };

  const data = await fetch(
    `https://dataservice.accuweather.com/locations/v1/cities/autocomplete?q=${currentValue}`,
    options,
  ).then((data) => data.json());

  console.log("AutoComplete:", data);

  // For Loop to pull the location data from the package returned //
  let htmlString = "";
  if (data !== null) {
    for (let i = 0; i < data.length; i++) {
      htmlString += `<option value=${data[i].LocalizedName}>${data[i].LocalizedName}</option>`;
    }
  }
  // add to html list //
  document.getElementById("searchedList").innerHTML = htmlString;

  return data;
}

// API_KEY GET to store locationKey //
// Using City search URL from Accuweather //
async function getLocationKey(city) {
  const options = {
    method: "GET",
    headers: { Authorization: `Bearer ${API_KEY}` },
  };
  const data = await fetch(
    `https://dataservice.accuweather.com/locations/v1/cities/search?q=${city}`,
    options,
  ).then((data) => data.json());

  console.log("Location data:", data);

  if (!data || data.length === 0) {
    throw new Error("City not found. Try a different spelling.");
  }
  // returns the first/best result of the array of that city name
  return data[0].Key;
}

// Second API call to get weather data using locationKey //
async function getWeather(locationKey) {
  const options = {
    method: "GET",
    headers: { Authorization: `Bearer ${API_KEY}` }
  };
  const data = await fetch(
    `https://dataservice.accuweather.com/currentconditions/v1/${locationKey}?details=true`,
    options,
  ).then((data) => data.json());

  console.log("Weather data:", data);

  if (!data || data.length === 0) {
    throw new Error("Weather not found.");
  }

  return data[0];
}


// Display weather results in UI //
function displayWeather(city, weather) {
  lastWeatherData = weather;

  const weatherDisplayContainer = document.getElementById("weatherResult");

  const condition = weather?.WeatherText ?? "N/A";
  const humidity = weather?.RelativeHumidity ?? "N/A";
  const wind = weather?.Wind?.Speed?.Imperial?.Value ?? "N/A";
  const tempF = weather?.Temperature?.Imperial?.Value ?? "N/A";
  const tempC = weather?.Temperature?.Metric?.Value ?? "N/A";
  const temp = isCelsius ? `${tempC}°C` : `${tempF}°F`;
  const weatherIconId = weather?.WeatherIcon;

  weatherDisplayContainer.innerHTML = `
  <h2>${city}</h2>
  <p>Temperature: ${temp}</p>
  <p>Condition: ${condition}</p>
  <p>Humidity: ${humidity}</p>
  <p>Wind Speed: ${wind}</p>
  <img src="https://www.accuweather.com/assets/images/weather-icons/v2a/${weatherIconId}.svg"/>
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

// UI display Error message //
function showError(message) {
  console.log("ERROR:", message);

  const errorDiv = document.getElementById("errorMessage");

  errorDiv.textContent = message;

  document.getElementById("weatherResult").innerHTML = "";
}
