# Dictation Postcards 📮

> Speak your day into existence. A warm, tactile web application where your dictated thoughts are transformed into unique, hand-sketched generative postcards using an LLM and rough.js.

---

## 🌟 Overview

**Dictation Postcards** is an interactive, tactile experience designed around voice dictation. Users dictate how their day went directly onto a 3:2 paper postcard lying on a warm wooden desk. The backend sends the text to an LLM (Google Gemini or OpenAI), which translates the emotional nuances into art parameters (mood, 4-color palette, shape style, density, and a short poetic caption). The frontend renders a unique, hand-sketched postcard using **rough.js**, complete with 3D card flips, animated postage stamps and cancellation marks, audio feedback, and a bottom corkboard gallery.

---

## 🚀 Setup & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- npm (v9.0.0 or higher)

### 1. Backend Setup
1. Open a terminal and navigate to the `server/` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your `.env` configuration file from the template:
   ```bash
   # On Windows PowerShell:
   Copy-Item .env.example .env

   # On macOS / Linux:
   cp .env.example .env
   ```
4. Configure your `.env` file with your API key:
   ```env
   PORT=5000
   GEMINI_API_KEY=your_gemini_api_key_here
   # Or alternatively:
   # OPENAI_API_KEY=your_openai_api_key_here
   ```
5. Start the backend server:
   ```bash
   npm run dev
   ```
   *The server will start listening at `http://localhost:5000`.*

---

### 2. Frontend Setup
1. In a separate terminal, navigate to the `client/` directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend will be available at `http://localhost:5173`.*

---

## 🎙️ Wispr Flow Usage

**Dictation Postcards** is built to pair seamlessly with [Wispr Flow](https://www.wisprflow.ai/) for effortless voice dictation:

1. **Activate Hotkey**: Click into the handwritten message area on the postcard back and press your **Wispr Flow global hotkey** (default: `Fn` or your custom shortcut).
2. **Dictate Your Day**: Speak naturally about how your day unfolded—your victories, quiet moments, struggles, or reflections. Wispr Flow automatically transcribes your voice directly into the card in real-time.
3. **Generate Postcard**: Click the **Generate** button. The app communicates with the LLM to extract mood and parameters, animates a commemorative *"Dictated with Wispr Flow"* postage stamp and date postmark, and flips the card to reveal your custom sketched generative artwork.
4. **Interact & Flip**: Click anywhere on the postcard to flip between your artwork on the front and your handwritten message on the back.
5. **Download & Archive**: Download the front artwork as a PNG or view past postcards pinned to the corkboard strip at the bottom.

---

## 👥 Team

| Name | Role | Contact |
| :--- | :--- | :--- |
| **[Team Member Name]** | Product & Fullstack Engineering | `[email@example.com]` |
| **[Team Member Name]** | Design & Creative Direction | `[email@example.com]` |
| **[Team Member Name]** | LLM & Prompt Engineering | `[email@example.com]` |

*(Add your team members and contributors above)*

---

## 📜 Credits & External Assets

All external libraries, fonts, textures, and audio assets used in this project are listed below with placeholders for authors and licenses:

### Libraries & Frameworks
- **[rough.js](https://roughjs.com/)** — Hand-drawn, sketchy graphics engine.  
  *Author:* Preet Shihn  
  *License:* MIT License
- **[React](https://react.dev/)** & **[Vite](https://vitejs.dev/)** — UI library and build tool.  
  *License:* MIT License
- **[Express](https://expressjs.com/)** — Node.js backend server.  
  *License:* MIT License

### Typography
- **[Caveat](https://fonts.google.com/specimen/Caveat)** — Handwriting font for handwritten card inscriptions and labels.  
  *Author:* Vernon Adams  
  *License:* SIL Open Font License (OFL)

### Textures
- **Wood Desk Texture** (`src/assets/textures/wood-desk.svg` / `.jpg`)  
  *Author:* `[Placeholder: Author Name]`  
  *Source / URL:* `[Placeholder: https://example.com/asset-url]`  
  *License:* `[Placeholder: Creative Commons / Unsplash / Custom]`
- **Parchment Paper Texture** (`src/assets/textures/paper-texture.svg` / `.png`)  
  *Author:* `[Placeholder: Author Name]`  
  *Source / URL:* `[Placeholder: https://example.com/asset-url]`  
  *License:* `[Placeholder: Creative Commons / Public Domain / Custom]`
- **Corkboard Texture** (`src/assets/textures/corkboard.svg` / `.png`)  
  *Author:* `[Placeholder: Author Name]`  
  *Source / URL:* `[Placeholder: https://example.com/asset-url]`  
  *License:* `[Placeholder: Creative Commons / Public Domain / Custom]`

### Audio & Sound Effects
- **Stamp Thud Sound** (`src/assets/sounds/stamp.mp3`)  
  *Author:* `[Placeholder: Sound Designer Name]`  
  *Source / URL:* `[Placeholder: https://freesound.org/... or Custom]`  
  *License:* `[Placeholder: CC0 / CC-BY / Royalty-Free]`  
  *(Includes built-in Web Audio API synthesized impact oscillator fallback)*
- **Paper Rustle Sound** (`src/assets/sounds/rustle.mp3`)  
  *Author:* `[Placeholder: Sound Designer Name]`  
  *Source / URL:* `[Placeholder: https://freesound.org/... or Custom]`  
  *License:* `[Placeholder: CC0 / CC-BY / Royalty-Free]`  
  *(Includes built-in Web Audio API synthesized filtered noise sweep fallback)*
