const PRODUCT_LINES_STORAGE_KEY = 'product_lines';
const LEGACY_MONITOR_STORAGE_KEY = 'monitor_vm_cards';
const ACTIVE_LINE_STORAGE_KEY = 'active_product_line';
const DEFAULT_LINE_NAMES = ['IX', 'TX', 'EX'];
const NEXT_LINE_NAMES = ['AX', 'BX', 'CX', 'DX', 'GX', 'HX', 'MX', 'PX', 'RX', 'ZX'];
const PORT_POLL_INTERVAL = 2000;
const LOCKED_LINE_ITEMS = {
  IX: [
    'Digi IX10 Industrial Cellular Router',
    'Digi IX20 Industrial 4G LTE Router',
    'Digi IX25 5G Industrial Cellular Router',
    'Digi IX30 Industrial Cellular Router',
    'Digi IX40 5G Edge Computing Industrial IoT Solution'
  ],
  TX: [
    'Digi TX40 5G Cellular Router',
    'Digi TX54 5G / LTE-Advanced Cellular Router',
    'Digi TX64 5G / LTE-Advanced Pro Cellular Router',
    'Digi TX64 5G Rail Cellular Router'
  ],
  EX: [
    'Digi EX12 Cellular Extender',
    'Digi EX15 Cellular Extender',
    'Digi EX50 5G Cellular Extender',
    'Digi CORE plug-in LTE modem'
  ]
};
const LOCKED_ITEM_IMAGES = {
  'Digi IX10 Industrial Cellular Router': 'img/digi-ix10.png',
  'Digi IX20 Industrial 4G LTE Router': 'img/digi-ix20.png',
  'Digi IX25 5G Industrial Cellular Router': 'img/digi-ix25.png',
  'Digi IX30 Industrial Cellular Router': 'img/digi-ix30.png',
  'Digi IX40 5G Edge Computing Industrial IoT Solution': 'img/digi-ix40.png',
  'Digi TX40 5G Cellular Router': 'img/digi-tx40-5g-badge.png',
  'Digi TX54 5G / LTE-Advanced Cellular Router': 'img/digi-tx54-dual-wifi-5g.png',
  'Digi TX64 5G / LTE-Advanced Pro Cellular Router': 'img/tx64-5gbadge.png',
  'Digi TX64 5G Rail Cellular Router': 'img/digi-tx64-r-5gbadge.png',
  'Digi EX12 Cellular Extender': 'img/digi-ex12.png',
  'Digi EX15 Cellular Extender': 'img/Digi-EX15.png',
  'Digi EX50 5G Cellular Extender': 'img/digi-ex50-5gbadge.png',
  'Digi CORE plug-in LTE modem': 'img/digi-core-cm-18.png'
};
const LOCKED_ITEM_IMAGE_VARIANTS = {
  'Digi EX12 Cellular Extender': [
    'img/digi-ex12.png',
    'img/digi-ex12-left.png',
    'img/digi-ex12-right.png'
  ],
  'Digi EX15 Cellular Extender': [
    'img/Digi-EX15.png',
    'img/Digi-EX15-right.png',
    'img/Digi-ex15-CORE-animation-web.gif'
  ]
};
const PRODUCT_LINKS = {
  'Digi EX12 Cellular Extender': [
    {
      label: 'Website',
      url: 'https://www.digi.com/products/networking/cellular-routers/enterprise/digi-ex12'
    }
  ]
};
const DOCS_PORTAL_BASE_URL = 'https://docsportal.digi.com';

const KNOWN_PORT_SERVICES = {
  22: 'SSH',
  25: 'SMTP',
  53: 'DNS',
  80: 'HTTP',
  110: 'POP3',
  143: 'IMAP',
  389: 'LDAP',
  443: 'HTTPS',
  587: 'SMTP Submission',
  636: 'LDAPS',
  993: 'IMAPS',
  3306: 'MySQL',
  3389: 'RDP',
  5900: 'VNC',
  8000: 'HTTP Alt',
  8089: 'HTTP Alt'
};

let productLines = [];
let activeLineId = '';
let itemCounter = 0;
let lineCounter = 0;
let editingItemId = null;
let itemConfigTemp = {
  imageUrl: '',
  ports: []
};
let imageViewerState = {
  item: null,
  imageIndex: 0,
  images: []
};
let imageSwipeStartX = null;
let portPollTimer = null;

const portStatuses = new Map();
const itemOnlineStates = new Map();
const pendingPortChecks = new Set();

document.addEventListener('DOMContentLoaded', () => {
  initializeProductLines();
  setupProductImageModal();
  setupItemConfigModal();
  setupControls();
  setupConfigTransferControls();
});

window.addEventListener('beforeunload', () => {
  if (portPollTimer) {
    clearInterval(portPollTimer);
  }
});

function getNetworkAPI() {
  return window.appAPI || null;
}

function createLineId(name) {
  lineCounter++;
  const slug = String(name || 'line')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'line';
  return `line-${slug}-${lineCounter}`;
}

function createItemId() {
  itemCounter++;
  return `product-item-${itemCounter}`;
}

function getNextLineName() {
  const used = new Set(productLines.map(line => line.name.toUpperCase()));
  const candidate = [...DEFAULT_LINE_NAMES, ...NEXT_LINE_NAMES].find(name => !used.has(name));
  return candidate || `LX${productLines.length + 1}`;
}

function getNextItemName(line) {
  const nextNumber = (line.items || []).length + 1;
  return `${line.name}-${String(nextNumber).padStart(2, '0')}`;
}

function createProductItem(line) {
  return {
    id: createItemId(),
    name: getNextItemName(line),
    ip: '',
    imageUrl: '',
    ports: [],
    scanInterval: 5,
    dnsDomain: ''
  };
}

function createNamedProductItem(name) {
  return {
    id: createItemId(),
    name,
    ip: '',
    imageUrl: LOCKED_ITEM_IMAGES[name] || '',
    ports: [],
    scanInterval: 5,
    dnsDomain: ''
  };
}

function createProductLine(name, options = {}) {
  const line = {
    id: options.id || createLineId(name),
    name: String(name || getNextLineName()).trim() || getNextLineName(),
    items: []
  };
  line.items = Array.isArray(options.items)
    ? options.items.map((item, index) => normalizeProductItem(item, index, line.name))
    : getDefaultItemsForLine(line);
  return line;
}

function getLineKey(line) {
  return String(line?.name || '').trim().toUpperCase();
}

function isLineLockedForManualItems(line) {
  return Object.prototype.hasOwnProperty.call(LOCKED_LINE_ITEMS, getLineKey(line));
}

function getDefaultItemsForLine(line) {
  const lockedItems = LOCKED_LINE_ITEMS[getLineKey(line)];
  if (lockedItems) {
    return lockedItems.map(itemName => createNamedProductItem(itemName));
  }
  return [createProductItem(line)];
}

function getProductImages(item) {
  const variants = LOCKED_ITEM_IMAGE_VARIANTS[item?.name];
  if (Array.isArray(variants) && variants.length > 0) {
    return variants;
  }
  return item?.imageUrl ? [item.imageUrl] : [];
}

function getDocsGuideSlug(itemName) {
  const match = String(itemName || '').match(/\bDigi\s+([A-Z]+[0-9]*)\b/i);
  return match ? `${match[1].toLowerCase()}_userguide` : '';
}

function buildDocsSearchUrl(itemName, searchTerm = '') {
  const guideSlug = getDocsGuideSlug(itemName);
  if (!guideSlug) return '';

  const trimmedSearchTerm = String(searchTerm || '').trim();
  const searchHash = trimmedSearchTerm
    ? `#search-${encodeURIComponent(trimmedSearchTerm)}`
    : '#search-';

  return `${DOCS_PORTAL_BASE_URL}/${guideSlug}/Default.htm${searchHash}`;
}

function openDocsSearch(itemName, searchTerm) {
  const searchUrl = buildDocsSearchUrl(itemName, searchTerm);
  if (!searchUrl) {
    showNotification('No docs portal configured for this product');
    return;
  }

  window.open(searchUrl, '_blank', 'noopener,noreferrer');
}

function normalizePorts(value) {
  const rawPorts = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',').map(item => item.trim()).filter(Boolean)
      : [];

  const ports = rawPorts
    .map(portValue => {
      const port = typeof portValue === 'number' ? portValue : parseInt(portValue, 10);
      return Number.isNaN(port) ? null : port;
    })
    .filter(port => port !== null && port > 0 && port <= 65535);

  return Array.from(new Set(ports)).sort((a, b) => a - b);
}

function normalizeProductItem(item, index, lineName) {
  const intervalValue = parseInt(item?.scanInterval, 10);
  const fallbackId = item?.id || createItemId();
  const fallbackName = item?.name || item?.description || `${lineName}-${String(index + 1).padStart(2, '0')}`;

  return {
    id: fallbackId,
    name: fallbackName,
    ip: item?.ip || '',
    imageUrl: item?.imageUrl || item?.image || '',
    ports: normalizePorts(item?.ports),
    scanInterval: Number.isNaN(intervalValue) || intervalValue < 1 ? 5 : intervalValue,
    dnsDomain: item?.dnsDomain || ''
  };
}

function normalizeProductLine(line, index) {
  const name = String(line?.name || DEFAULT_LINE_NAMES[index] || `LX${index + 1}`).trim();
  const id = line?.id || createLineId(name);
  const rawItems = Array.isArray(line?.items)
    ? line.items
    : Array.isArray(line?.monitorVMs)
      ? line.monitorVMs
      : [];

  return {
    id,
    name,
    items: rawItems.map((item, itemIndex) => normalizeProductItem(item, itemIndex, name))
  };
}

function createDefaultProductLines(legacyItems = []) {
  return DEFAULT_LINE_NAMES.map((name, index) => {
    const line = createProductLine(name, { items: [] });
    if (index === 0 && legacyItems.length > 0) {
      line.items = legacyItems.map((item, itemIndex) => normalizeProductItem(item, itemIndex, name));
    } else {
      line.items = getDefaultItemsForLine(line);
    }
    return line;
  });
}

function syncLockedLineItems() {
  productLines.forEach(line => {
    const lockedNames = LOCKED_LINE_ITEMS[getLineKey(line)];
    if (!lockedNames) return;

    const existingByName = new Map((line.items || []).map(item => [item.name, item]));
    line.items = lockedNames.map((name, index) => {
      const existingItem = existingByName.get(name);
      const item = normalizeProductItem(existingItem || createNamedProductItem(name), index, line.name);
      item.imageUrl = LOCKED_ITEM_IMAGES[name] || item.imageUrl;
      return item;
    });
  });
}

function recalculateCounters() {
  itemCounter = productLines.reduce((max, line) => {
    const lineMax = (line.items || []).reduce((itemMax, item) => {
      const match = String(item.id || '').match(/(?:product-item|monitor-vm)-(\d+)/);
      if (!match) return itemMax;
      const value = parseInt(match[1], 10);
      return Number.isNaN(value) ? itemMax : Math.max(itemMax, value);
    }, max);
    return Math.max(max, lineMax);
  }, 0);

  lineCounter = productLines.reduce((max, line) => {
    const match = String(line.id || '').match(/-(\d+)$/);
    if (!match) return Math.max(max, 1);
    const value = parseInt(match[1], 10);
    return Number.isNaN(value) ? max : Math.max(max, value);
  }, productLines.length);
}

function initializeProductLines() {
  try {
    const storedLines = localStorage.getItem(PRODUCT_LINES_STORAGE_KEY);
    if (storedLines) {
      const parsed = JSON.parse(storedLines);
      productLines = Array.isArray(parsed)
        ? parsed.map((line, index) => normalizeProductLine(line, index))
        : [];
    }

    if (productLines.length === 0) {
      const legacyMonitor = localStorage.getItem(LEGACY_MONITOR_STORAGE_KEY);
      let legacyItems = [];
      if (legacyMonitor) {
        const parsedLegacy = JSON.parse(legacyMonitor);
        legacyItems = Array.isArray(parsedLegacy) ? parsedLegacy : [];
      }
      productLines = createDefaultProductLines(legacyItems);
    }
  } catch (error) {
    console.error('Error loading product lines:', error);
    productLines = createDefaultProductLines();
  }

  recalculateCounters();
  syncLockedLineItems();
  recalculateCounters();

  const savedActiveLineId = localStorage.getItem(ACTIVE_LINE_STORAGE_KEY);
  activeLineId = productLines.some(line => line.id === savedActiveLineId)
    ? savedActiveLineId
    : productLines[0]?.id || '';

  saveProductLines();
  renderProductApp();
}

function saveProductLines() {
  try {
    localStorage.setItem(PRODUCT_LINES_STORAGE_KEY, JSON.stringify(productLines));
    if (activeLineId) {
      localStorage.setItem(ACTIVE_LINE_STORAGE_KEY, activeLineId);
    }
  } catch (error) {
    console.error('Error saving product lines:', error);
    showNotification('Could not save configuration');
  }
}

function getActiveLine() {
  return productLines.find(line => line.id === activeLineId) || productLines[0] || null;
}

function findItemById(itemId) {
  for (const line of productLines) {
    const item = line.items.find(candidate => candidate.id === itemId);
    if (item) {
      return { line, item };
    }
  }
  return null;
}

function renderProductApp() {
  renderProductTabs();
  renderActiveLine();
  updateControlButtonsState();
}

function renderProductTabs() {
  const tabs = document.getElementById('product-tabs');
  if (!tabs) return;

  tabs.innerHTML = '';
  productLines.forEach(line => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tab-button';
    button.dataset.lineId = line.id;
    button.textContent = line.name;
    button.classList.toggle('active', line.id === activeLineId);
    button.addEventListener('click', () => {
      activeLineId = line.id;
      saveProductLines();
      renderProductApp();
    });
    tabs.appendChild(button);
  });
}

function renderActiveLine() {
  const workspace = document.getElementById('product-workspace');
  if (!workspace) return;

  workspace.innerHTML = '';
  const line = getActiveLine();

  if (!line) {
    const empty = document.createElement('section');
    empty.className = 'monitor-grid empty';
    empty.innerHTML = '<div class="monitor-placeholder-card"><h3>No product lines</h3></div>';
    workspace.appendChild(empty);
    return;
  }

  const header = document.createElement('div');
  header.className = 'vm-header monitor-header product-line-header';
  const headerText = document.createElement('div');
  headerText.className = 'monitor-header-text';
  const headerRow = document.createElement('div');
  headerRow.className = 'monitor-header-row';
  const title = document.createElement('h2');
  title.id = 'product-line-header-title';
  title.textContent = line.name;
  headerRow.appendChild(title);
  headerText.appendChild(headerRow);
  header.appendChild(headerText);
  workspace.appendChild(header);

  const grid = document.createElement('div');
  grid.className = 'vm-grid monitor-grid product-grid';
  grid.id = 'product-grid';

  if (line.items.length === 0) {
    grid.classList.add('empty');
    const emptyState = document.createElement('div');
    emptyState.className = 'monitor-placeholder-card';
    emptyState.innerHTML = '<h3>No products yet</h3>';
    grid.appendChild(emptyState);
  } else {
    line.items.forEach(item => {
      grid.appendChild(createProductCard(item, line));
    });
  }

  workspace.appendChild(grid);
  cleanupPortStatuses();
}

function createProductCard(item, line) {
  const card = document.createElement('div');
  card.className = 'vm-card monitor-vm-card product-card';
  card.dataset.itemId = item.id;
  card.setAttribute('role', 'button');
  card.tabIndex = 0;

  const cardContent = document.createElement('div');
  cardContent.className = 'vm-card-content';

  const icon = document.createElement('div');
  icon.className = 'vm-icon product-icon';
  if (item.imageUrl) {
    icon.classList.add('has-image');
    icon.style.backgroundImage = `url("${String(item.imageUrl).replace(/"/g, '\\"')}")`;
    icon.textContent = '';
    icon.setAttribute('role', 'button');
    icon.tabIndex = 0;
    icon.title = 'Open image';
    icon.addEventListener('click', (event) => {
      event.stopPropagation();
      openProductImageModal(item.id);
    });
    icon.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        event.stopPropagation();
        openProductImageModal(item.id);
      }
    });
  } else {
    icon.textContent = line.name.slice(0, 3).toUpperCase();
  }

  const titleRow = document.createElement('div');
  titleRow.className = 'monitor-card-title';
  const name = document.createElement('div');
  name.className = 'vm-name';
  name.textContent = item.name || `${line.name}-01`;
  titleRow.appendChild(name);

  const status = document.createElement('div');
  status.className = 'vm-status';
  status.textContent = item.ip ? `IP: ${item.ip}` : 'IP not set';

  const dns = document.createElement('div');
  dns.className = 'product-dns';
  dns.textContent = item.dnsDomain || '';

  const links = PRODUCT_LINKS[item.name] || [];
  const linksRow = document.createElement('div');
  linksRow.className = 'product-links';
  links.forEach(link => {
    const anchor = document.createElement('a');
    anchor.href = link.url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.textContent = link.label;
    anchor.addEventListener('click', (event) => {
      event.stopPropagation();
    });
    linksRow.appendChild(anchor);
  });

  cardContent.appendChild(icon);
  cardContent.appendChild(titleRow);
  if (status.textContent && item.ip) {
    cardContent.appendChild(status);
  }
  if (dns.textContent) {
    cardContent.appendChild(dns);
  }
  if (linksRow.children.length > 0) {
    cardContent.appendChild(linksRow);
  }

  const docsSearch = createDocsSearchForm(item);
  if (docsSearch) {
    cardContent.appendChild(docsSearch);
  }
  card.appendChild(cardContent);

  card.addEventListener('click', () => openItemConfigModal(item.id));
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openItemConfigModal(item.id);
    }
  });

  return card;
}

function createDocsSearchForm(item) {
  if (!buildDocsSearchUrl(item.name)) return null;

  const form = document.createElement('form');
  form.className = 'docs-search-form';
  form.setAttribute('aria-label', `Search docs for ${item.name}`);

  const input = document.createElement('input');
  input.type = 'search';
  input.className = 'docs-search-input';
  input.placeholder = 'Buscar en docs';
  input.autocomplete = 'off';

  const button = document.createElement('button');
  button.type = 'submit';
  button.className = 'docs-search-button';
  button.textContent = 'Buscar';

  form.appendChild(input);
  form.appendChild(button);

  ['click', 'keydown', 'pointerdown'].forEach(eventName => {
    form.addEventListener(eventName, (event) => {
      event.stopPropagation();
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    event.stopPropagation();
    openDocsSearch(item.name, input.value);
  });

  return form;
}

function addProductItem() {
  const line = getActiveLine();
  if (!line || isLineLockedForManualItems(line)) return;
  line.items.push(createProductItem(line));
  saveProductLines();
  renderProductApp();
}

function removeProductItem() {
  const line = getActiveLine();
  if (!line || isLineLockedForManualItems(line) || line.items.length === 0) return;

  const removedItem = line.items.pop();
  if (removedItem) {
    invalidatePortStatuses(removedItem.id);
    itemOnlineStates.delete(removedItem.id);
  }

  saveProductLines();
  renderProductApp();
}

function addProductLine(name) {
  const newLine = createProductLine(name);
  productLines.push(newLine);
  activeLineId = newLine.id;
  saveProductLines();
  renderProductApp();
}

function removeProductLine() {
  if (productLines.length === 0) return;

  const activeIndex = productLines.findIndex(line => line.id === activeLineId);
  const removeIndex = activeIndex >= 0 ? activeIndex : productLines.length - 1;
  const removedLine = productLines.splice(removeIndex, 1)[0];

  if (removedLine) {
    removedLine.items.forEach(item => {
      invalidatePortStatuses(item.id);
      itemOnlineStates.delete(item.id);
    });
  }

  activeLineId = productLines[removeIndex]?.id || productLines[removeIndex - 1]?.id || '';
  saveProductLines();
  renderProductApp();
}

function updateControlButtonsState() {
  const addButton = document.getElementById('add-item-btn');
  const removeButton = document.getElementById('remove-item-btn');
  const removeLineButton = document.getElementById('remove-line-btn');
  const line = getActiveLine();

  if (addButton) {
    addButton.disabled = !line || isLineLockedForManualItems(line);
  }
  if (removeButton) {
    removeButton.disabled = !line || isLineLockedForManualItems(line) || line.items.length === 0;
  }
  if (removeLineButton) {
    removeLineButton.disabled = productLines.length === 0;
  }
}

function resetItemConfigTemp() {
  itemConfigTemp = {
    imageUrl: '',
    ports: []
  };
}

function openItemConfigModal(itemId) {
  const modal = document.getElementById('item-config-modal');
  const ipInput = document.getElementById('item-ip');
  const imageInput = document.getElementById('item-image');
  const imageFileInput = document.getElementById('item-image-file');
  const scanIntervalInput = document.getElementById('item-scan-interval');
  const dnsInput = document.getElementById('item-dns-domain');
  const match = findItemById(itemId);

  if (!modal || !ipInput || !match) return;

  editingItemId = itemId;
  resetItemConfigTemp();
  itemConfigTemp.imageUrl = match.item.imageUrl || '';
  itemConfigTemp.ports = normalizePorts(match.item.ports);

  ipInput.value = match.item.ip || '';
  if (imageInput) {
    imageInput.value = itemConfigTemp.imageUrl.startsWith('data:') ? '' : itemConfigTemp.imageUrl;
  }
  if (imageFileInput) {
    imageFileInput.value = '';
  }
  if (scanIntervalInput) {
    scanIntervalInput.value = match.item.scanInterval || 5;
  }
  if (dnsInput) {
    dnsInput.value = match.item.dnsDomain || '';
  }
  refreshPortsUI();
  modal.style.display = 'flex';
}

function closeItemConfigModal() {
  const modal = document.getElementById('item-config-modal');
  const form = document.getElementById('item-config-form');
  const portInput = document.getElementById('item-port-input');

  if (modal) {
    modal.style.display = 'none';
  }
  if (form) {
    form.reset();
  }
  if (portInput) {
    portInput.value = '';
  }

  editingItemId = null;
  resetItemConfigTemp();
  refreshPortsUI();
}

function openProductImageModal(itemId) {
  const match = findItemById(itemId);
  const modal = document.getElementById('product-image-modal');
  if (!match || !modal) return;

  const images = getProductImages(match.item);
  if (images.length === 0) return;

  const imageIndex = Math.max(0, images.indexOf(match.item.imageUrl));
  imageViewerState = {
    item: match.item,
    imageIndex,
    images
  };
  renderProductImageModal();
  modal.style.display = 'flex';
}

function closeProductImageModal() {
  const modal = document.getElementById('product-image-modal');
  if (modal) {
    modal.style.display = 'none';
  }
  const image = document.getElementById('product-image-preview');
  if (image) {
    image.removeAttribute('src');
    image.alt = '';
  }
  imageViewerState = {
    item: null,
    imageIndex: 0,
    images: []
  };
}

function renderProductImageModal() {
  const image = document.getElementById('product-image-preview');
  const prevButton = document.getElementById('product-image-prev');
  const nextButton = document.getElementById('product-image-next');
  const currentImage = imageViewerState.images[imageViewerState.imageIndex];

  if (image) {
    image.src = currentImage || '';
    image.alt = imageViewerState.item?.name || 'Product image';
  }

  [prevButton, nextButton].forEach(button => {
    if (button) {
      button.style.display = imageViewerState.images.length > 1 ? 'flex' : 'none';
    }
  });
}

function rotateProductImage(direction) {
  if (imageViewerState.images.length < 2) return;
  imageViewerState.imageIndex = (
    imageViewerState.imageIndex + direction + imageViewerState.images.length
  ) % imageViewerState.images.length;
  renderProductImageModal();
}

function setupProductImageModal() {
  const modal = document.getElementById('product-image-modal');
  const closeButton = document.getElementById('close-product-image');
  const prevButton = document.getElementById('product-image-prev');
  const nextButton = document.getElementById('product-image-next');

  if (!modal) return;

  if (closeButton) {
    closeButton.addEventListener('click', closeProductImageModal);
  }
  if (prevButton) {
    prevButton.addEventListener('click', () => rotateProductImage(-1));
  }
  if (nextButton) {
    nextButton.addEventListener('click', () => rotateProductImage(1));
  }

  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeProductImageModal();
    }
  });
  modal.addEventListener('touchstart', (event) => {
    imageSwipeStartX = event.touches[0]?.clientX ?? null;
  }, { passive: true });
  modal.addEventListener('touchend', (event) => {
    if (imageSwipeStartX === null) return;
    const endX = event.changedTouches[0]?.clientX ?? imageSwipeStartX;
    const deltaX = endX - imageSwipeStartX;
    imageSwipeStartX = null;
    if (Math.abs(deltaX) < 40) return;
    rotateProductImage(deltaX > 0 ? -1 : 1);
  }, { passive: true });

  document.addEventListener('keydown', (event) => {
    if (modal.style.display !== 'flex') return;
    if (event.key === 'Escape') {
      closeProductImageModal();
    } else if (event.key === 'ArrowLeft') {
      rotateProductImage(-1);
    } else if (event.key === 'ArrowRight') {
      rotateProductImage(1);
    }
  });
}

function setupItemConfigModal() {
  const modal = document.getElementById('item-config-modal');
  const closeButton = document.getElementById('close-item-config');
  const cancelButton = document.getElementById('cancel-item-config');
  const form = document.getElementById('item-config-form');
  const ipInput = document.getElementById('item-ip');
  const imageInput = document.getElementById('item-image');
  const imageFileInput = document.getElementById('item-image-file');
  const clearImageButton = document.getElementById('clear-item-image');
  const scanIntervalInput = document.getElementById('item-scan-interval');
  const dnsInput = document.getElementById('item-dns-domain');
  const addPortButton = document.getElementById('item-add-port');
  const clearPortsButton = document.getElementById('item-clear-ports');
  const portInput = document.getElementById('item-port-input');

  if (!modal || !form || !ipInput) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (typeof form.checkValidity === 'function' && !form.checkValidity()) {
      form.reportValidity();
      return;
    }
    if (!editingItemId) return;

    const match = findItemById(editingItemId);
    if (!match) return;

    const imageUrlFromInput = imageInput ? imageInput.value.trim() : '';
    const parsedInterval = scanIntervalInput ? parseInt(scanIntervalInput.value, 10) : 5;

    match.item.ip = ipInput.value.trim();
    match.item.imageUrl = imageUrlFromInput || itemConfigTemp.imageUrl || '';
    match.item.ports = [...itemConfigTemp.ports];
    match.item.scanInterval = Number.isNaN(parsedInterval) || parsedInterval < 1 ? 5 : parsedInterval;
    match.item.dnsDomain = dnsInput ? dnsInput.value.trim() : '';

    invalidatePortStatuses(match.item.id);
    saveProductLines();
    renderProductApp();
    closeItemConfigModal();
  });

  [cancelButton, closeButton].forEach(button => {
    if (button) {
      button.addEventListener('click', closeItemConfigModal);
    }
  });

  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeItemConfigModal();
    }
  });

  if (imageInput) {
    imageInput.addEventListener('input', () => {
      itemConfigTemp.imageUrl = '';
    });
  }

  if (imageFileInput) {
    imageFileInput.addEventListener('change', handleImageFileSelection);
  }

  if (clearImageButton) {
    clearImageButton.addEventListener('click', () => {
      itemConfigTemp.imageUrl = '';
      if (imageInput) imageInput.value = '';
      if (imageFileInput) imageFileInput.value = '';
    });
  }

  if (addPortButton) {
    addPortButton.addEventListener('click', handlePortAdd);
  }

  if (clearPortsButton) {
    clearPortsButton.addEventListener('click', clearPorts);
  }

  if (portInput) {
    portInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handlePortAdd();
      }
    });
  }

  refreshPortsUI();
}

function handleImageFileSelection(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showNotification('Select a valid image file');
    event.target.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = (loadEvent) => {
    itemConfigTemp.imageUrl = String(loadEvent.target?.result || '');
    const imageInput = document.getElementById('item-image');
    if (imageInput) {
      imageInput.value = '';
    }
    showNotification('Image ready');
  };
  reader.onerror = () => {
    showNotification('Could not load image');
  };
  reader.readAsDataURL(file);
}

function refreshPortsUI() {
  const portsStatus = document.getElementById('item-ports-status');
  const portsList = document.getElementById('item-ports-list');
  const clearPortsButton = document.getElementById('item-clear-ports');
  if (!portsList) return;

  if (portsStatus) {
    const count = itemConfigTemp.ports.length;
    portsStatus.textContent = count > 0
      ? `${count} TCP test${count === 1 ? '' : 's'} configured`
      : '';
  }
  if (clearPortsButton) {
    clearPortsButton.disabled = itemConfigTemp.ports.length === 0;
  }

  portsList.innerHTML = '';
  itemConfigTemp.ports.forEach((port, index) => {
    const chip = document.createElement('span');
    chip.className = 'port-chip';
    const label = document.createElement('span');
    label.textContent = port;
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.textContent = '×';
    removeButton.addEventListener('click', () => removePort(index));
    chip.appendChild(label);
    chip.appendChild(removeButton);
    portsList.appendChild(chip);
  });
}

function handlePortAdd() {
  const portInput = document.getElementById('item-port-input');
  if (!portInput) return;

  const port = parseInt(portInput.value.trim(), 10);
  if (Number.isNaN(port) || port <= 0 || port > 65535) {
    showNotification('Enter a valid port between 1 and 65535');
    return;
  }

  if (!itemConfigTemp.ports.includes(port)) {
    itemConfigTemp.ports.push(port);
    itemConfigTemp.ports.sort((a, b) => a - b);
  }

  portInput.value = '';
  refreshPortsUI();
}

function removePort(index) {
  itemConfigTemp.ports.splice(index, 1);
  refreshPortsUI();
}

function clearPorts() {
  itemConfigTemp.ports = [];
  refreshPortsUI();
}

function setupControls() {
  const addItemButton = document.getElementById('add-item-btn');
  const removeItemButton = document.getElementById('remove-item-btn');
  const addLineButton = document.getElementById('add-line-btn');
  const removeLineButton = document.getElementById('remove-line-btn');

  if (addItemButton) {
    addItemButton.addEventListener('click', addProductItem);
  }
  if (removeItemButton) {
    removeItemButton.addEventListener('click', removeProductItem);
  }
  if (addLineButton) {
    addLineButton.addEventListener('click', () => addProductLine(getNextLineName()));
  }
  if (removeLineButton) {
    removeLineButton.addEventListener('click', removeProductLine);
  }
}

function getPortStatus(item, port) {
  if (!item || !Array.isArray(item.ports) || !item.ports.includes(port)) {
    return 'disabled';
  }
  if (!item.ip) {
    return 'closed';
  }
  const entry = portStatuses.get(`${item.id}-${port}`);
  return entry ? entry.status : 'pending';
}

function getPortStatuses(item) {
  if (!item || !Array.isArray(item.ports) || item.ports.length === 0) {
    return [];
  }
  return item.ports.map(port => getPortStatus(item, port));
}

function updatePortIconAppearance(icon, item, port) {
  if (!icon) return;
  icon.classList.remove('status-open', 'status-closed', 'status-disabled', 'status-pending');
  const status = getPortStatus(item, port);
  switch (status) {
    case 'open':
      icon.classList.add('status-open');
      break;
    case 'closed':
      icon.classList.add('status-closed');
      break;
    case 'pending':
      icon.classList.add('status-pending');
      break;
    default:
      icon.classList.add('status-disabled');
  }
}

function setPortStatus(itemId, port, status) {
  const key = `${itemId}-${port}`;
  const itemExists = productLines.some(line => line.items.some(item => item.id === itemId));
  if (!itemExists) {
    portStatuses.delete(key);
    return;
  }

  portStatuses.set(key, {
    status,
    checkedAt: Date.now()
  });
  updatePortIconElements(itemId, port);
  updateItemOnlineState(itemId);
}

function updatePortIconElements(itemId, port) {
  const match = findItemById(itemId);
  if (!match) return;

  const icons = document.querySelectorAll(`.product-card[data-item-id="${itemId}"] .monitor-port-icon[data-port="${port}"]`);
  icons.forEach(icon => updatePortIconAppearance(icon, match.item, parseInt(port, 10)));
}

function isItemOnline(item) {
  if (!item || !item.ip) {
    return false;
  }

  const statuses = getPortStatuses(item);
  if (statuses.length === 0) {
    return true;
  }

  if (statuses.some(status => status === 'open')) {
    return true;
  }

  if (statuses.some(status => status === 'pending')) {
    const lastKnown = itemOnlineStates.get(item.id);
    return typeof lastKnown === 'boolean' ? lastKnown : true;
  }

  return false;
}

function updateItemOnlineState(itemId) {
  const match = findItemById(itemId);
  if (!match) return;

  const online = isItemOnline(match.item);
  itemOnlineStates.set(match.item.id, online);
  document.querySelectorAll(`.product-card[data-item-id="${itemId}"]`).forEach(card => {
    card.classList.toggle('online', online);
  });
}

function schedulePortChecks(item) {
  if (!Array.isArray(item.ports) || item.ports.length === 0) {
    return;
  }

  if (!item.ip) {
    item.ports.forEach(port => setPortStatus(item.id, port, 'closed'));
    return;
  }

  item.ports.forEach(port => {
    const key = `${item.id}-${port}`;
    const entry = portStatuses.get(key);
    const intervalMs = Math.max((item.scanInterval || 5) * 1000, 2000);
    const due = !entry || (Date.now() - entry.checkedAt >= intervalMs) || entry.status === 'pending';
    if (!due || pendingPortChecks.has(key)) {
      return;
    }
    setPortStatus(item.id, port, 'pending');
    runPortCheck(item, port);
  });
}

async function runPortCheck(item, port) {
  const key = `${item.id}-${port}`;
  if (pendingPortChecks.has(key)) return;

  const networkAPI = getNetworkAPI();
  if (!networkAPI || typeof networkAPI.testTCPPort !== 'function') {
    setPortStatus(item.id, port, 'disabled');
    return;
  }

  pendingPortChecks.add(key);
  try {
    const timeout = Math.max((item.scanInterval || 5) * 1000, 2000);
    const result = await networkAPI.testTCPPort(item.ip, port, timeout);
    const isOpen = result && (result.open || result.success);
    setPortStatus(item.id, port, isOpen ? 'open' : 'closed');
  } catch (error) {
    console.error('Error testing port', item.ip, port, error);
    setPortStatus(item.id, port, 'closed');
  } finally {
    pendingPortChecks.delete(key);
  }
}

function cleanupPortStatuses() {
  const validKeys = new Set();
  productLines.forEach(line => {
    line.items.forEach(item => {
      if (Array.isArray(item.ports)) {
        item.ports.forEach(port => validKeys.add(`${item.id}-${port}`));
      }
    });
  });

  Array.from(portStatuses.keys()).forEach(key => {
    if (!validKeys.has(key)) {
      portStatuses.delete(key);
    }
  });
}

function invalidatePortStatuses(itemId) {
  Array.from(portStatuses.keys()).forEach(key => {
    if (key.startsWith(`${itemId}-`)) {
      portStatuses.delete(key);
    }
  });
  Array.from(pendingPortChecks).forEach(key => {
    if (key.startsWith(`${itemId}-`)) {
      pendingPortChecks.delete(key);
    }
  });
}

function startPortPolling() {
  if (portPollTimer) return;
  portPollTimer = setInterval(() => {
    const line = getActiveLine();
    if (!line) return;
    line.items.forEach(item => schedulePortChecks(item));
  }, PORT_POLL_INTERVAL);
}

function collectConfigurationSnapshot() {
  return {
    type: 'product-line-config',
    version: 2,
    exportedAt: new Date().toISOString(),
    activeLineId,
    productLines: productLines.map((line, index) => normalizeProductLine(line, index))
  };
}

function triggerConfigDownload(payload) {
  const data = JSON.stringify(payload, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `product-line-config-${timestamp}.json`;
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function handleConfigExport() {
  try {
    triggerConfigDownload(collectConfigurationSnapshot());
    showNotification('Configuration saved');
  } catch (error) {
    console.error('Error exporting configuration:', error);
    showNotification('Could not export configuration');
  }
}

function handleConfigFileSelection(event) {
  const input = event.target;
  const file = input.files && input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (loadEvent) => {
    try {
      const parsed = JSON.parse(loadEvent.target.result);
      applyImportedConfiguration(parsed);
      showNotification('Configuration loaded');
    } catch (error) {
      console.error('Error importing configuration:', error);
      showNotification('Invalid configuration file');
    } finally {
      input.value = '';
    }
  };
  reader.readAsText(file);
}

function applyImportedConfiguration(configData) {
  if (!configData || typeof configData !== 'object') {
    throw new Error('Invalid configuration payload');
  }

  if (Array.isArray(configData.productLines)) {
    productLines = configData.productLines.map((line, index) => normalizeProductLine(line, index));
  } else if (Array.isArray(configData.monitorVMs)) {
    productLines = createDefaultProductLines(configData.monitorVMs);
  } else {
    throw new Error('No product lines found');
  }

  if (productLines.length === 0) {
    productLines = createDefaultProductLines();
  }

  recalculateCounters();
  syncLockedLineItems();
  recalculateCounters();
  activeLineId = productLines.some(line => line.id === configData.activeLineId)
    ? configData.activeLineId
    : productLines[0].id;

  portStatuses.clear();
  itemOnlineStates.clear();
  pendingPortChecks.clear();

  saveProductLines();
  renderProductApp();
}

function setupConfigTransferControls() {
  const exportButton = document.getElementById('export-config-btn');
  const importButton = document.getElementById('import-config-btn');
  const importInput = document.getElementById('import-config-input');

  if (exportButton) {
    exportButton.addEventListener('click', handleConfigExport);
  }
  if (importButton && importInput) {
    importButton.addEventListener('click', () => {
      importInput.value = '';
      importInput.click();
    });
    importInput.addEventListener('change', handleConfigFileSelection);
  }
}

function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 2200);
}
