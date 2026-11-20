/* ==========================================================================
   SkillSwap - Skill Matching Engine (matching.js)
   Computes smart 2-way and 1-way skill barter matches between students.
   Hides peers with active requests and routes proposals to matching skills.
   ========================================================================== */

/**
 * Calculates compatibility score between the active student and peers.
 * Scoring Rules:
 * - 95: Mutual (two-way) match (they teach what you want AND want what you teach)
 * - 75: One-way match (they teach what you want)
 * - 65: One-way match (they want what you teach)
 * Hides any peers who already have an active 'Pending' or 'Accepted' request with you.
 * @param {string} userId - The active user's ID.
 * @returns {Array<object>} List of matching students with match scores and details.
 */
function getSmartMatches(userId) {
  const allSkills = getData(STORAGE_KEYS.SKILLS) || [];
  const allUsers = getData(STORAGE_KEYS.USERS) || [];
  const allRequests = getData(STORAGE_KEYS.REQUESTS) || [];

  const mySkills = allSkills.filter(s => s.userId === userId);
  if (mySkills.length === 0) return [];

  // Identify peers with active Pending or Accepted requests to hide them
  const activePeerIds = new Set();
  allRequests.forEach(r => {
    if (r.status === "Pending" || r.status === "Accepted") {
      if (r.senderId === userId) activePeerIds.add(r.receiverId);
      if (r.receiverId === userId) activePeerIds.add(r.senderId);
    }
  });

  const otherUsers = allUsers.filter(u => u.id !== userId && !activePeerIds.has(u.id));

  const matches = [];

  // My offered and wanted skill lists (lowercased for fuzzy substring matching)
  const myOffered = mySkills.map(s => s.offeredSkill.toLowerCase());
  const myWanted = mySkills.map(s => s.wantedSkill.toLowerCase());

  otherUsers.forEach(peer => {
    const peerSkills = allSkills.filter(s => s.userId === peer.id);
    if (peerSkills.length === 0) return;

    let directMutualMatch = false;
    let peerTeachesWhatIWant = [];
    let peerWantsWhatITeach = [];
    let targetSkillId = null;

    peerSkills.forEach(ps => {
      const pOffered = ps.offeredSkill.toLowerCase();
      const pWanted = ps.wantedSkill.toLowerCase();

      // Check if peer teaches what I want
      const teachesMatch = myWanted.some(mw => pOffered.includes(mw) || mw.includes(pOffered));
      if (teachesMatch) {
        peerTeachesWhatIWant.push(ps.offeredSkill);
        // Prioritize opening proposal modal for the specific skill that matches what I want
        if (!targetSkillId) {
          targetSkillId = ps.id;
        }
      }

      // Check if peer wants what I teach
      const wantsMatch = myOffered.some(mo => pWanted.includes(mo) || mo.includes(pWanted));
      if (wantsMatch) {
        peerWantsWhatITeach.push(ps.wantedSkill);
      }
    });

    // Fallback target skill if peer doesn't teach what you want but wants what you teach
    if (!targetSkillId && peerSkills.length > 0) {
      targetSkillId = peerSkills[0].id;
    }

    // Scoring Rules implementation
    let score = 0;
    let matchTypeLabel = "";
    if (peerTeachesWhatIWant.length > 0 && peerWantsWhatITeach.length > 0) {
      directMutualMatch = true;
      score = 95; // Both directions
      matchTypeLabel = "95% Score • Mutual Match";
    } else if (peerTeachesWhatIWant.length > 0) {
      score = 75; // They teach what I want
      matchTypeLabel = "75% Score • Teaches What You Want";
    } else if (peerWantsWhatITeach.length > 0) {
      score = 65; // They want what I teach
      matchTypeLabel = "65% Score • Wants What You Teach";
    }

    if (score > 0) {
      matches.push({
        peer,
        peerSkills,
        targetSkillId,
        score,
        matchTypeLabel,
        isMutual: directMutualMatch,
        teachesYou: peerTeachesWhatIWant,
        wantsFromYou: peerWantsWhatITeach
      });
    }
  });

  // Sort highest score first
  return matches.sort((a, b) => b.score - a.score);
}

/**
 * Initializes and renders matches on matches.html.
 */
function initMatchesPage() {
  const container = document.getElementById("matchesListContainer");
  if (!container) return;

  const user = getCurrentUser();
  if (!user) return;

  const matches = getSmartMatches(user.userId);
  const countSpan = document.getElementById("matchesCountBadge");
  if (countSpan) {
    countSpan.textContent = `${matches.length} Compatible Peer${matches.length === 1 ? '' : 's'}`;
  }

  if (matches.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon"><i class="fa-solid fa-puzzle-piece"></i></div>
        <h3>No new matches available</h3>
        <p>You may already have active exchange requests with compatible peers, or you can add more skills to discover new study partners!</p>
        <a href="add-skill.html" class="btn btn-primary btn-sm mt-2">
          <i class="fa-solid fa-plus"></i> Post What You Can Teach
        </a>
      </div>
    `;
    return;
  }

  container.innerHTML = matches.map(m => {
    const badgeClass = m.isMutual ? 'badge-accepted' : (m.score >= 75 ? 'badge-category' : 'badge-intermediate');
    const safePeerName = escapeHTML(m.peer.name);
    const safeBranch = escapeHTML(m.peer.branch);
    const safeYear = escapeHTML(m.peer.year);
    const safeBio = escapeHTML(m.peer.bio);
    const safeTeaches = m.teachesYou.length > 0 ? m.teachesYou.map(t => escapeHTML(t)).join(', ') : 'Check their profile listings';
    const safeWants = m.wantsFromYou.length > 0 ? m.wantsFromYou.map(w => escapeHTML(w)).join(', ') : 'Various subjects';

    return `
      <div class="card card-hover mb-2">
        <div class="flex items-center justify-between" style="flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem;">
          <div class="flex items-center gap-2">
            ${createAvatarHTML(m.peer.name, m.peer.avatarColor, 'avatar-md')}
            <div>
              <h4 style="margin-bottom: 0.2rem;">${safePeerName}</h4>
              <span style="font-size: 0.8rem; color: #64748B;">${safeBranch} • ${safeYear}</span>
            </div>
          </div>

          <div class="flex items-center gap-1">
            <span class="badge ${badgeClass}" style="font-size: 0.85rem; padding: 0.4rem 0.85rem;">
              <i class="fa-solid ${m.isMutual ? 'fa-bolt' : 'fa-check'}"></i>
              ${escapeHTML(m.matchTypeLabel)}
            </span>
          </div>
        </div>

        <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; background: var(--color-bg-alt); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--color-border); margin-bottom: 1rem;">
          <div>
            <span style="font-size: 0.75rem; font-weight: 700; color: #64748B; text-transform: uppercase; display: block; margin-bottom: 0.35rem;">
              They Can Teach You:
            </span>
            <div style="font-size: 0.9rem; font-weight: 600; color: var(--color-primary);">
              ${safeTeaches}
            </div>
          </div>

          <div>
            <span style="font-size: 0.75rem; font-weight: 700; color: #64748B; text-transform: uppercase; display: block; margin-bottom: 0.35rem;">
              They Want From You:
            </span>
            <div style="font-size: 0.9rem; font-weight: 600; color: var(--color-secondary);">
              ${safeWants}
            </div>
          </div>
        </div>

        <div class="flex justify-between items-center" style="flex-wrap: wrap; gap: 0.75rem;">
          <span style="font-size: 0.85rem; color: #64748B;">
            ${safeBio}
          </span>
          <button onclick="openRequestModal('${m.targetSkillId}')" class="btn btn-primary btn-sm">
            <i class="fa-solid fa-handshake"></i> Send Swap Proposal
          </button>
        </div>
      </div>
    `;
  }).join("");
}
