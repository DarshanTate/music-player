document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const audio = document.getElementById("audio")
  const playBtn = document.getElementById("play")
  const prevBtn = document.getElementById("prev")
  const nextBtn = document.getElementById("next")
  const loopBtn = document.getElementById("loop")
  const muteBtn = document.getElementById("mute")
  const shuffleBtn = document.getElementById("shuffle-btn")
  const downloadBtn = document.getElementById("download")
  const progressBar = document.querySelector(".progress-bar")
  const progress = document.querySelector(".progress")
  const progressHandle = document.querySelector(".progress-handle")
  const currentTimeEl = document.getElementById("current-time")
  const durationEl = document.getElementById("duration")
  const volumeSlider = document.querySelector(".volume-slider")
  const volumeProgress = document.querySelector(".volume-progress")
  const volumeHandle = document.querySelector(".volume-handle")
  const playlistEl = document.getElementById("playlist")
  const coverEl = document.getElementById("cover")
  const titleEl = document.getElementById("title")
  const artistEl = document.getElementById("artist")
  const searchInput = document.getElementById("search")
  const themeSwitch = document.getElementById("theme-switch")
  const nowPlayingEl = document.querySelector(".now-playing")
  const playIcon = document.querySelector(".play-icon")
  const pauseIcon = document.querySelector(".pause-icon")
  const volumeHighIcon = document.querySelector(".volume-high")
  const volumeLowIcon = document.querySelector(".volume-low")
  const volumeMuteIcon = document.querySelector(".volume-mute")

  
  const songs = [
    {
      title: "aye re toofan",
      artist: "Ambient Collective",
      src:"./music/aye re toofan.mp3",
      cover: "./music/cover1.jpg",
    },
    {
      title: "kissik",
      artist: "Chill Wave",
      src: "./music/kissik.mp3",
      cover: "./music/cover1.jpg",
    },
    {
      title: "parindey",
      artist: "Jazz Ensemble",
      src: "./music/parindey.mp3",
      cover: "./music/cover2.jpg",
    },
    {
      title: "Electronic Dreams",
      artist: "Synth Master",
      src: "./music/aye re toofan.mp3",
      cover: "./music/cover1.jpg",
    },
    {
      title: "Acoustic Sunrise",
      artist: "Guitar Harmony",
      src: "./music/aye re toofan.mp3",
      cover: "./music/cover1.jpg",
    },
  ]

  // App state
  let currentSongIndex = 0
  let isPlaying = false
  let isShuffled = false
  const originalPlaylist = [...songs]
  let shuffledPlaylist = []
  let currentPlaylist = [...songs]
  let isDraggingProgress = false
  let isDraggingVolume = false
  let isMobile = window.innerWidth <= 768

  // Initialize player
  function init() {
    loadSong(currentSongIndex)
    renderPlaylist()
    loadUserPreferences()
    updateResponsiveLayout()

    // Set initial volume
    audio.volume = 0.7
    updateVolumeUI()

    // Add event listener for window resize
    window.addEventListener("resize", updateResponsiveLayout)
  }

  // Update layout based on screen size
  function updateResponsiveLayout() {
    isMobile = window.innerWidth <= 768
  }

  // Load song
  function loadSong(index) {
    if (!currentPlaylist[index]) {
      console.error("Invalid song index:", index)
      return
    }

    const song = currentPlaylist[index]

    // Set audio source
    audio.src = song.src

    // Update UI elements
    coverEl.src = song.cover
    titleEl.textContent = song.title
    artistEl.textContent = song.artist

    // Reset progress
    progress.style.width = "0%"
    progressHandle.style.left = "0%"
    currentTimeEl.textContent = "0:00"

    // Update playlist active item
    document.querySelectorAll(".playlist-item").forEach((item) => {
      item.classList.remove("active")
    })

    const activeItem = document.querySelector(`.playlist-item[data-index="${index}"]`)
    if (activeItem) {
      activeItem.classList.add("active")
      // Scroll to active item
      activeItem.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }

    // Preload audio
    audio.load()
  }

  // Format time in minutes and seconds
  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return "0:00"

    const min = Math.floor(seconds / 60)
    const sec = Math.floor(seconds % 60)
    return `${min}:${sec < 10 ? "0" : ""}${sec}`
  }

  // Update progress bar
  function updateProgress() {
    if (!isDraggingProgress && !isNaN(audio.duration)) {
      const { currentTime, duration } = audio
      const progressPercent = (currentTime / duration) * 100
      progress.style.width = `${progressPercent}%`
      progressHandle.style.left = `${progressPercent}%`
      currentTimeEl.textContent = formatTime(currentTime)
      durationEl.textContent = formatTime(duration)
    }
  }

  // Set progress bar
  function setProgress(e) {
    const width = progressBar.clientWidth
    const clickX = e.offsetX
    const duration = audio.duration

    if (!isNaN(duration) && duration > 0) {
      audio.currentTime = (clickX / width) * duration
    }
  }

  // Update volume UI
  function updateVolumeUI() {
    const volume = audio.volume
    volumeProgress.style.width = `${volume * 100}%`
    volumeHandle.style.left = `${volume * 100}%`

    // Update volume icon
    volumeHighIcon.style.display = "none"
    volumeLowIcon.style.display = "none"
    volumeMuteIcon.style.display = "none"

    if (audio.muted || volume === 0) {
      volumeMuteIcon.style.display = "block"
    } else if (volume < 0.5) {
      volumeLowIcon.style.display = "block"
    } else {
      volumeHighIcon.style.display = "block"
    }
  }

  // Set volume
  function setVolume(e) {
    const width = volumeSlider.clientWidth
    const clickX = e.offsetX
    let volume = clickX / width

    // Clamp volume between 0 and 1
    volume = Math.max(0, Math.min(1, volume))

    audio.volume = volume
    audio.muted = false
    updateVolumeUI()
    saveUserPreferences()
  }

  // Play/Pause song
  function togglePlay() {
    if (isPlaying) {
      pauseSong()
    } else {
      playSong()
    }
  }

  // Play song
  function playSong() {
    const playPromise = audio.play()

    // Handle play() promise to avoid DOMException
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          isPlaying = true
          playIcon.style.display = "none"
          pauseIcon.style.display = "block"
          nowPlayingEl.classList.add("playing")
        })
        .catch((error) => {
          console.error("Playback error:", error)
          // Auto-retry on user interaction
          playBtn.addEventListener("click", retryPlay, { once: true })
        })
    }
  }

  // Retry play on error
  function retryPlay() {
    playSong()
  }

  // Pause song
  function pauseSong() {
    isPlaying = false
    pauseIcon.style.display = "none"
    playIcon.style.display = "block"
    nowPlayingEl.classList.remove("playing")
    audio.pause()
  }

  // Previous song
  function prevSong() {
    currentSongIndex--
    if (currentSongIndex < 0) {
      currentSongIndex = currentPlaylist.length - 1
    }
    loadSong(currentSongIndex)
    if (isPlaying) {
      playSong()
    }
    saveUserPreferences()
  }

  // Next song
  function nextSong() {
    currentSongIndex++
    if (currentSongIndex > currentPlaylist.length - 1) {
      currentSongIndex = 0
    }
    loadSong(currentSongIndex)
    if (isPlaying) {
      playSong()
    }
    saveUserPreferences()
  }

  // Toggle mute
  function toggleMute() {
    audio.muted = !audio.muted
    updateVolumeUI()
    saveUserPreferences()
  }

  // Toggle loop
  function toggleLoop() {
    audio.loop = !audio.loop
    loopBtn.classList.toggle("active")
    saveUserPreferences()
  }

  // Toggle shuffle
  function toggleShuffle() {
    isShuffled = !isShuffled
    shuffleBtn.classList.toggle("active")

    if (isShuffled) {
      // Save current song
      const currentSong = currentPlaylist[currentSongIndex]

      // Create shuffled playlist
      shuffledPlaylist = [...originalPlaylist]
      for (let i = shuffledPlaylist.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffledPlaylist[i], shuffledPlaylist[j]] = [shuffledPlaylist[j], shuffledPlaylist[i]]
      }

      currentPlaylist = shuffledPlaylist

      // Find current song in shuffled playlist
      currentSongIndex = currentPlaylist.findIndex((song) => song.title === currentSong.title)
      if (currentSongIndex === -1) currentSongIndex = 0
    } else {
      // Save current song
      const currentSong = currentPlaylist[currentSongIndex]

      // Restore original playlist
      currentPlaylist = [...originalPlaylist]

      // Find current song in original playlist
      currentSongIndex = currentPlaylist.findIndex((song) => song.title === currentSong.title)
      if (currentSongIndex === -1) currentSongIndex = 0
    }

    renderPlaylist()
    saveUserPreferences()
  }

  // Download current song
  function downloadCurrentSong() {
    const song = currentPlaylist[currentSongIndex]
    const a = document.createElement("a")
    a.href = song.src
    a.download = `${song.title} - ${song.artist}.mp3`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  // Render playlist
  function renderPlaylist() {
    playlistEl.innerHTML = ""

    currentPlaylist.forEach((song, index) => {
      const li = document.createElement("li")
      li.className = `playlist-item ${index === currentSongIndex ? "active" : ""}`
      li.dataset.index = index

      li.innerHTML = `
        <img src="${song.cover}" alt="${song.title}" class="playlist-item-img">
        <div class="playlist-item-info">
          <div class="playlist-item-title">${song.title}</div>
          <div class="playlist-item-artist">${song.artist}</div>
        </div>
        <div class="playlist-item-duration">--:--</div>
      `

      li.addEventListener("click", () => {
        currentSongIndex = index
        loadSong(currentSongIndex)
        playSong()
        saveUserPreferences()
      })

      playlistEl.appendChild(li)
    })

    // Load duration for each song
    loadSongDurations()
  }

  // Load song durations
  function loadSongDurations() {
    currentPlaylist.forEach((song, index) => {
      const tempAudio = new Audio()
      tempAudio.src = song.src

      tempAudio.addEventListener("loadedmetadata", () => {
        const durationEl = document.querySelector(`.playlist-item[data-index="${index}"] .playlist-item-duration`)
        if (durationEl) {
          durationEl.textContent = formatTime(tempAudio.duration)
        }
      })

      tempAudio.addEventListener("error", () => {
        console.error(`Error loading audio for ${song.title}`)
      })
    })
  }

  // Filter playlist
  function filterPlaylist(query) {
    const items = document.querySelectorAll(".playlist-item")
    query = query.toLowerCase()

    items.forEach((item) => {
      const title = item.querySelector(".playlist-item-title").textContent.toLowerCase()
      const artist = item.querySelector(".playlist-item-artist").textContent.toLowerCase()

      if (title.includes(query) || artist.includes(query)) {
        item.style.display = "flex"
      } else {
        item.style.display = "none"
      }
    })
  }

  // Save user preferences to localStorage
  function saveUserPreferences() {
    try {
      const preferences = {
        volume: audio.volume,
        muted: audio.muted,
        loop: audio.loop,
        shuffle: isShuffled,
        currentSongIndex: currentSongIndex,
        theme: document.body.classList.contains("light-theme") ? "light" : "dark",
      }

      localStorage.setItem("musicPlayerPreferences", JSON.stringify(preferences))
    } catch (error) {
      console.error("Error saving preferences:", error)
    }
  }

  // Load user preferences from localStorage
  function loadUserPreferences() {
    try {
      const preferences = JSON.parse(localStorage.getItem("musicPlayerPreferences"))

      if (preferences) {
        // Set volume and mute state
        audio.volume = preferences.volume !== undefined ? preferences.volume : 0.7
        audio.muted = preferences.muted || false
        updateVolumeUI()

        // Set loop state
        audio.loop = preferences.loop || false
        if (audio.loop) {
          loopBtn.classList.add("active")
        }

        // Set shuffle state
        isShuffled = preferences.shuffle || false
        if (isShuffled) {
          shuffleBtn.classList.add("active")
          // Create shuffled playlist
          shuffledPlaylist = [...originalPlaylist]
          for (let i = shuffledPlaylist.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[shuffledPlaylist[i], shuffledPlaylist[j]] = [shuffledPlaylist[j], shuffledPlaylist[i]]
          }
          currentPlaylist = shuffledPlaylist
        }

        // Set theme
        if (preferences.theme === "light") {
          document.body.classList.add("light-theme")
          themeSwitch.checked = true
        }

        // Set current song
        if (
          preferences.currentSongIndex !== undefined &&
          preferences.currentSongIndex >= 0 &&
          preferences.currentSongIndex < currentPlaylist.length
        ) {
          currentSongIndex = preferences.currentSongIndex
        }
      }
    } catch (error) {
      console.error("Error loading preferences:", error)
    }
  }

  // Toggle theme
  function toggleTheme() {
    document.body.classList.toggle("light-theme")
    saveUserPreferences()
  }

  // Event listeners
  playBtn.addEventListener("click", togglePlay)
  prevBtn.addEventListener("click", prevSong)
  nextBtn.addEventListener("click", nextSong)
  loopBtn.addEventListener("click", toggleLoop)
  muteBtn.addEventListener("click", toggleMute)
  shuffleBtn.addEventListener("click", toggleShuffle)
  downloadBtn.addEventListener("click", downloadCurrentSong)
  themeSwitch.addEventListener("change", toggleTheme)

  // Progress bar events
  progressBar.addEventListener("click", setProgress)
  progressBar.addEventListener("mousedown", (e) => {
    isDraggingProgress = true
    setProgress(e)
  })
  progressBar.addEventListener("touchstart", (e) => {
    isDraggingProgress = true
    const touch = e.touches[0]
    const rect = progressBar.getBoundingClientRect()
    const offsetX = touch.clientX - rect.left
    setProgress({ offsetX })
  })

  // Volume slider events
  volumeSlider.addEventListener("click", setVolume)
  volumeSlider.addEventListener("mousedown", (e) => {
    isDraggingVolume = true
    setVolume(e)
  })
  volumeSlider.addEventListener("touchstart", (e) => {
    isDraggingVolume = true
    const touch = e.touches[0]
    const rect = volumeSlider.getBoundingClientRect()
    const offsetX = touch.clientX - rect.left
    setVolume({ offsetX })
  })

  // Document-wide mouse/touch events for dragging
  document.addEventListener("mousemove", (e) => {
    if (isDraggingProgress) {
      const rect = progressBar.getBoundingClientRect()
      const offsetX = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
      const percent = offsetX / rect.width

      progress.style.width = `${percent * 100}%`
      progressHandle.style.left = `${percent * 100}%`

      if (!isNaN(audio.duration)) {
        currentTimeEl.textContent = formatTime(percent * audio.duration)
      }
    }

    if (isDraggingVolume) {
      const rect = volumeSlider.getBoundingClientRect()
      const offsetX = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
      const percent = offsetX / rect.width

      audio.volume = percent
      audio.muted = false
      updateVolumeUI()
    }
  })

  document.addEventListener(
    "touchmove",
    (e) => {
      if (isDraggingProgress) {
        e.preventDefault()
        const touch = e.touches[0]
        const rect = progressBar.getBoundingClientRect()
        const offsetX = Math.max(0, Math.min(touch.clientX - rect.left, rect.width))
        const percent = offsetX / rect.width

        progress.style.width = `${percent * 100}%`
        progressHandle.style.left = `${percent * 100}%`

        if (!isNaN(audio.duration)) {
          currentTimeEl.textContent = formatTime(percent * audio.duration)
        }
      }

      if (isDraggingVolume) {
        e.preventDefault()
        const touch = e.touches[0]
        const rect = volumeSlider.getBoundingClientRect()
        const offsetX = Math.max(0, Math.min(touch.clientX - rect.left, rect.width))
        const percent = offsetX / rect.width

        audio.volume = percent
        audio.muted = false
        updateVolumeUI()
      }
    },
    { passive: false },
  )

  document.addEventListener("mouseup", () => {
    if (isDraggingProgress) {
      isDraggingProgress = false
      const percent = Number.parseFloat(progress.style.width) / 100
      if (!isNaN(audio.duration)) {
        audio.currentTime = percent * audio.duration
      }
    }

    if (isDraggingVolume) {
      isDraggingVolume = false
      saveUserPreferences()
    }
  })

  document.addEventListener("touchend", () => {
    if (isDraggingProgress) {
      isDraggingProgress = false
      const percent = Number.parseFloat(progress.style.width) / 100
      if (!isNaN(audio.duration)) {
        audio.currentTime = percent * audio.duration
      }
    }

    if (isDraggingVolume) {
      isDraggingVolume = false
      saveUserPreferences()
    }
  })

  // Search input event
  searchInput.addEventListener("input", (e) => {
    filterPlaylist(e.target.value)
  })

  // Audio events
  audio.addEventListener("timeupdate", updateProgress)
  audio.addEventListener("ended", () => {
    if (!audio.loop) {
      nextSong()
    }
  })

  audio.addEventListener("loadedmetadata", () => {
    durationEl.textContent = formatTime(audio.duration)
  })

  audio.addEventListener("error", (e) => {
    console.error("Audio error:", e)
    // Try to recover by moving to next song
    setTimeout(() => {
      nextSong()
    }, 2000)
  })

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    // Only process keyboard shortcuts if not in an input field
    if (e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") {
      if (e.code === "Space") {
        e.preventDefault()
        togglePlay()
      } else if (e.code === "ArrowLeft") {
        prevSong()
      } else if (e.code === "ArrowRight") {
        nextSong()
      } else if (e.code === "ArrowUp") {
        e.preventDefault()
        audio.volume = Math.min(1, audio.volume + 0.1)
        audio.muted = false
        updateVolumeUI()
        saveUserPreferences()
      } else if (e.code === "ArrowDown") {
        e.preventDefault()
        audio.volume = Math.max(0, audio.volume - 0.1)
        updateVolumeUI()
        saveUserPreferences()
      } else if (e.code === "KeyM") {
        toggleMute()
      } else if (e.code === "KeyL") {
        toggleLoop()
      } else if (e.code === "KeyS") {
        toggleShuffle()
      }
    }
  })

  // Initialize the player
  init()
})
