// DPC Shield - Content Script
// Developed by Dineth Nethsara for DPC Media Unit

// Configuration (will be updated from storage)
let config = {
  enabled: true,
  adBlockEnabled: true,
  phishingProtectionEnabled: true,
  malwareProtectionEnabled: true,
  adDomains: []
};

// Load configuration from storage
chrome.storage.local.get('config', (data) => {
  if (data.config) {
    config = data.config;
  }
});

// Listen for configuration changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.config) {
    config = changes.config.newValue;
  }
});

// Ad blocking functionality
function blockAds() {
  if (!config.enabled || !config.adBlockEnabled) return;

  // Block common ad elements
  const adSelectors = [
    'div[id*="banner"]',
    'div[id*="ad-"]',
    'div[id*="ad_"]',
    'div[class*="ad_"]',
    'div[class*="ad-"]',
    'iframe[src*="ad"]',
    'iframe[id*="ad"]',
    'img[src*="ad"]',
    'a[href*="doubleclick"]',
    'a[href*="googleadservices"]'
  ];

  // Find and hide ad elements
  adSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      // Check if this is likely an ad
      if (isLikelyAd(element)) {
        element.style.display = 'none';
      }
    });
  });
}

// Helper function to determine if an element is likely an ad
function isLikelyAd(element) {
  // Check element attributes and content
  const innerHTML = element.innerHTML.toLowerCase();
  const outerHTML = element.outerHTML.toLowerCase();
  
  // Keywords that suggest this is an ad
  const adKeywords = ['advertisement', 'sponsor', 'promoted', 'ad', 'banner'];
  
  // Check if any ad keywords are present
  const containsAdKeyword = adKeywords.some(keyword => 
    innerHTML.includes(keyword) || outerHTML.includes(keyword)
  );
  
  // Check if element or its parents have suspicious dimensions (common ad sizes)
  const hasAdDimensions = hasCommonAdDimensions(element);
  
  return containsAdKeyword || hasAdDimensions;
}

// Check if element has common ad dimensions
function hasCommonAdDimensions(element) {
  const commonAdSizes = [
    [300, 250], // Medium Rectangle
    [728, 90],  // Leaderboard
    [160, 600], // Wide Skyscraper
    [320, 50],  // Mobile Banner
    [300, 600]  // Half Page
  ];
  
  const width = element.offsetWidth;
  const height = element.offsetHeight;
  
  return commonAdSizes.some(size => 
    Math.abs(width - size[0]) < 10 && Math.abs(height - size[1]) < 10
  );
}

// Phishing protection - check for suspicious forms
function checkForPhishingForms() {
  if (!config.enabled || !config.phishingProtectionEnabled) return;
  
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    // Check if form contains password fields and looks suspicious
    const passwordFields = form.querySelectorAll('input[type="password"]');
    if (passwordFields.length > 0) {
      // Check if form is potentially phishing
      if (isPotentialPhishingForm(form)) {
        // Add warning to the form
        addPhishingWarning(form);
      }
    }
  });
}

// Check if a form is potentially a phishing form
function isPotentialPhishingForm(form) {
  // Check if form is submitted to a different domain
  const actionUrl = form.getAttribute('action');
  if (actionUrl && actionUrl.startsWith('http')) {
    try {
      const formDomain = new URL(actionUrl).hostname;
      const pageDomain = window.location.hostname;
      
      // If form submits to a different domain, it might be suspicious
      if (formDomain !== pageDomain) {
        return true;
      }
    } catch (e) {
      // Invalid URL, might be suspicious
      return true;
    }
  }
  
  // Check for other suspicious attributes
  return false;
}

// Add warning to potentially phishing forms
function addPhishingWarning(form) {
  const warning = document.createElement('div');
  warning.className = 'dpc-shield-warning';
  warning.style.backgroundColor = '#ffebee';
  warning.style.color = '#c62828';
  warning.style.padding = '10px';
  warning.style.margin = '10px 0';
  warning.style.border = '1px solid #ef9a9a';
  warning.style.borderRadius = '4px';
  warning.innerHTML = `
    <strong>⚠️ DPC Shield Warning:</strong> 
    This form might be attempting to steal your information. 
    Be careful about entering sensitive data.
  `;
  
  // Insert warning before the form
  form.parentNode.insertBefore(warning, form);
}

// Run our protection when the page loads
document.addEventListener('DOMContentLoaded', () => {
  blockAds();
  checkForPhishingForms();
});

// Also run periodically to catch dynamically added content
setInterval(() => {
  blockAds();
  checkForPhishingForms();
}, 3000);
