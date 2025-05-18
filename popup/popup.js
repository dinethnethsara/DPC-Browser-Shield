// DPC Shield - Popup Control Script
// Developed by Dineth Nethsara for DPC Media Unit

// Load current configuration
chrome.storage.local.get('config', (data) => {
    const config = data.config || {};
    
    // Set initial toggle states
    document.getElementById('extension-toggle').checked = config.enabled;
    document.getElementById('ad-blocking-toggle').checked = config.adBlockEnabled;
    document.getElementById('phishing-toggle').checked = config.phishingProtectionEnabled;
    document.getElementById('malware-toggle').checked = config.malwareProtectionEnabled;
    
    // Set provider selections
    if (config.adBlockProvider) {
        document.getElementById('ad-provider-select').value = config.adBlockProvider;
    }
    if (config.phishingProvider) {
        document.getElementById('phishing-provider-select').value = config.phishingProvider;
    }
});

// Add event listeners for all toggles
const toggles = [
    'extension-toggle',
    'ad-blocking-toggle',
    'phishing-toggle',
    'malware-toggle'
];

toggles.forEach(toggleId => {
    document.getElementById(toggleId).addEventListener('change', (e) => {
        updateConfig();
    });
});

// Add event listeners for provider selects
const selects = [
    'ad-provider-select',
    'phishing-provider-select'
];

selects.forEach(selectId => {
    document.getElementById(selectId).addEventListener('change', (e) => {
        updateConfig();
    });
});

// Update configuration in storage
function updateConfig() {
    chrome.storage.local.get('config', (data) => {
        const config = data.config || {};
        
        // Update toggle values
        config.enabled = document.getElementById('extension-toggle').checked;
        config.adBlockEnabled = document.getElementById('ad-blocking-toggle').checked;
        config.phishingProtectionEnabled = document.getElementById('phishing-toggle').checked;
        config.malwareProtectionEnabled = document.getElementById('malware-toggle').checked;
        
        // Update provider selections
        config.adBlockProvider = document.getElementById('ad-provider-select').value;
        config.phishingProvider = document.getElementById('phishing-provider-select').value;
        
        // Save updated configuration
        chrome.storage.local.set({ config }, () => {
            updateStatusText();
        });
    });
}

// Update status text based on configuration
function updateStatusText() {
    const statusText = document.getElementById('status-text');
    const enabled = document.getElementById('extension-toggle').checked;
    
    if (enabled) {
        statusText.textContent = 'Active and protecting your browser';
        statusText.style.color = '#666';
    } else {
        statusText.textContent = 'Extension is currently disabled';
        statusText.style.color = '#c62828';
    }
}