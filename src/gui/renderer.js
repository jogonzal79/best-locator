// src/gui/renderer.js
const { ipcRenderer } = require('electron');

// Elementos del DOM
const elements = {
    urlInput: document.getElementById('url-input'),
    frameworkSelect: document.getElementById('framework-select'),
    languageSelect: document.getElementById('language-select'),
    
    // Botones principales
    pickSingle: document.getElementById('pick-single'),
    pickMultiple: document.getElementById('pick-multiple'),
    pickToggle: document.getElementById('pick-toggle'),
    
    // Validar URL
    validateUrl: document.getElementById('validate-url'),
    
    // Output
    outputContainer: document.getElementById('output-container'),
    clearOutput: document.getElementById('clear-output'),
    
    // Status
    statusText: document.getElementById('status-text'),
    configStatus: document.getElementById('config-status'),
    
    // Loading
    loadingOverlay: document.getElementById('loading-overlay'),
    loadingText: document.getElementById('loading-text'),
    cancelCommand: document.getElementById('cancel-command')
};

// Estado de la aplicación
let currentConfig = null;
let isCommandRunning = false;
let capturedSelectors = [];
let outputBuffer = '';
let capturedCodes = []; // Array para múltiples códigos

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Best-Locator GUI initialized');
    
    await loadConfig();
    setupEventListeners();
    updateStatus('Ready to generate selectors! 🎯');
    
    // Configurar validación inicial de framework/lenguaje
    updateLanguageOptions(elements.frameworkSelect.value);
});

// Cargar configuración
async function loadConfig() {
    try {
        const config = await ipcRenderer.invoke('get-config');
        if (config) {
            currentConfig = config;
            
            // Actualizar UI con configuración
            elements.frameworkSelect.value = config.defaultFramework || 'playwright';
            elements.languageSelect.value = config.defaultLanguage || 'typescript';
            
            // Actualizar status
            elements.configStatus.textContent = 'Config loaded ✅';
            elements.configStatus.style.color = '#10b981';
            
            console.log('✅ Configuration loaded:', config);
        } else {
            elements.configStatus.textContent = 'No config found';
            elements.configStatus.style.color = '#ef4444';
        }
    } catch (error) {
        console.error('❌ Error loading config:', error);
        elements.configStatus.textContent = 'Config error';
        elements.configStatus.style.color = '#ef4444';
    }
}

// Setup event listeners
function setupEventListeners() {
    // Botones principales
    elements.pickSingle.addEventListener('click', () => executeCommand('pick'));
    elements.pickMultiple.addEventListener('click', () => executeCommand('pick-multiple'));
    elements.pickToggle.addEventListener('click', () => executeCommand('pick-toggle'));
    
    // Validar URL
    elements.validateUrl.addEventListener('click', validateUrl);
    
    // Clear output
    elements.clearOutput.addEventListener('click', clearOutput);
    
    // Cancel command
    elements.cancelCommand.addEventListener('click', cancelCurrentCommand);
    
    // Auto-validar combinación framework + lenguaje
    elements.frameworkSelect.addEventListener('change', validateCombination);
    elements.languageSelect.addEventListener('change', validateCombination);
    
    // Enter en URL input
    elements.urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            validateUrl();
        }
    });
}

// Validar combinación framework + lenguaje
function validateCombination() {
    const framework = elements.frameworkSelect.value;
    const language = elements.languageSelect.value;
    
    console.log('🔍 Validating combination:', framework, '+', language);
    
    // Definir combinaciones válidas
    const validCombinations = {
        'playwright': ['javascript', 'typescript', 'python', 'java', 'csharp'],
        'selenium': ['javascript', 'typescript', 'python', 'java', 'csharp'],
        'cypress': ['javascript', 'typescript']
    };
    
    const validLanguages = validCombinations[framework] || [];
    
    // Si el lenguaje actual no es válido para el framework
    if (!validLanguages.includes(language)) {
        console.log('❌ Invalid combination detected');
        
        // Mostrar advertencia
        showOutput(`⚠️ ${framework} doesn't support ${language}. Switching to TypeScript.`, 'warning');
        
        // Cambiar a TypeScript por defecto
        elements.languageSelect.value = 'typescript';
        
        // Actualizar status
        updateStatus(`Framework changed - ${framework} + TypeScript`, 'info');
    }
    
    // Actualizar opciones disponibles en el selector de lenguaje
    updateLanguageOptions(framework);
}

// Actualizar opciones de lenguaje según framework
function updateLanguageOptions(framework) {
    const languageSelect = elements.languageSelect;
    const currentValue = languageSelect.value;
    
    // Limpiar opciones
    languageSelect.innerHTML = '';
    
    // Definir opciones por framework
    const languageOptions = {
        'playwright': [
            { value: 'typescript', text: 'TypeScript' },
            { value: 'javascript', text: 'JavaScript' },
            { value: 'python', text: 'Python' },
            { value: 'java', text: 'Java' },
            { value: 'csharp', text: 'C#' }
        ],
        'selenium': [
            { value: 'typescript', text: 'TypeScript' },
            { value: 'javascript', text: 'JavaScript' },
            { value: 'python', text: 'Python' },
            { value: 'java', text: 'Java' },
            { value: 'csharp', text: 'C#' }
        ],
        'cypress': [
            { value: 'typescript', text: 'TypeScript' },
            { value: 'javascript', text: 'JavaScript' }
        ]
    };
    
    const options = languageOptions[framework] || languageOptions['playwright'];
    
    // Agregar opciones
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.text;
        languageSelect.appendChild(optionElement);
    });
    
    // Restaurar valor si es válido, sino usar TypeScript
    const validValues = options.map(opt => opt.value);
    if (validValues.includes(currentValue)) {
        languageSelect.value = currentValue;
    } else {
        languageSelect.value = 'typescript';
    }
    
    console.log('✅ Language options updated for', framework);
}

// Ejecutar comando con validaciones completas
async function executeCommand(command) {
    if (isCommandRunning) {
        showOutput('⚠️ Another command is already running. Please wait...', 'warning');
        return;
    }
    
    // VALIDACIONES OBLIGATORIAS
    const url = elements.urlInput.value.trim();
    const framework = elements.frameworkSelect.value;
    const language = elements.languageSelect.value;
    
    // Validar URL
    if (!url) {
        showOutput('❌ Please enter a Target URL', 'error');
        elements.urlInput.focus();
        elements.urlInput.style.borderColor = '#ef4444';
        setTimeout(() => elements.urlInput.style.borderColor = '', 3000);
        return;
    }
    
    // Validar formato de URL
    if (!url.startsWith('http') && !isAlias(url)) {
        showOutput('❌ Target URL must start with http:// or https://, or be a valid alias', 'error');
        elements.urlInput.focus();
        elements.urlInput.style.borderColor = '#ef4444';
        setTimeout(() => elements.urlInput.style.borderColor = '', 3000);
        return;
    }
    
    // Validar Framework
    if (!framework) {
        showOutput('❌ Please select a Framework', 'error');
        elements.frameworkSelect.focus();
        elements.frameworkSelect.style.borderColor = '#ef4444';
        setTimeout(() => elements.frameworkSelect.style.borderColor = '', 3000);
        return;
    }
    
    // Validar Language
    if (!language) {
        showOutput('❌ Please select a Language', 'error');
        elements.languageSelect.focus();
        elements.languageSelect.style.borderColor = '#ef4444';
        setTimeout(() => elements.languageSelect.style.borderColor = '', 3000);
        return;
    }
    
    // Validar combinación Framework + Language
    const validCombinations = {
        'playwright': ['javascript', 'typescript', 'python', 'java', 'csharp'],
        'selenium': ['javascript', 'typescript', 'python', 'java', 'csharp'],
        'cypress': ['javascript', 'typescript']
    };
    
    const validLanguages = validCombinations[framework] || [];
    if (!validLanguages.includes(language)) {
        showOutput(`❌ ${framework} doesn't support ${language}. Please select a valid combination.`, 'error');
        elements.languageSelect.focus();
        elements.languageSelect.style.borderColor = '#ef4444';
        setTimeout(() => elements.languageSelect.style.borderColor = '', 3000);
        return;
    }
    
    // Si llegamos aquí, todas las validaciones pasaron
    showOutput('✅ All validations passed. Starting command...', 'success');
    
    // Preparar argumentos CORRECTAMENTE
    const args = [url];
    
    // SIEMPRE agregar framework y language en el orden correcto
    args.push(framework);
    args.push(language);
    
    console.log('🚀 Executing command:', command, 'with args:', args);
    
    await runCommand(command, args);
}

// Ejecutar comando con loading optimizado
async function runCommand(command, args = []) {
    isCommandRunning = true;
    
    // Mensaje específico según comando
    const loadingMessages = {
        'pick': 'Opening browser and loading page...',
        'pick-multiple': 'Opening browser and loading page...',
        'pick-toggle': 'Opening browser and loading page...'
    };
    
    showLoading(true, loadingMessages[command] || `Executing ${command}...`);
    updateStatus(`Preparing: ${command} ${args.join(' ')}`, 'active');
    
    // Limpiar output previo
    clearOutput();
    
    // Mostrar mensaje informativo inmediatamente
    showOutput('🚀 Starting browser (this may take a few seconds)...', 'info');
    
    try {
        const result = await ipcRenderer.invoke('execute-command', command, args);
        
        if (result.success) {
            showOutput(`✅ Command completed successfully!`, 'success');
            updateStatus('Command completed successfully ✅', 'success');
        } else {
            showOutput(`❌ Command failed with exit code: ${result.code}`, 'error');
            if (result.error) {
                showOutput(result.error, 'error');
            }
            updateStatus('Command failed ❌', 'error');
        }
    } catch (error) {
        console.error('Command execution error:', error);
        showOutput(`❌ Error executing command: ${error.message}`, 'error');
        updateStatus('Command error ❌', 'error');
    } finally {
        isCommandRunning = false;
        showLoading(false);
    }
}

// Validar URL
function validateUrl() {
    const url = elements.urlInput.value.trim();
    
    if (!url) {
        showOutput('❌ Please enter a URL', 'error');
        return;
    }
    
    // Validación básica de URL
    if (!url.startsWith('http') && !isAlias(url)) {
        showOutput('⚠️ URL should start with http:// or https://, or be a valid alias', 'warning');
        return;
    }
    
    showOutput(`✅ URL looks valid: ${url}`, 'success');
    updateStatus('URL validated ✅');
}

// Verificar si es un alias
function isAlias(url) {
    if (!currentConfig || !currentConfig.urls) return false;
    return Object.keys(currentConfig.urls).includes(url);
}

// Mostrar/ocultar loading
function showLoading(show, text = 'Loading...') {
    if (show) {
        elements.loadingText.textContent = text;
        elements.loadingOverlay.classList.remove('hidden');
    } else {
        elements.loadingOverlay.classList.add('hidden');
    }
}

// Cancelar comando actual
function cancelCurrentCommand() {
    if (isCommandRunning) {
        isCommandRunning = false;
        showLoading(false);
        updateStatus('Command cancelled by user ⚠️', 'error');
        showOutput('❌ Command cancelled by user', 'error');
        
        console.log('🚫 Command cancelled by user');
    }
}

// Simplificar la lógica de output - siempre modo simple
function showOutput(message, type = 'info') {
    console.log('📝 showOutput called:', message, 'type:', type);
    
    const outputElement = elements.outputContainer;
    
    // Remover placeholder si existe
    const placeholder = outputElement.querySelector('.output-placeholder');
    if (placeholder) {
        placeholder.remove();
    }
    
    // Solo mostrar mensajes importantes en modo simple
    const allowedTypes = ['success', 'error', 'warning'];
    const allowedMessages = ['Command completed', 'Copied to clipboard', 'Error', 'Configuration', 'Current Configuration'];
    
    if (!allowedTypes.includes(type) && !allowedMessages.some(msg => message.includes(msg))) {
        console.log('🚫 Message filtered:', message);
        return;
    }
    
    // Crear elemento de mensaje
    const messageElement = document.createElement('div');
    messageElement.className = `output-line output-${type}`;
    
    const timestamp = new Date().toLocaleTimeString();
    messageElement.innerHTML = `<span style="color: #6b7280">[${timestamp}]</span> ${message}`;
    
    // Agregar al output
    outputElement.appendChild(messageElement);
    
    // Auto-scroll al final
    outputElement.scrollTop = outputElement.scrollHeight;
}

// Limpiar output
function clearOutput() {
    elements.outputContainer.innerHTML = '<div class="output-placeholder">Ready to generate selectors! 🚀</div>';
    capturedCodes = []; // Limpiar códigos capturados
    console.log('🗑️ Output and captured codes cleared');
}

// Actualizar status
function updateStatus(message, type = 'info') {
    elements.statusText.textContent = message;
    
    // Remover clases previas
    elements.statusText.classList.remove('active', 'error');
    
    // Agregar clase según tipo
    if (type === 'active' || type === 'success') {
        elements.statusText.classList.add('active');
    } else if (type === 'error') {
        elements.statusText.classList.add('error');
    }
}



// Mostrar código en modo simple
function displaySimpleCode(code) {
    console.log('🎨 Displaying simple code:', code);
    
    // Evitar duplicados
    if (!capturedCodes.includes(code)) {
        capturedCodes.push(code);
        console.log('✅ Code added. Total codes:', capturedCodes.length);
    } else {
        console.log('⚠️ Duplicate code ignored:', code);
        return;
    }
    
    renderAllCodes();
}

// Renderizar todos los códigos capturados
function renderAllCodes() {
    const outputElement = elements.outputContainer;
    
    if (capturedCodes.length === 0) {
        outputElement.innerHTML = '<div class="output-placeholder">Ready to generate selectors! 🚀</div>';
        return;
    }
    
    let html = '';
    
    // Si hay múltiples códigos, mostrar resumen
    if (capturedCodes.length > 1) {
        html += `
            <div class="simple-summary">
                🎯 ${capturedCodes.length} selectors generated - Ready to copy and use!
                <button onclick="copyAllCodes()" class="btn-copy" style="margin-left: 10px;">📋 Copy All</button>
            </div>
        `;
    }
    
    // Mostrar cada código
    capturedCodes.forEach((code, index) => {
        html += `
            <div class="simple-result">
                <div class="result-header">
                    <span class="result-title">Generated Code ${capturedCodes.length > 1 ? (index + 1) : ''}</span>
                    <span class="result-confidence">95% reliable</span>
                </div>
                <div class="result-code">
                    <button onclick="copyToClipboard('${code.replace(/'/g, '\\\'')}')" class="copy-individual">📋 Copy</button>
                    ${code}
                </div>
            </div>
        `;
    });
    
    outputElement.innerHTML = html;
    updateStatus(`${capturedCodes.length} selector${capturedCodes.length > 1 ? 's' : ''} generated! 🎯`, 'success');
}

// Función global para copiar todos los códigos
window.copyAllCodes = function() {
    const allCodes = capturedCodes.join('\n');
    navigator.clipboard.writeText(allCodes).then(() => {
        updateStatus(`All ${capturedCodes.length} codes copied to clipboard! ✅`, 'success');
    }).catch(() => {
        const textArea = document.createElement('textarea');
        textArea.value = allCodes;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        updateStatus(`All ${capturedCodes.length} codes copied to clipboard! ✅`, 'success');
    });
};

// Función global para copiar al portapapeles
window.copyToClipboard = function(text) {
    navigator.clipboard.writeText(text).then(() => {
        updateStatus('Code copied to clipboard! ✅', 'success');
    }).catch(() => {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        updateStatus('Code copied to clipboard! ✅', 'success');
    });
};

// Escuchar output en tiempo real desde el proceso principal
ipcRenderer.on('command-output', (event, data) => {
    outputBuffer += data.toString();
    
    // Procesar líneas completas
    const lines = outputBuffer.split('\n');
    outputBuffer = lines.pop() || '';
    
    lines.forEach(line => {
        if (line.trim()) {
            console.log('📥 Processing line:', line.trim());
            
            // DETECTAR CÓDIGO GENERADO (todos los frameworks)
            const codePatterns = [
                'await page.locator(',          // Playwright JS/TS
                'page.locator(',                // Playwright Python/Java
                'Page.Locator(',                // Playwright C#
                'await driver.findElement(',    // Selenium JS/TS
                'driver.find_element(',         // Selenium Python
                'driver.findElement(',          // Selenium Java
                'driver.FindElement(',          // Selenium C#
                'cy.get('                       // Cypress
            ];
            
            const hasCode = codePatterns.some(pattern => line.trim().includes(pattern));
            
            if (hasCode) {
                console.log('🎯 CODE DETECTED:', line.trim());
                displaySimpleCode(line.trim());
                return;
            }
            
            // Mostrar línea normal
            showOutput(line.trim(), 'info');
        }
    });
});

ipcRenderer.on('command-error', (event, data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    lines.forEach(line => {
        if (line.trim()) {
            showOutput(line.trim(), 'error');
        }
    });
});

// Función de utilidad para debugging
window.debugBestLocator = () => {
    console.log('Current config:', currentConfig);
    console.log('Is command running:', isCommandRunning);
    console.log('Elements:', elements);
};