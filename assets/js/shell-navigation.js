(() => {
  'use strict';

  const SELECTORS = Object.freeze({
    accountButton: '#signOutBtn',
    accountMenu: '#shellAccountMenu',
    moreSheet: '#shellMoreSheet',
    moreBackdrop: '#shellMoreBackdrop',
  });

  function query(selector, root = document) {
    return root.querySelector(selector);
  }

  function currentPage() {
    return location.pathname.split('/').pop() || 'app.html';
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(
      /[&<>"']/g,
      (character) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#039;',
        })[character],
    );
  }

  function translate(text) {
    return window.SMD21I18N?.translateExact?.(text) || text;
  }

  function account() {
    return window.SMD21Auth?.getAccount?.() || {
      email: 'Local account',
      provider: 'local',
    };
  }

  function activeNavigationKey() {
    const page = currentPage();
    const hash = (location.hash || '').replace('#', '');

    if (page === 'anatomy.html') return 'anatomy';
    if (page === 'ai.html') return 'ai';

    if (page === 'app.html') {
      return !hash || hash === 'home' ? 'home' : 'dictionary';
    }

    return 'more';
  }

  function navigationItem({ key, href = '', icon, label, button = false }) {
    const isActive = activeNavigationKey() === key;
    const tag = button ? 'button' : 'a';
    const navigationAttribute = button
      ? 'type="button" data-shell-more aria-haspopup="dialog" aria-expanded="false"'
      : `href="${href}"`;
    const activeAttributes = isActive ? ' class="active" aria-current="page"' : '';

    return `
      <${tag} ${navigationAttribute} data-shell-key="${key}"${activeAttributes}>
        <span class="shell-nav-icon" aria-hidden="true">${icon}</span>
        <span class="shell-nav-label">${escapeHtml(label)}</span>
      </${tag}>
    `;
  }

  function renderBottomNavigation() {
    const items = [
      { key: 'home', href: 'app.html#home', icon: '⌂', label: 'Home' },
      { key: 'dictionary', href: 'app.html#dictionary', icon: '▣', label: 'Dictionary' },
      { key: 'anatomy', href: 'anatomy.html', icon: '◈', label: '3D Anatomy' },
      { key: 'ai', href: 'ai.html', icon: '✦', label: 'AI Study' },
      { key: 'more', icon: '•••', label: 'More', button: true },
    ];

    document.querySelectorAll('nav.bottom-nav').forEach((navigation) => {
      navigation.classList.add('shell-bottom-nav');
      navigation.innerHTML = items.map(navigationItem).join('');
      window.SMD21I18N?.translateTree?.(navigation);
    });
  }

  function accountSummary() {
    const currentAccount = account();
    const email = currentAccount.email || 'Local account';
    const providerLabel =
      currentAccount.provider === 'google'
        ? 'Google / Supabase session'
        : 'Local browser account';

    return `
      <div class="shell-account-summary">
        <span class="avatar">${escapeHtml(email.slice(0, 1).toUpperCase() || 'S')}</span>
        <span>
          <strong>${escapeHtml(email)}</strong>
          <small>${escapeHtml(providerLabel)}</small>
        </span>
      </div>
    `;
  }

  function createMoreSheet() {
    if (query(SELECTORS.moreSheet)) return;

    const backdrop = document.createElement('div');
    backdrop.className = 'shell-more-backdrop';
    backdrop.id = 'shellMoreBackdrop';

    const sheet = document.createElement('section');
    sheet.className = 'shell-more-sheet';
    sheet.id = 'shellMoreSheet';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.setAttribute('aria-label', 'More navigation');

    sheet.innerHTML = `
      <div class="shell-more-head">
        <strong>More</strong>
        <button
          class="btn-ui shell-more-close"
          type="button"
          data-shell-more-close
          aria-label="Close"
        >×</button>
      </div>
      ${accountSummary()}
      <div class="shell-more-grid">
        <a href="app.html#selected">✓ Selected</a>
        <a href="app.html#bookmarks">☆ Bookmarks</a>
        <a href="app.html#history">◷ History</a>
        <a href="offline.html">⇩ Offline Packs</a>
        <a href="settings.html">⚙ Settings</a>
        <a href="about.html">ⓘ About</a>
        <a href="settings.html#backupRestore">↥ Backup & restore</a>
        <button type="button" class="shell-danger" data-shell-signout>↪ Sign out</button>
      </div>
    `;

    document.body.append(backdrop, sheet);
    window.SMD21I18N?.translateTree?.(sheet);
  }

  function setMoreSheetOpen(open) {
    const sheet = query(SELECTORS.moreSheet);
    const backdrop = query(SELECTORS.moreBackdrop);

    if (!sheet || !backdrop) return;

    sheet.classList.toggle('open', open);
    backdrop.classList.toggle('show', open);

    document.querySelectorAll('[data-shell-more]').forEach((button) => {
      button.setAttribute('aria-expanded', String(open));
    });

    if (open) {
      sheet.querySelector('[data-shell-more-close]')?.focus();
    }
  }

  function createSidebarSignOut() {
    document.querySelectorAll('.app-sidebar .sidebar-nav').forEach((navigation) => {
      if (navigation.querySelector('[data-shell-sidebar-signout]')) return;

      const divider = document.createElement('div');
      divider.className = 'nav-spacer';
      divider.dataset.shellLogoutDivider = '';

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'nav-btn shell-sidebar-signout';
      button.dataset.shellSignout = '';
      button.dataset.shellSidebarSignout = '';
      button.innerHTML =
        '<span aria-hidden="true">↪</span><span>Sign out</span>';

      navigation.append(divider, button);
      window.SMD21I18N?.translateTree?.(button);
    });
  }

  function createAccountMenu() {
    const accountButton = query(SELECTORS.accountButton);
    if (!accountButton || query(SELECTORS.accountMenu)) return;

    accountButton.title = translate('Account');
    accountButton.setAttribute('aria-haspopup', 'menu');
    accountButton.setAttribute('aria-expanded', 'false');

    const description = accountButton.querySelector('small');
    if (description) {
      description.textContent = translate('Medical learner · Account');
    }

    const menu = document.createElement('div');
    menu.className = 'account-menu';
    menu.id = 'shellAccountMenu';
    menu.setAttribute('role', 'menu');
    menu.innerHTML = `
      ${accountSummary()}
      <a role="menuitem" href="settings.html">⚙ Settings</a>
      <a role="menuitem" href="settings.html#backupRestore">↥ Backup & restore</a>
      <a role="menuitem" href="about.html">ⓘ About</a>
      <button role="menuitem" type="button" class="shell-danger" data-shell-signout>
        ↪ Sign out
      </button>
    `;

    document.body.append(menu);
    window.SMD21I18N?.translateTree?.(menu);

    accountButton.addEventListener(
      'click',
      (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();

        const open = !menu.classList.contains('open');
        menu.classList.toggle('open', open);
        accountButton.setAttribute('aria-expanded', String(open));
      },
      { capture: true },
    );
  }

  function closeAccountMenu() {
    const menu = query(SELECTORS.accountMenu);
    const accountButton = query(SELECTORS.accountButton);

    menu?.classList.remove('open');
    accountButton?.setAttribute('aria-expanded', 'false');
  }

  async function signOut() {
    try {
      await window.SMD21Auth?.signOut?.();
    } finally {
      location.href = 'index.html';
    }
  }

  function handleDocumentClick(event) {
    if (event.target.closest('[data-shell-more]')) {
      event.preventDefault();
      setMoreSheetOpen(true);
      return;
    }

    if (
      event.target.closest('[data-shell-more-close]') ||
      event.target.id === 'shellMoreBackdrop'
    ) {
      event.preventDefault();
      setMoreSheetOpen(false);
      return;
    }

    if (event.target.closest('[data-shell-signout]')) {
      event.preventDefault();
      signOut();
      return;
    }

    const menu = query(SELECTORS.accountMenu);
    const accountButton = query(SELECTORS.accountButton);

    if (
      menu?.classList.contains('open') &&
      !menu.contains(event.target) &&
      !accountButton?.contains(event.target)
    ) {
      closeAccountMenu();
    }
  }

  function handleDocumentKeydown(event) {
    if (event.key !== 'Escape') return;

    setMoreSheetOpen(false);
    closeAccountMenu();
  }

  function refreshTranslatedAccountLabel() {
    renderBottomNavigation();

    const accountButton = query(SELECTORS.accountButton);
    if (!accountButton) return;

    accountButton.title = translate('Account');
    const description = accountButton.querySelector('small');

    if (description) {
      description.textContent = translate('Medical learner · Account');
    }
  }

  function bindEvents() {
    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('keydown', handleDocumentKeydown);
    window.addEventListener('hashchange', renderBottomNavigation);
    window.addEventListener('smd21:languagechange', refreshTranslatedAccountLabel);
  }

  function initialize() {
    renderBottomNavigation();
    createMoreSheet();
    createSidebarSignOut();
    createAccountMenu();
    bindEvents();
  }

  document.addEventListener('DOMContentLoaded', initialize);

  window.SMD21ShellNavigation = {
    renderBottomNav: renderBottomNavigation,
    openMore: setMoreSheetOpen,
    activeKey: activeNavigationKey,
  };
})();
