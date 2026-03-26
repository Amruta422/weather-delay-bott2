# Yellow.ai Assignment 2

This project solves Assignment 2 in JavaScript using Node.js.

## What it does

- Reads the provided `orders.json` sample data.
- Fetches weather for all order cities concurrently using `Promise.all`.
- Marks orders as `Delayed` when the weather `main` status is `Rain`, `Snow`, or `Extreme`.
- Generates a weather-aware apology message for delayed orders.
- Handles invalid city errors without crashing the full run.
- Stores the API key in `.env` instead of hardcoding it.
- Writes the processed result to `orders.updated.json`.

## Tech stack

- JavaScript
- Node.js
- OpenWeatherMap Current Weather API
- `dotenv`

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create your environment file:

```bash
copy .env.example .env
```

3. Add your OpenWeatherMap API key inside `.env`:

```env
OPENWEATHER_API_KEY=your_real_api_key
```

## Run

```bash
npm start
```

## Output

After execution, the script creates:

- `orders.updated.json`

Each processed order may include:

- `weather`
- `apology_message` when delayed
- `weather_error` for invalid cities or failed lookups

## Assignment mapping

- Parallel fetching: implemented with `Promise.all`
- Golden flow: delayed status + personalized apology message
- Resilience: invalid city errors are logged and do not stop the script
- Security: API key is read from `.env`

## Submission checklist

- GitHub repository link
- Demo recording link
- Updated `orders.updated.json` after running with your API key
- AI log file included in this repo
