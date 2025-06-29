// Enhanced ColorFit Application with Database and API Integration
class EnhancedColorFit {
  constructor() {
    this.api = new window.ColorFitAPI() // Assuming ColorFitAPI is globally available
    this.currentUser = null
    this.currentColors = []
    this.favorites = []
    this.outfitPlans = {}
    this.currentWeek = new Date()
    this.quizAnswers = []
    this.chatHistory = []
    this.weatherData = null
    this.trendingData = null
    this.sharedOutfits = []

    this.init()
  }

  async init() {
    await this.initializeUser()
    this.setupEventListeners()
    this.setupNavigation()
    this.setupThemeToggle()
    this.setupImageUpload()
    this.setupChat()
    this.setupVoiceCommands()
    this.setupCalendar()
    this.setupQuiz()
    this.setupSearch()
    this.setupSocialFeatures()
    await this.loadInitialData()
  }

  async initializeUser() {
    // Check if user exists or create new one
    let userId = localStorage.getItem("colorfit-current-user")
    if (!userId) {
      const userData = {
        name: "Fashion Enthusiast",
        email: "user@colorfit.com",
        preferences: {
          style: ["minimalist"],
          colors: ["neutral"],
          brands: ["zara", "uniqlo"],
          price_range: "medium",
        },
      }
      const result = await this.api.createUser(userData)
      if (result.success) {
        userId = result.user.id
        localStorage.setItem("colorfit-current-user", userId)
        this.currentUser = result.user
      }
    } else {
      const result = await this.api.getUserProfile(userId)
      if (result.success && result.user) {
        this.currentUser = result.user
      }
    }
  }

  async loadInitialData() {
    try {
      // Load trending data
      const trendsResult = await this.api.getTrendingStyles()
      if (trendsResult.success) {
        this.trendingData = trendsResult.trends
        this.updateTrendingSection()
      }

      // Load weather-based recommendations
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const weatherResult = await this.api.getWeatherOutfits(
            { lat: position.coords.latitude, lon: position.coords.longitude },
            this.currentUser?.id,
          )
          if (weatherResult.success) {
            this.weatherData = weatherResult
            this.displayWeatherRecommendations()
          }
        })
      }

      // Load shared outfits for social feed
      const sharedResult = await this.api.getSharedOutfits(10)
      if (sharedResult.success) {
        this.sharedOutfits = sharedResult.shared_outfits
        this.updateSocialFeed()
      }

      // Load user's favorites and plans
      this.loadUserData()
    } catch (error) {
      console.error("Error loading initial data:", error)
    }
  }

  loadUserData() {
    // Load from localStorage for offline functionality
    this.favorites = JSON.parse(localStorage.getItem(`colorfit-favorites-${this.currentUser?.id}`) || "[]")
    this.outfitPlans = JSON.parse(localStorage.getItem(`colorfit-plans-${this.currentUser?.id}`) || "{}")
    this.loadWardrobe()
  }

  setupEventListeners() {
    // Enhanced navigation with new sections
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault()
        const target = e.target.getAttribute("href").substring(1)
        this.showSection(target)
      })
    })

    // Enhanced tag cloud with API integration
    document.querySelectorAll(".tag").forEach((tag) => {
      tag.addEventListener("click", async (e) => {
        const category = e.target.dataset.category
        await this.showCategoryOutfits(category)
      })
    })

    // Enhanced suggestions button
    document.getElementById("getSuggestions").addEventListener("click", async () => {
      await this.generateEnhancedSuggestions()
    })

    // User preference updates
    this.setupPreferenceControls()
  }

  setupPreferenceControls() {
    // Add preference controls to the interface
    const preferenceSection = document.createElement("div")
    preferenceSection.className = "preference-controls"
    preferenceSection.innerHTML = `
      <div class="preference-item">
        <label>Style Preference:</label>
        <select id="stylePreference">
          <option value="minimalist">Minimalist</option>
          <option value="boho">Bohemian</option>
          <option value="street">Street Style</option>
          <option value="formal">Formal</option>
          <option value="casual">Casual</option>
        </select>
      </div>
      <div class="preference-item">
        <label>Price Range:</label>
        <select id="pricePreference">
          <option value="low">Budget-Friendly</option>
          <option value="medium">Mid-Range</option>
          <option value="high">Premium</option>
        </select>
      </div>
      <div class="preference-item">
        <label>Preferred Brands:</label>
        <div class="brand-checkboxes">
          <label><input type="checkbox" value="zara"> Zara</label>
          <label><input type="checkbox" value="hm"> H&M</label>
          <label><input type="checkbox" value="uniqlo"> Uniqlo</label>
          <label><input type="checkbox" value="nike"> Nike</label>
        </div>
      </div>
    `

    // Insert after hero section
    const hero = document.querySelector(".hero")
    hero.appendChild(preferenceSection)

    // Add event listeners for preference updates
    document.getElementById("stylePreference").addEventListener("change", (e) => {
      this.updateUserPreferences({ style: [e.target.value] })
    })

    document.getElementById("pricePreference").addEventListener("change", (e) => {
      this.updateUserPreferences({ price_range: e.target.value })
    })

    document.querySelectorAll(".brand-checkboxes input").forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        const selectedBrands = Array.from(document.querySelectorAll(".brand-checkboxes input:checked")).map(
          (cb) => cb.value,
        )
        this.updateUserPreferences({ brands: selectedBrands })
      })
    })
  }

  async updateUserPreferences(preferences) {
    if (this.currentUser) {
      const result = await this.api.updateUserPreferences(this.currentUser.id, preferences)
      if (result.success) {
        this.currentUser = result.user
        // Refresh recommendations based on new preferences
        await this.generateEnhancedSuggestions()
      }
    }
  }

  setupNavigation() {
    const navLinks = document.querySelectorAll(".nav-link")
    const sections = document.querySelectorAll(".section")

    navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault()
        const targetId = link.getAttribute("href").substring(1)

        navLinks.forEach((l) => l.classList.remove("active"))
        link.classList.add("active")

        sections.forEach((s) => s.classList.remove("active"))
        const targetSection = document.getElementById(targetId)
        if (targetSection) {
          targetSection.classList.add("active")
        }
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
        this.processImageWithAPI(files[0])
      }
    })

    imageInput.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        this.processImageWithAPI(e.target.files[0])
      }
    })
  }

  async processImageWithAPI(file) {
    try {
      // Show loading state
      this.showLoadingState("Analyzing your outfit colors...")

      // Convert file to base64 for API
      const reader = new FileReader()
      reader.onload = async (e) => {
        const imageData = e.target.result

        // Call API for color analysis
        const result = await this.api.analyzeColors(imageData)

        if (result.success) {
          this.currentColors = result.dominant_colors
          this.displayEnhancedColorPalette(result)

          // Get color matches
          const matchResult = await this.api.getColorMatches(result.dominant_colors)
          if (matchResult.success) {
            this.displayColorMatches(matchResult.color_matches)
          }
        }

        this.hideLoadingState()
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Error processing image:", error)
      this.hideLoadingState()
      this.showError("Failed to analyze image. Please try again.")
    }
  }

  displayEnhancedColorPalette(analysisResult) {
    const palette = document.getElementById("colorPalette")
    const analysis = document.getElementById("colorAnalysis")

    palette.innerHTML = ""

    // Display dominant colors
    analysisResult.dominant_colors.forEach((color, index) => {
      const swatch = document.createElement("div")
      swatch.className = "color-swatch enhanced"
      swatch.style.backgroundColor = color
      swatch.setAttribute("data-color", color)
      swatch.setAttribute("data-confidence", (analysisResult.confidence * 100).toFixed(0))

      // Add click handler for color details
      swatch.addEventListener("click", () => {
        this.showColorDetails(color, analysisResult)
      })

      palette.appendChild(swatch)
    })

    // Add analysis info
    const infoDiv = document.createElement("div")
    infoDiv.className = "analysis-info"
    infoDiv.innerHTML = `
      <p><strong>Season Match:</strong> ${analysisResult.season_match}</p>
      <p><strong>Color Harmony:</strong> ${analysisResult.color_harmony}</p>
      <p><strong>Confidence:</strong> ${(analysisResult.confidence * 100).toFixed(0)}%</p>
    `
    analysis.appendChild(infoDiv)

    analysis.style.display = "block"
  }

  displayColorMatches(colorMatches) {
    const matchesDiv = document.createElement("div")
    matchesDiv.className = "color-matches"
    matchesDiv.innerHTML = "<h4>Recommended Color Combinations</h4>"

    colorMatches.forEach((match) => {
      const matchDiv = document.createElement("div")
      matchDiv.className = "color-match-group"
      matchDiv.innerHTML = `
        <div class="original-color" style="background-color: ${match.original}"></div>
        <div class="match-colors">
          <div class="complementary" style="background-color: ${match.complementary}" title="Complementary"></div>
          ${match.analogous
            .map((color) => `<div class="analogous" style="background-color: ${color}" title="Analogous"></div>`)
            .join("")}
        </div>
      `
      matchesDiv.appendChild(matchDiv)
    })

    document.getElementById("colorAnalysis").appendChild(matchesDiv)
  }

  async generateEnhancedSuggestions() {
    try {
      this.showLoadingState("Finding perfect outfits for you...")

      // Get recommendations from API
      const result = await this.api.getRecommendations(this.currentUser?.id, {
        colors: this.currentColors,
        preferences: this.currentUser?.preferences,
        weather: this.weatherData?.weather,
      })

      if (result.success) {
        await this.displayEnhancedSuggestions(result.recommendations)
        this.updateTrendingColors(result.trending_colors)
      }

      this.hideLoadingState()

      // Show suggestions section
      document.getElementById("suggestionsGrid").style.display = "block"
      document.getElementById("silhouettePreview").style.display = "block"

      // Scroll to suggestions
      document.getElementById("suggestionsGrid").scrollIntoView({
        behavior: "smooth",
      })
    } catch (error) {
      console.error("Error generating suggestions:", error)
      this.hideLoadingState()
      this.showError("Failed to generate suggestions. Please try again.")
    }
  }

  async displayEnhancedSuggestions(suggestions) {
    const container = document.getElementById("suggestionsContainer")
    container.innerHTML = ""

    for (let i = 0; i < suggestions.length; i++) {
      const suggestion = suggestions[i]
      const card = document.createElement("div")
      card.className = "suggestion-card enhanced"
      card.style.animationDelay = `${i * 0.1}s`

      const isFavorited = this.favorites.some((fav) => fav.id === suggestion.id)

      // Get brand products for this suggestion
      const brandProducts = await this.getBrandProductsForSuggestion(suggestion)

      card.innerHTML = `
        <div class="suggestion-image">
          <i class="${suggestion.icon || "fas fa-tshirt"}"></i>
          <div class="suggestion-badges">
            <span class="trending-badge" style="display: ${suggestion.trending_score > 70 ? "block" : "none"}">
              🔥 Trending
            </span>
            <span class="match-badge">
              ${Math.round(suggestion.match_score)}% Match
            </span>
          </div>
        </div>
        <div class="suggestion-content">
          <h3 class="suggestion-title">${suggestion.title}</h3>
          <p class="suggestion-description">${suggestion.description}</p>
          
          <div class="suggestion-details">
            <div class="suggestion-colors">
              ${suggestion.colors
                .map(
                  (color) => `<div class="suggestion-color" style="background-color: ${color}" title="${color}"></div>`,
                )
                .join("")}
            </div>
            
            <div class="suggestion-tags">
              ${suggestion.style_tags?.map((tag) => `<span class="style-tag">#${tag}</span>`).join("") || ""}
            </div>
            
            <div class="suggestion-info">
              <span class="price-range">💰 ${suggestion.price_range}</span>
              <span class="rating">⭐ ${suggestion.rating}</span>
              <span class="season">🌤️ ${suggestion.season}</span>
            </div>
          </div>

          <div class="brand-suggestions">
            <h5>Shop Similar:</h5>
            <div class="brand-products">
              ${brandProducts
                .slice(0, 3)
                .map(
                  (product) => `
                <div class="brand-product">
                  <img src="${product.image}" alt="${product.name}" />
                  <span class="product-name">${product.name}</span>
                  <span class="product-price">$${product.price}</span>
                </div>
              `,
                )
                .join("")}
            </div>
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
            <button class="action-btn share-btn" data-id="${suggestion.id}">
              <i class="fas fa-share"></i> Share
            </button>
            <button class="action-btn ai-advice-btn" data-id="${suggestion.id}">
              <i class="fas fa-robot"></i> AI Advice
            </button>
          </div>
        </div>
      `

      // Enhanced event listeners
      this.setupSuggestionCardEvents(card, suggestion)
      container.appendChild(card)
    }
  }

  setupSuggestionCardEvents(card, suggestion) {
    const favoriteBtn = card.querySelector(".favorite-btn")
    const tryOnBtn = card.querySelector(".try-on-btn")
    const planBtn = card.querySelector(".plan-btn")
    const shareBtn = card.querySelector(".share-btn")
    const aiAdviceBtn = card.querySelector(".ai-advice-btn")

    favoriteBtn.addEventListener("click", () => {
      this.toggleFavorite(suggestion)
    })

    tryOnBtn.addEventListener("click", () => {
      this.tryOnOutfit(suggestion)
    })

    planBtn.addEventListener("click", () => {
      this.planOutfit(suggestion)
    })

    shareBtn.addEventListener("click", async () => {
      await this.shareOutfit(suggestion)
    })

    aiAdviceBtn.addEventListener("click", async () => {
      await this.getAIAdvice(suggestion)
    })
  }

  async getBrandProductsForSuggestion(suggestion) {
    try {
      const brandName = suggestion.brand_suggestions?.[0] || "zara"
      const result = await this.api.getBrandProducts(brandName, suggestion.category)
      return result.success ? result.products : []
    } catch (error) {
      console.error("Error fetching brand products:", error)
      return []
    }
  }

  async shareOutfit(outfit) {
    try {
      if (!this.currentUser) {
        this.showError("Please create an account to share outfits")
        return
      }

      const result = await this.api.shareOutfit(this.currentUser.id, outfit)
      if (result.success) {
        this.showSuccess("Outfit shared successfully!")
        // Update social feed
        const sharedResult = await this.api.getSharedOutfits(10)
        if (sharedResult.success) {
          this.sharedOutfits = sharedResult.shared_outfits
          this.updateSocialFeed()
        }
      }
    } catch (error) {
      console.error("Error sharing outfit:", error)
      this.showError("Failed to share outfit")
    }
  }

  async getAIAdvice(outfit) {
    try {
      this.showLoadingState("Getting AI styling advice...")

      const result = await this.api.getAIStyleAdvice(this.currentUser, outfit.occasion, this.weatherData?.weather)

      if (result.success) {
        this.displayAIAdvice(result.advice, outfit)
      }

      this.hideLoadingState()
    } catch (error) {
      console.error("Error getting AI advice:", error)
      this.hideLoadingState()
      this.showError("Failed to get AI advice")
    }
  }

  displayAIAdvice(advice, outfit) {
    const modal = document.createElement("div")
    modal.className = "ai-advice-modal"
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>AI Styling Advice</h3>
          <button class="close-modal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="outfit-context">
            <h4>${outfit.title}</h4>
            <p>${outfit.description}</p>
          </div>
          
          <div class="ai-recommendation">
            <h5>Recommendation:</h5>
            <p>${advice.primary_recommendation}</p>
          </div>

          <div class="color-suggestions">
            <h5>Suggested Colors:</h5>
            <div class="color-palette">
              ${advice.color_suggestions
                .map((color) => `<div class="color-swatch" style="background-color: ${color}"></div>`)
                .join("")}
            </div>
          </div>

          <div class="style-tips">
            <h5>Style Tips:</h5>
            <ul>
              ${advice.style_tips.map((tip) => `<li>${tip}</li>`).join("")}
            </ul>
          </div>

          <div class="outfit-combinations">
            <h5>Complete Look:</h5>
            ${advice.outfit_combinations
              .map(
                (combo) => `
              <div class="combo-item">
                <p><strong>Top:</strong> ${combo.top}</p>
                <p><strong>Bottom:</strong> ${combo.bottom}</p>
                <p><strong>Shoes:</strong> ${combo.shoes}</p>
                <p><strong>Accessories:</strong> ${combo.accessories}</p>
              </div>
            `,
              )
              .join("")}
          </div>

          <div class="confidence-score">
            <p><strong>AI Confidence:</strong> ${(advice.confidence_score * 100).toFixed(0)}%</p>
          </div>
        </div>
      </div>
    `

    document.body.appendChild(modal)

    // Close modal functionality
    const closeBtn = modal.querySelector(".close-modal")
    closeBtn.addEventListener("click", () => {
      document.body.removeChild(modal)
    })

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal)
      }
    })
  }

  setupSocialFeatures() {
    // Add social feed section to the HTML
    const socialSection = document.createElement("section")
    socialSection.id = "social"
    socialSection.className = "section"
    socialSection.innerHTML = `
      <div class="social-header">
        <h2>Community Outfits</h2>
        <button id="refreshFeed" class="btn-secondary">
          <i class="fas fa-refresh"></i> Refresh
        </button>
      </div>
      <div class="social-feed" id="socialFeed">
        <div class="loading-feed">Loading community outfits...</div>
      </div>
    `

    document.querySelector(".main-content").appendChild(socialSection)

    // Add social nav link
    const navMenu = document.querySelector(".nav-menu")
    const socialLink = document.createElement("a")
    socialLink.href = "#social"
    socialLink.className = "nav-link"
    socialLink.textContent = "Community"
    navMenu.appendChild(socialLink)

    // Setup social event listeners
    document.getElementById("refreshFeed").addEventListener("click", async () => {
      const result = await this.api.getSharedOutfits(10)
      if (result.success) {
        this.sharedOutfits = result.shared_outfits
        this.updateSocialFeed()
      }
    })
  }

  updateSocialFeed() {
    const feed = document.getElementById("socialFeed")
    if (!feed) return

    if (this.sharedOutfits.length === 0) {
      feed.innerHTML = `
        <div class="empty-feed">
          <i class="fas fa-users"></i>
          <p>No shared outfits yet. Be the first to share!</p>
        </div>
      `
      return
    }

    feed.innerHTML = ""

    this.sharedOutfits.forEach((share) => {
      const feedItem = document.createElement("div")
      feedItem.className = "feed-item"
      feedItem.innerHTML = `
        <div class="feed-header">
          <div class="user-avatar">
            <i class="fas fa-user"></i>
          </div>
          <div class="user-info">
            <h4>Fashion Enthusiast</h4>
            <span class="share-time">${this.formatTimeAgo(share.shared_at)}</span>
          </div>
        </div>
        <div class="feed-content">
          <div class="outfit-preview">
            <i class="${share.outfit.icon || "fas fa-tshirt"}"></i>
          </div>
          <div class="outfit-details">
            <h5>${share.outfit.title}</h5>
            <p>${share.outfit.description}</p>
            <div class="outfit-colors">
              ${
                share.outfit.colors
                  ?.map((color) => `<div class="color-dot" style="background-color: ${color}"></div>`)
                  .join("") || ""
              }
            </div>
          </div>
        </div>
        <div class="feed-actions">
          <button class="feed-action like-btn">
            <i class="fas fa-heart"></i> ${share.likes || 0}
          </button>
          <button class="feed-action comment-btn">
            <i class="fas fa-comment"></i> Comment
          </button>
          <button class="feed-action save-btn">
            <i class="fas fa-bookmark"></i> Save
          </button>
        </div>
      `

      feed.appendChild(feedItem)
    })
  }

  formatTimeAgo(dateString) {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)

    if (diffInSeconds < 60) return "Just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  displayWeatherRecommendations() {
    if (!this.weatherData) return

    const weatherSection = document.createElement("div")
    weatherSection.className = "weather-recommendations"
    weatherSection.innerHTML = `
      <h3>Weather-Based Recommendations</h3>
      <div class="weather-info">
        <div class="weather-current">
          <span class="temperature">${this.weatherData.weather.temperature}°C</span>
          <span class="condition">${this.weatherData.weather.condition}</span>
        </div>
        <div class="weather-tips">
          <h5>Today's Tips:</h5>
          <ul>
            ${this.weatherData.weather_tips.map((tip) => `<li>${tip}</li>`).join("")}
          </ul>
        </div>
      </div>
      <div class="weather-outfits">
        ${this.weatherData.recommended_outfits
          .map(
            (outfit) => `
          <div class="weather-outfit-card">
            <i class="${outfit.icon || "fas fa-tshirt"}"></i>
            <h5>${outfit.title}</h5>
            <p>${outfit.description}</p>
          </div>
        `,
          )
          .join("")}
      </div>
    `

    // Insert after trending section
    const trendingSection = document.querySelector(".trending-section")
    trendingSection.parentNode.insertBefore(weatherSection, trendingSection.nextSibling)
  }

  updateTrendingSection() {
    if (!this.trendingData) return

    const tagCloud = document.querySelector(".tag-cloud")

    // Add trending indicators to existing tags
    this.trendingData.current.styles.forEach((style) => {
      const tag = document.querySelector(`[data-category*="${style}"]`)
      if (tag) {
        tag.classList.add("trending")
        tag.innerHTML += " 🔥"
      }
    })

    // Add new trending colors section
    const colorTrendsDiv = document.createElement("div")
    colorTrendsDiv.className = "trending-colors"
    colorTrendsDiv.innerHTML = `
      <h4>Trending Colors</h4>
      <div class="trending-color-palette">
        ${this.trendingData.current.colors
          .map((color) => `<div class="trending-color" style="background-color: ${color}" title="${color}"></div>`)
          .join("")}
      </div>
    `

    tagCloud.parentNode.appendChild(colorTrendsDiv)
  }

  // Enhanced chat with API integration
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
      this.sendEnhancedMessage()
    })

    chatInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.sendEnhancedMessage()
      }
    })
  }

  async sendEnhancedMessage() {
    const input = document.getElementById("chatInput")
    const message = input.value.trim()

    if (!message) return

    this.addMessage(message, "user")
    input.value = ""

    // Show typing indicator
    this.showTypingIndicator()

    try {
      // Enhanced bot response with context awareness
      const response = await this.generateEnhancedBotResponse(message)
      this.hideTypingIndicator()
      this.addMessage(response, "bot")
    } catch (error) {
      this.hideTypingIndicator()
      this.addMessage("Sorry, I encountered an error. Please try again.", "bot")
    }
  }

  async generateEnhancedBotResponse(userMessage) {
    const message = userMessage.toLowerCase()

    // Context-aware responses based on current state
    if (this.currentColors.length > 0 && (message.includes("color") || message.includes("match"))) {
      const colorResult = await this.api.getColorMatches(this.currentColors)
      if (colorResult.success) {
        return `Based on your uploaded image, I found these dominant colors: ${this.currentColors.join(", ")}. These would pair beautifully with complementary colors for a balanced look!`
      }
    }

    if (message.includes("weather") || message.includes("today")) {
      if (this.weatherData) {
        return `Today's weather is ${this.weatherData.weather.temperature}°C and ${this.weatherData.weather.condition}. ${this.weatherData.weather_tips[0]} Would you like specific outfit recommendations for this weather?`
      }
    }

    if (message.includes("trending") || message.includes("popular")) {
      if (this.trendingData) {
        return `Right now, ${this.trendingData.current.styles.join(", ")} are super trending! The hottest colors this season are ${this.trendingData.current.colors.slice(0, 3).join(", ")}. Want me to find outfits in these styles?`
      }
    }

    if (message.includes("brand") || message.includes("shop")) {
      return `I can help you find pieces from your favorite brands! Based on your preferences, I'd recommend checking out ${this.currentUser?.preferences?.brands?.join(", ") || "Zara, H&M, and Uniqlo"} for your style. Want me to show you specific products?`
    }

    // AI-powered style advice
    if (message.includes("advice") || message.includes("help") || message.includes("suggest")) {
      if (this.currentUser) {
        const advice = await this.api.getAIStyleAdvice(this.currentUser, "general", this.weatherData?.weather)
        if (advice.success) {
          return advice.advice.primary_recommendation + " " + advice.advice.style_tips[0]
        }
      }
    }

    // Fallback responses
    const responses = [
      "That's a great question! I'm here to help with all your fashion needs. Try asking me about color combinations, trending styles, or outfit suggestions!",
      "I love talking fashion! Whether you need help with color matching, finding the perfect outfit, or staying on-trend, I'm your personal stylist.",
      "Fashion is all about expressing yourself! What specific style challenge can I help you with today?",
      "Every outfit tells a story. What story do you want your style to tell? I can help you create the perfect look!",
    ]

    return responses[Math.floor(Math.random() * responses.length)]
  }

  showTypingIndicator() {
    const messagesContainer = document.getElementById("chatMessages")
    const typingDiv = document.createElement("div")
    typingDiv.className = "message bot-message typing-indicator"
    typingDiv.innerHTML = `
      <div class="message-content">
        <div class="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    `
    messagesContainer.appendChild(typingDiv)
    messagesContainer.scrollTop = messagesContainer.scrollHeight
  }

  hideTypingIndicator() {
    const typingIndicator = document.querySelector(".typing-indicator")
    if (typingIndicator) {
      typingIndicator.remove()
    }
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

  // Enhanced search with API integration
  setupSearch() {
    const searchInput = document.getElementById("searchInput")
    const searchBtn = document.getElementById("searchBtn")

    const performSearch = async () => {
      const query = searchInput.value.toLowerCase().trim()
      if (!query) return

      this.showLoadingState("Searching...")

      try {
        // Search through API
        const result = await this.api.getOutfits({
          search: query,
          user_preferences: this.currentUser?.preferences,
        })

        if (result.success) {
          await this.displayEnhancedSuggestions(result.outfits)
          document.getElementById("suggestionsGrid").style.display = "block"
          document.getElementById("suggestionsGrid").scrollIntoView({ behavior: "smooth" })
        }
      } catch (error) {
        console.error("Search error:", error)
        this.showError("Search failed. Please try again.")
      }

      this.hideLoadingState()
    }

    searchBtn.addEventListener("click", performSearch)
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        performSearch()
      }
    })
  }

  // Utility methods for UI feedback
  showLoadingState(message = "Loading...") {
    const loader = document.createElement("div")
    loader.id = "global-loader"
    loader.className = "global-loader"
    loader.innerHTML = `
      <div class="loader-content">
        <div class="loader-spinner"></div>
        <p>${message}</p>
      </div>
    `
    document.body.appendChild(loader)
  }

  hideLoadingState() {
    const loader = document.getElementById("global-loader")
    if (loader) {
      document.body.removeChild(loader)
    }
  }

  showSuccess(message) {
    this.showNotification(message, "success")
  }

  showError(message) {
    this.showNotification(message, "error")
  }

  showNotification(message, type = "info") {
    const notification = document.createElement("div")
    notification.className = `notification ${type}`
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas fa-${type === "success" ? "check-circle" : type === "error" ? "exclamation-circle" : "info-circle"}"></i>
        <span>${message}</span>
        <button class="notification-close">&times;</button>
      </div>
    `

    document.body.appendChild(notification)

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification)
      }
    }, 5000)

    // Manual close
    notification.querySelector(".notification-close").addEventListener("click", () => {
      document.body.removeChild(notification)
    })
  }

  // Enhanced outfit management
  toggleFavorite(outfit) {
    const index = this.favorites.findIndex((fav) => fav.id === outfit.id)

    if (index > -1) {
      this.favorites.splice(index, 1)
    } else {
      this.favorites.push(outfit)
    }

    localStorage.setItem(`colorfit-favorites-${this.currentUser?.id}`, JSON.stringify(this.favorites))
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
      item.className = "wardrobe-item enhanced"
      item.innerHTML = `
        <div class="wardrobe-image">
          <i class="${outfit.icon || "fas fa-tshirt"}"></i>
        </div>
        <div class="wardrobe-content">
          <h3>${outfit.title}</h3>
          <p>${outfit.description}</p>
          <div class="wardrobe-details">
            <div class="suggestion-colors">
              ${
                outfit.colors
                  ?.map((color) => `<div class="suggestion-color" style="background-color: ${color}"></div>`)
                  .join("") || ""
              }
            </div>
            <div class="wardrobe-tags">
              ${outfit.style_tags?.map((tag) => `<span class="style-tag">#${tag}</span>`).join("") || ""}
            </div>
            <div class="wardrobe-info">
              <span class="rating">⭐ ${outfit.rating || "N/A"}</span>
              <span class="category">📁 ${outfit.category}</span>
            </div>
          </div>
          <div class="wardrobe-actions">
            <button class="btn-secondary remove-btn" data-id="${outfit.id}">
              <i class="fas fa-trash"></i> Remove
            </button>
            <button class="btn-primary wear-btn" data-id="${outfit.id}">
              <i class="fas fa-calendar-plus"></i> Plan to Wear
            </button>
          </div>
        </div>
      `

      const removeBtn = item.querySelector(".remove-btn")
      const wearBtn = item.querySelector(".wear-btn")

      removeBtn.addEventListener("click", () => {
        this.toggleFavorite(outfit)
      })

      wearBtn.addEventListener("click", () => {
        this.planOutfit(outfit)
      })

      grid.appendChild(item)
    })
  }

  // Rest of the methods remain similar but enhanced...
  // (continuing with the existing methods from the original script but with API integration)

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
        ${
          plannedOutfit
            ? `
          <div class="planned-outfit">
            <div class="outfit-preview">
              <i class="${plannedOutfit.icon || "fas fa-tshirt"}"></i>
            </div>
            <span class="outfit-title">${plannedOutfit.title}</span>
          </div>
        `
            : '<div class="add-outfit">+ Add Outfit</div>'
        }
      `

      // Add click handler for planning outfits
      dayElement.addEventListener("click", () => {
        this.showOutfitPlanningModal(dateStr)
      })

      grid.appendChild(dayElement)
    })
  }

  showOutfitPlanningModal(dateStr) {
    const modal = document.createElement("div")
    modal.className = "planning-modal"
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Plan Outfit for ${new Date(dateStr).toLocaleDateString()}</h3>
          <button class="close-modal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="outfit-options">
            ${this.favorites
              .map(
                (outfit) => `
              <div class="outfit-option" data-outfit-id="${outfit.id}">
                <div class="outfit-preview">
                  <i class="${outfit.icon || "fas fa-tshirt"}"></i>
                </div>
                <div class="outfit-info">
                  <h5>${outfit.title}</h5>
                  <p>${outfit.description}</p>
                </div>
              </div>
            `,
              )
              .join("")}
          </div>
          ${this.favorites.length === 0 ? "<p>No saved outfits. Add some favorites first!</p>" : ""}
        </div>
      </div>
    `

    document.body.appendChild(modal)

    // Setup modal events
    const closeBtn = modal.querySelector(".close-modal")
    closeBtn.addEventListener("click", () => {
      document.body.removeChild(modal)
    })

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal)
      }
    })

    // Setup outfit selection
    modal.querySelectorAll(".outfit-option").forEach((option) => {
      option.addEventListener("click", () => {
        const outfitId = option.dataset.outfitId
        const outfit = this.favorites.find((f) => f.id == outfitId)
        if (outfit) {
          this.scheduleOutfit(dateStr, outfit)
          document.body.removeChild(modal)
        }
      })
    })
  }

  scheduleOutfit(dateStr, outfit) {
    this.outfitPlans[dateStr] = outfit
    localStorage.setItem(`colorfit-plans-${this.currentUser?.id}`, JSON.stringify(this.outfitPlans))
    this.updateCalendar()
    this.showSuccess(`Outfit planned for ${new Date(dateStr).toLocaleDateString()}!`)
  }

  navigateWeek(direction) {
    this.currentWeek.setDate(this.currentWeek.getDate() + direction * 7)
    this.updateCalendar()
  }

  // Voice commands and other methods remain similar...
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
    } else if (command.includes("community") || command.includes("social")) {
      this.showSection("social")
    } else if (command.includes("chat") || command.includes("assistant")) {
      document.getElementById("chatContainer").classList.add("active")
    } else if (command.includes("dark mode") || command.includes("night mode")) {
      document.getElementById("themeToggle").click()
    } else {
      // Send voice command to chat
      document.getElementById("chatInput").value = command
      this.sendEnhancedMessage()
    }
  }

  setupQuiz() {
    const quizOptions = document.querySelectorAll(".quiz-option")

    quizOptions.forEach((option) => {
      option.addEventListener("click", () => {
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
        tips: "Focus on versatile basics like jeans, t-shirts, and sneakers.",
      },
      boho: {
        title: "Bohemian Spirit",
        description: "You're drawn to free-spirited, artistic styles with flowing fabrics.",
        tips: "Embrace flowy dresses, layered jewelry, and natural textures.",
      },
      minimalist: {
        title: "Minimalist Chic",
        description: "You prefer clean lines, simple silhouettes, and timeless pieces.",
        tips: "Invest in quality basics and focus on fit and fabric.",
      },
      street: {
        title: "Street Style Edge",
        description: "You love trendy, urban-inspired looks with a modern edge.",
        tips: "Mix high and low pieces, experiment with bold accessories.",
      },
    }

    const profile = styleProfiles[style]

    styleResult.innerHTML = `
      <div class="style-match">
        <h4>${profile.title}</h4>
        <p>${profile.description}</p>
        <p><strong>Style Tip:</strong> ${profile.tips}</p>
        <button class="btn-primary update-preferences" data-style="${style}">
          Update My Preferences
        </button>
      </div>
    `

    // Add event listener for preference update
    const updateBtn = styleResult.querySelector(".update-preferences")
    updateBtn.addEventListener("click", async () => {
      await this.updateUserPreferences({ style: [style] })
      this.showSuccess("Style preferences updated!")
    })

    resultDiv.style.display = "block"
    resultDiv.scrollIntoView({ behavior: "smooth" })
  }

  async showCategoryOutfits(category) {
    try {
      this.showLoadingState("Loading category outfits...")

      const result = await this.api.getOutfits({ category })
      if (result.success) {
        await this.displayEnhancedSuggestions(result.outfits)
        document.getElementById("suggestionsGrid").style.display = "block"
        document.getElementById("suggestionsGrid").scrollIntoView({ behavior: "smooth" })
      }

      this.hideLoadingState()
    } catch (error) {
      console.error("Error loading category outfits:", error)
      this.hideLoadingState()
      this.showError("Failed to load category outfits")
    }
  }

  showSection(sectionId) {
    document.querySelectorAll(".section").forEach((section) => {
      section.classList.remove("active")
    })

    const targetSection = document.getElementById(sectionId)
    if (targetSection) {
      targetSection.classList.add("active")
    }

    document.querySelectorAll(".nav-link").forEach((link) => {
      link.classList.remove("active")
      if (link.getAttribute("href") === `#${sectionId}`) {
        link.classList.add("active")
      }
    })
  }

  tryOnOutfit(outfit) {
    const overlay = document.getElementById("outfitOverlay")
    overlay.innerHTML = ""

    const outfitDiv = document.createElement("div")
    outfitDiv.style.cssText = `
      position: absolute;
      top: 80px;
      left: 20px;
      right: 20px;
      height: 120px;
      background: linear-gradient(45deg, ${outfit.colors?.join(", ") || "#ccc"});
      border-radius: 10px;
      opacity: 0.8;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
    `
    outfitDiv.textContent = outfit.title

    overlay.appendChild(outfitDiv)

    outfitDiv.style.transform = "scale(0)"
    setTimeout(() => {
      outfitDiv.style.transition = "transform 0.5s ease"
      outfitDiv.style.transform = "scale(1)"
    }, 100)
  }

  planOutfit(outfit) {
    this.showSection("planner")

    setTimeout(() => {
      const days = document.querySelectorAll(".calendar-day:not(.has-outfit)")
      days.forEach((day) => {
        day.style.border = "2px dashed var(--primary-color)"
        day.style.cursor = "pointer"

        const clickHandler = () => {
          const dateStr = day.dataset.date
          this.scheduleOutfit(dateStr, outfit)
          days.forEach((d) => {
            d.style.border = ""
            d.style.cursor = ""
            d.removeEventListener("click", clickHandler)
          })
        }

        day.addEventListener("click", clickHandler)
      })
    }, 500)
  }
}

// Initialize the enhanced application
document.addEventListener("DOMContentLoaded", () => {
  new EnhancedColorFit()
})
