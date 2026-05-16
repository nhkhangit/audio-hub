# MyAudioHub
## The Stoic Audio Studio

MyAudioHub is a minimalist, distraction-free audio management application designed with a Stoic aesthetic. It allows users to curate their own audio library by downloading high-quality tracks from various platforms and listening to them in a calm, focused environment.

Built for both web and mobile (Android via Capacitor), MyAudioHub prioritizes functionality, clarity, and the user's mental space.

---

## ✨ Features

- **Platform Integration**: Seamlessly download audio from **YouTube** and **TikTok**.
- **Minimalist Design**: A clean, "Stoic" interface that minimizes distractions and focuses on the music.
- **Offline Library**: All downloaded tracks are stored locally on your device for offline listening.
- **Background Playback**: Optimized for mobile with background mode support, allowing you to listen while performing other tasks.
- **Sequential Playback**: Automatically plays the next track in your library for a continuous experience.
- **Library Management**: Easy renaming and deletion of tracks to keep your library organized.

---

## 🛠 Tech Stack

- **Frontend**: React + Vite
- **Mobile Framework**: [Capacitor](https://capacitorjs.com/)
- **Icons**: Lucide React
- **APIs**: 
  - [Cobalt](https://api.cobalt.tools) (YouTube downloads)
  - [TikWM](https://www.tikwm.com/api/) (TikTok downloads)
- **Filesystem**: Capacitor Filesystem for persistent local storage.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (Latest LTS recommended)
- Android Studio (for Android builds)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/nhkhangit/audio-hub.git
   cd MyAudioHub
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run in development mode**:
   ```bash
   npm run dev
   ```

4. **Build and Sync with Android**:
   ```bash
   npm run build
   npx cap sync android
   npx cap open android
   ```

---

## 🏛 Stoic Philosophy in Design

MyAudioHub is built on the principle of **"Essentialism"**. We believe that your tools should serve you, not distract you. 
- **No Ads**: A pure listening experience.
- **No Algorithm**: You choose what you listen to.
- **No Clutter**: Every element on the screen has a purpose.

---

## 📜 License

This project is private and for personal use.

---

*Note: This project is part of a "Studio" initiative focusing on high-quality, focused digital tools.*
