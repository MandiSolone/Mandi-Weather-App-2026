// global variables points //
let isCelsius = false;
let lastWeatherData = null;
let currentCity = "";
const locationKeyCache = {};
console.log("locationKeyCache:", locationKeyCache);

// Private AccuWeather API Key // Replace with "YOUR_API_KEY" for Github //
const API_KEY = "YOUR_API_KEY";

// Loading Spinner Icon //
const spinner = document.getElementById("spinner");

function showLoading() {
  spinner.hidden = false;
}

function hideLoading() {
  spinner.hidden = true;
}

// Searchbar Keyup Event Listener used with autoComplete() function below to add dropdown options //
// Only calls autoComplete function if value has changes, is > 3 characters, more then 300ms //
const myInput = document.getElementById("cityInput");

let debounceTimer;
const MIN_CHARS = 3;
const DELAY = 300; // ms
let lastValue = "";

myInput.addEventListener("keyup", () => {
  const currentValue = myInput.value;
  console.log("keyup currentValue:", currentValue);

  // Must have at least 4 chars and must change
  if (currentValue.length > MIN_CHARS && currentValue !== lastValue) {
    // window method to clear previous timer
    // window method setTimeout to only run if enough characters and the value changes
    clearTimeout(debounceTimer);

    debounceTimer = setTimeout(() => {
      autoComplete(currentValue);
      lastValue = currentValue;
    }, DELAY);
  }
});

// API CALL to Accuweather to Auto Populate Location Options In Drop Down List //
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

// Button Click || Enter Keyboard Event Handler To Capture City Entered //
// If Clicked //
const button = document.getElementById("searchBtn");
button.addEventListener("click", handleSearch);

// If Enter Button //
const input = document.getElementById("cityInput");
input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    handleSearch();
  }
});

// Main Function To Handle City Input in Search Bar, Order Of Operations Of Other Functions Called//
async function handleSearch() {
  showLoading(); // show loading icon
  // clear old UI elements //
  document.getElementById("toggleTemp").style.visibility = `hidden`;
  document.getElementById("weatherResult").style.visibility = `hidden`;
  document.getElementById("add-city-button").style.visibility = `hidden`;
  document.getElementById("errorMessage").textContent = "";

  try {
    const city = document.getElementById("cityInput").value;
    console.log("City entered:", city);

    if (city !== null && city.length > 0) {
      const locationKey = await getLocationKey(city);
      console.log("Location Key:", locationKey);

      const weather = await getWeather(locationKey);
      console.log("Weather Data:", weather);

      const currentCity = await formatCity(city);
      console.log("currentCity Key:", currentCity);

      displayWeather(currentCity, weather);
    } else {
      showError("City not entered");
    }
  } catch (error) {
    console.error("Error:", error.message);
    showError(error.message);
  } finally {
    hideLoading(); // always runs to turn loading icon off
    document.getElementById("searchedList").innerHTML = ""; // clear autocomplete dropdown list
    document.getElementById("cityInput").value = ""; // clear search bar text
  }
}

// Function to get var with stored session data locationKeyCache //
// or localStorage property, so even if page is refreshed //
// or the API, using City search URL from Accuweather //
async function getLocationKey(city) {
  const key = city.trim().toLowerCase();
  console.log("locationKeyCache:", locationKeyCache);

  // Check cache before calling the api //
  if (locationKeyCache[key]) {
    console.log("Using cached location key");
    return locationKeyCache[key];
  }
  // Check localStorage // should stay even on a refresh //
  const stored = localStorage.getItem(key);
  console.log("stored", stored);
  if (stored) {
    locationKeyCache[key] = stored;
    console.log("Using localStorage stored key");
    return stored;
  }
  try {
    console.log("Using API to get location key");
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
    // Returns the first/best result of the index for city //
    const locationKey = data[0].Key;

    // Save in both caches
    locationKeyCache[key] = locationKey;
    localStorage.setItem(key, locationKey);

    return locationKey;
  } catch (err) {
    console.error("Location error:", err);
    throw err; // re-throw so caller can handle it too
  }
}

// Third API call to get weather data using locationKey //
async function getWeather(locationKey) {
  const options = {
    method: "GET",
    headers: { Authorization: `Bearer ${API_KEY}` },
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

// Uppercase city entered for cleaner view in UI //
function formatCity(city) {
  return city
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Display weather results in UI //
function displayWeather(city, weather) {
  const weatherDisplayContainer = document.getElementById("weatherResult");
  lastWeatherData = weather;
  document.getElementById("add-city-button").style.visibility = `visible`;
  document.getElementById("weatherResult").style.visibility = `visible`;
  document.getElementById("toggleTemp").style.visibility = `visible`;

  const condition = weather?.WeatherText ?? "N/A";
  const humidity = weather?.RelativeHumidity ?? "N/A";
  const wind = weather?.Wind?.Speed?.Imperial?.Value ?? "N/A";
  const tempF = lastWeatherData.Temperature?.Imperial?.Value ?? "N/A";
  const tempC = lastWeatherData.Temperature?.Metric?.Value ?? "N/A";
  const temp = isCelsius ? `${tempC}°C` : `${tempF}°F`;
  const weatherIconId = weather?.WeatherIcon ?? "";

  weatherDisplayContainer.innerHTML = `
  <h2>${city}</h2>
  <p>Temperature: <span id="tempValue">${temp}</span></p> 
  <p>Condition: ${condition}</p>
  <p>Humidity: ${humidity}</p>
  <p>Wind Speed: ${wind}</p>
  <img src="https://www.accuweather.com/assets/images/weather-icons/v2a/${weatherIconId}.svg"/>
  `;
}

// Toggle with less rerendering //
document.getElementById("toggleTemp").addEventListener("click", () => {
  isCelsius = !isCelsius;
  updateTemperature();
});

// Function just for updating temp //
function updateTemperature() {
  const tempEl = document.getElementById("tempValue");
  if (!tempEl || !lastWeatherData) return;

  const tempF = lastWeatherData.Temperature?.Imperial?.Value;
  const tempC = lastWeatherData.Temperature?.Metric?.Value;

  tempEl.textContent = isCelsius ? `${tempC}°C` : `${tempF}°F`;
}

// Add Saved Cities //
const recentCities = new Set(); // use Set for methods //
const MAX_CITIES = 5;

// Handle the click //
document.getElementById("add-city-button").addEventListener("click", () => {
  const container = document.getElementById("weatherResult");
  const city = container.querySelector("h2").textContent;
  const addedCity = formatCity(city);
  console.log("addedCity :", addedCity);
  document.getElementById("cityListResults").style.visibility = `visible`;

  if (!addedCity) return;

  savedCity(addedCity);
});

function savedCity(addedCity) {
  if (addedCity) {
    // Manage the set (adds new, moves existing to end)
    if (recentCities.has(addedCity)) {
      recentCities.delete(addedCity);
    }
    recentCities.add(addedCity);

    // Limit list size (keep last 5)
    if (recentCities.size > MAX_CITIES) {
      const firstCity = recentCities.values().next().value;
      recentCities.delete(firstCity);
    }
    console.log("recentCities", recentCities);

    renderList();
  }

  function renderList() {
    const listContainer = document.getElementById("city-list");
    listContainer.innerHTML = "";

    // Transforms Set into Array to access Reverse functionality
    Array.from(recentCities).reverse().forEach((addedCity) => {
      const div = document.createElement("div");
      div.className = "city-item";
      div.textContent = addedCity;

      // Append the element, not the string
      listContainer.append(div);
    });
  }
}

// Handle clicking on saved cities //
// Add listener listcontainer and capture event to target that specific city //
document.getElementById("city-list").addEventListener("click", (e) => {
  if (e.target.classList.contains("city-item")) {
    const city = e.target.textContent;
    console.log("Clicked saved city:", city);

    // Populate into the search bar input at the top //
    const input = document.getElementById("cityInput");
    input.value = city;

    // Call handleSearch
    handleSearch();
  }
});

// UI display Error message //
function showError(message) {
  console.log("ERROR:", message);

  const errorDiv = document.getElementById("errorMessage");

  errorDiv.textContent = message;

  document.getElementById("weatherResult").innerHTML = "";
}
