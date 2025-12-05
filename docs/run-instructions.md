# Citizen Hero Installation and Running Guide

This document explains how to download, install and run the Citizen Hero prototype locally. The prototype has a backend (a Flask web service) and a frontend (HTML/JS served by the backend). You can run everything locally with or without the optional Raindrop SmartInference integration.

## Prerequisites

- Python 3.8 or newer installed on your system
- Git installed (to clone the repository)
- Optional: Node.js and npm are **not** required because the frontend is plain HTML

## Quick start (default path)

git clone https://github.com/HooplaHoorah/power-suits-c-citizen-hero.git
cd power-suits-c-citizen-hero
python -m venv .venv && .venv\Scripts\activate  # or source .venv/bin/activate
pip install flask flask-cors python-dotenv requests
cd raindrop-backend
python app.py     # then open the printed URL in your browser


## Clone the repository

```bash
git clone https://github.com/HooplaHoorah/power-suits-c-citizen-hero.git
cd power-suits-c-citizen-hero
```

## Set up a Python virtual environment

It is recommended to run dependencies in a virtual environment:

### Windows PowerShell

```powershell
python -m venv .venv
.venv\Scripts\activate
```

### macOS/Linux

```bash
python3 -m venv .venv
source .venv/bin/activate
```

## Install dependencies

Citizen Hero uses Flask, Flask‑CORS and python‑dotenv. If there is no `requirements.txt` provided, install them manually:

```bash
pip install flask flask-cors python-dotenv requests
```

Alternatively, if a `requirements.txt` or `pyproject.toml` file appears in the repository in the future, you can install using:

```bash
pip install -r raindrop-backend/requirements.txt
```

## Optional: Enable Raindrop SmartInference

The quest generator works locally out of the box using a rule‑based logic. To upgrade it to use Raindrop SmartInference, you need credentials from LiquidMetal Raindrop:

1. Create a Raindrop account at <https://liquidmetal.run> and generate an API key.
2. In the `raindrop-backend` directory create a file named `.env`.
3. Add the following variables to `.env` (do **not** share these or commit them to Git):

```ini
RAINDROP_API_URL=https://<raindrop-base-url>
RAINDROP_API_KEY=<your-api-key>
```

If these variables are present, the backend will call Raindrop to generate quests. If they are missing, the backend falls back to the rule‑based generator.

## Run the backend

From the repository root, start the Flask app:

```bash
cd raindrop-backend
python app.py
```

The server should display a line like `* Running on http://127.0.0.1:5000` or similar. (It may use port 8000 or 5000.)

## Access the frontend

Open your web browser and navigate to the URL printed by the server, typically `http://127.0.0.1:5000` or `http://127.0.0.1:8000`. You should see the Citizen Hero onboarding screen where you can enter your call sign, age range, mission idea, and help mode. Answer the clarifying questions, generate your quest, and view your quest log.

## Running tests

Citizen Hero includes a few unit tests in the repository root that you can run with [pytest](https://docs.pytest.org/):

```bash
pytest test_generate_quest.py
pytest test_app.py
```

Make sure the backend is **not** running when you run the tests. These tests verify that the quest generator and API endpoints are working as expected.

## Troubleshooting

- **Missing requirements.txt** – If `pip install -r requirements.txt` fails because the file is missing, install the packages manually as shown above.
- **Cannot import flask_cors** – Install via `pip install flask-cors`.
- **Different port** – If you already have something running on port 5000, the app will choose the next available port; check the terminal output for the actual URL.

