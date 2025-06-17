# RSS News API

This project collects RSS feeds and uses Netlify Functions to generate summarized news content.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the project root and define the password used for authentication:

```bash
NEWS_PASS=your_password_here
```

Other environment variables required by existing functions (e.g. `GEMINI_API_KEY`) should also be set in this file.

3. Deploy to Netlify or run the functions locally using the Netlify CLI.

## Authentication

The application prompts for a password when loading `index.html`. The value is verified by the Netlify function `auth`. Ensure that `NEWS_PASS` is set in your environment or in `.env` so the authentication succeeds.
