/* ==========================================================================
   SkillSwap - Main Application Orchestrator (main.js)
   Initializes page components, navigation, footers, profile editing,
   dashboard metrics, and recent activity feeds.
   ========================================================================== */

/**
 * Initializes the Landing Page (index.html) dynamic widgets:
 * - Featured students grid
 * - Counter metrics
 */
function initLandingPage() {
  const studentsContainer = document.getElementById("featuredStudentsGrid");
  if (!studentsContainer) return;

  const users = getData(STORAGE_KEYS.USERS) || [];
  const skills = getData(STORAGE_KEYS.SKILLS) || [];

  // Pick 4 featured students
  const featured = users.slice(0, 4);

  studentsContainer.innerHTML = featured.map(student => {
    // Find what this student teaches & wants
    const studentSkills = skills.filter(s => s.userId === student.id);
    const teaches = studentSkills.length > 0 ? studentSkills[0].offeredSkill : "General Mentoring";
    const wants = studentSkills.length > 0 ? studentSkills[0].wantedSkill : "Peer Collaboration";

    return `
      <div class="student-card card-hover">
        ${createAvatarHTML(student.name, student.avatarColor, 'avatar-lg')}
        <h4>${escapeHTML(student.name)}</h4>
        <span class="student-meta">${escapeHTML(student.branch)} • ${escapeHTML(student.year)}</span>
        
        <div class="student-pills">
          <div class="student-pill-item">
            <span style="color: #64748B;">Teaches:</span>
            <strong style="color: var(--color-primary);">${escapeHTML(teaches)}</strong>
          </div>
          <div class="student-pill-item">
            <span style="color: #64748B;">Wants:</span>
            <strong style="color: var(--color-secondary);">${escapeHTML(wants)}</strong>
          </div>
        </div>

        <div class="mt-3 w-full">
          <a href="pages/explore.html?search=${encodeURIComponent(student.name)}" class="btn btn-outline btn-sm btn-block">
            View Skill Offers
          </a>
        </div>
      </div>
    `;
  }).join("");

  // Update dynamic counters on landing page
  const totalSkillsEl = document.getElementById("heroStatSkills");
  const totalStudentsEl = document.getElementById("heroStatStudents");
  const totalSwapsEl = document.getElementById("heroStatSwaps");

  if (totalSkillsEl) totalSkillsEl.textContent = `${skills.length}+`;
  if (totalStudentsEl) totalStudentsEl.textContent = `${users.length}+`;
  if (totalSwapsEl) {
    const requests = getData(STORAGE_KEYS.REQUESTS) || [];
    totalSwapsEl.textContent = `${requests.length}+`;
  }
}

/**
 * Initializes registration form on register.html.
 */
function initRegisterPage() {
  const form = document.getElementById("registerForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const formData = {
      name: document.getElementById("regName").value,
      email: document.getElementById("regEmail").value,
      branch: document.getElementById("regBranch").value,
      year: document.getElementById("regYear").value,
      password: document.getElementById("regPassword").value,
      confirmPassword: document.getElementById("regConfirmPassword").value
    };

    // Reset visible error hints
    document.querySelectorAll(".form-error").forEach(el => el.classList.remove("visible"));

    const result = registerUser(formData);
    if (!result.success) {
      if (result.errors) {
        Object.keys(result.errors).forEach(key => {
          const errEl = document.getElementById(`${key}Error`);
          if (errEl) {
            errEl.textContent = result.errors[key];
            errEl.classList.add("visible");
          }
        });
        showToast("Please fix the highlighted validation errors.", "error");
      }
      return;
    }

    showToast(`Account created successfully! Welcome, ${escapeHTML(result.user.name)}.`, "success");

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 700);
  });
}

/**
 * Initializes login form on login.html.
 */
function initLoginPage() {
  const form = document.getElementById("loginForm");
  const demoBtn = document.getElementById("demoLoginBtn");

  if (demoBtn) {
    demoBtn.addEventListener("click", () => {
      loginDemoUser();
    });
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const email = document.getElementById("loginEmail").value;
      const password = document.getElementById("loginPassword").value;

      // Reset visible error hints
      document.querySelectorAll(".form-error").forEach(el => el.classList.remove("visible"));

      const result = loginUser(email, password);
      if (!result.success) {
        const errorEl = document.getElementById("loginGeneralError");
        if (errorEl) {
          errorEl.textContent = result.message;
          errorEl.classList.add("visible");
        }
        showToast(result.message, "error");
        return;
      }

      showToast(`Welcome back, ${escapeHTML(result.user.name)}!`, "success");

      setTimeout(() => {
        // Check if there was an auth redirect target
        const redirect = sessionStorage.getItem("skillswap_auth_redirect");
        if (redirect) {
          sessionStorage.removeItem("skillswap_auth_redirect");
          window.location.href = redirect;
        } else {
          window.location.href = "dashboard.html";
        }
      }, 600);
    });
  }
}

/**
 * Initializes the dashboard metrics on dashboard.html:
 * - Profile summary card
 * - Calculated request stats (Total, Pending, Accepted, Completed)
 * - Skills I Can Teach & Skills I Want to Learn lists
 * - Top 5 Recent Activity stream (requests + reviews)
 */
function initDashboardPage() {
  const session = getCurrentUser();
  if (!session) return;

  const users = getData(STORAGE_KEYS.USERS) || [];
  const user = users.find(u => u.id === session.userId) || session;

  // 1. Profile Summary Card
  const welcomeEl = document.getElementById("dashWelcomeName");
  const avatarWrap = document.getElementById("dashAvatarWrap");
  const metaEl = document.getElementById("dashProfileMeta");
  const bioEl = document.getElementById("dashProfileBio");
  const ratingBadge = document.getElementById("dashProfileRating");

  if (welcomeEl) welcomeEl.textContent = user.name;
  if (avatarWrap) avatarWrap.innerHTML = createAvatarHTML(user.name, user.avatarColor, 'avatar-lg');
  if (metaEl) metaEl.textContent = `${user.branch} • ${user.year}`;
  if (bioEl) bioEl.textContent = user.bio || "Engineering student enthusiastic about skill sharing.";

  if (ratingBadge && typeof getAverageRating === 'function') {
    const ratingObj = getAverageRating(user.id || user.userId);
    ratingBadge.innerHTML = `<i class="fa-solid fa-star"></i> ${ratingObj.average > 0 ? ratingObj.average.toFixed(1) : 'New'}`;
  }

  // 2. Calculated Real Requests Stats (Total, Pending, Accepted, Completed)
  const allRequests = getData(STORAGE_KEYS.REQUESTS) || [];
  const myRequests = allRequests.filter(r => r.senderId === session.userId || r.receiverId === session.userId);

  const totalCount = myRequests.length;
  const pendingCount = myRequests.filter(r => r.status === "Pending").length;
  const acceptedCount = myRequests.filter(r => r.status === "Accepted").length;
  const completedCount = myRequests.filter(r => r.status === "Completed").length;

  const statTotal = document.getElementById("dashStatTotal");
  const statPending = document.getElementById("dashStatPending");
  const statAccepted = document.getElementById("dashStatAccepted");
  const statCompleted = document.getElementById("dashStatCompleted");

  if (statTotal) statTotal.textContent = totalCount;
  if (statPending) statPending.textContent = pendingCount;
  if (statAccepted) statAccepted.textContent = acceptedCount;
  if (statCompleted) statCompleted.textContent = completedCount;

  // 3. Skills I Can Teach & Skills I Want to Learn Lists
  const allSkills = getData(STORAGE_KEYS.SKILLS) || [];
  const mySkills = allSkills.filter(s => s.userId === session.userId);

  const teachContainer = document.getElementById("dashTeachingSkillsList");
  const wantContainer = document.getElementById("dashWantedSkillsList");

  if (teachContainer) {
    if (mySkills.length === 0) {
      teachContainer.innerHTML = `
        <div class="empty-state" style="padding: 1.5rem 1rem;">
          <p style="font-size: 0.85rem; margin-bottom: 0.5rem;">You haven't listed any skills to teach yet.</p>
          <a href="add-skill.html" class="btn btn-primary btn-sm"><i class="fa-solid fa-plus"></i> Add Skill</a>
        </div>
      `;
    } else {
      teachContainer.innerHTML = mySkills.map(s => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.65rem 0.85rem; background: var(--color-bg-alt); border-radius: var(--radius-md); border: 1px solid var(--color-border);">
          <div>
            <strong style="color: var(--color-primary); font-size: 0.9rem;">${escapeHTML(s.offeredSkill)}</strong>
            <div style="font-size: 0.75rem; color: #64748B;">${escapeHTML(s.offeredCategory)}</div>
          </div>
          <span class="badge badge-${escapeHTML(s.offeredLevel.toLowerCase())}">${escapeHTML(s.offeredLevel)}</span>
        </div>
      `).join("");
    }
  }

  if (wantContainer) {
    if (mySkills.length === 0) {
      wantContainer.innerHTML = `
        <div class="empty-state" style="padding: 1.5rem 1rem;">
          <p style="font-size: 0.85rem; margin-bottom: 0.5rem;">No learning preferences specified yet.</p>
          <a href="explore.html" class="btn btn-outline btn-sm">Explore Skills</a>
        </div>
      `;
    } else {
      wantContainer.innerHTML = mySkills.map(s => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.65rem 0.85rem; background: var(--color-bg-alt); border-radius: var(--radius-md); border: 1px solid var(--color-border);">
          <div>
            <strong style="color: var(--color-secondary); font-size: 0.9rem;">${escapeHTML(s.wantedSkill)}</strong>
            <div style="font-size: 0.75rem; color: #64748B;">Preferred: ${escapeHTML(s.learningMode || 'Both')}</div>
          </div>
          <span class="badge badge-category">Exchange</span>
        </div>
      `).join("");
    }
  }

  // 4. Recent Activity Stream (5 Latest Requests & Reviews)
  const activityContainer = document.getElementById("dashRecentActivityList");
  if (activityContainer) {
    const allReviews = getData(STORAGE_KEYS.REVIEWS) || [];
    const activities = [];

    // Requests activities
    myRequests.forEach(r => {
      const isSender = r.senderId === session.userId;
      const otherName = isSender ? r.receiverName : r.senderName;
      let title = "";
      let icon = "fa-paper-plane";
      let badgeCls = "badge-pending";

      if (r.status === "Pending") {
        title = isSender
          ? `Sent exchange proposal to ${escapeHTML(otherName)} for "${escapeHTML(r.skillRequested)}"`
          : `Received proposal from ${escapeHTML(otherName)} offering "${escapeHTML(r.skillOffered)}"`;
        icon = isSender ? "fa-paper-plane" : "fa-inbox";
        badgeCls = "badge-pending";
      } else if (r.status === "Accepted") {
        title = `Swap agreement active with ${escapeHTML(otherName)} (${escapeHTML(r.skillRequested)})`;
        icon = "fa-handshake";
        badgeCls = "badge-accepted";
      } else if (r.status === "Completed") {
        title = `Skill exchange with ${escapeHTML(otherName)} completed`;
        icon = "fa-circle-check";
        badgeCls = "badge-completed";
      } else if (r.status === "Rejected") {
        title = `Proposal with ${escapeHTML(otherName)} was declined`;
        icon = "fa-xmark";
        badgeCls = "badge-rejected";
      }

      activities.push({
        title,
        date: r.date || "Recent",
        status: r.status,
        icon,
        badgeCls
      });
    });

    // Reviews activities
    allReviews.forEach(rev => {
      if (rev.toUserId === session.userId) {
        activities.push({
          title: `Received ${rev.rating}-star review from ${escapeHTML(rev.fromUserName)}: "${escapeHTML(rev.comment)}"`,
          date: rev.date || "Recent",
          status: "Review",
          icon: "fa-star",
          badgeCls: "badge-accepted"
        });
      } else if (rev.fromUserId === session.userId) {
        activities.push({
          title: `Left a ${rev.rating}-star review for ${escapeHTML(rev.toUserName)}`,
          date: rev.date || "Recent",
          status: "Feedback",
          icon: "fa-comment",
          badgeCls: "badge-category"
        });
      }
    });

    // Sort by date descending
    activities.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    const top5 = activities.slice(0, 5);

    if (top5.length === 0) {
      activityContainer.innerHTML = `
        <div class="empty-state" style="padding: 2rem 1rem;">
          <i class="fa-solid fa-clock-rotate-left" style="font-size: 2rem; color: #CBD5E1; margin-bottom: 0.5rem; display: block;"></i>
          <strong>No recent activity logged</strong>
          <p style="font-size: 0.85rem; color: #64748B;">Send proposals or complete swaps to see your campus activity feed.</p>
        </div>
      `;
    } else {
      activityContainer.innerHTML = top5.map(act => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.85rem 1rem; border-bottom: 1px solid var(--color-border); gap: 1rem; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div style="width: 36px; height: 36px; border-radius: var(--radius-full); background: var(--color-primary-light); color: var(--color-primary); display: flex; align-items: center; justify-content: center; font-size: 0.9rem; flex-shrink: 0;">
              <i class="fa-solid ${act.icon}"></i>
            </div>
            <div>
              <div style="font-size: 0.88rem; font-weight: 600; color: var(--color-text-main);">${act.title}</div>
              <div style="font-size: 0.75rem; color: #64748B;">${escapeHTML(act.date)}</div>
            </div>
          </div>
          <span class="badge ${act.badgeCls}">${escapeHTML(act.status)}</span>
        </div>
      `).join("");
    }
  }
}

/**
 * Initializes profile details on profile.html:
 * - Shows: avatar, name, branch, year, bio, email, joined date
 * - Skills I teach list and Skills I want to learn list
 * - Preferred learning mode
 * - Average rating with stars and review count
 * - Real review history from LocalStorage
 * - Edit Profile modal functionality with two-way sync across users, session, and skills
 */
function initProfilePage() {
  const session = getCurrentUser();
  if (!session) return;

  const users = getData(STORAGE_KEYS.USERS) || [];
  const user = users.find(u => u.id === session.userId) || session;

  // 1. Basic Profile Header
  const nameEl = document.getElementById("profileName");
  const metaEl = document.getElementById("profileMeta");
  const emailEl = document.getElementById("profileEmail");
  const joinedEl = document.getElementById("profileJoinedDate");
  const bioEl = document.getElementById("profileBio");
  const avatarWrap = document.getElementById("profileAvatarWrap");
  const ratingBadge = document.getElementById("profileRatingBadge");
  const ratingAvgText = document.getElementById("profileAverageRatingText");

  if (nameEl) nameEl.textContent = user.name;
  if (metaEl) metaEl.textContent = `${user.branch} • ${user.year}`;
  if (emailEl) emailEl.textContent = user.email;
  if (joinedEl) joinedEl.textContent = user.joinedDate || "2024-01-10";
  if (bioEl) bioEl.textContent = user.bio || "Engineering student enthusiastic about skill sharing.";
  if (avatarWrap) avatarWrap.innerHTML = createAvatarHTML(user.name, user.avatarColor, 'avatar-xl');

  // 2. Average Rating Computation
  if (typeof getAverageRating === 'function') {
    const ratingObj = getAverageRating(user.id || user.userId);
    if (ratingBadge) {
      ratingBadge.innerHTML = `<i class="fa-solid fa-star"></i> ${ratingObj.average > 0 ? ratingObj.average.toFixed(1) : 'New'}`;
    }
    if (ratingAvgText) {
      ratingAvgText.innerHTML = `${ratingObj.starsHtml} &nbsp;<strong>${ratingObj.formatted}</strong>`;
    }
  }

  // 3. Skills Lists & Learning Preference
  const allSkills = getData(STORAGE_KEYS.SKILLS) || [];
  const mySkills = allSkills.filter(s => s.userId === (user.id || user.userId));

  const teachContainer = document.getElementById("profileTeachingList");
  const wantContainer = document.getElementById("profileLearningList");
  const teachCount = document.getElementById("profileTeachingCount");
  const wantCount = document.getElementById("profileLearningCount");
  const prefEl = document.getElementById("profileLearningPreference");

  if (teachCount) teachCount.textContent = `${mySkills.length} Skill${mySkills.length === 1 ? '' : 's'}`;
  if (wantCount) wantCount.textContent = `${mySkills.length} Desired`;

  if (mySkills.length > 0 && prefEl) {
    prefEl.textContent = mySkills[0].learningMode || "Both (Online & In-Person)";
  }

  if (teachContainer) {
    if (mySkills.length === 0) {
      teachContainer.innerHTML = `<p style="font-size: 0.85rem; color: #64748B;">No skills posted yet. <a href="add-skill.html">Add a skill</a></p>`;
    } else {
      teachContainer.innerHTML = mySkills.map(s => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0.75rem; background: var(--color-bg-alt); border-radius: var(--radius-sm); border: 1px solid var(--color-border);">
          <strong style="color: var(--color-primary); font-size: 0.85rem;">${escapeHTML(s.offeredSkill)}</strong>
          <span class="badge badge-${escapeHTML(s.offeredLevel.toLowerCase())}">${escapeHTML(s.offeredLevel)}</span>
        </div>
      `).join("");
    }
  }

  if (wantContainer) {
    if (mySkills.length === 0) {
      wantContainer.innerHTML = `<p style="font-size: 0.85rem; color: #64748B;">No desired skills listed yet.</p>`;
    } else {
      wantContainer.innerHTML = mySkills.map(s => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0.75rem; background: var(--color-bg-alt); border-radius: var(--radius-sm); border: 1px solid var(--color-border);">
          <strong style="color: var(--color-secondary); font-size: 0.85rem;">${escapeHTML(s.wantedSkill)}</strong>
          <span class="badge" style="background:#F1F5F9; color:#475569;">${escapeHTML(s.learningMode || 'Both')}</span>
        </div>
      `).join("");
    }
  }

  // 4. Real Review History (Received)
  const reviewsContainer = document.getElementById("profileReviewsList");
  if (reviewsContainer && typeof getReviewsForUser === 'function') {
    const reviews = getReviewsForUser(user.id || user.userId);
    if (reviews.length === 0) {
      reviewsContainer.innerHTML = `
        <div class="empty-state" style="padding: 2.5rem 1rem;">
          <i class="fa-solid fa-star" style="font-size: 2rem; color: #CBD5E1; margin-bottom: 0.5rem; display: block;"></i>
          <strong>No reviews received yet</strong>
          <p style="font-size: 0.85rem; color: #64748B;">Complete exchanges with peers on campus to earn feedback and star ratings!</p>
        </div>
      `;
    } else {
      reviewsContainer.innerHTML = reviews.map(rev => `
        <div class="card mb-2" style="background-color: var(--color-bg-alt); border: 1px solid var(--color-border);">
          <div class="flex items-center justify-between mb-1" style="flex-wrap: wrap; gap: 0.5rem;">
            <div class="flex items-center gap-1">
              ${createAvatarHTML(rev.fromUserName, '#7C3AED', 'avatar-xs')}
              <strong>${escapeHTML(rev.fromUserName)}</strong>
              <span style="font-size: 0.75rem; color: #64748B;">• ${escapeHTML(rev.date || 'Recent')}</span>
            </div>
            <div>
              ${renderStarRating(rev.rating)}
            </div>
          </div>
          <p style="font-size: 0.85rem; color: #334155; margin-bottom: 0;">
            "${escapeHTML(rev.comment)}"
          </p>
        </div>
      `).join("");
    }
  }

  // 5. Edit Profile Modal Functionality
  const editModal = document.getElementById("editProfileModal");
  const openEditBtn = document.getElementById("openEditProfileBtn");
  const closeEditBtn = document.getElementById("closeEditProfileBtn");
  const cancelEditBtn = document.getElementById("cancelEditProfileBtn");
  const editForm = document.getElementById("editProfileForm");

  if (openEditBtn && editModal) {
    openEditBtn.onclick = () => {
      document.getElementById("editProfileName").value = user.name || "";
      document.getElementById("editProfileBranch").value = user.branch || "Computer Science";
      document.getElementById("editProfileYear").value = user.year || "2nd Year";
      document.getElementById("editProfileBio").value = user.bio || "";
      editModal.classList.add("active");
    };

    const closeModal = () => editModal.classList.remove("active");
    if (closeEditBtn) closeEditBtn.onclick = closeModal;
    if (cancelEditBtn) cancelEditBtn.onclick = closeModal;

    if (editForm) {
      editForm.onsubmit = (e) => {
        e.preventDefault();

        const newName = document.getElementById("editProfileName").value.trim();
        const newBranch = document.getElementById("editProfileBranch").value;
        const newYear = document.getElementById("editProfileYear").value;
        const newBio = document.getElementById("editProfileBio").value.trim();

        if (newName.length < 2) {
          showToast("Name must be at least 2 characters.", "error");
          return;
        }

        // 1. Update in skillswap_users
        const allUsers = getData(STORAGE_KEYS.USERS) || [];
        const uIdx = allUsers.findIndex(u => u.id === (user.id || user.userId));
        if (uIdx !== -1) {
          allUsers[uIdx].name = newName;
          allUsers[uIdx].branch = newBranch;
          allUsers[uIdx].year = newYear;
          allUsers[uIdx].bio = newBio;
          setData(STORAGE_KEYS.USERS, allUsers);
        }

        // 2. Update session snapshot
        setData(STORAGE_KEYS.SESSION, {
          userId: user.id || user.userId,
          name: newName,
          email: user.email,
          branch: newBranch,
          year: newYear,
          avatarColor: user.avatarColor
        });

        // 3. Update userName, userBranch, userYear on that user's skill listings
        const allSkillsList = getData(STORAGE_KEYS.SKILLS) || [];
        let skillsChanged = false;
        allSkillsList.forEach(s => {
          if (s.userId === (user.id || user.userId)) {
            s.userName = newName;
            s.userBranch = newBranch;
            s.userYear = newYear;
            skillsChanged = true;
          }
        });
        if (skillsChanged) {
          setData(STORAGE_KEYS.SKILLS, allSkillsList);
        }

        closeModal();
        showToast("Profile updated successfully!", "success");
        updateNavbar();
        initProfilePage();
      };
    }
  }
}

// Global bootstrap on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  // 1. Render dynamic navigation
  updateNavbar();

  // 2. Render footer
  renderFooter();

  // 3. Detect and initialize active page
  const currentPath = window.location.pathname.replace(/\\/g, '/');
  const currentFile = currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'index.html';

  if (currentFile === 'index.html' || currentFile === '') {
    initLandingPage();
  } else if (currentFile === 'explore.html') {
    initExplorePage();
  } else if (currentFile === 'add-skill.html') {
    initAddSkillPage();
  } else if (currentFile === 'register.html') {
    initRegisterPage();
  } else if (currentFile === 'login.html') {
    initLoginPage();
  } else if (currentFile === 'matches.html') {
    initMatchesPage();
  } else if (currentFile === 'requests.html') {
    initRequestsPage();
  } else if (currentFile === 'dashboard.html') {
    initDashboardPage();
  } else if (currentFile === 'profile.html') {
    initProfilePage();
  }
});
