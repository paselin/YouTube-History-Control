// Rules to block YouTube's history logging endpoints.
const RULES = [
  { id: 1, priority: 1, action: { type: 'block' }, condition: { urlFilter: '*://*.youtube.com/api/stats/watchtime*', resourceTypes: ['xmlhttprequest', 'sub_frame', 'main_frame'] }},
  { id: 2, priority: 1, action: { type: 'block' }, condition: { urlFilter: '*://*.youtube.com/api/stats/playback*', resourceTypes: ['xmlhttprequest', 'sub_frame', 'main_frame'] }}
];
const ALL_RULE_IDS = RULES.map(rule => rule.id);

/**
 * Enables or disables the network request blocking rules.
 * @param {boolean} isBlockingEnabled - True to enable blocking, false to disable.
 */
async function updateBlockingRules(isBlockingEnabled) {
  try {
    if (isBlockingEnabled) {
      await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: ALL_RULE_IDS, addRules: RULES });
      console.log('[YT History Control] History blocking rules enabled.');
    } else {
      await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: ALL_RULE_IDS });
      console.log('[YT History Control] History blocking rules disabled.');
    }
  } catch (error) {
    console.error('[YT History Control] Error updating rules:', error);
  }
}

// When the extension is first installed, set the initial rules.
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['isBlockingEnabled'], (result) => {
    updateBlockingRules(result.isBlockingEnabled || false);
  });
});

// Listen for messages from the popup script.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "updateBlockingStatus") {
    updateBlockingRules(message.isBlockingEnabled);
    return; // No response needed
  }
  
  if (message.action === "recordCurrentVideo") {
    (async () => {
      // Find the active YouTube tab.
      const tabs = await chrome.tabs.query({ active: true, url: "*://*.youtube.com/watch?v=*" });
      if (tabs.length === 0) {
        console.log("No active YouTube video tab found.");
        sendResponse({ status: "error", message: "No active YouTube tab." });
        return;
      }
      const tabId = tabs[0].id;

      console.log("Temporarily disabling blocking to record history...");
      // 1. Disable blocking rules.
      await updateBlockingRules(false);
      
      // 2. Reload the page to trigger history-saving requests.
      await chrome.tabs.reload(tabId);
      
      // 3. Wait a few seconds for the page to load and send requests.
      setTimeout(async () => {
        // 4. Re-enable blocking rules based on the user's saved setting.
        const result = await chrome.storage.sync.get(['isBlockingEnabled']);
        if (result.isBlockingEnabled) {
          console.log("Re-enabling blocking rules.");
          await updateBlockingRules(true);
        }
        sendResponse({ status: "complete" });
      }, 5000); // 5-second delay
    })();
    
    // Return true to indicate that the response will be sent asynchronously.
    return true;
  }
});
