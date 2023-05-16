
console.log("Loading SmartTab Extension")

async function init() {
    chrome.tabs.onCreated.addListener(async (tab) => {
        const timestamp = Date.now();
        setTab(tab.id, timestamp);
        groupTabs();
    });

    const allInStorage = chrome.storage.sync.get(null);
    const tabs = await allTabs()
    for (const tab of tabs) {
        const timestamp = Date.now();
        if (!(tab.id in allInStorage)) {
            setTab(tab.id, timestamp);
        }
    }
    groupTabs();
}

async function allTabs() {
    return chrome.tabs.query({});
}

function cleanOldStorage() {
    const nintyDaysAgo = Date.now() - 1000 * 60 * 60 * 24 * 90;
    const allInStorage = chrome.storage.sync.get(null);
    const oldEntries = Object
        .keys(allInStorage)
        .filter(k => allInStorage[k] < nintyDaysAgo)

    for (const entry of oldEntries) {
        chrome.storage.sync.remove(entry);
    }
}

function toDays(milliseconds) {
    return Math.floor(milliseconds / (1000 * 60 * 60 * 24));
}

async function groupTabs() {
    const sortedTabs = await sortTabs()

    const sinceNow = sortedTabs.map((tab) => {
        return {
            ...tab,
            daysSinceNow: toDays(Date.now() - tab.timestamp),
        };
    });

    await makeGroup(sinceNow.filter((tab) => tab.daysSinceNow === 0), "Today", "green")
    await makeGroup(sinceNow.filter((tab) => tab.daysSinceNow > 0 && tab.daysSinceNow <= 7), "This Week", "blue")
    await makeGroup(sinceNow.filter((tab) => tab.daysSinceNow > 7), "Older", "grey")
}

async function makeGroup(tabs, groupTitle, groupColor) {
    if (tabs.length > 0) {
        const groupId = await chrome.tabs.group({
            tabIds: tabs.map((tab) => tab.id),
        });

        chrome.tabGroups.update(groupId, {
            color: groupColor,
            title: groupTitle,
        });
    }
}

async function sortTabs() {
    const tabs = await chrome.tabs.query({
        lastFocusedWindow: true,
    });

    const tabData = await Promise.all(tabs.map(async (tab) => {
        const timestamp = await getTab(tab.id);
        return {
            id: tab.id,
            title: tab.title,
            timestamp: timestamp
        }
    }))

    const sortedTabs = tabData.sort((a, b) => {
        return b.daysSinceEpoch - a.daysSinceEpoch;
    });

    return sortedTabs;

    // sortedTabs.forEach((tab, index) => {
    //     chrome.tabs.move(tab.id, { index });
    // });
}

async function setTab(tabId, timestamp) {
    const key = tabId
    await chrome.storage.sync.set({ [key]: timestamp })
}

async function getTab(tabId) {
    const key = tabId.toString();
    const item = await chrome.storage.sync.get(key);
    return item[key];
}

init();
