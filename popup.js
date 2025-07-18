// DOM要素への参照を取得
const statusText = document.getElementById('status');
const toggleLabel = document.getElementById('toggle-label');
const recordSection = document.getElementById('manual-record-section');
const recordButton = document.getElementById('record-button');
const slider = document.querySelector('.slider');

// 保存された状態に基づいてUIを更新する関数
function updateUI(isBlockingEnabled) {
    if (isBlockingEnabled) {
        statusText.textContent = '現在、履歴は保存されません。';
        toggleLabel.textContent = '有効にする';
        statusText.classList.add('active');
        recordSection.classList.remove('hidden'); // 記録ボタンセクションを表示
        slider.classList.add('active');
    } else {
        statusText.textContent = '現在、履歴は保存されています。';
        toggleLabel.textContent = '無効にする';
        statusText.classList.remove('active');
        recordSection.classList.add('hidden'); // 記録ボタンセクションを非表示
        slider.classList.remove('active');
    }
}

// ポップアップが開かれたときに現在の状態を読み込む
let isBlockingEnabled = false;
document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.sync.get(['isBlockingEnabled'], (result) => {
        isBlockingEnabled = !!result.isBlockingEnabled;
        updateUI(isBlockingEnabled);
    });
    // トグルスライダーのクリックイベント
    slider.addEventListener('click', () => {
        isBlockingEnabled = !isBlockingEnabled;
        chrome.storage.sync.set({ isBlockingEnabled: isBlockingEnabled }, () => {
            updateUI(isBlockingEnabled);
            chrome.runtime.sendMessage({ action: "updateBlockingStatus", isBlockingEnabled: isBlockingEnabled });
        });
    });
});

// 記録ボタンのクリックを監視
if (recordButton) {
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
}
