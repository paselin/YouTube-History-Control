// DOM要素への参照を取得
const toggleSwitch = document.getElementById('toggle');
const statusText = document.getElementById('status');
const toggleLabel = document.getElementById('toggle-label');
const recordSection = document.getElementById('manual-record-section');
const recordButton = document.getElementById('record-button');

// 保存された状態に基づいてUIを更新する関数
function updateUI(isBlockingEnabled) {
    toggleSwitch.checked = isBlockingEnabled;
    if (isBlockingEnabled) {
        statusText.textContent = '現在、履歴は保存されません。';
        toggleLabel.textContent = '有効にする';
        statusText.classList.add('active');
        recordSection.classList.remove('hidden'); // 記録ボタンセクションを表示
    } else {
        statusText.textContent = '現在、履歴は保存されています。';
        toggleLabel.textContent = '無効にする';
        statusText.classList.remove('active');
        recordSection.classList.add('hidden'); // 記録ボタンセクションを非表示
    }
}

// ポップアップが開かれたときに現在の状態を読み込む
document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.sync.get(['isBlockingEnabled'], (result) => {
        updateUI(result.isBlockingEnabled);
    });
});

// トグルスイッチの変更を監視
toggleSwitch.addEventListener('change', () => {
    const isBlockingEnabled = toggleSwitch.checked;
    
    // 新しい状態を保存
    chrome.storage.sync.set({ isBlockingEnabled: isBlockingEnabled }, () => {
        console.log(`History blocking is now ${isBlockingEnabled ? 'enabled' : 'disabled'}.`);
        updateUI(isBlockingEnabled);
        chrome.runtime.sendMessage({ action: "updateBlockingStatus", isBlockingEnabled: isBlockingEnabled });
    });
});

// 記録ボタンのクリックを監視
recordButton.addEventListener('click', () => {
    recordButton.disabled = true;
    recordButton.textContent = '記録中...';

    // backgroundスクリプトに記録を指示
    chrome.runtime.sendMessage({ action: "recordCurrentVideo" }, (response) => {
        if (response && response.status === "complete") {
            // 処理完了後、少し待ってからボタンを元に戻す
            setTimeout(() => {
                recordButton.disabled = false;
                recordButton.textContent = 'この動画を履歴に記録';
            }, 1000);
        } else {
            // エラーの場合
            recordButton.textContent = 'エラーが発生しました';
        }
    });
});
