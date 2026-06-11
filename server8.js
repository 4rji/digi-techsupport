// server8.js - Server-specific module for server 8

import { initializeServer, loadVMs } from './server-module.js';
import { initializeCredentials } from './server-credentials.js';

// Server ID
const SERVER_ID = 'server8';
const SERVER_NUM = '8';

// Initialize the server when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log(`Initializing ${SERVER_ID}...`);
  initializeServer(SERVER_ID, SERVER_NUM);
  initializeCredentials(); // Ensure credentials are initialized
});

// Function to load VMs for server 8
async function loadServer8VMs() {
  console.log('Attempting to load VMs for server8...');
  try {
    const result = await loadVMs(SERVER_ID);
    console.log('LoadVMs result:', result);
    if (result.error) {
      console.error('Error loading VMs:', result.error);
    } else if (result.vms && result.vms.length === 0) {
      console.log('No VMs found on the server');
    } else {
      console.log('VMs loaded successfully:', result.vms);
    }
    return result;
  } catch (error) {
    console.error('Exception loading VMs:', error);
    return { error: error.message, vms: [] };
  }
}

// Export server-specific functions for server 8
export {
  loadServer8VMs,
  SERVER_ID
}; 