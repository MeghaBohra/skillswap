/* ==========================================================================
   SkillSwap - Requests Module (requests.js)
   Handles creating exchange requests, displaying swap proposals modal,
   preventing duplicate requests, and managing request statuses.
   ========================================================================== */

/**
 * Retrieves all exchange requests from LocalStorage.
 * @returns {Array<object>} List of request objects.
 */
function getAllRequests() {
  return getData(STORAGE_KEYS.REQUESTS) || [];
}

/**
 * Checks if a user has already reviewed a completed request.
 * @param {string} requestId - The request ID.
 * @param {string} userId - ID of the user.
 * @returns {boolean} True if already reviewed.
 */
function hasUserReviewedRequest(requestId, userId) {
  const reviews = typeof getAllReviews === 'function' ? getAllReviews() : (getData(STORAGE_KEYS.REVIEWS) || []);
  return reviews.some(rev => rev.requestId === requestId && rev.fromUserId === userId);
}

/**
 * Opens an interactive proposal modal to send an exchange request to a peer.
 * Validates that no duplicate active request exists.
 * @param {string} targetSkillId - The skill ID the user wants to learn.
 */
function openRequestModal(targetSkillId) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    showToast("Please log in to send a skill swap request.", "info");
    const inSub = isSubPage();
    window.location.href = inSub ? "login.html" : "pages/login.html";
    return;
  }

  const targetSkill = getSkillById(targetSkillId);
  if (!targetSkill) {
    showToast("Skill listing not found.", "error");
    return;
  }

  if (targetSkill.userId === currentUser.userId) {
    showToast("You cannot request an exchange with your own listing!", "info");
    return;
  }

  // Find what skills the current user can offer
  const mySkills = getSkillsByUserId(currentUser.userId);

  let modal = document.getElementById("requestModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "requestModal";
    modal.className = "modal-backdrop";
    document.body.appendChild(modal);
  }

  // Populate options of skills user can offer in exchange
  let skillOptionsHtml = "";
  if (mySkills.length > 0) {
    skillOptionsHtml = mySkills.map(s => `
      <option value="${escapeHTML(s.offeredSkill)}">${escapeHTML(s.offeredSkill)} (${escapeHTML(s.offeredCategory)})</option>
    `).join("");
  } else {
    skillOptionsHtml = `
      <option value="General Tutoring & Notes">General Tutoring & Notes</option>
      <option value="Lab Work & Problem Solving">Lab Work & Problem Solving</option>
    `;
  }

  modal.innerHTML = `
    <div class="modal-box">
      <div class="flex items-center justify-between mb-2">
        <h3 style="font-size: 1.25rem;">
          <i class="fa-solid fa-handshake" style="color: var(--color-primary);"></i> Propose Skill Swap
        </h3>
        <button onclick="closeRequestModal()" style="background:transparent; border:none; font-size:1.25rem; cursor:pointer; color:#64748B;">&times;</button>
      </div>

      <p style="font-size: 0.85rem; margin-bottom: 1.25rem;">
        You are requesting to learn <strong>${escapeHTML(targetSkill.offeredSkill)}</strong> from <strong>${escapeHTML(targetSkill.userName)}</strong>.
      </p>

      <form id="sendRequestForm">
        <div class="form-group">
          <label class="form-label">What skill will you offer in exchange?</label>
          <select id="modalOfferedSkill" class="form-select" required>
            ${skillOptionsHtml}
          </select>
          <span class="form-hint">Choose from your posted skills or academic topics.</span>
        </div>

        <div class="form-group">
          <label class="form-label">Introductory Message to ${escapeHTML(targetSkill.userName.split(' ')[0])}</label>
          <textarea id="modalMessage" class="form-textarea" rows="3" placeholder="Hi! I saw your listing and would love to exchange lessons..." required>Hey ${escapeHTML(targetSkill.userName.split(' ')[0])}, let's exchange skills! I can teach you in return.</textarea>
        </div>

        <div class="flex justify-between items-center mt-3">
          <button type="button" onclick="closeRequestModal()" class="btn btn-outline btn-sm">Cancel</button>
          <button type="submit" class="btn btn-primary btn-sm">
            <i class="fa-solid fa-paper-plane"></i> Send Exchange Proposal
          </button>
        </div>
      </form>
    </div>
  `;

  // Activate backdrop
  modal.classList.add("active");

  // Handle form submit with duplicate check
  const form = document.getElementById("sendRequestForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const offeredSkill = document.getElementById("modalOfferedSkill").value.trim();
    const message = document.getElementById("modalMessage").value.trim();

    // Check for duplicate pending or accepted request
    const existingRequests = getAllRequests();
    const duplicate = existingRequests.find(r =>
      r.senderId === currentUser.userId &&
      r.receiverId === targetSkill.userId &&
      r.skillRequested.toLowerCase() === targetSkill.offeredSkill.toLowerCase() &&
      (r.status === "Pending" || r.status === "Accepted")
    );

    if (duplicate) {
      showToast(`You already have an active (${duplicate.status}) request for "${escapeHTML(targetSkill.offeredSkill)}" with ${escapeHTML(targetSkill.userName)}.`, "error");
      return;
    }

    const newRequest = {
      id: generateId("req"),
      senderId: currentUser.userId,
      senderName: currentUser.name,
      receiverId: targetSkill.userId,
      receiverName: targetSkill.userName,
      skillOffered: offeredSkill,
      skillRequested: targetSkill.offeredSkill,
      status: "Pending",
      message: message,
      date: new Date().toISOString().split("T")[0]
    };

    existingRequests.unshift(newRequest);
    setData(STORAGE_KEYS.REQUESTS, existingRequests);

    closeRequestModal();
    showToast(`Swap request sent to ${escapeHTML(targetSkill.userName)}!`, "success");

    // If currently on requests page or matches page, refresh list
    if (typeof initRequestsPage === "function") {
      initRequestsPage();
    }
    if (typeof initMatchesPage === "function") {
      initMatchesPage();
    }
  });
}

/**
 * Closes the proposal modal dialog.
 */
function closeRequestModal() {
  const modal = document.getElementById("requestModal");
  if (modal) {
    modal.classList.remove("active");
  }
}

/**
 * Updates the status of an exchange request.
 * Enforces permissions:
 * - Only receiver can Accept or Decline.
 * - Both sender and receiver can mark an Accepted request as Completed.
 * @param {string} requestId - ID of the request.
 * @param {'Accepted'|'Rejected'|'Completed'} newStatus - New status value.
 */
function updateRequestStatus(requestId, newStatus) {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  const requests = getAllRequests();
  const index = requests.findIndex(r => r.id === requestId);

  if (index === -1) {
    showToast("Request not found.", "error");
    return;
  }

  const req = requests[index];

  // Permission checks
  if (newStatus === 'Accepted' || newStatus === 'Rejected') {
    if (req.receiverId !== currentUser.userId) {
      showToast("Only the request recipient can accept or decline proposals.", "error");
      return;
    }
  }

  if (newStatus === 'Completed') {
    if (req.status !== 'Accepted') {
      showToast("Only accepted requests can be marked as completed.", "error");
      return;
    }
    if (req.senderId !== currentUser.userId && req.receiverId !== currentUser.userId) {
      showToast("You are not a participant in this exchange.", "error");
      return;
    }
  }

  requests[index].status = newStatus;
  setData(STORAGE_KEYS.REQUESTS, requests);

  showToast(`Request marked as "${newStatus}".`, "success");

  if (typeof initRequestsPage === "function") {
    initRequestsPage();
  }
  if (typeof initDashboardPage === "function") {
    initDashboardPage();
  }
}

/**
 * Renders the Requests page (pages/requests.html) with tabs for Incoming and Outgoing.
 */
function initRequestsPage() {
  const incomingContainer = document.getElementById("incomingRequestsList");
  const outgoingContainer = document.getElementById("outgoingRequestsList");
  if (!incomingContainer || !outgoingContainer) return;

  const user = getCurrentUser();
  if (!user) return;

  const allRequests = getAllRequests();
  const incoming = allRequests.filter(r => r.receiverId === user.userId);
  const outgoing = allRequests.filter(r => r.senderId === user.userId);

  // Status badge helper
  const getBadge = (status) => {
    let cls = "badge-pending";
    if (status === "Accepted") cls = "badge-accepted";
    if (status === "Rejected") cls = "badge-rejected";
    if (status === "Completed") cls = "badge-completed";
    return `<span class="badge ${cls}">${status}</span>`;
  };

  // Render Incoming Proposals
  if (incoming.length === 0) {
    incomingContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon"><i class="fa-solid fa-inbox"></i></div>
        <h4>No incoming requests yet</h4>
        <p>When peers want to swap skills with you, their proposals will show up here.</p>
      </div>
    `;
  } else {
    incomingContainer.innerHTML = incoming.map(r => {
      const alreadyReviewed = hasUserReviewedRequest(r.id, user.userId);
      return `
        <div class="card mb-2">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              ${createAvatarHTML(r.senderName, '#4F46E5', 'avatar-sm')}
              <div>
                <strong>${escapeHTML(r.senderName)}</strong>
                <div style="font-size: 0.75rem; color: #64748B;">Date: ${r.date}</div>
              </div>
            </div>
            <div>${getBadge(r.status)}</div>
          </div>

          <div style="background: var(--color-bg-alt); padding: 0.75rem 1rem; border-radius: var(--radius-md); font-size: 0.85rem; margin-bottom: 0.75rem;">
            <div><strong style="color: var(--color-primary);">${escapeHTML(r.senderName)}</strong> teaches: <strong>${escapeHTML(r.skillOffered)}</strong></div>
            <div>In exchange for your: <strong>${escapeHTML(r.skillRequested)}</strong></div>
          </div>

          <p style="font-size: 0.85rem; font-style: italic; color: #475569; margin-bottom: 1rem;">"${escapeHTML(r.message)}"</p>

          <div class="flex items-center gap-1 justify-between" style="border-top: 1px solid var(--color-border); padding-top: 0.75rem; flex-wrap: wrap;">
            <span style="font-size: 0.75rem; color: #64748B;">Actions:</span>
            <div class="flex gap-1" style="align-items: center;">
              ${r.status === 'Pending' ? `
                <button onclick="updateRequestStatus('${r.id}', 'Accepted')" class="btn btn-primary btn-sm">
                  <i class="fa-solid fa-check"></i> Accept
                </button>
                <button onclick="updateRequestStatus('${r.id}', 'Rejected')" class="btn btn-outline btn-sm" style="color: #DC2626; border-color: #FECACA;">
                  <i class="fa-solid fa-xmark"></i> Decline
                </button>
              ` : ''}
              ${r.status === 'Accepted' ? `
                <button onclick="updateRequestStatus('${r.id}', 'Completed')" class="btn btn-secondary btn-sm">
                  <i class="fa-solid fa-flag-checkered"></i> Mark Completed
                </button>
              ` : ''}
              ${r.status === 'Completed' ? `
                ${!alreadyReviewed ? `
                  <button onclick="openReviewModal('${r.id}')" class="btn btn-primary btn-sm">
                    <i class="fa-solid fa-star"></i> Leave a Review
                  </button>
                ` : `
                  <span class="badge badge-accepted">
                    <i class="fa-solid fa-circle-check"></i> Reviewed
                  </span>
                `}
              ` : ''}
              ${r.status === 'Rejected' ? `
                <span style="font-size: 0.8rem; color: #DC2626; font-weight: 600;">Declined</span>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  // Render Outgoing Requests
  if (outgoing.length === 0) {
    outgoingContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon"><i class="fa-solid fa-paper-plane"></i></div>
        <h4>No outgoing requests sent</h4>
        <p>Explore skills to propose learning exchanges with campus peers!</p>
        <a href="explore.html" class="btn btn-primary btn-sm mt-2">Explore Skills</a>
      </div>
    `;
  } else {
    outgoingContainer.innerHTML = outgoing.map(r => {
      const alreadyReviewed = hasUserReviewedRequest(r.id, user.userId);
      return `
        <div class="card mb-2">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              ${createAvatarHTML(r.receiverName, '#7C3AED', 'avatar-sm')}
              <div>
                <strong>To: ${escapeHTML(r.receiverName)}</strong>
                <div style="font-size: 0.75rem; color: #64748B;">Date: ${r.date}</div>
              </div>
            </div>
            <div>${getBadge(r.status)}</div>
          </div>

          <div style="background: var(--color-bg-alt); padding: 0.75rem 1rem; border-radius: var(--radius-md); font-size: 0.85rem; margin-bottom: 0.75rem;">
            <div>You offered: <strong>${escapeHTML(r.skillOffered)}</strong></div>
            <div>Requested skill: <strong>${escapeHTML(r.skillRequested)}</strong></div>
          </div>

          <p style="font-size: 0.85rem; color: #64748B; margin-bottom: 0.75rem;">"${escapeHTML(r.message)}"</p>

          <div class="flex items-center gap-1 justify-between" style="border-top: 1px solid var(--color-border); padding-top: 0.75rem; flex-wrap: wrap;">
            <span style="font-size: 0.75rem; color: #64748B;">Status:</span>
            <div class="flex gap-1" style="align-items: center;">
              ${r.status === 'Pending' ? `
                <span class="badge badge-pending">Awaiting Peer Response</span>
              ` : ''}
              ${r.status === 'Accepted' ? `
                <button onclick="updateRequestStatus('${r.id}', 'Completed')" class="btn btn-secondary btn-sm" title="Mark this swap completed">
                  <i class="fa-solid fa-flag-checkered"></i> Mark Completed
                </button>
              ` : ''}
              ${r.status === 'Completed' ? `
                ${!alreadyReviewed ? `
                  <button onclick="openReviewModal('${r.id}')" class="btn btn-primary btn-sm">
                    <i class="fa-solid fa-star"></i> Leave a Review
                  </button>
                ` : `
                  <span class="badge badge-accepted">
                    <i class="fa-solid fa-circle-check"></i> Reviewed
                  </span>
                `}
              ` : ''}
              ${r.status === 'Rejected' ? `
                <span class="badge badge-rejected">Proposal Declined</span>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }).join("");
  }
}
