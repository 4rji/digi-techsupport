// Import the notification function
import { showNotification } from './server-module.js';

// Object for storing each server credentials
const serverCredentials = {};

// Function to save server credentials
export function saveServerCredentials(serverId, credentials) {
  try {
    // Validate that all required credentials are present
    if (!credentials.serverName || !credentials.host || !credentials.apiUser) {
      throw new Error('Missing required credentials');
    }

    // Initialize the credentials object if it does not exist
    if (!serverCredentials[serverId]) {
      serverCredentials[serverId] = {};
    }

    // Save credentials in memory
    serverCredentials[serverId] = {
      ...credentials,
      lastUpdated: new Date().toISOString()
    };

    // Save in localStorage
    localStorage.setItem(`credentials_${serverId}`, JSON.stringify(serverCredentials[serverId]));

    return true;
  } catch (error) {
    console.error(`Error saving credentials for ${serverId}:`, error);
    throw error;
  }
}

// Function to get server credentials
export function getServerCredentials(serverId) {
  try {
    // Try to get credentials from memory
    if (serverCredentials[serverId]) {
      return serverCredentials[serverId];
    }

    // If they are not in memory, try to get them from localStorage
    const savedCredentials = localStorage.getItem(`credentials_${serverId}`);
    if (savedCredentials) {
      const credentials = JSON.parse(savedCredentials);
      serverCredentials[serverId] = credentials; // Save in memory
      return credentials;
    }

    return null;
  } catch (error) {
    console.error(`Error getting credentials for ${serverId}:`, error);
    return null;
  }
}

// Function to initialize credentials when the app loads
export function initializeCredentials() {
  try {
    // Load all credentials saved in localStorage
    for (let i = 1; i <= 10; i++) {
      const serverId = `server${i}`;
      const savedCredentials = localStorage.getItem(`credentials_${serverId}`);
      if (savedCredentials) {
        serverCredentials[serverId] = JSON.parse(savedCredentials);
      }
    }
  } catch (error) {
    console.error('Error initializing credentials:', error);
  }
}

// Function to handle credentials form submission
export function handleCredentialsSubmit(event, serverId) {
  event.preventDefault();
  console.log(`Handling credentials submit for ${serverId}`);
  
  const formData = new FormData(event.target);
  const credentials = {
    serverName: formData.get('server-name'),
    host: formData.get('proxmox-host'),
    apiUser: formData.get('api-user'),
    username: formData.get('username'),
    password: formData.get('password'),
    tokenName: formData.get('token-name'),
    tokenValue: formData.get('token-value'),
    node: formData.get('node-select')
  };

  console.log(`Credentials collected for ${serverId}:`, {
    serverName: credentials.serverName,
    host: credentials.host,
    apiUser: credentials.apiUser,
    // Do not show sensitive data in the console
    hasPassword: !!credentials.password,
    hasToken: !!credentials.tokenValue
  });

  try {
    saveServerCredentials(serverId, credentials);
    
    // Hide the credentials panel
    const serverNum = serverId.replace('server', '');
    const panelId = `credentials-panel-${serverNum}`;
    const panel = document.getElementById(panelId);
    
    if (panel) {
      panel.style.display = 'none';
      console.log(`Credentials panel hidden for ${serverId}`);
    }
    
    // Update the server name in the tab
    const serverButton = document.querySelector(`.tab-button[onclick*="${serverId}"]`);
    if (serverButton) {
      serverButton.textContent = credentials.serverName;
      console.log(`Updated tab button text for ${serverId} to ${credentials.serverName}`);
    }
    
    // Update the header
    const serverHeader = document.getElementById(`${serverId}-header`);
    if (serverHeader) {
      serverHeader.textContent = `Virtual Machines - ${credentials.serverName}`;
      console.log(`Updated header for ${serverId}`);
    }

    // Show success notification
    if (typeof showNotification === 'function') {
      showNotification(`Credentials saved for ${credentials.serverName}`);
    } else {
      alert(`Credentials saved for ${credentials.serverName}`);
    }

    return true;
  } catch (error) {
    console.error('Error saving credentials:', error);
    alert(`Error saving credentials: ${error.message}`);
    return false;
  }
}

// Function to show/hide the credentials panel
export function toggleCredentialsPanel(serverId) {
  // Extract the server number (1-10)
  const serverNum = serverId.replace('server', '');
  const panelId = `credentials-panel-${serverNum}`;
  const panel = document.getElementById(panelId);
  
  console.log(`Toggling credentials panel: ${panelId} for server ${serverId}`);
  
  if (panel) {
    // Toggle panel visibility
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    console.log(`Panel ${panelId} display set to: ${panel.style.display}`);
  } else {
    console.error(`Panel not found: ${panelId}`);
  }
}

// Function to check whether a server has saved credentials
export function hasCredentials(serverId) {
  return getServerCredentials(serverId) !== null;
} 