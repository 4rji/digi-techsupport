// server-module.js - Shared module for Proxmox server management

// Function to initialize a server
function initializeServer(serverId, serverNum) {
  // Precargar valores predeterminados
  document.getElementById(`api-user-${serverNum}`).value = 'API@pve';
  document.getElementById(`username-${serverNum}`).value = 'root';
  document.getElementById(`token-name-${serverNum}`).value = 'mytoken';
  
  // Get connection status elements
  const statusDot = document.querySelector(`#connection-status-${serverNum} .status-dot`);
  const statusText = document.querySelector(`#connection-status-${serverNum} .status-text`);
  
  // Load saved credentials (try localStorage first for compatibility)
  const savedCredentials = JSON.parse(localStorage.getItem(`credentials_${serverId}`)) || {};
  const applySavedCredentials = (credentials) => {
    if (!credentials || typeof credentials !== 'object') {
      return;
    }
    
    const tabButton = document.querySelector(`.tab-button[onclick*="${serverId}"]`);
    const header = document.getElementById(`${serverId}-header`);
    
    if (credentials.serverName) {
      const serverNameInput = document.getElementById(`server-name-${serverNum}`);
      if (serverNameInput) {
        serverNameInput.value = credentials.serverName;
      }
      if (tabButton) {
        tabButton.textContent = credentials.serverName;
      }
      if (header) {
        header.textContent = `Virtual Machines - ${credentials.serverName}`;
      }
    }
    if (credentials.username) {
      document.getElementById(`username-${serverNum}`).value = credentials.username;
    }
    if (credentials.password) {
      document.getElementById(`password-${serverNum}`).value = credentials.password;
    }
    if (credentials.host) {
      document.getElementById(`proxmox-host-${serverNum}`).value = credentials.host;
    }
    if (credentials.apiUser) {
      document.getElementById(`api-user-${serverNum}`).value = credentials.apiUser;
    }
    if (credentials.tokenName) {
      document.getElementById(`token-name-${serverNum}`).value = credentials.tokenName;
    }
    if (credentials.tokenValue) {
      document.getElementById(`token-value-${serverNum}`).value = credentials.tokenValue;
    }
    if (credentials.node) {
      const nodeSelect = document.getElementById(`node-select-${serverNum}`);
      if (nodeSelect) {
        let option = Array.from(nodeSelect.options).find(opt => opt.value === credentials.node);
        if (!option) {
          option = document.createElement('option');
          option.value = credentials.node;
          option.textContent = credentials.node;
          nodeSelect.appendChild(option);
        }
        nodeSelect.value = credentials.node;
      }
    }
  };

  // Only set the default host when no credentials are saved
  if (!savedCredentials.host) {
    document.getElementById(`proxmox-host-${serverNum}`).value = 'https://IP:8006/api2/json';
  }
  applySavedCredentials(savedCredentials);
  
  // Fetch actual server configuration from main process
  // This will get the configuration loaded from files during app startup
  window.proxmoxAPI.getVMs(serverId)
    .then(result => {
      // If we got a valid response and no error, the server is configured
      if (!result.error || result.error.indexOf('Could not connect') !== -1) {
        // Server is configured, just might not be reachable
        // Use the known configuration from localStorage
        applySavedCredentials(savedCredentials);
        
        // Decide connection status based on the response
        if (!result.error) {
          // Connection is working
          statusDot.classList.add('connected');
          statusText.classList.add('connected');
          statusText.textContent = 'Host is reachable';
          updateTabStatus(serverId, true);
        } else {
          // Configuration exists but connection failed
          statusDot.classList.remove('connected');
          statusText.classList.remove('connected');
          statusText.textContent = 'Host is not reachable';
          updateTabStatus(serverId, false);
        }
      }
    })
    .catch(error => {
      console.error(`Error fetching VMs for ${serverId}:`, error);
    });
  
  document.addEventListener('server-credentials-updated', (event) => {
    const updatedServerId = event.detail?.serverId;
    if (!updatedServerId || updatedServerId === serverId || updatedServerId === 'all') {
      const latestCredentials = JSON.parse(localStorage.getItem(`credentials_${serverId}`)) || {};
      if (Object.keys(latestCredentials).length > 0) {
        applySavedCredentials(latestCredentials);
      }
    }
  });
  
  // Configure buttons to show/hide the credentials panel
  const showCredentialsBtn = document.getElementById(`show-credentials-btn-${serverNum}`);
  const closeCredentialsBtn = document.getElementById(`close-credentials-btn-${serverNum}`);
  const credentialsPanel = document.getElementById(`credentials-panel-${serverNum}`);
  
  showCredentialsBtn.addEventListener('click', () => {
    credentialsPanel.style.display = 'block';
  });
  
  closeCredentialsBtn.addEventListener('click', () => {
    credentialsPanel.style.display = 'none';
  });

  // Handle the configuration form submission
  const configForm = document.getElementById(`config-form-${serverNum}`);
  configForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const config = {
      serverName: document.getElementById(`server-name-${serverNum}`).value,
      host: document.getElementById(`proxmox-host-${serverNum}`).value,
      apiUser: document.getElementById(`api-user-${serverNum}`).value,
      username: document.getElementById(`username-${serverNum}`).value,
      password: document.getElementById(`password-${serverNum}`).value,
      tokenName: document.getElementById(`token-name-${serverNum}`).value,
      tokenValue: document.getElementById(`token-value-${serverNum}`).value,
      node: document.getElementById(`node-select-${serverNum}`).value,
      serverId: serverId
    };

    // Update the connection status
    const statusDot = document.querySelector(`#connection-status-${serverNum} .status-dot`);
    const statusText = document.querySelector(`#connection-status-${serverNum} .status-text`);

    // Save credentials in localStorage
    localStorage.setItem(`credentials_${serverId}`, JSON.stringify({
      serverName: config.serverName,
      username: config.username,
      password: config.password,
      host: config.host,
      apiUser: config.apiUser,
      tokenName: config.tokenName,
      tokenValue: config.tokenValue,
      node: config.node
    }));

    // Update the tab button text with the server name
    const tabButton = document.querySelector(`.tab-button[onclick*="${serverId}"]`);
    const header = document.getElementById(`${serverId}-header`);
    if (tabButton && config.serverName) {
      tabButton.textContent = config.serverName;
    }
    if (header && config.serverName) {
      header.textContent = `Virtual Machines - ${config.serverName}`;
    }

    // Show saving message
    showNotification(`Saving credentials for ${config.serverName}...`);

    // Send the configuration to the main process
    const result = await window.proxmoxAPI.saveConfig(config);
    
    if (result.success) {
      // Update the connection status
      statusDot.classList.add('connected');
      statusText.classList.add('connected');
      statusText.textContent = 'Host is reachable';
      updateTabStatus(serverId, true);
      
      showNotification(`Credentials for ${config.serverName} saved successfully`);
      credentialsPanel.style.display = 'none'; // Hide the panel after saving
      
      // Reload VMs with the new configuration
      try {
        await loadVMs(serverId);
      } catch (error) {
        console.error('Error reloading VMs after config save:', error);
      }
    } else {
      // Update the connection status
      statusDot.classList.remove('connected');
      statusText.classList.remove('connected');
      statusText.textContent = 'Host is not reachable';
      updateTabStatus(serverId, false);
      
      showNotification(`Error saving credentials: ${result.error}`);
    }
  });

  // Add event to load nodes when the host changes
  document.getElementById(`proxmox-host-${serverNum}`).addEventListener('change', async function() {
    const host = this.value;
    const apiUser = document.getElementById(`api-user-${serverNum}`).value;
    const tokenName = document.getElementById(`token-name-${serverNum}`).value;
    const tokenValue = document.getElementById(`token-value-${serverNum}`).value;
    
    // Update the connection status
    const statusDot = document.querySelector(`#connection-status-${serverNum} .status-dot`);
    const statusText = document.querySelector(`#connection-status-${serverNum} .status-text`);
    
    if (host && apiUser && tokenName && tokenValue) {
      try {
        // Create a temporary configuration to test the connection
        const tempConfig = {
          host,
          apiUser,
          tokenName,
          tokenValue,
          serverId: serverId
        };
        
        // Save the temporary configuration
        const saveResult = await window.proxmoxAPI.saveConfig(tempConfig);
        if (!saveResult.success) {
          console.error('Error saving temporary configuration:', saveResult.error);
          statusDot.classList.remove('connected');
          statusText.classList.remove('connected');
          statusText.textContent = 'Host is not reachable';
          updateTabStatus(serverId, false);
          return;
        }
        
        // Obtener los nodos
        const result = await window.proxmoxAPI.getNodes(serverId);
        if (result.success && result.nodes && result.nodes.length > 0) {
          const nodeSelect = document.getElementById(`node-select-${serverNum}`);
          
          // Limpiar opciones existentes excepto la primera
          while (nodeSelect.options.length > 1) {
            nodeSelect.remove(1);
          }
          
          // Add the nodes as options
          result.nodes.forEach(node => {
            const option = document.createElement('option');
            option.value = node.node;
            option.textContent = node.node;
            nodeSelect.appendChild(option);
          });
          
          // Update the connection status
          statusDot.classList.add('connected');
          statusText.classList.add('connected');
          statusText.textContent = 'Host is reachable';
          updateTabStatus(serverId, true);
          
          showNotification('Nodes loaded successfully');
        } else {
          console.error('Error loading nodes:', result.error);
          statusDot.classList.remove('connected');
          statusText.classList.remove('connected');
          statusText.textContent = 'Host is not reachable';
          updateTabStatus(serverId, false);
          showNotification('Error loading nodes: ' + (result.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error loading nodes:', error);
        statusDot.classList.remove('connected');
        statusText.classList.remove('connected');
        statusText.textContent = 'Host is not reachable';
        updateTabStatus(serverId, false);
        showNotification('Error loading nodes: ' + error.message);
      }
    } else {
      statusDot.classList.remove('connected');
      statusText.classList.remove('connected');
      statusText.textContent = 'Host is not reachable';
      updateTabStatus(serverId, false);
    }
  });

  // Start auto-refresh when initializing the server
  startAutoRefresh(serverId);
}

// Function to load VMs for a specific server
async function loadVMs(serverId) {
  try {
    const serverNum = serverId.replace('server', '');
    const vmGrid = document.getElementById(`vm-grid-${serverNum}`);
    const statusDot = document.querySelector(`#connection-status-${serverNum} .status-dot`);
    const statusText = document.querySelector(`#connection-status-${serverNum} .status-text`);
    
    if (!vmGrid) {
      console.error(`VM grid not found for ${serverId}`);
      return;
    }
    
    // Show loading message only if there are no VMs yet
    if (vmGrid.children.length === 0) {
      vmGrid.innerHTML = '<div class="loading">Loading virtual machines...</div>';
    }
    
    const result = await window.proxmoxAPI.getVMs(serverId);
    
    // Always update connection status based on the result
    if (result.error) {
      statusDot.classList.remove('connected');
      statusText.classList.remove('connected');
      statusText.textContent = 'Host is not reachable';
      updateTabStatus(serverId, false);
      
      // Only show error message if there are no VMs yet
      if (vmGrid.children.length === 0) {
        vmGrid.innerHTML = `<div class="error-message">${result.error}</div>`;
      }
      return result;
    }
    
    // Update connection status based on the response
    if (result.connectionStatus) {
      if (result.connectionStatus.success) {
        statusDot.classList.add('connected');
        statusText.classList.add('connected');
        statusText.textContent = result.connectionStatus.message;
        updateTabStatus(serverId, true);
      } else {
        statusDot.classList.remove('connected');
        statusText.classList.remove('connected');
        statusText.textContent = result.connectionStatus.message;
        updateTabStatus(serverId, false);
      }
    }
    
    // Update VMs if we have a successful response
    if (result.vms && result.vms.length > 0) {
      // Clear the grid
      vmGrid.innerHTML = '';
      
      result.vms.forEach(vm => {
        const vmCard = document.createElement('div');
        vmCard.className = 'vm-card';
        // Annotate VM card with status, server and vmid for updates
        vmCard.setAttribute('data-status', vm.status);
        vmCard.setAttribute('data-server', serverId);
        vmCard.setAttribute('data-vmid', vm.vmid);
        
        // Ajustar el estado para mostrar 'hibernating' cuando corresponda
        let displayStatus = vm.status;
        if (vm.status === 'stopped' && vm.template !== 1) {
          // For now, assume that if the VM is stopped and is not a template, it is powered off
          displayStatus = 'stopped';
        }
        
        // Log the CPU usage value for debugging
        let cpuValue = typeof vm.cpu_usage === 'number' ? vm.cpu_usage : 0;
        // If the value is less than 10 (likely not multiplied), multiply by 100
        if (cpuValue > 0 && cpuValue < 10) cpuValue = cpuValue * 100;
        console.log('Rendering VM', vm.name, 'CPU:', cpuValue);
        vmCard.innerHTML = `
          <div class="vm-card-content">
            <button class="ip-button" data-vmid="${vm.vmid}" data-server="${serverId}">
              IP
              <div class="ip-tooltip">
                <div class="ip-tooltip-content">
                  <div class="ip-tooltip-item">
                    <span class="ip-tooltip-label">Loading...</span>
                  </div>
                </div>
              </div>
            </button>
            <div class="vm-icon">
              ${vm.icon || '🖥️'}
            </div>
            <div class="vm-name">${vm.name || 'Unknown'}</div>
            <div class="vm-status">${displayStatus || 'unknown'}</div>
            <div class="vm-cpu-usage">
              <div class="cpu-bar" style="width: ${cpuValue}%; background: ${typeof vm.cpu_usage === 'number' ? '#2196f3' : ''};"></div>
              <div class="cpu-text">${cpuValue.toFixed(1)}%</div>
            </div>
            <div class="vm-actions">
              ${displayStatus === 'running' ? `
                <button class="action-button stop-btn" data-vmid="${vm.vmid}" data-server="${serverId}">Stop</button>
                <button class="action-button hibernate-btn" data-vmid="${vm.vmid}" data-server="${serverId}">Hibernate</button>
                <button class="action-button console-btn" data-vmid="${vm.vmid}" data-server="${serverId}">Console</button>
              ` : (displayStatus === 'paused' || displayStatus === 'suspended' || displayStatus === 'hibernating') ? `
                <button class="action-button resume-btn" data-vmid="${vm.vmid}" data-server="${serverId}">Resume</button>
              ` : `
                <button class="action-button start-btn" data-vmid="${vm.vmid}" data-server="${serverId}">Start</button>
              `}
            </div>
          </div>
        `;
        
        vmGrid.appendChild(vmCard);
      });
      
      setupVMButtons(serverId);
    }
    
    return result;
  } catch (error) {
    console.error(`Error loading VMs for ${serverId}:`, error);
    const serverNum = serverId.replace('server', '');
    const vmGrid = document.getElementById(`vm-grid-${serverNum}`);
    if (vmGrid && vmGrid.children.length === 0) {
      vmGrid.innerHTML = `<div class="error-message">Error loading virtual machines: ${error.message}</div>`;
    }
    return { error: error.message, vms: [] };
  }
}

// Function to set up action buttons for a specific server
function setupVMButtons(serverId) {
  console.log(`Setting up VM buttons for ${serverId}...`);
  const serverSelector = `[data-server="${serverId}"]`;
  
  // Set up IP buttons
  document.querySelectorAll(`.ip-button${serverSelector}`).forEach(button => {
    let tooltipTimeout;
    
    // Function to update the tooltip with the IPs
    const updateTooltip = async (tooltip) => {
      const vmid = button.getAttribute('data-vmid');
      const server = button.getAttribute('data-server');
      
      try {
        const result = await window.proxmoxAPI.getVMIPs(vmid, server);
        
        if (result && result.success && result.ips) {
          tooltip.innerHTML = `
            <div class="ip-tooltip-content">
              ${Object.entries(result.ips).map(([iface, addresses]) => 
                addresses.map(ip => `
                  <div class="ip-tooltip-item">
                    <span class="ip-tooltip-label">${iface}:</span>
                    <span class="ip-tooltip-address">${ip}</span>
                  </div>
                `).join('')
              ).join('')}
            </div>
          `;
        } else {
          tooltip.innerHTML = `
            <div class="ip-tooltip-content">
              <div class="ip-tooltip-item">
                <span class="ip-tooltip-label">No IPs found</span>
              </div>
            </div>
          `;
        }
      } catch (error) {
        console.error('Error getting IPs for tooltip:', error);
        tooltip.innerHTML = `
          <div class="ip-tooltip-content">
            <div class="ip-tooltip-item">
              <span class="ip-tooltip-label">Error loading IPs</span>
            </div>
          </div>
        `;
      }
    };

    // Evento para mostrar el tooltip
    button.addEventListener('mouseenter', () => {
      const tooltip = button.querySelector('.ip-tooltip');
      if (tooltip) {
        tooltipTimeout = setTimeout(() => {
          updateTooltip(tooltip);
        }, 300); // Short delay to avoid unnecessary updates
      }
    });

    // Evento para ocultar el tooltip
    button.addEventListener('mouseleave', () => {
      if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
      }
    });

    // Mantener el evento de click existente
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      
      const vmid = button.getAttribute('data-vmid');
      const server = button.getAttribute('data-server');
      
      if (!vmid) {
        console.error('No VMID found on button');
        showNotification('Error: No VM ID found');
        return;
      }
      
      try {
        showNotification('Getting IP addresses...');
        const result = await window.proxmoxAPI.getVMIPs(vmid, server);
        
        if (result && result.success && result.ips) {
          showIPModal(result.ips, vmid);
        } else {
          showNotification(`Error getting IP addresses: ${result.error || 'No IPs found'}`);
        }
      } catch (error) {
        console.error('Error getting IP addresses:', error);
        showNotification(`Error getting IP addresses: ${error.message}`);
      }
    });
  });

  // Set up start buttons
  document.querySelectorAll(`.start-btn${serverSelector}`).forEach(button => {
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      console.log('Start button clicked');
      
      // Disable the button while the action is processed
      button.disabled = true;
      button.textContent = 'Starting...';
      
      const vmid = button.getAttribute('data-vmid');
      const server = button.getAttribute('data-server');
      
      if (!vmid) {
        console.error('No VMID found on button');
        showNotification('Error: No VM ID found');
        button.disabled = false;
        button.textContent = 'Start';
        return;
      }
      
      try {
        showNotification('Starting VM...');
        const result = await window.proxmoxAPI.controlVM(vmid, 'start', server);
        
        if (result && result.success) {
          showNotification('VM started successfully');
          // Reload the list after a short delay
          setTimeout(() => {
            loadVMs(server);
            button.disabled = false;
            button.textContent = 'Start';
          }, 2000);
        } else {
          showNotification(`Error starting the VM: ${result.error || 'Unknown error'}`);
          button.disabled = false;
          button.textContent = 'Start';
        }
      } catch (error) {
        console.error('Error starting VM:', error);
        showNotification(`Error starting VM: ${error.message}`);
        button.disabled = false;
        button.textContent = 'Start';
      }
    });
  });
  
  // Set up resume buttons
  document.querySelectorAll(`.resume-btn${serverSelector}`).forEach(button => {
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      console.log('Resume button clicked');
      
      // Disable the button while the action is processed
      button.disabled = true;
      button.textContent = 'Resuming...';
      
      const vmid = button.getAttribute('data-vmid');
      const server = button.getAttribute('data-server');
      
      if (!vmid) {
        console.error('No VMID found on button');
        showNotification('Error: No VM ID found');
        button.disabled = false;
        button.textContent = 'Resume';
        return;
      }
      
      try {
        showNotification('Resuming VM...');
        const result = await window.proxmoxAPI.controlVM(vmid, 'resume', server);
        
        if (result && result.success) {
          showNotification('VM resumed successfully');
          // Reload the list after a short delay
          setTimeout(() => {
            loadVMs(server);
            button.disabled = false;
            button.textContent = 'Resume';
          }, 2000);
        } else {
          showNotification(`Error resuming the VM: ${result.error || 'Unknown error'}`);
          button.disabled = false;
          button.textContent = 'Resume';
        }
      } catch (error) {
        console.error('Error resuming VM:', error);
        showNotification(`Error resuming VM: ${error.message}`);
        button.disabled = false;
        button.textContent = 'Resume';
      }
    });
  });
  
  // Set up stop buttons
  document.querySelectorAll(`.stop-btn${serverSelector}`).forEach(button => {
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      console.log('Stop button clicked');
      
      // Disable the button while the action is processed
      button.disabled = true;
      button.textContent = 'Stopping...';
      
      const vmid = button.getAttribute('data-vmid');
      const server = button.getAttribute('data-server');
      
      if (!vmid) {
        console.error('No VMID found on button');
        showNotification('Error: No VM ID found');
        button.disabled = false;
        button.textContent = 'Stop';
        return;
      }
      
      try {
        showNotification('Stopping VM...');
        const result = await window.proxmoxAPI.controlVM(vmid, 'stop', server);
        
        if (result && result.success) {
          showNotification('VM stopped successfully');
          // Reload the list after a short delay
          setTimeout(() => {
            loadVMs(server);
            button.disabled = false;
            button.textContent = 'Stop';
          }, 2000);
        } else {
          showNotification(`Error stopping the VM: ${result.error || 'Unknown error'}`);
          button.disabled = false;
          button.textContent = 'Stop';
        }
      } catch (error) {
        console.error('Error stopping VM:', error);
        showNotification(`Error stopping VM: ${error.message}`);
        button.disabled = false;
        button.textContent = 'Stop';
      }
    });
  });

  // Set up hibernate buttons
  document.querySelectorAll(`.hibernate-btn${serverSelector}`).forEach(button => {
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      console.log('Hibernate button clicked');
      
      // Disable the button while the action is processed
      button.disabled = true;
      button.textContent = 'Hibernating...';
      
      const vmid = button.getAttribute('data-vmid');
      const server = button.getAttribute('data-server');
      
      if (!vmid) {
        console.error('No VMID found on button');
        showNotification('Error: No VM ID found');
        button.disabled = false;
        button.textContent = 'Hibernate';
        return;
      }
      
      try {
        showNotification('Hibernating VM...');
        const result = await window.proxmoxAPI.controlVM(vmid, 'suspend', server);
        
        if (result && result.success) {
          showNotification('VM hibernated successfully');
          // Reload the list after a short delay
          setTimeout(() => {
            loadVMs(server);
            button.disabled = false;
            button.textContent = 'Hibernate';
          }, 2000);
        } else {
          showNotification(`Error hibernating the VM: ${result.error || 'Unknown error'}`);
          button.disabled = false;
          button.textContent = 'Hibernate';
        }
      } catch (error) {
        console.error('Error hibernating VM:', error);
        showNotification(`Error hibernating VM: ${error.message}`);
        button.disabled = false;
        button.textContent = 'Hibernate';
      }
    });
  });

  // Set up console buttons
  document.querySelectorAll(`.console-btn${serverSelector}`).forEach(button => {
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      console.log('Console button clicked');
      
      // Disable the button while the action is processed
      button.disabled = true;
      button.textContent = 'Opening...';
      
      const vmid = button.getAttribute('data-vmid');
      const server = button.getAttribute('data-server');
      
      if (!vmid) {
        console.error('No VMID found on button');
        showNotification('Error: No VM ID found');
        button.disabled = false;
        button.textContent = 'Console';
        return;
      }
      
      try {
        showNotification('Opening console...');
        const result = await window.proxmoxAPI.openConsole(vmid, server);
        
        if (result && result.success) {
          showNotification('Opening console in a new window');
        } else {
          showNotification(`Error opening console: ${result.error || 'Unknown error'}`);
        }
        
        // Enable the button after a short delay
        setTimeout(() => {
          button.disabled = false;
          button.textContent = 'Console';
        }, 1000);
      } catch (error) {
        console.error('Error opening console:', error);
        showNotification(`Error opening console: ${error.message}`);
        button.disabled = false;
        button.textContent = 'Console';
      }
    });
  });
  
  // Add CPU usage update interval for running VMs
  const updateCPUUsage = async () => {
    console.log('Starting CPU usage update cycle');
    const runningVMs = document.querySelectorAll(`.vm-card[data-status="running"]`);
    console.log(`Found ${runningVMs.length} running VMs to update`);
    
    for (const vmCard of runningVMs) {
      const vmid = vmCard.getAttribute('data-vmid');
      const server = vmCard.getAttribute('data-server');
      
      if (!vmid || !server) {
        console.error('Missing VMID or server ID for VM card:', vmCard);
        continue;
      }
      
      try {
        console.log(`Requesting CPU usage for VM ${vmid} on server ${server}`);
        const result = await window.proxmoxAPI.getVMStatus(vmid, server);
        console.log(`Received CPU usage data for VM ${vmid}:`, result);
        
        if (result && result.cpu_usage !== undefined) {
          const cpuBar = vmCard.querySelector('.cpu-bar');
          const cpuText = vmCard.querySelector('.cpu-text');
          
          if (cpuBar && cpuText) {
            // Ensure the value is between 0 and 100
            const cpuUsage = Math.min(Math.max(result.cpu_usage, 0), 100);
            console.log(`Setting CPU usage to ${cpuUsage}% for VM ${vmid}`);
            
            // Force a minimum width of 2px for visibility
            const width = Math.max(cpuUsage, 2);
            cpuBar.style.width = `${width}%`;
            
            // Update the text
            cpuText.textContent = `${cpuUsage.toFixed(1)}%`;
            
            // Log the actual style being applied
            console.log(`Applied style to CPU bar for VM ${vmid}:`, cpuBar.style.cssText);
          } else {
            console.error(`CPU bar or text element not found for VM ${vmid}`);
          }
        } else {
          console.log(`No CPU usage data received for VM ${vmid}:`, result);
        }
      } catch (error) {
        console.error(`Error updating CPU usage for VM ${vmid}:`, error);
      }
    }
  };

  // Clear any existing interval for this server
  if (window.cpuUpdateIntervals && window.cpuUpdateIntervals[serverId]) {
    clearInterval(window.cpuUpdateIntervals[serverId]);
  }

  // Update CPU usage every 5 seconds for running VMs
  const cpuUpdateInterval = setInterval(updateCPUUsage, 5000);
  
  // Store the interval ID for cleanup
  if (!window.cpuUpdateIntervals) {
    window.cpuUpdateIntervals = {};
  }
  window.cpuUpdateIntervals[serverId] = cpuUpdateInterval;

  // Initial update
  console.log('Starting initial CPU usage update');
  updateCPUUsage();

  // Add a test update after 1 second to verify the function is working
  setTimeout(() => {
    console.log('Running test CPU usage update');
    updateCPUUsage();
  }, 1000);

  console.log(`VM buttons setup complete for ${serverId}`);
}

// Function to show the IP modal
function showIPModal(ips, vmid) {
  // Remove any existing modal
  const existingModal = document.querySelector('.ip-modal');
  if (existingModal) {
    existingModal.remove();
  }

  // Create modal container
  const modal = document.createElement('div');
  modal.className = 'ip-modal';
  
  // Create modal content
  modal.innerHTML = `
    <div class="ip-modal-header">
      <h3 class="ip-modal-title">IP Addresses</h3>
    </div>
    <ul class="ip-list">
      ${Object.entries(ips).map(([iface, addresses]) => 
        addresses.map(ip => `
          <li class="ip-item" data-ip="${ip}">
            <span class="ip-label">${iface}:</span>
            <span class="ip-address">${ip}</span>
          </li>
        `).join('')
      ).join('')}
    </ul>
  `;

  // Add modal to document
  document.body.appendChild(modal);
  
  // Show modal with fade in
  setTimeout(() => modal.style.display = 'block', 10);

  // Setup click outside modal to close
  document.addEventListener('click', function closeModal(e) {
    if (!modal.contains(e.target)) {
      modal.remove();
      document.removeEventListener('click', closeModal);
    }
  });

  // Setup IP click to copy
  modal.querySelectorAll('.ip-item').forEach(item => {
    item.addEventListener('click', async () => {
      const ip = item.dataset.ip;
      try {
        await navigator.clipboard.writeText(ip);
        
        // Show copy indicator
        const rect = item.getBoundingClientRect();
        const indicator = document.createElement('div');
        indicator.className = 'copy-indicator';
        indicator.textContent = 'IP Copied!';
        indicator.style.top = `${rect.top - 30}px`;
        indicator.style.left = `${rect.left + (rect.width / 2) - 40}px`;
        document.body.appendChild(indicator);
        
        // Remove indicator after animation
        setTimeout(() => indicator.remove(), 2000);
      } catch (err) {
        console.error('Failed to copy IP:', err);
        showNotification('Failed to copy IP to clipboard');
      }
    });
  });
}

// Function to show a temporary notification
function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 2000);
}

function updateTabStatus(serverId, isOnline) {
  const tabButton = document.querySelector(`.tab-button[onclick*="${serverId}"]`);
  if (tabButton) {
    if (!isOnline) {
      tabButton.classList.add('offline');
    } else {
      tabButton.classList.remove('offline');
    }
  }
}

// Add auto-refresh functionality
let autoRefreshIntervals = {};

function startAutoRefresh(serverId) {
  // Clear any existing interval for this server
  if (autoRefreshIntervals[serverId]) {
    clearInterval(autoRefreshIntervals[serverId]);
  }
  
  // Set up new interval to check connection status every 30 seconds
  autoRefreshIntervals[serverId] = setInterval(async () => {
    try {
      const result = await window.proxmoxAPI.getVMs(serverId);
      const serverNum = serverId.replace('server', '');
      const statusDot = document.querySelector(`#connection-status-${serverNum} .status-dot`);
      const statusText = document.querySelector(`#connection-status-${serverNum} .status-text`);
      
      if (result.error) {
        statusDot.classList.remove('connected');
        statusText.classList.remove('connected');
        statusText.textContent = 'Host is not reachable';
        updateTabStatus(serverId, false);
      } else if (result.connectionStatus) {
        if (result.connectionStatus.success) {
          statusDot.classList.add('connected');
          statusText.classList.add('connected');
          statusText.textContent = result.connectionStatus.message;
          updateTabStatus(serverId, true);
        } else {
          statusDot.classList.remove('connected');
          statusText.classList.remove('connected');
          statusText.textContent = result.connectionStatus.message;
          updateTabStatus(serverId, false);
        }
      }
    } catch (error) {
      console.error(`Error in auto-refresh for ${serverId}:`, error);
    }
  }, 30000); // Check every 30 seconds
}

function stopAutoRefresh(serverId) {
  if (autoRefreshIntervals[serverId]) {
    clearInterval(autoRefreshIntervals[serverId]);
    delete autoRefreshIntervals[serverId];
  }
}

// Export functions so they can be used by other modules
export {
  initializeServer,
  loadVMs,
  setupVMButtons,
  showNotification,
  updateTabStatus,
  startAutoRefresh,
  stopAutoRefresh
}; 
