# SkillSwap — Peer-to-Peer Student Skill Barter Network

Live Demo: <paste link here>

> **Tagline:** *Learn Something. Teach Something. Grow Together.*  
> **Course:** 2nd-Year BTech Web Technology Lab Project  
> **Architecture:** 100% Client-Side Static (HTML5, CSS3, Vanilla JavaScript, Browser LocalStorage)  
> **Dependencies:** Zero (No Node.js, No npm, No React, No Backend, No Build Tools)  

---

## 📌 Project Overview
**SkillSwap** is a peer-to-peer knowledge exchange platform tailored for engineering college students. Students can barter their skills (for example, trading Python coding lessons for Acoustic Guitar tutorials, or Figma UI design for Calculus mentoring) without any financial transactions.

The project is built specifically to demonstrate core client-side web technologies for **2nd-Year BTech Web Technology Lab viva examinations**, featuring clean semantic markup, modular CSS, robust DOM manipulation, and full data persistence via browser LocalStorage.

---

## 📂 Exact Folder Structure
```text
skillswap/
├── .gitignore                   # Ignores node_modules, logs, OS metadata
├── .nojekyll                    # Disables Jekyll processing on GitHub Pages
├── index.html                   # Landing page (Hero, Categories, Steps, Community)
├── README.md                    # Project documentation & Lab Viva guide
├── assets/
│   ├── logo.svg                 # Scalable vector logo (Indigo & Violet gradient)
│   └── images/                  # Images directory (avatars are CSS circles)
├── css/
│   ├── variables.css            # Design tokens, color palette, shadows, spacing
│   ├── base.css                 # HTML5 resets, typography, containers, utilities
│   ├── components.css           # Buttons, cards, badges, avatars, forms, toast
│   ├── pages.css                # Page-specific layouts (Hero, Explore, Add-Skill)
│   └── responsive.css           # Media queries for 1024px, 768px, and 480px
├── js/
│   ├── storage.js               # LocalStorage helpers (getData, setData, seed data)
│   ├── ui.js                    # Dynamic navbar, hamburger toggle, toast notifications
│   ├── auth.js                  # Form validation, demo login, logout, route guards
│   ├── skills.js                # Explore filters, search, add/edit/delete skills
│   ├── matching.js              # Reciprocal 2-way and 1-way matching algorithm
│   ├── requests.js              # Exchange proposal modal & status management
│   ├── reviews.js               # Star ratings and peer testimonials
│   └── main.js                  # Page router and component initialization
└── pages/
    ├── about.html               # Project details & Viva Preparation Guide
    ├── add-skill.html           # Add / Edit / Delete skill listings
    ├── dashboard.html           # Student overview metrics & quick actions
    ├── explore.html             # Skill cards, live search, multi-criteria filters
    ├── login.html               # Student login & One-Click Demo Login
    ├── matches.html             # Reciprocal peer matching interface
    ├── profile.html             # User profile, departments, reviews
    ├── register.html            # Registration form with JS regex validation
    └── requests.html            # Incoming & outgoing swap proposals
```

---

## 🚀 How to Run in VS Code

### Option 1: Double-Click (Zero Setup)
Because all paths are strictly relative (using `../` inside `pages/` and `./` at root), you can run SkillSwap directly without any web server:
1. Navigate to the `skillswap/` folder in Windows File Explorer.
2. Double-click `index.html`.
3. It will immediately open and run with full functionality in Chrome, Edge, Firefox, or any modern browser.

### Option 2: Open in VS Code
1. Open your terminal / command prompt and type:
   ```bash
   cd d:\skillswap
   code .
   ```
   Or open VS Code, click **File > Open Folder...**, and select `d:\skillswap`.
2. To view in browser:
   - Right-click `index.html` and select **Open with Default Browser**, OR
   - If you have the VS Code **Live Server** extension installed, right-click `index.html` and click **Open with Live Server**.

---

## 🧪 Step-by-Step Testing Guide

### 1. Test Seed Data & Explore Skills
- Open `index.html` and click **Explore Skills** in the hero section or navbar.
- Observe the **20 pre-seeded skills** across 6 categories (Programming, Design, Music, Languages, Academics, Photography).
- **Search:** Type `Python` into the search bar. Notice instant real-time filtering.
- **Category Filter:** Select `Design` from the dropdown to see Figma, Canva, and Logo Design listings.
- **Level Filter:** Filter by `Advanced` or `Beginner`.
- **Sort:** Change sort from `Newest First` to `Mentor Name (A-Z)`.

### 2. Test One-Click Demo Login
- Click **Log In** in the top navigation.
- Click the blue **One-Click Demo Login** button.
- You will be instantly logged in as **Rahul Verma** (2nd-Year CSE student).
- Notice that the navbar now dynamically shows:
  `Explore | Matches | Add Skill | Requests | Dashboard | Rahul (RV) | Logout`.

### 3. Test Protected Page Guard
- Click **Logout**.
- Now attempt to manually open `pages/add-skill.html` or `pages/dashboard.html` in your browser address bar.
- The route guard in `auth.js` automatically redirects you to `login.html`!

### 4. Test Adding, Editing & Deleting a Skill
- Log in using **One-Click Demo Login**.
- Navigate to **Add Skill**.
- Fill out the form:
  - Skill Name: `React Fundamentals`
  - Category: `Programming`
  - Level: `Intermediate`
  - Description: `Can teach component lifecycle, state hooks, and virtual DOM.`
  - Wanted in Return: `Spanish Conversation`
  - Mode: `Both`
- Click **Publish Skill Listing**.
- Notice the success toast and see the skill appear in the **My Published Listings** table below.
- Click **Edit** to update its details; click **Delete** to remove it.
- Open **Explore Skills** to confirm your new listing appears for the community!

### 5. Test Sending a Swap Request & Duplicate Prevention
- On **Explore Skills**, find Priya Patel's `Figma UI/UX Design` card and click **Request Exchange**.
- A modal dialog appears. Choose the skill you want to offer from your posted skills, enter a note, and click **Send Exchange Proposal**.
- Go to **Requests** (`pages/requests.html`) to see your outgoing request listed!
- **Duplicate Prevention Test:** Try requesting the same skill from Priya again. Notice the red error toast blocking the duplicate request while the current proposal is Pending or Accepted.
- Under **Incoming Swap Proposals**, test clicking **Accept**, **Decline**, or **Mark Completed** (both sender and receiver can mark Accepted exchanges Completed).

### 6. Test Interactive 5-Star Reviews
- Once an exchange is marked **Completed**, a blue **Leave a Review** button appears on the request card.
- Click **Leave a Review** to open the interactive review modal.
- Select your rating (1 to 5 clickable stars) and enter feedback comments (min. 5 chars).
- Submit the review and observe the success toast and the card status updating to **Reviewed**.
- Go to **Profile** (`pages/profile.html`) to see real feedback history and dynamically calculated average star ratings.

### 7. Test Smart Skill Matching & Worked Example
- Click **Matches** in the navbar (`pages/matches.html`).
- The matching algorithm analyzes Rahul Verma's offered skills (Python, Web Dev) and wanted skills (Guitar, Spanish).
- It highlights reciprocal students like **Aarav Sharma** (Teaches Guitar, wants Web Dev) with a **95% Score • Mutual Match** badge!
- Notice that peers with an active Pending or Accepted proposal are automatically hidden to keep match suggestions actionable.
- Clicking **Send Swap Proposal** directly selects the peer's skill that matches what you want.
- Read the **How Skill Matching Works** section on `matches.html` explaining the 4-step matching pipeline and scoring rules table.

### 8. Test Edit Profile with Live Sync
- Go to **Profile** (`pages/profile.html`) and click **Edit Profile**.
- Change your name, department, academic year, or bio, and save.
- Notice the immediate sync:
  1. Updated in `skillswap_users`.
  2. Updated in active `skillswap_session` and top navbar avatar pill.
  3. Automatically propagates `userName`, `userBranch`, and `userYear` across all your posted skill listings in `skillswap_skills`!

### 9. Test Dashboard Metrics & Activity Feed
- Go to **Dashboard** (`pages/dashboard.html`).
- Check the real calculated request counters: **Total**, **Pending**, **Accepted**, and **Completed**.
- Review your **Skills I Can Teach** and **Skills I Want to Learn** lists.
- Check the **Recent Activity** timeline displaying your 5 latest proposals and peer reviews.

---

## 🎓 2nd-Year BTech Web Technology Lab Viva Guide

### Q1: What is HTML5 LocalStorage and how is it used in this project?
**Answer:** HTML5 LocalStorage provides persistent client-side key-value storage (up to 5MB) within the browser. Data remains intact even after closing or refreshing the tab. In SkillSwap, we use `localStorage.getItem()` and `localStorage.setItem()` paired with `JSON.stringify()` and `JSON.parse()` to store JSON arrays under keys prefixed with `skillswap_` (`skillswap_users`, `skillswap_skills`, `skillswap_requests`, etc.).

### Q2: Why are passwords not stored in LocalStorage?
**Answer:** LocalStorage stores plain text without built-in encryption and can be accessed by any client-side JavaScript. Storing passwords in LocalStorage is a security vulnerability. For lab project compliance, password rules (minimum 8 characters and confirmation match) are thoroughly validated using JavaScript in `auth.js`, but the password field is intentionally excluded when saving the user object to LocalStorage.

### Q3: How does the application run without a backend or web server?
**Answer:** The application uses pure client-side static web technologies (HTML5, CSS3, Vanilla ES6 JavaScript). All asset, style, and script links use relative paths (`css/...` or `../css/...`). When opened using `file:///`, modern browsers execute the markup and scripts directly in the browser runtime engine.

### Q4: How does the multi-filter system work in `skills.js`?
**Answer:** The `filterAndSortSkills()` function uses JavaScript higher-order array methods (`Array.prototype.filter()` and `Array.prototype.sort()`). It sequentially filters the complete skills array by keyword substring (case-insensitive across name, title, and description), category, and proficiency level, and then sorts the resulting array before rendering it via template literals.

### Q5: How is the mobile hamburger menu implemented?
**Answer:** A semantic button (`.nav-toggle`) is styled to be hidden on desktop and displayed at `@media (max-width: 768px)`. In `ui.js`, an event listener toggles the CSS class `.open` on the `.nav-menu` element, which slides or displays the menu vertically.

---

## 🌐 Deployment Guide

Because SkillSwap is built entirely with client-side static web technologies (HTML5, CSS3, vanilla JS), it requires **zero build commands, zero npm installations, and zero server runtimes**. It can be hosted on any static hosting platform for free.

### Option 1: GitHub Pages

1. **Create Repository:**
   - Log into [GitHub](https://github.com) and click **New Repository**.
   - Name it `skillswap`, choose **Public**, and leave initialization options unchecked.
2. **Push Code:**
   - Push your local code to the `main` branch (see Git checklist below).
3. **Enable GitHub Pages:**
   - In your repository, click **Settings** (gear icon in the top tab bar).
   - In the left sidebar under *Code and automation*, click **Pages**.
   - Under **Build and deployment** > **Source**, choose **Deploy from a branch**.
   - Under **Branch**, select `main` and set folder to `/ (root)`. Click **Save**.
4. **Live URL Format:**
   - GitHub Pages builds the site in ~60 seconds.
   - Your live website URL format will be:
     `https://<username>.github.io/skillswap/`
   - Paste this URL at the top of your `README.md` under `Live Demo:`.

### Option 2: Netlify

#### Method A: Instant Drag-and-Drop (30 Seconds)
1. Navigate to [app.netlify.com/drop](https://app.netlify.com/drop) and log into your free Netlify account.
2. Drag and drop the entire `D:\skillswap` project folder directly into the designated drop zone.
3. Netlify will deploy your site in seconds and provide an immediate public live URL (`https://<random-name>.netlify.app`).

#### Method B: Continuous Deployment via GitHub
1. In your Netlify dashboard, click **Add new site** > **Import an existing project**.
2. Select **GitHub** and grant access to your `skillswap` repository.
3. Configure build settings:
   - **Build command:** *(leave completely blank / empty)*
   - **Publish directory:** `.` *(dot = project root)*
4. Click **Deploy skillswap**. Any future git pushes will automatically redeploy the site.

---

## ⚠️ Common Deployment Errors & Troubleshooting

| Error / Symptom | Root Cause | Solution |
| :--- | :--- | :--- |
| **404 Not Found on Stylesheets or Scripts** | Absolute paths like `/css/base.css` or `/js/storage.js` break when hosted under a GitHub repository sub-path (`/skillswap/`). | SkillSwap uses 100% relative paths (`css/...` from root, `../css/...` from `pages/`). Never add leading `/` to URLs. |
| **Subpages fail to load on GitHub Pages** | Jekyll engine ignoring dotfiles or directory structures. | An empty `.nojekyll` file is included in the project root to bypass Jekyll processing entirely. |
| **404 on Root URL** | Missing `index.html` in the root deployment directory. | Ensure `index.html` is located directly in the root folder, not nested inside an extra subfolder. |
| **Changes not reflecting after push** | Browser aggressive caching or GitHub Actions deployment in progress. | Perform a hard refresh (`Ctrl + F5` or `Ctrl + Shift + R`), or check the **Actions** tab on GitHub to verify the Pages deployment status. |
| **Font Awesome icons showing square boxes** | Offline testing or CDN network blockage. | SkillSwap loads Font Awesome via CDNJS (`cdnjs.cloudflare.com`). Ensure you have an active internet connection when running. |

---

## 💾 LocalStorage Limitations (Viva Defense Note)

While `localStorage` provides persistent client-side data for this lab project without requiring a backend server, students should be able to explain its technical trade-offs during a viva examination:

1. **Client-Side & Browser Isolation:**
   - Data stored in `localStorage` exists **only on that specific computer and browser profile**.
   - A skill added by Student A on their laptop is *not* sent over the internet to Student B's phone. True multi-user synchronization requires a backend server and a database (e.g., Node.js/Express + MongoDB or PostgreSQL).
2. **Origin & Domain Boundary:**
   - LocalStorage adheres to the Same-Origin Policy. Data stored under `file:///` is completely isolated from `http://localhost:8080` or `https://<username>.github.io/skillswap/`.
3. **Storage Quota:**
   - Browsers allocate a maximum of ~5MB to 10MB per origin. It is ideal for lightweight text and JSON models, but cannot store images, videos, or massive catalogs.
4. **Synchronous Execution:**
   - `localStorage.getItem()` and `localStorage.setItem()` are synchronous, blocking operations on the main UI thread. For massive datasets, an asynchronous alternative like `IndexedDB` would be preferred.
5. **Plaintext Storage (Security):**
   - LocalStorage does not provide encryption and is accessible to any script executing on the same origin (vulnerable to XSS). Passwords, auth tokens, and sensitive personal identifiers must **never** be stored in LocalStorage. SkillSwap strictly excludes passwords from storage.

