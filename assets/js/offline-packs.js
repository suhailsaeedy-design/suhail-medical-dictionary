(() => {
  'use strict';

  const MANIFEST_URL = './data/offline-packs.json';
  const prefix='smd-v21-phase21-pack-';

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  let manifest = null;
  let busy = false;

  function absoluteUrl(relativeUrl) {
    return new URL(relativeUrl, location.href).href;
  }

  function humanBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return '—';

    const units = ['B', 'KB', 'MB', 'GB'];
    let value = bytes;
    let index = 0;

    while (value >= 1024 && index < units.length - 1) {
      value /= 1024;
      index += 1;
    }

    return `${value.toFixed(index ? 1 : 0)} ${units[index]}`;
  }

  function toast(message) {
    const element = $('#offlineToast');
    if (!element) return;

    element.textContent = message;
    element.classList.remove('hidden');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => element.classList.add('hidden'), 2600);
  }

  async function ensureServiceWorkerReady() {
    if (!('serviceWorker' in navigator)) {
      throw new Error('This browser does not support the offline service worker.');
    }

    await navigator.serviceWorker.register('./sw.js');
    return navigator.serviceWorker.ready;
  }

  async function fetchManifest() {
    const response = await fetch(MANIFEST_URL, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Pack manifest HTTP ${response.status}`);
    }

    manifest = await response.json();
    return manifest;
  }

  function cacheName(id) {
    return `${prefix}${id}`;
  }

  async function cacheHas(cache, url) {
    const requestUrl = absoluteUrl(url);
    return Boolean(
      (await cache.match(requestUrl, { ignoreSearch: true })) ||
      (await cache.match(url, { ignoreSearch: true }))
    );
  }

  async function installed(id) {
    if (!('caches'in window) || !manifest) return false;

    const pack = manifest.packs.find((item) => item.id === id);
    if (!pack) return false;

    const cache = await caches.open(cacheName(id));

    for (const url of pack.urls) {
      if (!(await cacheHas(cache, url))) return false;
    }

    return true;
  }

  async function updateCard(id) {
    const card = document.querySelector(`[data-pack-id="${id}"]`);
    if (!card) return;

    const isInstalled = await installed(id);
    const badge = card.querySelector('.pack-badge');
    const downloadButton = card.querySelector('[data-pack-download]');
    const removeButton = card.querySelector('[data-pack-remove]');
    const progress = card.querySelector('.pack-progress span');

    badge.textContent = isInstalled ? 'Downloaded' : 'Not downloaded';
    badge.className = `pack-badge ${isInstalled ? 'installed' : 'missing'}`;

    if (downloadButton) {
      downloadButton.textContent = isInstalled ? 'Refresh pack' : 'Download pack';
    }

    if (removeButton) removeButton.disabled = !isInstalled;

    if (progress && !card.classList.contains('offline-card-busy')) {
      progress.style.width = isInstalled ? '100%' : '0%';
    }
  }

  async function downloadPackFiles(pack, onProgress = () => {}) {
    await caches.delete(cacheName(pack.id));
    const cache = await caches.open(cacheName(pack.id));

    try {
      for (let index = 0; index < pack.urls.length; index += 1) {
        const url = pack.urls[index];
        const requestUrl = absoluteUrl(url);
        const response = await fetch(requestUrl, { cache: 'reload' });

        if (!response.ok) {
          throw new Error(`${url} returned ${response.status}`);
        }

        await cache.put(requestUrl, response.clone());
        onProgress(Math.round(((index + 1) / pack.urls.length) * 100));
      }

      for (const url of pack.urls) {
        if (!(await cacheHas(cache, url))) {
          throw new Error(`Verification failed for ${url}`);
        }
      }
    } catch (error) {
      await caches.delete(cacheName(pack.id));
      throw error;
    }
  }

  async function installPack(id, options = {}) {
    const { quiet = false } = options;

    if (busy || !manifest) return false;

    const pack = manifest.packs.find((item) => item.id === id);
    if (!pack) return false;

    if (!navigator.onLine) {
      if (!quiet) toast('Connect to the internet to download this pack.');
      return false;
    }

    busy = true;
    const card = document.querySelector(`[data-pack-id="${id}"]`);
    const progress = card?.querySelector('.pack-progress span');
    card?.classList.add('offline-card-busy');

    try {
      await ensureServiceWorkerReady();
      await downloadPackFiles(pack, (percent) => {
        if (progress) progress.style.width = `${percent}%`;
      });

      if (!quiet) toast(`${pack.title} downloaded for offline use.`);
      return true;
    } catch (error) {
      if (!quiet) toast(`Pack download failed: ${error.message}`);
      return false;
    } finally {
      busy = false;
      card?.classList.remove('offline-card-busy');
      await updateCard(id);
      await refreshSummary();
      await updateStorage();
    }
  }

  async function removePack(id) {
    if (busy) return;

    await caches.delete(cacheName(id));
    toast('Offline pack removed.');
    await updateCard(id);
    await refreshSummary();
    await updateStorage();
  }

  async function requestPersistentStorage() {
    try {
      if (navigator.storage?.persist) {
        return await navigator.storage.persist();
      }
    } catch {
      // Persistent storage is optional; verified Cache Storage still works without it.
    }

    return false;
  }

  async function verifyAll() {
    if (!manifest) return false;

    for (const pack of manifest.packs) {
      if (!(await installed(pack.id))) return false;
    }

    return true;
  }

  async function installAll() {
    if (busy || !manifest) return;

    const status = $('#fullDownloadStatus');

    if (!navigator.onLine) {
      toast('Connect to the internet before Full Offline Download.');
      if (status) {
        status.textContent = 'Internet connection is required for the first full download.';
      }
      return;
    }

    try {
      await ensureServiceWorkerReady();

      if (status) status.textContent = 'Preparing offline storage…';
      const persisted = await requestPersistentStorage();

      for (let index = 0; index < manifest.packs.length; index += 1) {
        const pack = manifest.packs[index];

        if (status) {
          status.textContent =
            `Downloading ${index + 1}/${manifest.packs.length}: ${pack.title}…`;
        }

        const ok = await installPack(pack.id, { quiet: true });
        if (!ok) {
          throw new Error(`${pack.title} could not be downloaded or verified.`);
        }
      }

      const complete = await verifyAll();

      if (!complete) {
        throw new Error('One or more offline packs could not be verified.');
      }

      if (status) {
        status.textContent =
          `Full offline library verified and ready${persisted ? ' · persistent storage granted' : ''}.`;
      }

      toast('Full offline library is ready.');
    } catch (error) {
      if (status) {
        status.textContent =
          `Full Offline Download did not finish: ${error.message} Retry while online.`;
      }
      toast('Offline verification incomplete.');
    } finally {
      await refreshSummary();
      await updateStorage();
    }
  }

  async function removeAll() {
    if (busy || !manifest) return;

    busy = true;

    try {
      await Promise.all(
        manifest.packs.map((pack) => caches.delete(cacheName(pack.id))),
      );
      toast('Downloaded packs removed.');
    } finally {
      busy = false;

      for (const pack of manifest.packs) {
        await updateCard(pack.id);
      }

      await refreshSummary();
      await updateStorage();
    }
  }

  function render() {
    const grid = $('#packGrid');

    grid.innerHTML =
      `
        <article class="pack-card core">
          <div class="pack-head">
            <span class="pack-icon">◆</span>
            <div class="pack-title">
              <h3>${manifest.core.title}</h3>
              <p>${manifest.core.description}</p>
            </div>
            <span class="pack-badge installed">Always ready</span>
          </div>
          <div class="pack-meta">
            <span>${manifest.core.files} files</span>
            <span>${humanBytes(manifest.core.bytes)}</span>
          </div>
          <div class="pack-progress"><span style="width:100%"></span></div>
          <div class="pack-detail">
            The Service Worker keeps the app shell available so sign-in,
            settings and the Offline Packs manager can open without a network connection.
          </div>
        </article>
      ` +
      manifest.packs
        .map(
          (pack) => `
            <article class="pack-card" data-pack-id="${pack.id}">
              <div class="pack-head">
                <span class="pack-icon">${pack.icon}</span>
                <div class="pack-title">
                  <h3>${pack.title}</h3>
                  <p>${pack.description}</p>
                </div>
                <span class="pack-badge missing">Checking…</span>
              </div>
              <div class="pack-meta">
                <span>${pack.urls.length} files</span>
                <span>${humanBytes(pack.bytes)}</span>
              </div>
              <div class="pack-progress"><span></span></div>
              <div class="pack-detail">${pack.detail}</div>
              <div class="pack-actions">
                <button class="btn-ui btn-primary-ui" data-pack-download="${pack.id}">
                  Download pack
                </button>
                <button class="btn-ui" data-pack-remove="${pack.id}">Remove</button>
              </div>
            </article>
          `,
        )
        .join('');

    $$('[data-pack-download]').forEach((button) => {
      button.addEventListener('click', () => installPack(button.dataset.packDownload));
    });

    $$('[data-pack-remove]').forEach((button) => {
      button.addEventListener('click', () => removePack(button.dataset.packRemove));
    });
  }

  async function refreshSummary() {
    if (!manifest) return;

    let installedCount = 0;

    for (const pack of manifest.packs) {
      if (await installed(pack.id)) installedCount += 1;
    }

    $('#installedPackCount').textContent =
      `${installedCount}/${manifest.packs.length}`;

    $('#offlineCoverage').textContent =
      installedCount === manifest.packs.length
        ? 'Full'
        : installedCount
          ? 'Partial'
          : 'Core only';
  }

  function updateNetwork() {
    const online = navigator.onLine;

    $('#networkDot').className = `network-dot ${online ? 'online' : 'offline'}`;
    $('#networkStatus').textContent = online ? 'Online' : 'Offline';
    $('#networkNote').textContent = online
      ? 'Packs can be downloaded or refreshed.'
      : 'Installed packs remain available. New downloads require a connection.';
  }

  async function updateStorage() {
    if (!navigator.storage?.estimate) {
      $('#storageUsage').textContent = 'Storage estimate unavailable';
      return;
    }

    const estimate = await navigator.storage.estimate();
    const used = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const percent = quota ? Math.min(100, (used / quota) * 100) : 0;

    $('#storageUsage').textContent = `${humanBytes(used)} used`;
    $('#storageQuota').textContent = quota
      ? `${humanBytes(quota)} available quota`
      : 'Quota unavailable';
    $('#storageBar').style.width = `${percent}%`;
  }

  function updateInstallText() {
    const standalone =
      matchMedia('(display-mode: standalone)').matches ||
      navigator.standalone === true;
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);

    $('#installState').textContent = standalone
      ? 'Installed as an app'
      : ios
        ? 'Safari installation available'
        : 'Browser install available when supported';

    $('#installHelp').textContent = standalone
      ? 'This page is running in standalone app mode.'
      : ios
        ? 'On iPhone/iPad: open in Safari, tap Share, then Add to Home Screen.'
        : 'Use Install App. If no prompt appears, use the browser menu and choose Install app / Add to Home Screen.';
  }

  function bindShell() {
    if (!SMD21Auth.guard()) return false;

    const account = SMD21Auth.getAccount();
    if (account?.email) $('#accountEmail').textContent = account.email;

    $('#mobileMenu').addEventListener('click', () => {
      $('#sidebar').classList.toggle('open');
      $('#drawerBackdrop').classList.toggle('show');
    });

    $('#drawerBackdrop').addEventListener('click', () => {
      $('#sidebar').classList.remove('open');
      $('#drawerBackdrop').classList.remove('show');
    });

    return true;
  }

  async function init() {
    if (!bindShell()) return;

    updateNetwork();
    updateInstallText();

    addEventListener('online', updateNetwork);
    addEventListener('offline', updateNetwork);

    $('#refreshStorage').addEventListener('click', updateStorage);
    $('#downloadAll').addEventListener('click', installAll);
    $('#removeAll').addEventListener('click', removeAll);

    try {
      await ensureServiceWorkerReady();
      await fetchManifest();
      render();

      for (const pack of manifest.packs) {
        await updateCard(pack.id);
      }

      await refreshSummary();
      await updateStorage();

      const requested = (location.hash || '').replace('#', '');
      if (requested) {
        const card = document.querySelector(
          `[data-pack-id="${CSS.escape(requested)}"]`,
        );

        if (card) {
          card.classList.add('requested-pack');
          setTimeout(
            () => card.scrollIntoView({ behavior: 'smooth', block: 'center' }),
            80,
          );
        }
      }
    } catch (error) {
      $('#packGrid').innerHTML =
        `<div class="empty-state">Could not initialize offline mode: ${error.message}</div>`;
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
