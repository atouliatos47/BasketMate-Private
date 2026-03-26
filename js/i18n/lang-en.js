// ===================================================
// i18n/lang-en.js — English (Master / Source of Truth)
// ===================================================

TRANSLATIONS.en = {
    // App Basics
    "appName": "BasketMate",
    "tagline": "Your smart shopping companion",
    "byAtStudios": "by AtStudios",
    "version": "BasketMate v1.0",

    // Status & General
    "whereShoppingToday": "Where are you shopping today?",
    "liveStatus": "● Live",
    "connectingStatus": "○ Connecting",
    "listIsEmpty": "List is empty",
    "listIsEmptyMsg": "List is empty!",
    "noProducts": "No products",
    "noProductsYet": "No products yet",
    "noFavouritesYet": "No favourites yet!",
    "tapStarToSave": "Tap ⭐ on any product to save it as favourite.",
    "tapAisleToAdd": "Tap an aisle to add products",
    "tapAisleMsg": "Tap an aisle to add products.",

    // Navigation & Buttons
    "addStore": "Add Store",
    "myCode": "My Code",
    "myList": "My List",
    "favourites": "Favourites",
    "addProduct": "Add Product",
    "addAisle": "Add Aisle",
    "add": "+ Add",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "remove": "Remove",
    "next": "Next →",
    "letsGo": "Let's Go! 🛒",

    // Welcome / Onboarding Screen
    "welcomeToBasketMate": "Welcome to BasketMate",
    "welcomeSubtitle": "Create a household to get started, or join an existing one with a code.",
    "createNewHousehold": "Create New Household",
    "creating": "Creating...",
    "or": "or",
    "enterHouseholdCode": "Enter household code",
    "join": "Join",
    "yourHouseholdCode": "Your Household Code",
    "shareCode": "Share this with family to join your list.",
    "whatsYourName": "What's your name?",
    "nameSoFamily": "So your family knows who added items.",
    "namePlaceholder": "e.g. Andreas, Sharon...",

    // Settings
    "settingsTitle": "Settings",
    "myHouseholdCode": "My Household Code",
    "shareWithFamily": "Share with family to join your list",
    "changeMyName": "Change My Name",
    "yourNameOnSharedLists": "Your name on shared lists",
    "joinAHousehold": "Join a Household",
    "enterPartnerCode": "Enter a partner's code to share their list",
    "silentMode": "Silent Mode",
    "muteSounds": "Mute item ping sounds",
    "soundsMuted": "Sounds are muted",
    "language": "Language",
    "howToUse": "How to Use BasketMate",
    "tipsGuide": "Tips and features guide",
    "upgradeToFamily": "Upgrade to Family",
    "upgradeSub": "£2.99 one-time — unlimited everything",
    "trialActive": "Free Trial Active",
    "trialDaysLeft": (n) => `${n} day${n !== 1 ? 's' : ''} left — upgrade to keep full access`,
    "familyPlan": "BasketMate Family",
    "familyPlanSub": "You have full access — thank you!",

    // Store & Aisle Screen
    "aisles": "Aisles",
    "inList": "✓ In list",
    "shoppingList": "Shopping List",
    "allDone": "All done! Your list is empty.",
    "itemsInList": (n) => `${n} item${n > 1 ? 's' : ''} in list`,
    "collectedOf": (checked, total) => `${checked} of ${total} collected`,

    // Notifications / Feedback
    "addedToList": (name) => `${name} added! 🛒`,
    "removedFromList": (name) => `${name} removed ✓`,
    "addedToAisle": (name) => `${name} added to aisle ✓`,
    "savedAsFavourite": (name) => `${name} saved as favourite ⭐`,
    "removedFromFavourites": (name) => `${name} removed from favourites`,
    "storeAdded": (emoji, name) => `${emoji} ${name} added! ✓`,
    "storeDeleted": "Store deleted",
    "aisleAdded": (name) => `${name} added!`,
    "aisleDeleted": "Aisle deleted",
    "nameUpdated": (name) => `Name updated to ${name} ✓`,
    "silentOn": "Silent mode on",
    "silentOff": "Silent mode off",
    "joinedHousehold": "Joined household! 🏠",
    "switchedHousehold": "Switched household! 🏠",
    "cleared": "Cleared! ✓",

    // Modals & Forms
    "addNewStore": "Add New Store",
    "addNewStoreSubtitle": "Add a supermarket or shop",
    "storeName": "Store Name",
    "storeNamePlaceholder": "e.g. Tesco, Lidl, Aldi...",
    "emoji": "Emoji",
    "colour": "Colour",
    "deleteStoreConfirm": (name) => `Delete ${name}? All aisles and list data will be lost.`,

    "addNewAisle": "Add New Aisle",
    "aisleNamePlaceholder": "e.g. Bakery, Fresh Food...",
    "addProduct2": "Add Product",
    "addProductPlaceholder": "e.g. White Bread...",

    "removeItemConfirm": (name) => `Remove ${name} from your list?`
};