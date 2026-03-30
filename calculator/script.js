import { saveGraph, getGraph, getAllGraphs, deleteGraph } from './db.js';

// Global calculator reference
let calculator;
let currentId = null;

// UI Elements
const saveBtn = document.getElementById('btn-save');
const nameInput = document.getElementById('graph-name-input');
const myGraphsBtn = document.getElementById('btn-my-graphs');
const modal = document.getElementById('graph-list-dialog');
const closeBtn = document.getElementById('btn-close-modal');
const listEl = document.getElementById('saved-graphs-list');
const eyeHurtyBtn = document.getElementById('btn-toggle-eye-hurty');
const helpBtn = document.getElementById('helpBtn');

async function initCalculator() {
    console.log('🚀 Initializing Besmos Calculator...');
    const elt = document.getElementById('calculator');

    if (!elt) {
        console.error('❌ Calculator container not found!');
        return;
    }

    if (!window.Desmos) {
        console.warn('⚠️ Desmos API not loaded! Waiting 1s and retrying...');
        setTimeout(initCalculator, 1000);
        return;
    }

    // Set height explicitly based on nav if CSS is being weird
    elt.style.height = (window.innerHeight - 50) + 'px';
    window.addEventListener('resize', () => {
        elt.style.height = (window.innerHeight - 50) + 'px';
        if (calculator) calculator.resize();
    });

    try {
        calculator = Desmos.GraphingCalculator(elt, {
            keypad: true,
            expressions: true,
            settingsMenu: true,
            expressionsTopbar: true,
            autosize: true
        });
        console.log('✅ Besmos Calculator ready!');

        // Finalize initial load if hash is present
        const hash = window.location.hash.substring(1);
        if (hash) {
            const g = await getGraph(hash);
            if (g) loadGraph(g);
        }
    } catch (err) {
        console.error('❌ Failed to create calculator:', err);
    }
}

document.addEventListener('DOMContentLoaded', initCalculator);

// Eye-Hurty Mode Toggle
if (eyeHurtyBtn) {
    // Load preference
    if (localStorage.getItem('clean-mode') === 'true') {
        document.documentElement.classList.add('clean-mode');
        eyeHurtyBtn.textContent = 'EYE-HURTY: OFF';
    }

    eyeHurtyBtn.addEventListener('click', () => {
        const isClean = document.documentElement.classList.toggle('clean-mode');
        eyeHurtyBtn.textContent = isClean ? 'EYE-HURTY: OFF' : 'EYE-HURTY: ON';
        localStorage.setItem('clean-mode', isClean);

        if (calculator) calculator.resize();
    });
}

// Help Button Logic
if (helpBtn) {
    helpBtn.addEventListener('click', () => {
        const query = prompt('WHAT DO YOU NEED HELP WITH? (ASK BERNARD)');
        if (query !== null && query.trim() !== '') {
            window.open('https://www.google.com/search?q=how+to+ ' + encodeURIComponent(query.trim()) + " desmos", '_blank');
        }
    });
}

// Save Functionality
if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
        if (!calculator) {
            showToast('CALCULATOR NOT READY !!');
            return;
        }

        const state = calculator.getState();
        let name = nameInput.value.trim() || 'UNTITLED MASTERPIECE';

        // Auto-generate ID if it's new
        if (!currentId) {
            currentId = Math.random().toString(36).substring(2, 12);
        }

        // Capture screenshot (async if v1.12)
        const thumbnail = await getScreenshot();

        const graphObj = {
            id: currentId,
            name: name,
            state: state,
            thumbnail: thumbnail,
            lastModified: Date.now()
        };

        await saveGraph(graphObj);
        showToast('SAVED !!!');

        // Update hash for "routing"
        window.location.hash = currentId;
    });
}

// My Graphs Modal Logic
if (myGraphsBtn) {
    myGraphsBtn.addEventListener('click', async () => {
        await renderGraphList();
        modal.showModal();
    });
}

if (closeBtn) {
    closeBtn.addEventListener('click', () => modal.close());
}

if (modal) {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.close();
    });
}

async function renderGraphList() {
    const graphs = await getAllGraphs();
    listEl.innerHTML = '';

    if (graphs.length === 0) {
        listEl.innerHTML = '<div class="empty-state">Nothing here yet... GO MAKE SOMETHING!!</div>';
        return;
    }

    // Sort by most recent
    graphs.sort((a, b) => b.lastModified - a.lastModified);

    graphs.forEach(g => {
        const card = document.createElement('div');
        card.className = 'graph-card';
        card.innerHTML = `
      <img src="${g.thumbnail || 'https://via.placeholder.com/300x225?text=BERNARD+APPROVES'}" alt="${g.name}">
      <div class="graph-card-title">${g.name}</div>
      <button class="besmos-btn delete-btn" style="margin-top: 5px; padding: 2px 5px; font-size: 10px; border-width: 1px; box-shadow: 2px 2px 0px black;">DELETE</button>
    `;

        card.addEventListener('click', async (e) => {
            if (e.target.classList.contains('delete-btn')) {
                e.stopPropagation();
                if (confirm(`REALLY DELETE "${g.name}" ?? Bernard will be sad.`)) {
                    await deleteGraph(g.id);
                    renderGraphList();
                    showToast('DELETED !!');
                }
                return;
            }
            loadGraph(g);
            modal.close();
        });

        listEl.appendChild(card);
    });
}

function loadGraph(g) {
    if (!calculator) return;
    calculator.setState(g.state);
    if (nameInput) nameInput.value = g.name;
    currentId = g.id;
    window.location.hash = g.id;
    showToast('LOADED !!');
}

// Screenshot Helper
async function getScreenshot() {
    return new Promise((resolve) => {
        if (!calculator) return resolve(null);

        try {
            // Using older screenshot method if v1.12 async isn't available or fails
            // v1.12 Desmos instances usually have .asyncScreenshot
            const method = calculator.asyncScreenshot || calculator.screenshot;

            method.call(calculator, { width: 300, height: 225, targetPixelRatio: 1 }, (data) => {
                resolve(data);
            });

            // Safety timeout
            setTimeout(() => resolve(null), 2000);
        } catch (err) {
            console.error('Screenshot failed:', err);
            resolve(null);
        }
    });
}

// Toast Helper
function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}
