# Web Music Player

A clean, responsive music player built with HTML, CSS and JavaScript.

## Features
- Play/pause, previous/next controls
- Volume control with mute
- Progress bar with seeking
- Light/dark theme toggle
- Playlist with search
- Keyboard shortcuts

## Setup
1. Add your MP3 files to `/music` folder
2. Update `songs` array in `script.js`:
```js
const songs = [
  {
    title: "Song Name",
    artist: "Artist",
    src: "./music/song.mp3", 
    cover: "./music/cover.jpg"
  }
]
