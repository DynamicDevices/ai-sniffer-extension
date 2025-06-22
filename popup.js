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
  content.innerHTML = `
    <div class="likelihood-display ${likelihoodClass}">
      <div class="likelihood-number">${likelihood}%</div>
      <div class="likelihood-label">${likelihoodText}</div>
    </div>
    
    <div class="details">
      <div class="detail-item">
        <span class="detail-label">Word Count:</span>
        <span class="detail-value">${details.wordCount}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Phrase Score:</span>
        <span class="detail-value">${Math.round(details.phraseScore)}%</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Structure Score:</span>
        <span class="detail-value">${Math.round(details.structureScore)}%</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Personality Score:</span>
        <span class="detail-value">${Math.round(details.personalityScore)}%</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Repetition Score:</span>
        <span class="detail-value">${Math.round(details.repetitionScore)}%</span>
      </div>
    </div>
  `;
}