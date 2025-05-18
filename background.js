// DPC Shield - Background Script
// Developed by Dineth Nethsara for DPC Media Unit

// --- API Configuration - IMPORTANT: Replace with your actual API details ---
// VirusTotal API for malware scanning (free tier)
const MALWARE_API_URL = 'https://www.virustotal.com/api/v3/urls';
const MALWARE_API_KEY = 'YOUR_VIRUSTOTAL_API_KEY_HERE';

// Phishing Detection APIs
// Google Safe Browsing API (free tier)
const PHISHING_API_URL = 'https://safebrowsing.googleapis.com/v4/threatMatches:find';
const PHISHING_API_KEY = 'YOUR_GOOGLE_API_KEY_HERE';

// Alternative Phishing Detection API (PhishTank)
const PHISHTANK_API_URL = 'https://checkurl.phishtank.com/checkurl/';
const PHISHTANK_API_KEY = 'YOUR_PHISHTANK_API_KEY_HERE';

// Alternative Phishing Detection API (OpenPhish)
const OPENPHISH_API_URL = 'https://openphish.com/feed.txt';

// Ad Blocking APIs
const ADGUARD_API_URL = 'https://filters.adtidy.org/extension/chromium/filters/';
const ADGUARD_API_KEY = 'YOUR_ADGUARD_API_KEY_HERE';

// Alternative Ad Blocking API (EasyList)
const EASYLIST_API_URL = 'https://easylist-downloads.adblockplus.org/easylist.txt';

// Alternative Ad Blocking API (uBlock Origin)
const UBLOCK_API_URL = 'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/filters.txt';

// AbuseIPDB API for IP reputation checking
const ABUSEIPDB_API_URL = 'https://api.abuseipdb.com/api/v2/check';
const ABUSEIPDB_API_KEY = 'YOUR_ABUSEIPDB_API_KEY_HERE';

// URLScan.io API for website scanning
const URLSCAN_API_URL = 'https://urlscan.io/api/v1/scan/';
const URLSCAN_API_KEY = 'YOUR_URLSCAN_API_KEY_HERE';
// --- End API Configuration ---

// Configuration
const config = {
  enabled: true,
  adBlockEnabled: true,
  adBlockProvider: 'easylist', // Can be 'adguard', 'easylist', 'ublock'
  phishingProtectionEnabled: true,
  phishingProvider: 'google', // Can be 'google', 'phishtank', 'openphish'
  malwareProtectionEnabled: true,
  ipReputationEnabled: true,
  websiteScanEnabled: true,
  // Sample lists - in a real extension, these would be much more comprehensive
  // and would be regularly updated from a server or API
  maliciousDomains: [
    'malware-site.com',
    'phishing-example.com',
    'fake-bank.com'
  ],
  adDomains: [
    'ads.example.com',
    'analytics.tracker.com',
    'ad-server.net'
  ],
  maliciousIPs: [
    '192.168.1.1',
    '10.0.0.1'
  ],
  suspiciousKeywords: [
    'login',
    'password',
    'bank',
    'account'
  ]
};

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  // Store default configuration
  chrome.storage.local.set({ config });
  console.log('DPC Shield installed with default configuration');
});

// Anti-phishing protection
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  const data = await chrome.storage.local.get('config');
  if (!data.config.enabled || !data.config.phishingProtectionEnabled || details.url.startsWith('chrome://')) return;

  const targetUrl = details.url;

  const isPhishing = await isPhishingSiteWithAPI(targetUrl);
  if (isPhishing) {
    // Block navigation to phishing site
    chrome.tabs.update(details.tabId, {
      url: chrome.runtime.getURL('warning/phishing.html') +
           '?blocked=' + encodeURIComponent(targetUrl)
    });
  }
});

// Anti-ad protection using declarativeNetRequest (Manifest V3 compatible)
// Note: In a real extension, you would use declarativeNetRequest rules
// For now, we'll use content script to handle ad blocking
// See content.js for implementation

// Anti-malware protection
chrome.downloads.onCreated.addListener(async (downloadItem) => {
  const data = await chrome.storage.local.get('config');
  if (!data.config.enabled || !data.config.malwareProtectionEnabled) return;

  const fileUrl = downloadItem.url; // URL of the downloaded file
  const fileName = downloadItem.filename;

  const isMalicious = await isMalwareWithAPI(fileUrl, fileName);

  if (isMalicious) {
    // Cancel the download
    chrome.downloads.cancel(downloadItem.id, () => {
      console.log(`Cancelled malicious download: ${fileName}`);
      // Alert the user
      chrome.tabs.create({
        url: chrome.runtime.getURL('warning/malware.html') +
             '?file=' + encodeURIComponent(fileName) + '&url=' + encodeURIComponent(fileUrl)
      });
    });
  }
});

// Helper functions
async function isPhishingSiteWithAPI(urlToCheck) {
  if (!PHISHING_API_URL || PHISHING_API_URL === 'YOUR_PHISHING_API_ENDPOINT_HERE') {
    console.warn('Phishing API URL not configured. Falling back to local list.');
    // Fallback to local list if API is not configured
    const url = new URL(urlToCheck);
    const domain = url.hostname;
    return new Promise((resolve) => {
        chrome.storage.local.get('config', (data) => {
          resolve(data.config.maliciousDomains.some(badDomain =>
            domain === badDomain || domain.endsWith('.' + badDomain)
          ));
        });
      });
  }

  try {
    const response = await fetch(`${PHISHING_API_URL}?key=${PHISHING_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client: {
          clientId: "DPC_Shield",
          clientVersion: "1.0.0"
        },
        threatInfo: {
          threatTypes: ["SOCIAL_ENGINEERING"],
          platformTypes: ["ANY_PLATFORM"],
          threatEntryTypes: ["URL"],
          threatEntries: [{url: urlToCheck}]
        }
      })
    });

    if (!response.ok) {
      console.error(`Phishing API error: ${response.status} ${response.statusText}`);
      return false; // Fail safe: assume not phishing on API error
    }

    const result = await response.json();
    // Assuming the API returns a boolean field like 'is_phishing' or similar
    return result.is_phishing === true; // Adjust based on actual API response structure
  } catch (error) {
    console.error('Error calling Phishing API:', error);
    return false; // Fail safe: assume not phishing on network error
  }
}

async function isMalwareWithAPI(fileUrl, fileName) {
  if (!MALWARE_API_URL || MALWARE_API_URL === 'YOUR_MALWARE_API_ENDPOINT_HERE') {
    console.warn('Malware API URL not configured. Falling back to local checks.');
     // Fallback to basic local check if API is not configured
    const dangerousExtensions = ['.exe', '.bat', '.vbs', '.js', '.jar', '.dmg', '.cmd', '.scr'];
    return dangerousExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
  }

  try {
    // Note: Sending the entire file for scanning from a client-side extension is complex
    // and often not feasible due to size and security. Most APIs expect a file hash or URL.
    // Here, we'll assume the API can check a URL or requires a hash (which we are not calculating here for simplicity).
    // First get URL report from VirusTotal
    const urlId = btoa(fileUrl).replace(/=/g, '');
    const response = await fetch(`${MALWARE_API_URL}/${urlId}`, {
      method: 'GET',
      headers: {
        'x-apikey': MALWARE_API_KEY,
        'Accept': 'application/json'
      }
    })
    });

    if (!response.ok) {
      console.error(`Malware API error: ${response.status} ${response.statusText}`);
      return false; // Fail safe: assume not malware on API error
    }

    const result = await response.json();
    // Assuming the API returns a boolean field like 'is_malicious' or similar
    return result.is_malicious === true; // Adjust based on actual API response structure
  } catch (error) {
    console.error('Error calling Malware API:', error);
    return false; // Fail safe: assume not malware on network error
  }
}

// Old helper functions (can be removed or kept for fallback if API fails and no local check is done above)
/*
function isPhishingSite(domain) {
  return new Promise((resolve) => {
    chrome.storage.local.get('config', (data) => {
      resolve(data.config.maliciousDomains.some(badDomain =>
        domain === badDomain || domain.endsWith('.' + badDomain)
      ));
    });
  });
}

function isPotentiallyMalicious(fileName) {
  // Check file extension
  const dangerousExtensions = ['.exe', '.bat', '.vbs', '.js', '.jar'];
  const hasRiskyExtension = dangerousExtensions.some(ext =>
    fileName.toLowerCase().endsWith(ext)
  );
  // In a real extension, this would include more sophisticated checks
  return hasRiskyExtension;
}
*/

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'getStatus') {
    chrome.storage.local.get('config', (data) => {
      sendResponse({ config: data.config });
    });
    return true; // Required for async response
  } else if (message.action === 'updateConfig') {
    chrome.storage.local.set({ config: message.config });
    sendResponse({ success: true });
  } else if (message.action === 'scanUrl') {
    scanUrlWithAllServices(message.url)
      .then(result => sendResponse({ result }))
      .catch(error => sendResponse({ error }));
    return true;
  } else if (message.action === 'checkIpReputation') {
    checkIpReputation(message.ip)
      .then(result => sendResponse({ result }))
      .catch(error => sendResponse({ error }));
    return true;
  }
});

// Enhanced scanning function using all services
async function scanUrlWithAllServices(url) {
  const results = {};
  
  // Check with VirusTotal
  results.virustotal = await isMalwareWithAPI(url, '');
  
  // Check with Google Safe Browsing
  results.safebrowsing = await isPhishingSiteWithAPI(url);
  
  // Check with URLScan.io
  results.urlscan = await scanWithUrlScan(url);
  
  return results;
}

// IP reputation checking
async function checkIpReputation(ip) {
  try {
    const response = await fetch(`${ABUSEIPDB_API_URL}?ipAddress=${ip}`, {
      method: 'GET',
      headers: {
        'Key': ABUSEIPDB_API_KEY,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error checking IP reputation:', error);
    throw error;
  }
}

// URLScan.io scanning
async function scanWithUrlScan(url) {
  try {
    const response = await fetch(URLSCAN_API_URL, {
      method: 'POST',
      headers: {
        'API-Key': URLSCAN_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: url,
        visibility: 'public'
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error scanning with URLScan.io:', error);
    throw error;
  }
}

// Helper for ad domain check (if needed by content script or other parts)
function isAdDomain(domain) {
  return new Promise((resolve) => {
    chrome.storage.local.get('config', (data) => {
      resolve(data.config.adDomains.some(adDomain =>
        domain === adDomain || domain.endsWith('.' + adDomain)
      ));
    });
  });
}
