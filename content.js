class AIContentDetector {
  constructor() {
    this.aiIndicators = {
      // Common AI-generated phrases
      commonPhrases: [
        'in conclusion',
        'furthermore',
        'moreover',
        'however',
        'it is important to note',
        'it should be noted',
        'as previously mentioned',
        'in summary',
        'to summarise',
        'in today\'s digital age',
        'in today\'s world',
        'it\'s worth noting',
        'delve into',
        'multifaceted',
        'comprehensive',
        'holistic approach',
        'myriad of',
        'plethora of'
      ],
      
      // Generic transition words that AI overuses
      transitions: [
        'additionally',
        'consequently',
        'therefore',
        'thus',
        'hence',
        'accordingly',
        'subsequently',
        'nonetheless',
        'nevertheless'
      ],
      
      // Overly formal structures
      formalStructures: [
        /in the realm of/gi,
        /it is imperative/gi,
        /one must consider/gi,
        /it is crucial to understand/gi,
        /plays a pivotal role/gi,
        /serves as a testament/gi,
        /paramount importance/gi
      ]
    };
    
    this.personalityIndicators = [
      /\bi\s+think\b/gi,
      /\bi\s+believe\b/gi,
      /\bmy\s+experience\b/gi,
      /\bwhen\s+i\b/gi,
      /\bi\s+remember\b/gi,
      /\byesterday\s+i\b/gi,
      /\blast\s+week\s+i\b/gi
    ];
  }
  
  analyseContent() {
    const textContent = this.extractTextContent();
    if (textContent.length < 100) {
      return { likelihood: 0, details: 'Content too short to analyse' };
    }
    
    const analysis = {
      phraseScore: this.analysePhrases(textContent),
      structureScore: this.analyseStructure(textContent),
      personalityScore: this.analysePersonality(textContent),
      repetitionScore: this.analyseRepetition(textContent),
      lengthScore: this.analyseSentenceLength(textContent)
    };
    
    const weightedScore = (
      analysis.phraseScore * 0.3 +
      analysis.structureScore * 0.25 +
      analysis.personalityScore * 0.2 +
      analysis.repetitionScore * 0.15 +
      analysis.lengthScore * 0.1
    );
    
    const likelihood = Math.round(Math.min(100, Math.max(0, weightedScore)));
    
    return {
      likelihood,
      details: {
        ...analysis,
        totalScore: likelihood,
        wordCount: textContent.split(/\s+/).length
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
  
  analysePhrases(text) {
    const lowerText = text.toLowerCase();
    let score = 0;
    let totalMatches = 0;
    
    // Check for common AI phrases
    this.aiIndicators.commonPhrases.forEach(phrase => {
      const matches = (lowerText.match(new RegExp(phrase, 'g')) || []).length;
      totalMatches += matches;
      score += matches * 15;
    });
    
    // Check for overuse of transitions
    this.aiIndicators.transitions.forEach(transition => {
      const matches = (lowerText.match(new RegExp(`\\b${transition}\\b`, 'g')) || []).length;
      totalMatches += matches;
      score += matches * 10;
    });
    
    // Check for formal structures
    this.aiIndicators.formalStructures.forEach(pattern => {
      const matches = (text.match(pattern) || []).length;
      totalMatches += matches;
      score += matches * 20;
    });
    
    // Normalise by text length
    const wordsCount = text.split(/\s+/).length;
    return Math.min(100, (score / wordsCount) * 1000);
  }
  
  analyseStructure(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    let score = 0;
    
    // Check for overly consistent sentence length
    const lengths = sentences.map(s => s.trim().split(/\s+/).length);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((acc, len) => acc + Math.pow(len - avgLength, 2), 0) / lengths.length;
    
    // Low variance suggests AI (too consistent)
    if (variance < 20 && avgLength > 15) {
      score += 30;
    }
    
    // Check for repetitive sentence starters
    const starters = sentences.map(s => s.trim().split(/\s+/).slice(0, 2).join(' ').toLowerCase());
    const starterCounts = {};
    starters.forEach(starter => {
      starterCounts[starter] = (starterCounts[starter] || 0) + 1;
    });
    
    const repeatedStarters = Object.values(starterCounts).filter(count => count > 2).length;
    score += repeatedStarters * 15;
    
    return Math.min(100, score);
  }
  
  analysePersonality(text) {
    let personalityMarkers = 0;
    
    this.personalityIndicators.forEach(pattern => {
      const matches = (text.match(pattern) || []).length;
      personalityMarkers += matches;
    });
    
    const wordsCount = text.split(/\s+/).length;
    const personalityRatio = personalityMarkers / (wordsCount / 100);
    
    // Higher personality markers = less likely to be AI
    return Math.max(0, 100 - (personalityRatio * 30));
  }
  
  analyseRepetition(text) {
    const words = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
    const wordCounts = {};
    
    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });
    
    let repetitionScore = 0;
    const totalWords = words.length;
    
    Object.values(wordCounts).forEach(count => {
      if (count > 3) {
        repetitionScore += (count - 3) * 5;
      }
    });
    
    return Math.min(100, (repetitionScore / totalWords) * 100);
  }
  
  analyseSentenceLength(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const lengths = sentences.map(s => s.trim().split(/\s+/).length);
    
    if (lengths.length === 0) return 0;
    
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    
    // AI tends to write moderately long, consistent sentences
    if (avgLength > 20 && avgLength < 35) {
      return 40;
    }
    
    return 0;
  }
}

// Run analysis when page loads
function runAnalysis() {
  const detector = new AIContentDetector();
  const result = detector.analyseContent();
  
  // Send results to background script
  chrome.runtime.sendMessage({
    action: 'updateBadge',
    likelihood: result.likelihood,
    details: result.details
  });
}

// Run analysis after a delay to ensure content is loaded
setTimeout(runAnalysis, 2000);

// Also run when content changes (for SPAs)
let lastContent = '';
const observer = new MutationObserver(() => {
  const currentContent = document.body.innerText;
  if (currentContent !== lastContent && currentContent.length > 100) {
    lastContent = currentContent;
    setTimeout(runAnalysis, 1000);
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
  characterData: true
});