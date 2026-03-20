# Lumière Salon

A luxury salon website built with Next.js 14, inspired by [Blosm Hair & Beauty](https://www.blosm.com.au/). Features an elegant, women-only salon aesthetic with soft rose tones, refined typography, and a premium UI.

## Features

- **Hero Section** – Welcome message with elegant gradient overlay
- **Stats** – Trust indicators (150+ Trusted by Women, 15 Years Luxury Experience)
- **Services** – Hair Styling, Beauty Treatments, Nail Care
- **Gallery** – Image gallery with salon photography
- **Testimonials** – Client feedback section
- **Footer** – Newsletter signup, contact info, and branding

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Cormorant Garamond & DM Sans fonts

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── layout.tsx      # Root layout with fonts
│   ├── page.tsx        # Home page
│   ├── globals.css     # Global styles
│   └── services/       # Services page
└── components/
    ├── Header.tsx      # Navigation (Home, Services, Login, Wallet)
    ├── Hero.tsx
    ├── Stats.tsx
    ├── Services.tsx
    ├── Gallery.tsx
    ├── Testimonials.tsx
    └── Footer.tsx
```

## Build

```bash
npm run build
npm start
```
