/* ==========================================================================
   SkillSwap - Peer Reviews Module (reviews.js)
   Handles peer feedback, star ratings, review modal, rating averages,
   and testimonials after completed exchanges.
   ========================================================================== */

/**
 * Retrieves all peer reviews from LocalStorage.
 * @returns {Array<object>} List of reviews.
 */
function getAllReviews() {
  return getData(STORAGE_KEYS.REVIEWS) || [];
}

/**
 * Retrieves reviews received by a particular student.
 * @param {string} userId - User ID of the recipient.
 * @returns {Array<object>} Reviews for that user, newest first.
 */
function getReviewsForUser(userId) {
  const reviews = getAllReviews();
  return reviews
    .filter(r => r.toUserId === userId)
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

/**
 * Computes average star rating and review count for a student.
 * @param {string} userId - User ID of the recipient.
 * @returns {object} Object with average, count, formatted string, and stars HTML.
 */
function getAverageRating(userId) {
  const reviews = getReviewsForUser(userId);
  if (!reviews || reviews.length === 0) {
    return {
      average: 0,
      count: 0,
      formatted: "No ratings yet",
      starsHtml: renderStarRating(0)
    };
  }

  const sum = reviews.reduce((acc, curr) => acc + (Number(curr.rating) || 0), 0);
  const avg = Math.round((sum / reviews.length) * 10) / 10;

  return {
    average: avg,
    count: reviews.length,
    formatted: `${avg.toFixed(1)} / 5.0 (${reviews.length} review${reviews.length === 1 ? '' : 's'})`,
    starsHtml: renderStarRating(Math.round(avg))
  };
}

/**
 * Helper to generate star icons HTML for a numeric rating (1-5).
 * @param {number} rating - Score out of 5.
 * @returns {string} Font Awesome star HTML.
 */
function renderStarRating(rating = 5) {
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= rating) {
      stars += '<i class="fa-solid fa-star" style="color: #F59E0B; margin-right: 2px;"></i>';
    } else {
      stars += '<i class="fa-regular fa-star" style="color: #CBD5E1; margin-right: 2px;"></i>';
    }
  }
  return `<span class="rating-stars">${stars}</span>`;
}

/**
 * Opens an interactive review modal for a completed exchange.
 * Enforces security & business rules:
 * 1. Request must be Completed.
 * 2. User must be one of the two participants.
 * 3. Can only review once per reviewer per request.
 * @param {string} requestId - ID of the request to review.
 */
function openReviewModal(requestId) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    showToast("Please log in to leave a review.", "error");
    return;
  }

  const requests = typeof getAllRequests === 'function' ? getAllRequests() : (getData(STORAGE_KEYS.REQUESTS) || []);
  const req = requests.find(r => r.id === requestId);

  if (!req) {
    showToast("Exchange request not found.", "error");
    return;
  }

  // Rule 1: Request must be Completed
  if (req.status !== "Completed") {
    showToast("Reviews can only be submitted for completed exchanges.", "error");
    return;
  }

  // Rule 2: User must be a participant in this exchange
  if (req.senderId !== currentUser.userId && req.receiverId !== currentUser.userId) {
    showToast("You can only review exchanges you participated in.", "error");
    return;
  }

  // Rule 3: Only once per reviewer per request
  const allReviews = getAllReviews();
  const alreadyReviewed = allReviews.some(r => r.requestId === requestId && r.fromUserId === currentUser.userId);
  if (alreadyReviewed) {
    showToast("You have already submitted a review for this exchange.", "info");
    return;
  }

  // Determine who is being reviewed
  const isSender = currentUser.userId === req.senderId;
  const targetUserId = isSender ? req.receiverId : req.senderId;
  const targetUserName = isSender ? req.receiverName : req.senderName;
  const exchangedSkill = isSender ? req.skillRequested : req.skillOffered;

  let modal = document.getElementById("reviewModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "reviewModal";
    modal.className = "modal-backdrop";
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-box">
      <div class="flex items-center justify-between mb-2">
        <h3 style="font-size: 1.25rem;">
          <i class="fa-solid fa-star" style="color: #F59E0B;"></i> Leave Peer Review
        </h3>
        <button onclick="closeReviewModal()" style="background:transparent; border:none; font-size:1.25rem; cursor:pointer; color:#64748B;">&times;</button>
      </div>

      <p style="font-size: 0.85rem; color: #475569; margin-bottom: 1.25rem;">
        Rate your learning exchange with <strong>${escapeHTML(targetUserName)}</strong> for <strong>${escapeHTML(exchangedSkill)}</strong>.
      </p>

      <form id="submitReviewForm">
        <!-- Interactive 5-Star Rating Selector -->
        <div class="form-group text-center" style="margin-bottom: 1.25rem;">
          <label class="form-label text-center" style="justify-content: center; margin-bottom: 0.5rem;">Rating</label>
          <div class="star-rating-select" id="starRatingSelect" style="font-size: 1.75rem; cursor: pointer; color: #F59E0B; user-select: none;">
            <i class="fa-solid fa-star" data-rating="1"></i>
            <i class="fa-solid fa-star" data-rating="2"></i>
            <i class="fa-solid fa-star" data-rating="3"></i>
            <i class="fa-solid fa-star" data-rating="4"></i>
            <i class="fa-solid fa-star" data-rating="5"></i>
          </div>
          <input type="hidden" id="selectedStarRating" value="5">
          <span id="starRatingLabel" style="font-size: 0.8rem; font-weight: 600; color: #475569; display: block; margin-top: 0.35rem;">
            5 Stars (Excellent)
          </span>
        </div>

        <!-- Feedback Comment Field -->
        <div class="form-group">
          <label for="reviewCommentText" class="form-label">Feedback & Experience</label>
          <textarea id="reviewCommentText" class="form-textarea" rows="3" placeholder="Share how helpful this peer was, communication, and teaching style..." required minlength="5"></textarea>
          <span class="form-hint">At least 5 characters. Keep it constructive and helpful for peers.</span>
        </div>

        <div class="flex justify-between items-center mt-3">
          <button type="button" onclick="closeReviewModal()" class="btn btn-outline btn-sm">Cancel</button>
          <button type="submit" class="btn btn-primary btn-sm">
            <i class="fa-solid fa-paper-plane"></i> Submit Review
          </button>
        </div>
      </form>
    </div>
  `;

  // Activate modal
  modal.classList.add("active");

  // Star selector interactivity
  const starContainer = document.getElementById("starRatingSelect");
  const stars = starContainer.querySelectorAll("i");
  const ratingInput = document.getElementById("selectedStarRating");
  const ratingLabel = document.getElementById("starRatingLabel");

  const ratingDescriptions = {
    1: "1 Star (Needs Improvement)",
    2: "2 Stars (Fair)",
    3: "3 Stars (Good)",
    4: "4 Stars (Very Good)",
    5: "5 Stars (Excellent)"
  };

  function updateStars(val) {
    stars.forEach(s => {
      const r = Number(s.dataset.rating);
      if (r <= val) {
        s.className = "fa-solid fa-star";
      } else {
        s.className = "fa-regular fa-star";
      }
    });
    ratingInput.value = val;
    ratingLabel.textContent = ratingDescriptions[val] || `${val} Stars`;
  }

  stars.forEach(s => {
    s.addEventListener("click", () => {
      updateStars(Number(s.dataset.rating));
    });
    s.addEventListener("mouseover", () => {
      const hoverVal = Number(s.dataset.rating);
      stars.forEach(st => {
        st.className = Number(st.dataset.rating) <= hoverVal ? "fa-solid fa-star" : "fa-regular fa-star";
      });
    });
  });

  starContainer.addEventListener("mouseleave", () => {
    updateStars(Number(ratingInput.value));
  });

  // Submit Handler
  const form = document.getElementById("submitReviewForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const ratingVal = Number(ratingInput.value) || 5;
    const commentVal = document.getElementById("reviewCommentText").value.trim();

    if (commentVal.length < 5) {
      showToast("Please write a comment with at least 5 characters.", "error");
      return;
    }

    const newReview = {
      id: generateId("rev"),
      requestId: requestId,
      fromUserId: currentUser.userId,
      fromUserName: currentUser.name,
      toUserId: targetUserId,
      toUserName: targetUserName,
      rating: ratingVal,
      comment: commentVal,
      date: new Date().toISOString().split("T")[0]
    };

    const reviews = getAllReviews();
    reviews.unshift(newReview);
    setData(STORAGE_KEYS.REVIEWS, reviews);

    closeReviewModal();
    showToast(`Review for ${escapeHTML(targetUserName)} submitted successfully!`, "success");

    // Refresh UI where applicable
    if (typeof initRequestsPage === "function") {
      initRequestsPage();
    }
    if (typeof initProfilePage === "function") {
      initProfilePage();
    }
    if (typeof initDashboardPage === "function") {
      initDashboardPage();
    }
  });
}

/**
 * Closes the review modal dialog.
 */
function closeReviewModal() {
  const modal = document.getElementById("reviewModal");
  if (modal) {
    modal.classList.remove("active");
  }
}
