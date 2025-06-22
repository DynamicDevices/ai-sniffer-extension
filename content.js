class AIContentDetector {
  constructor() {
    // Replace with your actual API key
    this.apiKey = 'YOUR_API_KEY_HERE';
    this.apiEndpoint = 'https://api.gptzero.me/v2/predict/text'; // GPTZero example
    
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
    // Limit text length to avoid API limits (adjust based on your chosen API)
    const maxLength = 25000;
    const analysisText = text.length > maxLength ? text.substring(0, maxLength) : text;
    
    const response = await fetch(this.apiEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        document: analysisText,
        version: '2024-01-09'  // GPTZero API version
      })
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Parse API response (format varies by provider)
    return this.parseAPIResponse(data, text);
  }
  
  parseAPIResponse(apiData, originalText) {
    // GPTZero response format example
    const likelihood = Math.round((apiData.documents[0]?.average_generated_prob || 0) * 100);
    
    return {
      likelihood,
      details: {
        averageGeneratedProb: apiData.documents[0]?.average_generated_prob || 0,
        completelyGeneratedProb: apiData.documents[0]?.completely_generated_prob || 0,
        overallBurstiness: apiData.documents[0]?.overall_burstiness || 0,
        paragraphs: apiData.documents[0]?.paragraphs?.length || 0,
        sentences: apiData.documents[0]?.sentences?.length || 0,
        wordCount: originalText.split(/\s+/).length,
        source: 'api',
        provider: 'GPTZero'
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

// Fallback heuristic detector (simplified version of original)
class HeuristicDetector {
  analyseContent() {
    const textContent = this.extractTextContent();
    if (textContent.length < 100) {
      return { likelihood: 0, details: 'Content too short to analyse' };
    }
    
    // Simplified heuristic analysis
    const wordCount = textContent.split(/\s+/).length;
    const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const avgSentenceLength = sentences.reduce((acc, s) => acc + s.split(/\s+/).length, 0) / sentences.length;
    
    // Basic scoring
    let score = 0;
    if (avgSentenceLength > 20 && avgSentenceLength < 35) score += 30;
    if (textContent.toLowerCase().includes('furthermore')) score += 10;
    if (textContent.toLowerCase().includes('however')) score += 10;
    if (textContent.toLowerCase().includes('moreover')) score += 10;
    
    return {
      likelihood: Math.min(100, score),
      details: {
        wordCount,
        avgSentenceLength: Math.round(avgSentenceLength),
        sentenceCount: sentences.length,
        source: 'heuristic'
      }
    };
  }
  
  extractTextContent() {
    return document.body.innerText || '';
  }
}

// Configuration options
const CONFIG = {
  // Set your preferred API provider
  provider: 'gptzero', // 'gptzero', 'originality', 'copyleaks', 'sapling'
  
  // API endpoints for different providers
  endpoints: {
    gptzero: 'https://api.gptzero.me/v2/predict/text',
    originality: 'https://api.originality.ai/api/v1/scan/ai',
    copyleaks: 'https://api.copyleaks.com/v2/writer-detector',
    sapling: 'https://api.sapling.ai/api/v1/aidetect'
  },
  
  // Rate limiting
  maxRequestsPerMinute: 10,
  requestCooldown: 6000 // 6 seconds between requests
};

// Rate limiting mechanism
let lastRequestTime = 0;
let requestCount = 0;

async function runAnalysis() {
  // Check rate limiting
  const now = Date.now();
  if (now - lastRequestTime < CONFIG.requestCooldown) {
    console.log('Rate limit: waiting before next request');
    return;
  }
  
  if (requestCount >= CONFIG.maxRequestsPerMinute) {
    console.log('Rate limit: too many requests per minute');
    return;
  }
  
  lastRequestTime = now;
  requestCount++;
  
  // Reset counter every minute
  setTimeout(() => { requestCount = Math.max(0, requestCount - 1); }, 60000);
  
  try {
    const detector = new AIContentDetector();
    const result = await detector.analyseContent();
    
    // Send results to background script
    chrome.runtime.sendMessage({
      action: 'updateBadge',
      likelihood: result.likelihood,
      details: result.details
    });
  } catch (error) {
    console.error('Analysis failed:', error);
  }
}

// Run analysis after a delay to ensure content is loaded
setTimeout(runAnalysis, 3000);

// Also run when content changes (for SPAs) - with debouncing
let contentChangeTimeout;
let lastContent = '';

const observer = new MutationObserver(() => {
  const currentContent = document.body.innerText;
  if (currentContent !== lastContent && currentContent.length > 100) {
    lastContent = currentContent;
    
    // Debounce content changes
    clearTimeout(contentChangeTimeout);
    contentChangeTimeout = setTimeout(runAnalysis, 2000);
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
  characterData: true
});