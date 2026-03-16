// Theme management
const themeToggle = document.getElementById('theme-toggle');
const htmlElement = document.documentElement;

// Check for saved theme preference
const savedTheme = localStorage.getItem('theme') || 'light';
htmlElement.setAttribute('data-theme', savedTheme);

// Theme toggle handler
themeToggle.addEventListener('click', () => {
    const currentTheme = htmlElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    htmlElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
});

// InesBot Searcher Class
class InesBotSearcher {
    constructor() {
        this.words = [];
        // Using raw.githubusercontent.com for direct file access
        this.wordListUrl = 'https://raw.githubusercontent.com/inesbotv1/askari/refs/heads/main/lastletter.txt';
        
        // Check if all required elements exist
        this.checkRequiredElements();
        
        this.initEventListeners();
        // Auto-load words when the page loads
        setTimeout(() => {
            this.loadWordsFromURL();
        }, 100);
    }

    checkRequiredElements() {
        const requiredIds = [
            'results-box', 'word-count', 'result-count', 
            'prefix-input', 'suffix-input', 'search-btn', 'clear-btn'
        ];
        
        let missingElements = [];
        
        requiredIds.forEach(id => {
            if (!document.getElementById(id)) {
                missingElements.push(id);
                console.error(`❌ Required element with id "${id}" not found in HTML!`);
            }
        });
        
        if (missingElements.length > 0) {
            console.warn(`Missing elements: ${missingElements.join(', ')}. The app may not function correctly.`);
            
            // Show error in the results box if it exists, otherwise alert
            const resultsBox = document.getElementById('results-box');
            if (resultsBox) {
                resultsBox.innerHTML = `<div class="error-message">❌ Critical error: Missing HTML elements: ${missingElements.join(', ')}. Please check the console.</div>`;
            } else {
                alert(`Error: Missing required elements: ${missingElements.join(', ')}`);
            }
        } else {
            console.log('✅ All required elements found');
        }
    }

    initEventListeners() {
        // Safely add event listeners with null checks
        const searchBtn = document.getElementById('search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.performSearch());
        } else {
            console.error('Search button not found');
        }
        
        const clearBtn = document.getElementById('clear-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearSearch());
        } else {
            console.error('Clear button not found');
        }
        
        const prefixInput = document.getElementById('prefix-input');
        if (prefixInput) {
            prefixInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.performSearch();
            });
        } else {
            console.error('Prefix input not found');
        }
        
        const suffixInput = document.getElementById('suffix-input');
        if (suffixInput) {
            suffixInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.performSearch();
            });
        } else {
            console.error('Suffix input not found');
        }
    }

    async loadWordsFromURL() {
        console.log('📥 loadWordsFromURL started');
        console.log('Current words array length:', this.words.length);
        
        const resultsBox = document.getElementById('results-box');
        const wordCountElement = document.getElementById('word-count');
        const resultCountElement = document.getElementById('result-count');
        
        // Check if critical elements exist
        if (!resultsBox) {
            console.error('❌ results-box element not found! Cannot display loading message.');
            return;
        }
        
        // Show loading message
        resultsBox.innerHTML = '<div class="loading-message">⏳ Loading words from GitHub...</div>';
        
        try {
            console.log('Fetching from:', this.wordListUrl);
            
            // Add cache-busting parameter to avoid cached responses
            const urlWithCache = `${this.wordListUrl}?t=${Date.now()}`;
            
            const response = await fetch(urlWithCache, {
                method: 'GET',
                headers: {
                    'Accept': 'text/plain, text/plain;charset=utf-8',
                },
                mode: 'cors',
                credentials: 'omit'
            });
            
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`Failed to load: ${response.status} ${response.statusText}`);
            }
            
            const text = await response.text();
            console.log('Raw text length:', text.length);
            
            if (!text || text.length === 0) {
                throw new Error('Word list file is empty');
            }
            
            // Split by new lines and clean up - handle different line endings
            const words = text.split(/\r?\n/)
                .map(word => word.trim())
                .filter(word => word.length > 0);
            
            console.log('Words found:', words.length);
            console.log('First 5 words:', words.slice(0, 5));
            
            if (words.length === 0) {
                throw new Error('No words found in the file');
            }
            
            // Remove duplicates and sort
            this.words = [...new Set(words)];
            
            // Update word count if element exists
            if (wordCountElement) {
                wordCountElement.textContent = this.words.length;
                console.log('Updated word count to:', this.words.length);
            } else {
                console.error('word-count element not found');
            }
            
            // Update result count if element exists
            if (resultCountElement) {
                resultCountElement.textContent = '0';
            }
            
            // Show success message
            this.showSuccess(`✅ Successfully loaded ${this.words.length} words!`);
            
        } catch (error) {
            console.error('❌ Error loading words:', error);
            
            // Provide more specific error messages
            if (error.message.includes('Failed to fetch')) {
                this.showError('Network error: Cannot reach GitHub. Check your internet connection.');
            } else if (error.message.includes('404')) {
                this.showError('File not found on GitHub. Check if the URL is correct: <br>' + this.wordListUrl);
            } else {
                this.showError(`Failed to load words: ${error.message}`);
            }
            
            this.words = [];
            
            // Update word count if element exists
            if (wordCountElement) {
                wordCountElement.textContent = '0';
            }
        }
    }

    performSearch() {
        console.log('Performing search. Words loaded:', this.words.length);
        
        if (this.words.length === 0) {
            this.showError('No words loaded. Please refresh the page to try again.');
            return;
        }

        const prefixInput = document.getElementById('prefix-input');
        const suffixInput = document.getElementById('suffix-input');
        const sortRadios = document.querySelectorAll('input[name="sort"]');
        
        // Check if elements exist
        if (!prefixInput || !suffixInput) {
            console.error('Search inputs not found');
            this.showError('Error: Search inputs not found in HTML');
            return;
        }
        
        if (sortRadios.length === 0) {
            console.error('Sort radio buttons not found');
            this.showError('Error: Sort options not found in HTML');
            return;
        }
        
        const prefix = prefixInput.value.toLowerCase().trim();
        const suffix = suffixInput.value.toLowerCase().trim();
        
        // Find checked radio button
        let checkedRadio = null;
        for (let radio of sortRadios) {
            if (radio.checked) {
                checkedRadio = radio;
                break;
            }
        }
        
        const sortOption = checkedRadio ? checkedRadio.value : 'none';
        
        let criteria = [];
        if (prefix) criteria.push(`starts with '${prefix}'`);
        if (suffix) criteria.push(`ends with '${suffix}'`);
        
        // Filter words based ONLY on current filters
        let results = this.words.filter(word => {
            const wordLower = word.toLowerCase();
            
            if (prefix && !wordLower.startsWith(prefix)) return false;
            if (suffix && !wordLower.endsWith(suffix)) return false;
            
            return true;
        });
        
        // Sort results based on selected option
        if (sortOption === 'shortest') {
            results.sort((a, b) => a.length - b.length);
        } else if (sortOption === 'longest') {
            results.sort((a, b) => b.length - a.length);
        } else if (sortOption === 'alpha') {
            results.sort((a, b) => a.localeCompare(b));
        }
        // 'none' keeps original order (as loaded from file)
        
        // Update result count
        const resultCountElement = document.getElementById('result-count');
        if (resultCountElement) {
            resultCountElement.textContent = results.length;
        }
        
        // Display results with 1000 limit
        this.displayResults(results, criteria);
    }

    displayResults(results, criteria) {
        const resultsBox = document.getElementById('results-box');
        
        if (!resultsBox) {
            console.error('results-box element not found!');
            return;
        }
        
        const MAX_DISPLAY = 1000;
        
        if (results.length === 0) {
            let message = 'No words match your criteria';
            if (criteria.length > 0) {
                message += ` (${criteria.join(' and ')})`;
            }
            resultsBox.innerHTML = `<p class="placeholder-text">🔍 ${message}</p>`;
            return;
        }
        
        let html = '';
        const displayResults = results.slice(0, MAX_DISPLAY);
        
        // Add summary header
        if (criteria.length > 0) {
            html += `<div class="result-item" style="background: var(--highlight-bg); font-weight: bold; border-radius: 8px; margin-bottom: 10px; color: var(--text-primary);">
                Found ${results.length} words matching: ${criteria.join(' and ')}
            </div>`;
        } else {
            html += `<div class="result-item" style="background: var(--highlight-bg); font-weight: bold; border-radius: 8px; margin-bottom: 10px; color: var(--text-primary);">
                Showing first ${Math.min(MAX_DISPLAY, results.length)} of ${results.length} words
            </div>`;
        }
        
        displayResults.forEach((word, index) => {
            const prefix = document.getElementById('prefix-input')?.value.toLowerCase().trim() || '';
            const suffix = document.getElementById('suffix-input')?.value.toLowerCase().trim() || '';
            
            let matches = [];
            if (prefix && word.toLowerCase().startsWith(prefix)) {
                matches.push(`starts with '${prefix}'`);
            }
            if (suffix && word.toLowerCase().endsWith(suffix)) {
                matches.push(`ends with '${suffix}'`);
            }
            
            const matchInfo = matches.length > 0 ? `<span class="result-highlight"> (${matches.join(', ')})</span>` : '';
            
            html += `
                <div class="result-item">
                    <span class="result-number">${index + 1}.</span>
                    <span class="result-word">${word}</span>${matchInfo}
                    <span class="result-length">[${word.length}]</span>
                </div>
            `;
        });
        
        if (results.length > MAX_DISPLAY) {
            html += `
                <div class="result-item" style="color: var(--text-secondary); font-style: italic; background: var(--highlight-bg);">
                    ... and ${results.length - MAX_DISPLAY} more results (showing first ${MAX_DISPLAY} only)
                </div>
            `;
        }
        
        resultsBox.innerHTML = html;
    }

    showSuccess(message) {
        const resultsBox = document.getElementById('results-box');
        if (resultsBox) {
            resultsBox.innerHTML = `<div class="success-message">${message}</div>`;
            console.log('✅ Success:', message);
        } else {
            console.error('Cannot show success message - results-box not found');
        }
    }

    showError(message) {
        const resultsBox = document.getElementById('results-box');
        if (resultsBox) {
            resultsBox.innerHTML = `<div class="error-message">❌ ${message}</div>`;
            console.error('❌ Error displayed:', message);
        } else {
            console.error('Cannot show error message - results-box not found. Error:', message);
        }
    }

    showLoading(message) {
        const resultsBox = document.getElementById('results-box');
        if (resultsBox) {
            resultsBox.innerHTML = `<div class="loading-message">⏳ ${message}</div>`;
        }
    }

    clearSearch() {
        // Clear only the search results and input fields
        const resultsBox = document.getElementById('results-box');
        const prefixInput = document.getElementById('prefix-input');
        const suffixInput = document.getElementById('suffix-input');
        const sortRadios = document.querySelectorAll('input[name="sort"]');
        const resultCountElement = document.getElementById('result-count');
        
        if (resultsBox) {
            resultsBox.innerHTML = '<p class="placeholder-text">Enter search criteria and click Search...</p>';
        }
        
        if (prefixInput) prefixInput.value = '';
        if (suffixInput) suffixInput.value = '';
        
        // Uncheck all radios and check the 'none' option
        sortRadios.forEach(radio => {
            if (radio.value === 'none') {
                radio.checked = true;
            } else {
                radio.checked = false;
            }
        });
        
        if (resultCountElement) {
            resultCountElement.textContent = '0';
        }
        
        console.log('Search cleared');
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded, initializing InesBotSearcher...');
    new InesBotSearcher();
});
// Simple Dictionary Functionality
(function() {
    // Only run if InesBotSearcher exists
    if (typeof InesBotSearcher === 'undefined') {
        console.error('InesBotSearcher not found!');
        return;
    }

    console.log('📖 Initializing dictionary feature...');

    // Store the original displayResults method
    const originalDisplayResults = InesBotSearcher.prototype.displayResults;

    // Override the displayResults method
    InesBotSearcher.prototype.displayResults = function(results, criteria) {
        // Call the original method first
        originalDisplayResults.call(this, results, criteria);
        
        // Now make words clickable
        setTimeout(() => {
            makeWordsClickable();
        }, 50);
    };

    // Cache for definitions
    const definitionCache = new Map();

    // Function to make words clickable
    function makeWordsClickable() {
        const resultWords = document.querySelectorAll('.result-word');
        console.log(`Found ${resultWords.length} words to make clickable`);
        
        resultWords.forEach((wordElement, index) => {
            // Remove any existing click listeners by cloning
            const newElement = wordElement.cloneNode(true);
            wordElement.parentNode.replaceChild(newElement, wordElement);
            
            // Add click handler to new element
            newElement.style.cursor = 'pointer';
            newElement.style.textDecoration = 'underline dotted';
            newElement.style.textDecorationColor = 'var(--accent-color, #4a90e2)';
            
            newElement.addEventListener('click', async (e) => {
                e.stopPropagation();
                const word = newElement.textContent;
                console.log(`Clicked word: ${word}`);
                await showDefinition(word, e.clientX, e.clientY);
            });
        });
    }

    // Function to show definition
    async function showDefinition(word, x, y) {
        // Remove any existing popup
        removeExistingPopup();

        // Show loading popup
        showLoadingPopup(word, x, y);

        try {
            // Check cache first
            if (definitionCache.has(word)) {
                console.log('Using cached definition');
                removeExistingPopup();
                showDefinitionPopup(word, definitionCache.get(word), x, y);
                return;
            }

            // Fetch from API
            console.log(`Fetching definition for: ${word}`);
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
            
            if (!response.ok) {
                throw new Error(response.status === 404 ? 'Word not found' : 'API error');
            }

            const data = await response.json();
            
            // Cache the result
            definitionCache.set(word, data);
            
            // Remove loading popup and show definition
            removeExistingPopup();
            showDefinitionPopup(word, data, x, y);
            
        } catch (error) {
            console.error('Error:', error);
            removeExistingPopup();
            showErrorPopup(word, error.message, x, y);
        }
    }

    function showLoadingPopup(word, x, y) {
        const popup = createPopup(x, y);
        popup.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 18px; margin-bottom: 10px;">⏳</div>
                <div>Loading definition for<br><strong>"${word}"</strong>...</div>
            </div>
        `;
        document.body.appendChild(popup);
    }

    function showDefinitionPopup(word, data, x, y) {
        const popup = createPopup(x, y);
        
        let html = `
            <h3 style="margin: 0 0 15px 0; color: var(--accent-color, #4a90e2); border-bottom: 2px solid var(--border-color, #ddd); padding-bottom: 8px;">
                ${word}
            </h3>
        `;

        // Add phonetic if available
        const phonetic = data[0]?.phonetic || data[0]?.phonetics?.find(p => p.text)?.text;
        if (phonetic) {
            html += `<div style="color: #666; font-family: monospace; margin-bottom: 15px;">${phonetic}</div>`;
        }

        // Add definitions
        data[0]?.meanings?.forEach(meaning => {
            meaning.definitions.slice(0, 2).forEach(def => {
                html += `
                    <div style="margin-bottom: 15px; padding: 10px; background: var(--highlight-bg, #f5f5f5); border-radius: 8px;">
                        <div style="font-weight: bold; color: var(--accent-color, #4a90e2); font-style: italic; margin-bottom: 5px;">
                            ${meaning.partOfSpeech}
                        </div>
                        <div style="margin-bottom: 5px;">• ${def.definition}</div>
                `;
                
                if (def.example) {
                    html += `<div style="color: #666; font-style: italic; padding-left: 15px; border-left: 3px solid var(--accent-color, #4a90e2); margin-top: 5px;">"${def.example}"</div>`;
                }
                
                html += `</div>`;
            });
        });

        popup.innerHTML = html;
        document.body.appendChild(popup);
    }

    function showErrorPopup(word, error, x, y) {
        const popup = createPopup(x, y);
        popup.innerHTML = `
            <h3 style="margin: 0 0 15px 0; color: #ff6b6b;">${word}</h3>
            <div style="text-align: center; padding: 10px;">
                ❌ ${error}<br>
                <small style="color: #666;">No dictionary definition found</small>
            </div>
        `;
        document.body.appendChild(popup);
    }

    function createPopup(x, y) {
        removeExistingPopup();

        const popup = document.createElement('div');
        popup.style.cssText = `
            position: fixed;
            background: var(--bg-primary, white);
            border: 2px solid var(--accent-color, #4a90e2);
            border-radius: 12px;
            padding: 20px;
            max-width: 350px;
            max-height: 400px;
            overflow-y: auto;
            box-shadow: 0 8px 25px rgba(0,0,0,0.2);
            z-index: 10000;
            font-size: 14px;
            left: ${Math.min(x, window.innerWidth - 370)}px;
            top: ${Math.min(y + 10, window.innerHeight - 420)}px;
            animation: fadeIn 0.2s ease;
        `;

        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            position: absolute;
            top: 5px;
            right: 10px;
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
            padding: 5px 10px;
        `;
        closeBtn.onclick = () => popup.remove();
        popup.appendChild(closeBtn);

        return popup;
    }

    function removeExistingPopup() {
        const existing = document.querySelector('div[style*="position: fixed"][style*="border-radius: 12px"]');
        if (existing) existing.remove();
    }

    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);

    // Add escape key handler
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            removeExistingPopup();
        }
    });

    console.log('✅ Dictionary feature ready! Words will be clickable after search.');
})();
