# Tweet Archive - Modern Searchable Web App

A modern, searchable web application for browsing 18,000+ tweets from 2007-2022.

## Features

🔍 **Instant Full-Text Search** - Search across all tweets with instant results
📊 **Analytics Dashboard** - Visualize your tweeting patterns, top hashtags, and most-mentioned accounts
🖼️ **Media Gallery** - Browse all your photos and videos in one place
🎨 **Dark Mode** - Modern UI with theme switching
⚡ **Fast & Responsive** - Built with React + Vite for optimal performance
💾 **Client-Side Storage** - Uses IndexedDB for instant searching without a backend
🔒 **Privacy First** - All data stays in your browser, no external servers

## Tech Stack

- **React 18** - Modern UI library
- **TypeScript** - Type-safe code
- **Vite** - Lightning-fast development
- **Tailwind CSS** - Modern styling
- **IndexedDB** - Client-side database
- **Chart.js** - Data visualizations
- **Lucide Icons** - Beautiful icons

## Project Structure

```
tweet-archive-app/       # Modern React app source
├── src/
│   ├── components/      # React components
│   ├── lib/            # Utilities and database helpers
│   ├── types/          # TypeScript types
│   └── App.tsx         # Main application
├── public/data/        # Converted tweet JSON files
└── scripts/            # Build scripts
data/                   # Original Twitter archive data
dist/                   # Built application (deployed to GitHub Pages)
```

## Development

### Prerequisites

- Node.js 20+
- npm 10+

### Setup

```bash
cd tweet-archive-app
npm install
```

### Convert Tweet Data

```bash
npm run convert
```

This converts the original Twitter JS files to clean JSON format.

### Development Server

```bash
npm run dev
```

Open http://localhost:5173

### Build for Production

```bash
npm run build
```

Output will be in `../dist/`

## Deployment

The app automatically deploys to GitHub Pages when pushed to the main branch via GitHub Actions.

## Original Twitter Archive

The original Twitter archive (2012-era browser) is still available in the root directory files:
- `index.html` - Original archive browser
- `data/js/` - Original JavaScript tweet files
- `tweets.csv` - CSV export of all tweets

## About

This is a modernized version of a Twitter archive export, transforming a 2012-era jQuery application into a modern, searchable React web app. The archive contains tweets from March 2007 to April 2022.

**Total Tweets:** 18,756
**Date Range:** 2007-2022
**Original Format:** Twitter's official archive export
