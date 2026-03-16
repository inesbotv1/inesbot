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
// Simple Wiktionary Dictionary - Fixed version
(function() {
    if (typeof InesBotSearcher === 'undefined') {
        console.error('InesBotSearcher not found!');
        return;
    }

    console.log('📚 Initializing Wiktionary Dictionary...');

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

    // Clean color scheme - professional, easy on the eyes
    const COLORS = {
        primary: '#2c3e50',      // Dark blue-gray
        secondary: '#34495e',     // Slightly lighter blue-gray
        accent: '#3498db',        // Soft blue
        background: '#ffffff',     // White
        text: '#2c3e50',          // Dark text
        border: '#bdc3c7',        // Light gray border
        hover: '#ecf0f1'          // Light hover background
    };

    // Wiktionary API endpoint
    async function fetchFromWiktionary(word) {
        try {
            const url = `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`;
            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Wiktionary returned ${response.status}`);
            }
            
            const data = await response.json();
            return parseWiktionaryResponse(word, data);
            
        } catch (error) {
            console.error('Wiktionary fetch failed:', error);
            return null;
        }
    }

    // Parse Wiktionary response
    function parseWiktionaryResponse(word, data) {
        if (!data || !data.en || !Array.isArray(data.en)) {
            return null;
        }

        const result = {
            word: word,
            phonetic: '',
            meanings: []
        };

        // Process each part of speech
        data.en.forEach(entry => {
            if (entry.partOfSpeech && entry.definitions) {
                entry.definitions.slice(0, 3).forEach(def => {
                    // Clean up definition text (remove pronunciation guides in brackets)
                    let definition = def.definition
                        .replace(/\[.*?\]/g, '')  // Remove [something]
                        .replace(/\{.*?\}/g, '')   // Remove {something}
                        .trim();
                    
                    // Only add if definition exists after cleaning
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

        // Try to find phonetic pronunciation
        if (data.en[0] && data.en[0].pronunciations) {
            const pronunciation = data.en[0].pronunciations.find(p => p.ipa);
            if (pronunciation) {
                result.phonetic = pronunciation.ipa;
            }
        }

        return result.meanings.length > 0 ? result : null;
    }

    // Make words clickable - FIXED to only click on actual word text
    function makeWordsClickable() {
        const resultWords = document.querySelectorAll('.result-word');
        console.log(`Found ${resultWords.length} words to make clickable`);
        
        resultWords.forEach((wordElement) => {
            // Remove any existing click handlers
            const newElement = wordElement.cloneNode(true);
            wordElement.parentNode.replaceChild(newElement, wordElement);
            
            // Style the word
            newElement.style.cursor = 'pointer';
            newElement.style.borderBottom = `2px solid ${COLORS.accent}`;
            newElement.style.padding = '0 2px';
            newElement.style.transition = 'all 0.2s ease';
            newElement.style.display = 'inline-block'; // Better for click area
            newElement.style.width = 'auto'; // Only as wide as the text
            
            // Hover effect
            newElement.addEventListener('mouseenter', () => {
                newElement.style.backgroundColor = COLORS.hover;
                newElement.style.borderBottomColor = COLORS.primary;
            });
            
            newElement.addEventListener('mouseleave', () => {
                newElement.style.backgroundColor = 'transparent';
                newElement.style.borderBottomColor = COLORS.accent;
            });
            
            // Click handler - ONLY triggers when clicking the word itself
            newElement.addEventListener('click', async (event) => {
                event.stopPropagation(); // Prevent bubbling
                event.preventDefault();
                
                const word = newElement.textContent;
                const rect = newElement.getBoundingClientRect();
                
                // Position popup to the right of the word
                await showDefinition(word, rect);
            });
        });
    }

    // Show definition popup
    async function showDefinition(word, rect) {
        removeExistingPopup();

        // Show loading popup
        showLoadingPopup(word, rect);

        try {
            // Check cache
            if (definitionCache.has(word)) {
                removeExistingPopup();
                showDefinitionPopup(definitionCache.get(word), rect);
                return;
            }

            // Fetch from Wiktionary
            const definitionData = await fetchFromWiktionary(word);
            
            if (definitionData) {
                definitionCache.set(word, definitionData);
                removeExistingPopup();
                showDefinitionPopup(definitionData, rect);
            } else {
                throw new Error('No definition found');
            }
            
        } catch (error) {
            removeExistingPopup();
            showErrorPopup(word, rect);
        }
    }

    // Loading popup
    function showLoadingPopup(word, rect) {
        const popup = createPopup(rect);
        popup.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <div style="margin-bottom: 10px; color: ${COLORS.primary};">🔍 Looking up "${word}"</div>
                <div style="color: ${COLORS.secondary};">Loading from Wiktionary...</div>
            </div>
        `;
        document.body.appendChild(popup);
    }

    // Definition popup - FIXED styling
    function showDefinitionPopup(data, rect) {
        const popup = createPopup(rect);
        
        let html = `
            <div style="border-bottom: 2px solid ${COLORS.accent}; padding-bottom: 10px; margin-bottom: 15px;">
                <div style="font-size: 20px; font-weight: bold; color: ${COLORS.primary};">${data.word}</div>
        `;
        
        if (data.phonetic) {
            html += `<div style="font-family: monospace; color: ${COLORS.secondary}; margin-top: 5px;">/${data.phonetic}/</div>`;
        }
        
        html += `</div>`;

        // Add definitions
        data.meanings.forEach((meaning, index) => {
            html += `
                <div style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 6px; border-left: 3px solid ${COLORS.accent};">
                    <div style="font-weight: bold; color: ${COLORS.secondary}; margin-bottom: 5px; font-size: 13px; text-transform: uppercase;">
                        ${meaning.partOfSpeech}
                    </div>
                    <div style="color: ${COLORS.text}; line-height: 1.5; margin-bottom: 5px;">
                        ${meaning.definition}
                    </div>
            `;
            
            if (meaning.example) {
                html += `
                    <div style="color: ${COLORS.secondary}; font-style: italic; margin-top: 8px; padding-left: 10px; border-left: 2px solid ${COLORS.border}; font-size: 13px;">
                        "${meaning.example}"
                    </div>
                `;
            }
            
            html += `</div>`;
        });

        popup.innerHTML += html;
        document.body.appendChild(popup);
    }

    // Error popup - FIXED with the requested message
    function showErrorPopup(word, rect) {
        const popup = createPopup(rect);
        popup.innerHTML = `
            <div style="text-align: center; padding: 25px 20px;">
                <div style="font-size: 32px; margin-bottom: 15px;">✨</div>
                <div style="color: ${COLORS.primary}; font-size: 18px; font-weight: bold; margin-bottom: 10px;">"${word}"</div>
                <div style="color: ${COLORS.secondary}; font-size: 16px; margin-bottom: 15px; line-height: 1.5;">
                    It just works twin,<br>don't worry about the definition
                </div>
                <div style="font-size: 12px; color: #95a5a6; margin-top: 10px; padding-top: 10px; border-top: 1px solid ${COLORS.border};">
                    (even Wiktionary doesn't know everything)
                </div>
            </div>
        `;
        document.body.appendChild(popup);
    }

    // Create popup - FIXED positioning to the right of the word
    function createPopup(rect) {
        removeExistingPopup();

        const popup = document.createElement('div');
        
        // Calculate position - popup appears to the RIGHT of the word
        const scrollY = window.scrollY;
        const scrollX = window.scrollX;
        
        let top = rect.top + scrollY - 10; // Align with top of word, slight offset
        let left = rect.right + scrollX + 10; // 10px to the right of the word
        
        // Ensure popup stays within viewport
        const popupWidth = 350;
        const popupHeight = 400;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Adjust horizontal position if it goes off right edge
        if (left + popupWidth > viewportWidth) {
            left = rect.left + scrollX - popupWidth - 10; // Show to the left instead
        }
        
        // Adjust vertical position if popup would go off screen
        if (top + popupHeight > viewportHeight + scrollY) {
            top = viewportHeight + scrollY - popupHeight - 10;
        }
        
        // Ensure top isn't above viewport
        if (top < scrollY) {
            top = scrollY + 5;
        }

        popup.style.cssText = `
            position: absolute;
            background: ${COLORS.background};
            border: 1px solid ${COLORS.border};
            border-radius: 8px;
            padding: 15px;
            width: 350px;
            max-height: 400px;
            overflow-y: auto;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            z-index: 10000;
            font-size: 14px;
            line-height: 1.5;
            top: ${top}px;
            left: ${left}px;
            animation: fadeIn 0.2s ease;
        `;

        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            position: sticky;
            top: 0;
            float: right;
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: ${COLORS.secondary};
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            margin: -5px -5px 0 0;
            transition: all 0.2s;
            z-index: 10001;
        `;
        
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.backgroundColor = COLORS.hover;
            closeBtn.style.color = COLORS.primary;
        });
        
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.backgroundColor = 'transparent';
            closeBtn.style.color = COLORS.secondary;
        });
        
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            popup.remove();
        });
        
        popup.appendChild(closeBtn);

        return popup;
    }

    // Remove existing popup
    function removeExistingPopup() {
        const existing = document.querySelector('div[style*="position: absolute"][style*="border-radius: 8px"]');
        if (existing) existing.remove();
    }

    // Add animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateX(-5px); }
            to { opacity: 1; transform: translateX(0); }
        }
        
        .result-word {
            cursor: pointer !important;
            user-select: none;
            display: inline-block !important;
            max-width: fit-content !important;
        }
    `;
    document.head.appendChild(style);

    // Escape key to close popup
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            removeExistingPopup();
        }
    });

    // FIXED: Click outside to close popup - now works properly
    document.addEventListener('click', function closePopupOnClickOutside(e) {
        const popup = document.querySelector('div[style*="position: absolute"][style*="border-radius: 8px"]');
        const clickedWord = e.target.closest('.result-word');
        
        // If there's a popup and the click wasn't on the popup and wasn't on a word
        if (popup && !popup.contains(e.target) && !clickedWord) {
            popup.remove();
        }
    });

    console.log('✅ Wiktionary Dictionary Ready!');
    console.log('✨ Click any word to see its definition!');
})();
