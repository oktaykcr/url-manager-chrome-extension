const ITEMS_PER_PAGE = 5;
let currentPage = 1;
let urls = [];
let globalHeaders = {};

document.getElementById('searchInput').focus();

// URL'leri localStorage'dan yükleme
function loadUrls() {
  chrome.storage.local.get(['urls'], function(result) {
    urls = result.urls || [];
    displayUrls();
  });
}

// URL'leri kaydetme
function saveUrls() {
  chrome.storage.local.set({ urls: urls });
}

// Global header'ları localStorage'dan yükleme
function loadGlobalHeaders() {
  chrome.storage.local.get(['globalHeaders'], function(result) {
    globalHeaders = result.globalHeaders || {};
    displayGlobalHeaders();
  });
}

// Global header'ları kaydetme
function saveGlobalHeaders() {
  chrome.storage.local.set({ globalHeaders: globalHeaders });
}

// Global header alanı ekleme
function addGlobalHeaderField() {
  const headerItem = document.createElement('div');
  headerItem.className = 'header-item';
  headerItem.innerHTML = `
    <input type="text" placeholder="Key" class="header-key">
    <input type="text" placeholder="Value" class="header-value">
    <button class="remove-btn">×</button>
  `;

  headerItem.querySelector('.remove-btn').addEventListener('click', function() {
    headerItem.remove();
    saveGlobalHeadersFromUI();
  });

  headerItem.querySelectorAll('input').forEach(input => {
    input.addEventListener('change', saveGlobalHeadersFromUI);
  });

  document.getElementById('globalHeadersList').appendChild(headerItem);
}

// UI'dan global header'ları toplama ve kaydetme
function saveGlobalHeadersFromUI() {
  const headers = {};
  document.querySelectorAll('#globalHeadersList .header-item').forEach(item => {
    const key = item.querySelector('.header-key').value.trim();
    const value = item.querySelector('.header-value').value.trim();
    if (key && value) {
      headers[key] = value;
    }
  });
  
  console.log('Saving global headers:', headers);
  chrome.storage.local.set({ globalHeaders: headers }, function() {
    if (chrome.runtime.lastError) {
      console.error('Error saving headers:', chrome.runtime.lastError);
    } else {
      console.log('Global headers saved successfully');
    }
  });
}

// Global header'ları görüntüleme
function displayGlobalHeaders() {
  const container = document.getElementById('globalHeadersList');
  container.innerHTML = '';

  Object.entries(globalHeaders).forEach(([key, value]) => {
    const headerItem = document.createElement('div');
    headerItem.className = 'header-item';
    headerItem.innerHTML = `
      <input type="text" placeholder="Key" class="header-key" value="${key}">
      <input type="text" placeholder="Value" class="header-value" value="${value}">
      <button class="remove-btn">×</button>
    `;

    headerItem.querySelector('.remove-btn').addEventListener('click', function() {
      headerItem.remove();
      saveGlobalHeadersFromUI();
    });

    headerItem.querySelectorAll('input').forEach(input => {
      input.addEventListener('change', saveGlobalHeadersFromUI);
    });

    container.appendChild(headerItem);
  });
}

// URL'leri görüntüleme
function displayUrls() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  
  chrome.storage.local.get(['urls'], function(result) {
    const urls = result.urls || [];
    const filteredUrls = urls.filter(url => 
      url.name.toLowerCase().includes(searchTerm)
    );

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const urlsToShow = filteredUrls.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filteredUrls.length / ITEMS_PER_PAGE);

    const urlList = document.getElementById('urlList');
    urlList.innerHTML = '';

    urlsToShow.forEach((url, index) => {
      const urlItem = document.createElement('div');
      urlItem.className = 'url-item';
      urlItem.innerHTML = `
        <div class="url-content">
          <a class="url-link" href="#" data-url="${url.address}" data-type="${url.type}">
            ${url.name}
          </a>
          <div class="url-buttons">
            <button class="small-icon-btn edit-btn" title="Edit">
              <svg viewBox="0 0 24 24" width="14" height="14">
                <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
            </button>
            <button class="small-icon-btn delete-btn" title="Delete">
              <svg viewBox="0 0 24 24" width="14" height="14">
                <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
        </div>
      `;

      // Edit butonu için event listener
      const editBtn = urlItem.querySelector('.edit-btn');
      editBtn.addEventListener('click', () => {
        // Orijinal URL listesinde gerçek index'i bul
        const originalIndex = urls.findIndex(u => 
          u.name === url.name && 
          u.address === url.address && 
          u.type === url.type
        );
        editUrl(url, index, originalIndex);
      });

      // Silme butonu için event listener
      const deleteBtn = urlItem.querySelector('.delete-btn');
      deleteBtn.addEventListener('click', () => deleteUrl(index, startIndex + index));

      // URL tıklama için event listener
      const urlLink = urlItem.querySelector('.url-link');
      urlLink.addEventListener('click', handleUrlClick);

      urlList.appendChild(urlItem);
    });

    // Pagination bilgilerini güncelle
    document.getElementById('currentPage').textContent = `Page: ${currentPage}`;
    document.getElementById('totalPages').textContent = `Total Pages: ${totalPages}`;
    document.getElementById('totalLinks').textContent = `Links: ${filteredUrls.length}`;
    
    // Pagination butonlarını güncelle
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = endIndex >= filteredUrls.length;
  });
}

// Edit fonksiyonu
function editUrl(url, displayIndex, actualIndex) {
  // Form alanlarını doldur
  document.getElementById('nameInput').value = url.name;
  document.getElementById('urlInput').value = url.address;
  document.getElementById('requestType').value = url.type;

  // POST isteği ise body'yi göster
  if (url.type === 'POST') {
    document.getElementById('postDetails').style.display = 'block';
    document.getElementById('requestBody').value = url.body ? JSON.stringify(url.body, null, 2) : '';
  } else {
    document.getElementById('postDetails').style.display = 'none';
  }

  // Add butonunu Update butonu olarak değiştir
  const addButton = document.getElementById('addUrl');
  addButton.textContent = 'Update';
  addButton.dataset.editing = 'true';
  addButton.dataset.editIndex = actualIndex;

  // Cancel butonunu göster
  document.getElementById('cancelEdit').style.display = 'inline-block';

  // Add New Link accordion'unu bul ve aç
  const addNewLinkHeader = document.getElementById('addNewLinkHeader');
  if (!addNewLinkHeader.classList.contains('active')) {
    addNewLinkHeader.click();
  }

  // Accordion'a scroll yap
  addNewLinkHeader.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(() => {
    document.getElementById('nameInput').focus();
  }, 300);
}

// Cancel fonksiyonu
function cancelEdit() {
  // Form alanlarını temizle
  document.getElementById('nameInput').value = '';
  document.getElementById('urlInput').value = '';
  document.getElementById('requestBody').value = '';
  document.getElementById('postDetails').style.display = 'none';

  // Add butonunu eski haline getir
  const addButton = document.getElementById('addUrl');
  addButton.textContent = 'Add';
  addButton.dataset.editing = 'false';
  delete addButton.dataset.editIndex;

  // Cancel butonunu gizle
  document.getElementById('cancelEdit').style.display = 'none';
}

// URL ekleme/güncelleme
document.getElementById('addUrl').addEventListener('click', function() {
  const name = document.getElementById('nameInput').value;
  const address = document.getElementById('urlInput').value;
  const type = document.getElementById('requestType').value;

  if (name && address) {
    const newUrl = {
      name: name,
      address: address,
      type: type
    };

    if (type === 'POST') {
      const body = document.getElementById('requestBody').value;
      try {
        newUrl.body = body ? JSON.parse(body) : null;
      } catch (e) {
        alert('Invalid JSON in request body');
        return;
      }
    }

    // Mevcut URL'leri al
    chrome.storage.local.get(['urls'], function(result) {
      let urls = result.urls || [];
      
      if (document.getElementById('addUrl').dataset.editing === 'true') {
        // Güncelleme işlemi
        const editIndex = parseInt(document.getElementById('addUrl').dataset.editIndex);
        urls[editIndex] = newUrl;
        
        // Butonu eski haline getir
        document.getElementById('addUrl').textContent = 'Add';
        document.getElementById('addUrl').dataset.editing = 'false';
        delete document.getElementById('addUrl').dataset.editIndex;
        
        // Cancel butonunu gizle
        document.getElementById('cancelEdit').style.display = 'none';
      } else {
        // Yeni URL ekleme
        urls.push(newUrl);
      }

      // URL'leri kaydet
      chrome.storage.local.set({ urls: urls }, function() {
        // Form alanlarını temizle
        document.getElementById('nameInput').value = '';
        document.getElementById('urlInput').value = '';
        document.getElementById('requestBody').value = '';
        document.getElementById('postDetails').style.display = 'none';
        
        // URL'leri yeniden göster
        loadUrls();
      });
    });
  }
});

// Modal işlemleri için yardımcı fonksiyonlar
function showModal() {
  document.getElementById('responseModal').style.display = 'block';
}

function hideModal() {
  document.getElementById('responseModal').style.display = 'none';
}

function displayResponse(data, isError = false) {
  const responseElement = document.getElementById('responseData');
  responseElement.className = isError ? 'error' : 'success';
  
  try {
    const formattedResponse = typeof response === 'string' 
      ? JSON.stringify(JSON.parse(response), null, 2)
      : JSON.stringify(response, null, 2);
    responseElement.textContent = formattedResponse;
  } catch (e) {
    responseElement.textContent = response;
  }
  showModal();
}

// POST detaylarını göster/gizle
function toggleRequestDetails() {
  const requestType = document.getElementById('requestType').value;
  const postDetails = document.getElementById('postDetails');
  
  if (requestType === 'POST') {
    postDetails.style.display = 'block';
    // İlk yüklemede header alanı yoksa ekle
    if (document.querySelectorAll('.header-item').length === 0) {
      addHeaderField();
    }
  } else {
    postDetails.style.display = 'none';
  }
}

// Yeni header alanı ekle
function addHeaderField() {
  const headersList = document.getElementById('headersList');
  const headerItem = document.createElement('div');
  headerItem.className = 'header-item';
  headerItem.innerHTML = `
    <input type="text" placeholder="Key" class="header-key">
    <input type="text" placeholder="Value" class="header-value">
    <button class="remove-btn">×</button>
  `;
  headersList.appendChild(headerItem);

  // Silme butonu için event listener
  headerItem.querySelector('.remove-btn').addEventListener('click', () => {
    headerItem.remove();
  });
}

// URL tıklama işleyicisini güncelle
async function handleUrlClick(event) {
  const url = event.target.dataset.url;
  const requestType = event.target.dataset.type;
  const urlData = urls.find(u => u.address === url && u.type === requestType);

  console.log(`${requestType} Request to: ${url}`);
  console.log('Request Details:', {
    type: requestType,
    url: url,
    timestamp: new Date().toISOString()
  });

  if (requestType === 'GET') {
    chrome.tabs.create({ url: url });
    console.groupEnd();
  } else if (requestType === 'POST') {
    try {
      const fetchOptions = {
        method: 'POST',
        mode: 'cors',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };

      if (urlData.body) {
        fetchOptions.body = JSON.stringify(urlData.body);
      }

      console.log('Request Headers:', fetchOptions.headers);
      console.log('Request Body:', urlData.body || 'No body');

      const response = await fetch(url, fetchOptions);
      const data = await response.text();

      console.log('Response Status:', response.status);
      console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
      console.log('Response Body:', data);
      console.groupEnd();

      // Yanıtı yeni sekmede göster
      const responseHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>POST Response - ${url}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              background-color: #f8f9fa;
              min-height: 100vh;
            }
            .container {
              margin: 0;
              background: white;
              min-height: 100vh;
              display: flex;
              flex-direction: column;
            }
            .header {
              background: white;
              padding: 20px;
              border-bottom: 1px solid #dee2e6;
              position: sticky;
              top: 0;
              z-index: 100;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .url {
              color: #666;
              word-break: break-all;
              margin-top: 5px;
            }
            .response-container {
              flex: 1;
              padding: 0;
              margin: 0;
              background-color: #1e1e1e;
            }
            pre {
              margin: 0;
              padding: 20px;
              color: #d4d4d4;
              font-family: 'Consolas', 'Monaco', monospace;
              font-size: 14px;
              line-height: 1.5;
              overflow-x: auto;
              white-space: pre-wrap;
              word-wrap: break-word;
            }
            .status {
              display: inline-block;
              padding: 4px 8px;
              border-radius: 4px;
              margin: 10px 0;
              font-size: 14px;
            }
            .status-success {
              background-color: #d4edda;
              color: #155724;
            }
            .status-error {
              background-color: #f8d7da;
              color: #721c24;
            }
            h2 {
              margin: 0;
              font-size: 20px;
              color: #333;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>POST Request Result</h2>
              <div class="url">${url}</div>
              <div>
                <span class="status ${response.ok ? 'status-success' : 'status-error'}">
                  Status: ${response.status} ${response.statusText}
                </span>
              </div>
            </div>
            <div class="response-container">
              <pre id="responseData">${formatResponse(data)}</pre>
            </div>
          </div>
        </body>
        </html>
      `;

      const blob = new Blob([responseHtml], { type: 'text/html' });
      const blobUrl = URL.createObjectURL(blob);
      chrome.tabs.create({ url: blobUrl });

    } catch (error) {
      console.error('Error:', error);
      console.groupEnd();
      
      // Hata durumunda da yeni sekmede göster
      const errorHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Error - ${url}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              background-color: #f8f9fa;
            }
            .container {
              max-width: 1200px;
              margin: 0 auto;
              background: white;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .error-message {
              color: #dc3545;
              background-color: #f8d7da;
              padding: 15px;
              border-radius: 6px;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Hata Oluştu</h2>
            <div class="url">${url}</div>
            <div class="error-message">${error.message}</div>
          </div>
        </body>
        </html>
      `;
      const blob = new Blob([errorHtml], { type: 'text/html' });
      const blobUrl = URL.createObjectURL(blob);
      chrome.tabs.create({ url: blobUrl });
    }
  }
}

// HTML karakterlerini escape et ve formatla
function formatResponse(data) {
  try {
    // Önce JSON parse edip sonra stringify yaparak formatla
    const jsonData = JSON.parse(data);
    return JSON.stringify(jsonData, null, 2)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  } catch {
    // JSON parse edilemezse düz metin olarak döndür
    return data
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

// Modal kapatma işleyicileri
document.querySelector('.close').addEventListener('click', hideModal);
document.getElementById('responseModal').addEventListener('click', (event) => {
  if (event.target === event.currentTarget) {
    hideModal();
  }
});

// ESC tuşu ile modalı kapatma
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    hideModal();
  }
});

// Tüm URL'leri silme
document.getElementById('deleteAll').addEventListener('click', () => {
  if (confirm('Are you sure you want to delete all links?')) {
    urls = [];
    saveUrls();
    displayUrls();
  }
});

// Sayfalama işlemleri
document.getElementById('prevPage').addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    displayUrls();
  }
});

document.getElementById('nextPage').addEventListener('click', () => {
  currentPage++;
  displayUrls();
});

// Arama işlemi
document.getElementById('searchInput').addEventListener('input', () => {
  currentPage = 1;
  displayUrls();
});

// Export işlemi
document.getElementById('exportUrls').addEventListener('click', function() {
  // URL'leri ve global header'ları al
  chrome.storage.local.get(['urls', 'globalHeaders'], function(result) {
    const exportData = {
      urls: result.urls || [],
      globalHeaders: result.globalHeaders || {}
    };

    // JSON dosyası oluştur
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    
    // Dosyayı indir
    const a = document.createElement('a');
    a.href = url;
    a.download = 'url_manager_backup.json';
    a.click();
    
    URL.revokeObjectURL(url);
  });
});

// Import işlemi
document.getElementById('importUrls').addEventListener('click', function() {
  const fileInput = document.getElementById('importFile');
  fileInput.click();
});

document.getElementById('importFile').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const importData = JSON.parse(e.target.result);
        
        // URL'leri ve global header'ları kaydet
        chrome.storage.local.set({
          urls: importData.urls || [],
          globalHeaders: importData.globalHeaders || {}
        }, function() {
          // Sayfayı yenile
          loadUrls();
          loadGlobalHeaders();
          // Input'u temizle
          e.target.value = '';
        });
      } catch (error) {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  }
});

// Kopyalama işlevi
function showCopyTooltip(x, y) {
  const tooltip = document.createElement('div');
  tooltip.className = 'copy-tooltip';
  tooltip.textContent = 'Kopyalandı!';
  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
  document.body.appendChild(tooltip);
  
  setTimeout(() => {
    tooltip.remove();
  }, 1500);
}

// URL silme
function deleteUrl(displayIndex, actualIndex) {
  chrome.storage.local.get(['urls'], function(result) {
    const urls = result.urls || [];
    urls.splice(actualIndex, 1);
    chrome.storage.local.set({ urls: urls }, function() {
      displayUrls();
    });
  });
}

// Global header'ları yükle ve görüntüle
function loadAndDisplayGlobalHeaders() {
  chrome.storage.local.get(['globalHeaders'], function(result) {
    const globalHeaders = result.globalHeaders || {};
    const container = document.getElementById('globalHeadersList');
    container.innerHTML = '';

    Object.entries(globalHeaders).forEach(([key, value]) => {
      const headerItem = document.createElement('div');
      headerItem.className = 'header-item';
      headerItem.innerHTML = `
        <input type="text" placeholder="Key" class="header-key" value="${key}">
        <input type="text" placeholder="Value" class="header-value" value="${value}">
        <button class="remove-btn">×</button>
      `;

      headerItem.querySelector('.remove-btn').addEventListener('click', function() {
        headerItem.remove();
        saveGlobalHeadersFromUI();
      });

      headerItem.querySelectorAll('input').forEach(input => {
        input.addEventListener('change', saveGlobalHeadersFromUI);
        input.addEventListener('blur', saveGlobalHeadersFromUI);
      });

      container.appendChild(headerItem);
    });
  });
}

// DOM yüklendiğinde çalışacak kodlar
document.addEventListener('DOMContentLoaded', function() {
  loadUrls();
  loadGlobalHeaders();
  
  // Aktif tab'in URL'sini al
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs[0] && tabs[0].url) {
      document.getElementById('urlInput').value = tabs[0].url;
    }
  });

  // Event listener'ları ekle
  document.getElementById('addGlobalHeader').addEventListener('click', addGlobalHeaderField);
  document.getElementById('requestType').addEventListener('change', toggleRequestDetails);
  document.getElementById('prevPage').addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      displayUrls();
    }
  });
  document.getElementById('nextPage').addEventListener('click', () => {
    currentPage++;
    displayUrls();
  });
  document.getElementById('searchInput').addEventListener('input', () => {
    currentPage = 1;
    displayUrls();
  });

  // Cancel butonu için event listener
  document.getElementById('cancelEdit').addEventListener('click', function() {
    // Form alanlarını temizle
    document.getElementById('nameInput').value = '';
    document.getElementById('urlInput').value = '';
    document.getElementById('requestBody').value = '';
    document.getElementById('postDetails').style.display = 'none';

    // Add butonunu eski haline getir
    const addButton = document.getElementById('addUrl');
    addButton.textContent = 'Add';
    addButton.dataset.editing = 'false';
    delete addButton.dataset.editIndex;

    // Cancel butonunu gizle
    document.getElementById('cancelEdit').style.display = 'none';
  });

  // Accordion işlevselliği
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', function() {
      this.classList.toggle('active');
      const content = this.nextElementSibling;
      if (content.style.maxHeight) {
        content.style.maxHeight = null;
      } else {
        content.style.maxHeight = content.scrollHeight + "px";
      }
    });
  });

  // Menü işlevselliği
  const menuBtn = document.querySelector('.menu-btn');
  const menuContent = document.querySelector('.menu-content');

  menuBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    menuContent.classList.toggle('show');
  });

  // Menü dışına tıklandığında menüyü kapat
  document.addEventListener('click', function(e) {
    if (!menuContent.contains(e.target) && !menuBtn.contains(e.target)) {
      menuContent.classList.remove('show');
    }
  });

  // ESC tuşuna basıldığında menüyü kapat
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      menuContent.classList.remove('show');
    }
  });

  // Versiyon bilgisini al ve göster
  const manifest = chrome.runtime.getManifest();
  document.getElementById('versionInfo').textContent = `v${manifest.version}`;
}); 