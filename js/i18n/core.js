// ===================================================
// i18n/core.js — Translation engine for BasketMate
// ===================================================

// Global translations object - populated by lang-*.js files
const TRANSLATIONS = {};

// Current language helper
function getCurrentLanguage() {
    return localStorage.getItem('bm_language') || 'en';
}

// Main translation function
function t(key, ...args) {
    const lang = getCurrentLanguage();
    const dict = TRANSLATIONS[lang] || TRANSLATIONS.en || {};

    let value = dict[key];

    // Fallback to English if key not found in current language
    if (value === undefined) {
        value = (TRANSLATIONS.en && TRANSLATIONS.en[key]) || key;
    }

    // Support for functions (e.g. pluralization in future)
    if (typeof value === 'function') {
        return value(...args);
    }

    return value || key;
}

// Apply translations to all elements with data-i18n attribute
function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (!key) return;

        const translatedText = t(key);

        // Different handling based on element type
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            if (element.placeholder !== undefined) {
                element.placeholder = translatedText;
            } else {
                element.value = translatedText;
            }
        } else if (element.tagName === 'BUTTON' || element.tagName === 'SPAN' ||
            element.tagName === 'DIV' || element.tagName === 'P' ||
            element.tagName === 'H1' || element.tagName === 'H2' ||
            element.tagName === 'LABEL') {
            element.textContent = translatedText;
        } else {
            element.textContent = translatedText;
        }
    });
}

// Change language and refresh UI
function setLanguage(langCode) {
    if (!LANGUAGES.some(lang => lang.code === langCode)) {
        console.warn(`Language ${langCode} not supported`);
        return false;
    }

    localStorage.setItem('bm_language', langCode);

    // Re-apply translations immediately
    applyTranslations();

    // Optional: Trigger custom event so other modules can react
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: langCode } }));

    console.log(`✅ Language changed to: ${langCode}`);
    return true;
}

// Available languages list
const LANGUAGES = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'pl', name: 'Polski', flag: '🇵🇱' },
    { code: 'ro', name: 'Română', flag: '🇷🇴' },
    { code: 'el', name: 'Ελληνικά', flag: '🇬🇷' },
    { code: 'ur', name: 'اردو', flag: '🇵🇰' },
    { code: 'pa', name: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
    { code: 'bn', name: 'বাংলা', flag: '🇧🇩' },
    { code: 'zh', name: '中文', flag: '🇨🇳' }
];

// Aisle name translations (for dynamic aisle rendering)
const AISLE_NAMES = {
    en: {},
    el: {
        'Bakery': 'Φούρνος',
        'Fresh Food': 'Φρέσκα τρόφιμα',
        'Frozen Food': 'Κατεψυγμένα',
        'Treats & Snacks': 'Γλυκά & Σνακ',
        'Food Cupboard': 'Αποθήκη τροφίμων',
        'Drinks': 'Ποτά',
        'Baby & Toddler': 'Βρέφη & Νήπια',
        'Health & Beauty': 'Υγεία & Ομορφιά',
        'Pets': 'Κατοικίδια',
        'Household': 'Οικιακά',
    },
    // Add more languages here as needed...
    pl: { /* your existing Polish translations */ },
    ro: { /* your existing Romanian translations */ },
    // ... etc
};

function translateAisleName(name) {
    const lang = getCurrentLanguage();
    if (lang === 'en') return name;

    const map = AISLE_NAMES[lang] || {};
    // Simple fuzzy matching for aisle names
    const clean = str => str.toLowerCase().replace(/[^a-zα-ωά-ώ0-9\s]/gi, '').trim();

    for (const [key, translated] of Object.entries(map)) {
        if (clean(key) === clean(name)) {
            return translated;
        }
    }
    return name; // fallback
}

// ==================== AUTO INITIALIZATION ====================

// Apply translations when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('i18n: Applying initial translations...');
    applyTranslations();
});

// Re-apply translations when language changes from anywhere
window.addEventListener('languageChanged', () => {
    applyTranslations();
});

// Also listen to storage changes (in case language is changed in another tab)
window.addEventListener('storage', (e) => {
    if (e.key === 'bm_language') {
        applyTranslations();
    }
});

// Expose useful functions to global scope so other files can use them
window.i18n = {
    t: t,
    setLanguage: setLanguage,
    applyTranslations: applyTranslations,
    translateAisleName: translateAisleName,
    LANGUAGES: LANGUAGES
};

console.log('✅ i18n/core.js loaded successfully');