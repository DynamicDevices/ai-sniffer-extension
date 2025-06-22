# API Setup Guide for AI Content Detector

## Quick Start

The extension now uses professional AI detection APIs instead of basic heuristics for much better accuracy. Here's how to set it up:

## 1. Choose Your API Provider

### Recommended: GPTZero (Best Overall)
- **Accuracy**: 96%+ for most AI models
- **Free Tier**: 2,500 words/month
- **Paid Plans**: From $10/month
- **Signup**: https://gptzero.me/

### Alternative: Originality.ai (Enterprise)
- **Accuracy**: 99.41% claimed
- **Pricing**: $0.01 per 100 words
- **Features**: Bulk scanning, team accounts
- **Signup**: https://originality.ai/

### Budget Option: Sapling AI
- **Accuracy**: Good for general use
- **Free Tier**: Available
- **Pricing**: Very affordable
- **Signup**: https://sapling.ai/

## 2. Get Your API Key

### For GPTZero:
1. Go to https://gptzero.me/
2. Sign up for an account
3. Go to Dashboard → API Keys
4. Create a new API key
5. Copy the key (starts with `gptzero_`)

### For Originality.ai:
1. Go to https://originality.ai/
2. Sign up and verify your account
3. Go to Settings → API Keys
4. Generate a new API key
5. Copy the key

## 3. Configure the Extension

### Method 1: Direct Code Edit (Recommended)
1. Open `content.js` in a text editor
2. Find line 4: `this.apiKey = 'YOUR_API_KEY_HERE';`
3. Replace `YOUR_API_KEY_HERE` with your actual API key
4. Save the file

### Method 2: Environment Variable (Advanced)
```javascript
// In content.js, replace the apiKey line with:
this.apiKey = process.env.AI_DETECTOR_API_KEY || 'YOUR_FALLBACK_KEY';
```

## 4. API Configuration Options

### GPTZero Configuration
```javascript
// In content.js constructor:
this.apiKey = 'gptzero_your_key_here';
this.apiEndpoint = 'https://api.gptzero.me/v2/predict/text';
this.provider = 'GPTZero';
```

### Originality.ai Configuration
```javascript
// In content.js constructor:
this.apiKey = 'your_originality_key_here';
this.apiEndpoint = 'https://api.originality.ai/api/v1/scan/ai';
this.provider = 'Originality.ai';
```

### Sapling AI Configuration
```javascript
// In content.js constructor:
this.apiKey = 'your_sapling_key_here';
this.apiEndpoint = 'https://api.sapling.ai/api/v1/aidetect';
this.provider = 'Sapling';
```

## 5. Rate Limiting & Costs

### GPTZero Limits:
- **Free**: 2,500 words/month
- **Pro**: 150,000 words ($10/month)
- **Max**: 500,000 words ($25/month)

### Originality.ai Limits:
- **Pay-per-scan**: $0.01 per 100 words
- **No monthly limits**
- **Bulk discounts available**

### Extension Built-in Limits:
- Maximum 10 requests per minute
- 6-second cooldown between requests
- Automatic fallback to heuristic if API fails

## 6. Testing Your Setup

1. Load the extension in Chrome
2. Visit a webpage with substantial text content
3. Check the extension badge - it should show a result
4. Click the extension icon
5. Verify it shows "✓ [Your Provider]" in the popup

## 7. Troubleshooting

### Common Issues:

**"No analysis available"**
- Check your API key is correct
- Verify you have API credits remaining
- Check browser console for error messages

**"Local Analysis" badge showing**
- API request failed, extension fell back to heuristics
- Check network connectivity
- Verify API endpoint is correct

**High rate limiting**
- Reduce browsing speed on text-heavy sites
- Consider upgrading API plan
- Extension automatically throttles requests

### Debug Mode:
Open Chrome DevTools → Console to see detailed error messages:
```javascript
// Add this to content.js for debugging:
console.log('API Key:', this.apiKey.substring(0, 10) + '...');
console.log('API Response:', data);
```

## 8. Privacy Considerations

**Data Sent to APIs:**
- Text content from webpages
- No personal information
- No browsing history

**Data Retention:**
- Varies by provider (check their privacy policies)
- GPTZero: 30 days
- Originality.ai: 90 days
- Sapling: 7 days

**Local Fallback:**
- If privacy is a concern, the extension falls back to local heuristic analysis
- No data leaves your browser in fallback mode

## 9. API Response Examples

### GPTZero Response:
```json
{
  "documents": [{
    "average_generated_prob": 0.85,
    "completely_generated_prob": 0.92,
    "overall_burstiness": 0.23,
    "paragraphs": 4,
    "sentences": 15
  }]
}
```

### Originality.ai Response:
```json
{
  "ai": {
    "likelihood": 0.88,
    "confidence": "high"
  },
  "words": 245
}
```

## 10. Updating API Keys

**Security Best Practice:**
- Never commit API keys to Git
- Use environment variables in production
- Rotate keys regularly
- Monitor usage in provider dashboards

**Quick Update:**
1. Edit `content.js`
2. Replace the old key with new key
3. Reload extension in Chrome (`chrome://extensions/`)

---

**Support**: If you encounter issues, check the provider's documentation or contact their support teams. The extension includes automatic fallback to ensure it keeps working even if the API is unavailable.