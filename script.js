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
// Simple Wiktionary Dictionary - Using your theme variables
(function() {
    if (typeof InesBotSearcher === 'undefined') {
        console.error('InesBotSearcher not found!');
        return;
    }

    console.log('📚 Initializing Dictionary...');

    // Store the original displayResults method
    const originalDisplayResults = InesBotSearcher.prototype.displayResults;

    // Override the displayResults method
    InesBotSearcher.prototype.displayResults = function(results, criteria) {
        originalDisplayResults.call(this, results, criteria);
        
        setTimeout(() => {
            makeWordsClickable();
        }, 50);
    };

    // Cache for definitions
    const definitionCache = new Map();

    // Wiktionary API
    async function fetchFromWiktionary(word) {
        try {
            const url = `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`;
            const response = await fetch(url, {
                headers: { 'Accept': 'application/json' }
            });
            
            if (!response.ok) throw new Error('Not found');
            const data = await response.json();
            return parseWiktionaryResponse(word, data);
        } catch (error) {
            return null;
        }
    }

    // Parse Wiktionary response
    function parseWiktionaryResponse(word, data) {
        if (!data || !data.en) return null;

        const result = {
            word: word,
            phonetic: '',
            meanings: []
        };

        data.en.forEach(entry => {
            if (entry.partOfSpeech && entry.definitions) {
                entry.definitions.slice(0, 2).forEach(def => {
                    let definition = def.definition
                        .replace(/\[.*?\]/g, '')
                        .replace(/\{.*?\}/g, '')
                        .trim();
                    
                    if (definition) {
                        result.meanings.push({
                            partOfSpeech: entry.partOfSpeech,
                            definition: definition,
                            example: def.examples ? def.examples[0] : null
                        });
                    }
                });
            }
        });

        return result.meanings.length > 0 ? result : null;
    }

    // Make words clickable
    function makeWordsClickable() {
        const resultWords = document.querySelectorAll('.result-word');
        
        resultWords.forEach((wordElement) => {
            // Remove existing handlers
            const newElement = wordElement.cloneNode(true);
            wordElement.parentNode.replaceChild(newElement, wordElement);
            
            // Style the word
            newElement.style.cursor = 'pointer';
            newElement.style.display = 'inline-block';
            newElement.style.padding = '0 2px';
            
            // Hover effect
            newElement.addEventListener('mouseenter', () => {
                newElement.style.backgroundColor = 'var(--highlight-bg)';
                newElement.style.borderRadius = '4px';
            });
            
            newElement.addEventListener('mouseleave', () => {
                newElement.style.backgroundColor = 'transparent';
            });
            
            // Click handler
            newElement.addEventListener('click', async (event) => {
                event.stopPropagation();
                event.preventDefault();
                
                const word = newElement.textContent;
                const rect = newElement.getBoundingClientRect();
                
                // Remove any existing popup
                removeExistingPopup();
                
                // Show loading
                showLoading(word, rect);
                
                // Fetch definition
                const definition = await fetchFromWiktionary(word);
                
                // Remove loading
                removeExistingPopup();
                
                if (definition) {
                    showDefinition(definition, rect);
                } else {
                    showNoDefinition(word, rect);
                }
            });
        });
    }

    // Loading indicator
    function showLoading(word, rect) {
        const popup = createPopup(rect);
        popup.innerHTML = `
            <div style="text-align: center; padding: 15px;">
                <div style="color: var(--text-primary);">🔍 Loading "${word}"</div>
            </div>
        `;
        document.body.appendChild(popup);
    }

    // Show definition
    function showDefinition(data, rect) {
        const popup = createPopup(rect);
        
        let html = `
            <div style="border-bottom: 1px solid var(--border-primary); padding-bottom: 8px; margin-bottom: 10px;">
                <div style="font-size: 18px; font-weight: 500; color: var(--text-primary);">${data.word}</div>
        `;
        
        if (data.phonetic) {
            html += `<div style="font-family: monospace; color: var(--text-secondary); font-size: 12px; margin-top: 2px;">/${data.phonetic}/</div>`;
        }
        
        html += `</div>`;

        data.meanings.forEach((meaning) => {
            html += `
                <div style="margin-bottom: 10px; padding: 8px; background: var(--highlight-bg); border-radius: 6px;">
                    <div style="font-weight: 600; color: var(--text-tertiary); margin-bottom: 3px; font-size: 11px; text-transform: uppercase;">
                        ${meaning.partOfSpeech}
                    </div>
                    <div style="color: var(--text-primary); line-height: 1.4; font-size: 13px;">
                        ${meaning.definition}
                    </div>
            `;
            
            if (meaning.example) {
                html += `
                    <div style="color: var(--text-secondary); font-style: italic; margin-top: 5px; font-size: 12px; border-left: 2px solid var(--border-secondary); padding-left: 8px;">
                        "${meaning.example}"
                    </div>
                `;
            }
            
            html += `</div>`;
        });

        popup.innerHTML += html;
        document.body.appendChild(popup);
    }

    // Show "no definition"
    function showNoDefinition(word, rect) {
        const popup = createPopup(rect);
        popup.innerHTML = `
            <div style="text-align: center; padding: 12px;">
                <div style="color: var(--text-primary); font-size: 14px; line-height: 1.5;">
                    It just works twin, don't worry about the definition
                </div>
            </div>
        `;
        document.body.appendChild(popup);
    }

    // Create popup - Positioned BELOW the word like the old code
    function createPopup(rect) {
        removeExistingPopup();

        const popup = document.createElement('div');
        
        // Position below the word (like the old code)
        const scrollY = window.scrollY;
        const scrollX = window.scrollX;
        
        let top = rect.bottom + scrollY + 5; // 5px below the word
        let left = rect.left + scrollX; // Align with left edge of word
        
        // Keep in viewport
        const popupWidth = 300;
        const popupHeight = 350;
        
        // Adjust horizontal position if off screen
        if (left + popupWidth > window.innerWidth) {
            left = window.innerWidth - popupWidth - 10;
        }
        
        // Adjust vertical position if off screen
        if (top + popupHeight > window.innerHeight + scrollY) {
            top = rect.top + scrollY - popupHeight - 5; // Show above instead
        }
        
        // Ensure left isn't negative
        if (left < 10) left = 10;

        popup.style.cssText = `
            position: absolute;
            background: var(--bg-secondary);
            border: 1px solid var(--border-primary);
            border-radius: 8px;
            padding: 15px;
            width: 300px;
            max-height: 350px;
            overflow-y: auto;
            box-shadow: 0 4px 12px var(--shadow-color);
            z-index: 10000;
            font-size: 13px;
            line-height: 1.5;
            top: ${top}px;
            left: ${left}px;
            color: var(--text-primary);
            transition: all 0.2s ease;
        `;

        return popup;
    }

    // Remove existing popup
    function removeExistingPopup() {
        const existing = document.querySelector('div[style*="position: absolute"][style*="border-radius: 8px"]');
        if (existing) existing.remove();
    }

    // Click outside to close
    document.addEventListener('click', function(e) {
        const popup = document.querySelector('div[style*="position: absolute"][style*="border-radius: 8px"]');
        const clickedWord = e.target.closest('.result-word');
        
        if (popup && !popup.contains(e.target) && !clickedWord) {
            popup.remove();
        }
    });

    // Escape key to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            removeExistingPopup();
        }
    });

    // Handle theme changes
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            // Just close any open popup - they can reopen it
            removeExistingPopup();
        });
    }

    console.log('✅ Dictionary Ready! Click any word.');
})();
