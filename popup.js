document.addEventListener('DOMContentLoaded', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  chrome.storage.local.get([`analysis_${tab.id}`], (result) => {
    const analysis = result[`analysis_${tab.id}`];
    
    if (analysis) {
      displayAnalysis(analysis);
    } else {
      document.getElementById('content').innerHTML = 
        '<div class="status">No analysis available for this page</div>';
    }
  });
});

function displayAnalysis(analysis) {
  const { likelihood, details } = analysis;
  
  let likelihoodClass = 'none';
  let likelihoodText = 'Unlikely AI';
  
  if (likelihood >= 80) {
    likelihoodClass = 'high';
    likelihoodText = 'Likely AI';
  } else if (likelihood >= 60) {
    likelihoodClass = 'medium';
    likelihoodText = 'Possibly AI';
  } else if (likelihood >= 40) {
    likelihoodClass = 'low';
    likelihoodText = 'Maybe AI';
  }
  
  const content = document.getElementById('content');
  
  // Different display based on source (API vs heuristic)
  if (details.source === 'api') {
    content.innerHTML = `
      <div class="likelihood-display ${likelihoodClass}">
        <div class="likelihood-number">${likelihood}%</div>
        <div class="likelihood-label">${likelihoodText}</div>
        <div class="api-badge">✓ ${details.provider || 'API'}</div>
      </div>
      
      <div class="details">
        <div class="detail-item">
          <span class="detail-label">Word Count:</span>
          <span class="detail-value">${details.wordCount || 'N/A'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Generated Probability:</span>
          <span class="detail-value">${Math.round((details.averageGeneratedProb || 0) * 100)}%</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Completely Generated:</span>
          <span class="detail-value">${Math.round((details.completelyGeneratedProb || 0) * 100)}%</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Sentences Analysed:</span>
          <span class="detail-value">${details.sentences || 'N/A'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Detection Source:</span>
          <span class="detail-value">${details.provider || 'API'}</span>
        </div>
      </div>
    `;
  } else {
    // Fallback heuristic display
    content.innerHTML = `
      <div class="likelihood-display ${likelihoodClass}">
        <div class="likelihood-number">${likelihood}%</div>
        <div class="likelihood-label">${likelihoodText}</div>
        <div class="api-badge warning">⚠ Local Analysis</div>
      </div>
      
      <div class="details">
        <div class="detail-item">
          <span class="detail-label">Word Count:</span>
          <span class="detail-value">${details.wordCount || 'N/A'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Avg Sentence Length:</span>
          <span class="detail-value">${details.avgSentenceLength || 'N/A'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Sentences:</span>
          <span class="detail-value">${details.sentenceCount || 'N/A'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Detection Source:</span>
          <span class="detail-value">Local Heuristic</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Note:</span>
          <span class="detail-value">API unavailable</span>
        </div>
      </div>
    `;
  }
}