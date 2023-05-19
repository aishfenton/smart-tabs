import { groupTabs } from './shared.js';

const mergeBtn = document.querySelector('#mergeBtn');
mergeBtn.addEventListener('click', async () => { mergeTabs() });

async function mergeTabs() {
    const tabs = await chrome.tabs.query({
        "windowType": "normal"
    }); 
    const windowId = (await chrome.windows.getLastFocused({})).id

    for (const tab of tabs) {
        chrome.tabs.move(tab.id, { windowId: windowId, index: -1 })
    }

    await deDup();
    await groupTabs(); 
}

async function deDup() {
    const tabs = await chrome.tabs.query({}); 
    const seen = new Map();

    for (const tab of tabs) {
        if (seen.has(tab.url)) {
            const older = seen.get(tab.url);
            chrome.tabs.remove(older.id);
        }
        
        seen.set(tab.url, tab);
    }
}