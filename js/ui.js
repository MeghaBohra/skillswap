/* ==========================================================================
   SkillSwap - UI Utilities (ui.js)
   Manages dynamic navigation bar (logged-in vs logged-out states), mobile
   hamburger menu, HTML sanitization, and toast notifications.
   ========================================================================== */

/**
 * Sanitizes untrusted user input strings to prevent XSS vulnerabilities.
 * Converts characters like <, >, &, ", and ' into safe HTML entities.
 * @param {string|number|null|undefined} str - Raw input text.
 * @returns {string} HTML-escaped safe string.
 */
function escapeHTML(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Extracts uppercase initials from a person's full name.
 * Example: "Rahul Verma" -> "RV", "Priya" -> "P"
 * @param {string} name - The person's full name.
 * @returns {string} One or two uppercase initials.
 */
function getInitials(name) {
  if (!name) return "SS";
  const parts = String(name).trim().split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Generates the HTML markup for an initial-based circular avatar.
 * No external image files needed!
 * @param {string} name - User's name.
 * @param {string} color - Hex color code for the background.
 * @param {string} [sizeClass='avatar-sm'] - CSS size class.
 * @returns {string} HTML string for the avatar.
 */
function createAvatarHTML(name, color = '#4F46E5', sizeClass = 'avatar-sm') {
  const safeName = escapeHTML(name || "Student");
  const initials = getInitials(name);
  return `<span class="avatar ${sizeClass}" style="background-color: ${color};" title="${safeName}">${initials}</span>`;
}

/**
 * Displays a non-blocking toast alert message on the screen.
 * @param {string} message - Message text to display.
 * @param {'success'|'error'|'info'} [type='info'] - Style category of the toast.
 * @param {number} [duration=3500] - Duration in milliseconds before auto-dismissal.
 */
function showToast(message, type = 'info', duration = 3500) {
  // Find or create the toast container
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  // Create individual toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  // Pick suitable Font Awesome icon
  let iconClass = 'fa-solid fa-circle-info';
  if (type === 'success') iconClass = 'fa-solid fa-circle-check';
  if (type === 'error') iconClass = 'fa-solid fa-triangle-exclamation';

  toast.innerHTML = `
    <i class="${iconClass} toast-icon"></i>
    <div class="toast-message">${message}</div>
    <button class="toast-close" aria-label="Close">&times;</button>
  `;

  // Manual close button
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 300);
  });

  container.appendChild(toast);

  // Auto-dismiss after duration
  setTimeout(() => {
    if (toast.parentElement) {
      toast.classList.add('hiding');
      setTimeout(() => toast.remove(), 300);
    }
  }, duration);
}

/**
 * Detects whether the current page is at root or inside pages/ directory.
 * @returns {boolean} True if running inside pages/ subfolder.
 */
function isSubPage() {
  const path = window.location.pathname.replace(/\\/g, '/');
  return path.includes('/pages/');
}

/**
 * Dynamically renders the navigation bar based on authentication status.
 * Adjusts relative link paths so files can run directly by double-clicking.
 */
function updateNavbar() {
  const navContainer = document.querySelector('.header-nav');
  if (!navContainer) return;

  const inSub = isSubPage();
  const rootPrefix = inSub ? '../' : './';
  const pagePrefix = inSub ? './' : 'pages/';

  // Get active session
  const session = typeof getCurrentUser === 'function' ? getCurrentUser() : getData(STORAGE_KEYS.SESSION);
  const currentPath = window.location.pathname.replace(/\\/g, '/');
  const currentFile = currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'index.html';

  let navLinksHTML = '';
  let authActionsHTML = '';

  if (session) {
    // Logged In Navigation Links
    navLinksHTML = `
      <a href="${pagePrefix}explore.html" class="nav-link ${currentFile === 'explore.html' ? 'active' : ''}">
        <i class="fa-solid fa-compass"></i> Explore
      </a>
      <a href="${pagePrefix}matches.html" class="nav-link ${currentFile === 'matches.html' ? 'active' : ''}">
        <i class="fa-solid fa-handshake"></i> Matches
      </a>
      <a href="${pagePrefix}add-skill.html" class="nav-link ${currentFile === 'add-skill.html' ? 'active' : ''}">
        <i class="fa-solid fa-plus-circle"></i> Add Skill
      </a>
      <a href="${pagePrefix}requests.html" class="nav-link ${currentFile === 'requests.html' ? 'active' : ''}">
        <i class="fa-solid fa-paper-plane"></i> Requests
      </a>
      <a href="${pagePrefix}dashboard.html" class="nav-link ${currentFile === 'dashboard.html' ? 'active' : ''}">
        <i class="fa-solid fa-gauge"></i> Dashboard
      </a>
      <a href="${pagePrefix}about.html" class="nav-link ${currentFile === 'about.html' ? 'active' : ''}">
        <i class="fa-solid fa-circle-question"></i> About
      </a>
    `;

    // Logged In User Profile & Logout
    const safeFirstName = escapeHTML(session.name ? session.name.split(' ')[0] : 'Profile');
    authActionsHTML = `
      <a href="${pagePrefix}profile.html" class="nav-user-info" title="View Profile">
        ${createAvatarHTML(session.name, session.avatarColor, 'avatar-sm')}
        <span class="nav-user-name">${safeFirstName}</span>
      </a>
      <button onclick="handleLogout()" class="btn btn-outline btn-sm" title="Sign Out">
        <i class="fa-solid fa-arrow-right-from-bracket"></i> Logout
      </button>
    `;
  } else {
    // Logged Out Navigation Links
    navLinksHTML = `
      <a href="${rootPrefix}index.html" class="nav-link ${currentFile === 'index.html' || currentFile === '' ? 'active' : ''}">
        <i class="fa-solid fa-house"></i> Home
      </a>
      <a href="${pagePrefix}explore.html" class="nav-link ${currentFile === 'explore.html' ? 'active' : ''}">
        <i class="fa-solid fa-compass"></i> Explore Skills
      </a>
      <a href="${pagePrefix}about.html" class="nav-link ${currentFile === 'about.html' ? 'active' : ''}">
        <i class="fa-solid fa-circle-info"></i> About & Viva
      </a>
    `;

    // Logged Out Login & Register Buttons
    authActionsHTML = `
      <a href="${pagePrefix}login.html" class="btn btn-outline btn-sm">Log In</a>
      <a href="${pagePrefix}register.html" class="btn btn-primary btn-sm">Get Started</a>
    `;
  }

  navContainer.innerHTML = `
    <div class="container">
      <nav class="navbar">
        <a href="${rootPrefix}index.html" class="nav-brand">
          <img src="${rootPrefix}assets/logo.svg" alt="SkillSwap Logo">
        </a>

        <!-- Mobile hamburger menu button -->
        <button class="nav-toggle" id="navToggle" aria-label="Toggle navigation menu">
          <i class="fa-solid fa-bars"></i>
        </button>

        <!-- Main navigation link container -->
        <div class="nav-menu" id="navMenu">
          ${navLinksHTML}
          <div class="nav-auth">
            ${authActionsHTML}
          </div>
        </div>
      </nav>
    </div>
  `;

  initMobileMenu();
}

/**
 * Initializes mobile hamburger navigation toggle behaviour.
 */
function initMobileMenu() {
  const toggleBtn = document.getElementById('navToggle');
  const menu = document.getElementById('navMenu');

  if (toggleBtn && menu) {
    toggleBtn.addEventListener('click', () => {
      menu.classList.toggle('open');
      const icon = toggleBtn.querySelector('i');
      if (menu.classList.contains('open')) {
        icon.className = 'fa-solid fa-xmark';
      } else {
        icon.className = 'fa-solid fa-bars';
      }
    });

    // Close menu when clicking outside or on a link
    menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        menu.classList.remove('open');
        const icon = toggleBtn.querySelector('i');
        if (icon) icon.className = 'fa-solid fa-bars';
      });
    });
  }
}

/**
 * Injects standard footer markup into the footer element if empty.
 */
function renderFooter() {
  const footer = document.querySelector('footer.footer');
  if (!footer) return;

  const inSub = isSubPage();
  const rootPrefix = inSub ? '../' : './';
  const pagePrefix = inSub ? './' : 'pages/';

  footer.innerHTML = `
    <div class="container">
      <div class="footer-top">
        <div class="footer-brand">
          <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom: 0.75rem;">
            <img src="${rootPrefix}assets/logo.svg" alt="SkillSwap Logo" style="filter: brightness(0) invert(1); height:32px;">
          </div>
          <p>
            <strong>SkillSwap</strong> — Learn Something. Teach Something. Grow Together.
            A peer-to-peer campus skill barter network designed for BTech students.
          </p>
          <div style="margin-top: 1rem;">
            <button onclick="resetDemoData()" class="btn btn-outline btn-sm btn-reset-demo" style="background: transparent; color: #E2E8F0; border-color: #334155;">
              <i class="fa-solid fa-rotate-left"></i> Reset Demo Data
            </button>
          </div>
        </div>

        <div class="footer-col">
          <h4>Explore</h4>
          <ul class="footer-links">
            <li><a href="${pagePrefix}explore.html?category=Programming">Programming</a></li>
            <li><a href="${pagePrefix}explore.html?category=Design">Design & UI/UX</a></li>
            <li><a href="${pagePrefix}explore.html?category=Music">Music & Audio</a></li>
            <li><a href="${pagePrefix}explore.html?category=Languages">Languages</a></li>
            <li><a href="${pagePrefix}explore.html?category=Academics">Academics & Math</a></li>
            <li><a href="${pagePrefix}explore.html?category=Photography">Photography</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>Navigation</h4>
          <ul class="footer-links">
            <li><a href="${rootPrefix}index.html">Home</a></li>
            <li><a href="${pagePrefix}explore.html">Browse Skills</a></li>
            <li><a href="${pagePrefix}about.html">About & Viva Guide</a></li>
            <li><a href="${pagePrefix}register.html">Sign Up</a></li>
            <li><a href="${pagePrefix}login.html">Log In</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>Lab Project Info</h4>
          <p style="font-size: 0.85rem; line-height: 1.5; color: #94A3B8;">
            <strong>Course:</strong> BTech 2nd Year Web Technology Lab<br>
            <strong>Architecture:</strong> Pure Client-Side Static (HTML5 / CSS3 / Vanilla JS)<br>
            <strong>Storage:</strong> HTML5 Browser LocalStorage<br>
            <strong>Dependencies:</strong> Zero Build Tools, 100% Native.
          </p>
        </div>
      </div>

      <div class="footer-bottom">
        <div>&copy; 2026 SkillSwap. Designed for BTech Web Technology Lab Viva.</div>
        <div>Made with <i class="fa-solid fa-heart" style="color: #EF4444;"></i> for Peer Learning</div>
      </div>
    </div>
  `;
}
