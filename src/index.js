const fs = require("fs/promises");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const API_KEY = process.env.OPENWEATHER_API_KEY;
const WEATHER_API_BASE_URL = "https://api.openweathermap.org/data/2.5/weather";
const DELAY_WEATHER_TYPES = new Set(["Rain", "Snow", "Extreme"]);
const ROOT_DIR = path.resolve(__dirname, "..");
const ORDERS_FILE = path.join(ROOT_DIR, "orders.json");
const OUTPUT_FILE = path.join(ROOT_DIR, "orders.updated.json");

function buildWeatherUrl(city) {
  const url = new URL(WEATHER_API_BASE_URL);
  url.searchParams.set("q", city);
  url.searchParams.set("appid", API_KEY);
  url.searchParams.set("units", "metric");
  return url.toString();
}

function createApologyMessage(order, weatherMain, weatherDescription) {
  const firstName = order.customer.trim().split(/\s+/)[0];
  const readableDescription = weatherDescription || weatherMain.toLowerCase();

  return `Hi ${firstName}, your order to ${order.city} is delayed due to ${readableDescription}. We appreciate your patience!`;
}

async function loadOrders() {
  const raw = await fs.readFile(ORDERS_FILE, "utf8");
  const orders = JSON.parse(raw);

  if (!Array.isArray(orders)) {
    throw new Error("orders.json must contain an array of orders.");
  }

  return orders;
}

async function fetchWeatherForOrder(order) {
  const response = await fetch(buildWeatherUrl(order.city));
  const payload = await response.json();

  if (!response.ok) {
    const error = new Error(payload.message || "Unknown weather API error.");
    error.status = response.status;
    throw error;
  }

  const weatherMain = payload.weather?.[0]?.main || "Unknown";
  const weatherDescription = payload.weather?.[0]?.description || "unknown weather";
  const shouldDelay = DELAY_WEATHER_TYPES.has(weatherMain);

  const updatedOrder = {
    ...order,
    status: shouldDelay ? "Delayed" : order.status,
    weather: {
      main: weatherMain,
      description: weatherDescription,
      temperature_celsius: payload.main?.temp ?? null
    }
  };

  if (shouldDelay) {
    updatedOrder.apology_message = createApologyMessage(
      order,
      weatherMain,
      weatherDescription
    );
  }

  return updatedOrder;
}

async function processOrder(order) {
  try {
    return await fetchWeatherForOrder(order);
  } catch (error) {
    return {
      ...order,
      status: "Error",
      weather_error: error.message
    };
  }
}
async function saveProcessedOrders(orders) {
  const content = JSON.stringify(orders, null, 2);
  await fs.writeFile(OUTPUT_FILE, content);
}

async function main() {
  if (!API_KEY) {
    throw new Error(
      "Missing OPENWEATHER_API_KEY. Create a .env file based on .env.example."
    );
  }

  const orders = await loadOrders();
  const processedOrders = await Promise.all(orders.map(processOrder));

  await saveProcessedOrders(processedOrders);

  const delayedCount = processedOrders.filter(
    (order) => order.status === "Delayed"
  ).length;
  const erroredCount = processedOrders.filter((order) => order.weather_error).length;
  console.table(
  processedOrders.map(order => ({
    order_id: order.order_id,
    customer: order.customer,
    city: order.city,
    status: order.status || "Pending",
    
  }))
);

  console.log(`Processed ${processedOrders.length} orders.`);
  console.log(`Delayed orders: ${delayedCount}`);
  console.log(`Orders with weather lookup errors: ${erroredCount}`);
  console.log(`Updated orders written to ${OUTPUT_FILE}`);
}

main().catch((error) => {
  console.error(`Fatal error: ${error.message}`);
  process.exitCode = 1;
});
