// server10.js - Módulo específico para el servidor 10

import { initializeServer, loadVMs } from './server-module.js';
import { initializeCredentials } from './server-credentials.js';

// ID del servidor
const SERVER_ID = 'server10';
const SERVER_NUM = '10';

// Inicializar el servidor cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
  console.log(`Initializing ${SERVER_ID}...`);
  initializeServer(SERVER_ID, SERVER_NUM);
  initializeCredentials(); // Asegurar que las credenciales se inicialicen
});

// Función para cargar las VMs del servidor 10
async function loadServer10VMs() {
  console.log('Attempting to load VMs for server10...');
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

// Exportar funciones específicas del servidor 10
export {
  loadServer10VMs,
  SERVER_ID
}; 