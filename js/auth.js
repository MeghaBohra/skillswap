/* ==========================================================================
   SkillSwap - Authentication Module (auth.js)
   Handles user registration, login, demo one-click login, logout, form
   validation, and protected page route guards.
   *NOTE: Passwords are validated for lab demonstration rules but NEVER stored
   in LocalStorage for security best practices.
   ========================================================================== */

/**
 * Returns the currently authenticated user session or null.
 * @returns {object|null} Active user session data.
 */
function getCurrentUser() {
  return getData(STORAGE_KEYS.SESSION);
}

/**
 * Checks if a session currently exists.
 * @returns {boolean} True if logged in.
 */
function isLoggedIn() {
  return getCurrentUser() !== null;
}

/**
 * Validates registration input fields.
 * @param {object} data - Form data with name, email, password, confirmPassword, branch, year.
 * @returns {object} Object with isValid flag and field-specific error messages.
 */
function validateRegistration(data) {
  const errors = {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Name validation
  if (!data.name || data.name.trim().length < 2) {
    errors.name = "Full name must be at least 2 characters.";
  }

  // Email validation
  if (!data.email || !emailRegex.test(data.email.trim())) {
    errors.email = "Please enter a valid academic or personal email address.";
  } else {
    // Check if email already registered
    const users = getData(STORAGE_KEYS.USERS) || [];
    const exists = users.some(u => u.email.toLowerCase() === data.email.trim().toLowerCase());
    if (exists) {
      errors.email = "An account with this email is already registered.";
    }
  }

  // Branch & Year validation
  if (!data.branch || data.branch.trim() === "") {
    errors.branch = "Please select your engineering department/branch.";
  }
  if (!data.year || data.year.trim() === "") {
    errors.year = "Please select your academic year.";
  }

  // Password validation (minimum 8 characters)
  if (!data.password || data.password.length < 8) {
    errors.password = "Password must be at least 8 characters long.";
  }

  // Confirm password match
  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Registers a new student account.
 * Note: Password is validated but intentionally NOT stored.
 * @param {object} formData - Registration form fields.
 * @returns {object} Result object { success: boolean, errors?: object, user?: object }
 */
function registerUser(formData) {
  const validation = validateRegistration(formData);
  if (!validation.isValid) {
    return { success: false, errors: validation.errors };
  }

  // Diverse avatar background palette
  const avatarColors = ["#4F46E5", "#7C3AED", "#059669", "#D97706", "#2563EB", "#DB2777", "#0D9488", "#EA580C"];
  const randomColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];

  const newUser = {
    id: generateId("user"),
    name: formData.name.trim(),
    email: formData.email.trim().toLowerCase(),
    branch: formData.branch,
    year: formData.year,
    bio: `${formData.branch} (${formData.year}) student eager to share and exchange skills.`,
    avatarColor: randomColor,
    joinedDate: new Date().toISOString().split("T")[0]
  };

  // Save to users array
  const users = getData(STORAGE_KEYS.USERS) || [];
  users.push(newUser);
  setData(STORAGE_KEYS.USERS, users);

  // Automatically start user session
  setData(STORAGE_KEYS.SESSION, {
    userId: newUser.id,
    name: newUser.name,
    email: newUser.email,
    branch: newUser.branch,
    year: newUser.year,
    avatarColor: newUser.avatarColor
  });

  return { success: true, user: newUser };
}

/**
 * Performs student login.
 * @param {string} email - Registered student email.
 * @param {string} password - Input password (validated for min length).
 * @returns {object} Result object { success: boolean, message?: string, user?: object }
 */
function loginUser(email, password) {
  if (!email || !password) {
    return { success: false, message: "Please fill in both email and password." };
  }

  if (password.length < 8) {
    return { success: false, message: "Password must be at least 8 characters long." };
  }

  const users = getData(STORAGE_KEYS.USERS) || [];
  const foundUser = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());

  if (!foundUser) {
    return {
      success: false,
      message: "No registered student found with this email. Please check your spelling or use Demo Login."
    };
  }

  // Set active session
  setData(STORAGE_KEYS.SESSION, {
    userId: foundUser.id,
    name: foundUser.name,
    email: foundUser.email,
    branch: foundUser.branch,
    year: foundUser.year,
    avatarColor: foundUser.avatarColor
  });

  return { success: true, user: foundUser };
}

/**
 * Fast one-click demo login as Rahul Verma (Demo CSE Student).
 */
function loginDemoUser() {
  const users = getData(STORAGE_KEYS.USERS) || [];
  let demoUser = users.find(u => u.id === "user_demo");

  // Fallback if not found
  if (!demoUser && users.length > 0) {
    demoUser = users[0];
  }

  if (demoUser) {
    setData(STORAGE_KEYS.SESSION, {
      userId: demoUser.id,
      name: demoUser.name,
      email: demoUser.email,
      branch: demoUser.branch,
      year: demoUser.year,
      avatarColor: demoUser.avatarColor
    });

    showToast(`Welcome back, ${demoUser.name}! (Demo Mode)`, "success");
    
    // Redirect to dashboard or explore
    setTimeout(() => {
      const inSub = isSubPage();
      window.location.href = inSub ? "dashboard.html" : "pages/dashboard.html";
    }, 600);
  } else {
    showToast("Demo user not found. Resetting data...", "error");
    seedInitialData(true);
  }
}

/**
 * Logs out the active student and redirects to index.html.
 */
function handleLogout() {
  removeData(STORAGE_KEYS.SESSION);
  showToast("You have been successfully logged out.", "info");

  setTimeout(() => {
    const inSub = isSubPage();
    window.location.href = inSub ? "../index.html" : "index.html";
  }, 500);
}

/**
 * Route Guard: Redirects unauthenticated visitors to login.html
 * if they try to access protected pages.
 */
function checkAuthGuard() {
  const protectedPages = [
    "dashboard.html",
    "add-skill.html",
    "matches.html",
    "requests.html",
    "profile.html"
  ];

  const currentPath = window.location.pathname.replace(/\\/g, '/');
  const currentFile = currentPath.substring(currentPath.lastIndexOf('/') + 1);

  if (protectedPages.includes(currentFile) && !isLoggedIn()) {
    // Save intended destination
    const inSub = isSubPage();
    const loginTarget = inSub ? "login.html" : "pages/login.html";
    sessionStorage.setItem("skillswap_auth_redirect", currentFile);
    window.location.href = loginTarget;
  }
}

// Run auth guard check on script execution
checkAuthGuard();
