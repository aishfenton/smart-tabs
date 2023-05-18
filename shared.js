
const oneDay = 1000 * 60;
// const oneDay = 1000 * 60 * 60 * 24; 

async function groupTabs() {
    const data = await tabData();
    const tabDataWithDays = data.map((tab) => {
        return {
            ...tab,
            daysSinceNow: toDays(Date.now() - tab.createdOn),
        };
    });

    await makeGroup(tabDataWithDays.filter((tab) => tab.daysSinceNow === 0), "Today", "green")
    await makeGroup(tabDataWithDays.filter((tab) => tab.daysSinceNow > 0 && tab.daysSinceNow <= 7), "This Week", "blue")
    await makeGroup(tabDataWithDays.filter((tab) => tab.daysSinceNow > 7), "Older", "grey")
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

async function tabData() {
    const tabs = await chrome.tabs.query({
        currentWindow: true,
    });
    const tabData = await Promise.all(tabs.map(async (tab) => {
        const td = await getTab(tab.id);
        const createdOn = td.createdOn;
        return {
            id: tab.id,
            windowId: tab.windowId,
            title: tab.title,
            createdOn: createdOn
        }
    }))

    return tabData;
}

async function upsetTab(tabId) {
    const tabEntry = await getTab(tabId);
    if (tabEntry == null) {
        setTab(tabId, Date.now(), Date.now());
    } else {
        setTab(tabId, tabEntry.createdOn, Date.now());
    }
}

async function setTab(tabId, createdOn, updatedOn) {
    await chrome.storage.sync.set({
        [tabId]: {
            createdOn: createdOn,
            updatedOn: updatedOn
        }
    });
}

async function getTab(tabId) {
    const key = tabId.toString();
    const item = await chrome.storage.sync.get(key);
    return item?.[key];
}

function toDays(milliseconds) {
    return Math.floor(milliseconds / oneDay);
}

export { groupTabs, upsetTab }