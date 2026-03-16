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
// Dictionary Functionality using Free Dictionary API
class WordDictionary {
    constructor() {
        this.cache = new Map(); // Cache definitions to avoid repeated API calls
        this.initDictionaryStyles();
    }

    initDictionaryStyles() {
        // Add dictionary styles if they don't exist
        if (!document.getElementById('dictionary-styles')) {
            const style = document.createElement('style');
            style.id = 'dictionary-styles';
            style.textContent = `
                .definition-popup {
                    position: fixed;
                    background: var(--bg-primary);
                    border: 2px solid var(--accent-color);
                    border-radius: 12px;
                    padding: 20px;
                    max-width: 400px;
                    max-height: 500px;
                    overflow-y: auto;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.3);
                    z-index: 1000;
                    font-size: 14px;
                    animation: fadeIn 0.2s ease;
                }

                .definition-popup h3 {
                    margin: 0 0 15px 0;
                    color: var(--accent-color);
                    font-size: 20px;
                    border-bottom: 2px solid var(--border-color);
                    padding-bottom: 8px;
                }

                .definition-popup .word-info {
                    margin-bottom: 15px;
                }

                .definition-popup .phonetic {
                    color: var(--text-secondary);
                    font-family: monospace;
                    font-size: 16px;
                    margin-bottom: 10px;
                }

                .definition-popup .meaning-item {
                    margin-bottom: 15px;
                    padding: 10px;
                    background: var(--highlight-bg);
                    border-radius: 8px;
                }

                .definition-popup .part-of-speech {
                    font-weight: bold;
                    color: var(--accent-color);
                    font-style: italic;
                    margin-bottom: 5px;
                }

                .definition-popup .definition {
                    margin-bottom: 8px;
                    line-height: 1.5;
                }

                .definition-popup .example {
                    color: var(--text-secondary);
                    font-style: italic;
                    font-size: 13px;
                    padding-left: 15px;
                    border-left: 3px solid var(--accent-color);
                    margin-top: 5px;
                }

                .definition-popup .loading-def {
                    text-align: center;
                    padding: 30px;
                    color: var(--text-secondary);
                }

                .definition-popup .error-def {
                    color: #ff6b6b;
                    text-align: center;
                    padding: 20px;
                }

                .definition-popup .close-btn {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    font-size: 24px;
                    cursor: pointer;
                    padding: 5px 10px;
                    border-radius: 5px;
                    transition: all 0.2s;
                }

                .definition-popup .close-btn:hover {
                    background: var(--hover-bg);
                    color: var(--text-primary);
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .word-definition-link {
                    cursor: pointer;
                    border-bottom: 2px dotted var(--accent-color);
                    transition: all 0.2s;
                }

                .word-definition-link:hover {
                    background-color: var(--accent-color);
                    color: white !important;
                    border-bottom-color: transparent;
                }
            `;
            document.head.appendChild(style);
        }
    }

    async getDefinition(word) {
        // Check cache first
        if (this.cache.has(word)) {
            console.log(`📚 Cache hit for: ${word}`);
            return this.cache.get(word);
        }

        console.log(`🔍 Fetching definition for: ${word}`);
        
        try {
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Word not found in dictionary');
                }
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            
            // Process and format the definition data
            const formattedData = this.formatDefinitionData(data[0]);
            
            // Cache the result
            this.cache.set(word, formattedData);
            
            return formattedData;
        } catch (error) {
            console.error('Error fetching definition:', error);
            const errorResult = {
                word: word,
                error: error.message,
                phonetic: '',
                meanings: []
            };
            this.cache.set(word, errorResult);
            return errorResult;
        }
    }

    formatDefinitionData(data) {
        const result = {
            word: data.word,
            phonetic: data.phonetic || data.phonetics?.find(p => p.text)?.text || '',
            meanings: []
        };

        data.meanings.forEach(meaning => {
            meaning.definitions.slice(0, 3).forEach(def => { // Limit to 3 definitions per part of speech
                result.meanings.push({
                    partOfSpeech: meaning.partOfSpeech,
                    definition: def.definition,
                    example: def.example || null
                });
            });
        });

        return result;
    }

    createDefinitionPopup(word, definitionData, x, y) {
        // Remove any existing popup
        this.removeExistingPopup();

        const popup = document.createElement('div');
        popup.className = 'definition-popup';
        
        // Position popup near click, but keep it in viewport
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let left = x;
        let top = y;
        
        // Adjust if popup would go off screen
        if (left + 400 > viewportWidth) {
            left = viewportWidth - 420;
        }
        if (top + 500 > viewportHeight) {
            top = viewportHeight - 520;
        }
        
        popup.style.left = left + 'px';
        popup.style.top = top + 'px';

        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-btn';
        closeBtn.innerHTML = '×';
        closeBtn.onclick = () => this.removeExistingPopup();
        popup.appendChild(closeBtn);

        // Add content
        if (definitionData.error) {
            popup.innerHTML += `
                <h3>${word}</h3>
                <div class="error-def">
                    ❌ ${definitionData.error}<br>
                    <small>No dictionary definition found</small>
                </div>
            `;
        } else {
            let html = `<h3>${definitionData.word}</h3>`;
            
            if (definitionData.phonetic) {
                html += `<div class="phonetic">${definitionData.phonetic}</div>`;
            }

            definitionData.meanings.forEach(meaning => {
                html += `
                    <div class="meaning-item">
                        <div class="part-of-speech">${meaning.partOfSpeech}</div>
                        <div class="definition">• ${meaning.definition}</div>
                `;
                
                if (meaning.example) {
                    html += `<div class="example">"${meaning.example}"</div>`;
                }
                
                html += `</div>`;
            });

            popup.innerHTML += html;
        }

        // Close popup when clicking outside
        setTimeout(() => {
            document.addEventListener('click', function closePopup(e) {
                if (!popup.contains(e.target)) {
                    document.body.removeChild(popup);
                    document.removeEventListener('click', closePopup);
                }
            });
        }, 100);

        document.body.appendChild(popup);
    }

    removeExistingPopup() {
        const existingPopup = document.querySelector('.definition-popup');
        if (existingPopup) {
            existingPopup.remove();
        }
    }

    makeWordClickable(wordElement, word) {
        wordElement.classList.add('word-definition-link');
        wordElement.title = 'Click to get definition';
        
        wordElement.addEventListener('click', async (e) => {
            e.stopPropagation(); // Prevent event bubbling
            const rect = wordElement.getBoundingClientRect();
            
            // Show loading popup immediately
            const loadingPopup = document.createElement('div');
            loadingPopup.className = 'definition-popup';
            loadingPopup.style.left = rect.left + 'px';
            loadingPopup.style.top = (rect.bottom + 10) + 'px';
            loadingPopup.innerHTML = `
                <div class="loading-def">
                    ⏳ Loading definition for "${word}"...<br>
                    <small>Fetching from dictionary API</small>
                </div>
            `;
            
            this.removeExistingPopup();
            document.body.appendChild(loadingPopup);
            
            // Fetch definition
            const definitionData = await this.getDefinition(word);
            
            // Remove loading popup and show actual definition
            this.removeExistingPopup();
            this.createDefinitionPopup(word, definitionData, rect.left, rect.bottom + 10);
        });
    }
}

// Modify the displayResults method to make words clickable
// Find this function in your InesBotSearcher class and replace it, or add this enhancement:

// Store original displayResults
const originalDisplayResults = InesBotSearcher.prototype.displayResults;

// Override displayResults to add dictionary functionality
InesBotSearcher.prototype.displayResults = function(results, criteria) {
    // Call the original method first
    originalDisplayResults.call(this, results, criteria);
    
    // Initialize dictionary if not already done
    if (!this.dictionary) {
        this.dictionary = new WordDictionary();
    }
    
    // Add click handlers to all result words
    setTimeout(() => {
        const resultWords = document.querySelectorAll('.result-word');
        resultWords.forEach((wordElement, index) => {
            // Get the actual word text
            const word = wordElement.textContent;
            // Make it clickable for dictionary definitions
            this.dictionary.makeWordClickable(wordElement, word);
        });
        console.log(`📚 Added dictionary functionality to ${resultWords.length} words`);
    }, 100); // Small delay to ensure DOM is updated
};

// Optional: Add a keyboard shortcut to close popup (Escape key)
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const popup = document.querySelector('.definition-popup');
        if (popup) {
            popup.remove();
        }
    }
});

console.log('📖 Dictionary functionality loaded! Click on any word to see its definition.');
