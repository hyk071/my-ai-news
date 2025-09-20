# Project Overview

This is a Next.js application that serves as an AI News generation platform. It uses various language models (OpenAI, Gemini, Claude, Perplexity) to generate news articles. The application stores data, including articles and prompts, in JSON files within the `data/` directory.

## Key Technologies

*   **Framework:** Next.js
*   **Frontend:** React
*   **Backend:** Node.js (Next.js API routes)
*   **LLM Integrations:**
    *   OpenAI
    *   Google Gemini
    *   Anthropic Claude
    *   Perplexity
*   **Data Storage:** JSON files (for local testing)

## Architecture

The application is structured as a standard Next.js project:

*   `pages/`: Contains the main application pages and API routes.
    *   `pages/api/`: Handles backend logic, including LLM interactions and data storage.
    *   `pages/admin/`: Provides an admin interface for generating articles and managing prompts.
*   `data/`: Stores application data in JSON files.
*   `lib/`: Contains shared utility functions and constants.
*   `styles/`: Holds global CSS styles.
*   `utils/`: Contains utility functions.

# Building and Running

## Prerequisites

*   Node.js 18+

## Installation

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Set up environment variables by creating a `.env.local` file. You can use `.env.local.example` as a template.
    ```
    OPENAI_API_KEY=...
    GOOGLE_API_KEY=...
    ANTHROPIC_API_KEY=...
    PERPLEXITY_API_KEY=...
    ```

## Running the Application

*   **Development:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

*   **Production Build:**
    ```bash
    npm run build
    ```

*   **Start Production Server:**
    ```bash
    npm run start
    ```

## Key Endpoints

*   **Admin Home:** `/admin`
*   **Article Generation:** `/admin/generate`
*   **Prompt Management:** `/admin/prompts`

# Development Conventions

*   **Data Storage:** The application uses the local file system with JSON files for data storage. For a production environment, a database would be required.
*   **API Routes:** Backend logic is implemented using Next.js API routes in the `pages/api` directory.
*   **LLM Integration:** Each language model has its own API route for generating content.
*   **Prompts:** Prompts for the language models are managed through the admin interface and stored in `data/prompts.json`.
