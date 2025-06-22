chrome.runtime.onInstalled.addListener(() => {
  console.log('AI Content Detector installed');
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateBadge') {
    const likelihood = request.likelihood;
    let badgeText = '';
    let badgeColor = '#4CAF50';
    
    if (likelihood >= 80) {
      badgeText = 'HIGH';
      badgeColor = '#F44336';
    } else if (likelihood >= 60) {
      badgeText = 'MED';
      badgeColor = '#FF9800';
    } else if (likelihood >= 40) {
      badgeText = 'LOW';
      badgeColor = '#FFEB3B';
    } else {
      badgeText = 'NONE';
      badgeColor = '#4CAF50';
    }
    
    chrome.action.setBadgeText({
      text: badgeText,
      tabId: sender.tab.id
    });
    
    chrome.action.setBadgeBackgroundColor({
      color: badgeColor,
      tabId: sender.tab.id
    });
    
    // Store the analysis for the popup
    chrome.storage.local.set({
      [`analysis_${sender.tab.id}`]: {
        likelihood: likelihood,
        details: request.details,
        url: sender.tab.url,
        timestamp: Date.now()
      }
    });
  }
});