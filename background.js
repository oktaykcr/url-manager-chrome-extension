// Global header'ları saklamak için
let globalHeaders = {};

// Debug için helper fonksiyon
function debugLog(type, message, data = null) {
    const log = `[${new Date().toISOString()}] ${type}: ${message}`;
    console.log(log, data || '');
}

// Global header'ları yükle
chrome.storage.local.get(['globalHeaders'], function(result) {
    globalHeaders = result.globalHeaders || {};
    console.log('Loaded global headers:', globalHeaders);
    updateHeaderRules();
});

// Storage değişikliklerini dinle
chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace === 'local' && changes.globalHeaders) {
        globalHeaders = changes.globalHeaders.newValue || {};
        console.log('Global headers updated:', globalHeaders);
        updateHeaderRules();
    }
});

// İstekleri yakala ve header'ları ekle
chrome.webRequest.onBeforeSendHeaders.addListener(
  function(details) {
    // URL'e özel header'ları al
    chrome.storage.local.get(['urls'], function(result) {
      const urls = result.urls || [];
      const urlData = urls.find(u => u.address === details.url);
      
      // Header'ları birleştir
      const headers = {
        ...globalHeaders,
        ...(urlData?.headers || {})
      };

      // Header'ları ekle
      Object.entries(headers).forEach(([key, value]) => {
        // Mevcut header'ı bul veya yeni ekle
        let found = false;
        for (let i = 0; i < details.requestHeaders.length; i++) {
          if (details.requestHeaders[i].name.toLowerCase() === key.toLowerCase()) {
            details.requestHeaders[i].value = value;
            found = true;
            break;
          }
        }
        if (!found) {
          details.requestHeaders.push({ name: key, value: value });
        }
      });

      console.log('Modified headers for URL:', details.url, details.requestHeaders);
    });

    return { requestHeaders: details.requestHeaders };
  },
  { urls: ["<all_urls>"] },
  ["blocking", "requestHeaders", "extraHeaders"]
);

// Header kurallarını güncelle
async function updateHeaderRules() {
    try {
        // Mevcut kuralları temizle
        const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
        const removeRuleIds = existingRules.map(rule => rule.id);

        // Yeni kuralları oluştur
        const addRules = Object.entries(globalHeaders).map(([key, value], index) => ({
            "id": index + 1,
            "priority": 1,
            "action": {
                "type": "modifyHeaders",
                "requestHeaders": [
                    {
                        "header": key,
                        "operation": "set",
                        "value": value
                    }
                ]
            },
            "condition": {
                "urlFilter": "*",
                "resourceTypes": ["main_frame", "xmlhttprequest"]
            }
        }));

        // Kuralları güncelle
        await chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: removeRuleIds,
            addRules: addRules
        });

        console.log('Rules updated:', addRules);
    } catch (error) {
        console.error('Error updating rules:', error);
    }
}

// İstek kurallarını izle
chrome.declarativeNetRequest.getMatchedRules({ tabId: -1 })
    .then(rules => {
        debugLog('MATCH', 'Matched rules', rules);
    })
    .catch(error => {
        debugLog('ERROR', 'Failed to get matched rules', error);
    });

// Tüm istekleri izle (debug için)
chrome.webRequest.onBeforeSendHeaders.addListener(
    function(details) {
        debugLog('REQUEST', `Headers for ${details.url}`, details.requestHeaders);
        return { requestHeaders: details.requestHeaders };
    },
    { urls: ["<all_urls>"] },
    ["requestHeaders"]
);

// Mesaj dinleyicisi ekle
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getUrl') {
    const headers = {
      ...globalHeaders,
      ...(request.headers || {})
    };

    console.log('Sending request to:', request.url);
    console.log('With headers:', headers);

    // Fetch isteği yap
    fetch(request.url, {
      method: 'GET',
      headers: headers
    })
    .then(async response => {
      const data = await response.text();
      console.log('Response received:', data.substring(0, 100) + '...');
      sendResponse({
        success: true,
        data: data,
        status: response.status,
        headers: Object.fromEntries(response.headers)
      });
    })
    .catch(error => {
      console.error('Fetch error:', error);
      sendResponse({
        success: false,
        error: error.message
      });
    });

    return true; // Async response için gerekli
  }
});

// Statik kuralları tanımla
chrome.storage.local.get(['globalHeaders'], function(result) {
  const globalHeaders = result.globalHeaders || {};
  
  const rules = Object.entries(globalHeaders).map((key, value, index) => ({
    "id": index + 1,
    "priority": 1,
    "action": {
      "type": "modifyHeaders",
      "requestHeaders": [
        {
          "header": key,
          "operation": "set",
          "value": value
        }
      ]
    },
    "condition": {
      "urlFilter": "*",
      "resourceTypes": ["main_frame", "xmlhttprequest"]
    }
  }));

  // Kuralları uygula
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: rules.map(rule => rule.id),
    addRules: rules
  });
}); 