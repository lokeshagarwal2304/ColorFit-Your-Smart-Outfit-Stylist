// ColorFit - Smart Outfit Stylist Application
class ColorFit {
  constructor() {
    this.currentColors = []
    this.favorites = JSON.parse(localStorage.getItem("colorfit-favorites") || "[]")
    this.outfitPlans = JSON.parse(localStorage.getItem("colorfit-plans") || "{}")
    this.currentWeek = new Date()
    this.quizAnswers = []
    this.chatHistory = []

    this.init()
  }

  init() {
    this.setupEventListeners()
    this.setupNavigation()
    this.setupThemeToggle()
    this.setupImageUpload()
    this.setupChat()
    this.setupVoiceCommands()
    this.setupCalendar()
    this.setupQuiz()
    this.loadWardrobe()
    this.setupSearch()
  }

  setupEventListeners() {
    // Navigation
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault()
        const target = e.target.getAttribute("href").substring(1)
        this.showSection(target)
      })
    })

    // Tag cloud
    document.querySelectorAll(".tag").forEach((tag) => {
      tag.addEventListener("click", (e) => {
        const category = e.target.dataset.category
        this.showCategoryOutfits(category)
      })
    })

    // Get suggestions button
    document.getElementById("getSuggestions").addEventListener("click", () => {
      this.generateSuggestions()
    })

    // Clear wardrobe
    document.getElementById("clearWardrobe").addEventListener("click", () => {
      this.clearWardrobe()
    })

    // Calendar navigation
    document.getElementById("prevWeek").addEventListener("click", () => {
      this.navigateWeek(-1)
    })

    document.getElementById("nextWeek").addEventListener("click", () => {
      this.navigateWeek(1)
    })
  }

  setupNavigation() {
    const navLinks = document.querySelectorAll(".nav-link")
    const sections = document.querySelectorAll(".section")

    navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault()
        const targetId = link.getAttribute("href").substring(1)

        // Update active nav link
        navLinks.forEach((l) => l.classList.remove("active"))
        link.classList.add("active")

        // Show target section
        sections.forEach((s) => s.classList.remove("active"))
        document.getElementById(targetId).classList.add("active")
      })
    })
  }

  setupThemeToggle() {
    const themeToggle = document.getElementById("themeToggle")
    const currentTheme = localStorage.getItem("colorfit-theme") || "light"

    if (currentTheme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark")
      themeToggle.innerHTML = '<i class="fas fa-sun"></i>'
    }

    themeToggle.addEventListener("click", () => {
      const currentTheme = document.documentElement.getAttribute("data-theme")
      const newTheme = currentTheme === "dark" ? "light" : "dark"

      document.documentElement.setAttribute("data-theme", newTheme)
      localStorage.setItem("colorfit-theme", newTheme)

      themeToggle.innerHTML = newTheme === "dark" ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>'
    })
  }

  setupImageUpload() {
    const uploadArea = document.getElementById("uploadArea")
    const imageInput = document.getElementById("imageInput")
    const colorCanvas = document.getElementById("colorCanvas")

    uploadArea.addEventListener("click", () => {
      imageInput.click()
    })

    uploadArea.addEventListener("dragover", (e) => {
      e.preventDefault()
      uploadArea.style.borderColor = "var(--primary-color)"
    })

    uploadArea.addEventListener("dragleave", () => {
      uploadArea.style.borderColor = "var(--border-color)"
    })

    uploadArea.addEventListener("drop", (e) => {
      e.preventDefault()
      uploadArea.style.borderColor = "var(--border-color)"
      const files = e.dataTransfer.files
      if (files.length > 0) {
        this.processImage(files[0])
      }
    })

    imageInput.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        this.processImage(e.target.files[0])
      }
    })
  }

  processImage(file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        this.extractColors(img)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  }

  extractColors(img) {
    const canvas = document.getElementById("colorCanvas")
    const ctx = canvas.getContext("2d")

    canvas.width = img.width
    canvas.height = img.height
    ctx.drawImage(img, 0, 0)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const colors = this.getColorPalette(imageData)

    this.currentColors = colors
    this.displayColorPalette(colors)
  }

  getColorPalette(imageData) {
    const data = imageData.data
    const colorMap = new Map()

    // Sample every 10th pixel for performance
    for (let i = 0; i < data.length; i += 40) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const alpha = data[i + 3]

      if (alpha > 128) {
        // Skip transparent pixels
        const color = `rgb(${r},${g},${b})`
        colorMap.set(color, (colorMap.get(color) || 0) + 1)
      }
    }

    // Get top 6 colors
    const sortedColors = Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([color]) => color)

    return sortedColors
  }

  displayColorPalette(colors) {
    const palette = document.getElementById("colorPalette")
    const analysis = document.getElementById("colorAnalysis")

    palette.innerHTML = ""

    colors.forEach((color) => {
      const swatch = document.createElement("div")
      swatch.className = "color-swatch"
      swatch.style.backgroundColor = color
      swatch.setAttribute("data-color", this.rgbToHex(color))
      palette.appendChild(swatch)
    })

    analysis.style.display = "block"
  }

  rgbToHex(rgb) {
    const result = rgb.match(/\d+/g)
    return (
      "#" +
      result
        .map((x) => {
          const hex = Number.parseInt(x).toString(16)
          return hex.length === 1 ? "0" + hex : hex
        })
        .join("")
    )
  }

  generateSuggestions() {
    const suggestions = this.getOutfitSuggestions(this.currentColors)
    this.displaySuggestions(suggestions)

    // Show suggestions section
    document.getElementById("suggestionsGrid").style.display = "block"
    document.getElementById("silhouettePreview").style.display = "block"

    // Scroll to suggestions
    document.getElementById("suggestionsGrid").scrollIntoView({
      behavior: "smooth",
    })
  }

  getOutfitSuggestions(colors) {
    const suggestions = [
      {
        id: 1,
        title: "Classic Elegance",
        description: "Timeless combination perfect for formal occasions",
        colors: colors.slice(0, 3),
        category: "formal",
        icon: "fas fa-user-tie",
      },
      {
        id: 2,
        title: "Casual Chic",
        description: "Relaxed yet stylish for everyday wear",
        colors: colors.slice(1, 4),
        category: "casual",
        icon: "fas fa-tshirt",
      },
      {
        id: 3,
        title: "Summer Vibes",
        description: "Light and breezy for warm weather",
        colors: colors.slice(2, 5),
        category: "summer",
        icon: "fas fa-sun",
      },
      {
        id: 4,
        title: "Minimalist Modern",
        description: "Clean lines and simple sophistication",
        colors: colors.slice(0, 2),
        category: "minimalist",
        icon: "fas fa-circle",
      },
    ]

    return suggestions
  }

  displaySuggestions(suggestions) {
    const container = document.getElementById("suggestionsContainer")
    container.innerHTML = ""

    suggestions.forEach((suggestion, index) => {
      const card = document.createElement("div")
      card.className = "suggestion-card"
      card.style.animationDelay = `${index * 0.1}s`

      const isFavorited = this.favorites.some((fav) => fav.id === suggestion.id)

      card.innerHTML = `
                <div class="suggestion-image">
                    <i class="${suggestion.icon}"></i>
                </div>
                <div class="suggestion-content">
                    <h3 class="suggestion-title">${suggestion.title}</h3>
                    <p class="suggestion-description">${suggestion.description}</p>
                    <div class="suggestion-colors">
                        ${suggestion.colors
                          .map((color) => `<div class="suggestion-color" style="background-color: ${color}"></div>`)
                          .join("")}
                    </div>
                    <div class="suggestion-actions">
                        <button class="action-btn favorite-btn ${isFavorited ? "favorited" : ""}" 
                                data-id="${suggestion.id}">
                            <i class="fas fa-heart"></i> ${isFavorited ? "Favorited" : "Favorite"}
                        </button>
                        <button class="action-btn try-on-btn" data-id="${suggestion.id}">
                            <i class="fas fa-eye"></i> Try On
                        </button>
                        <button class="action-btn plan-btn" data-id="${suggestion.id}">
                            <i class="fas fa-calendar"></i> Plan
                        </button>
                    </div>
                </div>
            `

      // Add event listeners
      const favoriteBtn = card.querySelector(".favorite-btn")
      const tryOnBtn = card.querySelector(".try-on-btn")
      const planBtn = card.querySelector(".plan-btn")

      favoriteBtn.addEventListener("click", () => {
        this.toggleFavorite(suggestion)
      })

      tryOnBtn.addEventListener("click", () => {
        this.tryOnOutfit(suggestion)
      })

      planBtn.addEventListener("click", () => {
        this.planOutfit(suggestion)
      })

      container.appendChild(card)
    })
  }

  toggleFavorite(outfit) {
    const index = this.favorites.findIndex((fav) => fav.id === outfit.id)

    if (index > -1) {
      this.favorites.splice(index, 1)
    } else {
      this.favorites.push(outfit)
    }

    localStorage.setItem("colorfit-favorites", JSON.stringify(this.favorites))
    this.updateFavoriteButton(outfit.id)
    this.loadWardrobe()
  }

  updateFavoriteButton(outfitId) {
    const btn = document.querySelector(`[data-id="${outfitId}"].favorite-btn`)
    if (btn) {
      const isFavorited = this.favorites.some((fav) => fav.id === outfitId)
      btn.classList.toggle("favorited", isFavorited)
      btn.innerHTML = `<i class="fas fa-heart"></i> ${isFavorited ? "Favorited" : "Favorite"}`
    }
  }

  tryOnOutfit(outfit) {
    const overlay = document.getElementById("outfitOverlay")
    overlay.innerHTML = ""

    // Create visual representation of the outfit
    const outfitDiv = document.createElement("div")
    outfitDiv.style.cssText = `
            position: absolute;
            top: 80px;
            left: 20px;
            right: 20px;
            height: 120px;
            background: linear-gradient(45deg, ${outfit.colors.join(", ")});
            border-radius: 10px;
            opacity: 0.8;
        `

    overlay.appendChild(outfitDiv)

    // Animate the try-on
    outfitDiv.style.transform = "scale(0)"
    setTimeout(() => {
      outfitDiv.style.transition = "transform 0.5s ease"
      outfitDiv.style.transform = "scale(1)"
    }, 100)
  }

  planOutfit(outfit) {
    // Switch to planner section
    this.showSection("planner")

    // Highlight available days
    const days = document.querySelectorAll(".calendar-day")
    days.forEach((day) => {
      if (!day.classList.contains("has-outfit")) {
        day.style.border = "2px dashed var(--primary-color)"
        day.style.cursor = "pointer"

        day.onclick = () => {
          this.scheduleOutfit(day, outfit)
          days.forEach((d) => {
            d.style.border = ""
            d.onclick = null
          })
        }
      }
    })
  }

  scheduleOutfit(dayElement, outfit) {
    const date = dayElement.dataset.date
    this.outfitPlans[date] = outfit
    localStorage.setItem("colorfit-plans", JSON.stringify(this.outfitPlans))

    dayElement.classList.add("has-outfit")
    dayElement.innerHTML += `<div class="planned-outfit">${outfit.title}</div>`
  }

  loadWardrobe() {
    const grid = document.getElementById("wardrobeGrid")

    if (this.favorites.length === 0) {
      grid.innerHTML = `
                <div class="empty-wardrobe">
                    <i class="fas fa-tshirt"></i>
                    <p>Your saved outfits will appear here</p>
                </div>
            `
      return
    }

    grid.innerHTML = ""

    this.favorites.forEach((outfit) => {
      const item = document.createElement("div")
      item.className = "wardrobe-item"
      item.innerHTML = `
                <div class="suggestion-image">
                    <i class="${outfit.icon}"></i>
                </div>
                <h3>${outfit.title}</h3>
                <p>${outfit.description}</p>
                <div class="suggestion-colors">
                    ${outfit.colors
                      .map((color) => `<div class="suggestion-color" style="background-color: ${color}"></div>`)
                      .join("")}
                </div>
                <button class="btn-secondary remove-btn" data-id="${outfit.id}">
                    <i class="fas fa-trash"></i> Remove
                </button>
            `

      const removeBtn = item.querySelector(".remove-btn")
      removeBtn.addEventListener("click", () => {
        this.toggleFavorite(outfit)
      })

      grid.appendChild(item)
    })
  }

  clearWardrobe() {
    if (confirm("Are you sure you want to clear your entire wardrobe?")) {
      this.favorites = []
      localStorage.removeItem("colorfit-favorites")
      this.loadWardrobe()
    }
  }

  setupCalendar() {
    this.updateCalendar()
  }

  updateCalendar() {
    const grid = document.getElementById("calendarGrid")
    const weekSpan = document.getElementById("currentWeek")

    const startOfWeek = new Date(this.currentWeek)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())

    const weekDates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      weekDates.push(date)
    }

    weekSpan.textContent = `Week of ${startOfWeek.toLocaleDateString()}`

    grid.innerHTML = ""

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

    weekDates.forEach((date, index) => {
      const dateStr = date.toISOString().split("T")[0]
      const plannedOutfit = this.outfitPlans[dateStr]

      const dayElement = document.createElement("div")
      dayElement.className = `calendar-day ${plannedOutfit ? "has-outfit" : ""}`
      dayElement.dataset.date = dateStr

      dayElement.innerHTML = `
                <div class="day-name">${dayNames[index]}</div>
                <div class="day-date">${date.getDate()}</div>
                ${plannedOutfit ? `<div class="planned-outfit">${plannedOutfit.title}</div>` : ""}
            `

      grid.appendChild(dayElement)
    })
  }

  navigateWeek(direction) {
    this.currentWeek.setDate(this.currentWeek.getDate() + direction * 7)
    this.updateCalendar()
  }

  setupChat() {
    const chatToggle = document.getElementById("chatToggle")
    const chatContainer = document.getElementById("chatContainer")
    const closeChatBtn = document.getElementById("closeChatBtn")
    const chatInput = document.getElementById("chatInput")
    const sendChatBtn = document.getElementById("sendChatBtn")

    chatToggle.addEventListener("click", () => {
      chatContainer.classList.toggle("active")
    })

    closeChatBtn.addEventListener("click", () => {
      chatContainer.classList.remove("active")
    })

    sendChatBtn.addEventListener("click", () => {
      this.sendMessage()
    })

    chatInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.sendMessage()
      }
    })
  }

  sendMessage() {
    const input = document.getElementById("chatInput")
    const message = input.value.trim()

    if (!message) return

    this.addMessage(message, "user")
    input.value = ""

    // Simulate bot response
    setTimeout(() => {
      const response = this.generateBotResponse(message)
      this.addMessage(response, "bot")
    }, 1000)
  }

  addMessage(content, sender) {
    const messagesContainer = document.getElementById("chatMessages")
    const messageDiv = document.createElement("div")
    messageDiv.className = `message ${sender}-message`

    messageDiv.innerHTML = `
            <div class="message-content">${content}</div>
        `

    messagesContainer.appendChild(messageDiv)
    messagesContainer.scrollTop = messagesContainer.scrollHeight
  }

  generateBotResponse(userMessage) {
    const message = userMessage.toLowerCase()

    if (message.includes("color") || message.includes("match")) {
      return "I can help you find perfect color combinations! Upload an image of your outfit and I'll analyze the colors to suggest matching pieces."
    } else if (message.includes("style") || message.includes("fashion")) {
      return "Great question about style! I recommend checking out our trending tags like #Minimalist or #Boho. What's your preferred style aesthetic?"
    } else if (message.includes("outfit") || message.includes("wear")) {
      return "For outfit suggestions, I need to know the occasion! Are you dressing for work, a date, casual day out, or a special event?"
    } else if (message.includes("plan") || message.includes("calendar")) {
      return "The outfit planner is perfect for organizing your weekly looks! You can schedule different outfits for each day and never repeat the same combination."
    } else if (message.includes("wardrobe")) {
      return "Your wardrobe section stores all your favorite outfit combinations. You can save looks you love and access them anytime!"
    } else if (message.includes("hello") || message.includes("hi")) {
      return "Hello! I'm your personal style assistant. I can help you with color matching, outfit suggestions, and fashion advice. What would you like to explore today?"
    } else {
      return "That's interesting! I'm here to help with all your fashion and styling needs. Try asking me about color combinations, outfit planning, or style advice!"
    }
  }

  setupVoiceCommands() {
    const voiceBtn = document.getElementById("voiceBtn")
    const voiceIndicator = document.getElementById("voiceIndicator")

    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()

      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = "en-US"

      voiceBtn.addEventListener("click", () => {
        recognition.start()
        voiceIndicator.style.display = "block"
      })

      recognition.onresult = (event) => {
        const command = event.results[0][0].transcript.toLowerCase()
        voiceIndicator.style.display = "none"
        this.processVoiceCommand(command)
      }

      recognition.onerror = () => {
        voiceIndicator.style.display = "none"
      }

      recognition.onend = () => {
        voiceIndicator.style.display = "none"
      }
    } else {
      voiceBtn.style.display = "none"
    }
  }

  processVoiceCommand(command) {
    if (command.includes("home") || command.includes("start")) {
      this.showSection("home")
    } else if (command.includes("wardrobe") || command.includes("favorites")) {
      this.showSection("wardrobe")
    } else if (command.includes("planner") || command.includes("calendar")) {
      this.showSection("planner")
    } else if (command.includes("quiz") || command.includes("style")) {
      this.showSection("quiz")
    } else if (command.includes("chat") || command.includes("assistant")) {
      document.getElementById("chatContainer").classList.add("active")
    } else if (command.includes("dark mode") || command.includes("night mode")) {
      document.getElementById("themeToggle").click()
    } else {
      // Send voice command to chat
      document.getElementById("chatInput").value = command
      this.sendMessage()
    }
  }

  setupQuiz() {
    const quizOptions = document.querySelectorAll(".quiz-option")

    quizOptions.forEach((option) => {
      option.addEventListener("click", () => {
        // Remove previous selections
        quizOptions.forEach((opt) => opt.classList.remove("selected"))
        option.classList.add("selected")

        const style = option.dataset.style
        this.showQuizResult(style)
      })
    })
  }

  showQuizResult(style) {
    const resultDiv = document.getElementById("quizResult")
    const styleResult = resultDiv.querySelector(".style-result")

    const styleProfiles = {
      casual: {
        title: "Casual Comfort",
        description: "You love comfortable, laid-back styles that are perfect for everyday wear.",
        colors: ["#denim", "#white", "#gray"],
        tips: "Focus on versatile basics like jeans, t-shirts, and sneakers.",
      },
      boho: {
        title: "Bohemian Spirit",
        description: "You're drawn to free-spirited, artistic styles with flowing fabrics.",
        colors: ["#earth-tones", "#burgundy", "#mustard"],
        tips: "Embrace flowy dresses, layered jewelry, and natural textures.",
      },
      minimalist: {
        title: "Minimalist Chic",
        description: "You prefer clean lines, simple silhouettes, and timeless pieces.",
        colors: ["#black", "#white", "#beige"],
        tips: "Invest in quality basics and focus on fit and fabric.",
      },
      street: {
        title: "Street Style Edge",
        description: "You love trendy, urban-inspired looks with a modern edge.",
        colors: ["#black", "#neon", "#metallic"],
        tips: "Mix high and low pieces, experiment with bold accessories.",
      },
    }

    const profile = styleProfiles[style]

    styleResult.innerHTML = `
            <div class="style-match">
                <h4>${profile.title}</h4>
                <p>${profile.description}</p>
                <p><strong>Style Tip:</strong> ${profile.tips}</p>
            </div>
        `

    resultDiv.style.display = "block"

    // Scroll to result
    resultDiv.scrollIntoView({ behavior: "smooth" })
  }

  setupSearch() {
    const searchInput = document.getElementById("searchInput")
    const searchBtn = document.getElementById("searchBtn")

    const performSearch = () => {
      const query = searchInput.value.toLowerCase().trim()
      if (!query) return

      // Search through different categories
      const searchResults = this.searchContent(query)
      this.displaySearchResults(searchResults)
    }

    searchBtn.addEventListener("click", performSearch)

    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        performSearch()
      }
    })

    // Auto-suggest functionality
    searchInput.addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase()
      if (query.length > 2) {
        this.showSearchSuggestions(query)
      }
    })
  }

  searchContent(query) {
    const categories = {
      ethnic: ["traditional", "cultural", "ethnic", "indian", "asian"],
      summer: ["summer", "beach", "light", "bright", "tropical"],
      minimalist: ["minimal", "simple", "clean", "basic", "neutral"],
      formal: ["formal", "business", "professional", "suit", "office"],
      casual: ["casual", "everyday", "comfortable", "relaxed"],
      vintage: ["vintage", "retro", "classic", "old-school"],
      boho: ["boho", "bohemian", "hippie", "free-spirit", "artistic"],
      street: ["street", "urban", "trendy", "edgy", "modern"],
    }

    const results = []

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some((keyword) => keyword.includes(query) || query.includes(keyword))) {
        results.push(category)
      }
    }

    return results
  }

  displaySearchResults(results) {
    if (results.length === 0) {
      this.addMessage(`No results found. Try searching for styles like "minimalist", "boho", or "formal".`, "bot")
      return
    }

    // Show matching categories
    results.forEach((category) => {
      this.showCategoryOutfits(category)
    })
  }

  showSearchSuggestions(query) {
    // This could be expanded to show a dropdown with suggestions
    console.log(`Searching for: ${query}`)
  }

  showCategoryOutfits(category) {
    const categoryOutfits = this.getCategoryOutfits(category)
    this.displaySuggestions(categoryOutfits)

    // Show suggestions section
    document.getElementById("suggestionsGrid").style.display = "block"
    document.getElementById("suggestionsGrid").scrollIntoView({
      behavior: "smooth",
    })
  }

  getCategoryOutfits(category) {
    const outfitDatabase = {
      ethnic: [
        {
          id: 101,
          title: "Traditional Elegance",
          description: "Classic ethnic wear with modern touches",
          colors: ["#8B4513", "#DAA520", "#CD853F"],
          category: "ethnic",
          icon: "fas fa-star",
        },
        {
          id: 102,
          title: "Festival Ready",
          description: "Vibrant colors perfect for celebrations",
          colors: ["#FF6347", "#FFD700", "#FF69B4"],
          category: "ethnic",
          icon: "fas fa-fire",
        },
      ],
      summer: [
        {
          id: 201,
          title: "Beach Vibes",
          description: "Light and airy for sunny days",
          colors: ["#87CEEB", "#F0E68C", "#FFE4B5"],
          category: "summer",
          icon: "fas fa-sun",
        },
        {
          id: 202,
          title: "Tropical Paradise",
          description: "Bold prints and bright colors",
          colors: ["#FF7F50", "#98FB98", "#87CEFA"],
          category: "summer",
          icon: "fas fa-leaf",
        },
      ],
      minimalist: [
        {
          id: 301,
          title: "Clean Lines",
          description: "Simple sophistication at its best",
          colors: ["#000000", "#FFFFFF", "#C0C0C0"],
          category: "minimalist",
          icon: "fas fa-circle",
        },
        {
          id: 302,
          title: "Neutral Harmony",
          description: "Soft tones for effortless elegance",
          colors: ["#F5F5DC", "#D2B48C", "#A0A0A0"],
          category: "minimalist",
          icon: "fas fa-square",
        },
      ],
      formal: [
        {
          id: 401,
          title: "Business Professional",
          description: "Sharp and polished for the workplace",
          colors: ["#000080", "#FFFFFF", "#C0C0C0"],
          category: "formal",
          icon: "fas fa-user-tie",
        },
        {
          id: 402,
          title: "Evening Elegance",
          description: "Sophisticated looks for special occasions",
          colors: ["#000000", "#800080", "#C0C0C0"],
          category: "formal",
          icon: "fas fa-gem",
        },
      ],
      casual: [
        {
          id: 501,
          title: "Weekend Comfort",
          description: "Relaxed and comfortable for leisure time",
          colors: ["#4169E1", "#FFFFFF", "#808080"],
          category: "casual",
          icon: "fas fa-tshirt",
        },
        {
          id: 502,
          title: "Everyday Easy",
          description: "Effortless style for daily activities",
          colors: ["#228B22", "#F5DEB3", "#CD853F"],
          category: "casual",
          icon: "fas fa-coffee",
        },
      ],
      vintage: [
        {
          id: 601,
          title: "Retro Revival",
          description: "Classic styles with a nostalgic twist",
          colors: ["#8B0000", "#F5DEB3", "#2F4F4F"],
          category: "vintage",
          icon: "fas fa-record-vinyl",
        },
        {
          id: 602,
          title: "70s Inspired",
          description: "Groovy patterns and earthy tones",
          colors: ["#B8860B", "#CD853F", "#A0522D"],
          category: "vintage",
          icon: "fas fa-peace",
        },
      ],
      boho: [
        {
          id: 701,
          title: "Free Spirit",
          description: "Flowing fabrics and artistic flair",
          colors: ["#8B4513", "#DAA520", "#CD853F"],
          category: "boho",
          icon: "fas fa-feather",
        },
        {
          id: 702,
          title: "Bohemian Rhapsody",
          description: "Eclectic mix of patterns and textures",
          colors: ["#800080", "#FF6347", "#DAA520"],
          category: "boho",
          icon: "fas fa-palette",
        },
      ],
      street: [
        {
          id: 801,
          title: "Urban Edge",
          description: "Modern street style with attitude",
          colors: ["#000000", "#FF0000", "#C0C0C0"],
          category: "street",
          icon: "fas fa-city",
        },
        {
          id: 802,
          title: "Trendsetter",
          description: "Latest fashion trends and bold choices",
          colors: ["#FF1493", "#00FFFF", "#000000"],
          category: "street",
          icon: "fas fa-bolt",
        },
      ],
    }

    return outfitDatabase[category] || []
  }

  showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll(".section").forEach((section) => {
      section.classList.remove("active")
    })

    // Show target section
    document.getElementById(sectionId).classList.add("active")

    // Update navigation
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.classList.remove("active")
      if (link.getAttribute("href") === `#${sectionId}`) {
        link.classList.add("active")
      }
    })
  }
}

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new ColorFit()
})

// Service Worker for offline functionality
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered: ", registration)
      })
      .catch((registrationError) => {
        console.log("SW registration failed: ", registrationError)
      })
  })
}
