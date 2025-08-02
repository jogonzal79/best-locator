// Archivo: src/mobile-ui/inspector.js

class MobileInspectorUI {
    constructor() {
        this.selectedElements = [];
        this.currentElements = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.refreshInspection();
    }

    bindEvents() {
        document.getElementById('refresh-btn').addEventListener('click', () => this.refreshInspection());
        document.getElementById('clear-btn').addEventListener('click', () => this.clearSelection());
        document.getElementById('generate-btn').addEventListener('click', () => this.generateSelectors());
    }

    async refreshInspection() {
        try {
            const response = await fetch('/api/inspect');
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            
            this.currentElements = data.elements;
            this.displayScreenshot(data.screenshot);
        } catch (error) {
            console.error('Failed to refresh inspection:', error);
            alert(`Error refreshing inspection: ${error.message}`);
        }
    }

    displayScreenshot(screenshotBase64) {
        const img = document.getElementById('screenshot');
        img.src = screenshotBase64;
        img.onload = () => {
            this.displayElements(this.currentElements);
        };
    }

    displayElements(elements) {
        const overlayContainer = document.getElementById('elements-overlay');
        overlayContainer.innerHTML = ""; 

        if (!elements || elements.length === 0) {
            return;
        }

        elements.forEach((element, index) => {
            const elementDiv = document.createElement('div');
            elementDiv.className = 'element-overlay';
            elementDiv.dataset.index = index;

            elementDiv.addEventListener('click', () => {
                this.selectElement(element, elementDiv);
            });
            overlayContainer.appendChild(elementDiv);
        });
        this.updateElementOverlays();
    }

    updateElementOverlays() {
        const img = document.getElementById('screenshot');
        const overlayContainer = document.getElementById('elements-overlay');
        const elementDivs = overlayContainer.querySelectorAll('.element-overlay');
        
        const imgRect = img.getBoundingClientRect();
        const containerRect = img.parentElement.getBoundingClientRect();

        overlayContainer.style.top = `${imgRect.top - containerRect.top}px`;
        overlayContainer.style.left = `${imgRect.left - containerRect.left}px`;
        overlayContainer.style.width = `${imgRect.width}px`;
        overlayContainer.style.height = `${imgRect.height}px`;
        overlayContainer.style.pointerEvents = 'all';

        const scaleX = img.naturalWidth / imgRect.width;
        const scaleY = img.naturalHeight / imgRect.height;

        elementDivs.forEach(div => {
            const index = parseInt(div.dataset.index, 10);
            const element = this.currentElements[index];

            if (element && element.bounds) {
                div.style.left = `${element.bounds.x / scaleX}px`;
                div.style.top = `${element.bounds.y / scaleY}px`;
                div.style.width = `${element.bounds.width / scaleX}px`;
                div.style.height = `${element.bounds.height / scaleY}px`;
            }
        });
    }

    async selectElement(element, elementDiv) {
        if (elementDiv.classList.contains('selected')) return;

        elementDiv.classList.add('selected');
        this.selectedElements.push(element);

        await fetch('/api/select-element', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ element })
        });

        this.updateSelectedList();
        this.updateCounter();
    }

    updateSelectedList() {
        const list = document.getElementById('selected-list');
        list.innerHTML = "";
        this.selectedElements.forEach((element, index) => {
            const div = document.createElement('div');
            div.className = 'selected-element';
            div.innerHTML = `
                <strong>Element ${index + 1} (${element.tagName})</strong>
                <div class="element-info">
                    ${element.text ? `Text: "${element.text}"<br>` : ''}
                    ${element.accessibilityId ? `ID: ${element.accessibilityId}<br>` : ''}
                    ${element.resourceId ? `Resource ID: ${element.resourceId}<br>` : ''}
                </div>
            `;
            list.appendChild(div);
        });
    }

    updateCounter() {
        document.getElementById('counter').textContent = `Selected: ${this.selectedElements.length}`;
    }

    async clearSelection() {
        this.selectedElements = [];
        await fetch('/api/clear-selection', { method: 'POST' });
        document.querySelectorAll('.element-overlay.selected').forEach(el => el.classList.remove('selected'));
        this.updateSelectedList();
        this.updateCounter();
    }

    async generateSelectors() {
        if (this.selectedElements.length === 0) {
            alert('Please select at least one element.');
            return;
        }
        
        console.log('Sending selected elements to the backend for processing...');
        
        await fetch('/api/generate-selectors', { method: 'POST' });
        
        alert(`Selectors for ${this.selectedElements.length} elements have been printed to your terminal! The selection has been cleared for the next round.`);
        
        // Limpiamos la selección en el frontend
        this.selectedElements = [];
        this.updateSelectedList();
        this.updateCounter();
        document.querySelectorAll('.element-overlay.selected').forEach(el => {
            el.classList.remove('selected');
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MobileInspectorUI();
});