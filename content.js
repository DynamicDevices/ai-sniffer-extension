
// Heuristic-based AI detection (fallback method)
class HeuristicDetector {
  constructor() {
    this.aiIndicators = [
      // Repetitive patterns
      /\b(furthermore|moreover|additionally|consequently|therefore|thus|hence)\b/gi,
      /\b(in conclusion|to summarize|in summary|overall|ultimately)\b/gi,
      /\b(it is important to note|it should be noted|it is worth mentioning)\b/gi,
      
      // Overly formal language
      /\b(utilize|facilitate|implement|demonstrate|establish|maintain)\b/gi,
      /\b(comprehensive|extensive|significant|substantial|considerable)\b/gi,
      
      // Generic phrases
      /\b(various|numerous|multiple|several|different|diverse)\b/gi,
      /\b(aspect|factor|element|component|feature|characteristic)\b/gi,
      
      // AI-like sentence starters
      /^(As an AI|I'm an AI|As a language model|I don't have personal)/gmi,
      /^(It's worth noting|It's important to|One should consider)/gmi
    ];
    
    this.humanIndicators = [
      // Personal experiences
      /\b(I remember|when I was|my experience|personally|in my opinion)\b/gi,
      /\b(I felt|I thought|I believe|I think|from my perspective)\b/gi,
      
      // Informal language
      /\b(gonna|wanna|kinda|sorta|yeah|nah|ok|okay)\b/gi,
      /\b(awesome|cool|weird|crazy|amazing|terrible)\b/gi,
      
      // Contractions
      /\b(don't|won't|can't|shouldn't|wouldn't|couldn't|isn't|aren't)\b/gi,
      
      // Emotional expressions
      /[!]{2,}|[?]{2,}/g,
      /\b(lol|haha|omg|wtf|tbh|imo|btw)\b/gi
    ];
  }
  
  analyseContent() {
    const textContent = this.extractTextContent();
    
    if (textContent.length < 100) {
      return { likelihood: 0, details: 'Content too short to analyse', source: 'local' };
    }
    
    let aiScore = 0;
    let humanScore = 0;
    
    // Count AI indicators
    this.aiIndicators.forEach(pattern => {
      const matches = textContent.match(pattern);
      if (matches) {
        aiScore += matches.length;
      }
    });
    
    // Count human indicators
    this.humanIndicators.forEach(pattern => {
      const matches = textContent.match(pattern);
      if (matches) {
        humanScore += matches.length;
      }
    });
    
    // Calculate sentence and paragraph metrics
    const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const paragraphs = textContent.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const words = textContent.split(/\s+/).filter(w => w.length > 0);
    
    // Average sentence length (AI tends to be more consistent)
    const avgSentenceLength = words.length / sentences.length;
    if (avgSentenceLength > 20 && avgSentenceLength < 25) {
      aiScore += 2; // AI often has consistent sentence length
    }
    
    // Vocabulary diversity
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    const vocabularyRatio = uniqueWords.size / words.length;
    if (vocabularyRatio < 0.4) {
      aiScore += 1; // Lower vocabulary diversity might indicate AI
    }
    
    // Calculate likelihood
    const totalScore = aiScore + humanScore;
    const likelihood = totalScore > 0 ? Math.round((aiScore / totalScore) * 100) : 0;
    
    return {
      likelihood: Math.min(likelihood, 95), // Cap at 95% for heuristic method
      details: {
        aiIndicators: aiScore,
        humanIndicators: humanScore,
        wordCount: words.length,
        sentenceCount: sentences.length,
        avgSentenceLength: Math.round(avgSentenceLength),
        vocabularyRatio: Math.round(vocabularyRatio * 100),
        source: 'heuristic'
      }
    };
  }
  
  extractTextContent() {
    // Focus on main content areas
    const contentSelectors = [
      'article',
      '[role="main"]',
      '.content',
      '.post',
      '.entry',
      'main',
      '#content',
      '.article-body'
    ];
    
    let content = '';
    
    for (const selector of contentSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        elements.forEach(el => {
          content += el.innerText + ' ';
        });
        break;
      }
    }
    
    // Fallback to body if no specific content found
    if (!content.trim()) {
      content = document.body.innerText || '';
    }
    
    // Remove navigation, ads, and other non-content
    content = content.replace(/\b(menu|navigation|advertisement|cookie|privacy policy|terms of service)\b/gi, '');
    
    return content.trim();
  }
}

// API-based AI detection (primary method)
class AIContentDetector {
  constructor() {
    // Replace with your actual API key
    this.apiKey = 'YOUR_API_KEY_HERE';
    this.apiEndpoint = 'https://api.sapling.ai/api/v1/aidetect';
    
    // Fallback to heuristic if API fails
    this.fallbackDetector = new HeuristicDetector();
  }
  
  async analyseContent() {
    const textContent = this.extractTextContent();
    
    if (textContent.length < 100) {
      return { likelihood: 0, details: 'Content too short to analyse', source: 'local' };
    }
    
    try {
      // Try API first
      const apiResult = await this.analyseWithAPI(textContent);
      return apiResult;
    } catch (error) {
      console.warn('API analysis failed, falling back to heuristic:', error);
      // Fallback to local heuristic analysis
      const fallbackResult = this.fallbackDetector.analyseContent();
      fallbackResult.source = 'heuristic_fallback';
      return fallbackResult;
    }
  }
  
  async analyseWithAPI(text) {
    // Limit text length for Sapling API (recommended max 2000 characters)
    const maxLength = 2000;
    const analysisText = text.length > maxLength ? text.substring(0, maxLength) : text;
    
    const response = await fetch(this.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: this.apiKey,  // Sapling requires 'key' in request body, not Authorization header
        text: analysisText // Sapling uses 'text' field, not 'document'
      })
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Parse API response (Sapling format)
    return this.parseAPIResponse(data, text);
  }
  
  parseAPIResponse(apiData, originalText) {
    // Sapling returns a score between 0 and 1
    const likelihood = Math.round((apiData.score || 0) * 100);

    return {
      likelihood,
      details: {
        score: apiData.score || 0,
        wordCount: originalText.split(/\s+/).length,
        source: 'api',
        provider: 'Sapling'
      }
    };
  }
  
  extractTextContent() {
    // Focus on main content areas
    const contentSelectors = [
      'article',
      '[role="main"]',
      '.content',
      '.post',
      '.entry',
      'main',
      '#content',
      '.article-body'
    ];
    
    let content = '';
    
    for (const selector of contentSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        elements.forEach(el => {
          content += el.innerText + ' ';
        });
        break;
      }
    }
    
    // Fallback to body if no specific content found
    if (!content.trim()) {
      content = document.body.innerText || '';
    }
    
    // Remove navigation, ads, and other non-content
    content = content.replace(/\b(menu|navigation|advertisement|cookie|privacy policy|terms of service)\b/gi, '');
    
    return content.trim();
  }
}

// UI Components
class AIDetectorUI {
  constructor() {
    this.detector = new AIContentDetector();
    this.isVisible = false;
    this.lastAnalysis = null;
    this.analysisInProgress = false;
  }
  
  createUI() {
    // Create main container
    const container = document.createElement('div');
    container.id = 'ai-detector-widget';
    container.innerHTML = `
      <div class="ai-detector-header">
        <span class="ai-detector-title">🤖 AI Content Detector</span>
        <button class="ai-detector-toggle" title="Toggle visibility">−</button>
        <button class="ai-detector-close" title="Close">×</button>
      </div>
      <div class="ai-detector-content">
        <div class="ai-detector-status">
          <div class="status-indicator" id="ai-status-indicator"></div>
          <span class="status-text" id="ai-status-text">Click analyze to check content</span>
        </div>
        <div class="ai-detector-controls">
          <button class="analyze-btn" id="analyze-content-btn">Analyze Page</button>
          <button class="settings-btn" id="settings-btn" title="Settings">⚙️</button>
        </div>
        <div class="ai-detector-results" id="analysis-results" style="display: none;">
          <div class="likelihood-display">
            <div class="likelihood-bar">
              <div class="likelihood-fill" id="likelihood-fill"></div>
            </div>
            <span class="likelihood-text" id="likelihood-text">0%</span>
          </div>
          <div class="analysis-details" id="analysis-details"></div>
        </div>
      </div>
    `;
    
    // Add styles
    this.addStyles();
    
    // Add event listeners
    this.addEventListeners(container);
    
    // Add to page
    document.body.appendChild(container);
    
    return container;
  }
  
  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #ai-detector-widget {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 300px;
        background: #ffffff;
        border: 2px solid #e1e5e9;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        z-index: 10000;
        backdrop-filter: blur(10px);
        transition: all 0.3s ease;
      }
      
      .ai-detector-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 12px 16px;
        border-radius: 10px 10px 0 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: move;
      }
      
      .ai-detector-title {
        font-weight: 600;
        font-size: 16px;
      }
      
      .ai-detector-toggle,
      .ai-detector-close {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-left: 8px;
        transition: background 0.2s;
      }
      
      .ai-detector-toggle:hover,
      .ai-detector-close:hover {
        background: rgba(255, 255, 255, 0.3);
      }
      
      .ai-detector-content {
        padding: 16px;
      }
      
      .ai-detector-content.collapsed {
        display: none;
      }
      
      .ai-detector-status {
        display: flex;
        align-items: center;
        margin-bottom: 16px;
        padding: 12px;
        background: #f8f9fa;
        border-radius: 8px;
      }
      
      .status-indicator {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #6c757d;
        margin-right: 10px;
        transition: background 0.3s;
      }
      
      .status-indicator.analyzing {
        background: #ffc107;
        animation: pulse 1.5s infinite;
      }
      
      .status-indicator.human {
        background: #28a745;
      }
      
      .status-indicator.ai {
        background: #dc3545;
      }
      
      .status-indicator.mixed {
        background: #fd7e14;
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      
      .status-text {
        font-size: 13px;
        color: #495057;
        flex: 1;
      }
      
      .ai-detector-controls {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
      }
      
      .analyze-btn {
        flex: 1;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 10px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      
      .analyze-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      }
      
      .analyze-btn:disabled {
        background: #6c757d;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }
      
      .settings-btn {
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        padding: 10px;
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.2s;
      }
      
      .settings-btn:hover {
        background: #e9ecef;
      }
      
      .ai-detector-results {
        border-top: 1px solid #e9ecef;
        padding-top: 16px;
      }
      
      .likelihood-display {
        display: flex;
        align-items: center;
        margin-bottom: 12px;
      }
      
      .likelihood-bar {
        flex: 1;
        height: 8px;
        background: #e9ecef;
        border-radius: 4px;
        overflow: hidden;
        margin-right: 12px;
      }
      
      .likelihood-fill {
        height: 100%;
        background: linear-gradient(90deg, #28a745 0%, #ffc107 50%, #dc3545 100%);
        width: 0%;
        transition: width 0.5s ease;
      }
      
      .likelihood-text {
        font-weight: 600;
        font-size: 16px;
        min-width: 40px;
        text-align: right;
      }
      
      .analysis-details {
        font-size: 12px;
        color: #6c757d;
        line-height: 1.4;
      }
      
      .analysis-details div {
        margin-bottom: 4px;
      }
      
      .confidence-high { color: #28a745; }
      .confidence-medium { color: #ffc107; }
      .confidence-low { color: #dc3545; }
    `;
    
    document.head.appendChild(style);
  }
  
  addEventListeners(container) {
    // Analyze button
    const analyzeBtn = container.querySelector('#analyze-content-btn');
    analyzeBtn.addEventListener('click', () => this.analyzeContent());
    
    // Toggle visibility
    const toggleBtn = container.querySelector('.ai-detector-toggle');
    toggleBtn.addEventListener('click', () => this.toggleVisibility());
    
    // Close widget
    const closeBtn = container.querySelector('.ai-detector-close');
    closeBtn.addEventListener('click', () => this.closeWidget());
    
    // Make draggable
    this.makeDraggable(container);
    
    // Auto-analyze disabled
  }
  
  makeDraggable(element) {
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;
    
    const header = element.querySelector('.ai-detector-header');
    
    header.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);
    
    function dragStart(e) {
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
      
      if (e.target === header || header.contains(e.target)) {
        isDragging = true;
      }
    }
    
    function drag(e) {
      if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        
        xOffset = currentX;
        yOffset = currentY;
        
        element.style.transform = `translate(${currentX}px, ${currentY}px)`;
      }
    }
    
    function dragEnd() {
      initialX = currentX;
      initialY = currentY;
      isDragging = false;
    }
  }
  
  async analyzeContent() {
    if (this.analysisInProgress) return;
    
    this.analysisInProgress = true;
    const analyzeBtn = document.querySelector('#analyze-content-btn');
    const statusIndicator = document.querySelector('#ai-status-indicator');
    const statusText = document.querySelector('#ai-status-text');
    const resultsDiv = document.querySelector('#analysis-results');
    
    // Update UI to show analysis in progress
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = 'Analyzing...';
    statusIndicator.className = 'status-indicator analyzing';
    statusText.textContent = 'Analyzing content...';
    resultsDiv.style.display = 'none';
    
    try {
      const result = await this.detector.analyseContent();
      this.displayResults(result);
      this.lastAnalysis = result;
    } catch (error) {
      console.error('Analysis failed:', error);
      statusText.textContent = 'Analysis failed. Please try again.';
      statusIndicator.className = 'status-indicator';
    } finally {
      this.analysisInProgress = false;
      analyzeBtn.disabled = false;
      analyzeBtn.textContent = 'Analyze Page';
    }
  }
  
  displayResults(result) {
    const statusIndicator = document.querySelector('#ai-status-indicator');
    const statusText = document.querySelector('#ai-status-text');
    const resultsDiv = document.querySelector('#analysis-results');
    const likelihoodFill = document.querySelector('#likelihood-fill');
    const likelihoodText = document.querySelector('#likelihood-text');
    const detailsDiv = document.querySelector('#analysis-details');
    
    // Update status
    const likelihood = result.likelihood;
    let statusClass, statusMessage;
    
    if (likelihood < 30) {
      statusClass = 'human';
      statusMessage = 'Likely human-written';
    } else if (likelihood < 70) {
      statusClass = 'mixed';
      statusMessage = 'Mixed or uncertain';
    } else {
      statusClass = 'ai';
      statusMessage = 'Likely AI-generated';
    }
    
    statusIndicator.className = `status-indicator ${statusClass}`;
    statusText.textContent = statusMessage;
    
    // Update likelihood bar
    likelihoodFill.style.width = `${likelihood}%`;
    likelihoodText.textContent = `${likelihood}%`;
    
    // Update details
    let detailsHTML = '';
    if (result.details) {
      if (typeof result.details === 'string') {
        detailsHTML = `<div>${result.details}</div>`;
      } else {
        detailsHTML = `
          <div><strong>Analysis Method:</strong> ${result.details.source || 'Unknown'}</div>
          ${result.details.provider ? `<div><strong>Provider:</strong> ${result.details.provider}</div>` : ''}
          ${result.details.wordCount ? `<div><strong>Words Analyzed:</strong> ${result.details.wordCount}</div>` : ''}
          ${result.details.score !== undefined ? `<div><strong>Raw Score:</strong> ${(result.details.score * 100).toFixed(1)}%</div>` : ''}
          ${result.details.aiIndicators !== undefined ? `<div><strong>AI Indicators:</strong> ${result.details.aiIndicators}</div>` : ''}
          ${result.details.humanIndicators !== undefined ? `<div><strong>Human Indicators:</strong> ${result.details.humanIndicators}</div>` : ''}
        `;
      }
    }
    
    detailsDiv.innerHTML = detailsHTML;
    resultsDiv.style.display = 'block';
  }
  
  toggleVisibility() {
    const content = document.querySelector('.ai-detector-content');
    const toggleBtn = document.querySelector('.ai-detector-toggle');
    
    if (content.classList.contains('collapsed')) {
      content.classList.remove('collapsed');
      toggleBtn.textContent = '−';
      this.isVisible = true;
    } else {
      content.classList.add('collapsed');
      toggleBtn.textContent = '+';
      this.isVisible = false;
    }
  }
  
  closeWidget() {
    const widget = document.querySelector('#ai-detector-widget');
    if (widget) {
      widget.remove();
    }
  }
}

// Configuration
const CONFIG = {
  // Set your preferred API provider
  provider: 'sapling', // Default to Sapling as requested
  
  // API endpoints for different providers
  endpoints: {
    gptzero: 'https://api.gptzero.me/v2/predict/text',
    originality: 'https://api.originality.ai/api/v1/scan/ai',
    copyleaks: 'https://api.copyleaks.com/v2/writer-detector',
    sapling: 'https://api.sapling.ai/api/v1/aidetect'
  },
  
  // Rate limiting - adjusted for Sapling's limits
  maxRequestsPerMinute: 20, // Sapling allows more requests
  requestCooldown: 3000 // 3 seconds between requests
};

// Initialize the extension
function initializeAIDetector() {
  // Check if already initialized
  if (document.querySelector('#ai-detector-widget')) {
    return;
  }
  
  // Wait for page to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initializeAIDetector, 1000);
    });
    return;
  }
  
  // Create and initialize UI
  const ui = new AIDetectorUI();
  ui.createUI();
  
  console.log('AI Content Detector initialized');
}

// Auto-initialize when script loads
initializeAIDetector();

// Re-initialize on navigation for SPAs
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    setTimeout(initializeAIDetector, 2000);
  }
}).observe(document, { subtree: true, childList: true });