/* ==========================================================================
   SkillSwap - Skills Management Module (skills.js)
   Handles querying, rendering, filtering, sorting, creating, updating,
   and deleting skill listings in LocalStorage.
   ========================================================================== */

/**
 * Retrieves all skill listings from LocalStorage.
 * @returns {Array<object>} List of skill objects.
 */
function getAllSkills() {
  return getData(STORAGE_KEYS.SKILLS) || [];
}

/**
 * Retrieves skills posted by a specific student.
 * @param {string} userId - ID of the student.
 * @returns {Array<object>} Student's skill listings.
 */
function getSkillsByUserId(userId) {
  const skills = getAllSkills();
  return skills.filter(s => s.userId === userId);
}

/**
 * Returns a single skill by its ID.
 * @param {string} skillId - Unique skill ID.
 * @returns {object|null} The matching skill or null.
 */
function getSkillById(skillId) {
  const skills = getAllSkills();
  return skills.find(s => s.id === skillId) || null;
}

/**
 * Generates an HTML card element for a skill listing.
 * @param {object} skill - Skill data object.
 * @param {object|null} currentUser - Active session user.
 * @returns {string} HTML string representing the skill card.
 */
function renderSkillCard(skill, currentUser) {
  const isOwner = currentUser && currentUser.userId === skill.userId;
  const inSub = isSubPage();
  const loginPath = inSub ? "login.html" : "pages/login.html";

  // Level badge styling
  let levelBadgeClass = "badge-beginner";
  if (skill.offeredLevel === "Intermediate") levelBadgeClass = "badge-intermediate";
  if (skill.offeredLevel === "Advanced") levelBadgeClass = "badge-advanced";

  // Safe escaped fields
  const safeName = escapeHTML(skill.userName);
  const safeBranch = escapeHTML(skill.userBranch || 'BTech');
  const safeYear = escapeHTML(skill.userYear || 'Student');
  const safeOffered = escapeHTML(skill.offeredSkill);
  const safeWanted = escapeHTML(skill.wantedSkill);
  const safeDesc = escapeHTML(skill.description);
  const safeCat = escapeHTML(skill.offeredCategory);
  const safeMode = escapeHTML(skill.learningMode || 'Both');

  // Action button depending on login and ownership
  let actionButtonHtml = "";
  if (isOwner) {
    actionButtonHtml = `
      <span class="badge" style="background-color: #E2E8F0; color: #475569;">
        <i class="fa-solid fa-user-check"></i> Your Listing
      </span>
    `;
  } else if (currentUser) {
    actionButtonHtml = `
      <button onclick="openRequestModal('${skill.id}')" class="btn btn-primary btn-sm">
        <i class="fa-solid fa-handshake"></i> Request Exchange
      </button>
    `;
  } else {
    actionButtonHtml = `
      <a href="${loginPath}" class="btn btn-outline btn-sm">
        <i class="fa-solid fa-arrow-right-to-bracket"></i> Login to Swap
      </a>
    `;
  }

  return `
    <div class="skill-card" data-category="${safeCat}" data-level="${escapeHTML(skill.offeredLevel)}">
      <!-- Header: Avatar, Name, Department & Skill Level -->
      <div class="skill-card-top">
        ${createAvatarHTML(skill.userName, skill.userAvatarColor, 'avatar-md')}
        <div class="skill-user-info">
          <h4>${safeName}</h4>
          <span>${safeBranch} • ${safeYear}</span>
        </div>
        <span class="badge ${levelBadgeClass}">${escapeHTML(skill.offeredLevel)}</span>
      </div>

      <!-- Skill Exchange Details -->
      <div class="skill-exchange-box">
        <div class="skill-row">
          <span class="skill-row-label">Teaches:</span>
          <strong style="color: var(--color-primary);">${safeOffered}</strong>
        </div>
        <div class="skill-row">
          <span class="skill-row-label">Wants:</span>
          <span style="font-weight: 600; color: var(--color-secondary);">${safeWanted}</span>
        </div>
      </div>

      <!-- Description snippet -->
      <p class="skill-card-desc">${safeDesc}</p>

      <!-- Bottom meta: Category, Mode, and Action Button -->
      <div class="skill-card-bottom">
        <div class="flex items-center gap-1" style="flex-wrap: wrap;">
          <span class="badge badge-category">
            <i class="fa-solid fa-tag"></i> ${safeCat}
          </span>
          <span class="badge" style="background-color: #F1F5F9; color: #64748B;">
            <i class="fa-solid fa-location-dot"></i> ${safeMode}
          </span>
        </div>
        <div>
          ${actionButtonHtml}
        </div>
      </div>
    </div>
  `;
}

/**
 * Filters and sorts skill listings based on user input.
 * @param {Array<object>} skills - Array of skills to process.
 * @param {object} criteria - Search query, category, level, and sort option.
 * @returns {Array<object>} Filtered and sorted skills array.
 */
function filterAndSortSkills(skills, criteria) {
  let result = [...skills];

  // 1. Search Query Filter
  if (criteria.search && criteria.search.trim() !== "") {
    const query = criteria.search.toLowerCase().trim();
    result = result.filter(s =>
      s.offeredSkill.toLowerCase().includes(query) ||
      s.wantedSkill.toLowerCase().includes(query) ||
      s.userName.toLowerCase().includes(query) ||
      s.description.toLowerCase().includes(query)
    );
  }

  // 2. Category Filter
  if (criteria.category && criteria.category !== "All") {
    result = result.filter(s => s.offeredCategory === criteria.category);
  }

  // 3. Level Filter
  if (criteria.level && criteria.level !== "All") {
    result = result.filter(s => s.offeredLevel === criteria.level);
  }

  // 4. Sort Filter
  if (criteria.sort === "newest") {
    result.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  } else if (criteria.sort === "name_asc") {
    result.sort((a, b) => a.userName.localeCompare(b.userName));
  } else if (criteria.sort === "level") {
    const order = { "Beginner": 1, "Intermediate": 2, "Advanced": 3 };
    result.sort((a, b) => (order[b.offeredLevel] || 0) - (order[a.offeredLevel] || 0));
  }

  return result;
}

/**
 * Initializes the Explore Skills page with interactive filters and search.
 */
function initExplorePage() {
  const container = document.getElementById("skillsGridContainer");
  if (!container) return;

  const searchInput = document.getElementById("skillSearchInput");
  const categorySelect = document.getElementById("categoryFilter");
  const levelSelect = document.getElementById("levelFilter");
  const sortSelect = document.getElementById("sortFilter");
  const resetBtn = document.getElementById("clearFiltersBtn");
  const countBadge = document.getElementById("resultsCountBadge");

  // Read URL query parameter for category (e.g., from categories cards on home page)
  const urlParams = new URLSearchParams(window.location.search);
  const categoryParam = urlParams.get("category");
  if (categoryParam && categorySelect) {
    categorySelect.value = categoryParam;
  }

  function render() {
    const criteria = {
      search: searchInput ? searchInput.value : "",
      category: categorySelect ? categorySelect.value : "All",
      level: levelSelect ? levelSelect.value : "All",
      sort: sortSelect ? sortSelect.value : "newest"
    };

    const allSkills = getAllSkills();
    const filtered = filterAndSortSkills(allSkills, criteria);
    const currentUser = getCurrentUser();

    if (countBadge) {
      countBadge.textContent = `${filtered.length} Skill${filtered.length === 1 ? '' : 's'} Found`;
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon"><i class="fa-solid fa-magnifying-glass"></i></div>
          <h3>No matching skills found</h3>
          <p>Try clearing your filters or search with different keywords.</p>
          <button onclick="document.getElementById('clearFiltersBtn').click()" class="btn btn-primary btn-sm mt-2">
            Reset Filters
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(skill => renderSkillCard(skill, currentUser)).join("");
  }

  // Bind filter change events
  if (searchInput) searchInput.addEventListener("input", render);
  if (categorySelect) categorySelect.addEventListener("change", render);
  if (levelSelect) levelSelect.addEventListener("change", render);
  if (sortSelect) sortSelect.addEventListener("change", render);

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      if (categorySelect) categorySelect.value = "All";
      if (levelSelect) levelSelect.value = "All";
      if (sortSelect) sortSelect.value = "newest";
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
      render();
    });
  }

  // Initial render
  render();
}

/**
 * Creates or updates a skill listing in LocalStorage.
 * @param {object} skillData - Skill form parameters.
 * @param {string|null} [editingSkillId=null] - If provided, updates existing skill.
 * @returns {object} Result object with success flag and errors if any.
 */
function saveSkillListing(skillData, editingSkillId = null) {
  const errors = {};
  const user = getCurrentUser();

  if (!user) {
    return { success: false, errors: { general: "Please log in first." } };
  }

  if (!skillData.offeredSkill || skillData.offeredSkill.trim().length < 2) {
    errors.offeredSkill = "Please enter the skill you can teach (at least 2 chars).";
  }
  if (!skillData.offeredCategory) {
    errors.offeredCategory = "Please select a category.";
  }
  if (!skillData.offeredLevel) {
    errors.offeredLevel = "Please choose your proficiency level.";
  }
  if (!skillData.wantedSkill || skillData.wantedSkill.trim().length < 2) {
    errors.wantedSkill = "Please specify the skill you want to learn in exchange.";
  }
  if (!skillData.description || skillData.description.trim().length < 10) {
    errors.description = "Please describe what you can teach (at least 10 characters).";
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  const allSkills = getAllSkills();

  if (editingSkillId) {
    // Edit existing skill
    const index = allSkills.findIndex(s => s.id === editingSkillId && s.userId === user.userId);
    if (index === -1) {
      return { success: false, errors: { general: "Listing not found or unauthorized." } };
    }

    allSkills[index] = {
      ...allSkills[index],
      offeredSkill: skillData.offeredSkill.trim(),
      offeredCategory: skillData.offeredCategory,
      offeredLevel: skillData.offeredLevel,
      description: skillData.description.trim(),
      wantedSkill: skillData.wantedSkill.trim(),
      learningMode: skillData.learningMode || "Both"
    };

    setData(STORAGE_KEYS.SKILLS, allSkills);
    return { success: true, isEdit: true, skill: allSkills[index] };
  } else {
    // Create new skill listing
    const newSkill = {
      id: generateId("skill"),
      userId: user.userId,
      userName: user.name,
      userBranch: user.branch,
      userYear: user.year,
      userAvatarColor: user.avatarColor,
      offeredSkill: skillData.offeredSkill.trim(),
      offeredCategory: skillData.offeredCategory,
      offeredLevel: skillData.offeredLevel,
      description: skillData.description.trim(),
      wantedSkill: skillData.wantedSkill.trim(),
      learningMode: skillData.learningMode || "Both",
      createdAt: new Date().toISOString().split("T")[0]
    };

    allSkills.unshift(newSkill);
    setData(STORAGE_KEYS.SKILLS, allSkills);
    return { success: true, isEdit: false, skill: newSkill };
  }
}

/**
 * Deletes a skill listing belonging to current student.
 * @param {string} skillId - ID of skill to delete.
 */
function deleteSkillListing(skillId) {
  const user = getCurrentUser();
  if (!user) return;

  if (confirm("Are you sure you want to delete this skill listing?")) {
    const allSkills = getAllSkills();
    const updated = allSkills.filter(s => !(s.id === skillId && s.userId === user.userId));
    setData(STORAGE_KEYS.SKILLS, updated);
    showToast("Skill listing deleted successfully.", "info");

    // Re-render table if on add-skill page
    if (typeof renderMySkillsTable === "function") {
      renderMySkillsTable();
    }
  }
}

/**
 * Renders the authenticated student's listings into a table on add-skill.html.
 */
function renderMySkillsTable() {
  const tableBody = document.getElementById("mySkillsTableBody");
  const countSpan = document.getElementById("mySkillsCount");
  if (!tableBody) return;

  const user = getCurrentUser();
  if (!user) return;

  const mySkills = getSkillsByUserId(user.userId);
  if (countSpan) countSpan.textContent = mySkills.length;

  if (mySkills.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center" style="padding: 2.5rem 1rem;">
          <i class="fa-solid fa-folder-open" style="font-size: 2rem; color: #CBD5E1; margin-bottom: 0.5rem; display: block;"></i>
          <strong>You haven't posted any skills yet.</strong><br>
          <span style="font-size: 0.85rem; color: #64748B;">Use the form above to add your first skill offer!</span>
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = mySkills.map(skill => `
    <tr>
      <td>
        <strong>${escapeHTML(skill.offeredSkill)}</strong>
        <div style="font-size: 0.75rem; color: #64748B;">${escapeHTML(skill.createdAt || 'Recent')}</div>
      </td>
      <td><span class="badge badge-category">${escapeHTML(skill.offeredCategory)}</span></td>
      <td><span class="badge badge-${escapeHTML(skill.offeredLevel.toLowerCase())}">${escapeHTML(skill.offeredLevel)}</span></td>
      <td><strong>${escapeHTML(skill.wantedSkill)}</strong></td>
      <td><span class="badge" style="background:#F1F5F9; color:#475569;">${escapeHTML(skill.learningMode || 'Both')}</span></td>
      <td>
        <div class="flex items-center gap-1">
          <button onclick="populateEditSkillForm('${skill.id}')" class="btn btn-outline btn-sm" title="Edit this skill">
            <i class="fa-solid fa-pen-to-square"></i> Edit
          </button>
          <button onclick="deleteSkillListing('${skill.id}')" class="btn btn-danger btn-sm" title="Delete listing">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join("");
}

/**
 * Pre-fills the Add Skill form with existing data for editing.
 * @param {string} skillId - ID of skill to edit.
 */
function populateEditSkillForm(skillId) {
  const skill = getSkillById(skillId);
  if (!skill) return;

  const form = document.getElementById("addSkillForm");
  if (!form) return;

  // Populate inputs
  document.getElementById("editingSkillId").value = skill.id;
  document.getElementById("offeredSkill").value = skill.offeredSkill;
  document.getElementById("offeredCategory").value = skill.offeredCategory;
  document.getElementById("offeredLevel").value = skill.offeredLevel;
  document.getElementById("description").value = skill.description;
  document.getElementById("wantedSkill").value = skill.wantedSkill;
  document.getElementById("learningMode").value = skill.learningMode || "Both";

  // Change submit button text
  const submitBtn = document.getElementById("submitSkillBtn");
  if (submitBtn) {
    submitBtn.innerHTML = `<i class="fa-solid fa-check"></i> Update Skill Listing`;
    submitBtn.classList.remove("btn-primary");
    submitBtn.classList.add("btn-secondary");
  }

  // Show cancel button
  const cancelBtn = document.getElementById("cancelEditBtn");
  if (cancelBtn) cancelBtn.style.display = "inline-flex";

  // Scroll smoothly to form
  form.scrollIntoView({ behavior: "smooth" });
}

/**
 * Resets the Add Skill form back to create mode.
 */
function resetSkillForm() {
  const form = document.getElementById("addSkillForm");
  if (!form) return;
  form.reset();

  const editingInput = document.getElementById("editingSkillId");
  if (editingInput) editingInput.value = "";

  const submitBtn = document.getElementById("submitSkillBtn");
  if (submitBtn) {
    submitBtn.innerHTML = `<i class="fa-solid fa-plus-circle"></i> Publish Skill Listing`;
    submitBtn.classList.add("btn-primary");
    submitBtn.classList.remove("btn-secondary");
  }

  const cancelBtn = document.getElementById("cancelEditBtn");
  if (cancelBtn) cancelBtn.style.display = "none";
}

/**
 * Initializes add-skill.html page event listeners.
 */
function initAddSkillPage() {
  const form = document.getElementById("addSkillForm");
  if (!form) return;

  renderMySkillsTable();

  // Cancel edit button handler
  const cancelBtn = document.getElementById("cancelEditBtn");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", resetSkillForm);
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const editingId = document.getElementById("editingSkillId").value || null;
    const skillData = {
      offeredSkill: document.getElementById("offeredSkill").value,
      offeredCategory: document.getElementById("offeredCategory").value,
      offeredLevel: document.getElementById("offeredLevel").value,
      description: document.getElementById("description").value,
      wantedSkill: document.getElementById("wantedSkill").value,
      learningMode: document.getElementById("learningMode").value
    };

    // Reset error hints
    document.querySelectorAll(".form-error").forEach(el => el.classList.remove("visible"));

    const result = saveSkillListing(skillData, editingId);
    if (!result.success) {
      if (result.errors) {
        Object.keys(result.errors).forEach(field => {
          const errEl = document.getElementById(`${field}Error`);
          if (errEl) {
            errEl.textContent = result.errors[field];
            errEl.classList.add("visible");
          }
        });
        showToast("Please correct the errors in the form.", "error");
      }
      return;
    }

    showToast(
      result.isEdit ? "Skill listing successfully updated!" : "New skill listing published to Explore!",
      "success"
    );

    resetSkillForm();
    renderMySkillsTable();
  });
}
