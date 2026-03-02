# Submission: Holly HR Assistant Take-Home

## 🚀 How to Run Locally

1.  **Clone the repository** and navigate to the project root.
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Set up environment variables**:
    Go to `https://aistudio.google.com/api-keys` and Create an API key.
    Create a `.env.local` file in the root directory and add your Google Gemini API key:
    ```env
    GOOGLE_GENERATIVE_AI_API_KEY=your_actual_key_here
    ```
    *Note: The app is configured to use `gemini-flash-latest` which is available on the Google AI Studio free tier.*
4.  **Run the development server**:
    ```bash
    npm run dev
    ```
5.  **Open the app**: Navigate to `http://localhost:3000/chat`.

---

## 🏗️ Technical Approach

### 1. High-Performance Data Matching (Scalability)
Instead of passing the entire JSON dataset to the LLM (which would fail as data grows), I implemented a **deterministic, code-based search engine**:
- **Inverted Index**: On startup, the system builds an inverted index mapping words to job record indices. This allows for $O(1)$ lookup regardless of dataset size, ensuring the solution scales efficiently to 100x more records.
- **Heuristic Scoring**: Matches are ranked based on word overlap. Specific "prefix" words like *Assistant*, *Associate*, *Junior*, and *Senior* are weighted at **0.5** if they appear at the start of a title, ensuring that higher-signal words (like "Sheriff" or "Meteorologist") drive the matching logic. This scoring and weighting can be fine tuned based on newer specifications or as the system grows.
- **Dynamic Jurisdiction Matching**: The system uses a **runtime n-gram joining strategy**. It checks all contiguous word combinations in the user's query (e.g., "San" + "Diego" = "sandiego") against known jurisdiction IDs. This avoid hardcoded alias lists and works dynamically for any jurisdiction present in the data.

### 2. Cross-Jurisdiction Data Linking
The system handles cases where data is split across jurisdictions. For example, if a user asks for the "Assistant Sheriff in Kern County":
1.  It finds the best job description match globally (San Diego's "Assistant Sheriff" code `0123`).
2.  It then uses that code to look up the salary record specifically for the requested jurisdiction (Kern County's code `0123`).

### 3. LLM Integration
Gemini is used strictly for **Natural Language Generation (NLG)**. It receives only the specifically filtered context (the exact job and salary record). This ensures low latency, minimal token usage, and prevents hallucinations by grounding the model in the provided JSON context.

---

## 🤖 AI Transparency & Assistance

In the spirit of Holly's AI-friendly culture, here is a breakdown of the AI assistance (Gemini CLI) utilized during this project:

- **Problem Solving**: AI was instrumental in diagnosing `404` and `429` HTTP errors with the Gemini API. It assisted in creating a diagnostic script (`list-models.mjs`) to identify available models for the free tier and suggested the move to `gemini-flash-latest` for broader compatibility.
- **Scaffolding for Gemini prompt creation**: AI assisted in structuring the system prompts used in `app/actions.ts` to ensure the model remains focused on the provided context.
- **Writeup Assistance**: This README and the code documentation were refined with AI assistance to ensure clarity, professional formatting, and accurate technical descriptions.

