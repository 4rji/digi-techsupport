import { Terminal } from './node_modules/@xterm/xterm/lib/xterm.mjs';
import { FitAddon } from './node_modules/@xterm/addon-fit/lib/addon-fit.mjs';
import { SearchAddon } from './node_modules/@xterm/addon-search/lib/addon-search.mjs';
import {
  DEFAULT_SSH_LOG_PATH,
  SSH_LOG_PATH_STORAGE_KEY,
  buildTailCommand
} from './ssh-log-command.mjs';

const PRODUCT_LINES_STORAGE_KEY = 'product_lines';
const TEMPLATES_STORAGE_KEY = 'support_templates';
const TEMPLATES_DEFAULT_SEEDED_KEY = 'support_templates_default_seeded';
const TEMPLATE_DRAFTS_STORAGE_KEY = 'support_template_drafts';
const LEGACY_MONITOR_STORAGE_KEY = 'monitor_vm_cards';
const ACTIVE_LINE_STORAGE_KEY = 'active_product_line';
const OPENAI_KEY_STORAGE_KEY = 'openAiKey';
const CLAUDE_KEY_STORAGE_KEY = 'claudeKey';
const PREFERRED_PROVIDER_STORAGE_KEY = 'preferredProvider';
const AGENT_SKILL_STORAGE_KEY = 'agentSkill';
const AGENT_SKILL_SOURCE_STORAGE_KEY = 'agentSkillSource';
const FILE_SUPPORT_SKILL_STORAGE_KEY = 'fileSupportSkill';
const FILE_SUPPORT_SKILL_SOURCE_STORAGE_KEY = 'fileSupportSkillSource';
const THEME_STYLESHEET_STORAGE_KEY = 'themeStylesheet';
const FILE_SUPPORT_TREE_WIDTH_STORAGE_KEY = 'fileSupportTreeWidth';
const TEMPLATES_VIEW_ID = '__templates__';
const AI_PROVIDERS = ['openai', 'claude'];
const DEFAULT_AI_PROVIDER = 'openai';
const DEFAULT_THEME_STYLESHEET = 'styles.css';
const THEME_STYLESHEETS = [
  { href: 'styles.css', label: 'Digi' },
  { href: 'styles_aqua.css', label: 'Aqua' },
  { href: 'styles_dark.css', label: 'Dark' },
  { href: 'styles_grey.css', label: 'Grey' }
];
const DEFAULT_LINE_NAMES = ['IX', 'TX', 'EX'];
const CELLULAR_LEGACY_LINE_NAME = 'WR (Legacy)';
const CELLULAR_CATALOG_LINE_NAMES = [...DEFAULT_LINE_NAMES, CELLULAR_LEGACY_LINE_NAME];
const CELLULAR_CATALOG_LINE_KEYS = CELLULAR_CATALOG_LINE_NAMES.map(name => name.toUpperCase());
const CELLULAR_ROUTERS_URL = 'https://www.digi.com/products/networking/cellular-routers';
const INFRASTRUCTURE_SUPPORT_RESOURCE_URL = 'https://hub.digi.com/support/products/infrastructure-management/';
const USB_LINE_NAMES = ['AnywhereUSB', 'Edgeport'];
const USB_CONNECTIVITY_URL = 'https://www.digi.com/products/networking/infrastructure-management/usb-connectivity';
const SERIAL_LINE_NAMES = ['EZ', 'Legacy Products'];
const SERIAL_CONNECTIVITY_URL = 'https://www.digi.com/products/networking/infrastructure-management/serial-connectivity';
const MY_OWN_DEVICES_LINE_NAME = 'My Own Devices';
const USB_MY_OWN_DEVICES_LINE_NAME = 'USB My Own Devices';
const REQUIRED_LINE_NAMES = [
  ...DEFAULT_LINE_NAMES,
  CELLULAR_LEGACY_LINE_NAME,
  MY_OWN_DEVICES_LINE_NAME,
  ...USB_LINE_NAMES,
  USB_MY_OWN_DEVICES_LINE_NAME,
  ...SERIAL_LINE_NAMES
];
const PRODUCT_CATEGORIES = [
  {
    id: 'cellular',
    label: 'Cellular',
    lineKeys: ['IX', 'TX', 'EX', 'WR (LEGACY)', 'MY OWN DEVICES']
  },
  { id: 'usb', label: 'USB', lineKeys: ['ANYWHEREUSB', 'EDGEPORT', 'USB MY OWN DEVICES'] },
  { id: 'serial', label: 'Serial', lineKeys: ['EZ', 'LEGACY PRODUCTS'] }
];
const FILE_SUPPORT_VIEW_ID = '__file_support__';
const COMPARE_VIEW_ID = '__compare__';
const DEVICES_VIEW_ID = '__devices__';
const CELLULAR_ALL_VIEW_ID = '__cellular_all__';
const LOCAL_IMAGE_ASSET_VERSION = String(Date.now());
const BUILT_IN_VIEW_IDS = new Set([
  TEMPLATES_VIEW_ID,
  FILE_SUPPORT_VIEW_ID,
  COMPARE_VIEW_ID,
  DEVICES_VIEW_ID,
  CELLULAR_ALL_VIEW_ID
]);
const DEVICES_AUTO_REFRESH_INTERVAL = 45000;
const DEFAULT_FILE_SUPPORT_TREE_WIDTH = 220;
const MIN_FILE_SUPPORT_TREE_WIDTH = 120;
const MAX_FILE_SUPPORT_TREE_WIDTH = 640;
const NEXT_LINE_NAMES = ['AX', 'BX', 'CX', 'DX', 'GX', 'HX', 'MX', 'PX', 'RX', 'ZX'];
const PORT_POLL_INTERVAL = 2000;
const MAX_HIGHLIGHTED_CONTENT_CHARS = 2 * 1024 * 1024;
const DEFAULT_FILE_SUPPORT_SKILL = [
  '# Digi File Support Analyst',
  '',
  'Analyze Digi support archives for technical support troubleshooting.',
  'Prioritize facts from runtime state, firmware/version, configuration, routes, interface counters, logs, modem/cellular state, WAN bonding, VPN/tunnel status, firewall rules, and service status.',
  'Start with likely root causes and evidence. Include exact source paths for important claims.',
  'Keep recommendations concrete and suitable for a support engineer to validate next.'
].join('\n');
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
  ],
  ANYWHEREUSB: [
    '2 Plus',
    '8 Plus',
    '24 Plus'
  ],
  EDGEPORT: [
    'Edgeport 1',
    'Edgeport 2',
    'Edgeport 4',
    'Edgeport 8',
    'Edgeport 16',
    'Edgeport 32'
  ],
  'WR (LEGACY)': [
    'WR21',
    'WR31',
    'WR44',
    'WR54'
  ],
  EZ: [
    'EZ WS',
    'EZ TS',
    'EZ Mini',
    'EZ 2',
    'EZ 4',
    'EZ 4i',
    'EZ 8',
    'EZ 16/32'
  ],
  'LEGACY PRODUCTS': [
    'ConnectPort TS',
    'PortServer TS',
    'Digi One'
  ]
};
const DEFAULT_ITEM_IPS = {
  'Digi IX10 Industrial Cellular Router': '10.10.65.73',
  'Digi IX20 Industrial 4G LTE Router': '10.10.65.77',
  'Digi IX25 5G Industrial Cellular Router': '10.10.65.48',
  'Digi IX30 Industrial Cellular Router': '10.10.65.78',
  'Digi IX40 5G Edge Computing Industrial IoT Solution': '10.10.65.79',
  'Digi TX40 5G Cellular Router': '10.10.65.88',
  'Digi TX54 5G / LTE-Advanced Cellular Router': '10.10.65.67',
  'Digi TX64 5G / LTE-Advanced Pro Cellular Router': '10.10.65.68',
  'Digi TX64 5G Rail Cellular Router': '10.10.65.38',
  'Digi EX12 Cellular Extender': '10.10.65.62',
  'Digi EX15 Cellular Extender': '10.10.65.57',
  'Digi EX50 5G Cellular Extender': '10.10.65.72',
  '2 Plus': '10.10.65.89',
  '8 Plus': '10.10.65.74',
  '24 Plus': '10.10.65.75',
  WR21: '10.10.65.45',
  WR31: '10.10.65.46',
  WR44: '10.10.65.47',
  'EZ WS': '10.10.65.42',
  'EZ TS': '10.10.65.85',
  'EZ Mini': '10.10.65.76',
  'EZ 4': '10.10.65.93',
  'EZ 8': '10.10.65.94',
  'EZ 16/32': '10.10.65.81',
  'ConnectPort TS': '10.10.65.25',
  'PortServer TS': '10.10.65.20',
  'Digi One': '10.10.65.65'
};
const LOCKED_ITEM_IMAGES = {
  '2 Plus': 'img/AnywhereUSB_2Plus_hero.png',
  '8 Plus': 'img/AnywhereUSB_8Plus_hero.png',
  '24 Plus': 'img/AnywhereUSB_24Plus_hero.png',
  'Edgeport 1': 'img/edgeport-1.png',
  'Edgeport 2': 'img/Edgeport-4-DB25.png',
  'Edgeport 4': 'img/Edgeport-4-DB25.png',
  'Edgeport 8': 'img/Edgeport-8-DB-9-8-RS-232.png',
  'Edgeport 16': 'img/edgeport-216-front.png',
  'Edgeport 32': 'img/digi-connect-ez-32-front.png',
  WR21: 'img/digi-transport-wr21.png',
  WR31: 'https://www.digi.com/products/assets/products/digitransportwr31',
  WR44: 'img/digi-transport-wr44-rr.png',
  WR54: 'img/tx54.png',
  'EZ WS': 'img/digi-connect-ez-4-ws.png',
  'EZ TS': 'img/Digi-Connect-EZ-4-TS.png',
  'EZ Mini': 'img/digi-connect-ez-mini.png',
  'EZ 2': 'img/digi-connect-ez-2.png',
  'EZ 4': 'img/digi-connect-ez-4.png',
  'EZ 4i': 'img/digi-connect-ez-4i.png',
  'EZ 8': 'img/Digi-Connect-EZ-8-TS.png',
  'EZ 16/32': 'img/digi-connect-ez-32-front.png',
  'ConnectPort TS': 'https://hub.digi.com/dp/path=/image/product-line/connectport-ts-8-16,fmt=square400,bg=ffffff,c=0,v=1',
  'Digi One': 'https://hub.digi.com/dp/path=/images/products/digi-one-sp-ia-family/,fmt=square400,bg=ffffff,c=0,v=1',
  'PortServer TS': 'https://hub.digi.com/dp/path=/image/product-line/portserver-ts,fmt=square400,bg=ffffff,c=0,v=1',
  'Digi IX10 Industrial Cellular Router': 'img/digi-ix10.png',
  'Digi IX20 Industrial 4G LTE Router': 'img/digi-ix20.png',
  'Digi IX25 5G Industrial Cellular Router': 'img/digi-ix25.png',
  'Digi IX30 Industrial Cellular Router': 'img/digi-ix30.png',
  'Digi IX40 5G Edge Computing Industrial IoT Solution': 'img/digi-ix40.png',
  'Digi TX40 5G Cellular Router': 'img/digi-tx40.png',
  'Digi TX54 5G / LTE-Advanced Cellular Router': 'img/tx54.png',
  'Digi TX64 5G / LTE-Advanced Pro Cellular Router': 'img/tx64-front.png',
  'Digi TX64 5G Rail Cellular Router': 'img/digi-tx64-r.png',
  'Digi EX12 Cellular Extender': 'img/digi-ex12.png',
  'Digi EX15 Cellular Extender': 'img/Digi-EX15.png',
  'Digi EX50 5G Cellular Extender': 'img/digi-ex50-new.png',
  'Digi CORE plug-in LTE modem': 'img/digi-core-cm-18.png'
};
const LOCKED_ITEM_IMAGE_VARIANTS = {
  '2 Plus': [
    'img/AnywhereUSB_2Plus_hero.png',
    'img/AnywhereUSB_2Plus_front.png',
    'img/AnywhereUSB_2Plus_back.png'
  ],
  '8 Plus': [
    'img/AnywhereUSB_8Plus_hero.png'
  ],
  '24 Plus': [
    'img/AnywhereUSB_24Plus_hero.png',
    'img/AnywhereUSB_24Plus_front.png',
    'img/AnywhereUSB_24Plus_right.png',
    'img/AnywhereUSB_24Plus_back.png'
  ],
  'Edgeport 1': [
    'img/edgeport-1.png'
  ],
  'Edgeport 2': [
    'img/Edgeport-4-DB25.png'
  ],
  'Edgeport 4': [
    'img/Edgeport-4-DB25.png'
  ],
  'Edgeport 8': [
    'img/Edgeport-8-DB-9-8-RS-232.png',
    'img/edgeport-8-DB-25.png'
  ],
  'Edgeport 16': [
    'img/edgeport-216-front.png',
    'img/edgeport-216-back.png'
  ],
  'Edgeport 32': [
    'img/digi-connect-ez-32-front.png',
    'img/digi-connect-ez-32.png'
  ],
  'Digi IX10 Industrial Cellular Router': [
    'img/digi-ix10.png',
    'img/digi-ix10-front.png',
    'img/Digi-ix10-left.png',
    'img/digi-ix10-mounting.gif'
  ],
  'Digi IX20 Industrial 4G LTE Router': [
    'img/digi-ix20.png',
    'img/digi-ix20-front.png',
    'img/digi-ix20-front-no-wifi.png'
  ],
  'Digi IX25 5G Industrial Cellular Router': [
    'img/digi-ix25.png',
    'img/digi-ix25-front.png',
    'img/digi-ix25-front-non-wifi.png',
    'img/digi-ix25-5g-back.png'
  ],
  'Digi IX30 Industrial Cellular Router': [
    'img/digi-ix30.png',
    'img/digi-ix30-front.png',
    'img/digi-ix30-right.png',
    'img/digi-ix30-with-din.png'
  ],
  'Digi IX40 5G Edge Computing Industrial IoT Solution': [
    'img/digi-ix40.png',
    'img/digi-ix40-front.png',
    'img/digi-ix40-back.png',
    'img/digi-ix40-left.png'
  ],
  'Digi TX40 5G Cellular Router': [
    'img/digi-tx40.png',
    'img/digi-tx40-front.png',
    'img/digi-tx40-back-5g.png'
  ],
  'Digi TX54 5G / LTE-Advanced Cellular Router': [
    'img/tx54.png',
    'img/tx54-front.png',
    'img/tx54-back.png',
    'img/tx54-dual-wifi-back.png',
    'img/digi-tx54-a106-a146-a156.png',
    'img/digi-tx54-a106-a146-a156-front.png',
    'img/Digi-TX54-A152-156-front.png',
    'img/Digi-TX54-A152-back.png',
    'img/digi-tx54-a256-2.png',
    'img/digi-tx54-a256-2-front.png',
    'img/digi-tx54-a256-2-back.png'
  ],
  'Digi TX64 5G / LTE-Advanced Pro Cellular Router': [
    'img/tx64-front.png',
    'img/tx64.png',
    'img/tx64-back.png',
    'img/digi-tx64-r-back.png',
    'img/digi-tx64-r-front.png'
  ],
  'Digi TX64 5G Rail Cellular Router': [
    'img/digi-tx64-r.png',
    'img/digi-tx64-r-back.png',
    'img/digi-tx64-r-front.png'
  ],
  'Digi EX12 Cellular Extender': [
    'img/digi-ex12.png',
    'img/digi-ex12-left.png',
    'img/digi-ex12-right.png'
  ],
  'Digi EX15 Cellular Extender': [
    'img/Digi-EX15.png',
    'img/Digi-EX15-right.png',
    'img/Digi-ex15-CORE-animation-web.gif'
  ],
  'Digi EX50 5G Cellular Extender': [
    'img/digi-ex50-new.png',
    'img/digi-ex50-front.png',
    'img/digi-ex50-left.png',
    'img/digi-ex50-right.png',
    'img/digi-ex50-back.png'
  ],
  'EZ WS': [
    'img/digi-connect-ez-4-ws.png',
    'img/digi-connect-ez-4-ws-front.png',
    'img/digi-connect-ez-4-ws-back.png'
  ],
  'EZ TS': [
    'img/Digi-Connect-EZ-4-TS.png',
    'img/Digi-Connect-EZ-4-TS-front.png',
    'img/Digi-Connect-EZ-4-TS-top.png',
    'img/Digi-Connect-EZ-4-TS-back.png'
  ],
  'EZ Mini': [
    'img/digi-connect-ez-mini.png',
    'img/digi-connect-ez-mini-front.png',
    'img/digi-connect-ez-mini-back.png'
  ],
  'EZ 2': [
    'img/digi-connect-ez-2.png',
    'img/digi-connect-ez-2-front.png',
    'img/digi-connect-ez-2-back.png'
  ],
  'EZ 4': [
    'img/digi-connect-ez-4.png',
    'img/digi-connect-ez-4-front.png',
    'img/digi-connect-ez-4-back.png'
  ],
  'EZ 4i': [
    'img/digi-connect-ez-4i.png',
    'img/digi-connect-ez-4i-front.png',
    'img/digi-connect-ez-4i-back.png'
  ],
  'EZ 8': [
    'img/Digi-Connect-EZ-8-TS.png',
    'img/Digi-Connect-EZ-8-TS-front.png'
  ],
  'EZ 16/32': [
    'img/digi-connect-ez-32-front.png',
    'img/digi-connect-ez-16.png',
    'img/digi-connect-ez-16-front.png',
    'img/digi-connect-ez-16-32-back.png',
    'img/digi-connect-ez-32.png'
  ],
  'Digi CORE plug-in LTE modem': [
    'img/digi-core-cm-18.png',
    'img/Digi-CORE-1002-CM-back.png',
    'img/Digi-ex15-CORE-animation-web.gif',
    'img/digi-ix20-with-digi-core-modem-animation.gif'
  ]
};
const PRODUCT_LINKS = {
  'Digi IX10 Industrial Cellular Router': [
    {
      label: 'Website',
      url: 'https://www.digi.com/products/networking/cellular-routers/industrial/digi-ix10'
    }
  ],
  'Digi IX20 Industrial 4G LTE Router': [
    {
      label: 'Website',
      url: 'https://www.digi.com/products/networking/cellular-routers/industrial/digi-ix20'
    }
  ],
  'Digi IX25 5G Industrial Cellular Router': [
    {
      label: 'Website',
      url: 'https://www.digi.com/products/networking/cellular-routers/industrial/digi-ix25'
    }
  ],
  'Digi IX30 Industrial Cellular Router': [
    {
      label: 'Website',
      url: 'https://www.digi.com/products/networking/cellular-routers/industrial/digi-ix30'
    }
  ],
  'Digi IX40 5G Edge Computing Industrial IoT Solution': [
    {
      label: 'Website',
      url: 'https://www.digi.com/products/networking/cellular-routers/industrial/digi-ix40'
    }
  ],
  'Digi TX40 5G Cellular Router': [
    {
      label: 'Website',
      url: 'https://www.digi.com/products/networking/cellular-routers/transportation/digi-tx40-cellular-router'
    }
  ],
  'Digi TX54 5G / LTE-Advanced Cellular Router': [
    {
      label: 'Website',
      url: 'https://www.digi.com/products/networking/cellular-routers/transportation/digi-tx54'
    }
  ],
  'Digi TX64 5G / LTE-Advanced Pro Cellular Router': [
    {
      label: 'Website',
      url: 'https://www.digi.com/products/networking/cellular-routers/transportation/digi-tx64'
    }
  ],
  'Digi TX64 5G Rail Cellular Router': [
    {
      label: 'Website',
      url: 'https://www.digi.com/products/networking/cellular-routers/transportation/digi-tx64-5g-rail'
    }
  ],
  'Digi EX12 Cellular Extender': [
    {
      label: 'Website',
      url: 'https://www.digi.com/products/networking/cellular-routers/enterprise/digi-ex12'
    }
  ],
  'Digi EX15 Cellular Extender': [
    {
      label: 'Website',
      url: 'https://www.digi.com/products/networking/cellular-routers/enterprise/digi-ex15'
    }
  ],
  'Digi EX50 5G Cellular Extender': [
    {
      label: 'Website',
      url: 'https://www.digi.com/products/networking/cellular-routers/enterprise/digi-ex50'
    }
  ],
  'Digi CORE plug-in LTE modem': [
    {
      label: 'Website',
      url: 'https://www.digi.com/products/networking/cellular-routers/enterprise/digi-core-plug-in-lte-modem'
    }
  ],
  '2 Plus': [
    {
      label: 'G300',
      url: 'https://www.digi.com/products/models/aw02-g300'
    },
    {
      label: 'G300-GLB',
      url: 'https://www.digi.com/products/models/aw02-g300-glb'
    }
  ],
  '8 Plus': [
    {
      label: 'Website',
      url: 'https://www.digi.com/products/models/aw08-g300'
    }
  ],
  '24 Plus': [
    {
      label: 'Website',
      url: 'https://www.digi.com/products/models/aw24-g300'
    }
  ],
  'Edgeport 1': [
    {
      label: 'Website',
      url: 'https://www.digi.com/products/networking/infrastructure-management/usb-connectivity/usb-to-serial/edgeport'
    }
  ],
  'Edgeport 2': [
    {
      label: 'Website',
      url: 'https://www.digi.com/products/networking/infrastructure-management/usb-connectivity/usb-to-serial/edgeport'
    }
  ],
  'Edgeport 4': [
    {
      label: 'Website',
      url: 'https://www.digi.com/products/networking/infrastructure-management/usb-connectivity/usb-to-serial/edgeport'
    }
  ],
  'Edgeport 8': [
    {
      label: 'Website',
      url: 'https://www.digi.com/products/networking/infrastructure-management/usb-connectivity/usb-to-serial/edgeport'
    }
  ],
  'Edgeport 16': [
    {
      label: 'Website',
      url: 'https://www.digi.com/products/networking/infrastructure-management/usb-connectivity/usb-to-serial/edgeport'
    }
  ],
  'Edgeport 32': [
    {
      label: 'Website',
      url: 'https://www.digi.com/products/networking/infrastructure-management/usb-connectivity/usb-to-serial/edgeport'
    }
  ],
  WR21: [
    {
      label: 'Website',
      url: 'https://www.digi.com/products/networking/cellular-routers/digi-transport-wr21'
    }
  ],
  WR31: [
    {
      label: 'Website',
      url: 'https://www.digi.com/products/networking/cellular-routers/digi-transport-wr31'
    }
  ],
  WR44: [
    {
      label: 'Website WR44 RR',
      url: 'https://www.digi.com/products/networking/cellular-routers/transportation/digi-transport-wr44-rr'
    }
  ],
  WR54: [
    {
      label: 'Support Website',
      url: 'https://hub.digi.com/support/products/cellular-routers/digi-tx54/?_gl=1*1dobqts*_gcl_au*MTQyNjM3NTM4NS4xNzgxMTE4NTUz*_ga*OTQ1MTkzNDczLjE3ODExMTg1NTQ.*_ga_RZXDK3PM3B*czE3ODE5NTQ1MDMkbzckZzEkdDE3ODE5NTc3NTgkajIxJGwwJGgxNjc2MTk2ODI3'
    }
  ],
  'EZ WS': [
    {
      label: 'Website',
      url: 'https://www.digi.com/products/networking/infrastructure-management/serial-connectivity/device-servers/digi-connect-ez-ws'
    }
  ],
  'EZ TS': [
    {
      label: 'Website',
      url: 'https://www.digi.com/products/networking/infrastructure-management/serial-connectivity/device-servers/digi-connect-ez-ts'
    }
  ],
  'EZ Mini': [
    {
      label: 'Website',
      url: 'https://www.digi.com/products/networking/infrastructure-management/serial-connectivity/device-servers/digi-connect-ez'
    }
  ],
  'EZ 2': [
    {
      label: 'Website',
      url: 'https://www.digi.com/products/networking/infrastructure-management/serial-connectivity/device-servers/digi-connect-ez'
    }
  ],
  'EZ 4': [
    {
      label: 'Website',
      url: 'https://www.digi.com/products/networking/infrastructure-management/serial-connectivity/device-servers/digi-connect-ez'
    }
  ],
  'EZ 4i': [
    {
      label: 'Website',
      url: 'https://www.digi.com/products/networking/infrastructure-management/serial-connectivity/device-servers/digi-connect-ez'
    }
  ],
  'EZ 8': [
    {
      label: 'Website',
      url: 'https://www.digi.com/products/networking/infrastructure-management/serial-connectivity/terminal-servers/digi-connect-ez-8'
    }
  ],
  'EZ 16/32': [
    {
      label: 'Website',
      url: 'https://www.digi.com/products/networking/infrastructure-management/serial-connectivity/terminal-servers/digi-connect-ez-16-32'
    }
  ],
  'ConnectPort TS': [
    {
      label: 'Website',
      url: 'https://hub.digi.com/support/products/infrastructure-management/digi-connectport-ts-8-16-terminal-server/'
    }
  ],
  'Digi One': [
    {
      label: 'Website',
      url: 'https://hub.digi.com/support/products/infrastructure-management/digi-one-sp-ia/'
    }
  ],
  'PortServer TS': [
    {
      label: 'Website',
      url: 'https://hub.digi.com/support/products/infrastructure-management/digi-portserver-ts/'
    }
  ]
};

const ANYWHEREUSB_2_PLUS_PRODUCT_SPECS = {
  subtitle: 'Digi AnywhereUSB 2 Plus',
  sourceUrl: 'https://www.digi.com/products/models/aw02-g300',
  sections: [
    {
      title: 'Wireless',
      rows: [
        ['Cellular', 'Not included'],
        ['Wi-Fi', 'Not included']
      ]
    },
    {
      title: 'Software and Management',
      rows: [
        ['Remote Management', 'Digi Remote Manager (cloud based) or Digi On-Prem Manager (local)'],
        ['Local Management', 'Web UI (HTTP/HTTPS); CLI (Console, SSH)'],
        ['Windows', 'Windows 7, 8.1, 10 and 11; Windows Server 2012-R2, 2016, 2019, 2022 and 2025'],
        ['Linux', 'Ubuntu LTS 18.04, 20.04, 22.04 and 24.04; Debian LTS 10.13, 11.9 and 12.5; Red Hat, AlmaLinux and Rocky LTS 8.10 and 9.4'],
        ['Protocols', 'Supports multi-host connectivity for each USB port or group independently'],
        ['Memory', '512 MB RAM, 4 GB flash (eMMC)']
      ]
    },
    {
      title: 'Network',
      rows: [
        ['Ethernet', '(1) RJ-45; 10 M/100 M/1 G']
      ]
    },
    {
      title: 'Connectors',
      rows: [
        ['USB', '(2) USB 3.1 Gen 1 Type A'],
        ['USB Port Power', '1.8 A per port (simultaneous)']
      ]
    },
    {
      title: 'Physical',
      rows: [
        ['Dimensions (L x W x H)', '118 mm x 74 mm x 30 mm (4.6 in x 2.9 in x 1.2 in)'],
        ['Weight', '0.38 kg (0.84 lb)'],
        ['Status LEDs', 'Ethernet, 2x USB, power']
      ]
    },
    {
      title: 'Power Requirements',
      rows: [
        ['Power Input', '5 V, 5 A max'],
        ['Power Consumption', '25 watts max'],
        ['Power Connector', 'Locking barrel connector']
      ]
    },
    {
      title: 'Environmental',
      rows: [
        ['Operating Temperature', '0 °C to 40 °C (32 °F to 104 °F)'],
        ['Relative Humidity', '5% to 95% (non-condensing)']
      ]
    },
    {
      title: 'Approvals',
      rows: [
        ['Safety', 'UL 62368/60950, EN 62368, IEC 62368, CSA 22.2 62368-1'],
        ['Emissions / Immunity', 'CE; FCC Part 15 Class B, AS/NZS CISPR 22, EN 55024, EN 55032']
      ]
    },
    {
      title: 'Warranty and Assurance',
      rows: [
        ['Product Warranty', '5-year'],
        ['LifeCycle Assurance', '1-year LifeCycle Assurance with 24x7 Expert Support and Digi Remote Manager Premier included'],
        ['Accessories', 'Recommended power supply: 76000965; view available accessories']
      ]
    },
    {
      title: "What's in the Box",
      rows: [
        ['Digi AnywhereUSB 2 Plus', 'Dual USB 3.1 Gen 1 ports, single 10 M/100 M/1 G Ethernet, 5 VDC']
      ]
    }
  ]
};

const ANYWHEREUSB_8_PLUS_PRODUCT_SPECS = {
  subtitle: 'Digi AnywhereUSB 8 Plus',
  sourceUrl: 'https://www.digi.com/products/models/aw08-g300',
  sections: [
    {
      title: 'Wireless',
      rows: [
        ['Cellular Module Support', '(1) Digi CORE plug-in LTE modem compliant socket'],
        ['Wi-Fi', 'Not included']
      ]
    },
    {
      title: 'Software and Management',
      rows: [
        ['Remote Management', 'Digi Remote Manager (cloud based) or Digi On-Prem Manager (local)'],
        ['Local Management', 'Digi On-Prem Manager (local); Web UI (HTTP/HTTPS); CLI (Console, SSH)'],
        ['Windows', 'Windows 7, 8.1, 10 and 11; Windows Server 2012-R2, 2016, 2019, 2022 and 2025'],
        ['Linux', 'Ubuntu LTS 18.04, 20.04, 22.04 and 24.04; Debian LTS 10.13, 11.9 and 12.5; Red Hat, AlmaLinux and Rocky LTS 8.10 and 9.4'],
        ['Protocols', 'Supports multi-host connectivity for each USB port or group independently'],
        ['Memory', '2 GB RAM, 4 GB flash (eMMC)']
      ]
    },
    {
      title: 'Network',
      rows: [
        ['Ethernet', '(1) RJ-45; 10 M / 100 M / 1 G / 10 G'],
        ['SFP+', '(1) SFP+ socket']
      ]
    },
    {
      title: 'Connectors',
      rows: [
        ['Console', '(1) DB09M; RS-232 DTE'],
        ['USB', '(8) USB 3.1 Gen 1 Type A'],
        ['USB Port Power', '1 A per port (simultaneous)']
      ]
    },
    {
      title: 'Physical',
      rows: [
        ['Dimensions (L x W x H)', '260 mm x 160 mm x 44.45 mm (10 in x 6 in x 1.75 in)'],
        ['Weight', '1.58 kg (3.48 lb)'],
        ['Status LEDs', 'Ethernet, SFP+, 8x USB, power, fan, user and 2x WWAN (if CORE module is inserted)'],
        ['Mounting Accessory', 'Rack mount extension kit for use in a 19-inch 1U rack (included)']
      ]
    },
    {
      title: 'Power Requirements',
      rows: [
        ['Power Input', '12 VDC, 12 A max'],
        ['Power Consumption', '98.5 watts max'],
        ['Power Connector', 'Phoenix connector']
      ]
    },
    {
      title: 'Environmental',
      rows: [
        ['Operating Temperature', '0 °C to 55 °C (32 °F to 131 °F)'],
        ['Relative Humidity', '5% to 95% (non-condensing)']
      ]
    },
    {
      title: 'Approvals',
      rows: [
        ['Safety', 'UL 62368/60950, EN 62368, IEC 62368, CSA 22.2 62368-1'],
        ['Emissions / Immunity', 'CE; FCC Part 15 Class B, AS/NZS CISPR 22, EN 55024, EN 55032']
      ]
    },
    {
      title: 'Warranty and Assurance',
      rows: [
        ['Product Warranty', '5-year'],
        ['LifeCycle Assurance', '1-year LifeCycle Assurance with 24x7 Expert Support and Digi Remote Manager Premier included'],
        ['Accessories', 'Power supply and rack mount extension included; optional Digi CORE plug-in LTE modem']
      ]
    },
    {
      title: "What's in the Box",
      rows: [
        ['Digi AnywhereUSB 8 Plus', '8-port USB over IP remote USB 3.1 hub with 10 M/100 M/1 G/10 G Ethernet, 12 VDC, SFP+ module support and optional cellular Digi CORE module'],
        ['Included', 'Power supply; rack mount extension kit; attachable 19-inch rack ears']
      ]
    },
    {
      title: 'Power Cable Requirements',
      rows: [
        ['General', 'Use an appropriate power cable meeting national standards to connect to a standard outlet.'],
        ['EU / International', 'VDE Mark; conforming to IEC 60083, IEC 60227 or IEC 60320; C13 to the appropriate national mains connector; rated for the national mains voltage; 3 x 0.823 mm².'],
        ['USA / Canada', 'UR Mark; conforming to UL 62, UL 817 or CSA-C22.2; C13 to 5-15P, 5-15P or NEMA locking connector; 18 AWG.']
      ]
    }
  ]
};

const ANYWHEREUSB_24_PLUS_PRODUCT_SPECS = {
  subtitle: 'Digi AnywhereUSB 24 Plus',
  sourceUrl: 'https://www.digi.com/products/models/aw24-g300',
  sections: [
    {
      title: 'Wireless',
      rows: [
        ['Cellular Module Support', '(1) Digi CORE plug-in LTE modem compliant socket'],
        ['Wi-Fi', 'Not included']
      ]
    },
    {
      title: 'Software and Management',
      rows: [
        ['Remote Management', 'Digi Remote Manager (cloud based) or Digi On-Prem Manager (local)'],
        ['Local Management', 'Digi On-Prem Manager (local); Web UI (HTTP/HTTPS); CLI (Console, SSH)'],
        ['Windows', 'Windows 7, 8.1, 10 and 11; Windows Server 2012-R2, 2016, 2019, 2022 and 2025'],
        ['Linux', 'Ubuntu LTS 18.04, 20.04, 22.04 and 24.04; Debian LTS 10.13, 11.9 and 12.5; Red Hat, AlmaLinux and Rocky LTS 8.10 and 9.4'],
        ['Protocols', 'Supports multi-host connectivity for each USB port or group independently'],
        ['Memory', '2 GB RAM, 4 GB flash (eMMC)']
      ]
    },
    {
      title: 'Network',
      rows: [
        ['Ethernet', '(2) RJ-45; 10 M / 100 M / 1 G / 10 G'],
        ['SFP+', '(2) SFP+ sockets']
      ]
    },
    {
      title: 'Connectors',
      rows: [
        ['Console', '(1) DB09M; RS-232 DTE'],
        ['USB', '(24) USB 3.1 Gen 1 Type A'],
        ['USB Port Power', '1 A per port (simultaneous)']
      ]
    },
    {
      title: 'Physical',
      rows: [
        ['Dimensions (L x W x H)', '450.85 mm x 255 mm x 44.45 mm (17.75 in x 10 in x 1.75 in)'],
        ['Weight', '4.7 kg (10.36 lb)'],
        ['Status LEDs', '2x Ethernet, 2x SFP+, 24x USB, 2x PSU, 2x fan, user and 2x WWAN (if CORE module is inserted)'],
        ['Mounting Accessory', 'Rack mount extension kit for use in a 19-inch 1U rack (included)']
      ]
    },
    {
      title: 'Power Requirements',
      rows: [
        ['Power Input', 'Dual 100-240 VAC, 3 A max (dual supplies for redundancy)'],
        ['Power Consumption', '157.7 watts max'],
        ['Power Connector', 'IEC 60320 C14 inlet']
      ]
    },
    {
      title: 'Environmental',
      rows: [
        ['Operating Temperature', '0 °C to 40 °C (32 °F to 104 °F)'],
        ['Relative Humidity', '5% to 95% (non-condensing)']
      ]
    },
    {
      title: 'Approvals',
      rows: [
        ['Safety', 'UL 62368/60950, EN 62368, IEC 62368, CSA 22.2 62368-1'],
        ['Emissions / Immunity', 'CE; FCC Part 15 Class B, AS/NZS CISPR 22, EN 55024, EN 55032']
      ]
    },
    {
      title: 'Warranty and Assurance',
      rows: [
        ['Product Warranty', '5-year'],
        ['LifeCycle Assurance', '1-year LifeCycle Assurance with 24x7 Expert Support and Digi Remote Manager Premier included'],
        ['Accessories', 'Rack mount extension kit included; optional Digi CORE plug-in LTE modem']
      ]
    },
    {
      title: "What's in the Box",
      rows: [
        ['Digi AnywhereUSB 24 Plus', '24-port USB over IP remote USB 3.1 hub with dual 10 M/100 M/1 G/10 G Ethernet, dual 100-240 VAC power, dual SFP+ module support and optional cellular Digi CORE module'],
        ['Included', 'Rack mount extension kit']
      ]
    },
    {
      title: 'Power Cable Requirements',
      rows: [
        ['General', 'Use an appropriate power cable meeting national standards to connect to a standard outlet.'],
        ['EU / International', 'VDE Mark; conforming to IEC 60083, IEC 60227 or IEC 60320; C13 to the appropriate national mains connector; rated for the national mains voltage; 3 x 0.823 mm².'],
        ['USA / Canada', 'UR Mark; conforming to UL 62, UL 817 or CSA-C22.2; C13 to 5-15P, 5-15P or NEMA locking connector; 18 AWG.']
      ]
    }
  ]
};

const WR31_PRODUCT_SPECS = {
  subtitle: 'Digi TransPort WR31',
  sourceUrl: 'https://www.digi.com/products/networking/cellular-routers/digi-transport-wr31',
  sections: [
    {
      title: 'Wireless Interfaces — Cellular',
      rows: [
        ['Certifications', 'Visit https://www.digi.com/resources/certifications for latest certifications'],
        ['LTE — ANZ/LATAM (L9)', 'LTE-Advanced Cat 6: 700(B28)/850(B5,B18,B19)/900(B8)/1500(B21)/1800(B3)/1900(B39)/2100(B1)/2600(B7,B38)/2300(B40)/2500(B41). 3G HSPA+: 800/850/900/1700/2100 MHz. Transfer rate (max): 300 Mbps down, 50 Mbps up. GNSS: 30 channels (16 GPS, 14 GLONASS) simultaneous tracking.'],
        ['LTE — North America/EMEA (M8)', 'LTE-Advanced Cat 6: 700(B12,B13,B29)/800(B20,B26)/850(B5)/900(B8)/AWS(B4)/1800(B3)/1900(B2,B25)/2100(B1)/2300(B30)/2500(B41)/2600(B7). 3G HSPA+: 850/900/AWS/1800/1900/2100 MHz. Transfer rate (max): 300 Mbps down, 50 Mbps up. GNSS: 30 channels (16 GPS, 14 GLONASS) simultaneous tracking.'],
        ['LTE — North America (M5)', 'LTE Cat 4: 700(B12,B13)/850(B5)/AWS(B4)/1900(B2). 3G HSPA+: 850/1900 MHz. Transfer rate (max): 150 Mbps down, 50 Mbps up.'],
        ['LTE — EMEA/APAC (M7)', 'LTE Cat 4: 800(B20)/900(B8)/1800(B3)/2100(B1)/2600(B7). HSPA: 900/2100 MHz. EDGE: 900/1800 MHz. Transfer rate (max): 150 Mbps down, 50 Mbps up.'],
        ['LTE 450 — EMEA/APAC (M2)', 'LTE Cat 3: 450(B31)/800(B20)/1800(B3)/2600(B7). HSPA+: 900/2100 MHz. EDGE: 900/1800 MHz. Transfer rate (max): 100 Mbps down, 50 Mbps up.'],
        ['Global HSPA+ (U9)', '3G HSPA+: 850/900/1700AWS/1900/2100 MHz. 2G EDGE/GPRS: 850/900/1800/1900 MHz. Transfer rate (max): 21 Mbps down, 5.76 Mbps up.'],
        ['CDMA EV-DO 450 MHz — EMEA (D5)', '3G EVDO Rev B: 450 MHz. 2G 1XRTT: 450 MHz. Transfer rate (max): 14.7 Mbps down, 5.4 Mbps up.'],
        ['Connectors', '(2) 50 Ω SMA (center pin: female)'],
        ['SIM Slots', '(2) Mini-SIM (2FF)'],
        ['SIM Security', 'Screw-down SIM cover'],
        ['GNSS (Select Models)', 'Protocol NMEA 0183 V3.0. Acquisition time: hot start 1 s; warm start 29 s; cold start 32 s. Accuracy — horizontal: < 2 m (50%), < 5 m (90%); altitude: < 4 m (50%), < 8 m (90%); velocity: < 0.2 m/s.']
      ]
    },
    {
      title: 'Software & Management',
      rows: [
        ['Remote Management', 'Digi Remote Manager (cloud based); SNMP v1/v2c/v3 (user installed/managed)'],
        ['Local Management', 'WebUI (HTTP/HTTPS); CLI (Telnet, SSH, SMS)'],
        ['Management / Troubleshooting Tools', 'FTP, SFTP, SCP; protocol analyzer with PCAP for Wireshark; event logging with Syslog and SMTP; NTP/SNTP']
      ]
    },
    {
      title: 'Wired Interfaces — Ethernet',
      rows: [
        ['Ports', '(2) RJ-45; 10/100 Mbps (auto-sensing)']
      ]
    },
    {
      title: 'Serial',
      rows: [
        ['Ports', '(1) DB-9; DCE'],
        ['Standard', 'RS-232/422/485'],
        ['Signal Support', 'TXD, RXD, RTS, CTS, DTR, DCD, DSR, RI'],
        ['Flow Control', 'Software (XON/XOFF), hardware supported']
      ]
    },
    {
      title: 'I/O',
      rows: [
        ['Connector', '5-pin screw down terminal block'],
        ['Digital', '0-30 VDC, 200 mA max.; (2) I/O, software selectable'],
        ['Analog', '(1) analog I/O; 4-20 mA or 0-10 V, software selectable; 12-bit resolution']
      ]
    },
    {
      title: 'USB',
      rows: [
        ['Ports', '(1) USB 2.0 Type A']
      ]
    },
    {
      title: 'Physical',
      rows: [
        ['Dimensions (L x W x H)', '12.7 cm x 8.9 cm x 5.1 cm (5 in x 3.5 in x 2 in)'],
        ['Weight', '0.5 kg (1.1 lb)'],
        ['Status LEDs', 'Power, service, WWAN, 3x signal strength, user programmable'],
        ['Enclosure / Rating', 'Aluminum / IP30'],
        ['Mounting', 'DIN rail mount included']
      ]
    },
    {
      title: 'Power Requirements',
      rows: [
        ['Power Input', '9-30 VDC, 18 W minimum power source required'],
        ['Power Connector', 'Screw down removable terminal block'],
        ['Power Consumption', '4 W typical (idle); 12 W typical (peak Tx/Rx)']
      ]
    },
    {
      title: 'Environmental',
      rows: [
        ['Hazardous (Class 1 Div 2)', 'Yes'],
        ['Operating Temperature', '-34° C to 74° C (-29° F to 165° F); reduced cellular performance may occur above 60° C (140° F)'],
        ['Storage Temperature', '-40° C to 85° C (-40° F to 185° F)'],
        ['Ethernet Isolation', '1.5 kV RMS'],
        ['Serial Port Protection (ESD)', '15 kV'],
        ['Relative Humidity', '5% to 95% (non-condensing)']
      ]
    },
    {
      title: 'Approvals',
      rows: [
        ['Cellular', 'PTCRB'],
        ['Safety', 'Hazardous locations: ANSI/ISA-12.12.01-2015, CAN/CSA C22.2 No. 213-15. Ordinary locations: UL 60950-1, 2nd Edition, 2014-10-14; UL 62368: 2014, 2nd Edition. ATEX: II 3 G Ex nA IIC T4 Gc; EN 60079-0:2012+A11:2013; EN 60079-15:2010; DEMKO 15 ATEX 1574X Rev. 1.'],
        ['IECEx Standards', 'US/UL/ExTR17.0077/00'],
        ['Emissions / Immunity', 'CE, FCC Part 15 Class B, AS/NZS CISPR 22, EN55024, EN55022 Class B']
      ]
    },
    {
      title: 'Warranty',
      rows: [
        ['Product Warranty', '3-year standard warranty; upgradeable to 5 years with purchase of a Digi Remote Manager Premier 5-year subscription at the time of product purchase and product registration in Digi Remote Manager.']
      ]
    },
    {
      title: 'Line Art',
      rows: [
        ['Reference', 'See the official WR31 specifications link for product line art.']
      ]
    },
    {
      title: 'Enterprise Software',
      rows: [
        ['Protocol Support', 'HTTP, HTTPS, FTP, SFTP, SSL, SNMP v1/v2c/v3, SSH, Telnet and CLI for web management; Digi Remote Manager; SMS management; protocol analyzer and PCAP capture for Wireshark; DynDNS; Dynamic DNS client compatible with BIND9/No-IP/DynDNS.'],
        ['Security / VPN', 'IP filtering; stateful inspection firewall with scripting; address and port translation; IPSec VPN with IKEv1, IKEv2 and NAT Traversal; SSL, SSLv2, SSLv3, FIPS 197; OpenVPN client and server; PPTP; L2TP; (5) VPN tunnels; SHA-1, MD5, RSA; DES, 3DES and AES up to 256-bit; RADIUS, TACACS+, SCEP for X.509; certificates; content filtering; MAC address filtering; VLAN support.'],
        ['Routing / Failover', 'IP pass-through; NAT; NAPT with IP port forwarding; Ethernet bridging; GRE; multicast routing; PPP, PPPoE, RIP v1/v2, OSPF, SRI, BGP and iGMP; VRRP and VRRP+; automatic failover/failback to second GSM network or standby APN.'],
        ['Other Protocols', 'DHCP; Dynamic DNS compatible with BIND9/No-IP/DynDNS; QoS via TOS/DSCP/WRED; Modbus UDP/TCP to serial; X.25 including XOT, SNA/IP, TPAD and PAD; protocol switch; Modbus bridging for diverse field assets.']
      ]
    }
  ]
};

const EDGEPORT_PRODUCT_SPECS = {
  subtitle: 'Edgeport Serial / Edgeport Industrial',
  sourceUrl: 'https://www.digi.com/products/networking/infrastructure-management/usb-connectivity/usb-to-serial/edgeport',
  sections: [
    {
      title: 'Interfaces (Varies by Model)',
      columns: ['Specifications', 'Edgeport Serial', 'Edgeport Industrial'],
      rows: [
        ['Serial Ports', '1, 4, 8 or 16', '1, 4 or 8'],
        ['Serial Type', 'RS-232', 'RS-422/485, software selectable RS-422/485'],
        ['Serial Connector', 'DB-9, DB-25', 'DB-9'],
        ['Serial Data Rate', '230 Kbps per port simultaneously', '230 Kbps per port simultaneously'],
        ['Downstream USB Ports', '2 (16-port models only)', '0']
      ]
    },
    {
      title: 'Features',
      columns: ['Specifications', 'Edgeport Serial', 'Edgeport Industrial'],
      rows: [
        ['USB', 'USB 1.0 and USB 1.1 compatible; backwards compatibility for USB 2.0 and USB 3.0; USB-IF certified; Plug and Play', 'USB 1.0 and USB 1.1 compatible; backwards compatibility for USB 2.0 and USB 3.0; USB-IF certified; Plug and Play'],
        ['LEDs', 'LED displays device status and COM port activity', 'LED displays device status and COM port activity'],
        ['Operating Systems', 'Windows Server 2019, Windows Server 2016, Windows Server 2012, Windows 10, Windows 8.1, Windows 7; Linux', 'Windows Server 2019, Windows Server 2016, Windows Server 2012, Windows 10, Windows 8.1, Windows 7; Linux'],
        ['Cables', '1-meter USB cable', '1-meter USB cable'],
        ['Other (General)', 'Automatic port reacquisition; COM port assignments maintained across reboots; full hardware and software flow control; no additional IRQ or memory address requirements; low power consumption; rack mountable; hot-swappable', 'Automatic port reacquisition; COM port assignments maintained across reboots; full hardware and software flow control; no additional IRQ or memory address requirements; low power consumption; rack mountable; hot-swappable'],
        ['Other (Model-Specific)', 'N/A', 'N/A']
      ]
    },
    {
      title: 'Power Requirements',
      columns: ['Specifications', 'Edgeport Serial', 'Edgeport Industrial'],
      rows: [
        ['Power Supply', 'External power supply not required for models without USB ports (USB powered). Models with USB ports (Edgeport/216) ship with power supply: 100/240 VAC, 60/50 Hz at 5 VDC @ 3 A max.', 'External power supply not required for models without USB ports (USB powered).']
      ]
    },
    {
      title: 'Environmental',
      columns: ['Specifications', 'Edgeport Serial', 'Edgeport Industrial'],
      rows: [
        ['Operating Temperature', '0° C to 55° C (32° F to 131° F)', '0° C to 55° C (32° F to 131° F)'],
        ['Relative Humidity', '0% to 95% (non-condensing)', '0% to 95% (non-condensing)']
      ]
    },
    {
      title: 'Approvals',
      columns: ['Specifications', 'Edgeport Serial', 'Edgeport Industrial'],
      rows: [
        ['Safety', 'EN60950, UL 1950, CSA 2.2 No. 950, IEC 950', 'EN60950, UL 1950, CSA 2.2 No. 950, IEC 950'],
        ['Emissions / Immunity', 'CE, FCC Part 15, Class B, EN55022, EN55024', 'CE, FCC Part 15, Class B, EN55022, EN55024']
      ]
    },
    {
      title: 'Product Views',
      rows: [
        ['Edgeport/1 and Edgeport/1i', 'Front; back; Edgeport/1 with 2-meter captive cable'],
        ['Edgeport/4', 'Edgeport/4s MEI; Edgeport/4/DB-25'],
        ['Edgeport/8', 'Edgeport/8s MEI; Edgeport/8/DB-25 front and back'],
        ['Edgeport/216', 'Front (Edgeport-216-line-art-front.gif); back']
      ]
    }
  ]
};

const PRODUCT_SPECS = {
  '2 Plus': ANYWHEREUSB_2_PLUS_PRODUCT_SPECS,
  '8 Plus': ANYWHEREUSB_8_PLUS_PRODUCT_SPECS,
  '24 Plus': ANYWHEREUSB_24_PLUS_PRODUCT_SPECS,
  WR31: WR31_PRODUCT_SPECS,
  'Edgeport 1': EDGEPORT_PRODUCT_SPECS,
  'Edgeport 2': EDGEPORT_PRODUCT_SPECS,
  'Edgeport 4': EDGEPORT_PRODUCT_SPECS,
  'Edgeport 8': EDGEPORT_PRODUCT_SPECS,
  'Edgeport 16': EDGEPORT_PRODUCT_SPECS,
  'Edgeport 32': EDGEPORT_PRODUCT_SPECS,
  'Digi IX10 Industrial Cellular Router': {
    subtitle: 'Digi IX10 with Digi 360*',
    sourceUrl: 'https://www.digi.com/products/networking/cellular-routers/industrial/digi-ix10#specifications',
    sections: [
      {
        title: 'Cellular',
        rows: [
          ['Certifications**', 'Visit product certifications for latest cellular approvals and updates'],
          ['LTE Cat 4 Global (G4)', 'LTE Cat 4 Global: B1, B2, B3, B4, B5, B7, B8, B12, B13, B18, B19, B20, B25, B26, B28, B38, B39, B40, B41; 3G: B1, B2, B4, B5, B6, B8, B19; 2G EDGE / GPRS: 850 / 900 / 1800 / 1900 MHz'],
          ['LTE Cat 4 Regional - North America (N4)', 'LTE Cat 4 Regional - North America: B2, B4, B5, B12, B13, B14, B66, B71; 3G: B2, B4, B5'],
          ['LTE-A Cat 6 CBRS-only - North America (C6)', 'LTE-Advanced Cat 6 CBRS-only - North America: B42, B43, B48 (CBRS)'],
          ['SIM Slots', '(2) Mini-SIM (2FF)'],
          ['eSIM Support', 'Digi eSIM optional 2FF accessory (IX10-00G4)'],
          ['SIM Security', 'Behind SIM cover, secured with screw (#1 Phillips)']
        ]
      },
      {
        title: 'Software and Management*',
        rows: [
          ['Remote Management', 'Digi Remote Manager; SNMP v2/v3 (user installed/managed)'],
          ['Local Management', 'WebUI (HTTP/HTTPS); CLI (SSH)'],
          ['Management / Troubleshooting Tools', 'FTP client, SCP; protocol analyzer with PCAP for Wireshark; event logging with syslog and SMTP client; NTP/SNTP; Nagios, Intelliflow, iPerf, Dynamic DNS, ping, traceroute'],
          ['Memory', '256 MB RAM, 256 MB flash']
        ]
      },
      {
        title: 'Ethernet',
        rows: [
          ['Ports', '(1) RJ-45; 10/100 Mbps (auto-sensing)']
        ]
      },
      {
        title: 'Serial',
        rows: [
          ['Ports', '(1) RJ-50 10-pin (10P10C); RS-232/485; software selectable; RS-232 DTE (RXD, TXD, RTS, CTS, DTR, DCD, DSR, RI); RS-485 (TX/RX+; RX/TX-); half-duplex']
        ]
      },
      {
        title: 'Physical',
        rows: [
          ['Dimensions (L x W x H)', '118 mm x 88 mm x 35 mm (4.65 in x 3.46 in x 1.38 in)'],
          ['Weight', '0.39 kg (0.86 lb)'],
          ['Status LEDs', 'Power, Internet, SIM 1, SIM 2, SIM fail, LTE, signal strength (5)'],
          ['Enclosure', 'Glass-filled polyphenylene sulphide (PPS) / IP30']
        ]
      },
      {
        title: 'Power Requirements',
        rows: [
          ['Power Input', '9 - 30 VDC, reverse polarity protection, 1.0 A maximum'],
          ['Power Consumption', 'Configurable low-power modes; 1.5 W (light traffic flow), 3.5 W (peak data transmission); 1.25 W (low power mode, idle traffic)']
        ]
      },
      {
        title: 'Accessories',
        rows: [
          ['Available Accessories', 'Accessories not included. Available accessories: industrial extended temperature or commercial power supply (required), and cellular antennas, DIN rail clip and EIA 422/485 to RJ-45 connector (recommended / optional)']
        ]
      },
      {
        title: 'Environmental',
        rows: [
          ['Operating Temperature', '−40 °C to 70 °C (−40 °F to 158 °F); device performance may be impacted above 50 °C (122 °F)'],
          ['Storage Temperature', '−40 °C to 85 °C (−40 °F to 85 °F)'],
          ['Relative Humidity', '5% to 95% (non-condensing)']
        ]
      },
      {
        title: 'Approvals**',
        rows: [
          ['Cellular', 'Visit product certifications for latest cellular approvals and updates'],
          ['Safety', 'IEC 62368-1, CB, EN 62311, UL 121201 9th Edition, CAN/CSA C22.2 NO.213-17'],
          ['Environmental', 'ROHS3'],
          ['Emissions / Immunity', 'CE; RED; FCC Part 15, Subpart B; ICES-003; AU/NZS CISPR32']
        ]
      },
      {
        title: 'Warranty***',
        rows: [
          ['Product Warranty', '1-year']
        ]
      },
      {
        title: 'Enterprise Software',
        rows: [
          ['Protocol Support', 'HTTPS, FTP client, TLS v1.2, SCP (client and server), SFTP, SMTP client for use by scripts and the command line, SNMP (v2/v3), SSH; remote management via Digi Remote Manager; protocol analyzer, ability to capture PCAP for use with Wireshark; DynDNS; dynamic DNS client compatible with BIND9/No-IP/DynDNS; captive portal, Intelliflow; Nagios, DNS server, NTP server, multicast, mDNS, IPerf'],
          ['Security', 'IP filtering, stateful firewall, custom firewall rules (iptables), address and port translation, TLS 1.2 and above, OpenVPN client and server, VPN tunnels; Authentication: RADIUS, TACACS+; certificates; MAC address filtering; VLAN support'],
          ['VPN', 'IPSec with IKEv1, IKEv2, NAT Traversal; OpenVPN client and server; GRE VPN tunnels; Cryptology: SHA-1/256/384/512, MD5, RSA; Encryption: 3DES and AES up to 256-bit (CBC mode for IPsec); Diffie Hellman: DH groups 1-32 (CURVE448)'],
          ['Routing/Failover', 'IP pass-through; NAT, NAPT with IP port forwarding; GRE; multicast routing; Routing protocols: RIP (v1, v2) OSPF, BGP; IP failover: VRRP; automatic failover, Digi SureLink®'],
          ['Other Protocols', 'DHCP; dynamic DNS client compatible with No-IP/DynDNS']
        ]
      },
      {
        title: 'Notes',
        rows: [
          ['*', 'Includes the Digi 360 solution for Digi IX10 (1-year) with Digi Remote Manager, warranty and customer care.'],
          ['**', 'Visit product certifications for latest approvals and updates.'],
          ['***', 'Product warranty can be extended with Digi 360 extensions or renewals.']
        ]
      }
    ]
  },
  'Digi IX20 Industrial 4G LTE Router': {
    subtitle: 'Digi IX20 with Digi 360*',
    sourceUrl: 'https://www.digi.com/products/networking/cellular-routers/industrial/digi-ix20#specifications',
    sections: [
      {
        title: 'Cellular',
        rows: [
          ['Certifications', 'Visit product certifications for latest certifications and updates'],
          ['LTE-A (07) with Digi CORE Plug-in LTE Modem 1003-CM07-OUS**', 'LTE-Advanced Cat 7 (North America): B2, B4, B5, B7, B12, B13, B14 FirstNet®, B25, B26, B41, B42, B43, B48, B66, B71; 3G: B2, B5; Transfer rate (max): 300 Mbps down, 150 Mbps up; Industrial temperature'],
          ['LTE (G4) with Digi CORE Plug-in LTE Modem 1002-CMG4-GLB**', 'LTE Cat 4 (Global): B1, B2, B3, B4, B5, B7, B8, B12, B13, B18, B19, B20, B25, B26, B28, B38, B39, B40, B41; 3G: B1, B2, B4, B5, B6, B8, B19; 2G: 850 / 900 / 1800 / 1900 MHz; Transfer rate (max): 150 Mbps down, 50 Mbps up; Industrial temperature'],
          ['LTE (G4-G) with Digi CORE Plug-in LTE Modem 1002-CMG4-GLB-G**', 'LTE Cat 4 (EMEA): B1, B2, B3, B4, B5, B7, B8, B12, B13, B18, B19, B20, B25, B26, B28, B38, B39, B40, B41; 3G: B1, B2, B4, B5, B6, B8, B19; 2G EDGE / GPRS: 850 / 900 / 1800 / 1900 MHz; Transfer rate (max): 150 Mbps down, 50 Mbps up; Industrial temperature'],
          ['LTE (N4/P4) with Digi CORE Plug-in LTE Modem 1002-CMF4-OUS**', 'LTE Cat 4 (North America): B2, B4, B5, B12, B13, B14 FirstNet®, B66, B71; 3G: B2, B4, B5; Transfer rate (max): 150 Mbps down, 50 Mbps up; Industrial temperature'],
          ['LTE (45) with Digi CORE Plug-in LTE Modem 1002-CM45-OEU**', 'LTE Cat 4 (EMEA): B3, B7, B20, B31, B72; 450 MHz support; Transfer rate (max): 150 Mbps down, 50 Mbps up; Industrial temperature'],
          ['LTE (M1) with Digi CORE Plug-in LTE Modem 1002-CMM1-GLB**', 'LTE Cat M1 / NB1 (North America): B1, B2, B3, B4, B5, B8, B12, B13, B18, B19, B20, B26, B28; 2G: 850 / 900 / 1800 / 1900 MHz; Transfer rate (max): M1: 300 kbps down, 375 kbps up; NB1: 21 kbps down, 62.5 kbps up; 2G: 296 kbps down, 236 kbps up; Industrial temperature'],
          ['Connectors', '(2) 50 Ω SMA (center pin: female)'],
          ['SIM Slots', '(2) Mini-SIM (2FF)'],
          ['eSIM Support', 'Digi eSIM optional 2FF accessory (IX20-00G4)'],
          ['SIM Security', 'Secured in cellular module']
        ]
      },
      {
        title: 'Wi-Fi',
        rows: [
          ['Module', '1 x 1 SISO dual-band 802.11a/b/g/n/ac (2.4 GHz / 5 GHz)'],
          ['Authentication', 'TACACS+, Enterprise RADIUS'],
          ['Modes', 'Client mode and access point mode simultaneously'],
          ['Clients', 'Maximum 10 clients (access point mode: regardless of combination of clients and access points)'],
          ['Access Points', 'Maximum 2 access points (access point mode: regardless of combination of clients and access points)'],
          ['Security', 'WPA/WPA-2 personal, WPA/WPA-2 enterprise'],
          ['Connectors', '(1) 50 Ω SMA (center pin: male)']
        ]
      },
      {
        title: 'Software and Management*',
        rows: [
          ['Remote Management', 'Digi Remote Manager®; SNMP v2/v3 (user installed/managed)'],
          ['Local Management', 'Web UI (HTTP/HTTPS); CLI (Telnet, SSH)'],
          ['Management / Troubleshooting Tools', 'FTP client, SCP; protocol analyzer with PCAP for Wireshark; event logging with syslog and SMTP client; NTP/SNTP; Nagios, Intelliflow, IPerf, dynamic DNS, ping, traceroute'],
          ['Memory', '256 MB RAM, 256 MB flash']
        ]
      },
      {
        title: 'Ethernet',
        rows: [
          ['Ports', '(2) RJ-45; 10/100 Mbps (auto-sensing)']
        ]
      },
      {
        title: 'Serial',
        rows: [
          ['Ports', '(1) DB9M; RS-232 DTE; signal support TXD, RXD, CTS, DTR, DCD, flow control software (XON/OFF), hardware supported (CTS/RTS)']
        ]
      },
      {
        title: 'Physical',
        rows: [
          ['Dimensions (L x W x H)', '107 mm x 162 mm x 35 mm (4.21 in x 6.38 in x 1.38 in)'],
          ['Weight', '0.65 kg (1.4 lb)'],
          ['Status LEDs', 'Power, Internet, Wi-Fi, SIM 1, SIM 2, signal strength (5), LTE'],
          ['Enclosure', 'Glass-filled polyphenylene sulphide (PPS) / IP30']
        ]
      },
      {
        title: 'Power Requirements',
        rows: [
          ['Power Input', '9 - 30 VDC, reverse polarity protection, 1.0 A maximum; connector: 2-position rewireable plug with securing screws included'],
          ['Power Consumption', '1.5 W (light traffic flow), 3.5 W (peak data transmission); 1.4 W (low power mode, idle traffic, no Ethernet WAN)']
        ]
      },
      {
        title: 'Environmental',
        rows: [
          ['Operating Temperature', 'Models with Wi-Fi: −20 °C to 70 °C (−4 °F to 158 °F); Models without Wi-Fi: −40 °C to 70 °C (−40 °F to 158 °F)'],
          ['Storage Temperature', '−40 °C to 85 °C (−40 °F to 185 °F)'],
          ['Relative Humidity', '5% to 95% (non-condensing)']
        ]
      },
      {
        title: 'Accessories',
        rows: [
          ['Available Accessories', 'Accessories not included. Available accessories: industrial extended temperature or commercial power supply (required); Wi-Fi, cellular and GPS antennas, Ethernet cable, DIN rail clip kit and DIN rail mounting bracket kit (recommended / optional)']
        ]
      },
      {
        title: 'Approvals**',
        rows: [
          ['Cellular', 'Visit product certifications for latest approvals and updates'],
          ['Safety', 'IEC62368-1, CB, EN62311'],
          ['Environmental', 'ROHS3'],
          ['Emissions / Immunity', 'CE; RED; FCC Part 15, Subpart B; ICES-003; AU/NZS CISPR32']
        ]
      },
      {
        title: 'Warranty***',
        rows: [
          ['Product Warranty', '1-year']
        ]
      },
      {
        title: 'Enterprise Software',
        rows: [
          ['Protocol Support', 'HTTPS, FTP client, TLS v1.2, SCP (client and server), SFTP, SMTP client for use by scripts and the command line, SNMP (v2/v3), SSH; remote management via Digi Remote Manager®; protocol analyzer, ability to capture PCAP for use with Wireshark; DynDNS; dynamic DNS client compatible with BIND9/No-IP/DynDNS; captive portal, Intelliflow; Nagios, DNS server, NTP server, multicast, mDNS, IPerf'],
          ['Security', 'IP filtering, stateful firewall, custom firewall rules (iptables), address and port translation, TLS 1.2 and above, FIPS 197, OpenVPN client and server, VPN tunnels; Authentication: RADIUS, TACACS+; certificates; MAC address filtering; VLAN support'],
          ['VPN', 'IPSec with IKEv1, IKEv2, NAT Traversal; OpenVPN client and server; GRE VPN tunnels; Cryptology: SHA-1/256/384/512, MD5, RSA; Encryption: 3DES and AES up to 256-bit (CBC mode for IPsec); Diffie Hellman: DH groups 1-32 (CURVE448)'],
          ['Routing/Failover', 'IP pass-through; NAT, NAPT with IP port forwarding; Ethernet bridging; GRE; multicast routing; Routing protocols: RIP (v1, v2) OSPF, BGP; IP failover: VRRP; automatic failover, Digi SureLink®'],
          ['Other Protocols', 'DHCP; dynamic DNS client compatible with No-IP/DynDNS']
        ]
      },
      {
        title: 'Notes',
        rows: [
          ['*', 'Includes the Digi 360 solution for Digi IX20 (1-year) with Digi Remote Manager, warranty and customer care.'],
          ['**', 'Visit product certifications for latest approvals and updates. Digi CORE plug-in LTE modem is included with the corresponding IX20 model, with the ability to upgrade or replace the modem without replacing the router. Transfer rates are network operator dependent. Digi CORE 1003-CM07-OUS and 1002-CMG4-GLB-G require two cellular antennas with option for a third GNSS/GPS antenna. Digi CORE 1002-CMG4-GLB, 1002-CM45-OEU and 1002-CMF4-OUS require two cellular antennas. Digi CORE 1002-CMM1-GLB requires only one cellular antenna. Wi-Fi antenna available for Wi-Fi enabled models.'],
          ['***', 'Product warranty can be extended with Digi 360 extensions or renewals.']
        ]
      }
    ]
  },
  'Digi IX25 5G Industrial Cellular Router': {
    subtitle: 'Digi IX25 with Digi 360*',
    sourceUrl: 'https://www.digi.com/products/networking/cellular-routers/industrial/digi-ix25#specifications',
    sections: [
      {
        title: 'Wireless Interfaces',
        rows: [
          ['Cellular / WWAN**', 'Visit product certifications for latest approvals and updates'],
          ['5G eMBB - IX25-5A-1G', '5G NR bands: n1, n2, n3, n5, n7, n8, n12, n13, n14, n18, n20, n25, n26, n28, n29, n30, n38, n40, n41, n48 (CBRS), n66, n71, n75, n76, n77, n78, n79 (C-band); 4G LTE-Advanced Pro bands: B1, B2, B3, B4, B5, B7, B8, B12, B13, B14 (FirstNet®), B17, B20, B25, B26, B28, B29, B30, B32, B34, B38, B39, B40, B41, B42, B43, B48 (CBRS), B66, B71, B106 (Anterix)'],
          ['5G RedCap - IX25-RA-1G / IX25-RA-0G', '5G NR bands: n1, n2, n3, n5, n7, n8, n12, n13, n14, n18, n20, n25, n26, n28, n30, n38, n40, n41, n48 (CBRS), n66, n70, n71, n75, n77, n78, n79 (C-band); 4G LTE bands: B1, B2, B3, B4, B5, B7, B8, B12, B13, B14 (FirstNet®), B17, B20, B25, B26, B28, B29, B30, B32, B38, B40, B41, B42, B43, B46, B48 (CBRS), B66, B71, B106 (Anterix)'],
          ['LTE - IX25-4A-1G / IX25-4A-0G', '4G LTE bands: B1, B2, B3, B4, B5, B7, B8, B8_US (Anterix), B12, B13, B14 (FirstNet®), B18, B19, B20, B25, B26, B28; 3G bands: B1, B2, B4, B5, B6, B8, B19; 2G bands: B2, B3, B5, B8'],
          ['Connectors', 'LTE and RedCap: (3) 50 Ω SMA (center pin: female); eMBB: (5) 50 Ω SMA (center pin: female)'],
          ['SIM Slots / eSIM Support', '(2) Nano-SIM (4FF) slots; soldered MFF2 Digi eSIM with eUICC (SGP .32) for remote provisioning and carrier switching'],
          ['SIM Security', 'SIM slot cover plate included']
        ]
      },
      {
        title: 'GNSS',
        rows: [
          ['Technology', 'GNSS Gen 9 with band L1 LNA for passive antenna use'],
          ['Antenna', 'Upper L-band: GPS L1; Glonass G1; Beidou B1; Galileo E1; IX25 supports passive GNSS antennas rated at 1.5 - 3 dBi or active antennas with 7.5 - 26 dB gain (3.3 V feed)'],
          ['Protocol', 'NMEA 4.11 and TAIP'],
          ['Connector', '(2) 50 Ω SMA center pin: female']
        ]
      },
      {
        title: 'Wi-Fi 6E',
        rows: [
          ['Technology', 'Dual band Wi-Fi 6E 802.11 a/b/g/n/ac/ax 2x2 MIMO for high-speed, reliable wireless connectivity (including 2.4 GHz, 5 GHz and 6 GHz)'],
          ['Connector', '(2) 50 Ω RP-SMA (male)']
        ]
      },
      {
        title: 'Wired Interfaces',
        rows: [
          ['Ethernet Ports / Connector', '(4) RJ-45; 10/100/1000 Mbps Base-T (auto-sensing); IEEE 802.3; configurable as WAN or LAN'],
          ['I/O Ports / Connector', '(2) Digital input/outputs'],
          ['Serial Ports / Connector', '(1) RJ-50 (RS-232/485, software-selectable)']
        ]
      },
      {
        title: 'Software and Management*',
        rows: [
          ['Remote Management', 'Digi Remote Manager (cloud based); SNMP v1/v2c/v3 (user installed/managed), SMS'],
          ['Local Management', 'WebUI (HTTPS); CLI (SSH, Serial)'],
          ['Management / Troubleshooting Tools', 'SFTP, SCP; protocol analyzer with PCAP for Wireshark; event logging with Syslog'],
          ['Memory', '1 GB DDR / 8 GB eMMC']
        ]
      },
      {
        title: 'Compute',
        rows: [
          ['Application Processor', '1.2 GHz quad-core ARM® Cortex®-A53 processor']
        ]
      },
      {
        title: 'Physical',
        rows: [
          ['Dimensions (L x W x H)', '146 mm x 118 mm x 38 mm (5.74 in x 4.64 in x 1.49 in)'],
          ['Weight', '590 g (1.3 lb)'],
          ['Status LEDs', 'PWR, WWAN, Wi-Fi, GNSS, Ethernet (link, activity)'],
          ['Enclosure / Rating', 'ABS/PC blend; IP30; private labeling options']
        ]
      },
      {
        title: 'Power Requirements',
        rows: [
          ['Power Input', '9 - 30 VDC, reverse polarity protection, 9 - 30 VDC passive Power over Ethernet (PoE), USB Type-C Power Delivery (PD)'],
          ['Power Connector', '4-pin Molex connector or USB Type-C Power Delivery (PD)'],
          ['Power Consumption', 'Idle power: 2.3 W (197 mA at 12 VDC)** - serial enabled']
        ]
      },
      {
        title: 'Environmental',
        rows: [
          ['Hazardous (Class 1 Div 2)', 'Complete'],
          ['Operating Temperature', '−40 °C to 75 °C (−40 °F to 167 °F); Wi-Fi disabled at 60 °C to 70 °C (140 °F to 158 °F)'],
          ['Storage Temperature', '−40 °C to 85 °C (−40 °F to 185 °F)'],
          ['Relative Humidity', '0% to 95% (non-condensing) at 25 °C (77 °F)']
        ]
      },
      {
        title: 'Approvals***',
        rows: [
          ['Cellular', 'PTCRB, AT&T, FirstNet Capable™, T-Mobile, Verizon, Anterix™ Active'],
          ['Safety / Security', 'IEC 62368-1, CB scheme, FIPS 140-3'],
          ['Environmental', 'Hazardous location: ATEX Zone 2; C1D2 (UL 121201); MIL-STD-810H (high and low temperature, vibration, shock)'],
          ['Emissions / Immunity', 'FCC Part 15 Subpart B, ISED, CE, RED, UKCA, RCM']
        ]
      },
      {
        title: 'Warranty****',
        rows: [
          ['Product Warranty', '1-year']
        ]
      },
      {
        title: 'Notes',
        rows: [
          ['*', 'Includes the Digi 360 solution for Digi IX25 (1-year) with Digi Remote Manager, warranty and customer care.'],
          ['**', 'Visit product certifications for latest approvals and updates.'],
          ['***', 'Visit product certifications for latest approvals and updates.'],
          ['****', 'Product warranty can be extended with Digi 360 extensions or renewals.']
        ]
      }
    ]
  },
  'Digi IX30 Industrial Cellular Router': {
    subtitle: 'Digi IX30 with Digi 360*',
    sourceUrl: 'https://www.digi.com/products/networking/cellular-routers/industrial/digi-ix30#specifications',
    sections: [
      {
        title: 'Wireless Interfaces',
        rows: [
          ['Certifications**', 'Visit product certifications for latest approvals and updates'],
          ['IX30-00P7: FirstNet Capable LTE-Advanced Cat 7', 'LTE-Advanced Cat 7 - FDD: B2, B4, B5, B7, B12, B13, B14 (FirstNet®), B25, B26, B66, B71; TDD: B41, B42, B43, B48 (CBRS); WCDMA: B2, B4, B5; GNSS: GPS, GLONASS, BeiDou, Galileo, QZSS'],
          ['IX30-0EG4: FirstNet Capable LTE Cat 4 Global / Anterix Active (select regions / carriers*)', 'LTE Cat 4 - FDD: B1, B2, B3, B4, B5, B7, B8, B8_US (Anterix), B12, B13, B14 (FirstNet®), B18, B19, B20, B25, B26, B28; WCDMA: B1, B2, B4, B5, B6, B8, B19; GSM: B2, B3, B5, B8; GNSS: GPS, GLONASS, BeiDou, Galileo, QZSS'],
          ['Connectors', '(3) 50 Ω SMA (2x cellular, 1x GNSS); center pin: female'],
          ['SIM Slots', '(2) Mini-SIM (2FF)'],
          ['eSIM Support', 'Digi eSIM optional 2FF accessory (IX30-0EG4)'],
          ['SIM Security', 'Screw-down SIM cover']
        ]
      },
      {
        title: 'GNSS',
        rows: [
          ['Protocol', 'NMEA 0183 V3.0'],
          ['Acquisition Time', 'Hot Start 1 s; Warm Start 29 s; Cold Start 32 s'],
          ['Accuracy', 'Horizontal: < 2 m (50%), < 5 m (90%); Altitude: < 4 m (50%), < 8 m (90%); Velocity: < 0.2 m/s']
        ]
      },
      {
        title: 'Software & Management*',
        rows: [
          ['Remote Management', 'Digi Remote Manager (cloud based); SNMP v1/v2c/v3 (user installed/managed), SMS'],
          ['Local Management', 'WebUI (HTTP/HTTPS); CLI (Telnet, SSH, Serial)'],
          ['Management / Troubleshooting Tools', 'FTP, SFTP, SCP; protocol analyzer with PCAP for Wireshark; event logging with Syslog and SMTP; NTP/SNTP']
        ]
      },
      {
        title: 'Wired Interfaces',
        rows: [
          ['Ethernet Ports', '(2) RJ-45; 10/100 Mbps (auto-sensing)'],
          ['Serial Ports', '(1) DB-9 DTE; RS-232/422/485; signal support TXD, RXD, RTS, CTS, DTR, DCD, DSR, RI; flow control software (XON/XOFF), hardware supported'],
          ['I/O Connector', '12-pin screw down terminal block; digital 0-30 VDC, 200 mA max.; (4) I/O, software-selectable; pulse counter input; analog (4) I/O; 4-20 mA or 0-10 V, software-selectable; 12-bit resolution'],
          ['USB', '(1) USB 2.0 Type A; 5 V 500 mA max']
        ]
      },
      {
        title: 'Physical',
        rows: [
          ['Dimensions (L x W x H)', '12.8 cm x 10 cm x 5.2 cm (5.04 in x 3.94 in x 2.05 in)'],
          ['Weight', '0.5 kg (1.1 lb)'],
          ['Status LEDs', 'Signal Strength (5), LTE, Power'],
          ['Enclosure / Rating', 'Aluminum / IP30'],
          ['Mounting', 'DIN rail mount']
        ]
      },
      {
        title: 'Power Requirements',
        rows: [
          ['Power Input', '9 - 30 VDC, reverse polarity protection, 18 W min power source required'],
          ['Power Connector', 'Screw down removable terminal block'],
          ['Power Consumption', '1.5 W (light traffic flow), 3.5 W (peak data transmission); 1 W (low power mode, idle traffic, no serial/no Ethernet WAN)']
        ]
      },
      {
        title: 'Environmental',
        rows: [
          ['Hazardous (Class 1 Div 2)', 'Complete'],
          ['Operating Temperature', '−34 °C to 74 °C (−29 °F to 165 °F); reduced cellular performance may occur above 60 °C (140 °F)'],
          ['Storage Temperature', '−40 °C to 85 °C (−40 °F to 185 °F)'],
          ['Ethernet Isolation', '1.5 kV RMS'],
          ['Serial Port Protection (ESD)', '15 kV'],
          ['Relative Humidity', '5% to 95% (non-condensing)']
        ]
      },
      {
        title: 'Approvals*',
        rows: [
          ['Cellular', 'IX30-00P7: FCC, PTCRB, Verizon, T-Mobile, AT&T, FirstNet Capable™; IX30-0EG4: FCC, PTCRB, CE, RED, UKCA, RCM, Verizon, T-Mobile, AT&T, FirstNet Capable™, Anterix™ Active'],
          ['Safety', 'Hazardous locations: ANSI/ISA-12.12.01-2015, CAN/CSA C22.2 NO.213-15; Ordinary locations: UL 62368-1, 2nd Edition, 2014-10-14; UL 62368: 2014, 2nd Edition; ATEX standards: Protection method II 3 G Ex nA IIC T4 Gc; EN 60079-0:2012+A11:2013, EN 60079-15:2010, DEMKO 15 ATEX 1574X Rev. 1'],
          ['IECEx Standards', 'US/UL/ExTR17.0077/00'],
          ['Emissions / Immunity', 'CE, RED, FCC Part 15 Class B, ICES-003, AS/NZS CISPR 32'],
          ['Environmental', 'RoHS3']
        ]
      },
      {
        title: 'Warranty***',
        rows: [
          ['Product Warranty', '1-year']
        ]
      },
      {
        title: 'Enterprise Software',
        rows: [
          ['Protocol Support', 'HTTPS, TLS, SCP (client and server), SFTP, SNMP (v3), SSH, Telnet and CLI for web management; remote management via Digi Remote Manager®; protocol analyzer, ability to capture PCAP for use with Wireshark; DynDNS, Dynamic DNS client compatible with BIND9/No-IP/DynDNS; Captive portal, Intelliflow; Nagios, DNS server, NTP server, Multicast, mDNS, IPerf'],
          ['Security/VPN', 'IP filtering, stateful inspection firewall with scripting, address and port translation; VPN: IPSec with IKEv1, IKEv2, NAT Traversal; SSLv3, FIPS 197, Open VPN client and server; L2TP; VPN tunnels; cryptology: SHA-1, MD5, RSA; encryption: DES, 3DES and AES up to 256-bit (CBC mode for IPsec); authentication: RADIUS, TACACS+, SCEP for X.509; certificates; content filtering (via 3rd party); MAC address filtering; VLAN support'],
          ['Routing/Failover', 'IP pass-through; NAT, NAPT with IP port forwarding; Ethernet bridging; GRE; multicast routing; routing protocols: PPP, PPPoE, RIP (v1, v2) OSPF, BGP, iGMP routing (multicast); IP failover: VRRP, VRRP+TM; automatic failover/failback to second GSM network/standby APN; Digi SureLink®'],
          ['Other Protocols', 'DHCP; Dynamic DNS client compatible with No-IP/DynDNS; QoS via TOS/DSCP; Modbus UDP/TCP to serial; Modbus bridging for connecting diverse field assets']
        ]
      },
      {
        title: 'Notes',
        rows: [
          ['*', 'Includes the Digi 360 solution for Digi IX30 (1-year) with Digi Remote Manager, warranty and customer care.'],
          ['**', 'Visit product certifications for latest approvals and updates.'],
          ['***', 'Product warranty can be extended with Digi 360 extensions or renewals.']
        ]
      }
    ]
  },
  'Digi IX40 5G Edge Computing Industrial IoT Solution': {
    subtitle: 'Digi IX40 with Digi 360*',
    sourceUrl: 'https://www.digi.com/products/networking/cellular-routers/industrial/digi-ix40#specifications',
    sections: [
      {
        title: 'Wireless Interfaces',
        rows: [
          ['Cellular / WWAN**', 'Visit product certifications for latest approvals and updates'],
          ['IX40-05: 5G NSA, 5G SA***, 4G LTE-Advanced Pro Cat 19', '5G NR bands: n1, n2, n3, n5, n7, n8, n12, n13, n14 FirstNet®, n18, n20, n25, n26, n28, n29, n30, n38, n40, n41, n48, n66, n71, n75, n76, n77, n78, n79; 4G LTE-Advanced Pro bands: B1, B2, B3, B4, B5, B7, B8, B12, B13, B14 FirstNet®, B17, B20, B25, B26, B28, B29, B30, B32, B38, B40, B41, B42, B43, B46, B48, B66, B71; 3G bands: B1, B2, B3, B4, B5, B6, B8, B19'],
          ['IX40-04: 4G LTE-Advanced Pro Cat 12, 3G HSPA+', '4G LTE-Advanced Pro bands: B1, B2, B3, B4, B5, B7, B8, B12, B13, B14, B17, B18, B19, B20, B25, B26, B28, B29, B30, B38, B39, B40, B41, B42, B43, B48, B66, B71; 3G bands: B1, B2, B4, B5, B6, B8, B9, B19'],
          ['Connectors', '(2) or (4) 50 Ω SMA; center pin: female'],
          ['SIM Slots', '(2) Nano-SIM (4FF) holders'],
          ['eSIM Support', 'Digi eSIM optional 2FF accessory (IX40-05)'],
          ['SIM Security', 'SIM slot cover plate included']
        ]
      },
      {
        title: 'GNSS',
        rows: [
          ['Technology', 'GPS Gen 9 with band L1 LNA for passive antenna use'],
          ['Antenna', 'Upper L-band: GPS L1; Glonass G1; Beidou B1; Galileo E1; IX40-04: supports passive GNSS antennas rated at 1.5 to 3 dBi only; IX40-05: supports passive GNSS antennas rated at 1.5 to 3 dBi or active antennas with 7.5 to 26 dB gain'],
          ['Protocol', 'NMEA 4.11 and TAIP'],
          ['Connector', '(1) 50 Ω SMA; center pin: female']
        ]
      },
      {
        title: 'Wired Interfaces',
        rows: [
          ['Ethernet Ports / Connector', '(4) RJ-45; 10/100/1000 Mbps Base-T (auto-sensing); IEEE 802.3; configurable as WAN or LAN'],
          ['I/O Ports / Connector', '(2) Digital input/outputs; (2) analog inputs (0 - 10 V; 4 - 20 mA; 12-bit resolution)'],
          ['SFP Ports / Connector', '(2) 1 Gb capable SFP sockets'],
          ['Serial Ports / Connector', '(1) RS-232/422/485; DB-9 male (DTE)']
        ]
      },
      {
        title: 'Software and Management*',
        rows: [
          ['Remote Management', 'Digi Remote Manager (cloud based); SNMP v1/v2c/v3 (user installed/managed), SMS'],
          ['Local Management', 'Web UI (HTTPS); CLI (SSH, serial)'],
          ['Management Tools', 'SFTP, SCP; protocol analyzer with PCAP for Wireshark; event logging with Syslog']
        ]
      },
      {
        title: 'Processor',
        rows: [
          ['Application Processor', '1.6 GHz quad-core i.MX 8M Plus ARM® Cortex®-A53 processor']
        ]
      },
      {
        title: 'Memory',
        rows: [
          ['RAM / Flash', '1 GB / 8 GB']
        ]
      },
      {
        title: 'Physical',
        rows: [
          ['Dimensions (L x W x H)', '234 mm x 154 mm x 41 mm (9.21 in x 6.06 in x 1.61 in)'],
          ['Weight', '1.14 kg (2.51 lb)'],
          ['Status LEDs', 'Power, WWAN, Ethernet (link, activity)'],
          ['Enclosure / Rating', 'Glass-filled polyphenylene sulphide / IP30 -40 °C to 85 °C (−40 °F to 185 °F)']
        ]
      },
      {
        title: 'Power Requirements',
        rows: [
          ['Power Input', '12 to 30 VDC, reverse polarity protection'],
          ['Power Connector', 'Screw down removable terminal block'],
          ['Power Consumption', '4.5 W (light traffic), 8 W (peak data), 3.5 W (idle traffic)']
        ]
      },
      {
        title: 'Environmental',
        rows: [
          ['Hazardous (Class 1 Div 2)', 'Complete'],
          ['Operating Temperature', '−40 °C to 75 °C (−40 °F to 167 °F); reduced cellular performance may occur above 70 °C (158 °F)'],
          ['Storage Temperature', '−45 °C to 85 °C (−49 °F to 185 °F)'],
          ['Relative Humidity', '0% to 95% (non-condensing) at 25 °C (77 °F)']
        ]
      },
      {
        title: 'Approvals**',
        rows: [
          ['Cellular', 'PTCRB, AT&T, FirstNet Capable™, T-Mobile, Verizon'],
          ['Safety / Security', 'IEC 62368-1, CB scheme, FIPS 140-2'],
          ['Emissions / Immunity', 'FCC Part 15 Subpart B, ISED, CE, RED, UKCA']
        ]
      },
      {
        title: 'Warranty****',
        rows: [
          ['Product Warranty', '1-year']
        ]
      },
      {
        title: 'Enterprise Software',
        rows: [
          ['Protocol Support', 'HTTPS, TLS, SCP (client and server), SFTP, SNMP (v3), SSH, Telnet and CLI for web management; remote management via Digi Remote Manager®; protocol analyzer, ability to capture PCAP for use with Wireshark; DynDNS, Dynamic DNS client compatible with No-IP/DynDNS; Captive portal, Intelliflow; Nagios, DNS server, NTP server, Multicast, mDNS, IPerf'],
          ['Security / VPN', 'IP filtering, stateful inspection firewall with scripting, address and port translation; VPN: IPSec with IKEv1, IKEv2, NAT Traversal; SSLv3, FIPS 197, Open VPN client and server; L2TP; VPN tunnels; cryptology: SHA-1, MD5, RSA; encryption: DES, 3DES and AES up to 256-bit (CBC mode for IPsec); authentication: RADIUS, TACACS+, SCEP for X.509; certificates; content filtering (via 3rd party); MAC address filtering; VLAN support'],
          ['Routing', 'IP pass-through; NAT, NAPT with IP port forwarding; Ethernet bridging; GRE; multicast routing; routing protocols: PPP, PPPoE, RIP (v1, v2) OSPF, BGP, iGMP routing (multicast); IP failover: VRRP, VRRP+TM; automatic failover/failback to second GSM network/standby APN; Digi SureLink®'],
          ['Other Protocols', 'DHCP; Dynamic DNS client compatible with No-IP/DynDNS; QoS via TOS/DSCP; Modbus UDP/TCP to serial; Modbus bridging for connecting diverse field assets']
        ]
      },
      {
        title: 'Notes',
        rows: [
          ['*', 'Includes the Digi 360 solution for Digi IX40 (1-year) with Digi Remote Manager, warranty and customer care.'],
          ['**', 'Visit product certifications for latest approvals and updates.'],
          ['***', 'Contact your network operator regarding 5G SA support on their network. Digi IX40-05 supports up to 2xCC (2x 5G SA Carrier Components).'],
          ['****', 'Product warranty can be extended with Digi 360 extensions or renewals.']
        ]
      }
    ]
  },
  'Digi TX64 5G / LTE-Advanced Pro Cellular Router': {
    subtitle: 'Digi TX64 5G with Digi 360*',
    sourceUrl: 'https://www.digi.com/products/networking/cellular-routers/transportation/digi-tx64#specifications',
    sections: [
      {
        title: 'Wireless Interfaces',
        rows: [
          ['WWAN**', '5G NR Sub-6 GHz with 4G LTE-Advanced Pro and 3G fallback (TX64-A161); LTE-Advanced Pro Cat 18 (TX64-A141); 4G LTE-Advanced Cat 11 (TX64-A121)'],
          ['5G NR Sub-6', 'n1, n2, n3, n5, n7, n8, n12, n20, n25, n28, n38, n40, n41, n48 CBRS, n66, n71, n77, n78, n79 C-band'],
          ['4G LTE-Advanced Pro', 'B1, B2, B3, B4, B5, B7, B8, B12, B13, B14 FirstNet®, B17, B18, B19, B20, B25, B26, B28, B29, B30, B32, B34, B38, B39, B40, B41, B42, B46, B48 CBRS, B66, B71'],
          ['4G LTE-Advanced Cat 11', 'B1, B2, B3, B4, B5, B7, B8, B12, B13, B17, B20, B25, B26, B28, B29, B30, B66'],
          ['3G', 'B1, B2, B3, B4, B5, B6, B8, B9, B19'],
          ['Connector', '(2) or (4) 50 Ω SMA per module (center pin: female)'],
          ['SIM Slots', '(2) Mini-SIM (2FF) per module (4 total)'],
          ['SIM Security', 'SIM slot cover plate included']
        ]
      },
      {
        title: 'Wi-Fi',
        rows: [
          ['Technology', 'Private backhaul: Wi-Fi 6 (802.11ax), 5 GHz, 4 x 4 MIMO, up to 128 clients; Public Wi-Fi: Wi-Fi 6 (802.11ax), 2.4 / 5 GHz, 2 x 2 MIMO, up to 128 clients'],
          ['Security', 'WPA, WPA2 and WPA3 Personal and Enterprise, Open and Open Enhanced security standards'],
          ['Hotspot', 'Captive portal with customizable splash page, terms and conditions, shared password, user-specific password, RADIUS authentication'],
          ['Third-Party Services', 'Content filtering, embedded advertising'],
          ['Modes', 'Up to 8 access points and 1 client per Wi-Fi module (16 + 2 total)'],
          ['Connectors', 'Private backhaul: (4) 50 Ω RP-SMA (center pin: male); Public Wi-Fi: (2) 50 Ω RP-SMA (center pin: male)']
        ]
      },
      {
        title: 'GNSS',
        rows: [
          ['Technology', 'GPS, Galileo, BeiDou and GLONASS with Untethered Dead Reckoning (UDR), multiple geofence support'],
          ['Sensitivity', 'Tracking and navigation: −160 dBm'],
          ['Protocol', 'NMEA 0183 4.0, TAIP'],
          ['Connector', '(1) 50 Ω SMA (center pin: female); +3.3 VDC active antenna drive']
        ]
      },
      {
        title: 'Wired Interfaces',
        rows: [
          ['Ethernet', '(4) RJ-45; 10/100/1000 Mbps Base-T (auto-sensing); IEEE 802.3; configurable as WAN or LAN'],
          ['Serial', '(1) RS-232; DB-9 male (DTE)'],
          ['USB', '(3) USB 3.0 Type A']
        ]
      },
      {
        title: 'Software and Management*',
        rows: [
          ['Remote Management', 'Digi Remote Manager (cloud based); SNMP v2c/v3 (user installed/managed), SMS'],
          ['Local Management', 'Web UI (HTTPS); CLI (SSH, serial)'],
          ['Management Tools', 'SFTP, SCP; protocol analyzer with PCAP for Wireshark; event logging with Syslog']
        ]
      },
      {
        title: 'Memory',
        rows: [
          ['RAM / Flash', '2 GB / 8 GB']
        ]
      },
      {
        title: 'Physical',
        rows: [
          ['Dimensions (L x W x H)', '260 mm x 196 mm x 67 mm (10.2 in x 7.8 in x 2.6 in)'],
          ['Weight', '3.3 kg (7.25 lbs)'],
          ['Status LEDs', 'Power, WWAN (signal, service), Wi-Fi service (per module), GNSS service, LAN (link, activty)'],
          ['Enclosure / Rating', 'Aluminum alloy / IP40']
        ]
      },
      {
        title: 'Power',
        rows: [
          ['Power Input', '9 – 36 VDC, reverse polarity protection, 60 W minimum power source required, ignition sense'],
          ['Power Consumption', '28 W typical (idle), 41 W (peak RF Tx/Rx)']
        ]
      },
      {
        title: 'Environmental',
        rows: [
          ['Operating Temperature', '−30 °C to 70 °C (−22 °F to 158 °F)'],
          ['Storage Temperature', '−40 °C to 85 °C (−40 °F to 185 °F)'],
          ['Relative Humidity', '5% to 95% (non-condensing) at 25 °C (77 °F)'],
          ['NEMA', 'Meets or exceeds the NEMA TS2 environmental requirements (−34 °C to 74 °C temperature range; 18% to 95% humidity over the temperature range; vibration: 0.5 g at 5 Hz to 30 Hz; shock: 10 g)']
        ]
      },
      {
        title: 'Approvals**',
        rows: [
          ['Cellular', 'PTCRB, AT&T, FirstNet Capable™, FirstNet Trusted™, T-Mobile, Verizon, Verizon Frontline'],
          ['Safety', 'UL 60950, EN 62368, CSA 22.2 No. 60950'],
          ['Vehicle', 'E-Mark (UNECE Reg. 10), SAE J1113-2, SAE J1455, ISO 7637-2/3, ISO 10605, ISO 16750-2 load dump'],
          ['Emissions / Immunity', 'CE, FCC Part 15 Class B with IC, EN 303413, EN 301489-1/-19, CISPR 25, Level 3, ISO 11452-2, ISO 11452-4'],
          ['Environmental', 'MIL-STD 810G (temperature, humidity, vibration, shock, dust)']
        ]
      },
      {
        title: 'Warranty***',
        rows: [
          ['Product Warranty', '1-year']
        ]
      }
    ]
  },
  'Digi TX64 5G Rail Cellular Router': {
    subtitle: 'Digi TX64 5G Rail with Digi 360*',
    sourceUrl: 'https://www.digi.com/products/networking/cellular-routers/transportation/digi-tx64-5g-rail#specifications',
    sections: [
      {
        title: 'Wireless Interfaces',
        rows: [
          ['WWAN**', '5G Sub-6 GHz with 4G LTE-Advanced Pro and 3G fallback — global'],
          ['5G Sub-6', 'n1, n2, n3, n5, n7, n8, n12, n20, n25, n28, n38, n40, n41, n48 CBRS, n66, n71, n77, n78, n79, C-band'],
          ['4G LTE', 'B1, B2, B3, B4, B5, B7, B8, B12, B13, B14 — FirstNet®, B17, B18, B19, B20, B25, B26, B28, B29, B30, B32, B34, B38, B39, B40, B41, B42, B43, B46, B48 CBRS, B66, B71'],
          ['3G', 'B1, B2, B3, B4, B5, B6, B8, B9, B19'],
          ['Connector', '(4) 50 Ω TNC (center pin: female)'],
          ['SIM Slots', '2 Mini-SIM (2FF)'],
          ['SIM Security', 'SIM slot cover plate included']
        ]
      },
      {
        title: 'Wi-Fi',
        rows: [
          ['Technology', 'Private backhaul: Wi-Fi 6 (802.11ax), 2.4 / 5 GHz, 2 x 2 MIMO, up to 128 clients; Public Wi-Fi: Wi-Fi 6 (802.11ax), 2.4 / 5 GHz, 2 x 2 MIMO, up to 128 clients'],
          ['Hotspot', 'Captive portal with customizable splash page'],
          ['Authentication', 'Basic terms and conditions acceptance, enterprise RADIUS, shared password, HotSpotSystem'],
          ['Third-Party Services', 'Content filtering, embedded advertising'],
          ['Modes', 'Up to 8 access points and 1 client per Wi-Fi module (16 + 2 total)'],
          ['Connectors', 'Private backhaul: (2) 50 Ω RP-TNC (center pin: male); Public Wi-Fi: (2) 50 Ω RP-TNC (center pin: male)']
        ]
      },
      {
        title: 'GNSS',
        rows: [
          ['Technology', 'GPS, Galileo, BeiDou and GLONASS with Untethered Dead Reckoning (UDR), multiple geofence support'],
          ['Sensitivity', 'Tracking and navigation: −160 dBm'],
          ['Protocol', 'NMEA 0183 4.0, TAIP'],
          ['Connector', '(1) 50 Ω RP-TNC (center pin: male); +3.3 VDC active antenna drive']
        ]
      },
      {
        title: 'Wired Interfaces',
        rows: [
          ['Ethernet', '(4) M12 X-code / IEEE 802.3; 10/100/1000 Base-T'],
          ['Serial', '(1) RS-232; DB-9 male'],
          ['USB', '(2) USB 3.0, Type A']
        ]
      },
      {
        title: 'Software and Management*',
        rows: [
          ['Remote Management', 'Digi Remote Manager (cloud based); SNMP v2c/v3 (user installed/managed), SMS'],
          ['Local Management', 'Web UI (HTTPS); CLI (SSH, serial)'],
          ['Management Tools', 'SFTP, SCP; protocol analyzer with PCAP for Wireshark; event logging with Syslog']
        ]
      },
      {
        title: 'Memory',
        rows: [
          ['RAM / Flash', '2 GB / 8 GB']
        ]
      },
      {
        title: 'Physical',
        rows: [
          ['Dimensions (L x W x H)', '260 mm x 196 mm x 51 mm (10.2 in x 7.8 in x 2 in)'],
          ['Weight', '3.9 kg (8.6 lbs)'],
          ['Status LEDs', 'Power, WWAN (signal, service) per module, Wi-Fi service (per module), GNSS service, LAN (link, activty)'],
          ['Enclosure / Rating', 'Aluminum alloy / IP66']
        ]
      },
      {
        title: 'Power',
        rows: [
          ['Power Input', '9 – 36 VDC, 60 W minimum power source required, reverse polarity protection, M12 T-CODE with ignition sense'],
          ['Power Consumption', '28 W typical (idle), 41 W (peak RF Tx/Rx)']
        ]
      },
      {
        title: 'Environmental',
        rows: [
          ['Mounting', 'Slotted mounting flanges, grounding stud'],
          ['Operating Temperature', '−40 °C to 74 °C (−40 °F to 165.2 °F)'],
          ['Storage Temperature', '−40 °C to 85 °C (−40 °F to 185 °F)'],
          ['Relative Humidity', '5% to 95% (non-condensing) at 25 °C (77 °F)']
        ]
      },
      {
        title: 'Approvals**',
        rows: [
          ['Cellular', 'PTCRB, AT&T, FirstNet Trusted™, T-Mobile, Verizon'],
          ['Shock / Vibration', 'MIL-STD-810G: vibration (Method 414.6C-10, Category 11), shock (Method 516.6, Procedure I)'],
          ['Emissions / Immunity', 'FCC Part 15 Class B, EN 50121-3-2, CISPR 16-2-3'],
          ['Environmental / Industrial', 'EN 50155, EN 45545-2, IEC 60068-2-1/2-2/2-30']
        ]
      },
      {
        title: 'Warranty***',
        rows: [
          ['Product Warranty', '1-year']
        ]
      },
      {
        title: 'Notes',
        rows: [
          ['*', 'Includes the Digi 360 solution for Digi TX64 5G Rail (1-year) with Digi Remote Manager, warranty and customer care.'],
          ['**', 'Visit product certifications for latest approvals and updates.'],
          ['***', 'Product warranty can be extended with Digi 360 extensions or renewals.']
        ]
      }
    ]
  },
  'Digi EX12 Cellular Extender': {
    subtitle: 'Digi EX12 with Digi 360*',
    sourceUrl: 'https://www.digi.com/products/networking/cellular-routers/enterprise/digi-ex12#specifications',
    sections: [
      {
        title: 'Cellular Connectivity**',
        rows: [
          ['Certifications', 'Visit product certifications for latest approvals and updates'],
          ['3GPP Cellular Bands', 'LTE: B2, B4, B5, B12, B13, B14 FirstNet, B66, B71; 3G: B2, B4, B5; transfer rate (max): 150 Mbps down, 50 Mbps up'],
          ['Connectors', '(2) 50 ohm SMA (center pin: female)'],
          ['SIM Slots', '(2) Mini-SIM (2FF); software selectable and hardware switchable']
        ]
      },
      {
        title: 'Software and Management*',
        rows: [
          ['Remote Management', 'Digi Remote Manager; SNMP v3 (user installed/managed), encrypted SMS'],
          ['Local Management', 'WebUI (HTTP/HTTPS); CLI (SSH, serial port)'],
          ['Protocols', 'RIP, RIPng, OSPFv2, OSPFv3, BGP, Babel, IS-IS'],
          ['Management / Troubleshooting Tools', 'FTP client, SCP; protocol analyzer with PCAP for Wireshark; event logging with Syslog and SMTP client; NTP/SNTP'],
          ['Memory', '256 MB RAM, 512 MB flash']
        ]
      },
      {
        title: 'Ethernet',
        rows: [
          ['Ports', '(2) RJ-45; 10/100 Mbps (auto-sensing)']
        ]
      },
      {
        title: 'Serial',
        rows: [
          ['Ports', '(1) RS-232 (RJ-45)']
        ]
      },
      {
        title: 'Physical',
        rows: [
          ['Dimensions (L x W x H)', '127 mm x 127 mm x 25 mm (5.0 in x 5.0 in x 1.0 in)'],
          ['Weight', '0.24 kg (8.25 oz)'],
          ['Status LEDs', 'LAN (link = solid, flashing = act), WAN (link = solid, flashing = act), LTE, 5 signal'],
          ['Enclosure', 'Plastic']
        ]
      },
      {
        title: 'Power Requirements',
        rows: [
          ['Power Input', '18 VDC, 1 A, reverse polarity protection'],
          ['Other', 'Includes PSU, cables, antennas and optional Remote Mounting Kit: passive PoE injector, mounting bracket and accessories (see part number for details). Only the Digi-supplied power supply and passive PoE injector are recommended for use with Digi EX12.']
        ]
      },
      {
        title: 'Environmental',
        rows: [
          ['Operating Temperature', '0 C to 40 C (32 F to 104 F)'],
          ['Relative Humidity', '5% to 95% (non-condensing)']
        ]
      },
      {
        title: 'Approvals**',
        rows: [
          ['Cellular', 'PTCRB; US: AT&T, FirstNet Capable, T-Mobile, US Cellular, Verizon; Canada'],
          ['Emissions / Immunity', 'FCC Part 15, Subpart B, Class B; CE, RCM; CAN ICES-3(B)/NMB-3(B)']
        ]
      },
      {
        title: 'Warranty***',
        rows: [
          ['Product Warranty', '1-year']
        ]
      }
    ]
  },
  'Digi EX15 Cellular Extender': {
    subtitle: 'Digi EX15 with Digi 360*',
    sourceUrl: 'https://www.digi.com/products/networking/cellular-routers/enterprise/digi-ex15#specifications',
    sections: [
      {
        title: 'Cellular Connectivity**',
        rows: [
          ['Certifications', 'Visit product certifications for latest certifications and updates'],
          ['Digi CORE Plug-in LTE Modems', 'LTE Cat 4 (Global): B1, B2, B3, B4, B5, B7, B8, B12, B13, B18, B19, B20, B25, B26, B28, B39, B40, B41; 3G: B1, B2, B4, B5, B6, B8, B19; 2G EDGE / GPRS: 850 / 900 / 1800 / 1900 MHz; transfer rate (max): 150 Mbps down, 50 Mbps up'],
          ['LTE-A Cat 7 (US)', 'B2, B4, B5, B7, B12, B13, B25, B26, B41, B42, B43, B48, B66, B71; WCDMA: B2, B5; transfer rate (max): 300 Mbps down, 150 Mbps up'],
          ['Connectors', '(2) 50 ohm SMA (center pin: female)'],
          ['SIM Slots', '(2) Mini-SIM (2FF); software selectable and hardware switchable'],
          ['eSIM Support', 'Digi eSIM optional 2FF accessory (EX15-XXG4-GLB)']
        ]
      },
      {
        title: 'Software and Management*',
        rows: [
          ['Remote Management', 'Digi Remote Manager; SNMP v3 (user installed/managed), encrypted SMS'],
          ['Local Management', 'WebUI (HTTP/HTTPS); CLI (SSH, serial port)'],
          ['Protocols', 'RIP, RIPng, OSPFv2, OSPFv3, BGP, Babel, IS-IS'],
          ['Management / Troubleshooting Tools', 'FTP client, SCP; protocol analyzer with PCAP for Wireshark; event logging with Syslog; NTP/SNTP'],
          ['Memory', '256 MB RAM, 512 MB flash']
        ]
      },
      {
        title: 'Ethernet',
        rows: [
          ['Ports', '(2) RJ-45; 10/100/1000 Mbps (auto-sensing)']
        ]
      },
      {
        title: 'Wi-Fi (Optional)',
        rows: [
          ['Connectivity', '2 x 2 MIMO 2.4/5 GHz: 802.11 b/g/n 2.4 GHz or 802.11 n/a/ac 5 GHz']
        ]
      },
      {
        title: 'Serial',
        rows: [
          ['Ports', '(1) RS-232 (RJ-45)']
        ]
      },
      {
        title: 'Physical',
        rows: [
          ['Dimensions (L x W x H)', '142 x 128 x 31 mm (5.6 x 5.0 x 1.2 in)'],
          ['Weight', '0.2 kg (7.0 oz)'],
          ['Status LEDs', 'LAN (link = solid, flashing = act), WAN (link = solid, flashing = act), LTE, 5 signal, SIM 1 and 2 LEDs'],
          ['Enclosure', 'Plastic']
        ]
      },
      {
        title: 'Power Requirements',
        rows: [
          ['Power Input', '18 VDC, 1 A, reverse polarity protection'],
          ['Included Accessories', 'Includes PSU, antennas*** and remote mounting kit: passive PoE injector, mounting bracket and accessories']
        ]
      },
      {
        title: 'Environmental',
        rows: [
          ['Operating Temperature', '0 C to 40 C (32 F to 104 F)'],
          ['Relative Humidity', '5% to 95% (non-condensing)']
        ]
      },
      {
        title: 'Approvals*',
        rows: [
          ['Cellular', 'PTCRB; US: AT&T, T-Mobile, Verizon; Canada; Europe'],
          ['Emissions / Immunity', 'FCC Part 15, Subpart B, Class A; CE, RCM; CAN ICES-3(B)/NMB-3(B)']
        ]
      },
      {
        title: 'Warranty***',
        rows: [
          ['Product Warranty', '1-year']
        ]
      },
      {
        title: 'Notes',
        rows: [
          ['*', 'Includes the Digi 360 solution for Digi EX15 (1-year) with Digi Remote Manager, warranty and customer care.'],
          ['**', 'Visit product certifications for latest approvals and updates.'],
          ['***', 'Product warranty can be extended with Digi 360 extensions or renewals.'],
          ['****', 'Digi EX15 models supporting LTE Cat 4 and LTE-Advanced Cat 7 require two cellular antennas.']
        ]
      }
    ]
  },
  'Digi EX50 5G Cellular Extender': {
    subtitle: 'Digi EX50 5G with Digi 360*',
    sourceUrl: 'https://www.digi.com/products/networking/cellular-routers/enterprise/digi-ex50#specifications',
    sections: [
      {
        title: 'Cellular Connectivity**',
        rows: [
          ['5G NR', 'Bands: n1, n2, n3, n5, n7, n8, n12, n20, n25, n28, n38, n40, n41, n48 CBRS, n66, n71, n77 C-band, n78, n79'],
          ['4G LTE-Advanced Pro', 'Bands: B1, B2, B3, B4, B5, B7, B8, B12, B13, B14 FirstNet, B17, B18, B19, B20, B25, B26, B28, B29, B30, B32, B34, B38, B39, B40, B41, B42, B43, B46 LAA, B48 CBRS, B66, B71'],
          ['3G HSPA+', 'Bands: B1, B2, B4, B5, B6, B8, B9, B19'],
          ['Antenna Connectors', '(4) 50 ohm SMA (center pin: female)'],
          ['SIM Slots', '(2) Mini-SIM (2FF); software selectable, hardware switchable; SIM slot cover plate']
        ]
      },
      {
        title: 'Software and Management*',
        rows: [
          ['Software', 'Digi Accelerated Linux (DAL OS); secure, reliable, intelligent, customizable'],
          ['Remote Management', 'Digi Remote Manager; security, management, updates, alerts, scheduling and intelligence'],
          ['Local Management', 'Web Interface (HTTPS); Command Line Interface (SSH, serial port)']
        ]
      },
      {
        title: 'Performance',
        rows: [
          ['Ethernet Throughput', '2.5 Gbps'],
          ['Cellular Throughput', '1.4 Gbps'],
          ['IPsec VPN Throughput', '500 Mbps'],
          ['VPN Tunnels', '10 tunnels'],
          ['Client Count', '256 clients (typical)']
        ]
      },
      {
        title: 'Processor',
        rows: [
          ['Application Processor', 'ARM Cortex-A53, 1.8 GHz, quad-core, 64-bit'],
          ['Memory', '512 MB RAM, 512 MB flash']
        ]
      },
      {
        title: 'Ethernet',
        rows: [
          ['Ports', '(2) RJ-45; 10/100/1000/2500 Mbps (auto-sensing)']
        ]
      },
      {
        title: 'Wi-Fi',
        rows: [
          ['Radios', 'Wi-Fi 6 / 802.11ax, enterprise-grade, dual-band simultaneous, 2x2 MIMO; 2.4 GHz: 802.11b/g/n/ax; 2.4 GHz and 5 GHz: 802.11a/n/ac/ax'],
          ['Antennas', 'Integrated 2x2 MIMO, 2.4 with 8 dBi gain, 5 GHz with 5 dBi gain'],
          ['Security', 'Open, Enhanced Open, WPA, WPA2, WPA3; Personal, Enterprise'],
          ['Modes', '(4) Wi-Fi access points; (2) Wi-Fi clients; (256) Wi-Fi users (typical)']
        ]
      },
      {
        title: 'Serial',
        rows: [
          ['Ports', '(1) RS-232 (RJ-45); Cisco straight-through pinout; for out-of-band management of network appliances and servers']
        ]
      },
      {
        title: 'Physical',
        rows: [
          ['Dimensions (L x W x H)', '158 mm x 158 mm x 35 mm (6.2 in x 6.2 in x 1.4 in)'],
          ['Weight', '600 g (21 oz)'],
          ['Status LEDs', '(14) total for easy visual troubleshooting; Power, LAN, WAN, Wi-Fi 2.4/5, Online, Cellular Signal, Cellular Service, SIM 1/2'],
          ['Enclosure', 'Hybrid (die-cast aluminum + ABS plastic); Kensington Security Slot']
        ]
      },
      {
        title: 'Power Requirements',
        rows: [
          ['DC Barrel Input', '19 VDC / 2.5 A barrel connector, 2.5 mm pin, center-positive'],
          ['Power over Ethernet', 'Standards-based, IEEE 802.3at, PoE+ (25.5 W)'],
          ['Power Consumption', '8 W (idle), 15 W (typical), 25 W (maximum)']
        ]
      },
      {
        title: 'Environmental',
        rows: [
          ['Operating Temperature', '-30 C to 60 C (-22 F to 140 F) with Power over Ethernet or industrial-rated power supply; 0 C to 40 C (32 F to 104 F) with included commercial-rated power supply'],
          ['Relative Humidity', '5% to 95% (non-condensing)']
        ]
      },
      {
        title: 'Approvals**',
        rows: [
          ['Cellular', 'Visit product certifications for latest approvals and updates'],
          ['Emissions / Immunity', 'CE; RED; FCC Part 15 Subpart B; CAN ICES-003'],
          ['Safety', 'IEC62368-1, CB, EN62311']
        ]
      },
      {
        title: 'Warranty***',
        rows: [
          ['Product Warranty', '1-year']
        ]
      },
      {
        title: 'Notes',
        rows: [
          ['*', 'Includes the Digi 360 solution for Digi EX50 (1-year) with Digi Remote Manager, warranty and customer care.'],
          ['**', 'Visit product certifications for latest approvals and updates.'],
          ['***', 'Product warranty can be extended with Digi 360 extensions or renewals.']
        ]
      }
    ]
  },
  'Digi CORE plug-in LTE modem': {
    subtitle: 'Digi CORE Plug-in LTE Modem',
    sourceUrl: 'https://www.digi.com/products/networking/cellular-routers/enterprise/digi-core-plug-in-lte-modem#specifications',
    sections: [
      {
        title: 'Software',
        rows: [
          ['Remote Management', 'Digi Remote Manager'],
          ['Protocols', 'USB 2.0 / 3.0 (CM module interface), UMTS, EVDO, HSPA+, LTE, LTE-A, LTE-A Pro (supported cellular protocols vary by module type)'],
          ['Security', 'Tamper-proof with internal SIM slots and optional locking mechanism']
        ]
      },
      {
        title: 'Physical',
        rows: [
          ['Dimensions (L x W x H)', '102 mm x 51 mm x 15 mm (4.0 in x 2.0 in x 0.6 in)'],
          ['Weight', '0.156 kg (5.5 oz)']
        ]
      },
      {
        title: 'Environmental',
        rows: [
          ['Operating Temperature', 'Commercial temperature: 0 C to 40 C (32 F to 104 F); industrial temperature: -40 C to 70 C (-40 F to 158 F)'],
          ['Storage Temp and Humidity', '-45 C to 75 C (-49 F to 167 F); 5% to 95% non-condensing']
        ]
      },
      {
        title: 'Approvals',
        rows: [
          ['Emissions / Immunity', 'FCC Part 15, Subpart B, Class A; CE, RCM; CAN ICES-3(B)/NMB-3(B)']
        ]
      },
      {
        title: 'Cellular Specifications',
        rows: [
          ['Cellular Antenna', '(1, 2, 3 or 4) Dipole; frequency: 700-960/1575-2700 Hz; gain: 1-4 dBi'],
          ['SIM', '(2) SIM card slot (size 2FF), software selectable and hardware switchable'],
          ['eSIM Support', 'Digi eSIM optional 2FF accessory (1002-CMG4-GLB)']
        ]
      },
      {
        title: 'Digi CORE Plug-in LTE Modem*',
        rows: [
          ['Digi CORE 1002-CMM1 (North America)', 'LTE Cat M1 / NB1; LTE Bands: B1, B2, B3, B4, B5, B8, B12, B13, B18, B19, B20, B26, B28; 2G (EGPRS): 850 / 900 / 1800 / 1900 MHz; transfer rate (max): M1: 300 kbps down, 375 kbps up; NB1: 21 kbps down, 62.5 kbps up; 2G: 296 kbps down, 236 kbps up; industrial temperature'],
          ['Digi CORE 1002-CMF4 (North America)', 'LTE Cat 4; LTE Bands: B2, B4, B5, B12, B13, B14 FirstNet, B66, B71; 3G: B2, B4, B5; transfer rate (max): 150 Mbps down, 50 Mbps up; industrial temperature'],
          ['Digi CORE 1002-CMG4 (Global)', 'LTE Cat 4; LTE Bands: B1, B2, B3, B4, B5, B7, B8, B12, B13, B18, B19, B20, B25, B26, B28, B39, B40, B41; 3G: B1, B2, B4, B5, B6, B8, B19; 2G EDGE / GPRS: 850 / 900 / 1800 / 1900 MHz; transfer rate (max): 150 Mbps down, 50 Mbps up; industrial temperature'],
          ['Digi CORE 1002-CMG4-G (EMEA)', 'LTE Cat 4; LTE Bands: B1, B2, B3, B4, B5, B7, B8, B12, B13, B18, B19, B20, B25, B26, B28, B39, B40, B41; 3G: B1, B2, B4, B5, B6, B8, B19; 2G EDGE / GPRS: 850 / 900 / 1800 / 1900 MHz; transfer rate (max): 150 Mbps down, 50 Mbps up; industrial temperature'],
          ['Digi CORE 1002-CM45 (EMEA)', 'LTE Cat 4; LTE Bands: B3, B7, B20, B31, B72; 450 MHz support; transfer rate (max): 150 Mbps down, 50 Mbps up; industrial temperature'],
          ['Digi CORE 1003-CM07 (North America)', 'LTE-Advanced Cat 7; LTE Bands: B2, B4, B5, B7, B12, B13, B14 FirstNet, B25, B26, B41, B42, B43, B48, B66, B71; 3G: B2, B5; transfer rate (max): 300 Mbps down, 150 Mbps up; industrial temperature']
        ]
      },
      {
        title: 'Digi CORE Plug-in LTE Modem with GNSS Support*',
        rows: [
          ['Digi CORE 1003-CM07 (North America) and Digi CORE 1002-CMG4-G (EMEA)', 'GPS, GLONASS, BeiDou, Galileo, QZSS; connector: 50 ohm SMA (center pin: female); protocol NMEA 0183 V3.0; acquisition time hot start 1 s, warm start 29 s, cold start 32 s; accuracy horizontal: < 2 m (50%), < 5 m (90%); altitude: < 4 m (50%), < 8 m (90%); velocity: < 0.2 m/s']
        ]
      },
      {
        title: 'Notes',
        rows: [
          ['*', 'Please reference router/chassis datasheets for Digi CORE plug-in LTE modem compatibility. Transfer rates are network operator dependent.']
        ]
      }
    ]
  }
};
const DOCS_PORTAL_BASE_URL = 'https://docsportal.digi.com';
const PRODUCT_DOCS_URLS = {
  '2 Plus': 'https://docs.digi.com/resources/documentation/digidocs/90002383/default.htm',
  '8 Plus': 'https://docs.digi.com/resources/documentation/digidocs/90002383/default.htm',
  '24 Plus': 'https://docs.digi.com/resources/documentation/digidocs/90002383/default.htm',
  'EZ WS': 'https://docs.digi.com/resources/documentation/digidocs/90002607/default.htm',
  'EZ TS': 'https://docs.digi.com/resources/documentation/digidocs/90002646/default.htm',
  'EZ Mini': 'https://docs.digi.com/resources/documentation/digidocs/90002409/default.htm',
  'EZ 2': 'https://docs.digi.com/resources/documentation/digidocs/90002458/default.htm',
  'EZ 4': 'https://docs.digi.com/resources/documentation/digidocs/90002459/default.htm',
  'EZ 4i': 'https://docs.digi.com/resources/documentation/digidocs/90002459/default.htm',
  'ConnectPort TS': 'https://docs.digi.com/resources/documentation/digidocs/90000630/default.htm',
  'Digi One': 'https://docs.digi.com/resources/documentation/digidocs/90000630/default.htm',
  'PortServer TS': 'https://docs.digi.com/resources/documentation/digidocs/90000630/default.htm'
};

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

const LEGACY_SUPPORT_TEMPLATE_IDS = new Set([
  'connectivity-troubleshooting',
  'firmware-upgrade',
  'remote-access',
  'case-follow-up'
]);
const DEFAULT_CASE_NOTE_TEMPLATE_ID = 'support-template-default-note';
const CASE_NOTE_TEMPLATE_MODE = 'case-note';
const DEFAULT_CASE_NOTE_TITLE = 'Untitled note';
const CASE_NOTE_FIELDS = [
  {
    key: 'caseNumber',
    label: 'Case Number',
    scratchKey: 'case',
    placeholder: 'Case #'
  },
  {
    key: 'serialNumber',
    label: 'SN',
    scratchKey: 'sn',
    placeholder: 'Serial number'
  },
  {
    key: 'product',
    label: 'Product',
    scratchKey: 'product',
    placeholder: 'Device model'
  },
  {
    key: 'firmware',
    label: 'Firmware',
    scratchKey: 'firmware',
    placeholder: 'Firmware version'
  },
  {
    key: 'deviceId',
    label: 'ID',
    scratchKey: 'id',
    placeholder: 'Device ID'
  },
  {
    key: 'mainError',
    label: 'Main Error',
    scratchKey: 'error',
    placeholder: 'Primary symptom or error',
    multiline: true,
    rows: 2
  },
  {
    key: 'notes',
    label: 'Notes',
    scratchKey: 'notes',
    placeholder: 'Troubleshooting notes',
    multiline: true,
    rows: 3
  }
];

const FILE_SUPPORT_QUICK_SEARCHES = [
  'config_dump',
  'config_json',
  'mmcli',
  'ip_route',
  'ip_addr',
  'runt_j'
];

let productLines = [];
let productSearchQuery = '';
let lastActiveLineByCategory = {};
let supportTemplates = [];
let templateDrafts = [];
let activeLineId = '';
let activeTemplateId = '';
let templateSearchQuery = '';
let showTemplateCreatePanel = false;
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
const sshSessions = new Map(); // clientId -> Session
// Per-session transcript is kept in memory only, bounded like the archive caps.
const SSH_TRANSCRIPT_MAX = 4 * 1024 * 1024;
let activeSshClientId = null;
let sshPendingItem = null;
let sshClientCounter = 0;
let sshResizeObserver = null;
let removeSSHDataListener = null;
let removeSSHCloseListener = null;
let removeSSHErrorListener = null;
let sshEventListenersRegistered = false;
let sshPasswordSaveTimer = null;
let sshFontSize = 13;

const SSH_QUICK_SCRIPTS = [
  {
    label: "IPs",
    title: "Mostrar IPs IPv4 del dispositivo",
    cmd: "ip -4 -o addr show | awk '!/127\\.0\\.0\\.1/ {split($4,a,\"/\"); print $2\": \"a[1]}'"
  },
  {
    label: "Routes",
    title: "Mostrar tabla de rutas",
    cmd: "ip route show"
  },
  {
    label: "Ports",
    title: "Mostrar puertos en escucha",
    cmd: "netstat -tulpn"
  },
  {
    label: "CLI",
    title: "Abrir Digi CLI",
    cmd: "cli"
  },
  {
    label: "Exit",
    title: "Cerrar sesión",
    cmd: "exit"
  },
];
let supportFileState = {
  sessionId: '',
  fileName: '',
  tree: [],
  stats: null,
  selectedFileId: '',
  selectedPath: '',
  selectedContent: '',
  selectedError: '',
  selectedTruncated: false,
  selectedLoading: false,
  summary: null,
  summaryVisible: false,
  savedFile: null,
  importError: '',
  importing: false
};
let supportSavedFilesState = {
  visible: false,
  loading: false,
  openingId: '',
  savingId: '',
  deletingId: '',
  files: [],
  selectedId: '',
  search: '',
  error: ''
};
let supportSmartScanState = {
  query: '',
  visible: false,
  loading: false,
  answer: '',
  error: '',
  sources: [],
  resultQuery: '',
  resultProvider: '',
  resultSelectedPath: '',
  completedAt: ''
};
function createEmptyCompareSide() {
  return { sessionId: '', fileName: '', source: '', loading: false, error: '' };
}
function createEmptyCompareSelection() {
  return {
    loading: false,
    error: '',
    status: '',
    path: '',
    pathA: '',
    pathB: '',
    binary: false,
    note: '',
    rows: [],
    previewRows: [],
    tooLarge: false,
    addedCount: 0,
    removedCount: 0
  };
}
function createEmptyCompareContentSearch(overrides = {}) {
  return {
    active: false,
    query: '',
    loading: false,
    error: '',
    results: null,
    ...overrides
  };
}
let supportCompareState = {
  a: createEmptyCompareSide(),
  b: createEmptyCompareSide(),
  manifest: null,
  sameFile: false,
  comparing: false,
  compareError: '',
  categoryFilter: 'all',
  showIdentical: false,
  pathFilter: '',
  selectedPath: '',
  selected: createEmptyCompareSelection(),
  contentSearch: createEmptyCompareContentSearch(),
  diffSearch: { query: '', grep: false, ignoreCase: false, cut: false },
  savedFiles: []
};
let supportCompareFullscreen = false;
let compareContentSearchDebounce = null;
let compareContentSearchToken = 0;
let supportFileTreeWidth = getSavedSupportTreeWidth();
let supportTreeSearchQuery = '';
let supportContentSearchQuery = '';
let supportFileViewerFullscreen = false;
let supportContentViewMode = 'ruby';
let supportGrepEnabled = false;
let supportGrepIgnoreCase = false;
let supportGrepCutMatches = false;
let expandedSupportFolders = new Set();
let supportAdvancedSearch = {
  active: false,
  query: '',
  grepEnabled: false,
  ignoreCase: false,
  cut: false,
  fileFilters: new Set(),
  scope: 'all',
  loading: false,
  error: '',
  results: null,
  viewingResult: false
};
let supportAdvancedSearchToken = 0;
let supportAdvancedSearchDebounce = null;
let supportAdvancedResultClickTimer = null;

const portStatuses = new Map();
const hostStatuses = new Map();
const itemOnlineStates = new Map();
const pendingPortChecks = new Set();
const pendingHostChecks = new Set();

document.addEventListener('DOMContentLoaded', () => {
  applyThemeStylesheet(getThemeStylesheet());
  initializeProductLines();
  setupProductImageModal();
  setupProductSpecsModal();
  setupSSHTerminalModal();
  setupItemConfigModal();
  setupSettingsModal();
  setupDeviceDetailModal();
  setupSavedSupportFilesModal();
  setupFileSupportShortcutsModal();
  setupConfigTransferControls();
  setupFileSupportKeyboardShortcuts();
  setupTabCycleShortcut();
  setupInfoScratchpad();
  setupAppZoomControls();
});

function setupAppZoomControls() {
  const controls = document.getElementById('app-zoom-controls');
  const zoomOutButton = document.getElementById('app-zoom-out');
  const zoomInButton = document.getElementById('app-zoom-in');
  const appAPI = getNetworkAPI();

  if (!controls || !zoomOutButton || !zoomInButton) return;
  if (!appAPI || typeof appAPI.changeAppZoom !== 'function') {
    zoomOutButton.disabled = true;
    zoomInButton.disabled = true;
    controls.title = 'Zoom is available in the desktop app';
    return;
  }

  const changeZoom = async (direction) => {
    const result = await appAPI.changeAppZoom(direction);
    if (!result?.success) return;
    controls.title = `Application zoom: ${result.zoomPercent}%`;
    controls.setAttribute('aria-label', `Application zoom: ${result.zoomPercent}%`);
  };

  zoomOutButton.addEventListener('click', () => changeZoom(-1));
  zoomInButton.addEventListener('click', () => changeZoom(1));

  document.addEventListener('keydown', (event) => {
    if (!(event.metaKey || event.ctrlKey) || event.altKey) return;
    if (event.key === '-' || event.key === '_') {
      event.preventDefault();
      changeZoom(-1);
    } else if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      changeZoom(1);
    }
  });
}

// Quick-reference bar under the tabs: manually filled ID / SN / MAC / Case /
// Notes fields that persist locally and can be copied with one click. Handy
// while investigating a product or case so the values stay reachable.
const SCRATCHPAD_STORAGE_KEY = 'info_scratchpad';
const SCRATCHPAD_COLLAPSE_KEY = 'info_scratchpad_collapsed';

function readScratchpadData() {
  try {
    return JSON.parse(localStorage.getItem(SCRATCHPAD_STORAGE_KEY)) || {};
  } catch (error) {
    return {};
  }
}

function writeScratchpadData(data) {
  localStorage.setItem(SCRATCHPAD_STORAGE_KEY, JSON.stringify(data || {}));
}

function getScratchpadFields() {
  const bar = document.getElementById('info-scratchpad');
  return bar ? Array.from(bar.querySelectorAll('.scratch-field')) : [];
}

function collectScratchpadDataFromDom() {
  const data = readScratchpadData();
  getScratchpadFields().forEach((field) => {
    const input = field.querySelector('.scratch-input');
    if (input) {
      data[field.dataset.key] = input.value;
    }
  });
  return data;
}

function updateScratchpadValues(values) {
  const data = collectScratchpadDataFromDom();
  Object.entries(values || {}).forEach(([key, value]) => {
    const normalizedValue = String(value || '');
    data[key] = normalizedValue;
    const field = getScratchpadFields().find(candidate => candidate.dataset.key === key);
    const input = field?.querySelector('.scratch-input');
    if (input && input.value !== normalizedValue) {
      input.value = normalizedValue;
    }
  });
  writeScratchpadData(data);
}

function syncScratchpadFromCaseNoteFields(fields) {
  const normalized = normalizeCaseNoteFields(fields);
  updateScratchpadValues(
    CASE_NOTE_FIELDS.reduce((values, field) => {
      if (field.scratchKey) {
        values[field.scratchKey] = normalized[field.key];
      }
      return values;
    }, {})
  );
}

function setupInfoScratchpad() {
  const bar = document.getElementById('info-scratchpad');
  if (!bar) return;

  // Pin the bar flush below the sticky topbar by tracking its live height.
  const topbar = document.querySelector('.product-topbar');
  if (topbar) {
    const syncTopOffset = () => {
      document.documentElement.style.setProperty('--topbar-h', `${topbar.offsetHeight}px`);
    };
    syncTopOffset();
    window.addEventListener('resize', syncTopOffset);
    if (typeof ResizeObserver === 'function') {
      new ResizeObserver(syncTopOffset).observe(topbar);
    }
  }

  const fields = Array.from(bar.querySelectorAll('.scratch-field'));

  const stored = readScratchpadData();

  const persist = () => {
    writeScratchpadData(collectScratchpadDataFromDom());
  };

  fields.forEach((field) => {
    const key = field.dataset.key;
    const input = field.querySelector('.scratch-input');
    const copyBtn = field.querySelector('.scratch-copy');
    const label = field.querySelector('.scratch-label').textContent;

    if (typeof stored[key] === 'string') input.value = stored[key];

    input.addEventListener('input', persist);

    copyBtn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const value = input.value.trim();
      if (!value) {
        showNotification(`${label} is empty`);
        return;
      }
      copyDeviceValue(value, label);
    });
  });

  const clearBtn = document.getElementById('info-scratchpad-clear');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      fields.forEach((field) => {
        field.querySelector('.scratch-input').value = '';
      });
      persist();
      showNotification('Scratchpad cleared');
    });
  }

  const toggleBtn = document.getElementById('info-scratchpad-toggle');
  if (toggleBtn) {
    const applyCollapsed = (collapsed) => {
      bar.classList.toggle('is-collapsed', collapsed);
      toggleBtn.setAttribute('aria-expanded', String(!collapsed));
    };
    applyCollapsed(localStorage.getItem(SCRATCHPAD_COLLAPSE_KEY) === '1');
    toggleBtn.addEventListener('click', () => {
      const collapsed = !bar.classList.contains('is-collapsed');
      applyCollapsed(collapsed);
      localStorage.setItem(SCRATCHPAD_COLLAPSE_KEY, collapsed ? '1' : '0');
    });
  }
}

function setupTabCycleShortcut() {
  document.addEventListener('keydown', (event) => {
    if (!event.ctrlKey || event.key !== 'Tab') return;
    event.preventDefault();

    const tabsEl = document.getElementById('product-tabs');
    if (!tabsEl) return;
    const buttons = Array.from(tabsEl.querySelectorAll('.tab-button'));
    if (buttons.length < 2) return;

    const currentIndex = buttons.findIndex(b => b.classList.contains('active'));
    const delta = event.shiftKey ? -1 : 1;
    const nextIndex = (currentIndex + delta + buttons.length) % buttons.length;
    buttons[nextIndex].click();
  });

  document.addEventListener('keydown', (event) => {
    if (!(event.altKey || event.metaKey)) return;
    const num = parseInt(event.key, 10);
    if (isNaN(num) || num < 1) return;

    const tabsEl = document.getElementById('product-tabs');
    if (!tabsEl) return;
    const buttons = Array.from(tabsEl.querySelectorAll('.tab-button'));
    const target = buttons[num - 1];
    if (!target) return;

    // Don't block native Cmd+1..9 browser/app shortcuts unless a tab exists
    event.preventDefault();
    target.click();
  });
}

window.addEventListener('beforeunload', () => {
  if (portPollTimer) {
    clearInterval(portPollTimer);
  }
  const networkAPI = getNetworkAPI();
  if (networkAPI && typeof networkAPI.sshDisconnect === 'function') {
    for (const session of sshSessions.values()) {
      if (session.sessionId) {
        networkAPI.sshDisconnect(session.sessionId);
      }
    }
  }
});

function getNetworkAPI() {
  return window.appAPI || null;
}

function resolveImageAssetUrl(imageUrl) {
  const value = String(imageUrl || '');
  if (!value.startsWith('img/')) return value;
  const separator = value.includes('?') ? '&' : '?';
  return `${value}${separator}v=${LOCAL_IMAGE_ASSET_VERSION}`;
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
  const name = getNextItemName(line);
  return {
    id: createItemId(),
    name,
    defaultName: name,
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
    defaultName: name,
    ip: DEFAULT_ITEM_IPS[name] || '',
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

function getCategoryForLine(line) {
  const lineKey = getLineKey(line);
  return PRODUCT_CATEGORIES.find(category => category.lineKeys.includes(lineKey)) || null;
}

function getLineDisplayName(line) {
  return line?.name === USB_MY_OWN_DEVICES_LINE_NAME
    ? MY_OWN_DEVICES_LINE_NAME
    : line?.name || '';
}

function getActiveProductCategory() {
  if (activeLineId === CELLULAR_ALL_VIEW_ID) {
    return PRODUCT_CATEGORIES.find(category => category.id === 'cellular') || null;
  }
  return getCategoryForLine(getActiveLine());
}

function getCategoryLines(category) {
  if (!category) return [];
  return category.lineKeys
    .map(lineKey => productLines.find(line => getLineKey(line) === lineKey))
    .filter(Boolean);
}

function getAllCatalogEntries() {
  return productLines.flatMap(line => (line.items || []).map(item => ({ line, item })));
}

function matchesProductSearch(entry, query) {
  const haystack = [
    entry.item.name,
    entry.item.defaultName,
    entry.item.ip,
    entry.line.name,
    getLineDisplayName(entry.line)
  ].filter(Boolean).join(' ').toLowerCase();
  return query.split(/\s+/).every(term => haystack.includes(term));
}

function getProductSearchEntries() {
  const query = productSearchQuery.trim().toLowerCase();
  if (!query) return [];
  return getAllCatalogEntries().filter(entry => matchesProductSearch(entry, query));
}

function getProductSearchTitle(count) {
  return `Search results for “${productSearchQuery.trim()}” (${count})`;
}

// Entries shown for the current view when no search is active.
function getActiveViewEntries() {
  if (activeLineId === CELLULAR_ALL_VIEW_ID) {
    const cellularCategory = PRODUCT_CATEGORIES.find(category => category.id === 'cellular');
    const cellularLines = getCategoryLines(cellularCategory)
      .filter(line => CELLULAR_CATALOG_LINE_KEYS.includes(getLineKey(line)));
    return {
      title: 'All Cellular Devices',
      entries: cellularLines.flatMap(line => line.items.map(item => ({ line, item })))
    };
  }
  const line = getActiveLine();
  if (!line) return { title: '', entries: [] };
  return {
    title: getLineDisplayName(line),
    entries: line.items.map(item => ({ line, item }))
  };
}

function createProductSearchInput() {
  const form = document.createElement('form');
  form.className = 'product-search';
  form.setAttribute('role', 'search');
  form.addEventListener('submit', event => event.preventDefault());

  const input = document.createElement('input');
  input.type = 'search';
  input.id = 'product-search-input';
  input.className = 'product-search-input';
  input.placeholder = 'Search catalog…';
  input.autocomplete = 'off';
  input.setAttribute('aria-label', 'Search products in catalog');
  input.value = productSearchQuery;
  input.addEventListener('input', () => {
    productSearchQuery = input.value;
    applyProductSearch();
  });

  form.appendChild(input);
  return form;
}

// Updates the product grid + header in place (without rebuilding the nav)
// so the search input keeps focus while typing.
function applyProductSearch() {
  const grid = document.getElementById('product-grid');
  const title = document.getElementById('product-line-header-title');
  if (!grid) return;

  const query = productSearchQuery.trim();
  let titleText;
  let entries;

  if (query) {
    entries = getProductSearchEntries();
    titleText = getProductSearchTitle(entries.length);
  } else {
    const view = getActiveViewEntries();
    titleText = view.title;
    entries = view.entries;
  }

  if (title) title.textContent = titleText;

  grid.innerHTML = '';
  grid.classList.toggle('empty', entries.length === 0);
  if (entries.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'monitor-placeholder-card';
    const heading = document.createElement('h3');
    heading.textContent = query ? `No products match “${query}”` : 'No products yet';
    emptyState.appendChild(heading);
    grid.appendChild(emptyState);
  } else {
    entries.forEach(({ line, item }) => grid.appendChild(createProductCard(item, line)));
  }

  cleanupPortStatuses();
}

function isLineLockedForManualItems(line) {
  return Object.prototype.hasOwnProperty.call(LOCKED_LINE_ITEMS, getLineKey(line));
}

function getDefaultItemsForLine(line) {
  const lockedItems = LOCKED_LINE_ITEMS[getLineKey(line)];
  if (lockedItems) {
    return lockedItems.map(itemName => createNamedProductItem(itemName));
  }
  if ([MY_OWN_DEVICES_LINE_NAME, USB_MY_OWN_DEVICES_LINE_NAME]
    .map(name => name.toUpperCase())
    .includes(getLineKey(line))) {
    return Array.from({ length: 4 }, (_, index) => createNamedProductItem(`VM ${index + 1}`));
  }
  return [createProductItem(line)];
}

function getProductImages(item) {
  const variants = LOCKED_ITEM_IMAGE_VARIANTS[item?.defaultName || item?.name];
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
  const productDocsUrl = PRODUCT_DOCS_URLS[itemName];
  const guideSlug = getDocsGuideSlug(itemName);
  const guideUrl = productDocsUrl || (guideSlug
    ? `${DOCS_PORTAL_BASE_URL}/${guideSlug}/Default.htm`
    : '');
  if (!guideUrl) return '';

  const trimmedSearchTerm = String(searchTerm || '').trim();
  const searchHash = trimmedSearchTerm
    ? `#search-${encodeURIComponent(trimmedSearchTerm)}`
    : '#search-';

  return `${guideUrl}${searchHash}`;
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
  const defaultName = item?.defaultName || fallbackName;

  return {
    id: fallbackId,
    name: fallbackName,
    defaultName,
    ip: item?.ip || DEFAULT_ITEM_IPS[defaultName] || '',
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

function createEmptyCaseNoteFields() {
  return CASE_NOTE_FIELDS.reduce((fields, field) => {
    fields[field.key] = '';
    return fields;
  }, {});
}

function extractMarkdownLabelValue(markdown, labels) {
  const lines = String(markdown || '').split(/\r?\n/);
  const normalizedLabels = labels.map(label => String(label).toLowerCase());

  for (const line of lines) {
    const cleanedLine = line
      .replace(/^\s*(?:[-*]\s*)?/, '')
      .replace(/^\*\*/, '')
      .replace(/\*\*\s*:\s*/, ': ')
      .replace(/:\s*\*\*/, ': ')
      .trim();
    const separatorIndex = cleanedLine.indexOf(':');
    if (separatorIndex < 0) continue;
    const label = cleanedLine.slice(0, separatorIndex).replace(/\*\*/g, '').trim().toLowerCase();
    if (normalizedLabels.includes(label)) {
      return cleanedLine.slice(separatorIndex + 1).replace(/\*\*/g, '').trim();
    }
  }

  return '';
}

function extractMarkdownNotes(markdown) {
  const match = String(markdown || '').match(/^##\s+Notes\s*\n([\s\S]*?)(?=\n##\s+|$)/im);
  return match ? match[1].trim() : '';
}

function extractMarkdownRemainderNotes(markdown) {
  const knownLabels = new Set([
    'case',
    'case number',
    'device id',
    'error',
    'firmware',
    'firmware version',
    'id',
    'main error',
    'product',
    'serial',
    'serial number',
    'sn'
  ]);

  return String(markdown || '')
    .split(/\r?\n/)
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed || /^#{1,6}\s+(case note|support notes)\s*$/i.test(trimmed)) return false;

      const cleanedLine = line
        .replace(/^\s*(?:[-*]\s*)?/, '')
        .replace(/^\*\*/, '')
        .replace(/\*\*\s*:\s*/, ': ')
        .replace(/:\s*\*\*/, ': ')
        .trim();
      const separatorIndex = cleanedLine.indexOf(':');
      if (separatorIndex < 0) return true;

      const label = cleanedLine.slice(0, separatorIndex).replace(/\*\*/g, '').trim().toLowerCase();
      return !knownLabels.has(label);
    })
    .join('\n')
    .trim();
}

function normalizeCaseNoteFields(fields, body = '') {
  const source = fields && typeof fields === 'object' ? fields : {};
  const normalized = createEmptyCaseNoteFields();

  CASE_NOTE_FIELDS.forEach((field) => {
    if (typeof source[field.key] === 'string') {
      normalized[field.key] = source[field.key];
    }
  });

  if (!fields || typeof fields !== 'object') {
    normalized.caseNumber = extractMarkdownLabelValue(body, ['Case Number', 'Case']);
    normalized.serialNumber = extractMarkdownLabelValue(body, ['SN', 'Serial', 'Serial Number']);
    normalized.product = extractMarkdownLabelValue(body, ['Product']);
    normalized.firmware = extractMarkdownLabelValue(body, ['Firmware', 'Firmware Version']);
    normalized.deviceId = extractMarkdownLabelValue(body, ['ID', 'Device ID']);
    normalized.mainError = extractMarkdownLabelValue(body, ['Main Error', 'Error']);
    normalized.notes = extractMarkdownNotes(body) || extractMarkdownRemainderNotes(body);
  }

  return normalized;
}

function buildCaseNoteMarkdown(fields) {
  const normalized = normalizeCaseNoteFields(fields);
  const rows = [
    ['Case Number', normalized.caseNumber],
    ['SN', normalized.serialNumber],
    ['Product', normalized.product],
    ['Firmware', normalized.firmware],
    ['ID', normalized.deviceId],
    ['Main Error', normalized.mainError]
  ];

  return [
    '# Support Notes',
    '',
    ...rows.map(([label, value]) => `- **${label}:** ${value || ''}`),
    '',
    '## Notes',
    normalized.notes || ''
  ].join('\n');
}

function normalizeSupportTemplateMode(template) {
  if (template?.mode === CASE_NOTE_TEMPLATE_MODE) return CASE_NOTE_TEMPLATE_MODE;
  if (String(template?.id || '') === DEFAULT_CASE_NOTE_TEMPLATE_ID) return CASE_NOTE_TEMPLATE_MODE;
  return '';
}

function createCaseNoteTemplate(index = 0, options = {}) {
  const fields = normalizeCaseNoteFields(options.fields);
  const title = String(options.title || DEFAULT_CASE_NOTE_TITLE).trim() || DEFAULT_CASE_NOTE_TITLE;

  return {
    id: options.id || (index === 0 ? DEFAULT_CASE_NOTE_TEMPLATE_ID : createTemplateId(title, index)),
    title,
    body: buildCaseNoteMarkdown(fields),
    mode: CASE_NOTE_TEMPLATE_MODE,
    fields,
    hidden: false
  };
}

function isEmptyCaseNoteFields(fields) {
  const normalized = normalizeCaseNoteFields(fields);
  return CASE_NOTE_FIELDS.every((field) => String(normalized[field.key] || '').trim().length === 0);
}

function createManualCaseNoteTemplate() {
  return {
    ...createCaseNoteTemplate(supportTemplates.length + templateDrafts.length),
    sourceName: 'manual'
  };
}

function createManualPlainNote() {
  const index = supportTemplates.length + templateDrafts.length;
  const title = DEFAULT_CASE_NOTE_TITLE;
  return {
    id: createTemplateId(title, index),
    title,
    body: '',
    hidden: false,
    sourceName: 'manual'
  };
}

// Creates a free-form note (no Case fields panel, editable body).
function openBlankPlainNote() {
  const note = createManualPlainNote();
  supportTemplates.push(note);
  activeTemplateId = note.id;
  saveSupportTemplates();
  return note;
}

function openBlankCaseNote({ reuseEmpty = false } = {}) {
  if (reuseEmpty) {
    const emptyTemplate = supportTemplates.find((template) => (
      template.mode === CASE_NOTE_TEMPLATE_MODE
      && isEmptyCaseNoteFields(normalizeCaseNoteFields(template.fields, template.body))
    ));
    if (emptyTemplate) {
      activeTemplateId = emptyTemplate.id;
      return emptyTemplate;
    }
  }

  const note = createManualCaseNoteTemplate();
  supportTemplates.push(note);
  activeTemplateId = note.id;
  saveSupportTemplates();
  return note;
}

function getDefaultSupportTemplates() {
  return [createCaseNoteTemplate(0)];
}

function normalizeSupportTemplate(template, index) {
  const rawTitle = String(template?.title || template?.name || `Template ${index + 1}`).trim() || `Template ${index + 1}`;
  const rawBody = String(template?.body ?? template?.content ?? template?.text ?? '');
  const mode = normalizeSupportTemplateMode(template);
  const title = mode === CASE_NOTE_TEMPLATE_MODE && /^case note$/i.test(rawTitle)
    ? DEFAULT_CASE_NOTE_TITLE
    : rawTitle;
  const fields = mode === CASE_NOTE_TEMPLATE_MODE
    ? normalizeCaseNoteFields(template?.fields, rawBody)
    : null;

  const normalized = {
    id: String(template?.id || createTemplateId(title, index)),
    title,
    hidden: false
  };

  if (mode === CASE_NOTE_TEMPLATE_MODE) {
    normalized.mode = mode;
    normalized.fields = fields;
    normalized.body = buildCaseNoteMarkdown(fields);
  } else {
    normalized.body = rawBody;
  }

  if (template?.sourceName) {
    normalized.sourceName = String(template.sourceName);
  }

  return normalized;
}

function normalizeSupportTemplates(templates) {
  if (!Array.isArray(templates)) return [];

  return templates
    .filter(template => !LEGACY_SUPPORT_TEMPLATE_IDS.has(String(template?.id || '')))
    .map((template, index) => normalizeSupportTemplate(template, index));
}

function loadSupportTemplates() {
  try {
    const storedTemplates = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (storedTemplates) {
      const parsed = JSON.parse(storedTemplates);
      if (Array.isArray(parsed)) {
        supportTemplates = normalizeSupportTemplates(parsed);
        let changed = supportTemplates.length !== parsed.length;
        // One-time seed of the default case note for existing installs.
        if (supportTemplates.length === 0
          && localStorage.getItem(TEMPLATES_DEFAULT_SEEDED_KEY) !== 'true') {
          supportTemplates = getDefaultSupportTemplates();
          changed = true;
        }
        localStorage.setItem(TEMPLATES_DEFAULT_SEEDED_KEY, 'true');
        if (changed) {
          saveSupportTemplates();
        }
        return;
      }
    }
  } catch (error) {
    console.error('Error loading support templates:', error);
  }

  supportTemplates = getDefaultSupportTemplates();
  localStorage.setItem(TEMPLATES_DEFAULT_SEEDED_KEY, 'true');
  saveSupportTemplates();
}

function saveSupportTemplates() {
  try {
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(supportTemplates));
  } catch (error) {
    console.error('Error saving support templates:', error);
    showNotification('Could not save notes');
  }
}

function loadTemplateDrafts() {
  // Drafts are deprecated — everything autosaves now. Promote any leftover
  // session drafts to permanent notes, then clear the draft store.
  templateDrafts = [];
  try {
    const storedDrafts = sessionStorage.getItem(TEMPLATE_DRAFTS_STORAGE_KEY);
    if (storedDrafts) {
      const parsed = JSON.parse(storedDrafts);
      const promoted = normalizeSupportTemplates(parsed);
      if (promoted.length > 0) {
        supportTemplates.push(...promoted);
        saveSupportTemplates();
      }
    }
  } catch (error) {
    console.error('Error loading temporary templates:', error);
  }
  sessionStorage.removeItem(TEMPLATE_DRAFTS_STORAGE_KEY);
}

function saveTemplateDrafts() {
  try {
    sessionStorage.setItem(TEMPLATE_DRAFTS_STORAGE_KEY, JSON.stringify(templateDrafts));
  } catch (error) {
    console.error('Error saving temporary templates:', error);
  }
}

function templateMatchesSearch(template, query) {
  const normalizedQuery = String(query || '').trim().toLowerCase();
  if (!normalizedQuery) return true;

  const searchableText = [
    template?.title,
    template?.body,
    template?.sourceName
  ].join(' ').toLowerCase();

  return normalizedQuery
    .split(/\s+/)
    .every(term => searchableText.includes(term));
}

function createDefaultProductLines(legacyItems = []) {
  return REQUIRED_LINE_NAMES.map((name, index) => {
    const line = createProductLine(name, { items: [] });
    if (index === 0 && legacyItems.length > 0) {
      line.items = legacyItems.map((item, itemIndex) => normalizeProductItem(item, itemIndex, name));
    } else {
      line.items = getDefaultItemsForLine(line);
    }
    return line;
  });
}

function ensureRequiredProductLines() {
  const previousWrLine = productLines.find(line => getLineKey(line) === 'WR SERIES (LEGACY)');
  const currentWrLine = productLines.find(line => getLineKey(line) === 'WR (LEGACY)');
  if (previousWrLine && !currentWrLine) {
    previousWrLine.name = CELLULAR_LEGACY_LINE_NAME;
  }

  const existingKeys = new Set(productLines.map(getLineKey));
  REQUIRED_LINE_NAMES.forEach(name => {
    if (existingKeys.has(name.toUpperCase())) return;
    productLines.push(createProductLine(name));
    existingKeys.add(name.toUpperCase());
  });
}

function syncLockedLineItems() {
  productLines.forEach(line => {
    const lockedNames = LOCKED_LINE_ITEMS[getLineKey(line)];
    if (!lockedNames) return;

    const existingByName = new Map(
      (line.items || []).map(item => [item.defaultName || item.name, item])
    );
    line.items = lockedNames.map((name, index) => {
      let existingItem = existingByName.get(name);
      if (!existingItem && getLineKey(line) === 'EDGEPORT') {
        const legacyName = name.replace(/^Edgeport\s+/i, '');
        existingItem = existingByName.get(legacyName);
        if (existingItem) {
          const previousDefaultName = existingItem.defaultName || existingItem.name;
          if (existingItem.name === previousDefaultName) {
            existingItem.name = name;
          }
          existingItem.defaultName = name;
        }
      }
      if (!existingItem && getLineKey(line) === 'EZ') {
        const previousEzNames = {
          'EZ Mini': ['Digi Connect EZ Mini', 'EZ Mini/2/4'],
          'EZ 2': ['Digi Connect EZ 2'],
          'EZ 4': ['Digi Connect EZ 4'],
          'EZ 4i': ['Digi Connect EZ 4i']
        };
        existingItem = (previousEzNames[name] || [])
          .map(previousName => existingByName.get(previousName))
          .find(Boolean);
        if (existingItem) {
          const previousDefaultName = existingItem.defaultName || existingItem.name;
          if (existingItem.name === previousDefaultName) {
            existingItem.name = name;
          }
          existingItem.defaultName = name;
        }
      }
      const item = normalizeProductItem(existingItem || createNamedProductItem(name), index, line.name);
      item.imageUrl = LOCKED_ITEM_IMAGES[name] || item.imageUrl;
      if (!item.ip && DEFAULT_ITEM_IPS[name]) {
        item.ip = DEFAULT_ITEM_IPS[name];
      }
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
  loadSupportTemplates();
  loadTemplateDrafts();

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
  ensureRequiredProductLines();
  syncLockedLineItems();
  recalculateCounters();

  const savedActiveLineId = localStorage.getItem(ACTIVE_LINE_STORAGE_KEY);
  activeLineId = BUILT_IN_VIEW_IDS.has(savedActiveLineId)
    ? savedActiveLineId
    : (productLines.some(line => line.id === savedActiveLineId)
      ? savedActiveLineId
      : FILE_SUPPORT_VIEW_ID);

  saveProductLines();
  renderProductApp();
  startPortPolling();
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
  if (BUILT_IN_VIEW_IDS.has(activeLineId)) return null;
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
  const createBuiltInTabButton = (viewId, label) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tab-button';
    button.dataset.lineId = viewId;
    button.textContent = label;
    button.classList.toggle('active', activeLineId === viewId);
    button.addEventListener('click', () => {
      productSearchQuery = '';
      const wasInTemplatesView = activeLineId === TEMPLATES_VIEW_ID;
      activeLineId = viewId;
      if (viewId === TEMPLATES_VIEW_ID && !wasInTemplatesView) {
        activeTemplateId = '';
      }
      saveProductLines();
      renderProductApp();
    });
    tabs.appendChild(button);
  };

  createBuiltInTabButton(FILE_SUPPORT_VIEW_ID, 'File Support');
  createBuiltInTabButton(COMPARE_VIEW_ID, 'DIFF');
  createBuiltInTabButton(DEVICES_VIEW_ID, 'DRM');

  PRODUCT_CATEGORIES.forEach(category => {
    const categoryLines = getCategoryLines(category);
    if (categoryLines.length === 0) return;

    const activeCategory = getActiveProductCategory();
    if (activeCategory?.id === category.id) {
      lastActiveLineByCategory[category.id] = activeLineId;
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tab-button';
    button.dataset.categoryId = category.id;
    button.textContent = category.label;
    button.classList.toggle('active', activeCategory?.id === category.id);
    button.addEventListener('click', () => {
      productSearchQuery = '';
      if (category.id === 'cellular' && lastActiveLineByCategory[category.id] === CELLULAR_ALL_VIEW_ID) {
        activeLineId = CELLULAR_ALL_VIEW_ID;
        saveProductLines();
        renderProductApp();
        return;
      }
      const rememberedLine = categoryLines.find(line => line.id === lastActiveLineByCategory[category.id]);
      activeLineId = rememberedLine?.id || categoryLines[0].id;
      lastActiveLineByCategory[category.id] = activeLineId;
      saveProductLines();
      renderProductApp();
    });
    tabs.appendChild(button);
  });

  productLines.filter(line => !getCategoryForLine(line)).forEach(line => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tab-button';
    button.dataset.lineId = line.id;
    button.textContent = line.name;
    button.classList.toggle('active', line.id === activeLineId);
    button.addEventListener('click', () => {
      productSearchQuery = '';
      activeLineId = line.id;
      saveProductLines();
      renderProductApp();
    });
    tabs.appendChild(button);
  });

  createBuiltInTabButton(TEMPLATES_VIEW_ID, 'Notes');
}

function renderProductCategoryTabs(workspace, category) {
  if (!category) return;

  const nav = document.createElement('nav');
  nav.className = 'product-subtabs';
  nav.setAttribute('aria-label', `${category.label} product categories`);

  const label = document.createElement('span');
  label.className = 'product-subtabs-label';
  label.textContent = category.label;
  nav.appendChild(label);

  const appendSubtab = (labelText, viewId) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'product-subtab-button';
    button.textContent = labelText;
    button.classList.toggle('active', viewId === activeLineId);
    button.setAttribute('aria-pressed', String(viewId === activeLineId));
    button.addEventListener('click', () => {
      productSearchQuery = '';
      activeLineId = viewId;
      lastActiveLineByCategory[category.id] = viewId;
      saveProductLines();
      renderProductApp();
    });
    nav.appendChild(button);
  };

  if (category.id === 'cellular') {
    appendSubtab('All', CELLULAR_ALL_VIEW_ID);
  }

  getCategoryLines(category).forEach(line => {
    appendSubtab(getLineDisplayName(line), line.id);
  });

  const connectivityLinks = {
    cellular: { titleLabel: 'Cellular Routers', url: CELLULAR_ROUTERS_URL },
    usb: { titleLabel: 'USB Connectivity', url: USB_CONNECTIVITY_URL },
    serial: { titleLabel: 'Serial Connectivity', url: SERIAL_CONNECTIVITY_URL }
  };
  const connectivityLink = connectivityLinks[category.id];

  if (connectivityLink) {
    const linkGroup = document.createElement('div');
    linkGroup.className = 'product-category-links';

    linkGroup.appendChild(createProductSearchInput());

    const supportLink = document.createElement('a');
    supportLink.className = 'product-category-link';
    supportLink.href = INFRASTRUCTURE_SUPPORT_RESOURCE_URL;
    supportLink.target = '_blank';
    supportLink.rel = 'noopener noreferrer';
    supportLink.title = 'Open Digi Infrastructure Management support resources';
    supportLink.textContent = 'Support Resource ↗';

    linkGroup.appendChild(supportLink);
    nav.appendChild(linkGroup);
  }

  workspace.appendChild(nav);
}

function renderActiveLine() {
  const workspace = document.getElementById('product-workspace');
  if (!workspace) return;

  workspace.innerHTML = '';
  document.body.classList.remove('is-file-support-view');
  document.body.classList.remove('is-file-support-fullscreen');
  document.body.classList.remove('is-templates-view');
  document.body.classList.remove('is-devices-view');
  document.body.classList.remove('is-compare-view');
  document.body.classList.remove('is-compare-fullscreen');

  if (activeLineId !== DEVICES_VIEW_ID) {
    stopDevicesAutoRefresh();
  }

  if (activeLineId === TEMPLATES_VIEW_ID) {
    document.body.classList.add('is-templates-view');
    renderTemplatesView(workspace);
    return;
  }

  if (activeLineId === FILE_SUPPORT_VIEW_ID) {
    document.body.classList.add('is-file-support-view');
    document.body.classList.toggle('is-file-support-fullscreen', supportFileViewerFullscreen && Boolean(supportFileState.selectedFileId));
    renderFileSupportView(workspace);
    return;
  }

  if (activeLineId === COMPARE_VIEW_ID) {
    document.body.classList.add('is-compare-view');
    document.body.classList.toggle('is-compare-fullscreen', supportCompareFullscreen);
    renderCompareView(workspace);
    return;
  }

  if (activeLineId === DEVICES_VIEW_ID) {
    document.body.classList.add('is-devices-view');
    renderDevicesView(workspace);
    return;
  }

  if (activeLineId === CELLULAR_ALL_VIEW_ID) {
    const cellularCategory = PRODUCT_CATEGORIES.find(category => category.id === 'cellular');
    renderProductCategoryTabs(workspace, cellularCategory);
    const cellularLines = getCategoryLines(cellularCategory)
      .filter(line => CELLULAR_CATALOG_LINE_KEYS.includes(getLineKey(line)));
    const entries = cellularLines.flatMap(line => line.items.map(item => ({ line, item })));
    renderProductWorkspaceBody(workspace, 'All Cellular Devices', entries);
    return;
  }

  const line = getActiveLine();

  if (!line) {
    const empty = document.createElement('section');
    empty.className = 'monitor-grid empty';
    empty.innerHTML = '<div class="monitor-placeholder-card"><h3>No product lines</h3></div>';
    workspace.appendChild(empty);
    return;
  }

  renderProductCategoryTabs(workspace, getCategoryForLine(line));

  renderProductWorkspaceBody(
    workspace,
    getLineDisplayName(line),
    line.items.map(item => ({ line, item }))
  );
}

// Renders the product grid, substituting whole-catalog search results when a
// search query is active so any full re-render stays consistent with the box.
function renderProductWorkspaceBody(workspace, baseTitle, baseEntries) {
  if (productSearchQuery.trim()) {
    const entries = getProductSearchEntries();
    renderProductCollection(workspace, getProductSearchTitle(entries.length), entries);
  } else {
    renderProductCollection(workspace, baseTitle, baseEntries);
  }
}

function renderProductCollection(workspace, titleText, entries) {

  const header = document.createElement('div');
  header.className = 'vm-header monitor-header product-line-header';
  const headerText = document.createElement('div');
  headerText.className = 'monitor-header-text';
  const headerRow = document.createElement('div');
  headerRow.className = 'monitor-header-row';
  const title = document.createElement('h2');
  title.id = 'product-line-header-title';
  title.textContent = titleText;
  headerRow.appendChild(title);
  headerText.appendChild(headerRow);
  header.appendChild(headerText);
  workspace.appendChild(header);

  const grid = document.createElement('div');
  grid.className = 'vm-grid monitor-grid product-grid';
  grid.id = 'product-grid';

  if (entries.length === 0) {
    grid.classList.add('empty');
    const emptyState = document.createElement('div');
    emptyState.className = 'monitor-placeholder-card';
    emptyState.innerHTML = '<h3>No products yet</h3>';
    grid.appendChild(emptyState);
  } else {
    entries.forEach(({ line, item }) => {
      grid.appendChild(createProductCard(item, line));
    });
  }

  workspace.appendChild(grid);
  cleanupPortStatuses();
}

const devicesState = {
  status: 'idle', // idle | loading | ready | error
  devices: [],
  error: '',
  code: '',
  search: '',
  filterStatus: 'connected', // all | connected | disconnected
  sortBy: 'name', // name | status
  expandedId: '', // device id whose detail panel is open
  viewMode: 'grid', // list | grid
  // Lazily-fetched per-device enrichment (detail/events/alerts/live state),
  // keyed by device id. Only populated for a device the tech opens — these are
  // N+1 calls, so they are never fetched during a plain list render.
  detailById: {}
};

const DEVICE_DETAIL_GROUPS = [
  {
    title: 'Device',
    fields: [
      ['Serial number', 'serialNumber'],
      ['IP', 'ip'],
      ['Public IP', 'publicIp'],
      ['Private IP', 'privateIp'],
      ['MAC address', 'macAddress'],
      ['Connection type', 'connectionType'],
      ['Firmware version', 'firmwareVersion'],
      ['SKU', 'sku'],
      ['Activation date', 'activationDate'],
      ['Uptime', 'uptime'],
      ['Cloud uptime', 'cloudUptime'],
      ['Last connect', 'lastConnect'],
      ['Model', 'model']
    ]
  },
  {
    title: 'Modem',
    fields: [
      ['State', 'modemState'],
      ['Signal bars', 'signalBars'],
      ['Signal', 'signalStrength'],
      ['Network', 'network'],
      ['Carrier', 'carrier'],
      ['Modem model', 'modemModel'],
      ['SIM status', 'simStatus'],
      ['SIM ICCID', 'simIccid'],
      ['IMEI', 'imei']
    ]
  }
];
const DEVICE_MODEL_IMAGES = [
  ['ix40', 'img/digi-ix40.png'],
  ['ix30', 'img/digi-ix30.png'],
  ['ix25', 'img/digi-ix25.png'],
  ['ix20', 'img/digi-ix20.png'],
  ['ix10', 'img/digi-ix10.png'],
  ['ex50', 'img/digi-ex50-new.png'],
  ['ex15', 'img/Digi-EX15.png'],
  ['ex12', 'img/digi-ex12.png'],
  ['tx64', 'img/digi-tx64-r.png'],
  ['tx54', 'img/tx54.png'],
  ['tx40', 'img/digi-tx40.png'],
  ['core-cm', 'img/digi-core-cm-18.png'],
  ['cm18', 'img/digi-core-cm-18.png'],
];

function getDeviceProductImage(name) {
  const normalized = (name || '').toLowerCase().replace(/[\s_]/g, '-');
  for (const [pattern, imgPath] of DEVICE_MODEL_IMAGES) {
    if (normalized.includes(pattern)) return imgPath;
  }
  return null;
}

// --- Per-device DRM enrichment (detail / events / alerts / live state) ------

function getDeviceEnrichment(deviceId) {
  return devicesState.detailById[deviceId] || {
    loading: false,
    loaded: false,
    error: '',
    detail: null,
    events: [],
    alerts: [],
    alertCount: 0,
    stateLoading: false,
    stateError: '',
    stats: null,
    rebooting: false,
    cliOpen: false,
    cliRunning: false,
    cliHistory: []
  };
}

function setDeviceEnrichment(deviceId, patch) {
  const prev = devicesState.detailById[deviceId] || getDeviceEnrichment(deviceId);
  devicesState.detailById[deviceId] = { ...prev, ...patch };
}

// Fetch detail + events + alerts once for a device the tech has opened. Guards
// against duplicate fetches; calls onUpdate() when data lands so the open view
// can re-render.
function ensureDeviceEnrichment(device, onUpdate) {
  const id = device && device.id;
  if (!id) return;

  const existing = devicesState.detailById[id];
  if (existing && (existing.loading || existing.loaded)) return;

  const api = getNetworkAPI();
  if (!api || typeof api.digiGetDeviceDetail !== 'function') {
    setDeviceEnrichment(id, { loading: false, loaded: true, error: 'Digi integration is unavailable' });
    if (onUpdate) onUpdate();
    return;
  }

  setDeviceEnrichment(id, { loading: true, loaded: false, error: '' });

  Promise.allSettled([
    api.digiGetDeviceDetail({ deviceId: id }),
    api.digiGetDeviceEvents({ deviceId: id }),
    api.digiGetDeviceAlerts({ deviceId: id })
  ]).then(([detailR, eventsR, alertsR]) => {
    const detail = detailR.status === 'fulfilled' ? detailR.value : null;
    const events = eventsR.status === 'fulfilled' ? eventsR.value : null;
    const alerts = alertsR.status === 'fulfilled' ? alertsR.value : null;

    const patch = { loading: false, loaded: true, error: '' };
    if (detail && detail.success && detail.device) {
      patch.detail = detail.device;
    } else if (detail && !detail.success) {
      // Detail is the primary call; surface its error but still show events/alerts.
      patch.error = detail.error || '';
    }
    patch.events = events && events.success && Array.isArray(events.events) ? events.events : [];
    patch.alerts = alerts && alerts.success && Array.isArray(alerts.alerts) ? alerts.alerts : [];
    patch.alertCount = patch.alerts.length;

    setDeviceEnrichment(id, patch);
    if (onUpdate) onUpdate();
  });

  if (onUpdate) onUpdate();
}

function queryDeviceLiveState(device, onUpdate) {
  const id = device && device.id;
  if (!id) return;
  const api = getNetworkAPI();
  if (!api || typeof api.digiQueryDeviceState !== 'function') {
    showNotification('Live state is unavailable');
    return;
  }

  setDeviceEnrichment(id, { stateLoading: true, stateError: '', stats: null });
  if (onUpdate) onUpdate();

  api.digiQueryDeviceState({ deviceId: id }).then((result) => {
    if (result && result.success) {
      setDeviceEnrichment(id, { stateLoading: false, stateError: '', stats: result.stats || null });
    } else {
      setDeviceEnrichment(id, {
        stateLoading: false,
        stateError: (result && result.error) || 'Could not query device state',
        stats: null
      });
    }
    if (onUpdate) onUpdate();
  }).catch((error) => {
    setDeviceEnrichment(id, {
      stateLoading: false,
      stateError: error.message || 'Could not query device state',
      stats: null
    });
    if (onUpdate) onUpdate();
  });
}

function handleDeviceReboot(device, onUpdate) {
  const id = device && device.id;
  if (!id) return;
  const name = device.name || id || 'this device';
  // Destructive — confirm exactly like the app's other delete/destroy actions.
  if (!window.confirm(`Reboot ${name} now?\n\nThe device will drop its connection and restart.`)) return;

  const api = getNetworkAPI();
  if (!api || typeof api.digiRebootDevice !== 'function') {
    showNotification('Reboot is unavailable');
    return;
  }

  setDeviceEnrichment(id, { rebooting: true });
  if (onUpdate) onUpdate();

  api.digiRebootDevice({ deviceId: id }).then((result) => {
    if (result && result.success) {
      showNotification(`Reboot command sent to ${name}`);
    } else {
      showNotification((result && result.error) || 'Reboot failed');
    }
    setDeviceEnrichment(id, { rebooting: false });
    if (onUpdate) onUpdate();
  }).catch((error) => {
    showNotification(error.message || 'Reboot failed');
    setDeviceEnrichment(id, { rebooting: false });
    if (onUpdate) onUpdate();
  });
}

// --- DRM device console (SCI single-command CLI) ---------------------------

const CLI_MAX_HISTORY = 100;          // bound the in-memory transcript
const CLI_MAX_OUTPUT_CHARS = 100000;  // per-entry output cap (~100 KB)
// Device whose console input should regain focus after the next re-render.
let pendingCliFocusDeviceId = null;

// Run one CLI command on a device via SCI, appending the result (or error) to
// the device's in-memory console history. Request/response — not a live shell.
function runDeviceCliCommand(device, command, onUpdate) {
  const id = device && device.id;
  const cmd = String(command || '').trim();
  if (!id || !cmd) return;

  const api = getNetworkAPI();
  if (!api || typeof api.digiRunDeviceCli !== 'function') {
    showNotification('Console is unavailable');
    return;
  }

  setDeviceEnrichment(id, { cliRunning: true });
  pendingCliFocusDeviceId = id;
  if (onUpdate) onUpdate();

  const appendEntry = (entry) => {
    const prev = getDeviceEnrichment(id);
    const history = [...prev.cliHistory, entry].slice(-CLI_MAX_HISTORY);
    setDeviceEnrichment(id, { cliRunning: false, cliHistory: history });
    pendingCliFocusDeviceId = id;
    if (onUpdate) onUpdate();
  };

  api.digiRunDeviceCli({ deviceId: id, command: cmd }).then((result) => {
    if (result && result.success) {
      const output = String(result.output || '').slice(0, CLI_MAX_OUTPUT_CHARS);
      appendEntry({ command: cmd, output, error: '' });
    } else {
      appendEntry({ command: cmd, output: '', error: (result && result.error) || 'Command failed' });
    }
  }).catch((error) => {
    appendEntry({ command: cmd, output: '', error: error.message || 'Command failed' });
  });
}

// Build the console pane: scrollable transcript + a command input row. Reads
// only from the enrichment cache, so it is safe to rebuild on every re-render.
function createDeviceConsole(device, data, onUpdate) {
  const pane = document.createElement('div');
  pane.className = 'device-console';

  const history = document.createElement('div');
  history.className = 'device-console-history';
  if (!data.cliHistory.length) {
    const empty = document.createElement('p');
    empty.className = 'device-console-empty';
    empty.textContent = 'Run a single command through Remote Manager (e.g. "show system", "show network interface"). Output comes back here.';
    history.appendChild(empty);
  } else {
    data.cliHistory.forEach((entry) => {
      const block = document.createElement('div');
      block.className = 'device-console-entry';

      const cmdLine = document.createElement('div');
      cmdLine.className = 'device-console-command';
      cmdLine.textContent = `$ ${entry.command}`;
      block.appendChild(cmdLine);

      const out = document.createElement('pre');
      out.className = `device-console-output${entry.error ? ' is-error' : ''}`;
      out.textContent = entry.error || entry.output || '(no output)';
      block.appendChild(out);

      history.appendChild(block);
    });
  }
  pane.appendChild(history);

  const form = document.createElement('form');
  form.className = 'device-console-form';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'device-console-input';
  input.placeholder = data.cliRunning ? 'Running…' : 'Type a command and press Enter';
  input.disabled = data.cliRunning;
  input.autocomplete = 'off';
  input.spellcheck = false;
  form.appendChild(input);

  const runBtn = document.createElement('button');
  runBtn.type = 'submit';
  runBtn.className = 'device-action-button device-console-run';
  runBtn.textContent = data.cliRunning ? 'Running…' : 'Run';
  runBtn.disabled = data.cliRunning;
  form.appendChild(runBtn);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const cmd = input.value.trim();
    if (!cmd) return;
    input.value = '';
    runDeviceCliCommand(device, cmd, onUpdate);
  });
  pane.appendChild(form);

  // Keep the transcript scrolled to the newest output and restore input focus
  // after the enrichment container re-renders following a completed run.
  requestAnimationFrame(() => {
    history.scrollTop = history.scrollHeight;
    if (pendingCliFocusDeviceId === device.id && !data.cliRunning) {
      pendingCliFocusDeviceId = null;
      input.focus();
    }
  });

  return pane;
}

// Fetch DRM device logs and open them in the existing Support Archive Viewer
// (reuses the same session model as an imported archive — no new log viewer).
async function handleOpenDeviceLogs(device) {
  const id = device && device.id;
  if (!id) return;
  const api = getNetworkAPI();
  if (!api || typeof api.digiGetDeviceLogs !== 'function') {
    showNotification('Device logs are unavailable');
    return;
  }

  showNotification('Fetching device logs…');
  try {
    const result = await api.digiGetDeviceLogs({ deviceId: id, deviceName: device.name || '' });
    if (!result || !result.success) {
      showNotification((result && result.error) || 'Could not load device logs');
      return;
    }
    closeDeviceDetailModal();
    activeLineId = FILE_SUPPORT_VIEW_ID;
    saveProductLines();
    applySupportFileLoadResult(result, 'Device logs loaded');
    renderProductApp();
  } catch (error) {
    showNotification(error.message || 'Could not load device logs');
  }
}

// Small square action button used across the DRM enrichment panel + modal.
function createDeviceActionButton(label, { danger = false, disabled = false, onClick } = {}) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `device-action-button${danger ? ' is-danger' : ''}`;
  btn.textContent = label;
  btn.disabled = Boolean(disabled);
  if (onClick) {
    btn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      onClick();
    });
  }
  return btn;
}

function createDeviceAlertCountBadge(count) {
  const badge = document.createElement('span');
  badge.className = 'device-alert-badge';
  badge.title = `${count} active alert${count === 1 ? '' : 's'}`;
  badge.setAttribute('aria-label', `${count} active alert${count === 1 ? '' : 's'}`);
  badge.textContent = count > 99 ? '99+' : String(count);
  return badge;
}

// Render the alerts / events / live-state / actions block for an opened device.
// Reads only from the enrichment cache, so it is safe to call repeatedly.
function renderDeviceEnrichment(container, device, onUpdate) {
  container.innerHTML = '';
  const data = getDeviceEnrichment(device.id);

  const actions = document.createElement('div');
  actions.className = 'device-enrichment-actions';
  const isConnected = device.status === 'connected';
  actions.appendChild(createDeviceActionButton(data.stateLoading ? 'Querying…' : 'Live state', {
    disabled: data.stateLoading || !isConnected,
    onClick: () => queryDeviceLiveState(device, onUpdate)
  }));
  actions.appendChild(createDeviceActionButton(data.cliOpen ? 'Hide console' : 'Console', {
    disabled: !isConnected,
    onClick: () => {
      setDeviceEnrichment(device.id, { cliOpen: !data.cliOpen });
      if (onUpdate) onUpdate();
    }
  }));
  actions.appendChild(createDeviceActionButton('Open logs', {
    onClick: () => handleOpenDeviceLogs(device)
  }));
  actions.appendChild(createDeviceActionButton(data.rebooting ? 'Rebooting…' : 'Reboot', {
    danger: true,
    disabled: data.rebooting,
    onClick: () => handleDeviceReboot(device, onUpdate)
  }));
  container.appendChild(actions);

  if (data.stateLoading || data.stateError || data.stats) {
    const stateBlock = document.createElement('div');
    stateBlock.className = 'device-live-state';
    if (data.stateLoading) {
      stateBlock.textContent = 'Querying live state…';
    } else if (data.stateError) {
      stateBlock.classList.add('is-error');
      stateBlock.textContent = data.stateError;
    } else if (data.stats) {
      const rows = [
        ['CPU', data.stats.cpu],
        ['Uptime', data.stats.uptime],
        ['Memory used', data.stats.usedMemory],
        ['Memory free', data.stats.freeMemory],
        ['Memory total', data.stats.totalMemory]
      ].filter(([, value]) => String(value || '').trim() !== '');
      if (rows.length === 0) {
        stateBlock.textContent = 'No live state returned by the device';
      } else {
        const grid = document.createElement('dl');
        grid.className = 'device-live-state-grid';
        rows.forEach(([label, value]) => {
          const dt = document.createElement('dt');
          dt.textContent = label;
          const dd = document.createElement('dd');
          dd.textContent = value;
          grid.appendChild(dt);
          grid.appendChild(dd);
        });
        stateBlock.appendChild(grid);
      }
    }
    container.appendChild(stateBlock);
  }

  if (data.cliOpen) {
    container.appendChild(createDeviceConsole(device, data, onUpdate));
  }

  if (data.loading) {
    const loading = document.createElement('p');
    loading.className = 'device-enrichment-loading';
    loading.textContent = 'Loading alerts & events…';
    container.appendChild(loading);
    return;
  }

  if (data.error) {
    const err = document.createElement('p');
    err.className = 'device-enrichment-error';
    err.textContent = data.error;
    container.appendChild(err);
  }

  const alertsSection = createDeviceListSection(
    `Alerts${data.alerts.length ? ` (${data.alerts.length})` : ''}`,
    data.alerts.map((alert) => {
      const sev = String(alert.severity || '').trim();
      const prefix = sev ? `[${sev}] ` : '';
      const stamp = alert.timestamp ? ` — ${alert.timestamp}` : '';
      return `${prefix}${alert.message || alert.id || 'Alert'}${stamp}`;
    }),
    'No active alerts'
  );
  container.appendChild(alertsSection);

  const eventsSection = createDeviceListSection(
    'Recent events',
    data.events.map((evt) => {
      const type = evt.type ? `${evt.type}: ` : '';
      const stamp = evt.timestamp ? `${evt.timestamp} — ` : '';
      return `${stamp}${type}${evt.summary || ''}`.trim();
    }),
    'No recent events'
  );
  container.appendChild(eventsSection);
}

function createDeviceListSection(title, lines, emptyText) {
  const section = document.createElement('div');
  section.className = 'device-enrichment-section';

  const heading = document.createElement('h4');
  heading.className = 'device-detail-title';
  heading.textContent = title;
  section.appendChild(heading);

  if (!lines || lines.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'device-enrichment-empty';
    empty.textContent = emptyText;
    section.appendChild(empty);
    return section;
  }

  const list = document.createElement('ul');
  list.className = 'device-enrichment-list';
  lines.slice(0, 50).forEach((line) => {
    const item = document.createElement('li');
    item.textContent = line;
    list.appendChild(item);
  });
  section.appendChild(list);
  return section;
}

let devicesAutoRefreshTimer = null;
let devicesBodyEl = null;

function stopDevicesAutoRefresh() {
  if (devicesAutoRefreshTimer) {
    clearInterval(devicesAutoRefreshTimer);
    devicesAutoRefreshTimer = null;
  }
}

function startDevicesAutoRefresh() {
  stopDevicesAutoRefresh();
  devicesAutoRefreshTimer = setInterval(() => {
    if (activeLineId !== DEVICES_VIEW_ID) {
      stopDevicesAutoRefresh();
      return;
    }
    loadDevices({ silent: true });
  }, DEVICES_AUTO_REFRESH_INTERVAL);
}

async function loadDevices({ silent = false } = {}) {
  const api = getNetworkAPI();
  if (!api || typeof api.digiGetDevices !== 'function') {
    devicesState.status = 'error';
    devicesState.error = 'Digi integration is unavailable';
    devicesState.code = 'DIGI_UNAVAILABLE';
    renderDevicesBody();
    return;
  }

  if (!silent || devicesState.status === 'idle') {
    devicesState.status = 'loading';
    renderDevicesBody();
  }

  const result = await api.digiGetDevices();

  // Ignore late responses if the user navigated away.
  if (activeLineId !== DEVICES_VIEW_ID) return;

  if (result && result.success) {
    devicesState.status = 'ready';
    devicesState.devices = Array.isArray(result.devices) ? result.devices : [];
    devicesState.error = '';
    devicesState.code = '';
  } else {
    devicesState.status = 'error';
    devicesState.error = (result && result.error) || 'Could not load devices';
    devicesState.code = (result && result.code) || 'DIGI_ERROR';
  }
  renderDevicesBody();
}

function getFilteredDevices() {
  const query = devicesState.search.trim().toLowerCase();
  const filterStatus = devicesState.filterStatus;

  let result = devicesState.devices.filter((device) => {
    if (filterStatus === 'connected' && device.status !== 'connected') return false;
    if (filterStatus === 'disconnected' && device.status === 'connected') return false;
    if (!query) return true;
    return [device.name, device.id, device.status]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(query));
  });

  result = result.slice().sort((a, b) => {
    // Always show online (connected) devices first, then offline.
    const aOnline = a.status === 'connected' ? 0 : 1;
    const bOnline = b.status === 'connected' ? 0 : 1;
    if (aOnline !== bOnline) return aOnline - bOnline;
    return String(a.name || a.id || '').localeCompare(String(b.name || b.id || ''), undefined, {
      sensitivity: 'base',
      numeric: true
    });
  });

  return result;
}

function createDeviceStatusBadge(status) {
  const badge = document.createElement('span');
  const normalized = String(status || 'unknown').toLowerCase();
  const isConnected = normalized === 'connected';
  badge.className = `device-status-badge ${isConnected ? 'is-connected' : 'is-disconnected'}`;
  badge.dataset.status = normalized;
  badge.textContent = normalized;
  return badge;
}

async function copyDeviceValue(value, label) {
  const text = String(value ?? '');
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text);
    } else {
      const scratch = document.createElement('textarea');
      scratch.value = text;
      scratch.setAttribute('readonly', '');
      scratch.style.position = 'fixed';
      scratch.style.opacity = '0';
      document.body.appendChild(scratch);
      scratch.select();
      document.execCommand('copy');
      document.body.removeChild(scratch);
    }
    showNotification(`${label} copied`);
  } catch (error) {
    console.error('Error copying value:', error);
    showNotification('Could not copy value');
  }
}

// Open Digi Remote Manager filtered to a device id.
// DRM expects: ...?filter=id contains '<id>' (single quotes encoded as %27).
function openDrmDeviceSearch(rawId) {
  const id = String(rawId ?? '').trim();
  if (!id) {
    showNotification('Enter a device ID to search');
    return;
  }
  const filter = encodeURIComponent(`id contains '${id}'`).replace(/'/g, '%27');
  window.open(`https://remotemanager.digi.com/ui/devices?filter=${filter}`, '_blank', 'noopener,noreferrer');
}

// Build a <dd> that shows a detail value plus a button to copy it.
function createDeviceDetailValueCell(label, value) {
  const dd = document.createElement('dd');
  dd.className = 'device-detail-value';

  const text = document.createElement('span');
  text.className = 'device-detail-value-text';
  text.textContent = value;
  dd.appendChild(text);

  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.className = 'device-detail-copy';
  copyBtn.title = `Copy ${label}`;
  copyBtn.setAttribute('aria-label', `Copy ${label}`);
  copyBtn.innerHTML = '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/><path d="M3.5 10.5h-1a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v1"/></svg>';
  copyBtn.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    copyDeviceValue(value, label);
  });
  dd.appendChild(copyBtn);

  return dd;
}

function createDeviceDetailPanel(device) {
  const enrich = getDeviceEnrichment(device.id);
  // Prefer the fresher single-device detail once it has loaded; fall back to
  // the fields already present from the inventory list.
  const details = (enrich.detail && enrich.detail.details) || device.details || {};
  const panel = document.createElement('div');
  panel.className = 'device-detail';

  const groups = DEVICE_DETAIL_GROUPS
    .map((group) => {
      const rows = group.fields
        .map(([label, key]) => [label, String(details[key] ?? '').trim()])
        .filter(([, value]) => value !== '');
      return { title: group.title, rows };
    })
    .filter((group) => group.rows.length > 0);

  if (groups.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'device-detail-empty';
    empty.textContent = 'No additional details available for this device';
    panel.appendChild(empty);
  }

  groups.forEach((group) => {
    const section = document.createElement('div');
    section.className = 'device-detail-group';

    const title = document.createElement('h4');
    title.className = 'device-detail-title';
    title.textContent = group.title;
    section.appendChild(title);

    const grid = document.createElement('dl');
    grid.className = 'device-detail-grid';
    group.rows.forEach(([label, value]) => {
      const dt = document.createElement('dt');
      dt.textContent = label;
      grid.appendChild(dt);
      grid.appendChild(createDeviceDetailValueCell(label, value));
    });
    section.appendChild(grid);
    panel.appendChild(section);
  });

  const onUpdate = () => {
    if (devicesState.expandedId === device.id) renderDevicesBody();
  };
  const enrichment = document.createElement('div');
  enrichment.className = 'device-enrichment';
  renderDeviceEnrichment(enrichment, device, onUpdate);
  panel.appendChild(enrichment);
  ensureDeviceEnrichment(device, onUpdate);

  return panel;
}

function createDeviceRow(device) {
  const wrapper = document.createElement('div');
  wrapper.className = 'device-item';

  const isExpanded = devicesState.expandedId === device.id && Boolean(device.id);

  const row = document.createElement('div');
  row.className = `device-row${isExpanded ? ' is-expanded' : ''}`;
  row.setAttribute('role', 'button');
  row.tabIndex = 0;
  row.setAttribute('aria-expanded', String(isExpanded));

  const productImg = getDeviceProductImage(device.name);
  if (productImg) {
    const thumb = document.createElement('img');
    thumb.className = 'device-row-thumb';
    thumb.src = resolveImageAssetUrl(productImg);
    thumb.alt = '';
    thumb.setAttribute('aria-hidden', 'true');
    row.appendChild(thumb);
  }

  const info = document.createElement('div');
  info.className = 'device-row-info';

  const name = document.createElement('div');
  name.className = 'device-row-name';
  name.textContent = device.name || device.id || 'Unknown device';
  info.appendChild(name);

  if (device.id) {
    const id = document.createElement('div');
    id.className = 'device-row-id';
    id.textContent = device.id;
    info.appendChild(id);
  }

  const meta = document.createElement('div');
  meta.className = 'device-row-meta';
  const rowAlertCount = getDeviceEnrichment(device.id).alertCount;
  if (rowAlertCount > 0) meta.appendChild(createDeviceAlertCountBadge(rowAlertCount));
  meta.appendChild(createDeviceStatusBadge(device.status));
  const chevron = document.createElement('span');
  chevron.className = 'device-row-chevron';
  chevron.setAttribute('aria-hidden', 'true');
  chevron.textContent = '⌄';
  meta.appendChild(chevron);

  row.appendChild(info);
  row.appendChild(meta);

  const toggle = () => {
    if (!device.id) return;
    devicesState.expandedId = isExpanded ? '' : device.id;
    renderDevicesBody();
  };
  row.addEventListener('click', toggle);
  row.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggle();
    }
  });

  wrapper.appendChild(row);

  if (isExpanded) {
    wrapper.appendChild(createDeviceDetailPanel(device));
  }

  return wrapper;
}

function openDeviceDetailModal(device) {
  const modal = document.getElementById('device-detail-modal');
  const titleEl = document.getElementById('device-detail-modal-title');
  const iconEl = document.getElementById('device-detail-modal-icon');
  const bodyEl = document.getElementById('device-detail-modal-body');
  if (!modal) return;

  const isConnected = device.status === 'connected';
  const details = device.details || {};
  const network = String(details.network || details.connectionType || '').toUpperCase();
  const iconText = ['LTE', '5G', '4G', 'WIFI', 'ETH'].find(t => network.includes(t)) || 'DRM';

  if (titleEl) titleEl.textContent = device.name || device.id || 'Unknown device';
  if (iconEl) {
    iconEl.className = `device-detail-modal-icon ${isConnected ? 'is-connected' : 'is-disconnected'}`;
    const modalProductImg = getDeviceProductImage(device.name);
    if (modalProductImg) {
      iconEl.classList.add('has-product-img');
      iconEl.innerHTML = '';
      const imgEl = document.createElement('img');
      imgEl.src = resolveImageAssetUrl(modalProductImg);
      imgEl.alt = '';
      imgEl.setAttribute('aria-hidden', 'true');
      imgEl.className = 'device-detail-modal-icon-img';
      iconEl.appendChild(imgEl);
    } else {
      iconEl.classList.remove('has-product-img');
      iconEl.textContent = iconText;
    }
  }

  if (bodyEl) {
    bodyEl.innerHTML = '';
    const statusLine = document.createElement('div');
    statusLine.className = 'device-detail-modal-status-line';
    const badge = createDeviceStatusBadge(device.status);
    statusLine.appendChild(badge);
    if (device.id) {
      const idEl = document.createElement('span');
      idEl.className = 'device-detail-modal-id';
      idEl.textContent = device.id;
      statusLine.appendChild(idEl);

      const idCopyBtn = document.createElement('button');
      idCopyBtn.type = 'button';
      idCopyBtn.className = 'device-detail-copy device-detail-modal-id-copy';
      idCopyBtn.title = 'Copy device ID';
      idCopyBtn.setAttribute('aria-label', 'Copy device ID');
      idCopyBtn.innerHTML = '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/><path d="M3.5 10.5h-1a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v1"/></svg>';
      idCopyBtn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        copyDeviceValue(device.id, 'Device ID');
      });
      statusLine.appendChild(idCopyBtn);

      const idSearchBtn = document.createElement('button');
      idSearchBtn.type = 'button';
      idSearchBtn.className = 'device-detail-copy device-detail-modal-id-search';
      idSearchBtn.title = 'Search this device in Digi Remote Manager';
      idSearchBtn.setAttribute('aria-label', 'Search this device in Digi Remote Manager');
      idSearchBtn.innerHTML = '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5 14 14"/></svg>';
      idSearchBtn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        openDrmDeviceSearch(device.id);
      });
      statusLine.appendChild(idSearchBtn);
    }
    bodyEl.appendChild(statusLine);

    const groups = DEVICE_DETAIL_GROUPS
      .map((group) => {
        const rows = group.fields
          .map(([label, key]) => [label, String(details[key] ?? '').trim()])
          .filter(([, value]) => value !== '');
        return { title: group.title, rows };
      })
      .filter((group) => group.rows.length > 0);

    if (groups.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'device-detail-empty';
      empty.textContent = 'No additional details available for this device';
      bodyEl.appendChild(empty);
    } else {
      const groupsWrap = document.createElement('div');
      groupsWrap.className = 'device-detail-modal-groups';
      groups.forEach((group) => {
        const section = document.createElement('div');
        section.className = 'device-detail-group';
        const title = document.createElement('h4');
        title.className = 'device-detail-title';
        title.textContent = group.title;
        section.appendChild(title);
        const grid = document.createElement('dl');
        grid.className = 'device-detail-grid';
        group.rows.forEach(([label, value]) => {
          const dt = document.createElement('dt');
          dt.textContent = label;
          grid.appendChild(dt);
          grid.appendChild(createDeviceDetailValueCell(label, value));
        });
        section.appendChild(grid);
        groupsWrap.appendChild(section);
      });
      bodyEl.appendChild(groupsWrap);
    }

    // The modal is not rebuilt by renderDevicesBody, so enrichment updates
    // re-render just this container in place.
    const enrichment = document.createElement('div');
    enrichment.className = 'device-enrichment';
    const onUpdate = () => renderDeviceEnrichment(enrichment, device, onUpdate);
    renderDeviceEnrichment(enrichment, device, onUpdate);
    bodyEl.appendChild(enrichment);
    ensureDeviceEnrichment(device, onUpdate);
  }

  modal.style.display = 'flex';
  const closeBtn = document.getElementById('device-detail-modal-close');
  if (closeBtn) closeBtn.focus();
}

function closeDeviceDetailModal() {
  const modal = document.getElementById('device-detail-modal');
  if (modal) modal.style.display = 'none';
}

function setupDeviceDetailModal() {
  const modal = document.getElementById('device-detail-modal');
  if (!modal) return;
  const closeBtn = document.getElementById('device-detail-modal-close');
  if (closeBtn) closeBtn.addEventListener('click', closeDeviceDetailModal);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeDeviceDetailModal();
  });
  document.addEventListener('keydown', (event) => {
    if (modal.style.display === 'flex' && event.key === 'Escape') {
      event.preventDefault();
      closeDeviceDetailModal();
    }
  });
}

function createDevicesEmptyOrError() {
  if (devicesState.status === 'loading') {
    const el = document.createElement('div');
    el.className = 'devices-state devices-loading';
    el.innerHTML = '<div class="devices-spinner" aria-hidden="true"></div><p>Loading devices…</p>';
    return el;
  }
  if (devicesState.status === 'error') {
    const message = devicesState.code === 'DIGI_CONFIG_MISSING'
      ? 'Configure your Digi Remote API key in Settings'
      : devicesState.code === 'DIGI_AUTH_FAILED'
        ? 'Invalid Digi API credentials'
        : devicesState.error || 'Could not load devices';
    const el = document.createElement('div');
    el.className = 'devices-state devices-error';
    const text = document.createElement('p');
    text.textContent = message;
    el.appendChild(text);
    if (devicesState.code === 'DIGI_CONFIG_MISSING') {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'save-button';
      btn.textContent = 'Open Settings';
      btn.addEventListener('click', openSettingsModal);
      el.appendChild(btn);
    }
    return el;
  }
  return null;
}

function createDeviceCard(device) {
  const isConnected = device.status === 'connected';
  const details = device.details || {};

  const card = document.createElement('div');
  card.className = `vm-card monitor-vm-card device-card${isConnected ? ' online' : ' offline'}`;
  card.setAttribute('role', 'button');
  card.tabIndex = 0;

  const content = document.createElement('div');
  content.className = 'vm-card-content';

  // Icon with network type indicator or product image
  const icon = document.createElement('div');
  icon.className = `vm-icon device-card-icon${isConnected ? ' is-connected' : ' is-disconnected'}`;
  const network = String(details.network || details.connectionType || '').toUpperCase();
  const iconText = ['LTE', '5G', '4G', 'WIFI', 'ETH'].find(t => network.includes(t))
    || (isConnected ? 'DRM' : 'DRM');
  const cardProductImg = getDeviceProductImage(device.name);
  if (cardProductImg) {
    icon.classList.add('has-product-img');
    const imgEl = document.createElement('img');
    imgEl.src = resolveImageAssetUrl(cardProductImg);
    imgEl.alt = '';
    imgEl.setAttribute('aria-hidden', 'true');
    imgEl.className = 'device-card-icon-img';
    icon.appendChild(imgEl);
  } else {
    icon.textContent = iconText;
  }
  content.appendChild(icon);

  // Name
  const titleRow = document.createElement('div');
  titleRow.className = 'monitor-card-title';
  const name = document.createElement('div');
  name.className = 'vm-name';
  name.textContent = device.name || device.id || 'Unknown';
  titleRow.appendChild(name);
  content.appendChild(titleRow);

  // Status + carrier/IP line
  const statusRow = document.createElement('div');
  statusRow.className = 'vm-status device-card-status';
  const dot = document.createElement('span');
  dot.className = 'product-status-dot';
  dot.setAttribute('aria-hidden', 'true');
  const statusText = document.createElement('span');
  statusText.textContent = device.status;
  statusRow.appendChild(dot);
  statusRow.appendChild(statusText);
  content.appendChild(statusRow);

  const sub = details.carrier || details.ip || '';
  if (sub) {
    const subEl = document.createElement('div');
    subEl.className = 'device-card-sub';
    subEl.textContent = sub;
    content.appendChild(subEl);
  }

  card.appendChild(content);

  const cardAlertCount = getDeviceEnrichment(device.id).alertCount;
  if (cardAlertCount > 0) {
    const badge = createDeviceAlertCountBadge(cardAlertCount);
    badge.classList.add('device-card-alert-badge');
    card.appendChild(badge);
  }

  const open = () => openDeviceDetailModal(device);
  card.addEventListener('click', open);
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      open();
    }
  });

  return card;
}

function renderDevicesBody() {
  const container = devicesBodyEl;
  if (!container) return;
  container.innerHTML = '';

  const stateEl = createDevicesEmptyOrError();
  if (stateEl) {
    container.appendChild(stateEl);
    return;
  }

  const devices = getFilteredDevices();

  if (devices.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'devices-state devices-empty';
    const text = document.createElement('p');
    text.textContent = devicesState.search.trim() || devicesState.filterStatus !== 'all'
      ? 'No devices match your filters'
      : 'No devices found';
    empty.appendChild(text);
    container.appendChild(empty);
    return;
  }

  if (devicesState.viewMode === 'grid') {
    const grid = document.createElement('div');
    grid.className = 'vm-grid monitor-grid devices-grid';
    devices.forEach((device) => grid.appendChild(createDeviceCard(device)));
    container.appendChild(grid);
  } else {
    const list = document.createElement('div');
    list.className = 'devices-list';
    devices.forEach((device) => list.appendChild(createDeviceRow(device)));
    container.appendChild(list);
  }
}

function renderDevicesView(workspace) {
  const header = document.createElement('div');
  header.className = 'vm-header monitor-header product-line-header devices-header';

  const headerText = document.createElement('div');
  headerText.className = 'monitor-header-text';
  const headerRow = document.createElement('div');
  headerRow.className = 'monitor-header-row';
  const title = document.createElement('h2');
  title.id = 'product-line-header-title';
  title.textContent = 'Digi Remote Manager';
  headerRow.appendChild(title);
  headerText.appendChild(headerRow);
  header.appendChild(headerText);

  const actions = document.createElement('div');
  actions.className = 'devices-header-actions';

  const search = document.createElement('input');
  search.type = 'search';
  search.className = 'devices-search-input';
  search.placeholder = 'Search devices…';
  search.value = devicesState.search;
  search.addEventListener('input', () => {
    devicesState.search = search.value;
    if (devicesState.status === 'ready') {
      renderDevicesBody();
    }
  });
  actions.appendChild(search);

  const buildButtonGroup = (ariaLabel, options, getSelected, onChange) => {
    const group = document.createElement('div');
    group.className = 'devices-filter-toggle';
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', ariaLabel);
    options.forEach(({ value, label }) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `devices-filter-btn${getSelected() === value ? ' is-active' : ''}`;
      btn.textContent = label;
      btn.setAttribute('aria-pressed', String(getSelected() === value));
      btn.addEventListener('click', () => {
        onChange(value);
        group.querySelectorAll('.devices-filter-btn').forEach((b, i) => {
          const isActive = options[i].value === value;
          b.classList.toggle('is-active', isActive);
          b.setAttribute('aria-pressed', String(isActive));
        });
        if (devicesState.status === 'ready') {
          renderDevicesBody();
        }
      });
      group.appendChild(btn);
    });
    return group;
  };

  actions.appendChild(buildButtonGroup(
    'Filter by status',
    [
      { value: 'all', label: 'All' },
      { value: 'connected', label: 'Online' },
      { value: 'disconnected', label: 'Offline' }
    ],
    () => devicesState.filterStatus,
    (value) => { devicesState.filterStatus = value; }
  ));

  // View toggle (list / grid)
  const viewToggle = document.createElement('div');
  viewToggle.className = 'devices-view-toggle';
  viewToggle.setAttribute('role', 'group');
  viewToggle.setAttribute('aria-label', 'View mode');

  const createViewBtn = (mode, svgPath, label) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `devices-view-btn${devicesState.viewMode === mode ? ' is-active' : ''}`;
    btn.title = label;
    btn.setAttribute('aria-label', label);
    btn.setAttribute('aria-pressed', String(devicesState.viewMode === mode));
    btn.innerHTML = `<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">${svgPath}</svg>`;
    btn.addEventListener('click', () => {
      devicesState.viewMode = mode;
      devicesState.expandedId = '';
      renderDevicesBody();
      viewToggle.querySelectorAll('.devices-view-btn').forEach(b => {
        b.classList.toggle('is-active', b === btn);
        b.setAttribute('aria-pressed', String(b === btn));
      });
    });
    return btn;
  };

  viewToggle.appendChild(createViewBtn('list',
    '<rect x="1" y="2" width="14" height="2.5" rx="1"/><rect x="1" y="6.75" width="14" height="2.5" rx="1"/><rect x="1" y="11.5" width="14" height="2.5" rx="1"/>',
    'List view'
  ));
  viewToggle.appendChild(createViewBtn('grid',
    '<rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5"/><rect x="1" y="9" width="6" height="6" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/>',
    'Grid view'
  ));
  actions.appendChild(viewToggle);

  // Manual DRM portal search: paste an ID and look it up in Digi Remote Manager.
  const drmSearchForm = document.createElement('form');
  drmSearchForm.className = 'devices-drm-search';

  const drmSearchInput = document.createElement('input');
  drmSearchInput.type = 'search';
  drmSearchInput.className = 'devices-drm-search-input';
  drmSearchInput.placeholder = 'Search ID in DRM…';
  drmSearchInput.title = 'Paste a device ID to search in Digi Remote Manager';
  drmSearchForm.appendChild(drmSearchInput);

  const drmSearchButton = document.createElement('button');
  drmSearchButton.type = 'submit';
  drmSearchButton.className = 'config-transfer-button settings-action-button devices-drm-search-button';
  drmSearchButton.textContent = 'Search DRM';
  drmSearchButton.title = 'Search this ID in Digi Remote Manager';
  drmSearchForm.appendChild(drmSearchButton);

  drmSearchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    openDrmDeviceSearch(drmSearchInput.value);
  });
  actions.appendChild(drmSearchForm);

  const openWebButton = document.createElement('button');
  openWebButton.type = 'button';
  openWebButton.className = 'config-transfer-button settings-action-button devices-open-web-button';
  openWebButton.textContent = 'Open DRM';
  openWebButton.title = 'Open Digi Remote Manager in your browser';
  openWebButton.addEventListener('click', () => {
    window.open('https://remotemanager.digi.com/', '_blank', 'noopener,noreferrer');
  });
  actions.appendChild(openWebButton);

  const refreshButton = document.createElement('button');
  refreshButton.type = 'button';
  refreshButton.className = 'config-transfer-button settings-action-button devices-refresh-button';
  refreshButton.textContent = 'Refresh';
  refreshButton.addEventListener('click', () => loadDevices());
  actions.appendChild(refreshButton);

  header.appendChild(actions);
  workspace.appendChild(header);

  const body = document.createElement('div');
  body.className = 'devices-body';
  workspace.appendChild(body);
  devicesBodyEl = body;

  renderDevicesBody();
  loadDevices({ silent: devicesState.status === 'ready' });
  startDevicesAutoRefresh();
}

function renderTemplatesView(workspace) {
  const header = document.createElement('div');
  header.className = 'vm-header monitor-header product-line-header templates-header';

  const headerText = document.createElement('div');
  headerText.className = 'monitor-header-text';

  const headerRow = document.createElement('div');
  headerRow.className = 'monitor-header-row';

  const title = document.createElement('h2');
  title.id = 'product-line-header-title';
  title.textContent = 'Notes';

  headerRow.appendChild(title);
  const controls = document.createElement('div');
  controls.className = 'template-top-controls';

  const importButton = document.createElement('button');
  importButton.type = 'button';
  importButton.id = 'import-template-btn';
  importButton.className = 'config-transfer-button template-import-button';
  importButton.textContent = 'Load';

  const importInput = document.createElement('input');
  importInput.type = 'file';
  importInput.id = 'template-import-input';
  importInput.accept = '.md,.markdown,text/markdown,text/plain';
  importInput.multiple = true;
  importInput.style.display = 'none';
  importInput.addEventListener('change', handleTemplateFileSelection);

  importButton.addEventListener('click', () => {
    importInput.value = '';
    importInput.click();
  });

  const newButton = document.createElement('button');
  newButton.type = 'button';
  newButton.className = 'config-transfer-button template-new-button';
  newButton.textContent = 'New';
  newButton.addEventListener('click', () => {
    // New notes are saved immediately so editing autosaves with no Save button.
    openBlankCaseNote();
    renderProductApp();
  });

  const newBlankButton = document.createElement('button');
  newBlankButton.type = 'button';
  newBlankButton.className = 'config-transfer-button template-new-blank-button';
  newBlankButton.textContent = 'New blank';
  newBlankButton.title = 'Create a free-form note without Case fields';
  newBlankButton.addEventListener('click', () => {
    // Blank notes have no Case fields — just a free-form editable body.
    openBlankPlainNote();
    renderProductApp();
  });

  const createToggleButton = document.createElement('button');
  createToggleButton.type = 'button';
  createToggleButton.className = 'config-transfer-button template-create-toggle';
  createToggleButton.textContent = showTemplateCreatePanel ? 'Hide create' : 'Create with AI';
  createToggleButton.setAttribute('aria-pressed', showTemplateCreatePanel ? 'true' : 'false');
  createToggleButton.addEventListener('click', () => {
    showTemplateCreatePanel = !showTemplateCreatePanel;
    renderProductApp();
  });

  controls.appendChild(newButton);
  controls.appendChild(newBlankButton);
  controls.appendChild(createToggleButton);
  controls.appendChild(importButton);
  controls.appendChild(importInput);
  headerRow.appendChild(controls);
  headerText.appendChild(headerRow);
  header.appendChild(headerText);
  workspace.appendChild(header);

  if (activeTemplateId
    && !templateDrafts.some(template => template.id === activeTemplateId)
    && !supportTemplates.some(template => template.id === activeTemplateId)) {
    activeTemplateId = '';
  }
  if (!activeTemplateId) {
    openBlankCaseNote({ reuseEmpty: true });
  }

  const library = document.createElement('section');
  library.className = 'templates-library';

  const list = document.createElement('div');
  list.className = 'template-list';

  const listTitle = document.createElement('h3');
  listTitle.className = 'template-list-title';
  listTitle.textContent = 'Notes';
  list.appendChild(listTitle);

  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.className = 'template-search-input';
  searchInput.placeholder = 'Search notes';
  searchInput.value = templateSearchQuery;
  searchInput.setAttribute('aria-label', 'Search notes');
  searchInput.addEventListener('input', () => {
    templateSearchQuery = searchInput.value;
    renderProductApp();
    requestAnimationFrame(() => {
      const nextSearchInput = document.querySelector('.template-search-input');
      if (!nextSearchInput) return;
      nextSearchInput.focus();
      nextSearchInput.setSelectionRange(nextSearchInput.value.length, nextSearchInput.value.length);
    });
  });
  list.appendChild(searchInput);

  const matchingDrafts = templateDrafts.filter(template => templateMatchesSearch(template, templateSearchQuery));
  const matchingTemplates = supportTemplates.filter(template => templateMatchesSearch(template, templateSearchQuery));

  if (templateDrafts.length === 0 && supportTemplates.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'template-empty-state';
    emptyState.textContent = 'No notes loaded';
    list.appendChild(emptyState);
  } else if (matchingDrafts.length === 0 && matchingTemplates.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'template-empty-state';
    emptyState.textContent = 'No matching notes';
    list.appendChild(emptyState);
  } else {
    matchingDrafts.forEach((template) => {
      const index = templateDrafts.findIndex(candidate => candidate.id === template.id);
      list.appendChild(createTemplateListItem(template, index, { isDraft: true }));
    });
    matchingTemplates.forEach((template) => {
      const index = supportTemplates.findIndex(candidate => candidate.id === template.id);
      list.appendChild(createTemplateListItem(template, index));
    });
  }

  const editor = document.createElement('div');
  editor.className = 'template-editor';

  const createRow = document.createElement('section');
  createRow.className = 'template-create-row';

  const createLabel = document.createElement('label');
  createLabel.className = 'template-create-label';
  createLabel.htmlFor = 'template-agent-input';
  createLabel.textContent = 'Create note with AI';

  const createInput = document.createElement('textarea');
  createInput.id = 'template-agent-input';
  createInput.className = 'template-agent-input';
  createInput.rows = 1;
  createInput.placeholder = 'Paste text here';
  attachAutoSizingTextarea(createInput);

  const createControls = document.createElement('div');
  createControls.className = 'template-create-controls';

  const createActions = document.createElement('div');
  createActions.className = 'template-generate-row';

  const providerBadge = document.createElement('span');
  providerBadge.className = 'template-provider-badge';
  providerBadge.textContent = getPreferredProviderConfig().label;

  const generateButton = document.createElement('button');
  generateButton.type = 'button';
  generateButton.className = 'save-button template-generate-button';
  generateButton.textContent = 'Generate';
  generateButton.disabled = true;
  generateButton.addEventListener('click', () => {
    handleTemplateGeneration(createInput, generateButton);
  });

  createInput.addEventListener('input', () => {
    generateButton.disabled = createInput.value.trim().length === 0;
  });
  createInput.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      generateButton.click();
    }
  });

  createActions.appendChild(providerBadge);
  createActions.appendChild(generateButton);
  createControls.appendChild(createInput);
  createControls.appendChild(createActions);
  createRow.appendChild(createLabel);
  createRow.appendChild(createControls);
  if (showTemplateCreatePanel) {
    editor.appendChild(createRow);
  }

  const activeIndex = supportTemplates.findIndex(template => template.id === activeTemplateId);
  const activeDraftIndex = templateDrafts.findIndex(template => template.id === activeTemplateId);
  if (activeDraftIndex >= 0) {
    editor.appendChild(createTemplateEditor(templateDrafts[activeDraftIndex], activeDraftIndex, { isDraft: true }));
  } else if (activeIndex >= 0) {
    editor.appendChild(createTemplateEditor(supportTemplates[activeIndex], activeIndex));
  } else {
    const placeholder = document.createElement('div');
    placeholder.className = 'template-editor-placeholder';
    placeholder.textContent = templateDrafts.length > 0 || supportTemplates.length > 0 ? 'Select a note' : 'Load .md files';
    editor.appendChild(placeholder);
  }

  library.appendChild(list);
  library.appendChild(editor);
  workspace.appendChild(library);
}

function formatSupportFileBytes(bytes) {
  const numericBytes = Number(bytes);
  if (!Number.isFinite(numericBytes) || numericBytes < 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = numericBytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function clampSupportTreeWidth(width, layoutWidth = 0) {
  const numericWidth = Number(width);
  const fallbackWidth = Number.isFinite(numericWidth) ? numericWidth : DEFAULT_FILE_SUPPORT_TREE_WIDTH;
  const maxForLayout = layoutWidth > 0
    ? Math.max(MIN_FILE_SUPPORT_TREE_WIDTH, Math.min(MAX_FILE_SUPPORT_TREE_WIDTH, layoutWidth - 360))
    : MAX_FILE_SUPPORT_TREE_WIDTH;

  return Math.round(Math.min(maxForLayout, Math.max(MIN_FILE_SUPPORT_TREE_WIDTH, fallbackWidth)));
}

function getSavedSupportTreeWidth() {
  try {
    return clampSupportTreeWidth(parseInt(localStorage.getItem(FILE_SUPPORT_TREE_WIDTH_STORAGE_KEY), 10));
  } catch (_error) {
    return DEFAULT_FILE_SUPPORT_TREE_WIDTH;
  }
}

function setSupportTreeWidth(width, layout) {
  const layoutWidth = layout ? layout.getBoundingClientRect().width : 0;
  supportFileTreeWidth = clampSupportTreeWidth(width, layoutWidth);
  if (layout) {
    layout.style.setProperty('--file-support-tree-width', `${supportFileTreeWidth}px`);
  }
  try {
    localStorage.setItem(FILE_SUPPORT_TREE_WIDTH_STORAGE_KEY, String(supportFileTreeWidth));
  } catch (_error) {
    // Ignore storage failures; resizing still works for the current session.
  }
}

function startSupportTreeResize(event, layout) {
  if (!layout || (event.pointerType === 'mouse' && event.button !== 0)) return;

  event.preventDefault();
  const startX = event.clientX;
  const startWidth = supportFileTreeWidth;

  layout.classList.add('is-resizing');
  document.body.classList.add('is-file-support-resizing');

  const handlePointerMove = (moveEvent) => {
    setSupportTreeWidth(startWidth + moveEvent.clientX - startX, layout);
  };

  const finishResize = () => {
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', finishResize);
    window.removeEventListener('pointercancel', finishResize);
    layout.classList.remove('is-resizing');
    document.body.classList.remove('is-file-support-resizing');
  };

  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', finishResize);
  window.addEventListener('pointercancel', finishResize);
}

function handleSupportTreeResizerKeydown(event, layout) {
  if (!layout) return;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    setSupportTreeWidth(supportFileTreeWidth + (event.key === 'ArrowRight' ? 24 : -24), layout);
  }
  if (event.key === 'Home') {
    event.preventDefault();
    setSupportTreeWidth(MIN_FILE_SUPPORT_TREE_WIDTH, layout);
  }
  if (event.key === 'End') {
    event.preventDefault();
    setSupportTreeWidth(MAX_FILE_SUPPORT_TREE_WIDTH, layout);
  }
}

function focusSupportSearchInput(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return false;

  if (input.disabled) {
    input.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    return false;
  }

  input.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  input.focus();
  input.select();
  return true;
}

function handleFileSupportSearchShortcut(event) {
  if (activeLineId !== FILE_SUPPORT_VIEW_ID) return;

  const key = String(event.key || '').toLowerCase();
  const inInput = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);
  const hasFile = Boolean(supportFileState.selectedFileId);
  const fileReady = hasFile && !supportFileState.selectedLoading && !supportFileState.selectedError;

  // Ctrl+I: import support file
  if (key === 'i' && (event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey) {
    event.preventDefault();
    handleSupportFileImport();
    return;
  }

  // Ctrl+O: open saved files
  if (key === 'o' && (event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey) {
    event.preventDefault();
    openSavedSupportFilesModal();
    return;
  }

  // Esc: close shortcuts modal, summary, or exit fullscreen
  if (event.key === 'Escape') {
    const shortcutsModal = document.getElementById('file-support-shortcuts-modal');
    if (shortcutsModal && shortcutsModal.style.display === 'flex') {
      shortcutsModal.style.display = 'none';
      return;
    }
    if (supportFileState.summaryVisible) {
      event.preventDefault();
      supportFileState = { ...supportFileState, summaryVisible: false };
      renderProductApp();
      return;
    }
    if (supportFileViewerFullscreen) {
      event.preventDefault();
      supportFileViewerFullscreen = false;
      renderProductApp();
      return;
    }
  }

  // F (bare): toggle fullscreen
  if (key === 'f' && !event.ctrlKey && !event.metaKey && !event.altKey && !inInput) {
    if (hasFile) {
      event.preventDefault();
      supportFileViewerFullscreen = !supportFileViewerFullscreen;
      renderProductApp();
    }
    return;
  }

  // Ctrl+F: focus search input (existing)
  if (key === 'f' && (event.ctrlKey || event.metaKey) && !event.altKey) {
    event.preventDefault();
    event.stopPropagation();
    const inputId = event.shiftKey
      ? 'file-support-tree-search'
      : 'file-support-content-search';
    const focused = focusSupportSearchInput(inputId);
    if (!focused && inputId === 'file-support-content-search') {
      showNotification('Select a file first');
    }
    return;
  }

  // Ctrl+G: toggle grep
  if (key === 'g' && event.ctrlKey && !event.metaKey && !event.altKey) {
    if (fileReady) {
      event.preventDefault();
      supportGrepEnabled = !supportGrepEnabled;
      renderProductApp();
    }
    return;
  }

  // Ctrl+C: toggle cut (only when grep is active so copy still works normally)
  if (key === 'c' && event.ctrlKey && !event.metaKey && !event.altKey && supportGrepEnabled && fileReady) {
    event.preventDefault();
    supportGrepCutMatches = !supportGrepCutMatches;
    renderProductApp();
    return;
  }
}

function setupFileSupportKeyboardShortcuts() {
  document.addEventListener('keydown', handleFileSupportSearchShortcut);
}

function normalizeSearchQuery(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function fuzzyMatchIndexes(text, query) {
  const source = String(text || '');
  const normalizedSource = source.toLowerCase();
  const normalizedQuery = String(query || '').toLowerCase().replace(/\s+/g, '');
  if (!normalizedQuery) {
    return { matched: true, indexes: [] };
  }

  const indexes = [];
  let sourceIndex = 0;
  for (const character of normalizedQuery) {
    const matchIndex = normalizedSource.indexOf(character, sourceIndex);
    if (matchIndex === -1) {
      return { matched: false, indexes: [] };
    }
    indexes.push(matchIndex);
    sourceIndex = matchIndex + 1;
  }

  return { matched: true, indexes };
}

function fuzzySearchMatches(text, query) {
  const terms = normalizeSearchQuery(query).split(' ').filter(Boolean);
  if (terms.length === 0) return true;
  return terms.every(term => fuzzyMatchIndexes(text, term).matched);
}

function highlightFuzzyLabel(label, query) {
  const text = String(label || '');
  const terms = normalizeSearchQuery(query).split(' ').filter(Boolean);
  if (terms.length === 0) return escapeHTML(text);

  const matchedIndexes = new Set();
  terms.forEach(term => {
    const result = fuzzyMatchIndexes(text, term);
    if (result.matched) {
      result.indexes.forEach(index => matchedIndexes.add(index));
    }
  });

  if (matchedIndexes.size === 0) return escapeHTML(text);

  return Array.from(text).map((character, index) => {
    const escapedCharacter = escapeHTML(character);
    return matchedIndexes.has(index)
      ? `<span class="support-search-char">${escapedCharacter}</span>`
      : escapedCharacter;
  }).join('');
}

function filterSupportTreeNodes(nodes, query) {
  const normalizedQuery = normalizeSearchQuery(query);
  if (!normalizedQuery) {
    return {
      nodes,
      matchCount: 0
    };
  }

  let matchCount = 0;
  const filteredNodes = nodes.reduce((matches, node) => {
    const childResult = Array.isArray(node.children)
      ? filterSupportTreeNodes(node.children, normalizedQuery)
      : { nodes: [], matchCount: 0 };
    const selfMatches = fuzzySearchMatches(`${node.path || ''} ${node.name || ''}`, normalizedQuery);
    matchCount += childResult.matchCount + (selfMatches ? 1 : 0);

    if (selfMatches || childResult.nodes.length > 0) {
      matches.push({
        ...node,
        children: childResult.nodes,
        searchMatched: selfMatches
      });
    }

    return matches;
  }, []);

  return {
    nodes: filteredNodes,
    matchCount
  };
}

function escapeHTML(value) {
  return String(value || '').replace(/[&<>"']/g, (character) => {
    if (character === '&') return '&amp;';
    if (character === '<') return '&lt;';
    if (character === '>') return '&gt;';
    if (character === '"') return '&quot;';
    return '&#39;';
  });
}

function highlightJSONContent(text) {
  return String(text || '').replace(
    /("(?:\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"\s*:)|("(?:\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*")|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g,
    (match) => {
      const escapedMatch = escapeHTML(match);
      if (/^"/.test(match) && /:\s*$/.test(match)) {
        return `<span class="support-token-key">${escapedMatch}</span>`;
      }
      if (/^"/.test(match)) {
        return `<span class="support-token-string">${escapedMatch}</span>`;
      }
      if (/true|false/.test(match)) {
        return `<span class="support-token-boolean">${escapedMatch}</span>`;
      }
      if (/null/.test(match)) {
        return `<span class="support-token-null">${escapedMatch}</span>`;
      }
      return `<span class="support-token-number">${escapedMatch}</span>`;
    }
  );
}

function highlightXMLContent(text) {
  return escapeHTML(text).replace(
    /(&lt;\/?)([A-Za-z_][\w:.-]*)(.*?)(\/?&gt;)/g,
    (_match, open, tagName, attributes, close) => {
      const highlightedAttributes = attributes.replace(
        /([A-Za-z_][\w:.-]*)(=)(&quot;.*?&quot;|&#39;.*?&#39;)/g,
        '<span class="support-token-key">$1</span>$2<span class="support-token-string">$3</span>'
      );
      return `<span class="support-token-punctuation">${open}</span><span class="support-token-tag">${tagName}</span>${highlightedAttributes}<span class="support-token-punctuation">${close}</span>`;
    }
  );
}

function highlightContentLine(line, patterns) {
  const ranges = [];
  patterns.forEach(pattern => {
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags.includes('g') ? pattern.regex.flags : `${pattern.regex.flags}g`);
    let match = regex.exec(line);
    while (match) {
      if (match[0].length === 0) {
        regex.lastIndex += 1;
      } else {
        ranges.push({
          start: match.index,
          end: match.index + match[0].length,
          className: pattern.className
        });
      }
      match = regex.exec(line);
    }
  });

  const selectedRanges = ranges
    .sort((a, b) => a.start - b.start || b.end - a.end)
    .reduce((accepted, range) => {
      const previous = accepted[accepted.length - 1];
      if (!previous || range.start >= previous.end) {
        accepted.push(range);
      }
      return accepted;
    }, []);

  let cursor = 0;
  let html = '';
  selectedRanges.forEach(range => {
    html += escapeHTML(line.slice(cursor, range.start));
    html += `<span class="${range.className}">${escapeHTML(line.slice(range.start, range.end))}</span>`;
    cursor = range.end;
  });
  html += escapeHTML(line.slice(cursor));
  return html;
}

function highlightLinesWithPatterns(text, patterns) {
  return String(text || '').split('\n').map(line => highlightContentLine(line, patterns)).join('\n');
}

function highlightScalaContent(text) {
  return highlightLinesWithPatterns(text, [
    { regex: /\/\/.*/, className: 'support-token-comment' },
    { regex: /\/\*[\s\S]*?\*\//g, className: 'support-token-comment' },
    { regex: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, className: 'support-token-string' },
    { regex: /\b(abstract|case|catch|class|def|derives|do|else|enum|export|extends|false|final|finally|for|given|if|implicit|import|lazy|macro|match|new|null|object|opaque|override|package|private|protected|return|sealed|super|then|this|throw|trait|transparent|true|try|type|val|var|while|with|yield)\b/g, className: 'support-token-key' },
    { regex: /\b(Boolean|Byte|Char|Double|Either|Float|Future|Int|List|Long|Map|None|Option|Seq|Set|Short|Some|String|Unit|Vector)\b/g, className: 'support-token-boolean' },
    { regex: /[@][A-Za-z_][\w]*(?:\.[A-Za-z_][\w]*)*/g, className: 'support-token-variable' },
    { regex: /\b[A-Za-z_][\w]*(?=\s*(?:\(|\[))/g, className: 'support-token-function' },
    { regex: /\/(?:[\w.-]+\/?)+/g, className: 'support-token-path' },
    { regex: /\b-?\d+(?:\.\d+)?\b/g, className: 'support-token-number' }
  ]);
}

function highlightPythonContent(text) {
  return highlightLinesWithPatterns(text, [
    { regex: /#.*/, className: 'support-token-comment' },
    { regex: /("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/g, className: 'support-token-string' },
    { regex: /\b(def|class|import|from|as|if|elif|else|for|while|try|except|finally|with|return|yield|raise|pass|break|continue|lambda|global|nonlocal|assert|async|await|in|is|not|and|or)\b/g, className: 'support-token-key' },
    { regex: /\b(True|False|None)\b/g, className: 'support-token-boolean' },
    { regex: /\b[A-Za-z_][\w]*(?=\s*\()/g, className: 'support-token-function' },
    { regex: /\/(?:[\w.-]+\/?)+/g, className: 'support-token-path' },
    { regex: /\b-?\d+(?:\.\d+)?\b/g, className: 'support-token-number' }
  ]);
}

function highlightRubyContent(text) {
  return highlightLinesWithPatterns(text, [
    { regex: /#.*/, className: 'support-token-comment' },
    { regex: /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|%[qQ]?\{[^}]*\})/g, className: 'support-token-string' },
    { regex: /\b(BEGIN|END|alias|and|begin|break|case|class|def|defined\?|do|else|elsif|end|ensure|false|for|if|in|module|next|nil|not|or|redo|rescue|retry|return|self|super|then|true|undef|unless|until|when|while|yield|require|include|extend|attr_reader|attr_writer|attr_accessor)\b/g, className: 'support-token-key' },
    { regex: /[@$]{1,2}[A-Za-z_][\w]*|:[A-Za-z_][\w!?=]*/g, className: 'support-token-variable' },
    { regex: /\b[A-Za-z_][\w!?=]*(?=\s*(?:\(|\{|\bdo\b))/g, className: 'support-token-function' },
    { regex: /\/(?:[\w.-]+\/?)+/g, className: 'support-token-path' },
    { regex: /\b-?\d+(?:\.\d+)?\b/g, className: 'support-token-number' }
  ]);
}

function highlightLogContent(text) {
  return highlightLinesWithPatterns(text, [
    { regex: /\b(?:\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:[.,]\d+)?Z?|\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})\b/g, className: 'support-token-number' },
    { regex: /\b(ERROR|ERR|FAIL|FAILED|CRITICAL|FATAL|WARN|WARNING|NOTICE|INFO|DEBUG|TRACE)\b/gi, className: 'support-token-log-level' },
    { regex: /\/(?:[\w.-]+\/?)+/g, className: 'support-token-path' },
    { regex: /\b(?:pid|uid|gid|status|code|port|addr|host|interface|device)=?[\w.:-]+\b/gi, className: 'support-token-key' },
    { regex: /\b(?:true|false|enabled|disabled|up|down|running|stopped|active|inactive|failed)\b/gi, className: 'support-token-boolean' },
    { regex: /\b-?\d+(?:\.\d+)?\b/g, className: 'support-token-number' }
  ]);
}

function highlightGenericTextContent(text) {
  return String(text || '').split('\n').map((line) => {
    const escapedLine = escapeHTML(line);

    if (/^\s*(#|;|\/\/)/.test(line)) {
      return `<span class="support-token-comment">${escapedLine}</span>`;
    }

    return escapedLine
      .replace(/^(\s*)([A-Za-z0-9_.-]+)(\s*[:=])/, '$1<span class="support-token-key">$2</span>$3')
      .replace(/(&quot;[^&]*?&quot;|&#39;[^&]*?&#39;)/g, '<span class="support-token-string">$1</span>')
      .replace(/\b(true|false|enabled|disabled|up|down|running|stopped)\b/gi, '<span class="support-token-boolean">$1</span>')
      .replace(/\b(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/g, '<span class="support-token-number">$1</span>');
  }).join('\n');
}

function getSupportContentPresentation(filePath, content, viewMode = 'auto') {
  const rawContent = String(content || '');
  const trimmedContent = rawContent.trim();
  const extension = filePath.split('.').pop()?.toLowerCase() || '';
  const canHighlight = rawContent.length <= MAX_HIGHLIGHTED_CONTENT_CHARS;
  const requestedMode = ['ruby', 'scala', 'python', 'log'].includes(viewMode) ? viewMode : 'auto';

  if (!canHighlight) {
    return {
      mode: 'plain',
      text: rawContent,
      html: escapeHTML(rawContent)
    };
  }

  if (requestedMode === 'scala') {
    return {
      mode: 'scala',
      text: rawContent,
      html: highlightScalaContent(rawContent)
    };
  }

  if (requestedMode === 'python') {
    return {
      mode: 'python',
      text: rawContent,
      html: highlightPythonContent(rawContent)
    };
  }

  if (requestedMode === 'ruby') {
    return {
      mode: 'ruby',
      text: rawContent,
      html: highlightRubyContent(rawContent)
    };
  }

  if (requestedMode === 'log') {
    return {
      mode: 'log',
      text: rawContent,
      html: highlightLogContent(rawContent)
    };
  }

  const couldBeJSON = extension === 'json' || /^[\[{]/.test(trimmedContent);
  if (couldBeJSON) {
    try {
      const formattedJSON = JSON.stringify(JSON.parse(trimmedContent), null, 2);
      return {
        mode: 'json',
        text: formattedJSON,
        html: highlightJSONContent(formattedJSON)
      };
    } catch (_error) {
      // Fall through to generic highlighting for malformed JSON-like files.
    }
  }

  if (extension === 'xml' || /^<\?xml|^<[A-Za-z]/.test(trimmedContent)) {
    return {
      mode: 'xml',
      text: rawContent,
      html: highlightXMLContent(rawContent)
    };
  }

  return {
    mode: 'generic',
    text: rawContent,
    html: highlightGenericTextContent(rawContent)
  };
}

function highlightSupportContentSegment(text, mode) {
  if (mode === 'json') return highlightJSONContent(text);
  if (mode === 'xml') return highlightXMLContent(text);
  if (mode === 'scala') return highlightScalaContent(text);
  if (mode === 'python') return highlightPythonContent(text);
  if (mode === 'ruby') return highlightRubyContent(text);
  if (mode === 'log') return highlightLogContent(text);
  if (mode === 'generic') return highlightGenericTextContent(text);
  return escapeHTML(text);
}

function findContentSearchRanges(text, query) {
  const source = String(text || '');
  const normalizedSource = source.toLowerCase();
  const terms = normalizeSearchQuery(query).split(' ').filter(Boolean);
  if (terms.length === 0 || source.length === 0) {
    return [];
  }

  const ranges = [];
  terms.forEach(term => {
    const normalizedTerm = term.toLowerCase();
    let index = normalizedSource.indexOf(normalizedTerm);
    while (index !== -1) {
      ranges.push({
        start: index,
        end: index + normalizedTerm.length
      });
      index = normalizedSource.indexOf(normalizedTerm, index + Math.max(1, normalizedTerm.length));
    }
  });

  return ranges
    .sort((a, b) => a.start - b.start || b.end - a.end)
    .reduce((mergedRanges, range) => {
      const previous = mergedRanges[mergedRanges.length - 1];
      if (!previous || range.start > previous.end) {
        mergedRanges.push({ ...range });
        return mergedRanges;
      }
      previous.end = Math.max(previous.end, range.end);
      return mergedRanges;
    }, []);
}

function escapeRegExp(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseSupportGrepQuery(query) {
  let pattern = String(query || '').trim();
  let ignoreCase = supportGrepIgnoreCase;

  pattern = pattern.replace(/^(?:rg|ripgrep|grep)\s+/i, '').trim();
  let flagMatch = pattern.match(/^(-[A-Za-z]+)\s+/);
  while (flagMatch) {
    if (flagMatch[1].includes('i')) {
      ignoreCase = true;
    }
    pattern = pattern.slice(flagMatch[0].length).trim();
    flagMatch = pattern.match(/^(-[A-Za-z]+)\s+/);
  }

  return { pattern, ignoreCase };
}

function createSupportGrepRegex(pattern, ignoreCase) {
  if (!pattern) return { regex: null, literal: false, error: '' };
  try {
    return {
      regex: new RegExp(pattern, ignoreCase ? 'gi' : 'g'),
      literal: false,
      error: ''
    };
  } catch (error) {
    try {
      return {
        regex: new RegExp(escapeRegExp(pattern), ignoreCase ? 'gi' : 'g'),
        literal: true,
        error: ''
      };
    } catch (_literalError) {
      return { regex: null, literal: false, error: error.message || 'Invalid grep pattern' };
    }
  }
}

function supportGrepLineMatches(line, regex) {
  if (!regex) return false;
  regex.lastIndex = 0;
  const matched = regex.test(line);
  regex.lastIndex = 0;
  return matched;
}

function highlightSupportGrepLine(line, regex) {
  if (!regex) return escapeHTML(line);

  let html = '';
  let cursor = 0;
  regex.lastIndex = 0;
  let match = regex.exec(line);

  while (match) {
    const value = match[0];
    if (!value) {
      regex.lastIndex += 1;
      match = regex.exec(line);
      continue;
    }

    html += escapeHTML(line.slice(cursor, match.index));
    html += `<mark class="support-content-match">${escapeHTML(value)}</mark>`;
    cursor = match.index + value.length;
    match = regex.exec(line);
  }

  html += escapeHTML(line.slice(cursor));
  regex.lastIndex = 0;
  return html;
}

function getSupportGrepPresentation(content, query) {
  const { pattern, ignoreCase } = parseSupportGrepQuery(query);
  const { regex, literal, error } = createSupportGrepRegex(pattern, ignoreCase);
  const source = String(content || '');
  const lines = source.split('\n');

  if (!pattern) {
    return {
      mode: 'grep',
      html: escapeHTML(source),
      lineCount: lines.length,
      matchLineCount: 0,
      shownLineCount: lines.length,
      hiddenLineCount: 0,
      ignoreCase,
      literal,
      error: ''
    };
  }

  if (error || !regex) {
    return {
      mode: 'grep',
      html: escapeHTML(source),
      lineCount: lines.length,
      matchLineCount: 0,
      shownLineCount: lines.length,
      hiddenLineCount: 0,
      ignoreCase,
      literal,
      error
    };
  }

  let matchLineCount = 0;
  let hiddenLineCount = 0;
  const renderedLines = [];

  lines.forEach((line, index) => {
    const matched = supportGrepLineMatches(line, regex);
    if (matched) matchLineCount += 1;

    const keepLine = supportGrepCutMatches ? !matched : matched;
    if (!keepLine) {
      hiddenLineCount += 1;
      return;
    }

    const number = String(index + 1).padStart(String(lines.length).length, ' ');
    const lineHTML = supportGrepCutMatches
      ? escapeHTML(line)
      : highlightSupportGrepLine(line, regex);
    renderedLines.push(`<span class="support-grep-line-number">${number}:</span>${lineHTML}`);
  });

  return {
    mode: 'grep',
    html: renderedLines.length
      ? renderedLines.join('\n')
      : '<span class="support-grep-empty">No lines to show</span>',
    lineCount: lines.length,
    matchLineCount,
    shownLineCount: renderedLines.length,
    hiddenLineCount,
    ignoreCase,
    literal,
    error: ''
  };
}

function getSupportContentSearchPresentation(filePath, content, query, viewMode = 'auto') {
  if (supportGrepEnabled) {
    return getSupportGrepPresentation(content, query);
  }

  const presentation = getSupportContentPresentation(filePath, content, viewMode);
  const normalizedQuery = normalizeSearchQuery(query);

  if (!normalizedQuery || presentation.text.length > MAX_HIGHLIGHTED_CONTENT_CHARS) {
    return {
      ...presentation,
      matchCount: 0
    };
  }

  const ranges = findContentSearchRanges(presentation.text, normalizedQuery);
  if (ranges.length === 0) {
    return {
      ...presentation,
      matchCount: 0
    };
  }

  let cursor = 0;
  let html = '';
  ranges.forEach(range => {
    html += highlightSupportContentSegment(presentation.text.slice(cursor, range.start), presentation.mode);
    html += `<mark class="support-content-match">${highlightSupportContentSegment(presentation.text.slice(range.start, range.end), presentation.mode)}</mark>`;
    cursor = range.end;
  });
  html += highlightSupportContentSegment(presentation.text.slice(cursor), presentation.mode);

  return {
    ...presentation,
    html,
    matchCount: ranges.length
  };
}

function getSupportViewerSelectionText(container, fallbackTarget) {
  const selection = window.getSelection?.();
  const anchorNode = selection?.anchorNode;
  const focusNode = selection?.focusNode;
  const selectionInsideViewer = selection
    && selection.rangeCount > 0
    && anchorNode
    && focusNode
    && container.contains(anchorNode)
    && container.contains(focusNode);

  const selectedText = selectionInsideViewer ? selection.toString() : '';
  const fallbackText = fallbackTarget instanceof Element && container.contains(fallbackTarget)
    ? fallbackTarget.closest('mark, span')?.textContent || ''
    : '';

  return String(selectedText || fallbackText || '')
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 240);
}

function applySupportViewerSelectionToSearch(container, fallbackTarget) {
  const selectedText = getSupportViewerSelectionText(container, fallbackTarget);
  if (!selectedText) return;

  if (supportAdvancedSearch.active) {
    addTermToAdvancedSearch(selectedText);
    return;
  }

  supportContentSearchQuery = selectedText;
  renderProductApp();
  requestAnimationFrame(() => {
    const nextInput = document.getElementById('file-support-content-search');
    if (!nextInput) return;
    nextInput.focus();
    nextInput.setSelectionRange(nextInput.value.length, nextInput.value.length);
  });
}

// --- Advanced cross-file search (renderer) ----------------------------------

function parseAdvancedSearchTerms(query) {
  const tokens = String(query || '').trim().split(/\s+/).filter(Boolean);
  const include = [];
  const exclude = [];
  tokens.forEach(token => {
    if ((token.startsWith('-') || token.startsWith('!')) && token.length > 1) {
      exclude.push(token.slice(1));
    } else if (token.startsWith('+') && token.length > 1) {
      include.push(token.slice(1));
    } else {
      include.push(token);
    }
  });
  return { include, exclude };
}

function refocusAdvancedSearchInput() {
  if (!supportAdvancedSearch.active || supportAdvancedSearch.viewingResult) return;
  requestAnimationFrame(() => {
    const input = document.getElementById('file-support-advanced-search');
    if (!input || input.disabled) return;
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  });
}

function scheduleAdvancedSearch() {
  if (supportAdvancedSearchDebounce) clearTimeout(supportAdvancedSearchDebounce);
  supportAdvancedSearchDebounce = setTimeout(() => {
    supportAdvancedSearchDebounce = null;
    runAdvancedSearch();
  }, 250);
}

function runAdvancedSearch() {
  const api = getNetworkAPI();
  const sessionId = supportFileState.sessionId;
  if (!api || typeof api.searchSupportArchive !== 'function' || !sessionId) {
    supportAdvancedSearch = { ...supportAdvancedSearch, results: null, loading: false };
    return;
  }

  const query = supportAdvancedSearch.query;
  if (!normalizeSearchQuery(query)) {
    supportAdvancedSearch = { ...supportAdvancedSearch, results: null, error: '', loading: false };
    renderProductApp();
    refocusAdvancedSearchInput();
    return;
  }

  const { include, exclude } = parseAdvancedSearchTerms(query);
  const token = ++supportAdvancedSearchToken;
  supportAdvancedSearch = { ...supportAdvancedSearch, loading: true, error: '' };

  const options = {
    query,
    include,
    exclude,
    grep: supportAdvancedSearch.grepEnabled,
    ignoreCase: supportAdvancedSearch.ignoreCase,
    cut: supportAdvancedSearch.cut,
    fileFilters: Array.from(supportAdvancedSearch.fileFilters),
    scope: supportAdvancedSearch.scope,
    currentFileId: supportFileState.selectedFileId
  };

  api.searchSupportArchive(sessionId, options).then(result => {
    if (token !== supportAdvancedSearchToken) return;
    if (!result || !result.success) {
      supportAdvancedSearch = { ...supportAdvancedSearch, loading: false, results: null, error: result?.error || 'Search failed' };
    } else {
      supportAdvancedSearch = { ...supportAdvancedSearch, loading: false, results: result, error: result.grepError || '' };
    }
    renderProductApp();
    refocusAdvancedSearchInput();
  }).catch(error => {
    if (token !== supportAdvancedSearchToken) return;
    supportAdvancedSearch = { ...supportAdvancedSearch, loading: false, results: null, error: error.message || 'Search failed' };
    renderProductApp();
    refocusAdvancedSearchInput();
  });
}

function setAdvancedSearchActive(active) {
  supportAdvancedSearch = { ...supportAdvancedSearch, active, viewingResult: false };
  renderProductApp();
  if (active) {
    refocusAdvancedSearchInput();
    if (normalizeSearchQuery(supportAdvancedSearch.query) && !supportAdvancedSearch.results) {
      runAdvancedSearch();
    }
  }
}

function addTermToAdvancedSearch(word) {
  const term = String(word || '').replace(/\s+/g, ' ').trim();
  if (!term) return;
  const existing = supportAdvancedSearch.query.trim();
  const tokens = existing ? existing.split(/\s+/) : [];
  if (tokens.includes(term)) return;
  supportAdvancedSearch = {
    ...supportAdvancedSearch,
    query: existing ? `${existing} ${term}` : term
  };
  renderProductApp();
  scheduleAdvancedSearch();
  refocusAdvancedSearchInput();
}

async function openAdvancedSearchResult(file, lineNumber) {
  if (!file) return;
  const { include } = parseAdvancedSearchTerms(supportAdvancedSearch.query);
  const pattern = supportAdvancedSearch.grepEnabled
    ? supportAdvancedSearch.query
    : include.map(escapeRegExp).filter(Boolean).join('|');

  supportAdvancedSearch = { ...supportAdvancedSearch, viewingResult: true };
  supportGrepEnabled = true;
  supportGrepCutMatches = false;
  supportGrepIgnoreCase = supportAdvancedSearch.ignoreCase;
  supportContentSearchQuery = pattern;

  const node = findSupportNodeById(supportFileState.tree, file.id) || { id: file.id, path: file.path, type: 'file' };
  await handleSupportFileSelection(node);
  requestAnimationFrame(() => scrollSupportViewerToMatch(lineNumber));
}

function scrollSupportViewerToMatch(lineNumber) {
  const body = document.querySelector('.file-support-viewer-body');
  if (!body) return;
  if (lineNumber) {
    const numbers = body.querySelectorAll('.support-grep-line-number');
    for (const el of numbers) {
      if (parseInt(el.textContent, 10) === lineNumber) {
        el.scrollIntoView({ block: 'center' });
        return;
      }
    }
  }
  const mark = body.querySelector('.support-content-match');
  if (mark) mark.scrollIntoView({ block: 'center' });
}

function highlightAdvancedSearchLine(text) {
  const raw = String(text || '');
  if (supportAdvancedSearch.grepEnabled) {
    const { pattern } = parseSupportGrepQuery(supportAdvancedSearch.query);
    const { regex } = createSupportGrepRegex(pattern, supportAdvancedSearch.ignoreCase);
    return regex ? highlightSupportGrepLine(raw, regex) : escapeHTML(raw);
  }
  const { include } = parseAdvancedSearchTerms(supportAdvancedSearch.query);
  const escaped = include.map(escapeRegExp).filter(Boolean);
  if (escaped.length === 0) return escapeHTML(raw);
  let regex;
  try {
    regex = new RegExp(`(${escaped.join('|')})`, supportAdvancedSearch.ignoreCase ? 'gi' : 'g');
  } catch (_error) {
    return escapeHTML(raw);
  }
  return highlightSupportGrepLine(raw, regex);
}

function makeAdvancedToggleButton(label, pressed, title, onToggle) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'file-support-grep-button';
  button.textContent = label;
  button.title = title;
  button.setAttribute('aria-pressed', pressed ? 'true' : 'false');
  button.addEventListener('click', () => {
    onToggle();
    renderProductApp();
    runAdvancedSearch();
    refocusAdvancedSearchInput();
  });
  return button;
}

function makeAdvancedFilterChip(label, active, title, onToggle, disabled = false) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'file-support-advanced-chip';
  button.textContent = label;
  if (title) button.title = title;
  button.disabled = disabled;
  button.setAttribute('aria-pressed', active ? 'true' : 'false');
  button.addEventListener('click', () => {
    onToggle();
    renderProductApp();
    runAdvancedSearch();
    refocusAdvancedSearchInput();
  });
  return button;
}

function buildAdvancedSearchBar() {
  const wrap = document.createElement('div');
  wrap.className = 'file-support-search file-support-advanced-search';

  const row = document.createElement('div');
  row.className = 'file-support-advanced-row';

  const input = document.createElement('input');
  input.type = 'search';
  input.id = 'file-support-advanced-search';
  input.className = 'file-support-search-input';
  input.placeholder = supportAdvancedSearch.grepEnabled
    ? 'grep across files, e.g. -i error|fail'
    : 'Search across files: words = AND, -word = exclude';
  input.value = supportAdvancedSearch.query;
  input.setAttribute('aria-label', 'Advanced search across files');
  input.addEventListener('input', () => {
    supportAdvancedSearch = { ...supportAdvancedSearch, query: input.value };
    renderProductApp();
    refocusAdvancedSearchInput();
    scheduleAdvancedSearch();
  });
  row.appendChild(input);

  const grepControls = document.createElement('div');
  grepControls.className = 'file-support-grep-controls';
  grepControls.appendChild(makeAdvancedToggleButton('grep', supportAdvancedSearch.grepEnabled, 'Treat the query as a regular expression', () => {
    supportAdvancedSearch.grepEnabled = !supportAdvancedSearch.grepEnabled;
  }));
  grepControls.appendChild(makeAdvancedToggleButton('-i', supportAdvancedSearch.ignoreCase, 'Ignore uppercase and lowercase differences', () => {
    supportAdvancedSearch.ignoreCase = !supportAdvancedSearch.ignoreCase;
  }));
  grepControls.appendChild(makeAdvancedToggleButton('Cut', supportAdvancedSearch.cut, 'Show lines that do NOT match', () => {
    supportAdvancedSearch.cut = !supportAdvancedSearch.cut;
  }));
  row.appendChild(grepControls);
  wrap.appendChild(row);

  const filters = document.createElement('div');
  filters.className = 'file-support-advanced-filters';
  filters.appendChild(makeAdvancedFilterChip('All files', supportAdvancedSearch.scope === 'all', 'Search every file in the archive', () => {
    supportAdvancedSearch.scope = 'all';
  }));
  filters.appendChild(makeAdvancedFilterChip('Current file', supportAdvancedSearch.scope === 'current', 'Search only the currently open file', () => {
    supportAdvancedSearch.scope = 'current';
  }, !supportFileState.selectedFileId));

  const separator = document.createElement('span');
  separator.className = 'file-support-advanced-sep';
  filters.appendChild(separator);

  [['json', 'JSON'], ['logs', 'Logs'], ['config', 'Config']].forEach(([key, label]) => {
    const active = supportAdvancedSearch.fileFilters.has(key);
    filters.appendChild(makeAdvancedFilterChip(label, active, `Only ${label} files`, () => {
      if (supportAdvancedSearch.fileFilters.has(key)) supportAdvancedSearch.fileFilters.delete(key);
      else supportAdvancedSearch.fileFilters.add(key);
    }));
  });
  wrap.appendChild(filters);

  const status = document.createElement('div');
  status.className = 'file-support-advanced-status';
  if (supportAdvancedSearch.loading) {
    status.textContent = 'Searching...';
  } else if (supportAdvancedSearch.error) {
    status.textContent = supportAdvancedSearch.error;
    status.classList.add('is-error');
  } else if (supportAdvancedSearch.results && normalizeSearchQuery(supportAdvancedSearch.query)) {
    const result = supportAdvancedSearch.results;
    const matchLabel = result.totalMatches === 1 ? '1 match' : `${result.totalMatches} matches`;
    const fileLabel = result.totalFiles === 1 ? '1 file' : `${result.totalFiles} files`;
    status.textContent = `${matchLabel} in ${fileLabel}${result.truncated ? ' (truncated)' : ''}`;
  } else {
    status.textContent = 'Type to search across the archive. Double-click a result word to add it.';
  }
  wrap.appendChild(status);

  return wrap;
}

function renderAdvancedSearchResults(parent) {
  if (supportFileState.tree.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'file-support-empty-state';
    empty.textContent = 'Import a file';
    parent.appendChild(empty);
    return;
  }
  if (!normalizeSearchQuery(supportAdvancedSearch.query)) {
    const empty = document.createElement('div');
    empty.className = 'file-support-empty-state';
    empty.textContent = 'Type a query to search across all files in this archive.';
    parent.appendChild(empty);
    return;
  }
  if (supportAdvancedSearch.loading && !supportAdvancedSearch.results) {
    const loading = document.createElement('div');
    loading.className = 'file-support-empty-state';
    loading.textContent = 'Searching...';
    parent.appendChild(loading);
    return;
  }

  const results = supportAdvancedSearch.results;
  if (!results || results.files.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'file-support-empty-state';
    empty.textContent = supportAdvancedSearch.error || 'No matches found.';
    parent.appendChild(empty);
    return;
  }

  const container = document.createElement('div');
  container.className = 'file-support-advanced-results';

  results.files.forEach(file => {
    const group = document.createElement('div');
    group.className = 'file-support-result-group';

    const head = document.createElement('button');
    head.type = 'button';
    head.className = 'file-support-result-head';
    head.title = `Open ${file.path}`;
    const pathSpan = document.createElement('span');
    pathSpan.className = 'file-support-result-path';
    pathSpan.textContent = file.path;
    head.appendChild(pathSpan);
    (file.tags || []).forEach(tag => {
      const badge = document.createElement('span');
      badge.className = `file-support-result-badge badge-${tag}`;
      badge.textContent = tag;
      head.appendChild(badge);
    });
    const count = document.createElement('span');
    count.className = 'file-support-result-count';
    count.textContent = file.matchCount === 1 ? '1 match' : `${file.matchCount} matches`;
    head.appendChild(count);
    head.addEventListener('click', () => openAdvancedSearchResult(file, file.lines[0]?.n || 1));
    group.appendChild(head);

    const lines = document.createElement('div');
    lines.className = 'file-support-result-lines';
    file.lines.forEach(line => {
      const lineEl = document.createElement('div');
      lineEl.className = 'file-support-result-line';
      const number = document.createElement('span');
      number.className = 'file-support-result-line-number';
      number.textContent = line.n;
      const lineText = document.createElement('span');
      lineText.className = 'file-support-result-line-text';
      lineText.innerHTML = highlightAdvancedSearchLine(line.text);
      lineEl.appendChild(number);
      lineEl.appendChild(lineText);
      lineEl.addEventListener('click', () => {
        if (supportAdvancedResultClickTimer) clearTimeout(supportAdvancedResultClickTimer);
        supportAdvancedResultClickTimer = setTimeout(() => {
          supportAdvancedResultClickTimer = null;
          openAdvancedSearchResult(file, line.n);
        }, 220);
      });
      lineEl.addEventListener('dblclick', (event) => {
        if (supportAdvancedResultClickTimer) {
          clearTimeout(supportAdvancedResultClickTimer);
          supportAdvancedResultClickTimer = null;
        }
        const selected = getSupportViewerSelectionText(lineEl, event.target);
        if (selected) addTermToAdvancedSearch(selected);
      });
      lines.appendChild(lineEl);
    });
    group.appendChild(lines);

    if (file.truncated) {
      const more = document.createElement('div');
      more.className = 'file-support-result-more';
      more.textContent = 'More matches in this file not shown';
      group.appendChild(more);
    }
    container.appendChild(group);
  });

  if (results.truncated) {
    const note = document.createElement('div');
    note.className = 'file-support-warning';
    note.textContent = 'Results truncated. Refine your query or add filters to narrow down.';
    container.appendChild(note);
  }

  parent.appendChild(container);
}

function findSupportNodeById(nodes, entryId) {
  if (!entryId) return null;
  for (const node of nodes || []) {
    if (node.id === entryId) return node;
    const childMatch = findSupportNodeById(node.children, entryId);
    if (childMatch) return childMatch;
  }
  return null;
}

function selectSupportSummaryFile(entryId) {
  const node = findSupportNodeById(supportFileState.tree, entryId);
  if (!node || node.type !== 'file') {
    showNotification('File is not available in this support archive');
    return;
  }
  handleSupportFileSelection(node);
}

function getSupportDashboardTone(value, explicitTone = '') {
  if (explicitTone) return explicitTone;
  const normalizedValue = String(value || '').toLowerCase();
  if (/\b(warn|error|fail|failed|down|inactive|not connected|unavailable|missing|untested)\b/.test(normalizedValue)) return 'warning';
  if (/\b(up|connected|active|passing|present|enabled|true|ok|ready)\b/.test(normalizedValue)) return 'good';
  return 'neutral';
}

function createSupportSummarySourceButton(entryId, path, fallbackLabel = 'Open source file') {
  if (!entryId) return null;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'file-support-summary-link';
  button.textContent = path || fallbackLabel;
  button.addEventListener('click', () => selectSupportSummaryFile(entryId));
  return button;
}

function appendSupportDashboardFields(parent, items) {
  if (!Array.isArray(items) || items.length === 0) return;
  const grid = document.createElement('div');
  grid.className = 'file-support-dashboard-fields';

  items.forEach(item => {
    const field = document.createElement('article');
    field.className = `file-support-dashboard-field tone-${getSupportDashboardTone(item.value, item.tone)}`;

    const label = document.createElement('span');
    label.textContent = item.label || 'Field';
    const value = document.createElement('strong');
    value.textContent = item.value || '-';

    field.appendChild(label);
    field.appendChild(value);
    grid.appendChild(field);
  });

  parent.appendChild(grid);
}

function appendSupportDashboardTable(parent, columns, rows) {
  if (!Array.isArray(columns) || columns.length === 0 || !Array.isArray(rows) || rows.length === 0) return;

  const table = document.createElement('div');
  table.className = 'file-support-dashboard-table';
  table.style.setProperty('--support-dashboard-columns', String(columns.length));

  const header = document.createElement('div');
  header.className = 'file-support-dashboard-table-row is-header';
  columns.forEach(column => {
    const cell = document.createElement('span');
    cell.textContent = column;
    header.appendChild(cell);
  });
  table.appendChild(header);

  rows.forEach(row => {
    const rowElement = document.createElement('div');
    rowElement.className = 'file-support-dashboard-table-row';
    columns.forEach(column => {
      const cell = document.createElement('span');
      cell.textContent = row?.[column] || '-';
      rowElement.appendChild(cell);
    });
    table.appendChild(rowElement);
  });

  parent.appendChild(table);
}

function appendSupportDashboardSection(parent, summarySection) {
  if (!summarySection || typeof summarySection !== 'object') return;

  const section = document.createElement('section');
  section.className = `file-support-summary-section file-support-dashboard-section section-${summarySection.id || 'generic'}`;

  const header = document.createElement('div');
  header.className = 'file-support-dashboard-section-header';
  const sectionTitle = document.createElement('h4');
  sectionTitle.textContent = summarySection.title || 'Dashboard Section';
  header.appendChild(sectionTitle);

  const sourceButton = createSupportSummarySourceButton(summarySection.entryId, summarySection.path);
  if (sourceButton) {
    header.appendChild(sourceButton);
  }
  section.appendChild(header);

  if (summarySection.summary) {
    const summary = document.createElement('p');
    summary.className = 'file-support-dashboard-section-summary';
    summary.textContent = summarySection.summary;
    section.appendChild(summary);
  }

  appendSupportDashboardFields(section, summarySection.items);
  appendSupportDashboardTable(section, summarySection.columns, summarySection.rows);
  parent.appendChild(section);
}

function renderSupportSummaryDashboard() {
  const summary = supportFileState.summary;
  if (!summary || !supportFileState.summaryVisible) return;

  const dashboard = document.createElement('section');
  dashboard.className = 'file-support-summary-dashboard';
  dashboard.setAttribute('aria-label', 'Digi support troubleshooting summary');

  const header = document.createElement('div');
  header.className = 'file-support-summary-dashboard-header';
  const titleGroup = document.createElement('div');
  const eyebrow = document.createElement('p');
  eyebrow.className = 'file-support-summary-dashboard-eyebrow';
  eyebrow.textContent = 'Imported Support File';
  const title = document.createElement('h3');
  title.textContent = summary.title || 'Digi Support Troubleshooting Summary';
  titleGroup.appendChild(eyebrow);
  titleGroup.appendChild(title);

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'file-support-summary-close';
  closeButton.textContent = 'x';
  closeButton.setAttribute('aria-label', 'Close troubleshooting summary');
  closeButton.addEventListener('click', () => {
    supportFileState = {
      ...supportFileState,
      summaryVisible: false
    };
    renderProductApp();
  });

  header.appendChild(titleGroup);
  header.appendChild(closeButton);
  dashboard.appendChild(header);

  if (summary.overview) {
    const overview = document.createElement('p');
    overview.className = 'file-support-summary-dashboard-overview';
    overview.textContent = summary.overview;
    dashboard.appendChild(overview);
  }

  const statsGrid = document.createElement('div');
  statsGrid.className = 'file-support-dashboard-stats';

  const findings = Array.isArray(summary.findings) ? summary.findings : [];
  const warningCount = findings.filter(finding => finding.severity === 'warning').length;
  const infoCount = findings.filter(finding => finding.severity !== 'warning').length;
  const keyFiles = Array.isArray(summary.keyFiles) ? summary.keyFiles : [];
  const checks = Array.isArray(summary.recommendedChecks) ? summary.recommendedChecks : [];
  const metrics = Array.isArray(summary.metrics) && summary.metrics.length > 0
    ? summary.metrics
    : [
        { label: 'Key files', value: String(keyFiles.length) },
        { label: 'Warnings', value: String(warningCount), tone: warningCount > 0 ? 'warning' : 'good' },
        { label: 'Context notes', value: String(infoCount) },
        { label: 'Checklist items', value: String(checks.length) }
      ];

  metrics.slice(0, 6).forEach(stat => {
    const card = document.createElement('article');
    card.className = `file-support-dashboard-stat tone-${getSupportDashboardTone(stat.value, stat.tone)}`;
    const value = document.createElement('strong');
    value.textContent = stat.value;
    const label = document.createElement('span');
    label.textContent = stat.label;
    card.appendChild(value);
    card.appendChild(label);
    statsGrid.appendChild(card);
  });
  dashboard.appendChild(statsGrid);

  const body = document.createElement('div');
  body.className = 'file-support-summary-dashboard-body';

  const dashboardSections = Array.isArray(summary.sections) ? summary.sections : [];
  dashboardSections.forEach(section => appendSupportDashboardSection(body, section));

  if (findings.length > 0) {
    const section = document.createElement('section');
    section.className = 'file-support-summary-section';
    const sectionTitle = document.createElement('h4');
    sectionTitle.textContent = 'Initial findings';
    section.appendChild(sectionTitle);

    const list = document.createElement('div');
    list.className = 'file-support-finding-list';
    findings.forEach(finding => {
      const item = document.createElement('article');
      item.className = `file-support-finding severity-${finding.severity || 'info'}`;
      const findingTitle = document.createElement('strong');
      findingTitle.textContent = finding.title || 'Finding';
      const detail = document.createElement('p');
      detail.textContent = finding.detail || '';
      item.appendChild(findingTitle);
      item.appendChild(detail);

      if (Array.isArray(finding.samples) && finding.samples.length > 0) {
        const sampleList = document.createElement('ul');
        sampleList.className = 'file-support-finding-samples';
        finding.samples.forEach(sample => {
          const sampleItem = document.createElement('li');
          sampleItem.textContent = sample;
          sampleList.appendChild(sampleItem);
        });
        item.appendChild(sampleList);
      }

      if (finding.entryId) {
        const linkButton = document.createElement('button');
        linkButton.type = 'button';
        linkButton.className = 'file-support-summary-link';
        linkButton.textContent = finding.path || 'Open source file';
        linkButton.addEventListener('click', () => selectSupportSummaryFile(finding.entryId));
        item.appendChild(linkButton);
      }
      list.appendChild(item);
    });
    section.appendChild(list);
    body.appendChild(section);
  }

  if (keyFiles.length > 0) {
    const section = document.createElement('section');
    section.className = 'file-support-summary-section';
    const sectionTitle = document.createElement('h4');
    sectionTitle.textContent = 'Most relevant files';
    section.appendChild(sectionTitle);

    const list = document.createElement('div');
    list.className = 'file-support-key-file-list';
    keyFiles.forEach(file => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'file-support-key-file';
      item.addEventListener('click', () => selectSupportSummaryFile(file.entryId));

      const fileTitle = document.createElement('strong');
      fileTitle.textContent = file.title || file.path || 'Support file';
      const reason = document.createElement('span');
      reason.textContent = file.reason || '';
      const pathLabel = document.createElement('code');
      pathLabel.textContent = file.path || '';

      item.appendChild(fileTitle);
      item.appendChild(reason);
      item.appendChild(pathLabel);
      list.appendChild(item);
    });
    section.appendChild(list);
    body.appendChild(section);
  }

  if (checks.length > 0) {
    const section = document.createElement('section');
    section.className = 'file-support-summary-section';
    const sectionTitle = document.createElement('h4');
    sectionTitle.textContent = 'Troubleshooting order';
    section.appendChild(sectionTitle);

    const list = document.createElement('ol');
    list.className = 'file-support-check-list';
    checks.forEach(check => {
      const item = document.createElement('li');
      item.textContent = check;
      list.appendChild(item);
    });
    section.appendChild(list);
    body.appendChild(section);
  }

  dashboard.appendChild(body);
  return dashboard;
}

function createSupportSmartScanControls() {
  const form = document.createElement('form');
  form.className = 'file-support-smart-scan';

  const scanPromptPlaceholder = 'Describe the problem or context for the AI (optional). e.g. "Router drops cellular every night around 2am and recovers itself"';
  const input = document.createElement('textarea');
  input.id = 'file-support-smart-scan-query';
  input.className = 'file-support-search-input file-support-smart-scan-input';
  input.rows = 3;
  input.placeholder = scanPromptPlaceholder;
  input.value = supportSmartScanState.query;
  input.disabled = !supportFileState.sessionId || supportSmartScanState.loading;
  input.setAttribute('aria-label', 'Describe the problem or context for the AI');
  input.addEventListener('input', () => {
    supportSmartScanState = {
      ...supportSmartScanState,
      query: input.value
    };
  });

  const scanButton = document.createElement('button');
  scanButton.type = 'submit';
  scanButton.className = 'file-support-smart-scan-button';
  scanButton.disabled = !supportFileState.sessionId || supportSmartScanState.loading;
  scanButton.textContent = supportSmartScanState.loading
    ? 'Scanning...'
    : `AI Scan (${getProviderLabel(getPreferredProvider())})`;
  scanButton.title = 'Analyze selected support file excerpts using the configured provider';

  form.appendChild(input);
  form.appendChild(scanButton);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    handleSupportSmartScan();
  });

  return form;
}

function renderSupportSmartScanResult(parent) {
  if (!supportSmartScanState.loading && !supportSmartScanState.answer && !supportSmartScanState.error) {
    return;
  }

  const panel = document.createElement('section');
  panel.className = 'file-support-smart-result';

  const resultHeader = document.createElement('div');
  resultHeader.className = 'file-support-smart-result-header';
  const title = document.createElement('h4');
  title.textContent = supportSmartScanState.loading ? 'Smart scan running' : 'Smart scan result';
  resultHeader.appendChild(title);

  if (!supportSmartScanState.loading && supportSmartScanState.answer) {
    const saveButton = document.createElement('button');
    saveButton.type = 'button';
    saveButton.className = 'file-support-smart-save-button';
    saveButton.textContent = 'Save report';
    saveButton.setAttribute('aria-label', 'Save AI scan report');
    saveButton.addEventListener('click', handleSupportSmartScanReportSave);
    resultHeader.appendChild(saveButton);
  }

  panel.appendChild(resultHeader);

  if (supportSmartScanState.loading) {
    const loading = document.createElement('p');
    loading.textContent = 'Analyzing relevant support archive excerpts.';
    panel.appendChild(loading);
  } else if (supportSmartScanState.error) {
    const error = document.createElement('p');
    error.className = 'file-support-smart-error';
    error.textContent = supportSmartScanState.error;
    panel.appendChild(error);
  } else {
    const answer = document.createElement('pre');
    answer.className = 'file-support-smart-answer';
    answer.textContent = supportSmartScanState.answer;
    panel.appendChild(answer);

    if (Array.isArray(supportSmartScanState.sources) && supportSmartScanState.sources.length > 0) {
      const sourceList = document.createElement('div');
      sourceList.className = 'file-support-smart-sources';
      supportSmartScanState.sources.forEach(source => {
        const sourceButton = createSupportSummarySourceButton(source.entryId, source.path, 'Open source file');
        if (!sourceButton) return;
        sourceButton.title = source.reason || source.path || 'Open source file';
        sourceList.appendChild(sourceButton);
      });
      panel.appendChild(sourceList);
    }
  }

  parent.appendChild(panel);
}

function sanitizeDownloadFilenamePart(value, fallback = 'support-file') {
  const compactValue = String(value || '')
    .trim()
    .replace(/\.[^/.\\]+$/, '')
    .replace(/[<>:"/\\|?*\x00-\x1f]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  return compactValue || fallback;
}

function escapeInlineCode(value) {
  return String(value || '').replace(/`/g, "'");
}

function formatSmartScanReportDate(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    return new Date().toLocaleString();
  }
  return date.toLocaleString();
}

function buildSupportSmartScanReport() {
  const answer = String(supportSmartScanState.answer || '').trim();
  const query = String(supportSmartScanState.resultQuery || supportSmartScanState.query || '').trim();
  const sources = Array.isArray(supportSmartScanState.sources) ? supportSmartScanState.sources : [];
  const lines = [
    '# AI Scan Report',
    '',
    `- Support file: ${supportFileState.fileName || 'Unknown support file'}`,
    `- Generated: ${formatSmartScanReportDate(supportSmartScanState.completedAt)}`,
    `- Provider: ${supportSmartScanState.resultProvider || getProviderLabel(getPreferredProvider())}`,
    `- Query: ${query || 'Default support file scan'}`
  ];

  if (supportSmartScanState.resultSelectedPath) {
    lines.push(`- Selected file: \`${escapeInlineCode(supportSmartScanState.resultSelectedPath)}\``);
  }

  lines.push('', '## Result', '', answer || 'No AI scan answer was returned.');

  if (sources.length > 0) {
    lines.push('', '## Sources', '');
    sources.forEach(source => {
      const pathLabel = escapeInlineCode(source?.path || 'Unknown source');
      const reason = String(source?.reason || '').trim();
      lines.push(`- \`${pathLabel}\`${reason ? ` - ${reason}` : ''}`);
    });
  }

  lines.push('');
  return lines.join('\n');
}

function getSupportSmartScanReportFilename() {
  const supportFileName = sanitizeDownloadFilenamePart(supportFileState.fileName, 'support-file');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `ai-scan-report-${supportFileName}-${timestamp}.md`;
}

function triggerTextDownload(text, filename, type = 'text/plain;charset=utf-8') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function handleSupportSmartScanReportSave() {
  if (!supportSmartScanState.answer) {
    showNotification('Run an AI scan first');
    return;
  }

  const filename = getSupportSmartScanReportFilename();
  const content = buildSupportSmartScanReport();
  const networkAPI = getNetworkAPI();

  try {
    if (networkAPI && typeof networkAPI.saveTextFile === 'function') {
      const result = await networkAPI.saveTextFile({
        title: 'Save AI Scan Report',
        buttonLabel: 'Save Report',
        defaultPath: filename,
        content,
        filters: [
          { name: 'Markdown', extensions: ['md'] },
          { name: 'Text files', extensions: ['txt'] },
          { name: 'All files', extensions: ['*'] }
        ]
      });

      if (result?.canceled) {
        return;
      }
      if (!result || !result.success) {
        throw new Error(result?.error || 'Could not save AI scan report');
      }
    } else {
      triggerTextDownload(content, filename, 'text/markdown;charset=utf-8');
    }

    showNotification('AI scan report saved');
  } catch (error) {
    console.error('Error saving AI scan report:', error);
    showNotification(error.message || 'Could not save AI scan report');
  }
}

function createEmptySupportSmartScanState(query = '') {
  return {
    query,
    visible: false,
    loading: false,
    answer: '',
    error: '',
    sources: [],
    resultQuery: '',
    resultProvider: '',
    resultSelectedPath: '',
    completedAt: ''
  };
}

function formatSavedSupportFileDate(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function getSavedSupportFileTitle(file) {
  return String(file?.alias || file?.title || file?.originalFileName || 'Saved support file').trim();
}

function savedSupportFileMatchesSearch(file, query) {
  const normalizedQuery = normalizeSearchQuery(query).toLowerCase();
  if (!normalizedQuery) return true;
  const haystack = [
    file?.alias,
    file?.title,
    file?.notes,
    file?.originalFileName
  ].join(' ').toLowerCase();
  return normalizedQuery
    .split(/\s+/)
    .filter(Boolean)
    .every(term => haystack.includes(term));
}

function getFilteredSavedSupportFiles() {
  return supportSavedFilesState.files.filter(file => savedSupportFileMatchesSearch(file, supportSavedFilesState.search));
}

function getSelectedSavedSupportFile(filteredFiles = getFilteredSavedSupportFiles()) {
  return filteredFiles.find(file => file.id === supportSavedFilesState.selectedId) || filteredFiles[0] || null;
}

function applySupportFileLoadResult(result, successMessage = 'Support file imported') {
  expandedSupportFolders = new Set();
  if (Array.isArray(result.tree) && result.tree.length === 1 && result.tree[0].type === 'directory') {
    expandedSupportFolders.add(result.tree[0].id);
  }
  supportTreeSearchQuery = '';
  supportContentSearchQuery = '';
  supportFileViewerFullscreen = false;
  supportContentViewMode = 'ruby';
  supportSmartScanState = createEmptySupportSmartScanState();

  supportFileState = {
    sessionId: result.sessionId,
    fileName: result.fileName || '',
    tree: Array.isArray(result.tree) ? result.tree : [],
    stats: result.stats || null,
    selectedFileId: '',
    selectedPath: '',
    selectedContent: '',
    selectedError: '',
    selectedTruncated: false,
    selectedLoading: false,
    summary: result.summary || null,
    summaryVisible: Boolean(result.summary),
    savedFile: result.savedFile || null,
    importError: '',
    importing: false
  };

  showNotification(result.savedFileError ? `${successMessage}; not added to Saved Files` : successMessage);
}

function openSavedSupportFilesModal() {
  supportSavedFilesState = {
    ...supportSavedFilesState,
    visible: true,
    error: ''
  };
  renderSavedSupportFilesModal();
  refreshSavedSupportFiles();
}

function closeSavedSupportFilesModal() {
  supportSavedFilesState = {
    ...supportSavedFilesState,
    visible: false,
    openingId: '',
    savingId: '',
    deletingId: ''
  };
  renderSavedSupportFilesModal();
}

async function refreshSavedSupportFiles() {
  const supportAPI = getNetworkAPI();
  if (!supportAPI || typeof supportAPI.listSavedSupportFiles !== 'function') {
    supportSavedFilesState = {
      ...supportSavedFilesState,
      loading: false,
      error: 'Saved Files are only available in the desktop app'
    };
    renderSavedSupportFilesModal();
    return;
  }

  supportSavedFilesState = {
    ...supportSavedFilesState,
    loading: true,
    error: ''
  };
  renderSavedSupportFilesModal();

  try {
    const result = await supportAPI.listSavedSupportFiles();
    if (!result || !result.success) {
      throw new Error(result?.error || 'Could not load saved files');
    }

    const files = Array.isArray(result.files) ? result.files : [];
    const selectedExists = files.some(file => file.id === supportSavedFilesState.selectedId);
    supportSavedFilesState = {
      ...supportSavedFilesState,
      loading: false,
      files,
      selectedId: selectedExists ? supportSavedFilesState.selectedId : files[0]?.id || '',
      error: ''
    };
  } catch (error) {
    console.error('Error loading Saved Files:', error);
    supportSavedFilesState = {
      ...supportSavedFilesState,
      loading: false,
      error: error.message || 'Could not load saved files'
    };
  }

  renderSavedSupportFilesModal();
}

function renderSavedSupportFilesModal() {
  const modal = document.getElementById('saved-support-files-modal');
  const body = document.getElementById('saved-support-files-body');
  if (!modal || !body) return;

  modal.style.display = supportSavedFilesState.visible ? 'flex' : 'none';
  if (!supportSavedFilesState.visible) return;

  const filteredFiles = getFilteredSavedSupportFiles();
  const selectedFile = getSelectedSavedSupportFile(filteredFiles);
  if (selectedFile && supportSavedFilesState.selectedId !== selectedFile.id) {
    supportSavedFilesState = {
      ...supportSavedFilesState,
      selectedId: selectedFile.id
    };
  }

  body.innerHTML = '';

  const layout = document.createElement('div');
  layout.className = 'saved-support-files-layout';

  const sidebar = document.createElement('aside');
  sidebar.className = 'saved-support-files-sidebar';

  const searchRow = document.createElement('div');
  searchRow.className = 'saved-support-files-search';
  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.id = 'saved-support-files-search-input';
  searchInput.placeholder = 'Search saved files';
  searchInput.value = supportSavedFilesState.search;
  searchInput.setAttribute('aria-label', 'Search saved support files');
  searchInput.addEventListener('input', () => {
    supportSavedFilesState = {
      ...supportSavedFilesState,
      search: searchInput.value
    };
    renderSavedSupportFilesModal();
    requestAnimationFrame(() => {
      const nextInput = document.getElementById('saved-support-files-search-input');
      if (!nextInput) return;
      nextInput.focus();
      nextInput.setSelectionRange(nextInput.value.length, nextInput.value.length);
    });
  });
  const count = document.createElement('span');
  count.textContent = supportSavedFilesState.loading
    ? 'Loading'
    : `${filteredFiles.length} file${filteredFiles.length === 1 ? '' : 's'}`;
  searchRow.appendChild(searchInput);
  searchRow.appendChild(count);
  sidebar.appendChild(searchRow);

  const list = document.createElement('div');
  list.className = 'saved-support-files-list';
  if (supportSavedFilesState.loading) {
    const loading = document.createElement('div');
    loading.className = 'saved-support-files-empty';
    loading.textContent = 'Loading saved files';
    list.appendChild(loading);
  } else if (supportSavedFilesState.error) {
    const error = document.createElement('div');
    error.className = 'saved-support-files-alert';
    error.textContent = supportSavedFilesState.error;
    list.appendChild(error);
  } else if (supportSavedFilesState.files.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'saved-support-files-empty';
    empty.textContent = 'Imported support files will appear here.';
    list.appendChild(empty);
  } else if (filteredFiles.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'saved-support-files-empty';
    empty.textContent = 'No saved files match this search.';
    list.appendChild(empty);
  } else {
    filteredFiles.forEach(file => {
      const itemButton = document.createElement('button');
      itemButton.type = 'button';
      itemButton.className = 'saved-support-file-item';
      itemButton.classList.toggle('active', selectedFile?.id === file.id);
      itemButton.addEventListener('click', () => {
        supportSavedFilesState = {
          ...supportSavedFilesState,
          selectedId: file.id
        };
        renderSavedSupportFilesModal();
      });
      itemButton.addEventListener('dblclick', () => {
        handleSavedSupportFileOpen(file.id);
      });

      const itemTitle = document.createElement('strong');
      itemTitle.textContent = getSavedSupportFileTitle(file);
      const itemMeta = document.createElement('span');
      itemMeta.textContent = [
        file.originalFileName || 'support file',
        formatSavedSupportFileDate(file.lastOpenedAt || file.importedAt)
      ].filter(Boolean).join(' | ');
      itemButton.appendChild(itemTitle);
      itemButton.appendChild(itemMeta);
      list.appendChild(itemButton);
    });
  }
  sidebar.appendChild(list);

  const detail = document.createElement('section');
  detail.className = 'saved-support-files-detail';

  if (!selectedFile || supportSavedFilesState.loading || supportSavedFilesState.error) {
    const empty = document.createElement('div');
    empty.className = 'saved-support-files-empty large';
    empty.textContent = supportSavedFilesState.loading ? 'Loading details' : 'Select a saved file';
    detail.appendChild(empty);
  } else {
    const detailTitle = document.createElement('h3');
    detailTitle.textContent = getSavedSupportFileTitle(selectedFile);
    detail.appendChild(detailTitle);

    const meta = document.createElement('div');
    meta.className = 'saved-support-files-meta';
    meta.textContent = [
      selectedFile.originalFileName || 'support file',
      formatSupportFileBytes(selectedFile.size),
      selectedFile.importedAt ? `Added ${formatSavedSupportFileDate(selectedFile.importedAt)}` : ''
    ].filter(Boolean).join(' | ');
    detail.appendChild(meta);

    const form = document.createElement('form');
    form.className = 'saved-support-files-form';
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      handleSavedSupportFileMetadataSave(selectedFile.id);
    });

    const aliasGroup = document.createElement('label');
    aliasGroup.className = 'form-group saved-support-files-field';
    aliasGroup.textContent = 'Alias';
    const aliasInput = document.createElement('input');
    aliasInput.id = 'saved-support-file-alias';
    aliasInput.type = 'text';
    aliasInput.maxLength = 96;
    aliasInput.value = selectedFile.alias || '';
    aliasGroup.appendChild(aliasInput);
    form.appendChild(aliasGroup);

    const titleGroup = document.createElement('label');
    titleGroup.className = 'form-group saved-support-files-field';
    titleGroup.textContent = 'Title';
    const titleInput = document.createElement('input');
    titleInput.id = 'saved-support-file-title';
    titleInput.type = 'text';
    titleInput.maxLength = 160;
    titleInput.value = selectedFile.title || '';
    titleGroup.appendChild(titleInput);
    form.appendChild(titleGroup);

    const notesGroup = document.createElement('label');
    notesGroup.className = 'form-group saved-support-files-field';
    notesGroup.textContent = 'Notes';
    const notesInput = document.createElement('textarea');
    notesInput.id = 'saved-support-file-notes';
    notesInput.rows = 8;
    notesInput.value = selectedFile.notes || '';
    notesGroup.appendChild(notesInput);
    form.appendChild(notesGroup);

    const actions = document.createElement('div');
    actions.className = 'saved-support-files-actions';

    const openButton = document.createElement('button');
    openButton.type = 'button';
    openButton.className = 'save-button saved-support-files-open';
    openButton.textContent = supportSavedFilesState.openingId === selectedFile.id ? 'Opening...' : 'Open';
    openButton.disabled = Boolean(supportSavedFilesState.openingId);
    openButton.addEventListener('click', () => handleSavedSupportFileOpen(selectedFile.id));

    const saveButton = document.createElement('button');
    saveButton.type = 'submit';
    saveButton.className = 'config-transfer-button saved-support-files-save';
    saveButton.textContent = supportSavedFilesState.savingId === selectedFile.id ? 'Saving...' : 'Save details';
    saveButton.disabled = Boolean(supportSavedFilesState.savingId);

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'delete-button saved-support-files-delete';
    deleteButton.textContent = supportSavedFilesState.deletingId === selectedFile.id ? 'Deleting...' : 'Delete';
    deleteButton.disabled = Boolean(supportSavedFilesState.deletingId);
    deleteButton.addEventListener('click', () => handleSavedSupportFileDelete(selectedFile.id));

    actions.appendChild(openButton);
    actions.appendChild(saveButton);
    actions.appendChild(deleteButton);
    form.appendChild(actions);
    detail.appendChild(form);
  }

  layout.appendChild(sidebar);
  layout.appendChild(detail);
  body.appendChild(layout);
}

async function handleSavedSupportFileMetadataSave(fileId) {
  const supportAPI = getNetworkAPI();
  if (!supportAPI || typeof supportAPI.updateSavedSupportFile !== 'function') {
    showNotification('Saved Files are only available in the desktop app');
    return;
  }

  const aliasInput = document.getElementById('saved-support-file-alias');
  const titleInput = document.getElementById('saved-support-file-title');
  const notesInput = document.getElementById('saved-support-file-notes');
  supportSavedFilesState = {
    ...supportSavedFilesState,
    savingId: fileId
  };
  renderSavedSupportFilesModal();

  try {
    const result = await supportAPI.updateSavedSupportFile(fileId, {
      alias: aliasInput ? aliasInput.value : '',
      title: titleInput ? titleInput.value : '',
      notes: notesInput ? notesInput.value : ''
    });
    if (!result || !result.success) {
      throw new Error(result?.error || 'Could not save file details');
    }

    const nextFile = result.file;
    supportSavedFilesState = {
      ...supportSavedFilesState,
      savingId: '',
      files: supportSavedFilesState.files.map(file => file.id === fileId ? nextFile : file),
      selectedId: fileId
    };
    if (supportFileState.savedFile?.id === fileId) {
      supportFileState = {
        ...supportFileState,
        savedFile: nextFile
      };
      renderProductApp();
    }
    showNotification('Saved file details updated');
  } catch (error) {
    console.error('Error updating saved support file:', error);
    supportSavedFilesState = {
      ...supportSavedFilesState,
      savingId: ''
    };
    showNotification(error.message || 'Could not save file details');
  }

  renderSavedSupportFilesModal();
}

async function handleSavedSupportFileOpen(fileId) {
  const supportAPI = getNetworkAPI();
  if (!supportAPI || typeof supportAPI.openSavedSupportFile !== 'function') {
    showNotification('Saved Files are only available in the desktop app');
    return;
  }

  supportSavedFilesState = {
    ...supportSavedFilesState,
    openingId: fileId
  };
  renderSavedSupportFilesModal();
  showNotification('Opening saved support file');

  try {
    const result = await supportAPI.openSavedSupportFile(fileId);
    if (!result || !result.success) {
      throw new Error(result?.error || 'Could not open saved file');
    }

    applySupportFileLoadResult(result, 'Saved support file opened');
    closeSavedSupportFilesModal();
  } catch (error) {
    console.error('Error opening saved support file:', error);
    supportSavedFilesState = {
      ...supportSavedFilesState,
      openingId: ''
    };
    showNotification(error.message || 'Could not open saved file');
    renderSavedSupportFilesModal();
  }

  renderProductApp();
}

async function handleSavedSupportFileDelete(fileId) {
  const selectedFile = supportSavedFilesState.files.find(file => file.id === fileId);
  const fileTitle = getSavedSupportFileTitle(selectedFile);
  if (!window.confirm(`Delete "${fileTitle}" from Saved Files?`)) return;

  const supportAPI = getNetworkAPI();
  if (!supportAPI || typeof supportAPI.deleteSavedSupportFile !== 'function') {
    showNotification('Saved Files are only available in the desktop app');
    return;
  }

  supportSavedFilesState = {
    ...supportSavedFilesState,
    deletingId: fileId
  };
  renderSavedSupportFilesModal();

  try {
    const result = await supportAPI.deleteSavedSupportFile(fileId);
    if (!result || !result.success) {
      throw new Error(result?.error || 'Could not delete saved file');
    }

    const nextFiles = supportSavedFilesState.files.filter(file => file.id !== fileId);
    supportSavedFilesState = {
      ...supportSavedFilesState,
      deletingId: '',
      files: nextFiles,
      selectedId: nextFiles[0]?.id || ''
    };
    if (supportFileState.savedFile?.id === fileId) {
      supportFileState = {
        ...supportFileState,
        savedFile: null
      };
      renderProductApp();
    }
    showNotification('Saved file deleted');
  } catch (error) {
    console.error('Error deleting saved support file:', error);
    supportSavedFilesState = {
      ...supportSavedFilesState,
      deletingId: ''
    };
    showNotification(error.message || 'Could not delete saved file');
  }

  renderSavedSupportFilesModal();
}

function setupSavedSupportFilesModal() {
  const modal = document.getElementById('saved-support-files-modal');
  const closeButton = document.getElementById('close-saved-support-files');
  if (!modal) return;

  if (closeButton) {
    closeButton.addEventListener('click', closeSavedSupportFilesModal);
  }

  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeSavedSupportFilesModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (modal.style.display === 'flex' && event.key === 'Escape') {
      event.preventDefault();
      closeSavedSupportFilesModal();
    }
  });
}

function setupFileSupportShortcutsModal() {
  const modal = document.getElementById('file-support-shortcuts-modal');
  const closeButton = document.getElementById('close-file-support-shortcuts');
  if (!modal) return;

  if (closeButton) {
    closeButton.addEventListener('click', () => { modal.style.display = 'none'; });
  }

  modal.addEventListener('click', (event) => {
    if (event.target === modal) modal.style.display = 'none';
  });
}

// ===========================================================================
// Compare view — side-by-side diff of two support archives
// ===========================================================================

const COMPARE_MAX_RENDER_ROWS = 4000;
const COMPARE_TOO_LARGE_PREVIEW_ROWS = 4000;
let compareSavedFilesLoaded = false;

function emptyCompareCounts() {
  return { changed: 0, onlyA: 0, onlyB: 0, identical: 0, byCategory: { config: 0, logs: 0, json: 0, other: 0 } };
}

function formatCompareBytes(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function makeCompareEmptyState(message, isError = false) {
  const el = document.createElement('div');
  el.className = 'compare-empty-state' + (isError ? ' is-error' : '');
  el.textContent = message;
  return el;
}

function getCompareStatusBadge(file) {
  if (file.binary && file.status !== 'identical') {
    return { symbol: 'bin', className: 'badge-binary', label: 'Binary, differs' };
  }
  switch (file.status) {
    case 'changed': return { symbol: '', className: 'badge-changed', label: 'Changed' };
    case 'only-a': return { symbol: '-', className: 'badge-only-a', label: 'Only in A' };
    case 'only-b': return { symbol: '+', className: 'badge-only-b', label: 'Only in B' };
    default: return { symbol: '=', className: 'badge-identical', label: 'Identical' };
  }
}

function getCompareFileDisplayPath(file) {
  const aPath = String(file?.pathA || '');
  const bPath = String(file?.pathB || '');
  if (aPath && bPath && aPath !== bPath) return `A: ${aPath} | B: ${bPath}`;
  return aPath || bPath || String(file?.path || '');
}

function getCompareFileTitle(file) {
  const lines = [];
  if (file.path) lines.push(`Compare: ${file.path}`);
  if (file.pathA && file.pathA !== file.path) lines.push(`A: ${file.pathA}`);
  if (file.pathB && file.pathB !== file.path) lines.push(`B: ${file.pathB}`);
  return lines.join('\n') || file.path || '';
}

function buildCompareTooLargePreviewRows(aText, bText) {
  const aLines = String(aText || '').split(/\r?\n/);
  const bLines = String(bText || '').split(/\r?\n/);
  const total = Math.max(aLines.length, bLines.length);
  const limit = Math.min(total, COMPARE_TOO_LARGE_PREVIEW_ROWS);
  const rows = [];
  for (let i = 0; i < limit; i++) {
    const hasA = i < aLines.length;
    const hasB = i < bLines.length;
    const aLine = hasA ? aLines[i] : '';
    const bLine = hasB ? bLines[i] : '';
    let type = 'equal';
    if (hasA && hasB && aLine !== bLine) type = 'change';
    else if (hasA && !hasB) type = 'del';
    else if (!hasA && hasB) type = 'add';
    rows.push({
      type,
      aNo: hasA ? i + 1 : null,
      bNo: hasB ? i + 1 : null,
      aText: aLine,
      bText: bLine
    });
  }
  return { rows, truncated: total > limit, total };
}

function refocusCompareContentSearchInput() {
  requestAnimationFrame(() => {
    const input = document.getElementById('compare-content-search-input');
    if (!input || input.disabled) return;
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  });
}

function getCompareContentSearchState() {
  return supportCompareState.contentSearch || createEmptyCompareContentSearch();
}

function clearCompareContentSearchWork() {
  if (compareContentSearchDebounce) {
    clearTimeout(compareContentSearchDebounce);
    compareContentSearchDebounce = null;
  }
  compareContentSearchToken++;
}

function scheduleCompareContentSearch() {
  if (compareContentSearchDebounce) clearTimeout(compareContentSearchDebounce);
  compareContentSearchDebounce = setTimeout(() => {
    compareContentSearchDebounce = null;
    runCompareContentSearch();
  }, 250);
}

function combineCompareContentSearchResults(resultA, resultB) {
  const entryIdsA = (resultA?.files || []).map(file => file.id).filter(Boolean);
  const entryIdsB = (resultB?.files || []).map(file => file.id).filter(Boolean);
  const matchA = new Set(entryIdsA);
  const matchB = new Set(entryIdsB);
  const rows = supportCompareState.manifest?.files || [];
  const totalFiles = rows.filter(file => matchA.has(file.entryIdA) || matchB.has(file.entryIdB)).length;
  return {
    entryIdsA,
    entryIdsB,
    totalFiles,
    totalMatches: (Number(resultA?.totalMatches) || 0) + (Number(resultB?.totalMatches) || 0),
    truncated: Boolean(resultA?.truncated || resultB?.truncated)
  };
}

function runCompareContentSearch() {
  if (compareContentSearchDebounce) {
    clearTimeout(compareContentSearchDebounce);
    compareContentSearchDebounce = null;
  }
  const api = getNetworkAPI();
  const search = getCompareContentSearchState();
  const query = search.query;

  if (!normalizeSearchQuery(query)) {
    clearCompareContentSearchWork();
    supportCompareState = {
      ...supportCompareState,
      contentSearch: createEmptyCompareContentSearch({ active: search.active })
    };
    renderProductApp();
    refocusCompareContentSearchInput();
    return;
  }

  if (!api || typeof api.searchSupportArchive !== 'function' || !supportCompareState.a.sessionId || !supportCompareState.b.sessionId) {
    supportCompareState = {
      ...supportCompareState,
      contentSearch: { ...search, loading: false, results: null, error: 'Search is not available.' }
    };
    renderProductApp();
    refocusCompareContentSearchInput();
    return;
  }

  const { include, exclude } = parseAdvancedSearchTerms(query);
  const options = {
    query,
    include,
    exclude,
    grep: false,
    ignoreCase: true,
    cut: false,
    fileFilters: [],
    scope: 'all',
    currentFileId: ''
  };
  const token = ++compareContentSearchToken;
  supportCompareState = {
    ...supportCompareState,
    contentSearch: { ...search, loading: true, error: '', results: null }
  };
  renderProductApp();
  refocusCompareContentSearchInput();

  Promise.all([
    api.searchSupportArchive(supportCompareState.a.sessionId, options),
    api.searchSupportArchive(supportCompareState.b.sessionId, options)
  ]).then(([resultA, resultB]) => {
    if (token !== compareContentSearchToken) return;
    if (!resultA?.success || !resultB?.success) {
      throw new Error(resultA?.error || resultB?.error || 'Search failed');
    }
    const nextResults = combineCompareContentSearchResults(resultA, resultB);
    supportCompareState = {
      ...supportCompareState,
      contentSearch: {
        ...getCompareContentSearchState(),
        loading: false,
        error: '',
        results: nextResults
      }
    };
    renderProductApp();
    refocusCompareContentSearchInput();
  }).catch(error => {
    if (token !== compareContentSearchToken) return;
    supportCompareState = {
      ...supportCompareState,
      contentSearch: {
        ...getCompareContentSearchState(),
        loading: false,
        results: null,
        error: error.message || 'Search failed'
      }
    };
    renderProductApp();
    refocusCompareContentSearchInput();
  });
}

async function ensureCompareSavedFiles() {
  if (compareSavedFilesLoaded) return;
  const api = getNetworkAPI();
  if (!api || typeof api.listSavedSupportFiles !== 'function') return;
  compareSavedFilesLoaded = true;
  try {
    const result = await api.listSavedSupportFiles();
    if (result && result.success && Array.isArray(result.files)) {
      supportCompareState = { ...supportCompareState, savedFiles: result.files };
      if (activeLineId === COMPARE_VIEW_ID) renderProductApp();
    }
  } catch (error) {
    console.error('Could not load saved files for compare:', error);
  }
}

async function fetchCompareSideText(api, sessionId, entryId) {
  if (!api || typeof api.getSupportFileEntryContent !== 'function' || !sessionId || !entryId) {
    return { text: '', truncated: false };
  }
  const result = await api.getSupportFileEntryContent(sessionId, entryId);
  if (!result || !result.success || typeof result.text !== 'string') {
    return { text: '', truncated: false };
  }
  return { text: result.text, truncated: Boolean(result.truncated) };
}

function buildBinaryCompareNote(file) {
  const a = file.sizeA == null ? 'absent' : formatCompareBytes(file.sizeA);
  const b = file.sizeB == null ? 'absent' : formatCompareBytes(file.sizeB);
  const verdict = file.status === 'identical' ? 'Same size.' : 'Different.';
  return `Binary file — no line diff. A: ${a}, B: ${b}. ${verdict}`;
}

async function runCompare() {
  const api = getNetworkAPI();
  const { a, b } = supportCompareState;
  if (!api || typeof api.compareSupportArchives !== 'function' || !a.sessionId || !b.sessionId) return;

  clearCompareContentSearchWork();
  supportCompareState = {
    ...supportCompareState,
    comparing: true,
    compareError: '',
    manifest: null,
    selectedPath: '',
    selected: createEmptyCompareSelection(),
    contentSearch: createEmptyCompareContentSearch()
  };
  renderProductApp();

  try {
    const result = await api.compareSupportArchives(a.sessionId, b.sessionId);
    if (!result || !result.success) throw new Error(result?.error || 'Could not compare archives');
    supportCompareState = {
      ...supportCompareState,
      comparing: false,
      manifest: { files: result.files || [], counts: result.counts || emptyCompareCounts() },
      sameFile: Boolean(result.sameFile)
    };
  } catch (error) {
    console.error('Error comparing archives:', error);
    supportCompareState = {
      ...supportCompareState,
      comparing: false,
      compareError: error.message || 'Could not compare archives'
    };
    showNotification(error.message || 'Could not compare archives');
  }
  renderProductApp();
}

async function handleCompareLoadSide(side, mode, fileId) {
  const api = getNetworkAPI();
  if (!api) {
    showNotification('Compare is only available in the desktop app');
    return;
  }

  supportCompareState = {
    ...supportCompareState,
    [side]: { ...supportCompareState[side], loading: true, error: '' }
  };
  renderProductApp();

  try {
    let result;
    if (mode === 'saved') {
      if (typeof api.openSavedSupportFile !== 'function') throw new Error('Saved Files are not available');
      result = await api.openSavedSupportFile(fileId);
    } else {
      if (typeof api.importSupportFile !== 'function') throw new Error('File import is not available');
      result = await api.importSupportFile();
    }

    if (result?.canceled) {
      supportCompareState = {
        ...supportCompareState,
        [side]: { ...supportCompareState[side], loading: false }
      };
      renderProductApp();
      return;
    }
    if (!result || !result.success) {
      throw new Error(result?.error || 'Could not load archive');
    }

    if (mode === 'import') compareSavedFilesLoaded = false; // a new import joins the library
    clearCompareContentSearchWork();
    supportCompareState = {
      ...supportCompareState,
      [side]: {
        sessionId: result.sessionId,
        fileName: result.fileName || (mode === 'saved' ? 'Saved file' : 'Imported file'),
        source: mode,
        loading: false,
        error: ''
      },
      manifest: null,
      compareError: '',
      selectedPath: '',
      selected: createEmptyCompareSelection(),
      contentSearch: createEmptyCompareContentSearch()
    };

    if (supportCompareState.a.sessionId && supportCompareState.b.sessionId) {
      await runCompare();
    } else {
      renderProductApp();
    }
  } catch (error) {
    console.error('Error loading archive for compare:', error);
    supportCompareState = {
      ...supportCompareState,
      [side]: { ...supportCompareState[side], loading: false, error: error.message || 'Could not load archive' }
    };
    showNotification(error.message || 'Could not load archive');
    renderProductApp();
  }
}

function handleCompareSwap() {
  const { a, b } = supportCompareState;
  clearCompareContentSearchWork();
  supportCompareState = {
    ...supportCompareState,
    a: b,
    b: a,
    manifest: null,
    selectedPath: '',
    selected: createEmptyCompareSelection(),
    contentSearch: createEmptyCompareContentSearch()
  };
  if (supportCompareState.a.sessionId && supportCompareState.b.sessionId) {
    runCompare();
  } else {
    renderProductApp();
  }
}

async function handleCompareSelectFile(path) {
  const manifest = supportCompareState.manifest;
  if (!manifest) return;
  const file = manifest.files.find(f => f.path === path);
  if (!file) return;
  const selectedPaths = { pathA: file.pathA || '', pathB: file.pathB || '' };

  if (file.binary) {
    supportCompareState = {
      ...supportCompareState,
      selectedPath: path,
      selected: { ...createEmptyCompareSelection(), path, ...selectedPaths, status: file.status, binary: true, note: buildBinaryCompareNote(file) }
    };
    renderProductApp();
    return;
  }

  supportCompareState = {
    ...supportCompareState,
    selectedPath: path,
    selected: { ...createEmptyCompareSelection(), loading: true, path, ...selectedPaths, status: file.status }
  };
  renderProductApp();

  const api = getNetworkAPI();
  try {
    const [aSide, bSide] = await Promise.all([
      fetchCompareSideText(api, supportCompareState.a.sessionId, file.entryIdA),
      fetchCompareSideText(api, supportCompareState.b.sessionId, file.entryIdB)
    ]);
    const diffApi = (typeof window !== 'undefined' && window.SupportDiff) || null;
    if (!diffApi || typeof diffApi.diffLines !== 'function') throw new Error('Diff engine is not available');

    const diff = diffApi.diffLines(aSide.text, bSide.text);
    const tooLargePreview = diff.tooLarge ? buildCompareTooLargePreviewRows(aSide.text, bSide.text) : null;
    const noteParts = [];
    if (diff.tooLarge) {
      noteParts.push('This file is too large for an inline line diff. Showing raw A/B preview instead.');
      if (tooLargePreview?.truncated) {
        noteParts.push(`Showing the first ${tooLargePreview.rows.length} of ${tooLargePreview.total} lines.`);
      }
    }
    if (aSide.truncated || bSide.truncated) noteParts.push('Partial comparison — file content was truncated.');
    supportCompareState = {
      ...supportCompareState,
      selected: {
        ...createEmptyCompareSelection(),
        path,
        ...selectedPaths,
        status: file.status,
        rows: diff.rows,
        previewRows: tooLargePreview ? tooLargePreview.rows : [],
        tooLarge: diff.tooLarge,
        addedCount: diff.addedCount,
        removedCount: diff.removedCount,
        note: noteParts.join(' ')
      }
    };
  } catch (error) {
    console.error('Error building diff:', error);
    supportCompareState = {
      ...supportCompareState,
      selected: { ...createEmptyCompareSelection(), path, ...selectedPaths, status: file.status, error: error.message || 'Could not load file content' }
    };
  }
  renderProductApp();
}

function getCompareFilteredFiles() {
  const { manifest, categoryFilter, showIdentical, pathFilter } = supportCompareState;
  const contentSearch = getCompareContentSearchState();
  const contentQueryActive = contentSearch.active && normalizeSearchQuery(contentSearch.query) && !contentSearch.error;
  const contentMatchesA = new Set(contentSearch.results?.entryIdsA || []);
  const contentMatchesB = new Set(contentSearch.results?.entryIdsB || []);
  if (!manifest) return [];
  const needle = pathFilter.trim().toLowerCase();
  return manifest.files.filter(file => {
    if (!showIdentical && file.status === 'identical') return false;
    if (categoryFilter !== 'all' && file.category !== categoryFilter) return false;
    const searchablePath = [file.path, file.pathA, file.pathB].filter(Boolean).join('\n').toLowerCase();
    if (needle && !searchablePath.includes(needle)) return false;
    if (contentQueryActive) {
      if (!contentSearch.results) return false;
      if (!contentMatchesA.has(file.entryIdA) && !contentMatchesB.has(file.entryIdB)) return false;
    }
    return true;
  });
}

function renderCompareSidePicker(side, label) {
  const state = supportCompareState[side];
  const api = getNetworkAPI();

  const wrap = document.createElement('div');
  wrap.className = `compare-picker compare-picker-${side}`;

  const head = document.createElement('div');
  head.className = 'compare-picker-head';
  const title = document.createElement('span');
  title.className = 'compare-picker-title';
  title.textContent = label;
  head.appendChild(title);
  if (state.fileName) {
    const name = document.createElement('span');
    name.className = 'compare-picker-filename';
    name.textContent = state.fileName;
    name.title = state.fileName;
    head.appendChild(name);
  }
  wrap.appendChild(head);

  const controls = document.createElement('div');
  controls.className = 'compare-picker-controls';

  const importBtn = document.createElement('button');
  importBtn.type = 'button';
  importBtn.className = 'compare-import-button';
  importBtn.textContent = state.loading ? 'Loading…' : 'Import';
  importBtn.disabled = state.loading || !api;
  importBtn.addEventListener('click', () => handleCompareLoadSide(side, 'import'));
  controls.appendChild(importBtn);

  if (api && typeof api.listSavedSupportFiles === 'function') {
    const select = document.createElement('select');
    select.className = 'compare-saved-select';
    select.disabled = state.loading;
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Saved…';
    select.appendChild(placeholder);
    for (const file of supportCompareState.savedFiles) {
      const opt = document.createElement('option');
      opt.value = file.id;
      opt.textContent = getSavedSupportFileTitle(file) || file.originalFileName || file.id;
      select.appendChild(opt);
    }
    select.value = '';
    select.addEventListener('change', (event) => {
      const id = event.target.value;
      if (id) handleCompareLoadSide(side, 'saved', id);
    });
    controls.appendChild(select);
  }

  wrap.appendChild(controls);

  if (state.error) {
    const err = document.createElement('div');
    err.className = 'compare-picker-error';
    err.textContent = state.error;
    wrap.appendChild(err);
  }
  return wrap;
}

function renderComparePickers(parent) {
  const bar = document.createElement('div');
  bar.className = 'compare-pickers';

  bar.appendChild(renderCompareSidePicker('a', 'Archive A'));

  const actions = document.createElement('div');
  actions.className = 'compare-picker-actions';
  const bothLoaded = Boolean(supportCompareState.a.sessionId && supportCompareState.b.sessionId);

  const swapBtn = document.createElement('button');
  swapBtn.type = 'button';
  swapBtn.className = 'compare-action-button';
  swapBtn.textContent = 'Swap A↔B';
  swapBtn.disabled = !bothLoaded;
  swapBtn.addEventListener('click', handleCompareSwap);
  actions.appendChild(swapBtn);

  const recompareBtn = document.createElement('button');
  recompareBtn.type = 'button';
  recompareBtn.className = 'compare-action-button';
  recompareBtn.textContent = supportCompareState.comparing ? 'Comparing…' : 'Re-compare';
  recompareBtn.disabled = !bothLoaded || supportCompareState.comparing;
  recompareBtn.addEventListener('click', () => runCompare());
  actions.appendChild(recompareBtn);

  bar.appendChild(actions);
  bar.appendChild(renderCompareSidePicker('b', 'Archive B'));
  parent.appendChild(bar);
}

function renderCompareCategoryChips() {
  const chips = document.createElement('div');
  chips.className = 'compare-category-chips';
  const counts = supportCompareState.manifest.counts;
  const totalDiff = counts.changed + counts.onlyA + counts.onlyB;
  const defs = [
    ['all', 'All', totalDiff],
    ['config', 'Config', counts.byCategory.config],
    ['logs', 'Logs', counts.byCategory.logs],
    ['json', 'JSON', counts.byCategory.json],
    ['other', 'Other', counts.byCategory.other]
  ];
  for (const [key, label, count] of defs) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'compare-chip';
    chip.classList.toggle('active', supportCompareState.categoryFilter === key);
    chip.textContent = `${label} (${count})`;
    chip.addEventListener('click', () => {
      supportCompareState = { ...supportCompareState, categoryFilter: key };
      renderProductApp();
    });
    chips.appendChild(chip);
  }
  return chips;
}

function renderCompareFileList(listEl) {
  listEl.innerHTML = '';
  const files = getCompareFilteredFiles();
  if (!files.length) {
    listEl.appendChild(makeCompareEmptyState('No files match the current filters.'));
    return;
  }
  for (const file of files) {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = `compare-file-row status-${file.status}`;
    row.classList.toggle('active', supportCompareState.selectedPath === file.path);

    const badgeInfo = getCompareStatusBadge(file);
    if (badgeInfo.symbol) {
      const badge = document.createElement('span');
      badge.className = `compare-status-badge ${badgeInfo.className}`;
      badge.textContent = badgeInfo.symbol;
      badge.title = badgeInfo.label;
      row.appendChild(badge);
    }

    const pathSpan = document.createElement('span');
    pathSpan.className = 'compare-file-path';
    pathSpan.textContent = getCompareFileDisplayPath(file);
    pathSpan.title = getCompareFileTitle(file);
    row.appendChild(pathSpan);

    row.addEventListener('click', () => handleCompareSelectFile(file.path));
    listEl.appendChild(row);
  }
}

function renderCompareListPanel(parent) {
  const { a, b, manifest, comparing, compareError } = supportCompareState;

  if (!a.sessionId || !b.sessionId) {
    parent.appendChild(makeCompareEmptyState(
      a.sessionId || b.sessionId
        ? 'Load the second archive to compare.'
        : 'Import or pick two support archives to compare.'
    ));
    return;
  }
  if (comparing) {
    parent.appendChild(makeCompareEmptyState('Comparing…'));
    return;
  }
  if (compareError) {
    parent.appendChild(makeCompareEmptyState(compareError, true));
    return;
  }
  if (!manifest) {
    parent.appendChild(makeCompareEmptyState('No comparison yet.'));
    return;
  }

  renderCompareDifferencesPanel(parent);
}

function getCompareContentSearchStatus(search) {
  if (search.loading) return { text: 'Searching...', isError: false };
  if (search.error) return { text: search.error, isError: true };
  if (normalizeSearchQuery(search.query) && search.results) {
    if (search.results.totalFiles === 0) return { text: 'No matches', isError: false };
    const fileLabel = search.results.totalFiles === 1 ? '1 file' : `${search.results.totalFiles} files`;
    const matchLabel = search.results.totalMatches === 1 ? '1 match' : `${search.results.totalMatches} matches`;
    return {
      text: `${fileLabel}, ${matchLabel}${search.results.truncated ? ' (truncated)' : ''}`,
      isError: false
    };
  }
  return { text: 'Type a word to show files that contain it.', isError: false };
}

function renderCompareContentSearchRow() {
  const search = getCompareContentSearchState();
  const row = document.createElement('div');
  row.className = 'compare-content-search-row';

  const input = document.createElement('input');
  input.type = 'search';
  input.id = 'compare-content-search-input';
  input.className = 'compare-path-filter compare-content-search-input';
  input.placeholder = 'Search word in files...';
  input.value = search.query;
  input.setAttribute('aria-label', 'Search word in compare files');
  input.addEventListener('input', () => {
    const nextQuery = input.value;
    compareContentSearchToken++;
    supportCompareState = {
      ...supportCompareState,
      contentSearch: {
        ...getCompareContentSearchState(),
        active: true,
        query: nextQuery,
        loading: Boolean(normalizeSearchQuery(nextQuery)),
        error: '',
        results: null
      }
    };
    renderProductApp();
    refocusCompareContentSearchInput();
    scheduleCompareContentSearch();
  });
  input.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    runCompareContentSearch();
  });
  row.appendChild(input);

  const status = document.createElement('span');
  const statusInfo = getCompareContentSearchStatus(search);
  status.className = 'compare-content-search-status' + (statusInfo.isError ? ' is-error' : '');
  status.textContent = statusInfo.text;
  row.appendChild(status);

  return row;
}

function renderCompareDifferencesPanel(parent) {
  const header = document.createElement('div');
  header.className = 'compare-list-header';

  if (supportCompareState.sameFile) {
    const notice = document.createElement('div');
    notice.className = 'compare-same-file-notice';
    notice.textContent = 'A and B are the same saved file.';
    header.appendChild(notice);
  }

  header.appendChild(renderCompareCategoryChips());

  const controlsRow = document.createElement('div');
  controlsRow.className = 'compare-list-controls';

  const toggle = document.createElement('label');
  toggle.className = 'compare-identical-toggle';
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = supportCompareState.showIdentical;
  checkbox.addEventListener('change', () => {
    supportCompareState = { ...supportCompareState, showIdentical: checkbox.checked };
    renderProductApp();
  });
  toggle.appendChild(checkbox);
  const toggleText = document.createElement('span');
  toggleText.textContent = 'Show identical';
  toggle.appendChild(toggleText);
  controlsRow.appendChild(toggle);

  const filter = document.createElement('input');
  filter.type = 'search';
  filter.className = 'compare-path-filter';
  filter.placeholder = 'Filter by path…';
  filter.value = supportCompareState.pathFilter;
  filter.addEventListener('input', () => {
    supportCompareState.pathFilter = filter.value;
    const listEl = parent.querySelector('.compare-list');
    if (listEl) renderCompareFileList(listEl);
  });
  controlsRow.appendChild(filter);

  const contentSearch = getCompareContentSearchState();
  const searchButton = document.createElement('button');
  searchButton.type = 'button';
  searchButton.className = 'compare-action-button compare-content-search-button';
  searchButton.textContent = 'Search';
  searchButton.setAttribute('aria-pressed', contentSearch.active ? 'true' : 'false');
  searchButton.addEventListener('click', () => {
    if (contentSearch.active) {
      clearCompareContentSearchWork();
      supportCompareState = {
        ...supportCompareState,
        contentSearch: { ...contentSearch, active: false, loading: false, error: '', results: null }
      };
      renderProductApp();
      return;
    }

    supportCompareState = {
      ...supportCompareState,
      contentSearch: { ...contentSearch, active: true }
    };
    renderProductApp();
    refocusCompareContentSearchInput();
    if (normalizeSearchQuery(contentSearch.query) && !contentSearch.results) {
      runCompareContentSearch();
    }
  });
  controlsRow.appendChild(searchButton);

  header.appendChild(controlsRow);
  if (contentSearch.active) {
    header.appendChild(renderCompareContentSearchRow());
  }
  parent.appendChild(header);

  const list = document.createElement('div');
  list.className = 'compare-list';
  parent.appendChild(list);
  renderCompareFileList(list);
}

function makeCompareDiffCell(side, row) {
  const cell = document.createElement('div');
  const lineNo = side === 'a' ? row.aNo : row.bNo;
  const text = side === 'a' ? row.aText : row.bText;

  let tone = 'equal';
  if (row.type === 'change') tone = 'change';
  else if (row.type === 'del') tone = side === 'a' ? 'del' : 'empty';
  else if (row.type === 'add') tone = side === 'b' ? 'add' : 'empty';
  cell.className = `compare-diff-cell side-${side} tone-${tone}`;

  const num = document.createElement('span');
  num.className = 'compare-diff-lineno';
  num.textContent = lineNo == null ? '' : String(lineNo);
  cell.appendChild(num);

  const content = document.createElement('span');
  content.className = 'compare-diff-linetext';
  content.textContent = tone === 'empty' ? '' : text;
  cell.appendChild(content);

  return cell;
}

function renderCompareDiffRows(container, rows) {
  const grid = document.createElement('div');
  grid.className = 'compare-diff-grid';
  const limit = Math.min(rows.length, COMPARE_MAX_RENDER_ROWS);
  for (let i = 0; i < limit; i++) {
    grid.appendChild(makeCompareDiffCell('a', rows[i]));
    grid.appendChild(makeCompareDiffCell('b', rows[i]));
  }
  container.appendChild(grid);
  if (rows.length > limit) {
    const more = document.createElement('div');
    more.className = 'compare-diff-note';
    more.textContent = `Showing the first ${limit} of ${rows.length} diff rows.`;
    container.appendChild(more);
  }
}

function renderCompareDiffPanel(parent) {
  const { selectedPath, selected } = supportCompareState;
  if (!selectedPath) {
    parent.appendChild(makeCompareEmptyState('Select a file to see the side-by-side diff.'));
    return;
  }

  const hasDiff = !selected.loading && !selected.error && !selected.binary && !selected.tooLarge && selected.rows.length > 0;

  const header = document.createElement('div');
  header.className = 'compare-diff-header';
  const pathEl = document.createElement('span');
  pathEl.className = 'compare-diff-path';
  pathEl.textContent = getCompareFileDisplayPath(selected) || selectedPath;
  pathEl.title = getCompareFileTitle(selected);
  header.appendChild(pathEl);

  if (hasDiff) {
    const counts = document.createElement('span');
    counts.className = 'compare-diff-counts';
    const added = document.createElement('span');
    added.className = 'compare-count-added';
    added.textContent = `+${selected.addedCount}`;
    const removed = document.createElement('span');
    removed.className = 'compare-count-removed';
    removed.textContent = `-${selected.removedCount}`;
    counts.appendChild(added);
    counts.appendChild(removed);
    header.appendChild(counts);
  }
  parent.appendChild(header);

  if (hasDiff) parent.appendChild(renderCompareDiffFindBar());

  if (selected.note) {
    const note = document.createElement('div');
    note.className = 'compare-diff-note';
    note.textContent = selected.note;
    parent.appendChild(note);
  }

  const bodyArea = document.createElement('div');
  bodyArea.className = 'compare-diff-body';
  parent.appendChild(bodyArea);
  fillCompareDiffBody(bodyArea);
}

function fillCompareDiffBody(bodyArea) {
  const selected = supportCompareState.selected;
  if (selected.loading) { bodyArea.appendChild(makeCompareEmptyState('Loading…')); return; }
  if (selected.error) { bodyArea.appendChild(makeCompareEmptyState(selected.error, true)); return; }
  if (selected.binary) { return; }
  if (selected.tooLarge) {
    if (selected.previewRows.length) {
      renderCompareDiffRows(bodyArea, selected.previewRows);
      return;
    }
    bodyArea.appendChild(makeCompareEmptyState('This file is too large for an inline line diff.', true));
    return;
  }
  if (!selected.rows.length) { bodyArea.appendChild(makeCompareEmptyState('No differences — the files are identical.')); return; }

  const diffApi = (typeof window !== 'undefined' && window.SupportDiff) || null;
  const result = diffApi && typeof diffApi.filterDiffRows === 'function'
    ? diffApi.filterDiffRows(selected.rows, supportCompareState.diffSearch)
    : { rows: selected.rows, filtered: false, error: '' };

  if (result.error) {
    const err = document.createElement('div');
    err.className = 'compare-diff-note is-error';
    err.textContent = result.error;
    bodyArea.appendChild(err);
  } else if (result.filtered) {
    const info = document.createElement('div');
    info.className = 'compare-diff-note';
    info.textContent = `Showing ${result.rows.length} of ${selected.rows.length} lines`;
    bodyArea.appendChild(info);
  }

  if (!result.rows.length) {
    bodyArea.appendChild(makeCompareEmptyState('No lines match the filter.'));
    return;
  }
  renderCompareDiffRows(bodyArea, result.rows);
}

function rerenderCompareDiffBody() {
  const bodyArea = document.querySelector('.compare-diff-panel .compare-diff-body');
  if (!bodyArea) return;
  bodyArea.innerHTML = '';
  fillCompareDiffBody(bodyArea);
}

function refocusCompareDiffFind() {
  requestAnimationFrame(() => {
    const input = document.getElementById('compare-diff-find-input');
    if (!input || input.disabled) return;
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  });
}

function makeCompareDiffToggleButton(label, pressed, title, onToggle) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'file-support-grep-button';
  button.textContent = label;
  button.title = title;
  button.setAttribute('aria-pressed', pressed ? 'true' : 'false');
  button.addEventListener('click', () => {
    onToggle();
    renderProductApp();
    refocusCompareDiffFind();
  });
  return button;
}

function renderCompareDiffFindBar() {
  const ds = supportCompareState.diffSearch;
  const bar = document.createElement('div');
  bar.className = 'compare-diff-find';

  const input = document.createElement('input');
  input.type = 'search';
  input.id = 'compare-diff-find-input';
  input.className = 'compare-diff-find-input';
  input.placeholder = 'Filter diff lines (grep / -i / Cut)…';
  input.value = ds.query;
  input.addEventListener('input', () => {
    supportCompareState.diffSearch.query = input.value;
    rerenderCompareDiffBody();
  });
  bar.appendChild(input);

  const controls = document.createElement('div');
  controls.className = 'compare-diff-find-controls';
  controls.appendChild(makeCompareDiffToggleButton('grep', ds.grep, 'Treat the query as a regular expression', () => {
    supportCompareState.diffSearch.grep = !supportCompareState.diffSearch.grep;
  }));
  controls.appendChild(makeCompareDiffToggleButton('-i', ds.ignoreCase, 'Ignore uppercase and lowercase differences', () => {
    supportCompareState.diffSearch.ignoreCase = !supportCompareState.diffSearch.ignoreCase;
  }));
  controls.appendChild(makeCompareDiffToggleButton('Cut', ds.cut, 'Show lines that do NOT match', () => {
    supportCompareState.diffSearch.cut = !supportCompareState.diffSearch.cut;
  }));
  bar.appendChild(controls);

  return bar;
}

function renderCompareBody(parent) {
  const listPanel = document.createElement('div');
  listPanel.className = 'compare-list-panel';
  parent.appendChild(listPanel);
  renderCompareListPanel(listPanel);

  const diffPanel = document.createElement('div');
  diffPanel.className = 'compare-diff-panel';
  parent.appendChild(diffPanel);
  renderCompareDiffPanel(diffPanel);
}

function renderCompareView(workspace) {
  ensureCompareSavedFiles();

  const view = document.createElement('div');
  view.className = 'compare-view';

  const toolbar = document.createElement('div');
  toolbar.className = 'compare-toolbar';
  const title = document.createElement('span');
  title.className = 'compare-toolbar-title';
  title.textContent = 'Compare support archives';
  toolbar.appendChild(title);
  const fullscreenButton = document.createElement('button');
  fullscreenButton.type = 'button';
  fullscreenButton.className = 'compare-fullscreen-button';
  fullscreenButton.textContent = supportCompareFullscreen ? 'Normal View' : 'Full Screen';
  fullscreenButton.setAttribute('aria-pressed', supportCompareFullscreen ? 'true' : 'false');
  fullscreenButton.addEventListener('click', () => {
    supportCompareFullscreen = !supportCompareFullscreen;
    renderProductApp();
  });
  toolbar.appendChild(fullscreenButton);
  view.appendChild(toolbar);

  renderComparePickers(view);

  const body = document.createElement('div');
  body.className = 'compare-body';
  view.appendChild(body);
  renderCompareBody(body);

  workspace.appendChild(view);
}

function renderFileSupportView(workspace) {
  const isViewerFullscreen = supportFileViewerFullscreen && Boolean(supportFileState.selectedFileId);
  const fullscreenViewportHeight = isViewerFullscreen
    ? Math.max(document.documentElement?.clientHeight || 0, window.innerHeight || 0)
    : 0;
  const fullscreenLayoutHeight = fullscreenViewportHeight > 0 ? `${fullscreenViewportHeight}px` : '100vh';
  const fullscreenPanelHeight = fullscreenViewportHeight > 24 ? `${fullscreenViewportHeight - 24}px` : 'calc(100vh - 24px)';
  const advancedActive = supportAdvancedSearch.active && supportFileState.tree.length > 0;
  const selectedContentPresentation = supportFileState.selectedFileId
    && !supportFileState.selectedLoading
    && !supportFileState.selectedError
    ? getSupportContentSearchPresentation(
        supportFileState.selectedPath,
        supportFileState.selectedContent,
        supportContentSearchQuery,
        supportContentViewMode
      )
    : null;

  const header = document.createElement('div');
  header.className = 'vm-header monitor-header product-line-header file-support-header';

  const headerText = document.createElement('div');
  headerText.className = 'monitor-header-text';
  const headerRow = document.createElement('div');
  headerRow.className = 'monitor-header-row';

  const title = document.createElement('h2');
  title.id = 'product-line-header-title';
  title.textContent = 'File Support';
  headerRow.appendChild(title);

  if (supportFileState.fileName) {
    const summary = document.createElement('div');
    summary.className = 'file-support-summary';
    const stats = supportFileState.stats || {};
    const displayName = supportFileState.savedFile?.alias
      ? `${supportFileState.savedFile.alias} (${supportFileState.fileName})`
      : supportFileState.fileName;
    summary.textContent = [
      displayName,
      `${stats.fileCount || 0} files`,
      `${stats.directoryCount || 0} folders`
    ].join(' | ');
    headerRow.appendChild(summary);
  }

  const controls = document.createElement('div');
  controls.className = 'template-top-controls file-support-controls';
  const importButton = document.createElement('button');
  importButton.type = 'button';
  importButton.className = 'config-transfer-button file-support-import-button';
  importButton.textContent = supportFileState.importing ? 'Importing...' : 'Import Support File';
  importButton.disabled = supportFileState.importing;
  importButton.addEventListener('click', handleSupportFileImport);
  controls.appendChild(importButton);

  const savedFilesButton = document.createElement('button');
  savedFilesButton.type = 'button';
  savedFilesButton.className = 'config-transfer-button file-support-saved-files-button';
  savedFilesButton.textContent = 'Saved Files';
  savedFilesButton.addEventListener('click', openSavedSupportFilesModal);
  controls.appendChild(savedFilesButton);

  const shortcutsButton = document.createElement('button');
  shortcutsButton.type = 'button';
  shortcutsButton.className = 'file-support-shortcuts-button';
  shortcutsButton.textContent = '?';
  shortcutsButton.setAttribute('aria-label', 'Keyboard shortcuts');
  shortcutsButton.title = 'Keyboard shortcuts';
  shortcutsButton.addEventListener('click', () => {
    const modal = document.getElementById('file-support-shortcuts-modal');
    if (modal) modal.style.display = 'flex';
  });
  controls.appendChild(shortcutsButton);
  headerRow.appendChild(controls);

  headerText.appendChild(headerRow);
  header.appendChild(headerText);
  workspace.appendChild(header);

  if (supportFileState.importError) {
    const error = document.createElement('div');
    error.className = 'file-support-alert';
    error.textContent = supportFileState.importError;
    workspace.appendChild(error);
  }

  const layout = document.createElement('section');
  layout.className = `file-support-layout${isViewerFullscreen ? ' is-viewer-fullscreen' : ''}`;
  layout.style.setProperty('--file-support-tree-width', `${supportFileTreeWidth}px`);
  if (isViewerFullscreen) {
    Object.assign(layout.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '1000',
      width: '100vw',
      height: fullscreenLayoutHeight,
      minHeight: fullscreenLayoutHeight,
      padding: '12px',
      boxSizing: 'border-box',
      display: 'grid',
      overflow: 'hidden'
    });
  }

  const treePanel = document.createElement('div');
  treePanel.className = 'file-support-panel file-support-tree-panel';
  renderFileSupportTreePanel(treePanel);

  const resizer = document.createElement('div');
  resizer.className = 'file-support-resizer';
  resizer.setAttribute('role', 'separator');
  resizer.setAttribute('aria-orientation', 'vertical');
  resizer.setAttribute('aria-label', 'Resize archive tree');
  resizer.tabIndex = 0;
  resizer.title = 'Resize archive tree';
  resizer.addEventListener('pointerdown', (event) => startSupportTreeResize(event, layout));
  resizer.addEventListener('keydown', (event) => handleSupportTreeResizerKeydown(event, layout));

  const viewerPanel = document.createElement('div');
  viewerPanel.className = 'file-support-panel file-support-viewer-panel';
  if (isViewerFullscreen) {
    Object.assign(viewerPanel.style, {
      height: '100%',
      minHeight: '0',
      maxHeight: fullscreenPanelHeight,
      overflow: 'hidden'
    });
  }
  const viewerHeader = document.createElement('div');
  viewerHeader.className = 'file-support-viewer-header';
  const viewerTitleRow = document.createElement('div');
  viewerTitleRow.className = 'file-support-viewer-title-row';
  const viewerTitle = document.createElement('h3');
  viewerTitle.className = 'file-support-panel-title';
  viewerTitle.textContent = supportFileState.selectedPath || 'Viewer';
  viewerTitleRow.appendChild(viewerTitle);
  const viewModeControls = document.createElement('div');
  viewModeControls.className = 'file-support-view-mode-controls';
  [
    { id: 'ruby', label: 'Ruby' },
    { id: 'scala', label: 'Scala' },
    { id: 'python', label: 'Python' },
    { id: 'log', label: 'Log' }
  ].forEach(mode => {
    const modeButton = document.createElement('button');
    modeButton.type = 'button';
    modeButton.className = 'file-support-view-mode-button';
    modeButton.textContent = mode.label.charAt(0);
    modeButton.title = mode.label;
    modeButton.disabled = !supportFileState.selectedFileId;
    modeButton.setAttribute('aria-label', `${mode.label} view`);
    modeButton.setAttribute('aria-pressed', supportContentViewMode === mode.id ? 'true' : 'false');
    modeButton.addEventListener('click', () => {
      supportContentViewMode = supportContentViewMode === mode.id ? 'auto' : mode.id;
      renderProductApp();
    });
    viewModeControls.appendChild(modeButton);
  });
  viewerTitleRow.appendChild(viewModeControls);
  const fullscreenButton = document.createElement('button');
  fullscreenButton.type = 'button';
  fullscreenButton.className = 'file-support-fullscreen-button';
  fullscreenButton.textContent = isViewerFullscreen ? 'Normal View' : 'Full Screen';
  fullscreenButton.disabled = !supportFileState.selectedFileId;
  fullscreenButton.setAttribute('aria-pressed', isViewerFullscreen ? 'true' : 'false');
  fullscreenButton.setAttribute('aria-label', isViewerFullscreen ? 'Return to normal file view' : 'Open selected file full screen');
  fullscreenButton.addEventListener('click', () => {
    supportFileViewerFullscreen = !isViewerFullscreen;
    renderProductApp();
  });
  viewerTitleRow.appendChild(fullscreenButton);
  const summaryButton = document.createElement('button');
  summaryButton.type = 'button';
  summaryButton.className = 'file-support-fullscreen-button file-support-summary-toggle';
  summaryButton.textContent = 'Summary';
  summaryButton.disabled = !supportFileState.summary;
  summaryButton.setAttribute('aria-pressed', supportFileState.summaryVisible ? 'true' : 'false');
  summaryButton.setAttribute('aria-label', supportFileState.summaryVisible ? 'Hide troubleshooting summary' : 'Show troubleshooting summary');
  summaryButton.addEventListener('click', () => {
    supportFileState = {
      ...supportFileState,
      summaryVisible: !supportFileState.summaryVisible
    };
    renderProductApp();
  });
  viewerTitleRow.appendChild(summaryButton);

  const aiScanButton = document.createElement('button');
  aiScanButton.type = 'button';
  aiScanButton.className = 'file-support-fullscreen-button file-support-summary-toggle';
  aiScanButton.textContent = 'AI Scan';
  aiScanButton.disabled = !supportFileState.sessionId;
  aiScanButton.setAttribute('aria-pressed', supportSmartScanState.visible ? 'true' : 'false');
  aiScanButton.setAttribute('aria-label', supportSmartScanState.visible ? 'Hide AI scan' : 'Show AI scan');
  aiScanButton.addEventListener('click', () => {
    supportSmartScanState = {
      ...supportSmartScanState,
      visible: !supportSmartScanState.visible
    };
    renderProductApp();
  });
  viewerTitleRow.appendChild(aiScanButton);

  const advancedSearchButton = document.createElement('button');
  advancedSearchButton.type = 'button';
  advancedSearchButton.className = 'file-support-fullscreen-button file-support-advanced-toggle';
  advancedSearchButton.textContent = 'Advanced Search';
  advancedSearchButton.disabled = supportFileState.tree.length === 0;
  advancedSearchButton.setAttribute('aria-pressed', advancedActive ? 'true' : 'false');
  advancedSearchButton.setAttribute('aria-label', advancedActive ? 'Exit advanced search' : 'Search across all files in the archive');
  advancedSearchButton.addEventListener('click', () => setAdvancedSearchActive(!supportAdvancedSearch.active));
  viewerTitleRow.appendChild(advancedSearchButton);

  viewerHeader.appendChild(viewerTitleRow);
  const contentSearch = document.createElement('div');
  contentSearch.className = 'file-support-search';
  const contentSearchInput = document.createElement('input');
  contentSearchInput.type = 'search';
  contentSearchInput.id = 'file-support-content-search';
  contentSearchInput.className = 'file-support-search-input';
  contentSearchInput.placeholder = supportGrepEnabled ? 'grep pattern, e.g. -i error|fail' : 'Search in selected file';
  contentSearchInput.value = supportContentSearchQuery;
  contentSearchInput.disabled = !supportFileState.selectedFileId || supportFileState.selectedLoading || Boolean(supportFileState.selectedError);
  contentSearchInput.setAttribute('aria-label', 'Search selected file content');
  contentSearchInput.addEventListener('input', () => {
    supportContentSearchQuery = contentSearchInput.value;
    renderProductApp();
    requestAnimationFrame(() => {
      const nextInput = document.getElementById('file-support-content-search');
      if (!nextInput) return;
      nextInput.focus();
      nextInput.setSelectionRange(nextInput.value.length, nextInput.value.length);
    });
  });
  contentSearch.appendChild(contentSearchInput);
  const grepControls = document.createElement('div');
  grepControls.className = 'file-support-grep-controls';

  const grepButton = document.createElement('button');
  grepButton.type = 'button';
  grepButton.className = 'file-support-grep-button';
  grepButton.textContent = 'grep';
  grepButton.disabled = !supportFileState.selectedFileId || supportFileState.selectedLoading || Boolean(supportFileState.selectedError);
  grepButton.setAttribute('aria-pressed', supportGrepEnabled ? 'true' : 'false');
  grepButton.title = 'Show only lines matching the search pattern';
  grepButton.addEventListener('click', () => {
    supportGrepEnabled = !supportGrepEnabled;
    renderProductApp();
    requestAnimationFrame(() => focusSupportSearchInput('file-support-content-search'));
  });
  grepControls.appendChild(grepButton);

  const ignoreCaseButton = document.createElement('button');
  ignoreCaseButton.type = 'button';
  ignoreCaseButton.className = 'file-support-grep-button';
  ignoreCaseButton.textContent = '-i';
  ignoreCaseButton.disabled = !supportFileState.selectedFileId || supportFileState.selectedLoading || Boolean(supportFileState.selectedError);
  ignoreCaseButton.setAttribute('aria-pressed', supportGrepIgnoreCase ? 'true' : 'false');
  ignoreCaseButton.title = 'Ignore uppercase and lowercase differences';
  ignoreCaseButton.addEventListener('click', () => {
    supportGrepIgnoreCase = !supportGrepIgnoreCase;
    renderProductApp();
    requestAnimationFrame(() => focusSupportSearchInput('file-support-content-search'));
  });
  grepControls.appendChild(ignoreCaseButton);

  const cutButton = document.createElement('button');
  cutButton.type = 'button';
  cutButton.className = 'file-support-grep-button';
  cutButton.textContent = 'Cut';
  cutButton.disabled = !supportFileState.selectedFileId || supportFileState.selectedLoading || Boolean(supportFileState.selectedError);
  cutButton.setAttribute('aria-pressed', supportGrepCutMatches ? 'true' : 'false');
  cutButton.title = 'Hide matching lines from the viewer';
  cutButton.addEventListener('click', () => {
    supportGrepEnabled = true;
    supportGrepCutMatches = !supportGrepCutMatches;
    renderProductApp();
    requestAnimationFrame(() => focusSupportSearchInput('file-support-content-search'));
  });
  grepControls.appendChild(cutButton);
  contentSearch.appendChild(grepControls);
  if (normalizeSearchQuery(supportContentSearchQuery) && selectedContentPresentation) {
    const contentSearchStatus = document.createElement('span');
    contentSearchStatus.className = 'file-support-search-status';
    if (supportGrepEnabled) {
      const shown = selectedContentPresentation.shownLineCount || 0;
      const matched = selectedContentPresentation.matchLineCount || 0;
      const hidden = selectedContentPresentation.hiddenLineCount || 0;
      const mode = supportGrepCutMatches ? 'cut' : 'grep';
      const flags = selectedContentPresentation.ignoreCase ? ' -i' : '';
      contentSearchStatus.textContent = selectedContentPresentation.error
        ? 'invalid pattern'
        : `${mode}${flags}: ${shown} shown, ${matched} matched, ${hidden} hidden`;
    } else {
      contentSearchStatus.textContent = selectedContentPresentation.matchCount === 1
        ? '1 match'
        : `${selectedContentPresentation.matchCount} matches`;
    }
    contentSearch.appendChild(contentSearchStatus);
  }
  if (advancedActive) {
    viewerHeader.appendChild(buildAdvancedSearchBar());
  } else {
    viewerHeader.appendChild(contentSearch);
    if (supportSmartScanState.visible) {
      viewerHeader.appendChild(createSupportSmartScanControls());
    }
  }
  viewerPanel.appendChild(viewerHeader);

  const viewerBody = document.createElement('div');
  viewerBody.className = 'file-support-viewer-body';
  if (isViewerFullscreen) {
    Object.assign(viewerBody.style, {
      flex: '1 1 auto',
      minHeight: '0',
      height: '100%',
      overflow: 'auto'
    });
  }

  if (advancedActive && !supportAdvancedSearch.viewingResult) {
    renderAdvancedSearchResults(viewerBody);
  } else {
    if (advancedActive && supportAdvancedSearch.viewingResult) {
      const backButton = document.createElement('button');
      backButton.type = 'button';
      backButton.className = 'file-support-advanced-back';
      const backCount = supportAdvancedSearch.results?.totalMatches || 0;
      backButton.textContent = `← Back to results (${backCount})`;
      backButton.addEventListener('click', () => {
        supportAdvancedSearch = { ...supportAdvancedSearch, viewingResult: false };
        renderProductApp();
        refocusAdvancedSearchInput();
      });
      viewerBody.appendChild(backButton);
    } else {
      const dashboard = renderSupportSummaryDashboard();
      if (dashboard) {
        viewerBody.appendChild(dashboard);
      }
      if (supportSmartScanState.visible) {
        renderSupportSmartScanResult(viewerBody);
      }
    }

    if (supportFileState.selectedLoading) {
      const loading = document.createElement('div');
      loading.className = 'file-support-empty-state';
      loading.textContent = 'Loading file';
      viewerBody.appendChild(loading);
    } else if (supportFileState.selectedError) {
      const error = document.createElement('div');
      error.className = 'file-support-alert';
      error.textContent = supportFileState.selectedError;
      viewerBody.appendChild(error);
    } else if (supportFileState.selectedFileId) {
      if (supportFileState.selectedTruncated) {
        const truncated = document.createElement('div');
        truncated.className = 'file-support-warning';
        truncated.textContent = 'Preview truncated';
        viewerBody.appendChild(truncated);
      }
      const pre = document.createElement('pre');
      const presentation = selectedContentPresentation || getSupportContentPresentation(
        supportFileState.selectedPath,
        supportFileState.selectedContent,
        supportContentViewMode
      );
      pre.className = `file-support-content mode-${presentation.mode}`;
      pre.innerHTML = presentation.html;
      if (isViewerFullscreen) {
        Object.assign(pre.style, {
          minHeight: '100%',
          height: 'auto'
        });
      }
      pre.addEventListener('dblclick', (event) => {
        requestAnimationFrame(() => applySupportViewerSelectionToSearch(pre, event.target));
      });
      viewerBody.appendChild(pre);
    } else if (!advancedActive) {
      const emptyViewer = document.createElement('div');
      emptyViewer.className = 'file-support-empty-state';
      emptyViewer.textContent = supportFileState.tree.length === 0 ? 'Import a file' : 'Select a file';
      viewerBody.appendChild(emptyViewer);
    }
  }

  viewerPanel.appendChild(viewerBody);
  layout.appendChild(treePanel);
  layout.appendChild(resizer);
  layout.appendChild(viewerPanel);
  workspace.appendChild(layout);
}

function getFileSupportTreePanel() {
  return document.querySelector('.file-support-tree-panel');
}

function focusFileSupportTreeSearchInput() {
  requestAnimationFrame(() => {
    const nextInput = document.getElementById('file-support-tree-search');
    if (!nextInput) return;
    nextInput.focus();
    nextInput.setSelectionRange(nextInput.value.length, nextInput.value.length);
  });
}

function renderFileSupportTreePanel(treePanel, options = {}) {
  if (!treePanel) return;

  const { focusSearch = false, preserveScroll = false } = options;
  const treeSearchResult = filterSupportTreeNodes(supportFileState.tree, supportTreeSearchQuery);
  const treeSearchActive = normalizeSearchQuery(supportTreeSearchQuery).length > 0;
  const previousTree = preserveScroll ? treePanel.querySelector('.file-support-tree') : null;
  const previousScrollTop = previousTree ? previousTree.scrollTop : 0;

  treePanel.replaceChildren();

  const treeTitleRow = document.createElement('div');
  treeTitleRow.className = 'file-support-tree-title-row';
  const treeTitle = document.createElement('h3');
  treeTitle.className = 'file-support-panel-title';
  treeTitle.textContent = 'Archive Tree';
  treeTitleRow.appendChild(treeTitle);
  const treeExpandControls = document.createElement('div');
  treeExpandControls.className = 'file-support-tree-expand-controls';
  const expandAllBtn = document.createElement('button');
  expandAllBtn.type = 'button';
  expandAllBtn.className = 'file-support-tree-expand-btn';
  expandAllBtn.textContent = '+';
  expandAllBtn.title = 'Expand all folders';
  expandAllBtn.setAttribute('aria-label', 'Expand all folders');
  expandAllBtn.disabled = supportFileState.tree.length === 0;
  expandAllBtn.addEventListener('click', () => {
    getAllSupportDirIds(supportFileState.tree).forEach(id => expandedSupportFolders.add(id));
    renderFileSupportTreePanel(treePanel, { preserveScroll: true });
  });
  const collapseAllBtn = document.createElement('button');
  collapseAllBtn.type = 'button';
  collapseAllBtn.className = 'file-support-tree-expand-btn';
  collapseAllBtn.textContent = '−';
  collapseAllBtn.title = 'Collapse all folders';
  collapseAllBtn.setAttribute('aria-label', 'Collapse all folders');
  collapseAllBtn.disabled = supportFileState.tree.length === 0;
  collapseAllBtn.addEventListener('click', () => {
    expandedSupportFolders.clear();
    renderFileSupportTreePanel(treePanel, { preserveScroll: true });
  });
  treeExpandControls.appendChild(expandAllBtn);
  treeExpandControls.appendChild(collapseAllBtn);
  treeTitleRow.appendChild(treeExpandControls);
  treePanel.appendChild(treeTitleRow);

  const treeSearch = document.createElement('div');
  treeSearch.className = 'file-support-search';
  const treeSearchInput = document.createElement('input');
  treeSearchInput.type = 'search';
  treeSearchInput.id = 'file-support-tree-search';
  treeSearchInput.className = 'file-support-search-input';
  treeSearchInput.placeholder = 'Search files and folders';
  treeSearchInput.value = supportTreeSearchQuery;
  treeSearchInput.disabled = supportFileState.tree.length === 0;
  treeSearchInput.setAttribute('aria-label', 'Search archive tree');
  treeSearchInput.addEventListener('input', () => {
    supportTreeSearchQuery = treeSearchInput.value;
    renderFileSupportTreePanel(treePanel, { focusSearch: true });
  });
  treeSearch.appendChild(treeSearchInput);
  if (treeSearchActive) {
    const treeSearchStatus = document.createElement('span');
    treeSearchStatus.className = 'file-support-search-status';
    treeSearchStatus.textContent = treeSearchResult.matchCount === 1
      ? '1 match'
      : `${treeSearchResult.matchCount} matches`;
    treeSearch.appendChild(treeSearchStatus);
  }
  treePanel.appendChild(treeSearch);

  const quickSearches = document.createElement('div');
  quickSearches.className = 'file-support-quick-searches';
  FILE_SUPPORT_QUICK_SEARCHES.forEach(searchTerm => {
    const quickButton = document.createElement('button');
    quickButton.type = 'button';
    quickButton.className = 'file-support-quick-search-button';
    quickButton.textContent = searchTerm;
    quickButton.disabled = supportFileState.tree.length === 0;
    quickButton.title = `Search ${searchTerm}`;
    quickButton.addEventListener('click', () => {
      supportTreeSearchQuery = searchTerm;
      renderFileSupportTreePanel(treePanel, { focusSearch: true });
    });
    quickSearches.appendChild(quickButton);
  });
  treePanel.appendChild(quickSearches);

  if (supportFileState.tree.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'file-support-empty-state';
    emptyState.textContent = supportFileState.importing ? 'Importing support file' : 'No support file imported';
    treePanel.appendChild(emptyState);
  } else if (treeSearchActive && treeSearchResult.nodes.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'file-support-empty-state';
    emptyState.textContent = 'No matching paths';
    treePanel.appendChild(emptyState);
  } else {
    const tree = document.createElement('div');
    tree.className = 'file-support-tree';
    renderSupportTreeNodes(treeSearchActive ? treeSearchResult.nodes : supportFileState.tree, tree);
    treePanel.appendChild(tree);
    if (preserveScroll) tree.scrollTop = previousScrollTop;
  }

  if (focusSearch) {
    focusFileSupportTreeSearchInput();
  }
}

function getAllSupportDirIds(nodes, ids = []) {
  nodes.forEach(node => {
    if (node.type === 'directory') {
      ids.push(node.id);
      if (Array.isArray(node.children)) getAllSupportDirIds(node.children, ids);
    }
  });
  return ids;
}

function renderSupportTreeNodes(nodes, parent) {
  const list = document.createElement('ul');
  list.className = 'file-support-tree-list';
  nodes.forEach(node => {
    list.appendChild(createSupportTreeNode(node));
  });
  parent.appendChild(list);
}

function createSupportTreeNode(node) {
  const treeSearchActive = normalizeSearchQuery(supportTreeSearchQuery).length > 0;
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;
  const item = document.createElement('li');
  item.className = `file-support-tree-item ${node.type === 'directory' ? 'is-directory' : 'is-file'}`;

  const row = document.createElement('button');
  row.type = 'button';
  row.className = 'file-support-tree-row';
  row.classList.toggle('search-match', Boolean(node.searchMatched));

  const marker = document.createElement('span');
  marker.className = 'file-support-tree-marker';

  const label = document.createElement('span');
  label.className = 'file-support-tree-label';
  label.innerHTML = treeSearchActive
    ? highlightFuzzyLabel(node.name || node.path || '/', supportTreeSearchQuery)
    : escapeHTML(node.name || node.path || '/');

  const meta = document.createElement('span');
  meta.className = 'file-support-tree-meta';

  if (node.type === 'directory') {
    const expanded = treeSearchActive || expandedSupportFolders.has(node.id);
    marker.textContent = hasChildren ? (expanded ? '-' : '+') : '';
    row.setAttribute('aria-expanded', String(expanded));
    row.addEventListener('click', () => {
      if (treeSearchActive) return;
      if (expandedSupportFolders.has(node.id)) {
        expandedSupportFolders.delete(node.id);
      } else {
        expandedSupportFolders.add(node.id);
      }
      const treePanel = getFileSupportTreePanel();
      if (treePanel) {
        renderFileSupportTreePanel(treePanel, { preserveScroll: true });
        return;
      }
      renderProductApp();
    });
    row.appendChild(marker);
    row.appendChild(label);
    item.appendChild(row);

    if (expanded && hasChildren) {
      renderSupportTreeNodes(node.children, item);
    }
    return item;
  }

  marker.textContent = '';
  row.classList.toggle('active', supportFileState.selectedFileId === node.id);
  row.addEventListener('click', () => {
    handleSupportFileSelection(node);
  });
  if (Number.isFinite(Number(node.size))) {
    meta.textContent = formatSupportFileBytes(node.size);
  }
  row.appendChild(marker);
  row.appendChild(label);
  row.appendChild(meta);
  item.appendChild(row);
  return item;
}

async function handleSupportFileImport() {
  const supportAPI = getNetworkAPI();
  if (!supportAPI || typeof supportAPI.importSupportFile !== 'function') {
    showNotification('File import is not available');
    return;
  }

  supportFileState = {
    ...supportFileState,
    importing: true,
    importError: ''
  };
  renderProductApp();

  try {
    const result = await supportAPI.importSupportFile();
    if (result?.canceled) {
      supportFileState = {
        ...supportFileState,
        importing: false
      };
      renderProductApp();
      return;
    }

    if (!result || !result.success) {
      const message = result?.error || 'Could not import support file';
      supportFileState = {
        ...supportFileState,
        importing: false,
        importError: message
      };
      showNotification(message);
      renderProductApp();
      return;
    }

    applySupportFileLoadResult(result, 'Support file imported');
    if (supportSavedFilesState.visible) {
      refreshSavedSupportFiles();
    }
  } catch (error) {
    console.error('Error importing support file:', error);
    supportFileState = {
      ...supportFileState,
      importing: false,
      importError: error.message || 'Could not import support file'
    };
    showNotification('Could not import support file');
  }

  renderProductApp();
}

async function handleSupportFileSelection(node) {
  if (!node || node.type !== 'file' || !supportFileState.sessionId) return;
  const supportAPI = getNetworkAPI();
  if (!supportAPI || typeof supportAPI.getSupportFileEntryContent !== 'function') {
    showNotification('File viewer is not available');
    return;
  }

  const sessionId = supportFileState.sessionId;
  const selectedFileId = node.id;
  supportFileState = {
    ...supportFileState,
    selectedFileId,
    selectedPath: node.path,
    selectedContent: '',
    selectedError: '',
    selectedTruncated: false,
    selectedLoading: true,
    summaryVisible: false
  };
  renderProductApp();

  try {
    const result = await supportAPI.getSupportFileEntryContent(sessionId, selectedFileId);
    if (supportFileState.sessionId !== sessionId || supportFileState.selectedFileId !== selectedFileId) {
      return;
    }

    if (!result || !result.success) {
      supportFileState = {
        ...supportFileState,
        selectedContent: '',
        selectedError: result?.error || 'File content is not available',
        selectedTruncated: false,
        selectedLoading: false
      };
      renderProductApp();
      return;
    }

    supportFileState = {
      ...supportFileState,
      selectedPath: result.path || node.path,
      selectedContent: String(result.text || ''),
      selectedError: '',
      selectedTruncated: Boolean(result.truncated),
      selectedLoading: false
    };
  } catch (error) {
    console.error('Error loading support file entry:', error);
    supportFileState = {
      ...supportFileState,
      selectedContent: '',
      selectedError: error.message || 'File content is not available',
      selectedTruncated: false,
      selectedLoading: false
    };
  }

  renderProductApp();
}

function getGeneratedTemplateFallbackTitle(sourceText) {
  const compactText = String(sourceText || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 48);

  return cleanMarkdownTitle(compactText) || 'Generated note';
}

function ensureGeneratedTemplateTitle(body, sourceText) {
  const trimmedBody = String(body || '').trim();
  const firstContentLine = trimmedBody
    .split(/\r?\n/)
    .map(line => line.trim())
    .find(Boolean);

  if (firstContentLine && /^#{1,6}\s+\S/.test(firstContentLine)) {
    return trimmedBody;
  }

  return `# ${getGeneratedTemplateFallbackTitle(sourceText)}\n\n${trimmedBody}`;
}

async function requestTemplateGeneration(payload) {
  const networkAPI = getNetworkAPI();
  if (networkAPI && typeof networkAPI.generateSupportTemplate === 'function') {
    return networkAPI.generateSupportTemplate(payload);
  }

  if (window.location && /^https?:$/.test(window.location.protocol)) {
    const response = await fetch('/api/generate-template', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => null);
    if (result) {
      return result;
    }
    return { success: false, error: `Request failed with ${response.status}` };
  }

  return {
    success: false,
    error: 'Template generation requires the desktop app or local server'
  };
}

async function requestFileSupportAnalysis(payload) {
  const networkAPI = getNetworkAPI();
  if (networkAPI && typeof networkAPI.analyzeSupportFile === 'function') {
    return networkAPI.analyzeSupportFile(supportFileState.sessionId, payload);
  }

  return {
    success: false,
    error: 'Smart scan requires the desktop app'
  };
}

async function handleSupportSmartScan() {
  if (!supportFileState.sessionId) {
    showNotification('Import a support file first');
    return;
  }
  if (supportSmartScanState.loading) return;

  const providerConfig = getPreferredProviderConfig();
  if (!providerConfig.hasApiKey) {
    showNotification(`Add ${providerConfig.label} key in Settings`);
    return;
  }

  const fileSupportSkill = getFileSupportSkill().content.trim();
  if (!fileSupportSkill) {
    showNotification('Save a File Support skill first');
    return;
  }

  const scanQuery = supportSmartScanState.query;
  const selectedPath = supportFileState.selectedPath;
  supportSmartScanState = {
    ...supportSmartScanState,
    visible: true,
    loading: true,
    answer: '',
    error: '',
    sources: [],
    resultQuery: '',
    resultProvider: '',
    resultSelectedPath: '',
    completedAt: ''
  };
  renderProductApp();
  showNotification(`Scanning support file with ${providerConfig.label}`);

  try {
    const result = await requestFileSupportAnalysis({
      provider: providerConfig.provider,
      apiKey: providerConfig.apiKey,
      skill: fileSupportSkill,
      query: scanQuery,
      selectedFileId: supportFileState.selectedFileId
    });

    if (!result || !result.success) {
      throw new Error(result?.error || 'Smart scan failed');
    }

    supportSmartScanState = {
      ...supportSmartScanState,
      loading: false,
      answer: result.answer || '',
      error: '',
      sources: Array.isArray(result.sources) ? result.sources : [],
      resultQuery: scanQuery,
      resultProvider: providerConfig.label,
      resultSelectedPath: selectedPath,
      completedAt: new Date().toISOString()
    };
    showNotification('Smart scan complete');
  } catch (error) {
    console.error('Error running File Support smart scan:', error);
    supportSmartScanState = {
      ...supportSmartScanState,
      loading: false,
      answer: '',
      error: error.message || 'Smart scan failed',
      sources: [],
      resultQuery: scanQuery,
      resultProvider: providerConfig.label,
      resultSelectedPath: selectedPath,
      completedAt: ''
    };
    showNotification('Smart scan failed');
  }

  renderProductApp();
}

async function handleTemplateGeneration(createInput, generateButton) {
  const sourceText = createInput.value.trim();
  if (!sourceText) {
    showNotification('Paste text first');
    return;
  }

  const providerConfig = getPreferredProviderConfig();
  if (!providerConfig.hasApiKey) {
    showNotification(`Add ${providerConfig.label} key in Settings`);
    return;
  }

  const agentSkill = getAgentSkill().content.trim();
  if (!agentSkill) {
    showNotification('Save an agent skill first');
    return;
  }

  const originalButtonText = generateButton.textContent;
  createInput.disabled = true;
  generateButton.disabled = true;
  generateButton.textContent = 'Generating...';
  showNotification(`Generating with ${providerConfig.label}`);

  try {
    const result = await requestTemplateGeneration({
      provider: providerConfig.provider,
      apiKey: providerConfig.apiKey,
      skill: agentSkill,
      sourceText,
      templates: supportTemplates.map((template, index) => normalizeSupportTemplate(template, index))
    });

    if (!result || !result.success) {
      throw new Error(result?.error || 'Could not generate note');
    }

    const body = ensureGeneratedTemplateTitle(result.template, sourceText);
    const title = extractMarkdownTemplateTitle(body, getGeneratedTemplateFallbackTitle(sourceText));
    const template = {
      id: createTemplateId(title, supportTemplates.length + templateDrafts.length),
      title,
      body,
      hidden: false,
      sourceName: `${providerConfig.label} generated`
    };

    supportTemplates.push(template);
    activeTemplateId = template.id;
    saveSupportTemplates();
    createInput.value = '';
    showNotification('Note generated');
    renderProductApp();
  } catch (error) {
    console.error('Error generating template:', error);
    showNotification(error.message || 'Could not generate note');
  } finally {
    createInput.disabled = false;
    generateButton.disabled = createInput.value.trim().length === 0;
    generateButton.textContent = originalButtonText;
  }
}

function createTemplateListItem(template, index, options = {}) {
  const isDraft = Boolean(options.isDraft);
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'template-list-button';
  button.dataset.templateId = template.id;
  button.classList.toggle('active', template.id === activeTemplateId);
  button.addEventListener('click', () => {
    activeTemplateId = template.id;
    renderProductApp();
  });

  const title = document.createElement('span');
  title.className = 'template-list-button-title';
  title.textContent = template.title;

  const status = document.createElement('span');
  status.className = 'template-list-button-status';
  status.textContent = template.id === activeTemplateId
    ? 'Editing'
    : (isDraft ? 'Unsaved' : 'Show');

  button.appendChild(title);
  button.appendChild(status);

  return button;
}

function attachAutoSizingTextarea(textarea) {
  if (!(textarea instanceof HTMLTextAreaElement)) return () => {};
  const syncHeight = () => {
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };
  textarea.addEventListener('input', syncHeight);
  requestAnimationFrame(syncHeight);
  return syncHeight;
}

const TEMPLATE_ICONS = {
  copy: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>',
  save: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>',
  delete: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>',
  eye: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
  edit: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>'
};

// Minimal, dependency-free Markdown → HTML for the note preview. Input is
// escaped before any tags are added, so it is safe to assign via innerHTML.
function renderNoteMarkdownHtml(markdown) {
  const lines = String(markdown || '').split(/\r?\n/);
  const html = [];
  let inCode = false;
  let codeLines = [];
  let listType = null;
  let paragraph = [];

  const inline = (text) => escapeHTML(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');

  const flushParagraph = () => {
    if (paragraph.length) {
      html.push(`<p>${inline(paragraph.join(' '))}</p>`);
      paragraph = [];
    }
  };
  const closeList = () => {
    if (listType) {
      html.push(`</${listType}>`);
      listType = null;
    }
  };

  lines.forEach((line) => {
    if (/^```/.test(line)) {
      if (inCode) {
        html.push(`<pre><code>${escapeHTML(codeLines.join('\n'))}</code></pre>`);
        codeLines = [];
        inCode = false;
      } else {
        flushParagraph();
        closeList();
        inCode = true;
      }
      return;
    }
    if (inCode) {
      codeLines.push(line);
      return;
    }
    if (!line.trim()) {
      flushParagraph();
      closeList();
      return;
    }
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      flushParagraph();
      closeList();
      const level = heading[1].length;
      html.push(`<h${level}>${inline(heading[2].trim())}</h${level}>`);
      return;
    }
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) {
      flushParagraph();
      closeList();
      html.push('<hr>');
      return;
    }
    const listItem = line.match(/^\s*(?:[-*+]|\d+[.)])\s+(.*)$/);
    if (listItem) {
      flushParagraph();
      const type = /^\s*\d/.test(line) ? 'ol' : 'ul';
      if (listType && listType !== type) closeList();
      if (!listType) {
        listType = type;
        html.push(`<${type}>`);
      }
      html.push(`<li>${inline(listItem[1].trim())}</li>`);
      return;
    }
    const quote = line.match(/^\s*>\s?(.*)$/);
    if (quote) {
      flushParagraph();
      closeList();
      html.push(`<blockquote>${inline(quote[1])}</blockquote>`);
      return;
    }
    paragraph.push(line.trim());
  });

  if (inCode) {
    html.push(`<pre><code>${escapeHTML(codeLines.join('\n'))}</code></pre>`);
  }
  flushParagraph();
  closeList();
  return html.join('\n') || '<p class="template-body-preview-empty">Nothing to preview</p>';
}

function createTemplateChip(icon, label, { danger = false, primary = false } = {}) {
  const chip = document.createElement('button');
  chip.type = 'button';
  chip.className = 'template-action-chip';
  if (danger) chip.classList.add('template-action-chip-danger');
  if (primary) chip.classList.add('template-action-chip-primary');
  chip.title = label;
  chip.setAttribute('aria-label', label);
  chip.innerHTML = TEMPLATE_ICONS[icon] || '';
  return chip;
}

function createCaseNoteFieldsPanel(initialFields, onChange) {
  let fields = normalizeCaseNoteFields(initialFields);
  const panel = document.createElement('section');
  panel.className = 'case-note-fields-panel';

  const header = document.createElement('div');
  header.className = 'case-note-fields-header';

  const title = document.createElement('h3');
  title.textContent = 'Case fields';

  const clearButton = document.createElement('button');
  clearButton.type = 'button';
  clearButton.className = 'case-note-clear-button';
  clearButton.textContent = 'Clear fields';

  header.appendChild(title);
  header.appendChild(clearButton);
  panel.appendChild(header);

  const grid = document.createElement('div');
  grid.className = 'case-note-fields-grid';

  const inputs = new Map();
  const emitChange = () => {
    fields = normalizeCaseNoteFields(fields);
    onChange(fields);
  };

  CASE_NOTE_FIELDS.forEach((field) => {
    const label = document.createElement('label');
    label.className = 'case-note-field';
    if (field.multiline) {
      label.classList.add('case-note-field-wide');
    }

    const labelText = document.createElement('span');
    labelText.textContent = field.label;
    label.appendChild(labelText);

    const input = field.multiline
      ? document.createElement('textarea')
      : document.createElement('input');
    if (!field.multiline) {
      input.type = 'text';
    } else {
      input.rows = field.rows || 3;
    }
    input.value = fields[field.key] || '';
    input.placeholder = field.placeholder || field.label;
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.addEventListener('input', () => {
      fields = {
        ...fields,
        [field.key]: input.value
      };
      emitChange();
    });

    inputs.set(field.key, input);
    label.appendChild(input);
    grid.appendChild(label);
  });

  clearButton.addEventListener('click', () => {
    fields = createEmptyCaseNoteFields();
    inputs.forEach((input, key) => {
      input.value = fields[key] || '';
    });
    emitChange();
  });

  panel.appendChild(grid);
  return panel;
}

function createTemplateEditor(template, index, options = {}) {
  const isDraft = Boolean(options.isDraft);
  const isCaseNote = template.mode === CASE_NOTE_TEMPLATE_MODE;
  let caseNoteFields = isCaseNote
    ? normalizeCaseNoteFields(template.fields, template.body)
    : null;
  const editor = document.createElement('section');
  editor.className = 'template-editor-card';
  if (isCaseNote) {
    editor.classList.add('case-note-editor-card');
  }

  const toolbar = document.createElement('div');
  toolbar.className = 'template-editor-toolbar';

  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.className = 'template-title-input';
  titleInput.value = template.title;
  titleInput.placeholder = 'File name';
  titleInput.setAttribute('aria-label', 'File name');

  const bodyInput = document.createElement('textarea');
  bodyInput.className = 'template-body-input';
  bodyInput.value = isCaseNote ? buildCaseNoteMarkdown(caseNoteFields) : template.body;
  bodyInput.rows = 1;
  bodyInput.setAttribute('aria-label', `${template.title} body`);
  if (isCaseNote) {
    bodyInput.readOnly = true;
    bodyInput.classList.add('case-note-generated-markdown');
  }
  const syncBodyHeight = attachAutoSizingTextarea(bodyInput);

  // Rendered (non-markdown) preview shown in place of the editor textarea.
  const preview = document.createElement('div');
  preview.className = 'template-body-preview';
  preview.hidden = true;
  let isPreview = false;
  const refreshPreview = () => {
    if (isPreview) preview.innerHTML = renderNoteMarkdownHtml(bodyInput.value);
  };

  const viewToggleButton = createTemplateChip('eye', 'Preview');
  const setPreviewMode = (previewMode) => {
    isPreview = previewMode;
    if (isPreview) preview.innerHTML = renderNoteMarkdownHtml(bodyInput.value);
    preview.hidden = !isPreview;
    bodyInput.hidden = isPreview;
    viewToggleButton.innerHTML = TEMPLATE_ICONS[isPreview ? 'edit' : 'eye'] || '';
    const label = isPreview ? 'Edit markdown' : 'Preview';
    viewToggleButton.title = label;
    viewToggleButton.setAttribute('aria-label', label);
    viewToggleButton.classList.toggle('is-active', isPreview);
    if (!isPreview) syncBodyHeight();
  };
  viewToggleButton.addEventListener('click', () => setPreviewMode(!isPreview));

  const status = document.createElement('span');
  status.className = 'template-autosave-status';

  const actions = document.createElement('div');
  actions.className = 'template-editor-actions';
  let persistCaseNoteFields = null;
  const caseNotePanel = isCaseNote
    ? createCaseNoteFieldsPanel(caseNoteFields, (nextFields) => {
      caseNoteFields = normalizeCaseNoteFields(nextFields);
      bodyInput.value = buildCaseNoteMarkdown(caseNoteFields);
      syncBodyHeight();
      refreshPreview();
      syncScratchpadFromCaseNoteFields(caseNoteFields);
      if (typeof persistCaseNoteFields === 'function') {
        persistCaseNoteFields();
      }
    })
    : null;
  if (isCaseNote && Object.values(caseNoteFields).some(value => String(value || '').trim())) {
    syncScratchpadFromCaseNoteFields(caseNoteFields);
  }

  const copyGeneratedRow = isCaseNote ? document.createElement('div') : null;
  if (copyGeneratedRow) {
    copyGeneratedRow.className = 'case-note-generated-actions';

    const copyGeneratedButton = document.createElement('button');
    copyGeneratedButton.type = 'button';
    copyGeneratedButton.className = 'case-note-copy-generated-button';
    copyGeneratedButton.title = 'Copy generated note';
    copyGeneratedButton.setAttribute('aria-label', 'Copy generated note');
    copyGeneratedButton.innerHTML = `${TEMPLATE_ICONS.copy}<span>Copy all</span>`;
    copyGeneratedButton.addEventListener('click', () => {
      copyTemplateText(bodyInput.value);
    });

    copyGeneratedRow.appendChild(copyGeneratedButton);
  }

  const copyButton = createTemplateChip('copy', 'Copy note');
  copyButton.addEventListener('click', () => {
    // Preview mode copies the rendered (non-markdown) text; edit mode copies raw markdown.
    if (isPreview) {
      copyTemplateText(preview.innerText || preview.textContent || '');
    } else {
      copyTemplateText(bodyInput.value);
    }
  });

  const deleteButton = createTemplateChip('delete', isDraft ? 'Discard note' : 'Delete note', { danger: true });
  deleteButton.addEventListener('click', () => {
    if (isDraft) {
      templateDrafts.splice(index, 1);
      saveTemplateDrafts();
      activeTemplateId = templateDrafts[index]?.id || templateDrafts[index - 1]?.id || supportTemplates[0]?.id || '';
      showNotification('Note discarded');
      renderProductApp();
      return;
    }

    const templateTitle = titleInput.value.trim() || template.title || `Note ${index + 1}`;
    const shouldDelete = window.confirm(`Delete "${templateTitle}" permanently?`);
    if (!shouldDelete) return;

    supportTemplates.splice(index, 1);
    activeTemplateId = supportTemplates[index]?.id || supportTemplates[index - 1]?.id || '';
    saveSupportTemplates();
    showNotification('Note deleted');
    renderProductApp();
  });

  if (isDraft) {
    // AI drafts stay in session storage until promoted with Save.
    const saveButton = createTemplateChip('save', 'Save note', { primary: true });
    saveButton.addEventListener('click', () => {
      const nextBody = isCaseNote ? buildCaseNoteMarkdown(caseNoteFields) : bodyInput.value;
      const savedTemplate = {
        ...template,
        title: titleInput.value.trim() || (isCaseNote ? DEFAULT_CASE_NOTE_TITLE : `Note ${supportTemplates.length + 1}`),
        body: nextBody
      };
      if (isCaseNote) {
        savedTemplate.mode = CASE_NOTE_TEMPLATE_MODE;
        savedTemplate.fields = caseNoteFields;
      }
      supportTemplates.push(savedTemplate);
      templateDrafts.splice(index, 1);
      saveTemplateDrafts();
      activeTemplateId = savedTemplate.id;
      saveSupportTemplates();
      showNotification('Note saved');
      renderProductApp();
    });

    const syncDraft = () => {
      if (!templateDrafts[index]) return;
      const nextBody = isCaseNote ? buildCaseNoteMarkdown(caseNoteFields) : bodyInput.value;
      templateDrafts[index] = {
        ...templateDrafts[index],
        title: titleInput.value.trim() || (isCaseNote ? DEFAULT_CASE_NOTE_TITLE : template.title),
        body: nextBody
      };
      if (isCaseNote) {
        templateDrafts[index].mode = CASE_NOTE_TEMPLATE_MODE;
        templateDrafts[index].fields = caseNoteFields;
      }
      saveTemplateDrafts();
      syncBodyHeight();
    };
    titleInput.addEventListener('input', syncDraft);
    if (!isCaseNote) {
      bodyInput.addEventListener('input', syncDraft);
    }
    persistCaseNoteFields = syncDraft;

    status.textContent = 'Unsaved draft';
    status.classList.add('is-draft');
    actions.appendChild(saveButton);
  } else {
    // Saved notes autosave on every keystroke — no Save button needed.
    let savedTimer = null;
    const markSaved = () => {
      status.textContent = 'Saved';
      status.classList.remove('is-pending');
      status.classList.add('is-saved');
      if (savedTimer) clearTimeout(savedTimer);
      savedTimer = setTimeout(() => {
        status.classList.remove('is-saved');
        status.textContent = 'Auto-save on';
      }, 1500);
    };

    const autoSave = () => {
      if (!supportTemplates[index]) return;
      const nextTitle = titleInput.value.trim() || (isCaseNote ? DEFAULT_CASE_NOTE_TITLE : template.title);
      const nextBody = isCaseNote ? buildCaseNoteMarkdown(caseNoteFields) : bodyInput.value;
      supportTemplates[index] = {
        ...supportTemplates[index],
        title: nextTitle,
        body: nextBody
      };
      if (isCaseNote) {
        supportTemplates[index].mode = CASE_NOTE_TEMPLATE_MODE;
        supportTemplates[index].fields = caseNoteFields;
      }
      saveSupportTemplates();
      syncBodyHeight();
      // Keep the list entry's title in sync without a full re-render.
      const listTitle = document.querySelector(
        `.template-list-button[data-template-id="${template.id}"] .template-list-button-title`
      );
      if (listTitle) listTitle.textContent = nextTitle;
      markSaved();
    };

    status.textContent = 'Auto-save on';
    titleInput.addEventListener('input', autoSave);
    if (!isCaseNote) {
      bodyInput.addEventListener('input', autoSave);
    }
    persistCaseNoteFields = autoSave;
  }

  actions.appendChild(viewToggleButton);
  actions.appendChild(copyButton);
  actions.appendChild(deleteButton);

  toolbar.appendChild(titleInput);
  toolbar.appendChild(status);
  toolbar.appendChild(actions);
  editor.appendChild(toolbar);
  if (caseNotePanel) {
    editor.appendChild(caseNotePanel);
  }
  editor.appendChild(bodyInput);
  editor.appendChild(preview);
  if (copyGeneratedRow) {
    editor.appendChild(copyGeneratedRow);
  }

  return editor;
}

function createTemplateId(title, index = 0) {
  const slug = String(title || 'template')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'template';

  return `support-template-${Date.now()}-${index + 1}-${slug}`;
}

function createTemplateFromMarkdown(file, body, index) {
  const fallbackTitle = getTemplateTitleFromFilename(file.name);
  const title = extractMarkdownTemplateTitle(body, fallbackTitle);

  return {
    id: createTemplateId(title, supportTemplates.length + index),
    title,
    body,
    hidden: false,
    sourceName: file.name
  };
}

function getTemplateTitleFromFilename(filename) {
  const baseName = String(filename || 'Template')
    .split(/[\\/]/)
    .pop()
    .replace(/\.(md|markdown)$/i, '')
    .replace(/[-_]+/g, ' ')
    .trim();

  return cleanMarkdownTitle(baseName) || 'Template';
}

function extractMarkdownTemplateTitle(markdown, fallbackTitle) {
  const lines = String(markdown || '').split(/\r?\n/);
  const heading = lines
    .map(line => line.trim())
    .find(line => /^#{1,6}\s+\S/.test(line));

  if (heading) {
    return cleanMarkdownTitle(heading.replace(/^#{1,6}\s+/, '').replace(/\s+#+\s*$/, '')) || fallbackTitle;
  }

  return fallbackTitle;
}

function cleanMarkdownTitle(title) {
  return String(title || '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[`*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isMarkdownTemplateFile(file) {
  const fileName = String(file?.name || '');
  return /\.(md|markdown)$/i.test(fileName) || file?.type === 'text/markdown';
}

function readTemplateFileText(file) {
  if (file && typeof file.text === 'function') {
    return file.text();
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(String(event.target.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Could not read file'));
    reader.readAsText(file);
  });
}

async function handleTemplateFileSelection(event) {
  const input = event.target;
  const files = Array.from(input.files || []);
  const markdownFiles = files.filter(isMarkdownTemplateFile);

  if (markdownFiles.length === 0) {
    showNotification('Select .md files');
    input.value = '';
    return;
  }

  try {
    const importedTemplates = await Promise.all(markdownFiles.map(async (file, index) => {
      const body = await readTemplateFileText(file);
      return createTemplateFromMarkdown(file, body, index);
    }));

    supportTemplates.push(...importedTemplates);
    activeTemplateId = importedTemplates[0]?.id || activeTemplateId;
    saveSupportTemplates();
    showNotification(importedTemplates.length === 1 ? 'Note loaded' : `${importedTemplates.length} notes loaded`);
    renderProductApp();
  } catch (error) {
    console.error('Error importing templates:', error);
    showNotification('Could not load notes');
  } finally {
    input.value = '';
  }
}

async function copyTemplateText(text) {
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text);
    } else {
      const scratch = document.createElement('textarea');
      scratch.value = text;
      scratch.setAttribute('readonly', '');
      scratch.style.position = 'fixed';
      scratch.style.opacity = '0';
      document.body.appendChild(scratch);
      scratch.select();
      document.execCommand('copy');
      document.body.removeChild(scratch);
    }
    showNotification('Note copied');
  } catch (error) {
    console.error('Error copying template:', error);
    showNotification('Could not copy note');
  }
}

function createProductCard(item, line) {
  const card = document.createElement('div');
  card.className = 'vm-card monitor-vm-card product-card';
  card.dataset.itemId = item.id;
  card.setAttribute('role', 'button');
  card.tabIndex = 0;
  updateCardStatusIndicator(card, item, isItemOnline(item));

  const cardContent = document.createElement('div');
  cardContent.className = 'vm-card-content';

  const icon = document.createElement('div');
  icon.className = 'vm-icon product-icon';
  if (item.imageUrl) {
    icon.classList.add('has-image');
    icon.style.backgroundImage = `url("${resolveImageAssetUrl(item.imageUrl).replace(/"/g, '\\"')}")`;
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
  status.className = 'vm-status product-ip-status';
  const statusDot = document.createElement('span');
  statusDot.className = 'product-status-dot';
  statusDot.setAttribute('aria-hidden', 'true');
  const statusText = document.createElement('span');
  statusText.textContent = item.ip ? `IP: ${item.ip}` : 'IP not set';
  status.appendChild(statusDot);
  status.appendChild(statusText);

  const dns = document.createElement('div');
  dns.className = 'product-dns';
  dns.textContent = item.dnsDomain || '';

  const productMetadataName = item.defaultName || item.name;
  const links = PRODUCT_LINKS[productMetadataName] || [];
  const linksRow = document.createElement('div');
  linksRow.className = 'product-links';
  const sshRow = document.createElement('div');
  sshRow.className = 'product-ssh-row';
  links.forEach(link => {
    const anchor = document.createElement('a');
    anchor.href = link.url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    const webIcon = document.createElement('span');
    webIcon.className = 'product-web-icon';
    webIcon.setAttribute('aria-hidden', 'true');
    webIcon.textContent = '🌐';
    anchor.appendChild(webIcon);
    anchor.appendChild(document.createTextNode(link.label));
    anchor.addEventListener('click', (event) => {
      event.stopPropagation();
    });
    linksRow.appendChild(anchor);
  });
  const sshButton = document.createElement('button');
  sshButton.type = 'button';
  sshButton.className = 'product-link-button product-ssh-button';
  sshButton.textContent = 'SSH';
  sshButton.addEventListener('click', (event) => {
    event.stopPropagation();
    openSSHTerminalModal(item.id);
  });
  sshRow.appendChild(sshButton);

  const httpsButton = document.createElement('button');
  httpsButton.type = 'button';
  httpsButton.className = 'product-link-button product-https-button';
  httpsButton.textContent = 'Web Console';
  httpsButton.title = item.ip ? `Open https://${item.ip}` : 'Configure an IP before opening HTTPS';
  httpsButton.addEventListener('click', (event) => {
    event.stopPropagation();
    openItemHTTPS(item.id);
  });
  sshRow.appendChild(httpsButton);
  if (PRODUCT_SPECS[productMetadataName]) {
    const specsButton = document.createElement('button');
    specsButton.type = 'button';
    specsButton.className = 'product-link-button';
    specsButton.textContent = 'Specs';
    specsButton.addEventListener('click', (event) => {
      event.stopPropagation();
      openProductSpecsModal(productMetadataName);
    });
    linksRow.appendChild(specsButton);
  }

  cardContent.appendChild(icon);
  cardContent.appendChild(titleRow);
  if (item.ip) {
    cardContent.appendChild(status);
  }
  if (dns.textContent) {
    cardContent.appendChild(dns);
  }
  if (linksRow.children.length > 0) {
    cardContent.appendChild(linksRow);
  }
  if (sshRow.children.length > 0) {
    cardContent.appendChild(sshRow);
  }

  const docsSearch = createDocsSearchForm(item);
  if (docsSearch) {
    cardContent.appendChild(docsSearch);
  }
  card.appendChild(cardContent);
  updateCardStatusIndicator(card, item, isItemOnline(item));

  card.addEventListener('click', () => openItemConfigModal(item.id));
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openItemConfigModal(item.id);
    }
  });

  return card;
}

function formatHTTPSHost(ip) {
  const host = String(ip || '').trim();
  if (!host) return '';
  if (host.startsWith('http://') || host.startsWith('https://')) {
    return host;
  }
  if (host.includes(':') && !host.startsWith('[')) {
    return `https://[${host}]`;
  }
  return `https://${host}`;
}

function openItemHTTPS(itemId) {
  const match = findItemById(itemId);
  if (!match || !match.item.ip) {
    showNotification('Configure an IP before opening HTTPS');
    return;
  }

  const url = formatHTTPSHost(match.item.ip);
  if (!url) {
    showNotification('Configure an IP before opening HTTPS');
    return;
  }

  window.open(
    url,
    `digi-web-console-${itemId}`,
    'noopener,noreferrer,width=1280,height=860'
  );
}

function createDocsSearchForm(item) {
  const productMetadataName = item.defaultName || item.name;
  if (!buildDocsSearchUrl(productMetadataName)) return null;

  const form = document.createElement('form');
  form.className = 'docs-search-form';
  form.setAttribute('aria-label', `Search docs for ${item.name}`);

  const input = document.createElement('input');
  input.type = 'search';
  input.className = 'docs-search-input';
  input.placeholder = 'Search docs';
  input.autocomplete = 'off';

  const button = document.createElement('button');
  button.type = 'submit';
  button.className = 'docs-search-button';
  button.textContent = 'Search';

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
    openDocsSearch(productMetadataName, input.value);
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
  const importTemplateButton = document.getElementById('import-template-btn');

  if (importTemplateButton) {
    importTemplateButton.disabled = activeLineId !== TEMPLATES_VIEW_ID;
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
  const nameInput = document.getElementById('item-name');
  const restoreNameButton = document.getElementById('restore-item-name');
  const ipInput = document.getElementById('item-ip');
  const imageInput = document.getElementById('item-image');
  const imageFileInput = document.getElementById('item-image-file');
  const scanIntervalInput = document.getElementById('item-scan-interval');
  const dnsInput = document.getElementById('item-dns-domain');
  const match = findItemById(itemId);

  if (!modal || !nameInput || !ipInput || !match) return;

  editingItemId = itemId;
  match.item.defaultName = match.item.defaultName || match.item.name;
  resetItemConfigTemp();
  itemConfigTemp.imageUrl = match.item.imageUrl || '';
  itemConfigTemp.ports = normalizePorts(match.item.ports);

  nameInput.value = match.item.name || '';
  if (restoreNameButton) {
    restoreNameButton.disabled = match.item.name === match.item.defaultName;
  }
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

function openProductSpecsModal(itemName) {
  const modal = document.getElementById('product-specs-modal');
  const title = document.getElementById('product-specs-title');
  const eyebrow = document.getElementById('product-specs-eyebrow');
  const body = document.getElementById('product-specs-body');
  const specs = PRODUCT_SPECS[itemName];

  if (!modal || !title || !body || !specs) return;

  title.textContent = itemName;
  if (eyebrow) {
    eyebrow.textContent = specs.subtitle || 'Specifications';
  }

  body.innerHTML = '';
  if (specs.sourceUrl) {
    const sourceLink = document.createElement('a');
    sourceLink.className = 'product-specs-source-link';
    sourceLink.href = specs.sourceUrl;
    sourceLink.target = '_blank';
    sourceLink.rel = 'noopener noreferrer';
    sourceLink.textContent = 'Open official specifications';
    sourceLink.addEventListener('click', (event) => {
      event.stopPropagation();
    });
    body.appendChild(sourceLink);
  }
  specs.sections.forEach(section => {
    const sectionElement = document.createElement('section');
    sectionElement.className = 'product-specs-section';

    const heading = document.createElement('h3');
    heading.textContent = section.title;
    sectionElement.appendChild(heading);

    const table = document.createElement('div');
    table.className = 'product-specs-table';
    if (Array.isArray(section.columns) && section.columns.length > 0) {
      table.classList.add('is-comparison');
      const headerRow = document.createElement('div');
      headerRow.className = 'product-specs-row product-specs-column-header';
      section.columns.forEach(column => {
        const headerCell = document.createElement('div');
        headerCell.className = 'product-specs-column-heading';
        headerCell.textContent = column;
        headerRow.appendChild(headerCell);
      });
      table.appendChild(headerRow);
    }

    section.rows.forEach(cells => {
      const row = document.createElement('div');
      row.className = 'product-specs-row';
      cells.forEach((value, index) => {
        const cell = document.createElement('div');
        cell.className = index === 0 ? 'product-specs-label' : 'product-specs-value';
        cell.textContent = value;
        row.appendChild(cell);
      });
      table.appendChild(row);
    });

    sectionElement.appendChild(table);
    body.appendChild(sectionElement);
  });

  modal.style.display = 'flex';
}

function closeProductSpecsModal() {
  const modal = document.getElementById('product-specs-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

function renderProductImageModal() {
  const image = document.getElementById('product-image-preview');
  const prevButton = document.getElementById('product-image-prev');
  const nextButton = document.getElementById('product-image-next');
  const currentImage = imageViewerState.images[imageViewerState.imageIndex];

  if (image) {
    image.src = resolveImageAssetUrl(currentImage);
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

function setupProductSpecsModal() {
  const modal = document.getElementById('product-specs-modal');
  const closeButton = document.getElementById('close-product-specs');

  if (!modal) return;

  if (closeButton) {
    closeButton.addEventListener('click', closeProductSpecsModal);
  }

  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeProductSpecsModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (modal.style.display === 'flex' && event.key === 'Escape') {
      closeProductSpecsModal();
    }
  });
}

function nextSshClientId() {
  return `sshc_${++sshClientCounter}`;
}

function getActiveSession() {
  return activeSshClientId ? sshSessions.get(activeSshClientId) || null : null;
}

function findSessionBySessionId(sessionId) {
  if (!sessionId) return null;
  for (const session of sshSessions.values()) {
    if (session.sessionId === sessionId) return session;
  }
  return null;
}

function findSessionByItemId(itemId) {
  if (itemId === null || itemId === undefined) return null;
  for (const session of sshSessions.values()) {
    if (session.itemId === itemId) return session;
  }
  return null;
}

function sshStatusText(status) {
  switch (status) {
    case 'connected': return 'Connected';
    case 'connecting': return 'Connecting...';
    case 'closed': return 'Disconnected';
    case 'error': return 'SSH error';
    default: return 'Not connected';
  }
}

function sshStatusState(status) {
  if (status === 'connected') return 'connected';
  if (status === 'connecting') return 'connecting';
  if (status === 'error') return 'error';
  return 'idle';
}

// Creates a Session with its own xterm instance mounted in its own container.
// The xterm is opened once and never moved between containers.
function formatSSHSessionLabels(username, host, port, { logPath = '' } = {}) {
  const userHost = `${username}@${host}`;
  if (logPath) {
    const label = `tail -f ${logPath} \u2014 ${userHost}`;
    return {
      label,
      compactLabel: label
    };
  }

  return {
    label: userHost,
    compactLabel: `${userHost}:${port}`
  };
}

function createSSHSession(itemId, item, host, port, username, options = {}) {
  const hostArea = document.getElementById('ssh-terminal-container');
  if (!hostArea) return null;

  const containerEl = document.createElement('div');
  containerEl.className = 'ssh-term-instance';
  containerEl.style.display = 'none';
  hostArea.appendChild(containerEl);

  const terminal = new Terminal({
    cursorBlink: true,
    convertEol: true,
    fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
    fontSize: sshFontSize,
    lineHeight: 1.18,
    theme: {
      background: '#050505',
      foreground: '#f2f2f2',
      cursor: '#9fd7ff',
      selectionBackground: '#2f5f7a'
    }
  });
  const fitAddon = new FitAddon();
  terminal.loadAddon(fitAddon);
  const searchAddon = new SearchAddon();
  terminal.loadAddon(searchAddon);
  terminal.open(containerEl);
  const labels = formatSSHSessionLabels(username, host, port, options);

  const session = {
    clientId: nextSshClientId(),
    sessionId: null,
    itemId,
    item,
    host,
    port,
    username,
    terminal,
    fitAddon,
    searchAddon,
    containerEl,
    label: labels.label,
    compactLabel: labels.compactLabel,
    logPath: options.logPath || '',
    // Reconnect params (memory only) — populated at connect time so a
    // closed/errored pill can re-run the same connection into this slot.
    password: '',
    directShell: false,
    command: '',
    privateKeyPath: '',
    passphrase: '',
    transcript: '',
    status: 'connecting',
    minimized: false
  };

  terminal.onData(data => {
    const networkAPI = getNetworkAPI();
    if (session.sessionId && networkAPI && typeof networkAPI.sshWrite === 'function') {
      networkAPI.sshWrite(session.sessionId, data);
    }
  });

  // Right-click pastes the clipboard into the active terminal.
  containerEl.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    pasteIntoSSH();
  });

  return session;
}

// Shows the given session's terminal in the modal and hides the others/form.
function setActiveSshSession(clientId) {
  const session = sshSessions.get(clientId);
  if (!session) return;
  activeSshClientId = clientId;

  for (const other of sshSessions.values()) {
    if (other.containerEl) {
      other.containerEl.style.display = other.clientId === clientId ? 'block' : 'none';
    }
  }

  const title = document.getElementById('ssh-terminal-title');
  const eyebrow = document.getElementById('ssh-terminal-eyebrow');
  const compactInfo = document.getElementById('ssh-compact-info');
  if (title) title.textContent = (session.item && session.item.name) || 'SSH Terminal';
  if (eyebrow) eyebrow.textContent = `SSH to ${session.host}`;
  if (compactInfo) compactInfo.textContent = session.compactLabel || `${session.label}:${session.port}`;

  setSSHFormState(true);
  setSSHStatus(sshStatusText(session.status), sshStatusState(session.status));
  requestAnimationFrame(() => {
    fitSSHTerminal();
    if (session.terminal) session.terminal.focus();
  });
}

// Switches the modal to the "new connection" form (no active session).
function showSSHFormMode() {
  activeSshClientId = null;
  for (const session of sshSessions.values()) {
    if (session.containerEl) session.containerEl.style.display = 'none';
  }
  setSSHFormState(false);
}

function minimizeSSHSession() {
  const modal = document.getElementById('ssh-terminal-modal');
  const active = getActiveSession();
  if (active) {
    active.minimized = true;
  }
  if (modal) modal.style.display = 'none';
  updateSSHDock();
}

function restoreSSHSession(clientId) {
  const session = sshSessions.get(clientId);
  if (!session) return;
  const modal = document.getElementById('ssh-terminal-modal');
  session.minimized = false;
  if (modal) modal.style.display = 'flex';
  registerSSHEventListeners();
  setActiveSshSession(clientId);
  updateSSHDock();
}

// Disconnects (optionally) and fully tears down a session's terminal + DOM.
async function destroySSHSession(clientId, { disconnect = true } = {}) {
  const session = sshSessions.get(clientId);
  if (!session) return;
  const networkAPI = getNetworkAPI();
  if (disconnect && session.sessionId && networkAPI && typeof networkAPI.sshDisconnect === 'function') {
    try { await networkAPI.sshDisconnect(session.sessionId); } catch (e) { /* ignore */ }
  }
  try { if (session.terminal) session.terminal.dispose(); } catch (e) { /* ignore */ }
  if (session.containerEl && session.containerEl.parentNode) {
    session.containerEl.parentNode.removeChild(session.containerEl);
  }
  sshSessions.delete(clientId);
  if (activeSshClientId === clientId) {
    activeSshClientId = null;
  }
  updateSSHDock();
}

// Renders the dock of minimized sessions (a pill per session).
function updateSSHDock() {
  const dock = document.getElementById('ssh-session-dock');
  if (!dock) return;
  // Minimized live sessions, plus closed/errored ones kept for reconnect.
  const pills = [...sshSessions.values()].filter(
    s => s.minimized || s.status === 'closed' || s.status === 'error'
  );
  dock.innerHTML = '';
  if (pills.length === 0) {
    dock.style.display = 'none';
    return;
  }
  dock.style.display = 'flex';
  pills.forEach(session => {
    const pill = document.createElement('div');
    pill.className = 'ssh-session-pill';
    pill.dataset.state = session.status;

    const label = document.createElement('button');
    label.type = 'button';
    label.className = 'ssh-session-pill-label';
    label.textContent = session.label;
    label.title = `Restore ${session.compactLabel || `${session.label}:${session.port}`}`;
    label.addEventListener('click', () => restoreSSHSession(session.clientId));
    pill.appendChild(label);

    if (session.status === 'closed' || session.status === 'error') {
      const reconnect = document.createElement('button');
      reconnect.type = 'button';
      reconnect.className = 'ssh-session-pill-reconnect';
      reconnect.textContent = '↻';
      reconnect.title = 'Reconnect session';
      reconnect.addEventListener('click', (event) => {
        event.stopPropagation();
        reconnectSSHSession(session.clientId);
      });
      pill.appendChild(reconnect);
    }

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'ssh-session-pill-close';
    close.textContent = '×';
    close.title = 'Remove session';
    close.addEventListener('click', (event) => {
      event.stopPropagation();
      disconnectSSHSession(session.clientId);
    });
    pill.appendChild(close);

    dock.appendChild(pill);
  });
}

function changeSshFontSize(delta) {
  sshFontSize = Math.max(9, Math.min(22, sshFontSize + delta));
  for (const session of sshSessions.values()) {
    if (session.terminal) session.terminal.options.fontSize = sshFontSize;
  }
  requestAnimationFrame(() => fitSSHTerminal());
}

function toggleSshMaximize() {
  const modal = document.getElementById('ssh-terminal-modal');
  const btn = document.getElementById('ssh-maximize');
  if (!modal) return;
  const isMax = modal.classList.toggle('maximized');
  if (btn) btn.textContent = isMax ? '⤡' : '⤢';
  requestAnimationFrame(() => fitSSHTerminal());
}

async function copySSHSelection() {
  const active = getActiveSession();
  if (!active || !active.terminal) return;
  const text = active.terminal.getSelection();
  if (!text) {
    showNotification('No text selected in terminal');
    return;
  }
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    showNotification('Copied to clipboard');
  } catch (e) {
    showNotification('Could not copy selection');
  }
}

async function pasteIntoSSH() {
  const active = getActiveSession();
  const networkAPI = getNetworkAPI();
  if (!active || !active.sessionId) return;
  if (!networkAPI || typeof networkAPI.sshWrite !== 'function') return;

  let text = '';
  try {
    if (navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
      text = await navigator.clipboard.readText();
    }
  } catch (e) {
    showNotification('Could not read clipboard');
    return;
  }
  if (!text) return;
  networkAPI.sshWrite(active.sessionId, text);
  if (active.terminal) active.terminal.focus();
}

function fitSSHTerminal() {
  const active = getActiveSession();
  if (!active || !active.fitAddon || !active.terminal) return;
  try {
    active.fitAddon.fit();
    const networkAPI = getNetworkAPI();
    if (active.sessionId && networkAPI && typeof networkAPI.sshResize === 'function') {
      networkAPI.sshResize(active.sessionId, active.terminal.cols, active.terminal.rows);
    }
  } catch (error) {
    console.error('Error fitting SSH terminal:', error);
  }
}

function setSSHStatus(message, state = 'idle') {
  const status = document.getElementById('ssh-terminal-status');
  if (!status) return;
  status.textContent = message;
  status.dataset.state = state;
}

function setSSHFormState(isConnected, isConnecting = false) {
  const form = document.getElementById('ssh-login-form');
  const compactBar = document.getElementById('ssh-compact-bar');
  const connectButton = document.getElementById('ssh-connect-btn');
  const disconnectButton = document.getElementById('ssh-disconnect-btn');
  const usernameInput = document.getElementById('ssh-username');
  const passwordInput = document.getElementById('ssh-password');
  const portInput = document.getElementById('ssh-port');
  const saveAdminPasswordInput = document.getElementById('ssh-save-admin-password');
  const directShellInput = document.getElementById('ssh-direct-shell');
  const logPathInput = document.getElementById('ssh-log-path');
  const viewLogsButton = document.getElementById('ssh-view-logs-btn');

  if (form) form.style.display = isConnected ? 'none' : '';
  if (compactBar) compactBar.style.display = isConnected ? 'flex' : 'none';

  if (connectButton) {
    connectButton.disabled = isConnected || isConnecting;
    connectButton.textContent = isConnecting ? 'Connecting...' : 'Connect';
  }
  if (disconnectButton) {
    disconnectButton.disabled = !isConnected && !isConnecting;
  }
  if (viewLogsButton) {
    viewLogsButton.disabled = isConnected || isConnecting;
  }
  [usernameInput, passwordInput, portInput, logPathInput].forEach(input => {
    if (input) input.disabled = isConnected || isConnecting;
  });
  if (saveAdminPasswordInput) {
    saveAdminPasswordInput.disabled = isConnected || isConnecting;
  }
  if (directShellInput) {
    directShellInput.disabled = isConnected || isConnecting;
  }
}

async function saveSSHAdminPasswordPreference() {
  const networkAPI = getNetworkAPI();
  const usernameInput = document.getElementById('ssh-username');
  const passwordInput = document.getElementById('ssh-password');
  const saveAdminPasswordInput = document.getElementById('ssh-save-admin-password');

  if (
    !networkAPI ||
    typeof networkAPI.sshSaveAdminPassword !== 'function' ||
    !usernameInput ||
    !passwordInput ||
    !saveAdminPasswordInput ||
    usernameInput.value.trim() !== 'admin'
  ) {
    return { success: true };
  }

  const passwordToSave = saveAdminPasswordInput.checked ? passwordInput.value : '';
  return networkAPI.sshSaveAdminPassword(passwordToSave);
}

function queueSSHAdminPasswordSave() {
  if (sshPasswordSaveTimer) {
    clearTimeout(sshPasswordSaveTimer);
  }
  sshPasswordSaveTimer = setTimeout(async () => {
    sshPasswordSaveTimer = null;
    const result = await saveSSHAdminPasswordPreference();
    if (!result || !result.success) {
      setSSHStatus(result?.error || 'Could not save SSH password', 'error');
    }
  }, 350);
}

function registerSSHEventListeners() {
  const networkAPI = getNetworkAPI();
  if (!networkAPI || sshEventListenersRegistered) return;
  sshEventListenersRegistered = true;

  if (typeof networkAPI.onSSHData === 'function') {
    removeSSHDataListener = networkAPI.onSSHData(payload => {
      if (!payload) return;
      const session = findSessionBySessionId(payload.sessionId);
      if (!session) return;
      const chunk = payload.data || '';
      if (session.terminal) session.terminal.write(chunk);
      // Keep a bounded in-memory transcript for "Save transcript".
      session.transcript += chunk;
      if (session.transcript.length > SSH_TRANSCRIPT_MAX) {
        session.transcript = session.transcript.slice(session.transcript.length - SSH_TRANSCRIPT_MAX);
      }
    });
  }

  if (typeof networkAPI.onSSHClose === 'function') {
    removeSSHCloseListener = networkAPI.onSSHClose(payload => {
      if (!payload) return;
      const session = findSessionBySessionId(payload.sessionId);
      if (!session) return;
      session.status = 'closed';
      if (session.terminal) session.terminal.writeln('\r\n[SSH session closed]');
      if (session.clientId === activeSshClientId) setSSHStatus('Disconnected', 'idle');
      updateSSHDock();
    });
  }

  if (typeof networkAPI.onSSHError === 'function') {
    removeSSHErrorListener = networkAPI.onSSHError(payload => {
      if (!payload) return;
      const session = findSessionBySessionId(payload.sessionId);
      if (!session) return;
      session.status = 'error';
      if (session.terminal) session.terminal.writeln(`\r\n[SSH error] ${payload.error || 'Unknown error'}`);
      if (session.clientId === activeSshClientId) setSSHStatus(payload.error || 'SSH error', 'error');
      updateSSHDock();
    });
  }
}

function getSavedSSHLogPath() {
  try {
    const savedPath = localStorage.getItem(SSH_LOG_PATH_STORAGE_KEY);
    return savedPath && savedPath.trim() ? savedPath : DEFAULT_SSH_LOG_PATH;
  } catch (_error) {
    return DEFAULT_SSH_LOG_PATH;
  }
}

function saveSSHLogPath(path) {
  try {
    localStorage.setItem(SSH_LOG_PATH_STORAGE_KEY, path);
  } catch (_error) {
    // Ignore storage errors; the log session can still run.
  }
}

function openSSHTerminalModal(itemId) {
  const modal = document.getElementById('ssh-terminal-modal');
  const title = document.getElementById('ssh-terminal-title');
  const eyebrow = document.getElementById('ssh-terminal-eyebrow');
  const hostInput = document.getElementById('ssh-host');
  const usernameInput = document.getElementById('ssh-username');
  const portInput = document.getElementById('ssh-port');
  const passwordInput = document.getElementById('ssh-password');
  const saveAdminPasswordInput = document.getElementById('ssh-save-admin-password');
  const directShellInput = document.getElementById('ssh-direct-shell');
  const logPathInput = document.getElementById('ssh-log-path');
  const match = findItemById(itemId);

  if (!modal || !hostInput || !match) return;
  if (!match.item.ip) {
    showNotification('Configure an IP before opening SSH');
    return;
  }

  if (sshPasswordSaveTimer) {
    clearTimeout(sshPasswordSaveTimer);
    sshPasswordSaveTimer = null;
  }

  registerSSHEventListeners();
  modal.style.display = 'flex';

  // If a live session for this item already exists, restore/focus it.
  const existing = findSessionByItemId(match.item.id);
  if (existing && existing.status !== 'closed') {
    restoreSSHSession(existing.clientId);
    return;
  }

  // Otherwise open the modal in "new connection" form mode. Send any currently
  // active live session to the dock so it isn't lost.
  const current = getActiveSession();
  if (current && current.status !== 'closed') {
    current.minimized = true;
  }

  sshPendingItem = match.item;
  hostInput.value = match.item.ip;
  if (portInput) portInput.value = '22';
  if (usernameInput) usernameInput.value = 'admin';
  if (passwordInput) passwordInput.value = '';
  if (saveAdminPasswordInput) saveAdminPasswordInput.checked = false;
  if (directShellInput) directShellInput.checked = true;
  if (logPathInput) logPathInput.value = getSavedSSHLogPath();
  // Reset SSH-key auth fields and any stale DRM-reboot fallback banner.
  const useKeyInput = document.getElementById('ssh-use-key');
  const keyPathInput = document.getElementById('ssh-key-path');
  const keyPassphraseInput = document.getElementById('ssh-key-passphrase');
  const keyPathGroup = document.getElementById('ssh-key-path-group');
  if (useKeyInput) useKeyInput.checked = false;
  if (keyPathInput) keyPathInput.value = '';
  if (keyPassphraseInput) keyPassphraseInput.value = '';
  if (keyPathGroup) keyPathGroup.style.display = 'none';
  clearDrmRebootBanner();
  if (title) title.textContent = match.item.name || 'SSH Terminal';
  if (eyebrow) eyebrow.textContent = `SSH to ${match.item.ip}`;

  showSSHFormMode();
  updateSSHDock();
  setSSHStatus('Not connected', 'idle');
  applySSHDefaults(match.item.ip);
  applySSHAdminPasswordDefault(match.item.ip);
  if (usernameInput) usernameInput.focus();
}

async function applySSHAdminPasswordDefault(host) {
  const networkAPI = getNetworkAPI();
  const hostInput = document.getElementById('ssh-host');
  const usernameInput = document.getElementById('ssh-username');
  const passwordInput = document.getElementById('ssh-password');
  const saveAdminPasswordInput = document.getElementById('ssh-save-admin-password');

  if (!networkAPI || typeof networkAPI.sshAdminPassword !== 'function') return;

  const result = await networkAPI.sshAdminPassword();
  if (!hostInput || hostInput.value !== host || !usernameInput || !passwordInput) return;

  if (!result || !result.success) {
    setSSHStatus(result?.error || 'Could not load saved SSH password', 'error');
    return;
  }

  if (saveAdminPasswordInput) {
    saveAdminPasswordInput.checked = Boolean(result.hasPassword);
  }
  if (result.hasPassword && usernameInput.value.trim() === 'admin' && !passwordInput.value) {
    passwordInput.value = result.password || '';
  }
}

async function applySSHDefaults(host) {
  const networkAPI = getNetworkAPI();
  const usernameInput = document.getElementById('ssh-username');
  const portInput = document.getElementById('ssh-port');
  const eyebrow = document.getElementById('ssh-terminal-eyebrow');

  if (!networkAPI || typeof networkAPI.sshDefaults !== 'function') return;

  const result = await networkAPI.sshDefaults(host);
  const defaults = result && result.success ? result.defaults : null;
  if (!defaults) return;

  if (usernameInput && defaults.username && !usernameInput.value) {
    usernameInput.value = defaults.username;
  }
  if (portInput && defaults.port) {
    portInput.value = String(defaults.port);
  }
  if (eyebrow && defaults.alias) {
    eyebrow.textContent = `SSH to ${defaults.alias} (${host})`;
  }
}

// Match an SSH host (IP) against the current DRM inventory so the connect-
// failure state can offer a "reboot via DRM" fallback. Loads the inventory
// lazily if the DRM tab hasn't been opened yet this session.
async function findDrmDeviceForHost(host) {
  const ip = String(host || '').trim();
  if (!ip) return null;

  const matchIn = (list) => (Array.isArray(list) ? list : []).find((device) => {
    const det = device.details || {};
    return [det.ip, det.publicIp, det.privateIp].some((value) => value && String(value).trim() === ip);
  });

  const cached = matchIn(devicesState.devices);
  if (cached) return cached;

  const api = getNetworkAPI();
  if (!api || typeof api.digiGetDevices !== 'function') return null;
  try {
    const result = await api.digiGetDevices();
    if (result && result.success && Array.isArray(result.devices)) {
      // Cache so the DRM tab and any later lookups reuse it.
      devicesState.devices = result.devices;
      return matchIn(result.devices) || null;
    }
  } catch (_error) {
    // Ignore — no fallback offered if DRM is unreachable.
  }
  return null;
}

function clearDrmRebootBanner() {
  const el = document.getElementById('ssh-drm-fallback');
  if (el && el.parentNode) el.parentNode.removeChild(el);
}

async function maybeShowDrmRebootFallback(host) {
  clearDrmRebootBanner();
  const device = await findDrmDeviceForHost(host);
  if (!device) return; // don't offer an action that can't work

  const status = document.getElementById('ssh-terminal-status');
  if (!status || !status.parentNode) return;

  const banner = document.createElement('div');
  banner.id = 'ssh-drm-fallback';
  banner.className = 'ssh-drm-fallback';

  const msg = document.createElement('span');
  msg.className = 'ssh-drm-fallback-text';
  msg.textContent = "Can't reach it over SSH — reboot it via Digi Remote Manager instead?";
  banner.appendChild(msg);

  const btn = createDeviceActionButton(`Reboot ${device.name || device.id} via DRM`, {
    danger: true,
    onClick: () => handleDeviceReboot(device, () => {})
  });
  banner.appendChild(btn);

  status.parentNode.insertBefore(banner, status.nextSibling);
}

async function connectSSHFromForm(options = {}) {
  const networkAPI = getNetworkAPI();
  const hostInput = document.getElementById('ssh-host');
  const usernameInput = document.getElementById('ssh-username');
  const passwordInput = document.getElementById('ssh-password');
  const portInput = document.getElementById('ssh-port');
  const saveAdminPasswordInput = document.getElementById('ssh-save-admin-password');
  const directShellInput = document.getElementById('ssh-direct-shell');
  const command = typeof options.command === 'string' ? options.command : '';
  const logPath = typeof options.logPath === 'string' ? options.logPath.trim() : '';

  if (!networkAPI || typeof networkAPI.sshConnect !== 'function') {
    setSSHStatus('SSH is only available in the Electron app', 'error');
    return;
  }
  if (!hostInput || !usernameInput) return;

  const host = hostInput.value.trim();
  const username = usernameInput.value.trim();
  const password = passwordInput ? passwordInput.value : '';
  const port = portInput ? parseInt(portInput.value, 10) : 22;
  const directShell = command ? false : Boolean(directShellInput && directShellInput.checked);

  if (!host || !username) {
    setSSHStatus('Host and username are required', 'error');
    return;
  }

  clearDrmRebootBanner();

  const useKeyInput = document.getElementById('ssh-use-key');
  const keyPathInput = document.getElementById('ssh-key-path');
  const keyPassphraseInput = document.getElementById('ssh-key-passphrase');
  const useKey = Boolean(useKeyInput && useKeyInput.checked && keyPathInput && keyPathInput.value.trim());

  const safePort = Number.isNaN(port) ? 22 : port;
  const item = sshPendingItem || { id: null, name: host, ip: host };

  if (username === 'admin' && saveAdminPasswordInput) {
    const saveResult = await saveSSHAdminPasswordPreference();
    if (!saveResult || !saveResult.success) {
      setSSHStatus(saveResult?.error || 'Could not save SSH password', 'error');
    }
  }

  const session = createSSHSession(item.id, item, host, safePort, username, { logPath });
  if (!session) {
    setSSHStatus('Could not create terminal', 'error');
    return;
  }
  sshSessions.set(session.clientId, session);
  setActiveSshSession(session.clientId);
  setSSHStatus('Connecting...', 'connecting');

  const target = `${username}@${host}:${safePort}`;
  if (command && logPath) {
    session.terminal.writeln(`Connecting to ${target} and viewing log: ${logPath}...`);
  } else {
    session.terminal.writeln(directShell
      ? `Connecting to ${target} and starting /bin/sh...`
      : `Connecting to ${target}...`);
  }

  const connectOptions = {
    host,
    username,
    password,
    port: safePort,
    directShell,
    cols: session.terminal.cols || 80,
    rows: session.terminal.rows || 24
  };
  if (command) {
    connectOptions.command = command;
  }
  if (useKey) {
    connectOptions.privateKeyPath = keyPathInput.value.trim();
    if (keyPassphraseInput && keyPassphraseInput.value) {
      connectOptions.passphrase = keyPassphraseInput.value;
    }
  }

  // Stash the params (memory only) so this slot can be reconnected later.
  session.password = password;
  session.directShell = directShell;
  session.command = command || '';
  session.privateKeyPath = useKey ? connectOptions.privateKeyPath : '';
  session.passphrase = useKey ? (connectOptions.passphrase || '') : '';

  const result = await networkAPI.sshConnect(connectOptions);

  if (!result || !result.success) {
    session.terminal.writeln(`\r\n[Connection failed] ${result?.error || 'Unknown error'}`);
    // Keep the session (marked error) as a reconnectable dock pill instead of
    // throwing it away — the tech shouldn't have to re-enter host/user.
    session.status = 'error';
    session.minimized = true;
    showSSHFormMode();
    updateSSHDock();
    setSSHStatus(result?.error || 'Could not connect', 'error');
    // A device that's wedged over SSH is exactly the one a tech wants to reboot
    // via DRM — offer it inline, but only if the host is a known DRM device.
    maybeShowDrmRebootFallback(host);
    return;
  }

  clearDrmRebootBanner();
  session.sessionId = result.sessionId;
  session.status = 'connected';
  if (options.persistLogPath && logPath) {
    saveSSHLogPath(logPath);
  }
  setSSHStatus('Connected', 'connected');
  const compactInfo = document.getElementById('ssh-compact-info');
  if (compactInfo) compactInfo.textContent = session.compactLabel || target;
  fitSSHTerminal();
  session.terminal.focus();
}

// Re-run the last connection into the SAME session slot, reusing its terminal
// and scrollback (a closed/errored pill's Reconnect action).
async function reconnectSSHSession(clientId) {
  const session = sshSessions.get(clientId);
  if (!session) return;
  if (session.status !== 'closed' && session.status !== 'error') return;

  const networkAPI = getNetworkAPI();
  if (!networkAPI || typeof networkAPI.sshConnect !== 'function') {
    showNotification('SSH is only available in the Electron app');
    return;
  }

  const modal = document.getElementById('ssh-terminal-modal');
  if (modal) modal.style.display = 'flex';
  registerSSHEventListeners();
  session.minimized = false;
  session.status = 'connecting';
  setActiveSshSession(clientId);
  updateSSHDock();
  setSSHStatus('Reconnecting...', 'connecting');
  clearDrmRebootBanner();
  session.terminal.writeln('\r\n--- reconnecting ---');

  const connectOptions = {
    host: session.host,
    username: session.username,
    password: session.password || '',
    port: session.port,
    directShell: session.directShell,
    cols: session.terminal.cols || 80,
    rows: session.terminal.rows || 24
  };
  if (session.command) connectOptions.command = session.command;
  if (session.privateKeyPath) {
    connectOptions.privateKeyPath = session.privateKeyPath;
    if (session.passphrase) connectOptions.passphrase = session.passphrase;
  }

  const result = await networkAPI.sshConnect(connectOptions);
  if (!result || !result.success) {
    session.status = 'error';
    session.terminal.writeln(`\r\n[Reconnect failed] ${result?.error || 'Unknown error'}`);
    setSSHStatus(result?.error || 'Could not reconnect', 'error');
    updateSSHDock();
    maybeShowDrmRebootFallback(session.host);
    return;
  }

  session.sessionId = result.sessionId;
  session.status = 'connected';
  setSSHStatus('Connected', 'connected');
  const compactInfo = document.getElementById('ssh-compact-info');
  if (compactInfo) compactInfo.textContent = session.compactLabel || `${session.username}@${session.host}:${session.port}`;
  fitSSHTerminal();
  session.terminal.focus();
  updateSSHDock();
}

// Strip ANSI/control sequences so a saved transcript is plain, readable text
// (keeps tabs/newlines/carriage returns).
function stripAnsiForTranscript(text) {
  return String(text || '')
    .replace(/\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)/g, '') // OSC sequences
    .replace(/\x1b[@-Z\\-_]/g, '')                      // single-char ESC
    .replace(/\x1b\[[0-9;?]*[ -/]*[@-~]/g, '')          // CSI sequences
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '');       // other control chars
}

async function saveSSHTranscript() {
  const active = getActiveSession();
  if (!active) {
    showNotification('No active session');
    return;
  }
  const text = stripAnsiForTranscript(active.transcript || '');
  if (!text.trim()) {
    showNotification('Nothing to save yet');
    return;
  }
  const networkAPI = getNetworkAPI();
  if (!networkAPI || typeof networkAPI.saveTextFile !== 'function') {
    showNotification('Saving is not available');
    return;
  }
  const safeHost = String(active.host || 'session').replace(/[^\w.-]+/g, '_');
  const result = await networkAPI.saveTextFile({
    title: 'Save SSH transcript',
    buttonLabel: 'Save transcript',
    defaultPath: `${safeHost}-ssh-transcript.txt`,
    content: text,
    filters: [
      { name: 'Text files', extensions: ['txt'] },
      { name: 'All files', extensions: ['*'] }
    ]
  });
  if (result && result.success) {
    showNotification('Transcript saved');
  } else if (result && !result.canceled) {
    showNotification(result.error || 'Could not save transcript');
  }
}

// --- In-terminal search (active session only) ---
function ensureSSHFindBar() {
  let bar = document.getElementById('ssh-find-bar');
  if (bar) return bar;
  const container = document.getElementById('ssh-terminal-container');
  if (!container || !container.parentNode) return null;

  bar = document.createElement('div');
  bar.id = 'ssh-find-bar';
  bar.className = 'ssh-find-bar';
  bar.style.display = 'none';

  const input = document.createElement('input');
  input.type = 'search';
  input.id = 'ssh-find-input';
  input.className = 'ssh-find-input';
  input.placeholder = 'Find in terminal…';
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      sshFind(event.shiftKey ? 'prev' : 'next');
    } else if (event.key === 'Escape') {
      event.preventDefault();
      toggleSSHFindBar(false);
    }
  });

  const makeBtn = (label, title, onClick) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'ssh-find-btn';
    b.textContent = label;
    b.title = title;
    b.addEventListener('click', onClick);
    return b;
  };

  bar.appendChild(input);
  bar.appendChild(makeBtn('↑', 'Previous match', () => sshFind('prev')));
  bar.appendChild(makeBtn('↓', 'Next match', () => sshFind('next')));
  bar.appendChild(makeBtn('×', 'Close find', () => toggleSSHFindBar(false)));

  container.parentNode.insertBefore(bar, container);
  return bar;
}

function toggleSSHFindBar(show) {
  const bar = ensureSSHFindBar();
  if (!bar) return;
  const shouldShow = show === undefined ? bar.style.display === 'none' : Boolean(show);
  bar.style.display = shouldShow ? 'flex' : 'none';
  if (shouldShow) {
    const input = document.getElementById('ssh-find-input');
    if (input) { input.focus(); input.select(); }
  } else {
    const active = getActiveSession();
    if (active && active.searchAddon && typeof active.searchAddon.clearDecorations === 'function') {
      active.searchAddon.clearDecorations();
    }
    if (active && active.terminal) active.terminal.focus();
  }
}

function sshFind(direction) {
  const active = getActiveSession();
  const input = document.getElementById('ssh-find-input');
  if (!active || !active.searchAddon || !input) return;
  const term = input.value;
  if (!term) return;
  if (direction === 'prev') active.searchAddon.findPrevious(term);
  else active.searchAddon.findNext(term);
}

async function viewSSHLogsFromForm() {
  const logPathInput = document.getElementById('ssh-log-path');
  const logPath = logPathInput ? logPathInput.value.trim() : DEFAULT_SSH_LOG_PATH;
  const command = buildTailCommand(logPath);
  if (!command) {
    setSSHStatus('Enter a valid log path without line breaks', 'error');
    return;
  }

  await connectSSHFromForm({
    command,
    logPath,
    persistLogPath: true
  });
}

// Disconnects a session (the active one if no clientId is given). If it was the
// active session, returns the modal to the connection form so the user can reconnect.
async function disconnectSSHSession(clientId) {
  const targetId = clientId || activeSshClientId;
  if (!targetId) return;
  const wasActive = targetId === activeSshClientId;
  await destroySSHSession(targetId, { disconnect: true });
  if (wasActive) {
    showSSHFormMode();
    setSSHStatus('Disconnected', 'idle');
  }
}

// The modal's × button: disconnects the active session (distinct from minimize)
// and hides the modal.
async function closeSSHTerminalModal() {
  const modal = document.getElementById('ssh-terminal-modal');
  const passwordInput = document.getElementById('ssh-password');
  const saveAdminPasswordInput = document.getElementById('ssh-save-admin-password');
  if (sshPasswordSaveTimer) {
    clearTimeout(sshPasswordSaveTimer);
    sshPasswordSaveTimer = null;
  }
  const active = getActiveSession();
  if (active) {
    await destroySSHSession(active.clientId, { disconnect: true });
  }
  if (modal) {
    modal.style.display = 'none';
  }
  if (passwordInput) {
    passwordInput.value = '';
  }
  if (saveAdminPasswordInput) {
    saveAdminPasswordInput.checked = false;
  }
}

function setupSSHTerminalModal() {
  const modal = document.getElementById('ssh-terminal-modal');
  const form = document.getElementById('ssh-login-form');
  const closeButton = document.getElementById('close-ssh-terminal');
  const disconnectButton = document.getElementById('ssh-disconnect-btn');
  const viewLogsButton = document.getElementById('ssh-view-logs-btn');
  const container = document.getElementById('ssh-terminal-container');

  if (!modal || !form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    connectSSHFromForm();
  });

  if (disconnectButton) {
    disconnectButton.addEventListener('click', () => {
      disconnectSSHSession();
    });
  }

  if (viewLogsButton) {
    viewLogsButton.addEventListener('click', () => {
      viewSSHLogsFromForm();
    });
  }

  const useKeyInput = document.getElementById('ssh-use-key');
  const keyPathGroup = document.getElementById('ssh-key-path-group');
  const keyBrowseButton = document.getElementById('ssh-key-browse-btn');
  const keyPathInput = document.getElementById('ssh-key-path');

  if (useKeyInput && keyPathGroup) {
    useKeyInput.addEventListener('change', () => {
      keyPathGroup.style.display = useKeyInput.checked ? '' : 'none';
    });
  }

  if (keyBrowseButton && keyPathInput) {
    keyBrowseButton.addEventListener('click', () => {
      // Electron exposes the absolute path on File objects from a file input,
      // so reuse a hidden picker rather than adding a new IPC dialog channel.
      let picker = document.getElementById('ssh-key-file-input');
      if (!picker) {
        picker = document.createElement('input');
        picker.type = 'file';
        picker.id = 'ssh-key-file-input';
        picker.style.display = 'none';
        picker.addEventListener('change', () => {
          const file = picker.files && picker.files[0];
          if (file && file.path) keyPathInput.value = file.path;
          picker.value = '';
        });
        document.body.appendChild(picker);
      }
      picker.click();
    });
  }

  const searchButton = document.getElementById('ssh-search-btn');
  if (searchButton) {
    searchButton.addEventListener('click', () => toggleSSHFindBar(true));
  }

  const saveTranscriptButton = document.getElementById('ssh-save-transcript-btn');
  if (saveTranscriptButton) {
    saveTranscriptButton.addEventListener('click', () => saveSSHTranscript());
  }

  // Ctrl/Cmd+F opens the find bar for the active session.
  modal.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && (event.key === 'f' || event.key === 'F')) {
      event.preventDefault();
      toggleSSHFindBar(true);
    }
  });

  const usernameInput = document.getElementById('ssh-username');
  const passwordInput = document.getElementById('ssh-password');
  const saveAdminPasswordInput = document.getElementById('ssh-save-admin-password');

  if (saveAdminPasswordInput) {
    saveAdminPasswordInput.addEventListener('change', async () => {
      if (saveAdminPasswordInput.checked) {
        if (usernameInput && usernameInput.value.trim() !== 'admin') {
          saveAdminPasswordInput.checked = false;
          setSSHStatus('Default password is only saved for admin', 'idle');
          return;
        }
        if (!passwordInput || !passwordInput.value) {
          setSSHStatus('Enter a password to save it for admin', 'idle');
          return;
        }
      }

      const result = await saveSSHAdminPasswordPreference();
      if (!result || !result.success) {
        setSSHStatus(result?.error || 'Could not save SSH password', 'error');
        return;
      }
      if (saveAdminPasswordInput.checked) {
        setSSHStatus('Admin password saved locally', 'idle');
      } else {
        setSSHStatus('Saved admin password removed', 'idle');
      }
    });
  }

  if (passwordInput) {
    passwordInput.addEventListener('input', () => {
      if (!saveAdminPasswordInput || !saveAdminPasswordInput.checked) return;
      queueSSHAdminPasswordSave();
    });

    passwordInput.addEventListener('change', async () => {
      if (!saveAdminPasswordInput || !saveAdminPasswordInput.checked) return;
      const result = await saveSSHAdminPasswordPreference();
      if (!result || !result.success) {
        setSSHStatus(result?.error || 'Could not save SSH password', 'error');
      }
    });
  }

  if (usernameInput) {
    usernameInput.addEventListener('change', () => {
      if (saveAdminPasswordInput && usernameInput.value.trim() !== 'admin') {
        saveAdminPasswordInput.checked = false;
      }
    });
  }

  if (closeButton) {
    closeButton.addEventListener('click', closeSSHTerminalModal);
  }

  const fontDecreaseBtn = document.getElementById('ssh-font-decrease');
  const fontIncreaseBtn = document.getElementById('ssh-font-increase');
  const minimizeBtn = document.getElementById('ssh-minimize');
  const maximizeBtn = document.getElementById('ssh-maximize');
  const scriptsBar = document.getElementById('ssh-scripts-bar');

  const disconnectCompactBtn = document.getElementById('ssh-disconnect-compact');
  if (disconnectCompactBtn) {
    disconnectCompactBtn.addEventListener('click', () => disconnectSSHSession());
  }

  const keepTerminalFocus = e => e.preventDefault();

  if (fontDecreaseBtn) {
    fontDecreaseBtn.addEventListener('mousedown', keepTerminalFocus);
    fontDecreaseBtn.addEventListener('click', () => changeSshFontSize(-1));
  }
  if (fontIncreaseBtn) {
    fontIncreaseBtn.addEventListener('mousedown', keepTerminalFocus);
    fontIncreaseBtn.addEventListener('click', () => changeSshFontSize(1));
  }
  if (minimizeBtn) {
    minimizeBtn.addEventListener('mousedown', keepTerminalFocus);
    minimizeBtn.addEventListener('click', minimizeSSHSession);
  }
  if (maximizeBtn) {
    maximizeBtn.addEventListener('mousedown', keepTerminalFocus);
    maximizeBtn.addEventListener('click', toggleSshMaximize);
  }

  if (scriptsBar) {
    const label = document.createElement('span');
    label.className = 'ssh-scripts-label';
    label.textContent = 'Quick:';
    scriptsBar.appendChild(label);

    SSH_QUICK_SCRIPTS.forEach(script => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ssh-script-btn';
      btn.textContent = script.label;
      btn.title = script.title;
      btn.addEventListener('mousedown', keepTerminalFocus);
      btn.addEventListener('click', () => {
        const active = getActiveSession();
        if (!active || !active.sessionId) return;
        const networkAPI = getNetworkAPI();
        if (networkAPI && typeof networkAPI.sshWrite === 'function') {
          networkAPI.sshWrite(active.sessionId, script.cmd + '\n');
        }
      });
      scriptsBar.appendChild(btn);
    });
  }

  document.addEventListener('keydown', (event) => {
    if (modal.style.display === 'flex' && event.key === 'Escape') {
      // Do not close SSH modal on Escape to avoid accidental disconnection
    }
    if (modal.style.display === 'flex' && event.key === 'C' && event.ctrlKey && event.shiftKey) {
      event.preventDefault();
      copySSHSelection();
    }
    // Ctrl+V (or Cmd+V) pastes the clipboard into the active terminal.
    if (modal.style.display === 'flex' && (event.ctrlKey || event.metaKey) && !event.shiftKey
        && (event.key === 'v' || event.key === 'V')) {
      event.preventDefault();
      pasteIntoSSH();
    }
  });

  if (container && 'ResizeObserver' in window) {
    sshResizeObserver = new ResizeObserver(() => fitSSHTerminal());
    sshResizeObserver.observe(container);
  }
}

function setupItemConfigModal() {
  const modal = document.getElementById('item-config-modal');
  const closeButton = document.getElementById('close-item-config');
  const cancelButton = document.getElementById('cancel-item-config');
  const form = document.getElementById('item-config-form');
  const nameInput = document.getElementById('item-name');
  const restoreNameButton = document.getElementById('restore-item-name');
  const ipInput = document.getElementById('item-ip');
  const imageInput = document.getElementById('item-image');
  const imageFileInput = document.getElementById('item-image-file');
  const clearImageButton = document.getElementById('clear-item-image');
  const scanIntervalInput = document.getElementById('item-scan-interval');
  const dnsInput = document.getElementById('item-dns-domain');
  const addPortButton = document.getElementById('item-add-port');
  const clearPortsButton = document.getElementById('item-clear-ports');
  const portInput = document.getElementById('item-port-input');

  if (!modal || !form || !nameInput || !ipInput) return;

  nameInput.addEventListener('input', () => {
    if (!restoreNameButton || !editingItemId) return;
    const match = findItemById(editingItemId);
    restoreNameButton.disabled = !match || nameInput.value.trim() === match.item.defaultName;
  });

  if (restoreNameButton) {
    restoreNameButton.addEventListener('click', () => {
      if (!editingItemId) return;
      const match = findItemById(editingItemId);
      if (!match) return;
      nameInput.value = match.item.defaultName || match.item.name;
      restoreNameButton.disabled = true;
      nameInput.focus();
    });
  }

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

    match.item.name = nameInput.value.trim();
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

  document.addEventListener('keydown', (event) => {
    if (modal.style.display === 'flex' && event.key === 'Escape') {
      event.preventDefault();
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

function normalizePreferredProvider(provider) {
  const normalizedProvider = String(provider || '').trim().toLowerCase();
  return AI_PROVIDERS.includes(normalizedProvider) ? normalizedProvider : DEFAULT_AI_PROVIDER;
}

function getPreferredProvider() {
  return normalizePreferredProvider(localStorage.getItem(PREFERRED_PROVIDER_STORAGE_KEY));
}

function setPreferredProvider(provider) {
  localStorage.setItem(PREFERRED_PROVIDER_STORAGE_KEY, normalizePreferredProvider(provider));
}

function getSelectedProviderInputValue() {
  const selectedInput = document.querySelector('input[name="preferred-provider"]:checked');
  return normalizePreferredProvider(selectedInput?.value);
}

function getProviderLabel(provider) {
  return normalizePreferredProvider(provider) === 'claude' ? 'Claude' : 'OpenAI';
}

function normalizeThemeStylesheet(href) {
  const normalizedHref = String(href || '').trim();
  return THEME_STYLESHEETS.some((theme) => theme.href === normalizedHref)
    ? normalizedHref
    : DEFAULT_THEME_STYLESHEET;
}

function getThemeStylesheet() {
  return normalizeThemeStylesheet(localStorage.getItem(THEME_STYLESHEET_STORAGE_KEY));
}

function getThemeStylesheetLabel(href) {
  const normalizedHref = normalizeThemeStylesheet(href);
  return THEME_STYLESHEETS.find((theme) => theme.href === normalizedHref)?.label || 'Digi';
}

function populateThemeStylesheetInputs() {
  const activeStylesheet = getThemeStylesheet();
  document.querySelectorAll('input[name="theme-stylesheet"]').forEach((input) => {
    input.checked = normalizeThemeStylesheet(input.value) === activeStylesheet;
  });
}

function applyThemeStylesheet(href, options = {}) {
  const activeStylesheet = normalizeThemeStylesheet(href);
  const stylesheetLink = document.getElementById('app-theme-stylesheet');

  if (stylesheetLink && stylesheetLink.getAttribute('href') !== activeStylesheet) {
    stylesheetLink.setAttribute('href', activeStylesheet);
  }

  if (options.persist) {
    localStorage.setItem(THEME_STYLESHEET_STORAGE_KEY, activeStylesheet);
  }

  populateThemeStylesheetInputs();

  if (options.notify) {
    showNotification(`Color theme: ${getThemeStylesheetLabel(activeStylesheet)}`);
  }
}

function handleThemeStylesheetChange(event) {
  applyThemeStylesheet(event.target?.value, { persist: true, notify: true });
}

function populatePreferredProviderInputs() {
  const preferredProvider = getPreferredProvider();
  document.querySelectorAll('input[name="preferred-provider"]').forEach((input) => {
    input.checked = normalizePreferredProvider(input.value) === preferredProvider;
  });
}

function populateProviderKeyInputs() {
  const openAiInput = document.getElementById('openai-key');
  const claudeInput = document.getElementById('claude-key');

  populatePreferredProviderInputs();

  if (openAiInput) {
    openAiInput.value = localStorage.getItem(OPENAI_KEY_STORAGE_KEY) || '';
  }
  if (claudeInput) {
    claudeInput.value = localStorage.getItem(CLAUDE_KEY_STORAGE_KEY) || '';
  }
}

async function populateDigiKeyInputs() {
  const keyIdInput = document.getElementById('digi-key-id');
  const keySecretInput = document.getElementById('digi-key-secret');
  const statusLabel = document.getElementById('digi-keys-status');
  const api = getNetworkAPI();

  if (keySecretInput) {
    keySecretInput.value = '';
  }
  if (!api || typeof api.digiGetCredentials !== 'function') {
    if (statusLabel) statusLabel.textContent = 'Not available';
    return;
  }

  const result = await api.digiGetCredentials();
  if (keyIdInput) {
    keyIdInput.value = result && result.success ? (result.keyId || '') : '';
  }
  if (statusLabel) {
    statusLabel.textContent = result && result.hasCredentials
      ? 'Configured'
      : 'Not configured';
  }
}

async function saveDigiCredentials() {
  const keyIdInput = document.getElementById('digi-key-id');
  const keySecretInput = document.getElementById('digi-key-secret');
  const statusLabel = document.getElementById('digi-keys-status');
  const api = getNetworkAPI();

  if (!api || typeof api.digiSaveCredentials !== 'function') {
    showNotification('Digi integration is unavailable');
    return;
  }

  const result = await api.digiSaveCredentials({
    keyId: keyIdInput ? keyIdInput.value.trim() : '',
    keySecret: keySecretInput ? keySecretInput.value : ''
  });

  if (!result || !result.success) {
    showNotification((result && result.error) || 'Could not save Digi key');
    return;
  }

  if (keySecretInput) {
    keySecretInput.value = '';
  }
  if (statusLabel) {
    statusLabel.textContent = result.hasCredentials ? 'Configured' : 'Not configured';
  }
  showNotification('Digi Remote API key saved');

  // Refresh the Devices tab if the user has it open.
  if (activeLineId === DEVICES_VIEW_ID) {
    devicesState.status = 'idle';
    loadDevices();
  }
}

function populateAgentSkillInputs() {
  const skillInput = document.getElementById('agent-skill-body');
  const sourceLabel = document.getElementById('agent-skill-source');
  const sourceName = localStorage.getItem(AGENT_SKILL_SOURCE_STORAGE_KEY) || '';

  if (skillInput) {
    skillInput.value = localStorage.getItem(AGENT_SKILL_STORAGE_KEY) || '';
  }
  if (sourceLabel) {
    sourceLabel.textContent = sourceName || 'No skill loaded';
  }
}

function populateFileSupportSkillInputs() {
  const skillInput = document.getElementById('file-support-skill-body');
  const sourceLabel = document.getElementById('file-support-skill-source');
  const sourceName = localStorage.getItem(FILE_SUPPORT_SKILL_SOURCE_STORAGE_KEY) || '';

  if (skillInput) {
    skillInput.value = localStorage.getItem(FILE_SUPPORT_SKILL_STORAGE_KEY) || DEFAULT_FILE_SUPPORT_SKILL;
  }
  if (sourceLabel) {
    sourceLabel.textContent = sourceName || 'Default File Support skill';
  }
}

function openSettingsModal() {
  const modal = document.getElementById('settings-modal');
  if (!modal) return;
  populateThemeStylesheetInputs();
  populateProviderKeyInputs();
  populateDigiKeyInputs();
  populateAgentSkillInputs();
  populateFileSupportSkillInputs();
  modal.style.display = 'flex';
}

function closeSettingsModal() {
  const modal = document.getElementById('settings-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

function saveProviderKeys() {
  const openAiInput = document.getElementById('openai-key');
  const claudeInput = document.getElementById('claude-key');
  const preferredProvider = getSelectedProviderInputValue();
  const openAiKey = openAiInput ? openAiInput.value.trim() : '';
  const claudeKey = claudeInput ? claudeInput.value.trim() : '';

  setPreferredProvider(preferredProvider);

  if (openAiKey) {
    localStorage.setItem(OPENAI_KEY_STORAGE_KEY, openAiKey);
  } else {
    localStorage.removeItem(OPENAI_KEY_STORAGE_KEY);
  }

  if (claudeKey) {
    localStorage.setItem(CLAUDE_KEY_STORAGE_KEY, claudeKey);
  } else {
    localStorage.removeItem(CLAUDE_KEY_STORAGE_KEY);
  }

  showNotification('Provider settings saved');
}

function getProviderKeys() {
  return {
    preferredProvider: getPreferredProvider(),
    openAiKey: localStorage.getItem(OPENAI_KEY_STORAGE_KEY) || '',
    claudeKey: localStorage.getItem(CLAUDE_KEY_STORAGE_KEY) || ''
  };
}

function getPreferredProviderConfig() {
  const providerKeys = getProviderKeys();
  const provider = providerKeys.preferredProvider;
  const apiKey = provider === 'claude' ? providerKeys.claudeKey : providerKeys.openAiKey;

  return {
    provider,
    label: getProviderLabel(provider),
    apiKey,
    hasApiKey: apiKey.length > 0
  };
}

function handlePreferredProviderChange(event) {
  const provider = normalizePreferredProvider(event.target?.value);
  setPreferredProvider(provider);
  showNotification(`Preferred provider: ${getProviderLabel(provider)}`);
  if (activeLineId === TEMPLATES_VIEW_ID) {
    renderProductApp();
  }
}

function saveAgentSkill(sourceName = '') {
  const skillInput = document.getElementById('agent-skill-body');
  const sourceLabel = document.getElementById('agent-skill-source');
  const skill = skillInput ? skillInput.value : '';
  const hasSkill = skill.trim().length > 0;
  const existingSourceName = localStorage.getItem(AGENT_SKILL_SOURCE_STORAGE_KEY) || '';
  const nextSourceName = sourceName || existingSourceName || 'Manual skill';

  if (hasSkill) {
    localStorage.setItem(AGENT_SKILL_STORAGE_KEY, skill);
    if (nextSourceName) {
      localStorage.setItem(AGENT_SKILL_SOURCE_STORAGE_KEY, nextSourceName);
    }
  } else {
    localStorage.removeItem(AGENT_SKILL_STORAGE_KEY);
    localStorage.removeItem(AGENT_SKILL_SOURCE_STORAGE_KEY);
  }

  if (sourceLabel) {
    sourceLabel.textContent = hasSkill && nextSourceName ? nextSourceName : 'No skill loaded';
  }

  showNotification(hasSkill ? 'Agent skill saved' : 'Agent skill cleared');
}

function getAgentSkill() {
  return {
    sourceName: localStorage.getItem(AGENT_SKILL_SOURCE_STORAGE_KEY) || '',
    content: localStorage.getItem(AGENT_SKILL_STORAGE_KEY) || ''
  };
}

function saveFileSupportSkill(sourceName = '') {
  const skillInput = document.getElementById('file-support-skill-body');
  const sourceLabel = document.getElementById('file-support-skill-source');
  const skill = skillInput ? skillInput.value : '';
  const trimmedSkill = skill.trim();
  const existingSourceName = localStorage.getItem(FILE_SUPPORT_SKILL_SOURCE_STORAGE_KEY) || '';
  const nextSourceName = sourceName || existingSourceName || 'Manual File Support skill';

  if (trimmedSkill && trimmedSkill !== DEFAULT_FILE_SUPPORT_SKILL.trim()) {
    localStorage.setItem(FILE_SUPPORT_SKILL_STORAGE_KEY, skill);
    localStorage.setItem(FILE_SUPPORT_SKILL_SOURCE_STORAGE_KEY, nextSourceName);
  } else {
    localStorage.removeItem(FILE_SUPPORT_SKILL_STORAGE_KEY);
    localStorage.removeItem(FILE_SUPPORT_SKILL_SOURCE_STORAGE_KEY);
  }

  if (sourceLabel) {
    sourceLabel.textContent = trimmedSkill && trimmedSkill !== DEFAULT_FILE_SUPPORT_SKILL.trim()
      ? nextSourceName
      : 'Default File Support skill';
  }

  showNotification('File Support skill saved');
}

function getFileSupportSkill() {
  return {
    sourceName: localStorage.getItem(FILE_SUPPORT_SKILL_SOURCE_STORAGE_KEY) || 'Default File Support skill',
    content: localStorage.getItem(FILE_SUPPORT_SKILL_STORAGE_KEY) || DEFAULT_FILE_SUPPORT_SKILL
  };
}

function deleteAllTemplates() {
  if (supportTemplates.length === 0) {
    showNotification('No notes to delete');
    return;
  }

  const shouldDelete = window.confirm('Delete all notes permanently?');
  if (!shouldDelete) return;

  supportTemplates = [];
  activeTemplateId = '';
  saveSupportTemplates();
  renderProductApp();
  showNotification('All notes deleted');
}

async function handleAgentSkillFileSelection(event) {
  const input = event.target;
  const file = input.files && input.files[0];
  if (!file) return;

  try {
    const body = await readTemplateFileText(file);
    const skillInput = document.getElementById('agent-skill-body');
    const sourceLabel = document.getElementById('agent-skill-source');
    if (skillInput) {
      skillInput.value = body;
    }
    if (sourceLabel) {
      sourceLabel.textContent = file.name;
    }
    saveAgentSkill(file.name);
  } catch (error) {
    console.error('Error loading agent skill:', error);
    showNotification('Could not load agent skill');
  } finally {
    input.value = '';
  }
}

async function handleFileSupportSkillFileSelection(event) {
  const input = event.target;
  const file = input.files && input.files[0];
  if (!file) return;

  try {
    const body = await readTemplateFileText(file);
    const skillInput = document.getElementById('file-support-skill-body');
    const sourceLabel = document.getElementById('file-support-skill-source');
    if (skillInput) {
      skillInput.value = body;
    }
    if (sourceLabel) {
      sourceLabel.textContent = file.name;
    }
    saveFileSupportSkill(file.name);
  } catch (error) {
    console.error('Error loading File Support skill:', error);
    showNotification('Could not load File Support skill');
  } finally {
    input.value = '';
  }
}

function setupSettingsModal() {
  const modal = document.getElementById('settings-modal');
  const openButton = document.getElementById('settings-button');
  const closeButton = document.getElementById('close-settings');
  const keysForm = document.getElementById('api-keys-form');
  const digiKeysForm = document.getElementById('digi-keys-form');
  const themeInputs = document.querySelectorAll('input[name="theme-stylesheet"]');
  const providerInputs = document.querySelectorAll('input[name="preferred-provider"]');
  const skillForm = document.getElementById('agent-skill-form');
  const loadSkillButton = document.getElementById('load-agent-skill-btn');
  const skillFileInput = document.getElementById('agent-skill-input');
  const fileSupportSkillForm = document.getElementById('file-support-skill-form');
  const loadFileSupportSkillButton = document.getElementById('load-file-support-skill-btn');
  const fileSupportSkillInput = document.getElementById('file-support-skill-input');
  const deleteAllTemplatesButton = document.getElementById('delete-all-templates-btn');

  if (!modal) return;

  if (openButton) {
    openButton.addEventListener('click', openSettingsModal);
  }
  if (closeButton) {
    closeButton.addEventListener('click', closeSettingsModal);
  }
  if (keysForm) {
    keysForm.addEventListener('submit', (event) => {
      event.preventDefault();
      saveProviderKeys();
    });
  }
  if (digiKeysForm) {
    digiKeysForm.addEventListener('submit', (event) => {
      event.preventDefault();
      saveDigiCredentials();
    });
  }
  themeInputs.forEach((input) => {
    input.addEventListener('change', handleThemeStylesheetChange);
  });
  providerInputs.forEach((input) => {
    input.addEventListener('change', handlePreferredProviderChange);
  });
  if (skillForm) {
    skillForm.addEventListener('submit', (event) => {
      event.preventDefault();
      saveAgentSkill();
    });
  }
  if (loadSkillButton && skillFileInput) {
    loadSkillButton.addEventListener('click', () => {
      skillFileInput.value = '';
      skillFileInput.click();
    });
    skillFileInput.addEventListener('change', handleAgentSkillFileSelection);
  }
  if (fileSupportSkillForm) {
    fileSupportSkillForm.addEventListener('submit', (event) => {
      event.preventDefault();
      saveFileSupportSkill();
    });
  }
  if (loadFileSupportSkillButton && fileSupportSkillInput) {
    loadFileSupportSkillButton.addEventListener('click', () => {
      fileSupportSkillInput.value = '';
      fileSupportSkillInput.click();
    });
    fileSupportSkillInput.addEventListener('change', handleFileSupportSkillFileSelection);
  }
  if (deleteAllTemplatesButton) {
    deleteAllTemplatesButton.addEventListener('click', deleteAllTemplates);
  }

  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeSettingsModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (modal.style.display === 'flex' && event.key === 'Escape') {
      event.preventDefault();
      closeSettingsModal();
    }
  });
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

function getHostStatus(item) {
  if (!item || !item.ip) {
    return 'offline';
  }

  const entry = hostStatuses.get(item.id);
  if (entry) {
    return entry.status;
  }

  return 'pending';
}

function isItemOnline(item) {
  const hostStatus = getHostStatus(item);
  if (hostStatus === 'online') {
    return true;
  }
  if (hostStatus === 'offline') {
    return false;
  }

  const lastKnown = itemOnlineStates.get(item.id);
  if (typeof lastKnown === 'boolean') {
    return lastKnown;
  }

  const statuses = getPortStatuses(item);
  if (statuses.length === 0) {
    return false;
  }

  if (statuses.some(status => status === 'open')) {
    return true;
  }

  return false;
}

function updateCardStatusIndicator(card, item, online) {
  if (!card) return;

  const hostStatus = getHostStatus(item);
  const visibleStatus = hostStatus === 'pending' && !itemOnlineStates.has(item?.id)
    ? 'pending'
    : online ? 'online' : 'offline';
  const label = visibleStatus === 'online'
    ? 'Online'
    : visibleStatus === 'pending'
      ? 'Checking status'
      : 'Offline';

  card.classList.toggle('online', online);
  card.dataset.onlineStatus = visibleStatus;

  const status = card.querySelector('.product-ip-status');
  if (status) {
    status.title = item?.ip ? `${label} - ${item.ip}` : label;
    status.setAttribute('aria-label', status.title);
  }

  const dot = card.querySelector('.product-status-dot');
  if (dot) {
    dot.title = label;
  }
}

function updateItemOnlineState(itemId) {
  const match = findItemById(itemId);
  if (!match) return;

  const online = isItemOnline(match.item);
  itemOnlineStates.set(match.item.id, online);
  document.querySelectorAll(`.product-card[data-item-id="${itemId}"]`).forEach(card => {
    updateCardStatusIndicator(card, match.item, online);
  });
}

function setHostStatus(itemId, status) {
  const itemExists = productLines.some(line => line.items.some(item => item.id === itemId));
  if (!itemExists) {
    hostStatuses.delete(itemId);
    return;
  }

  hostStatuses.set(itemId, {
    status,
    checkedAt: Date.now()
  });
  updateItemOnlineState(itemId);
}

function scheduleHostCheck(item) {
  if (!item) return;

  if (!item.ip) {
    setHostStatus(item.id, 'offline');
    return;
  }

  const entry = hostStatuses.get(item.id);
  const intervalMs = Math.max((item.scanInterval || 5) * 1000, 2000);
  const due = !entry || (Date.now() - entry.checkedAt >= intervalMs) || entry.status === 'pending';
  if (!due || pendingHostChecks.has(item.id)) {
    return;
  }

  setHostStatus(item.id, 'pending');
  runHostCheck(item);
}

async function runHostCheck(item) {
  if (!item || pendingHostChecks.has(item.id)) return;

  const networkAPI = getNetworkAPI();
  if (!networkAPI || typeof networkAPI.pingHost !== 'function') {
    setHostStatus(item.id, 'offline');
    return;
  }

  pendingHostChecks.add(item.id);
  try {
    const timeout = Math.max((item.scanInterval || 5) * 1000, 2000);
    const result = await networkAPI.pingHost(item.ip, timeout);
    const online = result && (result.online || result.success);
    setHostStatus(item.id, online ? 'online' : 'offline');
  } catch (error) {
    console.error('Error pinging host', item.ip, error);
    setHostStatus(item.id, 'offline');
  } finally {
    pendingHostChecks.delete(item.id);
  }
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
  const validItemIds = new Set();
  productLines.forEach(line => {
    line.items.forEach(item => {
      validItemIds.add(item.id);
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

  Array.from(hostStatuses.keys()).forEach(itemId => {
    if (!validItemIds.has(itemId)) {
      hostStatuses.delete(itemId);
    }
  });
}

function invalidatePortStatuses(itemId) {
  hostStatuses.delete(itemId);
  pendingHostChecks.delete(itemId);
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

function pollActiveLineStatuses() {
  let items;
  if (productSearchQuery.trim()) {
    items = getProductSearchEntries().map(entry => entry.item);
  } else {
    const lines = activeLineId === CELLULAR_ALL_VIEW_ID
      ? getCategoryLines(PRODUCT_CATEGORIES.find(category => category.id === 'cellular'))
        .filter(line => CELLULAR_CATALOG_LINE_KEYS.includes(getLineKey(line)))
      : [getActiveLine()].filter(Boolean);
    items = lines.flatMap(line => line.items);
  }

  items.forEach(item => {
    scheduleHostCheck(item);
    schedulePortChecks(item);
  });
}

function startPortPolling() {
  if (portPollTimer) return;
  pollActiveLineStatuses();
  portPollTimer = setInterval(() => {
    pollActiveLineStatuses();
  }, PORT_POLL_INTERVAL);
}

function collectConfigurationSnapshot() {
  return {
    type: 'product-line-config',
    version: 3,
    exportedAt: new Date().toISOString(),
    activeLineId,
    productLines: productLines.map((line, index) => normalizeProductLine(line, index)),
    supportTemplates: supportTemplates.map((template, index) => normalizeSupportTemplate(template, index))
  };
}

function triggerConfigDownload(payload) {
  const data = JSON.stringify(payload, null, 2);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `product-line-config-${timestamp}.json`;
  triggerTextDownload(data, filename, 'application/json');
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
  ensureRequiredProductLines();
  syncLockedLineItems();
  recalculateCounters();
  activeLineId = (
    productLines.some(line => line.id === configData.activeLineId)
    || BUILT_IN_VIEW_IDS.has(configData.activeLineId)
  )
    ? configData.activeLineId
    : productLines[0].id;

  supportTemplates = Array.isArray(configData.supportTemplates)
    ? normalizeSupportTemplates(configData.supportTemplates)
    : [];
  activeTemplateId = supportTemplates.some(template => template.id === activeTemplateId)
    ? activeTemplateId
    : '';

  portStatuses.clear();
  hostStatuses.clear();
  itemOnlineStates.clear();
  pendingPortChecks.clear();
  pendingHostChecks.clear();

  saveProductLines();
  saveSupportTemplates();
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
