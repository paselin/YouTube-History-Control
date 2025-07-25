// YouTube動画ページでダイアログを表示するcontent script
(function() {
  // YouTube動画ページか判定
  function isWatchPage() {
    return location.pathname.startsWith('/watch');
  }

  // 動画プレイヤー要素取得
  function getPlayerElement() {
    return document.querySelector('#player') || document.querySelector('.html5-video-player');
  }

  // ダイアログ表示済みフラグ（localStorageで管理）
  function isDialogShownForCurrentVideo() {
    const videoId = new URLSearchParams(location.search).get('v');
    return localStorage.getItem('yt-history-dialog-' + videoId) === 'shown';
  }
  function setDialogShownForCurrentVideo() {
    const videoId = new URLSearchParams(location.search).get('v');
    localStorage.setItem('yt-history-dialog-' + videoId, 'shown');
  }

  // 動画一時停止・再開
  function pauseVideo() {
    const video = document.querySelector('video');
    if (video && !video.paused) video.pause();
  }
  function playVideo() {
    const video = document.querySelector('video');
    if (video && video.paused) video.play();
  }

  let dialogFeatureEnabled = false;

  // ダイアログ機能のON/OFFをchrome.storage.syncから取得し、変更時も反映
  function updateDialogFeatureEnabled() {
    chrome.storage.sync.get(['dialogFeatureEnabled'], (result) => {
      dialogFeatureEnabled = !!result.dialogFeatureEnabled;
    });
  }
  updateDialogFeatureEnabled();
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.dialogFeatureEnabled) {
      dialogFeatureEnabled = !!changes.dialogFeatureEnabled.newValue;
    }
  });

  // ダイアログ生成
  function showDialog() {
    if (!dialogFeatureEnabled) return; // OFFなら表示しない
    const player = getPlayerElement();
    if (!player) return;
    if (document.getElementById('yt-history-dialog')) return;
    if (isDialogShownForCurrentVideo()) return;

    // ダイアログのHTML生成
    const dialog = document.createElement('div');
    dialog.id = 'yt-history-dialog';
    dialog.style.position = 'absolute';
    dialog.style.top = '0';
    dialog.style.left = '0';
    dialog.style.width = '100%';
    dialog.style.height = '100%';
    dialog.style.background = 'rgba(15,23,42,0.6)';
    dialog.style.zIndex = '9999';
    dialog.style.display = 'flex';
    dialog.style.alignItems = 'center';
    dialog.style.justifyContent = 'center';

    dialog.innerHTML = `
      <div style="background:#1e293b;padding:2rem 2.5rem;border-radius:1rem;box-shadow:0 2px 16px #0008;text-align:center;max-width:90vw;">
        <div style="font-size:1.1rem;font-weight:700;color:#e2e8f0;margin-bottom:1rem;">この動画を履歴に残しますか？</div>
        <div style="display:flex;gap:1.5rem;justify-content:center;">
          <button id="yt-history-yes" style="background:#2563eb;color:#fff;font-weight:700;padding:0.5rem 1.5rem;border-radius:0.5rem;border:none;cursor:pointer;">はい</button>
          <button id="yt-history-no" style="background:#64748b;color:#fff;font-weight:700;padding:0.5rem 1.5rem;border-radius:0.5rem;border:none;cursor:pointer;">いいえ</button>
        </div>
      </div>
    `;
    player.style.position = 'relative';
    player.appendChild(dialog);
    pauseVideo();

    document.getElementById('yt-history-yes').onclick = function() {
      setDialogShownForCurrentVideo();
      chrome.runtime.sendMessage({ action: 'recordCurrentVideo' }, () => {
        playVideo();
        dialog.remove();
      });
    };
    document.getElementById('yt-history-no').onclick = function() {
      setDialogShownForCurrentVideo();
      playVideo();
      dialog.remove();
    };
  }

  // 動画ページ遷移検知（SPF/History API対応）
  function observePageChange() {
    let lastVideoId = null;
    function check() {
      if (!isWatchPage()) return;
      const videoId = new URLSearchParams(location.search).get('v');
      if (videoId && videoId !== lastVideoId) {
        lastVideoId = videoId;
        setTimeout(showDialog, 800); // プレイヤー描画待ち
      }
    }
    // URL変更検知
    let oldHref = location.href;
    setInterval(() => {
      if (location.href !== oldHref) {
        oldHref = location.href;
        check();
      }
    }, 500);
    // 初回
    check();
  }

  observePageChange();
})();
