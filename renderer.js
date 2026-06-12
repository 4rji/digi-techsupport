import { Terminal } from './node_modules/@xterm/xterm/lib/xterm.mjs';
import { FitAddon } from './node_modules/@xterm/addon-fit/lib/addon-fit.mjs';

const PRODUCT_LINES_STORAGE_KEY = 'product_lines';
const TEMPLATES_STORAGE_KEY = 'support_templates';
const TEMPLATE_DRAFTS_STORAGE_KEY = 'support_template_drafts';
const LEGACY_MONITOR_STORAGE_KEY = 'monitor_vm_cards';
const ACTIVE_LINE_STORAGE_KEY = 'active_product_line';
const OPENAI_KEY_STORAGE_KEY = 'openAiKey';
const CLAUDE_KEY_STORAGE_KEY = 'claudeKey';
const PREFERRED_PROVIDER_STORAGE_KEY = 'preferredProvider';
const AGENT_SKILL_STORAGE_KEY = 'agentSkill';
const AGENT_SKILL_SOURCE_STORAGE_KEY = 'agentSkillSource';
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
const FILE_SUPPORT_VIEW_ID = '__file_support__';
const BUILT_IN_VIEW_IDS = new Set([TEMPLATES_VIEW_ID, FILE_SUPPORT_VIEW_ID]);
const DEFAULT_FILE_SUPPORT_TREE_WIDTH = 220;
const MIN_FILE_SUPPORT_TREE_WIDTH = 120;
const MAX_FILE_SUPPORT_TREE_WIDTH = 640;
const NEXT_LINE_NAMES = ['AX', 'BX', 'CX', 'DX', 'GX', 'HX', 'MX', 'PX', 'RX', 'ZX'];
const PORT_POLL_INTERVAL = 2000;
const MAX_HIGHLIGHTED_CONTENT_CHARS = 2 * 1024 * 1024;
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
const DEFAULT_ITEM_IPS = {
  'Digi IX10 Industrial Cellular Router': '10.10.65.73',
  'Digi IX20 Industrial 4G LTE Router': '10.10.65.77',
  'Digi IX25 5G Industrial Cellular Router': '10.10.65.48',
  'Digi IX30 Industrial Cellular Router': '10.10.65.78',
  'Digi IX40 5G Edge Computing Industrial IoT Solution': '10.10.65.79',
  'Digi TX54 5G / LTE-Advanced Cellular Router': '10.10.65.67',
  'Digi TX64 5G / LTE-Advanced Pro Cellular Router': '10.10.65.68',
  'Digi TX64 5G Rail Cellular Router': '10.10.65.38',
  'Digi EX12 Cellular Extender': '10.10.65.62',
  'Digi EX15 Cellular Extender': '10.10.65.57',
  'Digi EX50 5G Cellular Extender': '10.10.65.72'
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
  'Digi EX50 5G Cellular Extender': 'img/digi-ex50-new.png',
  'Digi CORE plug-in LTE modem': 'img/digi-core-cm-18.jpg'
};
const LOCKED_ITEM_IMAGE_VARIANTS = {
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
  'Digi CORE plug-in LTE modem': [
    'img/digi-core-cm-18.jpg',
    'img/digi-core-cm-18.png',
    'img/Digi-CORE-1002-CM-back.png'
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
  ]
};
const PRODUCT_SPECS = {
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

let productLines = [];
let supportTemplates = [];
let templateDrafts = [];
let activeLineId = '';
let activeTemplateId = '';
let templateSearchQuery = '';
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
let sshTerminal = null;
let sshFitAddon = null;
let sshSessionId = null;
let sshCurrentItem = null;
let sshResizeObserver = null;
let removeSSHDataListener = null;
let removeSSHCloseListener = null;
let removeSSHErrorListener = null;
let sshPasswordSaveTimer = null;
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
  importError: '',
  importing: false
};
let supportFileTreeWidth = getSavedSupportTreeWidth();
let supportTreeSearchQuery = '';
let supportContentSearchQuery = '';
let supportFileViewerFullscreen = false;
let expandedSupportFolders = new Set();

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
  setupConfigTransferControls();
  setupFileSupportKeyboardShortcuts();
});

window.addEventListener('beforeunload', () => {
  if (portPollTimer) {
    clearInterval(portPollTimer);
  }
  if (sshSessionId) {
    const networkAPI = getNetworkAPI();
    if (networkAPI && typeof networkAPI.sshDisconnect === 'function') {
      networkAPI.sshDisconnect(sshSessionId);
    }
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
    ip: item?.ip || DEFAULT_ITEM_IPS[fallbackName] || '',
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

function normalizeSupportTemplate(template, index) {
  const title = String(template?.title || template?.name || `Template ${index + 1}`).trim() || `Template ${index + 1}`;

  return {
    id: String(template?.id || createTemplateId(title, index)),
    title,
    body: String(template?.body ?? template?.content ?? template?.text ?? ''),
    hidden: false
  };
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
        if (supportTemplates.length !== parsed.length) {
          saveSupportTemplates();
        }
        return;
      }
    }
  } catch (error) {
    console.error('Error loading support templates:', error);
  }

  supportTemplates = [];
  saveSupportTemplates();
}

function saveSupportTemplates() {
  try {
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(supportTemplates));
  } catch (error) {
    console.error('Error saving support templates:', error);
    showNotification('Could not save templates');
  }
}

function loadTemplateDrafts() {
  try {
    const storedDrafts = sessionStorage.getItem(TEMPLATE_DRAFTS_STORAGE_KEY);
    if (storedDrafts) {
      const parsed = JSON.parse(storedDrafts);
      templateDrafts = normalizeSupportTemplates(parsed);
      return;
    }
  } catch (error) {
    console.error('Error loading temporary templates:', error);
  }

  templateDrafts = [];
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
  syncLockedLineItems();
  recalculateCounters();

  const savedActiveLineId = localStorage.getItem(ACTIVE_LINE_STORAGE_KEY);
  activeLineId = BUILT_IN_VIEW_IDS.has(savedActiveLineId)
    ? savedActiveLineId
    : (productLines.some(line => line.id === savedActiveLineId)
      ? savedActiveLineId
      : productLines[0]?.id || '');

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
      activeLineId = viewId;
      saveProductLines();
      renderProductApp();
    });
    tabs.appendChild(button);
  };

  createBuiltInTabButton(TEMPLATES_VIEW_ID, 'Templates');
  createBuiltInTabButton(FILE_SUPPORT_VIEW_ID, 'File Support');

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

  if (activeLineId === TEMPLATES_VIEW_ID) {
    renderTemplatesView(workspace);
    return;
  }

  if (activeLineId === FILE_SUPPORT_VIEW_ID) {
    renderFileSupportView(workspace);
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

function renderTemplatesView(workspace) {
  const header = document.createElement('div');
  header.className = 'vm-header monitor-header product-line-header templates-header';

  const headerText = document.createElement('div');
  headerText.className = 'monitor-header-text';

  const headerRow = document.createElement('div');
  headerRow.className = 'monitor-header-row';

  const title = document.createElement('h2');
  title.id = 'product-line-header-title';
  title.textContent = 'Templates';

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

  const library = document.createElement('section');
  library.className = 'templates-library';

  const list = document.createElement('div');
  list.className = 'template-list';

  const listTitle = document.createElement('h3');
  listTitle.className = 'template-list-title';
  listTitle.textContent = 'Templates';
  list.appendChild(listTitle);

  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.className = 'template-search-input';
  searchInput.placeholder = 'Search templates';
  searchInput.value = templateSearchQuery;
  searchInput.setAttribute('aria-label', 'Search templates');
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
    emptyState.textContent = 'No templates loaded';
    list.appendChild(emptyState);
  } else if (matchingDrafts.length === 0 && matchingTemplates.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'template-empty-state';
    emptyState.textContent = 'No matching templates';
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
  createLabel.textContent = 'Create template';

  const createInput = document.createElement('textarea');
  createInput.id = 'template-agent-input';
  createInput.className = 'template-agent-input';
  createInput.rows = 2;
  createInput.placeholder = 'Paste text here';

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
  editor.appendChild(createRow);

  const activeIndex = supportTemplates.findIndex(template => template.id === activeTemplateId);
  const activeDraftIndex = templateDrafts.findIndex(template => template.id === activeTemplateId);
  if (activeDraftIndex >= 0) {
    editor.appendChild(createTemplateEditor(templateDrafts[activeDraftIndex], activeDraftIndex, { isDraft: true }));
  } else if (activeIndex >= 0) {
    editor.appendChild(createTemplateEditor(supportTemplates[activeIndex], activeIndex));
  } else {
    const placeholder = document.createElement('div');
    placeholder.className = 'template-editor-placeholder';
    placeholder.textContent = templateDrafts.length > 0 || supportTemplates.length > 0 ? 'Select a template' : 'Load .md files';
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
  if (event.key === 'Escape' && activeLineId === FILE_SUPPORT_VIEW_ID && supportFileViewerFullscreen) {
    event.preventDefault();
    supportFileViewerFullscreen = false;
    renderProductApp();
    return;
  }

  const key = String(event.key || '').toLowerCase();
  const isFindShortcut = key === 'f' && (event.ctrlKey || event.metaKey) && !event.altKey;
  if (!isFindShortcut || activeLineId !== FILE_SUPPORT_VIEW_ID) return;

  event.preventDefault();
  event.stopPropagation();

  const inputId = event.shiftKey
    ? 'file-support-tree-search'
    : 'file-support-content-search';
  const focused = focusSupportSearchInput(inputId);

  if (!focused && inputId === 'file-support-content-search') {
    showNotification('Select a file first');
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

function getSupportContentPresentation(filePath, content) {
  const rawContent = String(content || '');
  const trimmedContent = rawContent.trim();
  const extension = filePath.split('.').pop()?.toLowerCase() || '';
  const canHighlight = rawContent.length <= MAX_HIGHLIGHTED_CONTENT_CHARS;

  if (!canHighlight) {
    return {
      mode: 'plain',
      text: rawContent,
      html: escapeHTML(rawContent)
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

function getSupportContentSearchPresentation(filePath, content, query) {
  const presentation = getSupportContentPresentation(filePath, content);
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

function renderFileSupportView(workspace) {
  const treeSearchResult = filterSupportTreeNodes(supportFileState.tree, supportTreeSearchQuery);
  const treeSearchActive = normalizeSearchQuery(supportTreeSearchQuery).length > 0;
  const isViewerFullscreen = supportFileViewerFullscreen && Boolean(supportFileState.selectedFileId);
  const selectedContentPresentation = supportFileState.selectedFileId
    && !supportFileState.selectedLoading
    && !supportFileState.selectedError
    ? getSupportContentSearchPresentation(
        supportFileState.selectedPath,
        supportFileState.selectedContent,
        supportContentSearchQuery
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
    summary.textContent = [
      supportFileState.fileName,
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

  const treePanel = document.createElement('div');
  treePanel.className = 'file-support-panel file-support-tree-panel';
  const treeTitle = document.createElement('h3');
  treeTitle.className = 'file-support-panel-title';
  treeTitle.textContent = 'Archive Tree';
  treePanel.appendChild(treeTitle);

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
    renderProductApp();
    requestAnimationFrame(() => {
      const nextInput = document.getElementById('file-support-tree-search');
      if (!nextInput) return;
      nextInput.focus();
      nextInput.setSelectionRange(nextInput.value.length, nextInput.value.length);
    });
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
  }

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
  const viewerHeader = document.createElement('div');
  viewerHeader.className = 'file-support-viewer-header';
  const viewerTitleRow = document.createElement('div');
  viewerTitleRow.className = 'file-support-viewer-title-row';
  const viewerTitle = document.createElement('h3');
  viewerTitle.className = 'file-support-panel-title';
  viewerTitle.textContent = supportFileState.selectedPath || 'Viewer';
  viewerTitleRow.appendChild(viewerTitle);
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
  viewerHeader.appendChild(viewerTitleRow);
  const contentSearch = document.createElement('div');
  contentSearch.className = 'file-support-search';
  const contentSearchInput = document.createElement('input');
  contentSearchInput.type = 'search';
  contentSearchInput.id = 'file-support-content-search';
  contentSearchInput.className = 'file-support-search-input';
  contentSearchInput.placeholder = 'Search in selected file';
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
  if (normalizeSearchQuery(supportContentSearchQuery) && selectedContentPresentation) {
    const contentSearchStatus = document.createElement('span');
    contentSearchStatus.className = 'file-support-search-status';
    contentSearchStatus.textContent = selectedContentPresentation.matchCount === 1
      ? '1 match'
      : `${selectedContentPresentation.matchCount} matches`;
    contentSearch.appendChild(contentSearchStatus);
  }
  viewerHeader.appendChild(contentSearch);
  viewerPanel.appendChild(viewerHeader);

  const viewerBody = document.createElement('div');
  viewerBody.className = 'file-support-viewer-body';

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
    const presentation = selectedContentPresentation || getSupportContentPresentation(supportFileState.selectedPath, supportFileState.selectedContent);
    pre.className = `file-support-content mode-${presentation.mode}`;
    pre.innerHTML = presentation.html;
    viewerBody.appendChild(pre);
  } else {
    const emptyViewer = document.createElement('div');
    emptyViewer.className = 'file-support-empty-state';
    emptyViewer.textContent = supportFileState.tree.length === 0 ? 'Import a file' : 'Select a file';
    viewerBody.appendChild(emptyViewer);
  }

  viewerPanel.appendChild(viewerBody);
  layout.appendChild(treePanel);
  layout.appendChild(resizer);
  layout.appendChild(viewerPanel);
  workspace.appendChild(layout);
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

    expandedSupportFolders = new Set();
    if (Array.isArray(result.tree) && result.tree.length === 1 && result.tree[0].type === 'directory') {
      expandedSupportFolders.add(result.tree[0].id);
    }
    supportTreeSearchQuery = '';
    supportContentSearchQuery = '';
    supportFileViewerFullscreen = false;

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
      importError: '',
      importing: false
    };
    showNotification('Support file imported');
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
    selectedLoading: true
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

  return cleanMarkdownTitle(compactText) || 'Generated template';
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
      throw new Error(result?.error || 'Could not generate template');
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

    templateDrafts.push(template);
    activeTemplateId = template.id;
    saveTemplateDrafts();
    createInput.value = '';
    showNotification('Template generated (unsaved)');
    renderProductApp();
  } catch (error) {
    console.error('Error generating template:', error);
    showNotification(error.message || 'Could not generate template');
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

function createTemplateEditor(template, index, options = {}) {
  const isDraft = Boolean(options.isDraft);
  const editor = document.createElement('section');
  editor.className = 'template-editor-card';

  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.className = 'template-title-input';
  titleInput.value = template.title;
  titleInput.setAttribute('aria-label', 'Template title');

  const bodyInput = document.createElement('textarea');
  bodyInput.className = 'template-body-input';
  bodyInput.value = template.body;
  bodyInput.rows = 14;
  bodyInput.setAttribute('aria-label', `${template.title} body`);

  if (isDraft) {
    const syncDraft = () => {
      if (!templateDrafts[index]) return;
      templateDrafts[index] = {
        ...templateDrafts[index],
        title: titleInput.value.trim() || template.title,
        body: bodyInput.value
      };
      saveTemplateDrafts();
    };
    titleInput.addEventListener('input', syncDraft);
    bodyInput.addEventListener('input', syncDraft);
  }

  const actions = document.createElement('div');
  actions.className = 'template-actions';

  const saveButton = document.createElement('button');
  saveButton.type = 'button';
  saveButton.className = 'save-button template-action-button';
  saveButton.textContent = 'Save';
  saveButton.addEventListener('click', () => {
    const savedTemplate = {
      ...template,
      title: titleInput.value.trim() || `Template ${index + 1}`,
      body: bodyInput.value
    };
    if (isDraft) {
      savedTemplate.title = titleInput.value.trim() || `Template ${supportTemplates.length + 1}`;
      supportTemplates.push(savedTemplate);
      templateDrafts.splice(index, 1);
      saveTemplateDrafts();
      activeTemplateId = savedTemplate.id;
    } else {
      supportTemplates[index] = savedTemplate;
      activeTemplateId = supportTemplates[index].id;
    }
    saveSupportTemplates();
    showNotification('Template saved');
    renderProductApp();
  });

  const copyButton = document.createElement('button');
  copyButton.type = 'button';
  copyButton.className = 'config-transfer-button template-action-button';
  copyButton.textContent = 'Copy';
  copyButton.addEventListener('click', () => {
    copyTemplateText(bodyInput.value);
  });

  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.className = 'delete-button template-action-button';
  deleteButton.textContent = isDraft ? 'Discard' : 'Delete';
  deleteButton.addEventListener('click', () => {
    if (isDraft) {
      templateDrafts.splice(index, 1);
      saveTemplateDrafts();
      activeTemplateId = templateDrafts[index]?.id || templateDrafts[index - 1]?.id || supportTemplates[0]?.id || '';
      showNotification('Template discarded');
      renderProductApp();
      return;
    }

    const templateTitle = titleInput.value.trim() || template.title || `Template ${index + 1}`;
    const shouldDelete = window.confirm(`Delete "${templateTitle}" permanently?`);
    if (!shouldDelete) return;

    supportTemplates.splice(index, 1);
    activeTemplateId = supportTemplates[index]?.id || supportTemplates[index - 1]?.id || '';
    saveSupportTemplates();
    showNotification('Template deleted');
    renderProductApp();
  });

  actions.appendChild(saveButton);
  actions.appendChild(copyButton);
  actions.appendChild(deleteButton);
  editor.appendChild(titleInput);
  editor.appendChild(bodyInput);
  editor.appendChild(actions);

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
    showNotification(importedTemplates.length === 1 ? 'Template loaded' : `${importedTemplates.length} templates loaded`);
    renderProductApp();
  } catch (error) {
    console.error('Error importing templates:', error);
    showNotification('Could not load templates');
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
    showNotification('Template copied');
  } catch (error) {
    console.error('Error copying template:', error);
    showNotification('Could not copy template');
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

  const links = PRODUCT_LINKS[item.name] || [];
  const linksRow = document.createElement('div');
  linksRow.className = 'product-links';
  const sshRow = document.createElement('div');
  sshRow.className = 'product-ssh-row';
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
  httpsButton.textContent = 'Web';
  httpsButton.title = item.ip ? `Open https://${item.ip}` : 'Configure an IP before opening HTTPS';
  httpsButton.addEventListener('click', (event) => {
    event.stopPropagation();
    openItemHTTPS(item.id);
  });
  sshRow.appendChild(httpsButton);
  if (PRODUCT_SPECS[item.name]) {
    const specsButton = document.createElement('button');
    specsButton.type = 'button';
    specsButton.className = 'product-link-button';
    specsButton.textContent = 'Specs';
    specsButton.addEventListener('click', (event) => {
      event.stopPropagation();
      openProductSpecsModal(item.name);
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

  window.open(url, '_blank', 'noopener,noreferrer');
}

function createDocsSearchForm(item) {
  if (!buildDocsSearchUrl(item.name)) return null;

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
    section.rows.forEach(([label, value]) => {
      const row = document.createElement('div');
      row.className = 'product-specs-row';

      const labelElement = document.createElement('div');
      labelElement.className = 'product-specs-label';
      labelElement.textContent = label;

      const valueElement = document.createElement('div');
      valueElement.className = 'product-specs-value';
      valueElement.textContent = value;

      row.appendChild(labelElement);
      row.appendChild(valueElement);
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

function ensureSSHTerminal() {
  const container = document.getElementById('ssh-terminal-container');
  if (!container) return null;

  if (!sshTerminal) {
    sshTerminal = new Terminal({
      cursorBlink: true,
      convertEol: true,
      fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
      fontSize: 13,
      lineHeight: 1.18,
      theme: {
        background: '#050505',
        foreground: '#f2f2f2',
        cursor: '#9fd7ff',
        selectionBackground: '#2f5f7a'
      }
    });
    sshFitAddon = new FitAddon();
    sshTerminal.loadAddon(sshFitAddon);
    sshTerminal.open(container);
    sshTerminal.onData(data => {
      const networkAPI = getNetworkAPI();
      if (sshSessionId && networkAPI && typeof networkAPI.sshWrite === 'function') {
        networkAPI.sshWrite(sshSessionId, data);
      }
    });
  }

  requestAnimationFrame(() => fitSSHTerminal());
  return sshTerminal;
}

function fitSSHTerminal() {
  if (!sshTerminal || !sshFitAddon) return;
  try {
    sshFitAddon.fit();
    const networkAPI = getNetworkAPI();
    if (sshSessionId && networkAPI && typeof networkAPI.sshResize === 'function') {
      networkAPI.sshResize(sshSessionId, sshTerminal.cols, sshTerminal.rows);
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
  const connectButton = document.getElementById('ssh-connect-btn');
  const disconnectButton = document.getElementById('ssh-disconnect-btn');
  const usernameInput = document.getElementById('ssh-username');
  const passwordInput = document.getElementById('ssh-password');
  const portInput = document.getElementById('ssh-port');
  const saveAdminPasswordInput = document.getElementById('ssh-save-admin-password');
  const directShellInput = document.getElementById('ssh-direct-shell');

  if (connectButton) {
    connectButton.disabled = isConnected || isConnecting;
    connectButton.textContent = isConnecting ? 'Connecting...' : 'Connect';
  }
  if (disconnectButton) {
    disconnectButton.disabled = !isConnected && !isConnecting;
  }
  [usernameInput, passwordInput, portInput].forEach(input => {
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
  if (!networkAPI) return;

  if (!removeSSHDataListener && typeof networkAPI.onSSHData === 'function') {
    removeSSHDataListener = networkAPI.onSSHData(payload => {
      if (!payload || payload.sessionId !== sshSessionId || !sshTerminal) return;
      sshTerminal.write(payload.data || '');
    });
  }

  if (!removeSSHCloseListener && typeof networkAPI.onSSHClose === 'function') {
    removeSSHCloseListener = networkAPI.onSSHClose(payload => {
      if (!payload || payload.sessionId !== sshSessionId) return;
      sshSessionId = null;
      setSSHStatus('Disconnected', 'idle');
      setSSHFormState(false);
      if (sshTerminal) {
        sshTerminal.writeln('\r\n[SSH session closed]');
      }
    });
  }

  if (!removeSSHErrorListener && typeof networkAPI.onSSHError === 'function') {
    removeSSHErrorListener = networkAPI.onSSHError(payload => {
      if (!payload || payload.sessionId !== sshSessionId) return;
      setSSHStatus(payload.error || 'SSH error', 'error');
      if (sshTerminal) {
        sshTerminal.writeln(`\r\n[SSH error] ${payload.error || 'Unknown error'}`);
      }
    });
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

  sshCurrentItem = match.item;
  hostInput.value = match.item.ip;
  if (portInput) portInput.value = '22';
  if (usernameInput) usernameInput.value = 'admin';
  if (passwordInput) passwordInput.value = '';
  if (saveAdminPasswordInput) saveAdminPasswordInput.checked = false;
  if (directShellInput) directShellInput.checked = false;
  if (title) title.textContent = match.item.name || 'SSH Terminal';
  if (eyebrow) eyebrow.textContent = `SSH to ${match.item.ip}`;

  modal.style.display = 'flex';
  registerSSHEventListeners();
  ensureSSHTerminal();
  if (sshTerminal && !sshSessionId) {
    sshTerminal.clear();
  }
  setSSHStatus(sshSessionId ? 'Connected' : 'Not connected', sshSessionId ? 'connected' : 'idle');
  setSSHFormState(Boolean(sshSessionId));
  applySSHDefaults(match.item.ip);
  applySSHAdminPasswordDefault(match.item.ip);
  if (usernameInput && !sshSessionId) {
    usernameInput.focus();
  }
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

async function connectSSHFromForm() {
  const networkAPI = getNetworkAPI();
  const hostInput = document.getElementById('ssh-host');
  const usernameInput = document.getElementById('ssh-username');
  const passwordInput = document.getElementById('ssh-password');
  const portInput = document.getElementById('ssh-port');
  const saveAdminPasswordInput = document.getElementById('ssh-save-admin-password');
  const directShellInput = document.getElementById('ssh-direct-shell');

  if (!networkAPI || typeof networkAPI.sshConnect !== 'function') {
    setSSHStatus('SSH is only available in the Electron app', 'error');
    return;
  }
  if (!hostInput || !usernameInput) return;

  const host = hostInput.value.trim();
  const username = usernameInput.value.trim();
  const password = passwordInput ? passwordInput.value : '';
  const port = portInput ? parseInt(portInput.value, 10) : 22;
  const directShell = Boolean(directShellInput && directShellInput.checked);

  if (!host || !username) {
    setSSHStatus('Host and username are required', 'error');
    return;
  }

  if (sshSessionId) {
    await disconnectSSHSession();
  }

  const terminal = ensureSSHTerminal();
  if (terminal) {
    terminal.clear();
    const target = `${username}@${host}:${Number.isNaN(port) ? 22 : port}`;
    terminal.writeln(directShell
      ? `Connecting to ${target} and starting /bin/sh...`
      : `Connecting to ${target}...`);
  }

  if (username === 'admin' && saveAdminPasswordInput) {
    const saveResult = await saveSSHAdminPasswordPreference();
    if (!saveResult || !saveResult.success) {
      setSSHStatus(saveResult?.error || 'Could not save SSH password', 'error');
      if (terminal) {
        terminal.writeln(`\r\n[Warning] ${saveResult?.error || 'Could not save SSH password'}`);
      }
    }
  }

  setSSHStatus('Connecting...', 'connecting');
  setSSHFormState(false, true);

  const result = await networkAPI.sshConnect({
    host,
    username,
    password,
    port: Number.isNaN(port) ? 22 : port,
    directShell,
    cols: terminal ? terminal.cols : 80,
    rows: terminal ? terminal.rows : 24
  });

  if (!result || !result.success) {
    sshSessionId = null;
    setSSHStatus(result?.error || 'Could not connect', 'error');
    setSSHFormState(false);
    if (terminal) {
      terminal.writeln(`\r\n[Connection failed] ${result?.error || 'Unknown error'}`);
    }
    return;
  }

  sshSessionId = result.sessionId;
  setSSHStatus('Connected', 'connected');
  setSSHFormState(true);
  fitSSHTerminal();
  if (terminal) {
    terminal.focus();
  }
}

async function disconnectSSHSession() {
  const networkAPI = getNetworkAPI();
  const sessionId = sshSessionId;
  sshSessionId = null;
  if (networkAPI && typeof networkAPI.sshDisconnect === 'function' && sessionId) {
    await networkAPI.sshDisconnect(sessionId);
  }
  setSSHStatus('Disconnected', 'idle');
  setSSHFormState(false);
  if (sshTerminal) {
    sshTerminal.writeln('\r\n[Disconnected]');
  }
}

function closeSSHTerminalModal() {
  const modal = document.getElementById('ssh-terminal-modal');
  const passwordInput = document.getElementById('ssh-password');
  const saveAdminPasswordInput = document.getElementById('ssh-save-admin-password');
  if (sshPasswordSaveTimer) {
    clearTimeout(sshPasswordSaveTimer);
    sshPasswordSaveTimer = null;
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
  if (sshSessionId) {
    disconnectSSHSession();
  }
}

function setupSSHTerminalModal() {
  const modal = document.getElementById('ssh-terminal-modal');
  const form = document.getElementById('ssh-login-form');
  const closeButton = document.getElementById('close-ssh-terminal');
  const disconnectButton = document.getElementById('ssh-disconnect-btn');
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

  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeSSHTerminalModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (modal.style.display === 'flex' && event.key === 'Escape') {
      closeSSHTerminalModal();
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

function openSettingsModal() {
  const modal = document.getElementById('settings-modal');
  if (!modal) return;
  populateThemeStylesheetInputs();
  populateProviderKeyInputs();
  populateAgentSkillInputs();
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

function deleteAllTemplates() {
  if (supportTemplates.length === 0) {
    showNotification('No templates to delete');
    return;
  }

  const shouldDelete = window.confirm('Delete all templates permanently?');
  if (!shouldDelete) return;

  supportTemplates = [];
  activeTemplateId = '';
  saveSupportTemplates();
  renderProductApp();
  showNotification('All templates deleted');
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

function setupSettingsModal() {
  const modal = document.getElementById('settings-modal');
  const openButton = document.getElementById('settings-button');
  const closeButton = document.getElementById('close-settings');
  const keysForm = document.getElementById('api-keys-form');
  const themeInputs = document.querySelectorAll('input[name="theme-stylesheet"]');
  const providerInputs = document.querySelectorAll('input[name="preferred-provider"]');
  const skillForm = document.getElementById('agent-skill-form');
  const loadSkillButton = document.getElementById('load-agent-skill-btn');
  const skillFileInput = document.getElementById('agent-skill-input');
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
  const line = getActiveLine();
  if (!line) return;
  line.items.forEach(item => {
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
