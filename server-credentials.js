// Importar la función de notificación
import { showNotification } from './server-module.js';

// Objeto para almacenar las credenciales de cada servidor
const serverCredentials = {};

// Función para guardar las credenciales de un servidor
export function saveServerCredentials(serverId, credentials) {
  try {
    // Validar que tenemos todas las credenciales necesarias
    if (!credentials.serverName || !credentials.host || !credentials.apiUser) {
      throw new Error('Missing required credentials');
    }

    // Inicializar el objeto de credenciales si no existe
    if (!serverCredentials[serverId]) {
      serverCredentials[serverId] = {};
    }

    // Guardar las credenciales en memoria
    serverCredentials[serverId] = {
      ...credentials,
      lastUpdated: new Date().toISOString()
    };

    // Guardar en localStorage
    localStorage.setItem(`credentials_${serverId}`, JSON.stringify(serverCredentials[serverId]));

    return true;
  } catch (error) {
    console.error(`Error saving credentials for ${serverId}:`, error);
    throw error;
  }
}

// Función para obtener las credenciales de un servidor
export function getServerCredentials(serverId) {
  try {
    // Intentar obtener las credenciales de la memoria
    if (serverCredentials[serverId]) {
      return serverCredentials[serverId];
    }

    // Si no están en memoria, intentar obtenerlas del localStorage
    const savedCredentials = localStorage.getItem(`credentials_${serverId}`);
    if (savedCredentials) {
      const credentials = JSON.parse(savedCredentials);
      serverCredentials[serverId] = credentials; // Guardar en memoria
      return credentials;
    }

    return null;
  } catch (error) {
    console.error(`Error getting credentials for ${serverId}:`, error);
    return null;
  }
}

// Función para inicializar las credenciales al cargar la aplicación
export function initializeCredentials() {
  try {
    // Cargar todas las credenciales guardadas en localStorage
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

// Función para manejar el envío del formulario de credenciales
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
    // No mostrar datos sensibles en la consola
    hasPassword: !!credentials.password,
    hasToken: !!credentials.tokenValue
  });

  try {
    saveServerCredentials(serverId, credentials);
    
    // Ocultar el panel de credenciales
    const serverNum = serverId.replace('server', '');
    const panelId = `credentials-panel-${serverNum}`;
    const panel = document.getElementById(panelId);
    
    if (panel) {
      panel.style.display = 'none';
      console.log(`Credentials panel hidden for ${serverId}`);
    }
    
    // Actualizar el nombre del servidor en la pestaña
    const serverButton = document.querySelector(`.tab-button[onclick*="${serverId}"]`);
    if (serverButton) {
      serverButton.textContent = credentials.serverName;
      console.log(`Updated tab button text for ${serverId} to ${credentials.serverName}`);
    }
    
    // Actualizar el encabezado
    const serverHeader = document.getElementById(`${serverId}-header`);
    if (serverHeader) {
      serverHeader.textContent = `Virtual Machines - ${credentials.serverName}`;
      console.log(`Updated header for ${serverId}`);
    }

    // Mostrar notificación de éxito
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

// Función para mostrar/ocultar el panel de credenciales
export function toggleCredentialsPanel(serverId) {
  // Extraer el número del servidor (1-10)
  const serverNum = serverId.replace('server', '');
  const panelId = `credentials-panel-${serverNum}`;
  const panel = document.getElementById(panelId);
  
  console.log(`Toggling credentials panel: ${panelId} for server ${serverId}`);
  
  if (panel) {
    // Cambiar la visibilidad del panel
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    console.log(`Panel ${panelId} display set to: ${panel.style.display}`);
  } else {
    console.error(`Panel not found: ${panelId}`);
  }
}

// Función para verificar si un servidor tiene credenciales guardadas
export function hasCredentials(serverId) {
  return getServerCredentials(serverId) !== null;
} 