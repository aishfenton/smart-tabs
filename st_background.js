import { upsetTab, groupTabs } from './shared.js';

console.log("Loading SmartTab Extension")

async function init() {
    chrome.tabs.onCreated.addListener(async (tab) => {
        await upsetTab(tab.id);
        await groupTabs();
    });

    // Upsert all tabs 
    const tabs = await chrome.tabs.query({}); 
    for (const tab of tabs) {
        upsetTab(tab.id);
    }
    
    cleanUpStorage();
    groupTabs();
}

async function cleanUpStorage() {
    const allInStorage = chrome.storage.sync.get(null);
    for (const key in allInStorage) {
        const item = allInStorage[key];
        if (item.updatedOn < (Date.now() - oneDay)) {
            await chrome.storage.sync.remove(key);
        }
    }
}

init();
