const ITEMS_PER_PAGE = 5;
let currentPage = 1;
let urls = [];
let globalHeaders = {};
let currentCategoryFilter = '';

// URL'leri localStorage'dan yükleme
function loadUrls() {
  chrome.storage.local.get(['urls'], function(result) {
    urls = result.urls || [];
    
    // Backward compatibility: Eğer category yoksa "Other" olarak ayarla
    let needsUpdate = false;
    urls = urls.map(url => {
      if (!url.category) {
        needsUpdate = true;
        return { ...url, category: 'Other' };
      }
      return url;
    });
    
    // Eğer category eklendiyse, storage'ı güncelle
    if (needsUpdate) {
      saveUrls();
    }
    
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
  
  chrome.storage.local.set({ globalHeaders: headers }, function() {
    if (chrome.runtime.lastError) {
      console.error('Error saving headers:', chrome.runtime.lastError);
    }
  });
}

// Kategori listesini güncelle
function updateCategoryList(urlList = null) {
  // Eğer urlList verilmemişse global urls kullan
  const urlsToUse = urlList || urls;
  
  const categories = new Set();
  urlsToUse.forEach(url => {
    if (url.category) {
      categories.add(url.category);
    }
  });
  
  // Datalist'i güncelle (kategori input için - Add New Link formunda)
  const categoryDatalist = document.getElementById('categoryList');
  if (categoryDatalist) {
    categoryDatalist.innerHTML = '';
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      categoryDatalist.appendChild(option);
    });
  }
  
  // Kategori dropdown'unu güncelle
  updateCategoryDropdown(categories);
}

// Kategori dropdown'unu güncelle ve filtrele
function updateCategoryDropdown(categories = null, filterText = '', urlList = null) {
  if (categories === null) {
    // Eğer urlList verilmemişse global urls kullan
    const urlsToUse = urlList || urls;
    
    categories = new Set();
    urlsToUse.forEach(url => {
      if (url.category) {
        categories.add(url.category);
      }
    });
  }
  
  const dropdown = document.getElementById('categoryDropdown');
  if (!dropdown) {
    return;
  }
  
  dropdown.innerHTML = '';
  
  // "All Categories" seçeneğini ekle
  const allItem = document.createElement('div');
  allItem.className = 'category-dropdown-item';
  allItem.dataset.value = '';
  allItem.textContent = 'All Categories';
  if (!currentCategoryFilter) {
    allItem.classList.add('selected');
  }
  dropdown.appendChild(allItem);
  
  // Kategorileri sırala ve filtrele (case insensitive)
  const sortedCategories = Array.from(categories).sort();
  const filterLower = filterText.toLowerCase();
  const filteredCategories = filterText 
    ? sortedCategories.filter(cat => cat.toLowerCase().includes(filterLower))
    : sortedCategories;
  
  if (filteredCategories.length === 0 && filterText) {
    const noResults = document.createElement('div');
    noResults.className = 'category-dropdown-item no-results';
    noResults.textContent = 'No categories found';
    dropdown.appendChild(noResults);
  } else {
    filteredCategories.forEach(category => {
      const item = document.createElement('div');
      item.className = 'category-dropdown-item';
      item.dataset.value = category;
      item.textContent = category;
      
      // Case insensitive karşılaştırma
      if (currentCategoryFilter && 
          currentCategoryFilter.toLowerCase() === category.toLowerCase()) {
        item.classList.add('selected');
      }
      
      dropdown.appendChild(item);
    });
  }
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
  const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
  
  chrome.storage.local.get(['urls'], function(result) {
    // Global urls değişkenini güncelle
    urls = result.urls || [];
    
    // Backward compatibility: Eğer category yoksa "Other" olarak ayarla
    let needsUpdate = false;
    urls = urls.map(url => {
      if (!url.category) {
        needsUpdate = true;
        return { ...url, category: 'Other' };
      }
      return url;
    });
    
    // Eğer category eklendiyse, storage'ı güncelle
    if (needsUpdate) {
      saveUrls();
    }
    
    // Kategori listesini güncelle (urls'i parametre olarak geç)
    updateCategoryList(urls);
    
    // Filtreleme: arama ve kategori
    const filteredUrls = urls.filter(url => {
      // Arama filtresi - name, address veya category içinde ara (contains)
      const matchesSearch = !searchTerm || 
                           (url.name && url.name.toLowerCase().includes(searchTerm)) || 
                           (url.address && url.address.toLowerCase().includes(searchTerm)) ||
                           (url.category && url.category.toLowerCase().includes(searchTerm));
      
      // Kategori filtresi - case insensitive karşılaştırma
      const matchesCategory = !currentCategoryFilter || 
                             (url.category && url.category.toLowerCase() === currentCategoryFilter.toLowerCase());
      
      return matchesSearch && matchesCategory;
    });
    
    // Arama varsa, sonuçları öncelik sırasına göre sırala
    if (searchTerm) {
      filteredUrls.sort((a, b) => {
        const aName = (a.name || '').toLowerCase();
        const bName = (b.name || '').toLowerCase();
        const aAddress = (a.address || '').toLowerCase();
        const bAddress = (b.address || '').toLowerCase();
        const aCategory = (a.category || '').toLowerCase();
        const bCategory = (b.category || '').toLowerCase();
        
        // Skorlama sistemi (düşük skor = daha önce)
        let aScore = 999;
        let bScore = 999;
        
        // İsim tam eşleşme (en yüksek öncelik)
        if (aName === searchTerm) aScore = 0;
        if (bName === searchTerm) bScore = 0;
        
        // İsim ile başlama
        if (aScore > 0 && aName.startsWith(searchTerm)) aScore = 1;
        if (bScore > 0 && bName.startsWith(searchTerm)) bScore = 1;
        
        // İsimde kelime başında eşleşme (örn: "tbp-console" için "console")
        if (aScore > 1) {
          const aWords = aName.split(/[-_\s]/);
          if (aWords.some(word => word.startsWith(searchTerm))) aScore = 2;
          if (aWords.some(word => word === searchTerm)) aScore = 1.5;
        }
        if (bScore > 1) {
          const bWords = bName.split(/[-_\s]/);
          if (bWords.some(word => word.startsWith(searchTerm))) bScore = 2;
          if (bWords.some(word => word === searchTerm)) bScore = 1.5;
        }
        
        // İsimde herhangi bir yerde eşleşme
        if (aScore > 2 && aName.includes(searchTerm)) aScore = 3;
        if (bScore > 2 && bName.includes(searchTerm)) bScore = 3;
        
        // URL'de eşleşme
        if (aScore > 3 && aAddress.includes(searchTerm)) aScore = 4;
        if (bScore > 3 && bAddress.includes(searchTerm)) bScore = 4;
        
        // Kategori eşleşme
        if (aScore > 4 && aCategory.includes(searchTerm)) aScore = 5;
        if (bScore > 4 && bCategory.includes(searchTerm)) bScore = 5;
        
        // Skor farkı varsa ona göre sırala
        if (aScore !== bScore) {
          return aScore - bScore;
        }
        
        // Skor aynıysa alfabetik sırala
        return aName.localeCompare(bName);
      });
    }

    const totalPages = Math.ceil(filteredUrls.length / ITEMS_PER_PAGE);
    
    // Eğer mevcut sayfa, toplam sayfa sayısından büyükse düzelt
    if (currentPage > totalPages) {
      currentPage = totalPages;
    }

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const urlsToShow = filteredUrls.slice(startIndex, endIndex);

    const urlList = document.getElementById('urlList');
    urlList.innerHTML = '';

    urlsToShow.forEach((url, index) => {
      const urlItem = document.createElement('div');
      urlItem.className = 'url-item';
      const categoryBadge = url.category ? `<span class="category-badge">${url.category}</span>` : '';
      urlItem.innerHTML = `
        <div class="url-content">
          <div class="url-info">
            <a class="url-link" href="#" data-url="${url.address}" data-type="${url.type}">
              ${url.name}
            </a>
            ${categoryBadge}
          </div>
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
    document.getElementById('prevPage').disabled = currentPage <= 1;
    document.getElementById('nextPage').disabled = currentPage >= totalPages;
  });
}

// Edit fonksiyonu
function editUrl(url, displayIndex, actualIndex) {
  // Form alanlarını doldur
  document.getElementById('nameInput').value = url.name;
  document.getElementById('urlInput').value = url.address;
  document.getElementById('requestType').value = url.type;
  
  const categoryValue = url.category || 'Other';
  document.getElementById('categoryInput').value = categoryValue;
  
  // Kategori dropdown butonlarını güncelle
  const clearCategoryInputBtn = document.getElementById('clearCategoryInput');
  const toggleCategoryInputDropdownBtn = document.getElementById('toggleCategoryInputDropdown');
  if (categoryValue) {
    clearCategoryInputBtn.style.display = 'flex';
    toggleCategoryInputDropdownBtn.style.display = 'none';
  } else {
    clearCategoryInputBtn.style.display = 'none';
    toggleCategoryInputDropdownBtn.style.display = 'flex';
  }

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
  document.getElementById('categoryInput').value = '';
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
  const category = document.getElementById('categoryInput').value.trim() || 'Other';

  if (name && address) {
    const newUrl = {
      name: name,
      address: address,
      type: type,
      category: category
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
      
      const isEditing = document.getElementById('addUrl').dataset.editing === 'true';
      
      if (isEditing) {
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
        document.getElementById('categoryInput').value = '';
        document.getElementById('requestBody').value = '';
        document.getElementById('postDetails').style.display = 'none';
        
        // Kategori dropdown butonlarını sıfırla
        const clearCategoryInputBtn = document.getElementById('clearCategoryInput');
        const toggleCategoryInputDropdownBtn = document.getElementById('toggleCategoryInputDropdown');
        if (clearCategoryInputBtn && toggleCategoryInputDropdownBtn) {
          clearCategoryInputBtn.style.display = 'none';
          toggleCategoryInputDropdownBtn.style.display = 'flex';
        }
        
        // Eğer güncelleme işlemiyse accordion'u kapat
        if (isEditing) {
          const addNewLinkHeader = document.getElementById('addNewLinkHeader');
          const addNewLinkContent = addNewLinkHeader.nextElementSibling;
          
          if (addNewLinkHeader.classList.contains('active')) {
            addNewLinkHeader.classList.remove('active');
            addNewLinkContent.style.maxHeight = null;
          }
        }
        
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

      const response = await fetch(url, fetchOptions);
      const data = await response.text();

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

  document.getElementById('searchInput').focus();
  
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
  
  // Kategori filtresi için event listener'lar
  const categoryFilterInput = document.getElementById('categoryFilter');
  const clearCategoryBtn = document.getElementById('clearCategoryFilter');
  const toggleDropdownBtn = document.getElementById('toggleCategoryDropdown');
  const categoryDropdown = document.getElementById('categoryDropdown');
  
  let activeDropdownIndex = -1;
  
  // Dropdown'u aç/kapat
  function toggleCategoryDropdown(show) {
    if (show) {
      // Storage'dan güncel urls'i al ve dropdown'u güncelle
      chrome.storage.local.get(['urls'], function(result) {
        let urlsFromStorage = result.urls || [];
        
        // Backward compatibility
        urlsFromStorage = urlsFromStorage.map(url => {
          if (!url.category) {
            return { ...url, category: 'Other' };
          }
          return url;
        });
        
        // Kategorileri çıkar
        const categories = new Set();
        urlsFromStorage.forEach(url => {
          if (url.category) {
            categories.add(url.category);
          }
        });
        
        // Dropdown içeriğini güncelle
        updateCategoryDropdown(categories, categoryFilterInput.value);
        
        // Dropdown'u aç (içerik hazır olduktan sonra)
        categoryDropdown.classList.add('show');
        toggleDropdownBtn.classList.add('active');
        categoryFilterInput.setAttribute('aria-expanded', 'true');
      });
    } else {
      categoryDropdown.classList.remove('show');
      toggleDropdownBtn.classList.remove('active');
      categoryFilterInput.setAttribute('aria-expanded', 'false');
      activeDropdownIndex = -1;
    }
  }
  
  // Input'a focus olduğunda dropdown'u aç
  categoryFilterInput.addEventListener('focus', () => {
    toggleCategoryDropdown(true);
  });
  
  // Input event - kullanıcı yazarken (case insensitive filtreleme)
  categoryFilterInput.addEventListener('input', (e) => {
    const value = e.target.value;
    
    // Storage'dan güncel urls'i al ve dropdown'u güncelle
    chrome.storage.local.get(['urls'], function(result) {
      let urlsFromStorage = result.urls || [];
      
      // Backward compatibility
      urlsFromStorage = urlsFromStorage.map(url => {
        if (!url.category) {
          return { ...url, category: 'Other' };
        }
        return url;
      });
      
      // Kategorileri çıkar
      const categories = new Set();
      urlsFromStorage.forEach(url => {
        if (url.category) {
          categories.add(url.category);
        }
      });
      
      // Dropdown'u güncelle (case insensitive filtreleme)
      updateCategoryDropdown(categories, value);
    });
    
    // Dropdown'u göster
    if (!categoryDropdown.classList.contains('show')) {
      categoryDropdown.classList.add('show');
      toggleDropdownBtn.classList.add('active');
      categoryFilterInput.setAttribute('aria-expanded', 'true');
    }
    
    // Clear button'u göster/gizle
    if (value) {
      clearCategoryBtn.style.display = 'flex';
      toggleDropdownBtn.style.display = 'none';
    } else {
      clearCategoryBtn.style.display = 'none';
      toggleDropdownBtn.style.display = 'flex';
    }
    
    // Reset active index
    activeDropdownIndex = -1;
  });
  
  // Toggle button - dropdown'u aç/kapat
  toggleDropdownBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = categoryDropdown.classList.contains('show');
    toggleCategoryDropdown(!isOpen);
    if (!isOpen) {
      categoryFilterInput.focus();
    }
  });
  
  // Clear button
  clearCategoryBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    categoryFilterInput.value = '';
    currentCategoryFilter = '';
    currentPage = 1;
    clearCategoryBtn.style.display = 'none';
    toggleDropdownBtn.style.display = 'flex';
    displayUrls();
    
    // Storage'dan güncel urls'i al ve dropdown'u güncelle
    chrome.storage.local.get(['urls'], function(result) {
      let urlsFromStorage = result.urls || [];
      
      // Backward compatibility
      urlsFromStorage = urlsFromStorage.map(url => {
        if (!url.category) {
          return { ...url, category: 'Other' };
        }
        return url;
      });
      
      // Kategorileri çıkar
      const categories = new Set();
      urlsFromStorage.forEach(url => {
        if (url.category) {
          categories.add(url.category);
        }
      });
      
      updateCategoryDropdown(categories, '');
    });
    
    categoryFilterInput.focus();
  });
  
  // Dropdown item'lara tıklama
  categoryDropdown.addEventListener('click', (e) => {
    const item = e.target.closest('.category-dropdown-item');
    if (item && !item.classList.contains('no-results')) {
      const value = item.dataset.value;
      categoryFilterInput.value = value;
      currentCategoryFilter = value;
      currentPage = 1;
      
      if (value) {
        clearCategoryBtn.style.display = 'flex';
        toggleDropdownBtn.style.display = 'none';
      } else {
        clearCategoryBtn.style.display = 'none';
        toggleDropdownBtn.style.display = 'flex';
      }
      
      displayUrls();
      toggleCategoryDropdown(false);
    }
  });
  
  // Klavye navigasyonu
  categoryFilterInput.addEventListener('keydown', (e) => {
    const items = Array.from(categoryDropdown.querySelectorAll('.category-dropdown-item:not(.no-results)'));
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!categoryDropdown.classList.contains('show')) {
        toggleCategoryDropdown(true);
      }
      activeDropdownIndex = Math.min(activeDropdownIndex + 1, items.length - 1);
      updateActiveItem(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeDropdownIndex = Math.max(activeDropdownIndex - 1, 0);
      updateActiveItem(items);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeDropdownIndex >= 0 && items[activeDropdownIndex]) {
        items[activeDropdownIndex].click();
      } else if (categoryFilterInput.value.trim()) {
        // Enter'a basıldığında yazılan değeri filtre olarak uygula
        currentCategoryFilter = categoryFilterInput.value.trim();
        currentPage = 1;
        displayUrls();
        toggleCategoryDropdown(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      toggleCategoryDropdown(false);
      categoryFilterInput.blur();
    }
  });
  
  // Active item'ı güncelle
  function updateActiveItem(items) {
    items.forEach((item, index) => {
      item.classList.toggle('active', index === activeDropdownIndex);
    });
    
    if (items[activeDropdownIndex]) {
      items[activeDropdownIndex].scrollIntoView({ block: 'nearest' });
    }
  }
  
  // Dışarı tıklandığında dropdown'u kapat
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.category-filter-wrapper')) {
      toggleCategoryDropdown(false);
    }
  });

  // Form içindeki kategori dropdown için event listener'lar
  const categoryInput = document.getElementById('categoryInput');
  const clearCategoryInputBtn = document.getElementById('clearCategoryInput');
  const toggleCategoryInputDropdownBtn = document.getElementById('toggleCategoryInputDropdown');
  const categoryInputDropdown = document.getElementById('categoryInputDropdown');
  
  let activeCategoryInputDropdownIndex = -1;
  
  // Kategori input dropdown'unu güncelle
  function updateCategoryInputDropdown(filterText = '') {
    chrome.storage.local.get(['urls'], function(result) {
      let urlsFromStorage = result.urls || [];
      
      // Backward compatibility
      urlsFromStorage = urlsFromStorage.map(url => {
        if (!url.category) {
          return { ...url, category: 'Other' };
        }
        return url;
      });
      
      // Kategorileri çıkar
      const categories = new Set();
      urlsFromStorage.forEach(url => {
        if (url.category) {
          categories.add(url.category);
        }
      });
      
      categoryInputDropdown.innerHTML = '';
      
      // "No Category" seçeneğini ekle
      const noItem = document.createElement('div');
      noItem.className = 'category-dropdown-item';
      noItem.dataset.value = '';
      noItem.textContent = 'No Category';
      categoryInputDropdown.appendChild(noItem);
      
      // Kategorileri sırala ve filtrele (case insensitive)
      const sortedCategories = Array.from(categories).sort();
      const filterLower = filterText.toLowerCase();
      const filteredCategories = filterText 
        ? sortedCategories.filter(cat => cat.toLowerCase().includes(filterLower))
        : sortedCategories;
      
      if (filteredCategories.length === 0 && filterText) {
        const noResults = document.createElement('div');
        noResults.className = 'category-dropdown-item no-results';
        noResults.textContent = 'No categories found';
        categoryInputDropdown.appendChild(noResults);
      } else {
        filteredCategories.forEach(category => {
          const item = document.createElement('div');
          item.className = 'category-dropdown-item';
          item.dataset.value = category;
          item.textContent = category;
          categoryInputDropdown.appendChild(item);
        });
      }
    });
  }
  
  // Dropdown'u aç/kapat
  function toggleCategoryInputDropdown(show) {
    if (show) {
      updateCategoryInputDropdown(categoryInput.value);
      categoryInputDropdown.classList.add('show');
      toggleCategoryInputDropdownBtn.classList.add('active');
      categoryInput.setAttribute('aria-expanded', 'true');
    } else {
      categoryInputDropdown.classList.remove('show');
      toggleCategoryInputDropdownBtn.classList.remove('active');
      categoryInput.setAttribute('aria-expanded', 'false');
      activeCategoryInputDropdownIndex = -1;
    }
  }
  
  // Input'a focus olduğunda dropdown'u aç
  categoryInput.addEventListener('focus', () => {
    toggleCategoryInputDropdown(true);
  });
  
  // Input event - kullanıcı yazarken
  categoryInput.addEventListener('input', (e) => {
    const value = e.target.value;
    
    updateCategoryInputDropdown(value);
    
    // Dropdown'u göster
    if (!categoryInputDropdown.classList.contains('show')) {
      categoryInputDropdown.classList.add('show');
      toggleCategoryInputDropdownBtn.classList.add('active');
      categoryInput.setAttribute('aria-expanded', 'true');
    }
    
    // Clear button'u göster/gizle
    if (value) {
      clearCategoryInputBtn.style.display = 'flex';
      toggleCategoryInputDropdownBtn.style.display = 'none';
    } else {
      clearCategoryInputBtn.style.display = 'none';
      toggleCategoryInputDropdownBtn.style.display = 'flex';
    }
    
    activeCategoryInputDropdownIndex = -1;
  });
  
  // Toggle button
  toggleCategoryInputDropdownBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = categoryInputDropdown.classList.contains('show');
    toggleCategoryInputDropdown(!isOpen);
    if (!isOpen) {
      categoryInput.focus();
    }
  });
  
  // Clear button
  clearCategoryInputBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    categoryInput.value = '';
    clearCategoryInputBtn.style.display = 'none';
    toggleCategoryInputDropdownBtn.style.display = 'flex';
    updateCategoryInputDropdown('');
    categoryInput.focus();
  });
  
  // Dropdown item'lara tıklama
  categoryInputDropdown.addEventListener('click', (e) => {
    const item = e.target.closest('.category-dropdown-item');
    if (item && !item.classList.contains('no-results')) {
      const value = item.dataset.value;
      categoryInput.value = value;
      
      if (value) {
        clearCategoryInputBtn.style.display = 'flex';
        toggleCategoryInputDropdownBtn.style.display = 'none';
      } else {
        clearCategoryInputBtn.style.display = 'none';
        toggleCategoryInputDropdownBtn.style.display = 'flex';
      }
      
      toggleCategoryInputDropdown(false);
    }
  });
  
  // Klavye navigasyonu
  categoryInput.addEventListener('keydown', (e) => {
    const items = Array.from(categoryInputDropdown.querySelectorAll('.category-dropdown-item:not(.no-results)'));
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!categoryInputDropdown.classList.contains('show')) {
        toggleCategoryInputDropdown(true);
      }
      activeCategoryInputDropdownIndex = Math.min(activeCategoryInputDropdownIndex + 1, items.length - 1);
      updateActiveCategoryInputItem(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeCategoryInputDropdownIndex = Math.max(activeCategoryInputDropdownIndex - 1, 0);
      updateActiveCategoryInputItem(items);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeCategoryInputDropdownIndex >= 0 && items[activeCategoryInputDropdownIndex]) {
        items[activeCategoryInputDropdownIndex].click();
      } else {
        toggleCategoryInputDropdown(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      toggleCategoryInputDropdown(false);
      categoryInput.blur();
    }
  });
  
  // Active item'ı güncelle
  function updateActiveCategoryInputItem(items) {
    items.forEach((item, index) => {
      item.classList.toggle('active', index === activeCategoryInputDropdownIndex);
    });
    
    if (items[activeCategoryInputDropdownIndex]) {
      items[activeCategoryInputDropdownIndex].scrollIntoView({ block: 'nearest' });
    }
  }
  
  // Dışarı tıklandığında dropdown'u kapat
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.category-input-wrapper')) {
      toggleCategoryInputDropdown(false);
    }
  });

  // Cancel butonu için event listener
  document.getElementById('cancelEdit').addEventListener('click', function() {
    // Form alanlarını temizle
    document.getElementById('nameInput').value = '';
    document.getElementById('urlInput').value = '';
    document.getElementById('categoryInput').value = '';
    document.getElementById('requestBody').value = '';
    document.getElementById('postDetails').style.display = 'none';

    // Add butonunu eski haline getir
    const addButton = document.getElementById('addUrl');
    addButton.textContent = 'Add';
    addButton.dataset.editing = 'false';
    delete addButton.dataset.editIndex;

    // Cancel butonunu gizle
    document.getElementById('cancelEdit').style.display = 'none';
    
    // Kategori dropdown butonlarını sıfırla
    clearCategoryInputBtn.style.display = 'none';
    toggleCategoryInputDropdownBtn.style.display = 'flex';
    
    // Accordion'u kapat
    const addNewLinkHeader = document.getElementById('addNewLinkHeader');
    const addNewLinkContent = addNewLinkHeader.nextElementSibling;
    
    if (addNewLinkHeader.classList.contains('active')) {
      addNewLinkHeader.classList.remove('active');
      addNewLinkContent.style.maxHeight = null;
    }
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