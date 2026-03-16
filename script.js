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
// Multi-API Dictionary System - Tries multiple APIs until it finds a definition
(function() {
    if (typeof InesBotSearcher === 'undefined') {
        console.error('InesBotSearcher not found!');
        return;
    }

    console.log('📚 Initializing Multi-API Dictionary System...');

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

    // List of API endpoints to try (in order of preference)
    const API_ENDPOINTS = [
        {
            name: 'Free Dictionary API',
            url: (word) => `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
            parser: parseFreeDictionaryResponse,
            timeout: 5000
        },
        {
            name: 'OpenDictionaryAPI',
            url: (word) => `https://cdn.jsdelivr.net/gh/SH20RAJ/OpenDictionaryAPI/data/english/${encodeURIComponent(word)}.json`,
            parser: parseOpenDictionaryResponse,
            timeout: 5000
        },
        {
            name: 'Wiktionary API',
            url: (word) => `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`,
            parser: parseWiktionaryResponse,
            timeout: 5000
        },
        {
            name: 'WordsAPI (Fallback)',
            url: (word) => `https://wordsapiv1.p.rapidapi.com/words/${encodeURIComponent(word)}/definitions`,
            headers: {
                'X-RapidAPI-Key': 'f3a42a722fmsh5a0a3b6f5b8c7d6e5f4a3b2c1d0', // Free test key - rate limited
                'X-RapidAPI-Host': 'wordsapiv1.p.rapidapi.com'
            },
            parser: parseWordsAPIResponse,
            timeout: 5000
        }
    ];

    // Parser for Free Dictionary API
    function parseFreeDictionaryResponse(data) {
        if (!data || !data[0]) return null;
        
        const result = {
            word: data[0].word,
            phonetic: data[0].phonetic || data[0].phonetics?.find(p => p.text)?.text || '',
            meanings: []
        };

        data[0].meanings?.forEach(meaning => {
            meaning.definitions.slice(0, 2).forEach(def => {
                result.meanings.push({
                    partOfSpeech: meaning.partOfSpeech,
                    definition: def.definition,
                    example: def.example || null,
                    source: 'Free Dictionary API'
                });
            });
        });

        return result;
    }

    // Parser for OpenDictionaryAPI
    function parseOpenDictionaryResponse(data) {
        if (!data || data.error) return null;
        
        const result = {
            word: data.word || 'Unknown',
            phonetic: data.pronunciation || '',
            meanings: []
        };

        if (data.definitions && Array.isArray(data.definitions)) {
            data.definitions.slice(0, 4).forEach(def => {
                result.meanings.push({
                    partOfSpeech: def.partOfSpeech || 'definition',
                    definition: def.definition,
                    example: def.example || null,
                    source: 'OpenDictionaryAPI'
                });
            });
        }

        return result;
    }

    // Parser for Wiktionary API
    function parseWiktionaryResponse(data) {
        if (!data || !data.en) return null;
        
        const result = {
            word: Object.keys(data)[0] || 'Unknown',
            phonetic: '',
            meanings: []
        };

        if (data.en && Array.isArray(data.en)) {
            data.en.slice(0, 3).forEach(entry => {
                if (entry.definitions) {
                    entry.definitions.slice(0, 2).forEach(def => {
                        result.meanings.push({
                            partOfSpeech: entry.partOfSpeech || 'definition',
                            definition: def.definition,
                            example: def.examples?.[0] || null,
                            source: 'Wiktionary'
                        });
                    });
                }
            });
        }

        return result;
    }

    // Parser for WordsAPI
    function parseWordsAPIResponse(data) {
        if (!data || !data.definitions) return null;
        
        const result = {
            word: data.word || 'Unknown',
            phonetic: data.pronunciation?.all || '',
            meanings: []
        };

        if (data.definitions && Array.isArray(data.definitions)) {
            data.definitions.slice(0, 4).forEach(def => {
                result.meanings.push({
                    partOfSpeech: def.partOfSpeech || 'definition',
                    definition: def.definition,
                    example: def.example || null,
                    source: 'WordsAPI'
                });
            });
        }

        return result;
    }

    // Try multiple APIs until one works
    async function tryAPIs(word) {
        console.log(`🔍 Trying APIs for: "${word}"`);
        
        for (const api of API_ENDPOINTS) {
            try {
                console.log(`Trying ${api.name}...`);
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), api.timeout);
                
                const response = await fetch(api.url(word), {
                    signal: controller.signal,
                    headers: api.headers || {
                        'Accept': 'application/json'
                    }
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    console.log(`${api.name} failed with status: ${response.status}`);
                    continue;
                }
                
                const data = await response.json();
                const parsedData = api.parser(data);
                
                if (parsedData && parsedData.meanings.length > 0) {
                    console.log(`✅ Success with ${api.name}`);
                    return parsedData;
                }
                
            } catch (error) {
                console.log(`${api.name} error:`, error.message);
                continue;
            }
        }
        
        // If all APIs fail, return null
        console.log(`❌ All APIs failed for "${word}"`);
        return null;
    }

    // Function to make words clickable
    function makeWordsClickable() {
        const resultWords = document.querySelectorAll('.result-word');
        console.log(`Found ${resultWords.length} words to make clickable`);
        
        resultWords.forEach((wordElement) => {
            // Remove existing handlers
            const newElement = wordElement.cloneNode(true);
            wordElement.parentNode.replaceChild(newElement, wordElement);
            
            // Style it
            newElement.style.cursor = 'pointer';
            newElement.style.textDecoration = 'underline dotted';
            newElement.style.textDecorationColor = 'var(--accent-color, #4a90e2)';
            newElement.style.transition = 'all 0.2s';
            
            // Add hover effect
            newElement.addEventListener('mouseenter', () => {
                newElement.style.backgroundColor = 'var(--accent-color, #4a90e2)';
                newElement.style.color = 'white';
            });
            
            newElement.addEventListener('mouseleave', () => {
                newElement.style.backgroundColor = 'transparent';
                newElement.style.color = '';
            });
            
            // Add click handler
            newElement.addEventListener('click', async (e) => {
                e.stopPropagation();
                const word = newElement.textContent;
                await showDefinition(word, e.clientX, e.clientY);
            });
        });
    }

    // Show definition with API fallbacks
    async function showDefinition(word, x, y) {
        removeExistingPopup();
        showLoadingPopup(word, x, y);

        try {
            // Check cache first
            if (definitionCache.has(word)) {
                console.log('Using cached definition');
                removeExistingPopup();
                showDefinitionPopup(definitionCache.get(word), x, y);
                return;
            }

            // Try multiple APIs
            const definitionData = await tryAPIs(word);
            
            if (definitionData) {
                definitionCache.set(word, definitionData);
                removeExistingPopup();
                showDefinitionPopup(definitionData, x, y);
            } else {
                throw new Error('No definitions found in any API');
            }
            
        } catch (error) {
            console.error('Error:', error);
            removeExistingPopup();
            showErrorPopup(word, error.message, x, y);
        }
    }

    // UI Functions
    function showLoadingPopup(word, x, y) {
        const popup = createPopup(x, y);
        popup.innerHTML = `
            <div style="text-align: center; padding: 30px 20px;">
                <div style="font-size: 24px; margin-bottom: 15px; animation: spin 1s infinite;">🔄</div>
                <div style="font-size: 16px; margin-bottom: 10px;">Loading definition for</div>
                <div style="font-size: 20px; font-weight: bold; color: var(--accent-color, #4a90e2);">"${word}"</div>
                <div style="margin-top: 15px; font-size: 12px; color: #666;">Trying multiple dictionaries...</div>
            </div>
            <style>
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            </style>
        `;
        document.body.appendChild(popup);
    }

    function showDefinitionPopup(data, x, y) {
        const popup = createPopup(x, y);
        
        let html = `
            <div style="position: sticky; top: 0; background: var(--bg-primary, white); padding-bottom: 10px; margin-bottom: 10px; border-bottom: 2px solid var(--accent-color, #4a90e2);">
                <h3 style="margin: 0; color: var(--accent-color, #4a90e2); font-size: 24px;">${data.word}</h3>
        `;
        
        if (data.phonetic) {
            html += `<div style="color: #666; font-family: monospace; margin-top: 5px;">${data.phonetic}</div>`;
        }
        
        html += `</div>`;

        // Group by source
        const sources = {};
        data.meanings.forEach(meaning => {
            if (!sources[meaning.source]) {
                sources[meaning.source] = [];
            }
            sources[meaning.source].push(meaning);
        });

        // Display meanings grouped by source
        Object.keys(sources).forEach(source => {
            html += `<div style="margin-top: 15px;">`;
            html += `<div style="font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">📖 ${source}</div>`;
            
            sources[source].forEach(meaning => {
                html += `
                    <div style="margin-bottom: 15px; padding: 12px; background: var(--highlight-bg, #f5f5f5); border-radius: 8px; border-left: 3px solid var(--accent-color, #4a90e2);">
                        <div style="font-weight: bold; color: var(--accent-color, #4a90e2); font-style: italic; margin-bottom: 5px; font-size: 13px;">
                            ${meaning.partOfSpeech}
                        </div>
                        <div style="margin-bottom: 5px; line-height: 1.5;">${meaning.definition}</div>
                `;
                
                if (meaning.example) {
                    html += `<div style="color: #666; font-style: italic; padding-left: 15px; border-left: 2px solid var(--accent-color, #4a90e2); margin-top: 8px; font-size: 13px;">"${meaning.example}"</div>`;
                }
                
                html += `</div>`;
            });
            
            html += `</div>`;
        });

        popup.innerHTML += html;
        document.body.appendChild(popup);
    }

    function showErrorPopup(word, error, x, y) {
        const popup = createPopup(x, y);
        popup.innerHTML = `
            <div style="text-align: center; padding: 30px 20px;">
                <div style="font-size: 48px; margin-bottom: 20px;">😕</div>
                <h3 style="margin: 0 0 10px 0; color: #ff6b6b;">"${word}"</h3>
                <div style="color: #666; margin-bottom: 15px;">No definitions found</div>
                <div style="font-size: 12px; color: #999; padding: 10px; background: var(--highlight-bg, #f5f5f5); border-radius: 5px;">
                    Tried: Free Dictionary, OpenDictionary, Wiktionary, WordsAPI
                </div>
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
            border-radius: 16px;
            padding: 20px;
            max-width: 400px;
            max-height: 500px;
            overflow-y: auto;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            z-index: 10000;
            font-size: 14px;
            line-height: 1.5;
            left: ${Math.min(x, window.innerWidth - 420)}px;
            top: ${Math.min(y + 10, window.innerHeight - 520)}px;
            animation: slideIn 0.2s ease;
        `;

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            position: absolute;
            top: 10px;
            right: 15px;
            background: none;
            border: none;
            font-size: 28px;
            cursor: pointer;
            color: #999;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.2s;
            z-index: 10001;
        `;
        closeBtn.onmouseenter = () => {
            closeBtn.style.backgroundColor = 'var(--hover-bg, #f0f0f0)';
            closeBtn.style.color = 'var(--text-primary, #333)';
        };
        closeBtn.onmouseleave = () => {
            closeBtn.style.backgroundColor = 'transparent';
            closeBtn.style.color = '#999';
        };
        closeBtn.onclick = () => popup.remove();
        popup.appendChild(closeBtn);

        return popup;
    }

    function removeExistingPopup() {
        const existing = document.querySelector('div[style*="position: fixed"][style*="border-radius: 16px"]');
        if (existing) existing.remove();
    }

    // Add animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .result-word {
            transition: all 0.2s ease !important;
        }
        
        .result-word:hover {
            transform: scale(1.02);
        }
    `;
    document.head.appendChild(style);

    // Escape key handler
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            removeExistingPopup();
        }
    });

    console.log('✅ Multi-API Dictionary System Ready!');
    console.log('📚 Will try: Free Dictionary → OpenDictionary → Wiktionary → WordsAPI');
})();
