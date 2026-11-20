/* ==========================================================================
   SkillSwap - Storage Module (storage.js)
   Handles all LocalStorage operations, ID generation, seed data initialization,
   and demo data reset.
   ========================================================================== */

// Storage keys namespace prefix
const STORAGE_PREFIX = 'skillswap_';

const STORAGE_KEYS = {
  USERS: `${STORAGE_PREFIX}users`,
  SKILLS: `${STORAGE_PREFIX}skills`,
  REQUESTS: `${STORAGE_PREFIX}requests`,
  REVIEWS: `${STORAGE_PREFIX}reviews`,
  SESSION: `${STORAGE_PREFIX}session`
};

/**
 * Reads and parses data from LocalStorage.
 * @param {string} key - The localStorage key.
 * @returns {any|null} The parsed JSON data or null if not found.
 */
function getData(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error(`Error reading from localStorage for key: ${key}`, error);
    return null;
  }
}

/**
 * Serializes and writes data into LocalStorage.
 * @param {string} key - The localStorage key.
 * @param {any} value - The data value to store.
 */
function setData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to localStorage for key: ${key}`, error);
  }
}

/**
 * Removes an item from LocalStorage.
 * @param {string} key - The localStorage key.
 */
function removeData(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing item from localStorage for key: ${key}`, error);
  }
}

/**
 * Generates a unique string ID using a prefix, timestamp, and random number.
 * @param {string} [prefix='item'] - Prefix for the ID.
 * @returns {string} Unique identifier string.
 */
function generateId(prefix = 'item') {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 7);
  return `${prefix}_${timestamp}_${randomStr}`;
}

/**
 * Seeds sample mock data into LocalStorage if not already initialized.
 * Includes 8 students, 20 skill listings, 6 exchange requests, and 5 reviews.
 * Note: PASSWORDS ARE NEVER STORED for security and lab best practices!
 * @param {boolean} [force=false] - If true, overwrites existing data with initial seed.
 */
function seedInitialData(force = false) {
  if (!force && getData(STORAGE_KEYS.USERS)) {
    // Migration check: ensure seed requests and reviews meet Phase 2 consistency rules
    try {
      const existingReqs = getData(STORAGE_KEYS.REQUESTS);
      if (existingReqs && Array.isArray(existingReqs)) {
        let reqsUpdated = false;
        const r2 = existingReqs.find(r => r.id === "req_2");
        if (r2 && r2.status !== "Completed") {
          r2.status = "Completed";
          reqsUpdated = true;
        }
        if (!existingReqs.some(r => r.id === "req_7")) {
          existingReqs.push({
            id: "req_7",
            senderId: "user_2",
            senderName: "Priya Patel",
            receiverId: "user_8",
            receiverName: "Tanvi Mehta",
            skillOffered: "Figma UI/UX Design",
            skillRequested: "Vector Illustration",
            status: "Completed",
            message: "Hey Tanvi, let's exchange Figma UI tips for vector illustration techniques!",
            date: "2024-02-18"
          });
          reqsUpdated = true;
        }
        if (reqsUpdated) {
          setData(STORAGE_KEYS.REQUESTS, existingReqs);
        }

        const existingRevs = getData(STORAGE_KEYS.REVIEWS);
        if (existingRevs && Array.isArray(existingRevs)) {
          const r5 = existingRevs.find(r => r.id === "rev_5");
          if (r5 && r5.requestId === "req_1") {
            r5.requestId = "req_7";
            setData(STORAGE_KEYS.REVIEWS, existingRevs);
          }
        }
      }
    } catch (e) {
      console.warn("Seed data migration notice:", e);
    }
    return; // Already initialized
  }

  // 1. Eight Sample BTech Students (Rahul Verma is the primary Demo Student)
  const initialUsers = [
    {
      id: "user_demo",
      name: "Rahul Verma",
      email: "rahul@demo.edu",
      branch: "Computer Science",
      year: "2nd Year",
      bio: "Passionate about Web Development and Python. Looking to learn Acoustic Guitar and Spanish!",
      avatarColor: "#4F46E5",
      joinedDate: "2024-01-10"
    },
    {
      id: "user_2",
      name: "Priya Patel",
      email: "priya@demo.edu",
      branch: "Information Technology",
      year: "2nd Year",
      bio: "UI/UX enthusiast and Figma wizard. Wanting to strengthen my backend and Python skills.",
      avatarColor: "#7C3AED",
      joinedDate: "2024-01-12"
    },
    {
      id: "user_3",
      name: "Aarav Sharma",
      email: "aarav@demo.edu",
      branch: "Electronics & Comm.",
      year: "3rd Year",
      bio: "Fingerstyle guitarist and audio enthusiast. Looking to build portfolio websites with HTML/CSS.",
      avatarColor: "#059669",
      joinedDate: "2024-01-15"
    },
    {
      id: "user_4",
      name: "Ananya Iyer",
      email: "ananya@demo.edu",
      branch: "Mechanical Engineering",
      year: "2nd Year",
      bio: "Polyglot learning Spanish & German. Eager to master UI design tools like Figma.",
      avatarColor: "#DB2777",
      joinedDate: "2024-01-18"
    },
    {
      id: "user_5",
      name: "Rohan Gupta",
      email: "rohan@demo.edu",
      branch: "Computer Science",
      year: "1st Year",
      bio: "Competitive programming nerd proficient in C++ & STL. Looking to learn Web Dev.",
      avatarColor: "#2563EB",
      joinedDate: "2024-01-20"
    },
    {
      id: "user_6",
      name: "Sneha Kulkarni",
      email: "sneha@demo.edu",
      branch: "Civil Engineering",
      year: "3rd Year",
      bio: "Campus photographer and visual storyteller. Passionate about portrait editing & C++.",
      avatarColor: "#D97706",
      joinedDate: "2024-01-22"
    },
    {
      id: "user_7",
      name: "Vikram Singh",
      email: "vikram@demo.edu",
      branch: "Electrical Engineering",
      year: "4th Year",
      bio: "Math & circuit analysis mentor. Happy to assist juniors in calculus in exchange for Python.",
      avatarColor: "#0D9488",
      joinedDate: "2024-01-25"
    },
    {
      id: "user_8",
      name: "Tanvi Mehta",
      email: "tanvi@demo.edu",
      branch: "Computer Science",
      year: "2nd Year",
      bio: "Graphic designer and brand identity creator. Looking for web development collabs.",
      avatarColor: "#EA580C",
      joinedDate: "2024-01-28"
    }
  ];

  // 2. Twenty Skill Listings across 6 Categories
  const initialSkills = [
    // Programming (4)
    {
      id: "skill_1",
      userId: "user_demo",
      userName: "Rahul Verma",
      userBranch: "Computer Science",
      userYear: "2nd Year",
      userAvatarColor: "#4F46E5",
      offeredSkill: "Python Programming",
      offeredCategory: "Programming",
      offeredLevel: "Intermediate",
      description: "Learn Python fundamentals, data structures, OOP concepts, and mini-automation projects.",
      wantedSkill: "Acoustic Guitar",
      learningMode: "Both",
      createdAt: "2024-02-01"
    },
    {
      id: "skill_2",
      userId: "user_demo",
      userName: "Rahul Verma",
      userBranch: "Computer Science",
      userYear: "2nd Year",
      userAvatarColor: "#4F46E5",
      offeredSkill: "Web Frontend (HTML/CSS/JS)",
      offeredCategory: "Programming",
      offeredLevel: "Advanced",
      description: "Hands-on responsive web design using Flexbox, CSS Grid, DOM manipulation, and LocalStorage.",
      wantedSkill: "Spanish Basics",
      learningMode: "Online",
      createdAt: "2024-02-03"
    },
    {
      id: "skill_3",
      userId: "user_5",
      userName: "Rohan Gupta",
      userBranch: "Computer Science",
      userYear: "1st Year",
      userAvatarColor: "#2563EB",
      offeredSkill: "C++ & Data Structures",
      offeredCategory: "Programming",
      offeredLevel: "Advanced",
      description: "Algorithms, trees, graphs, sorting, and STL library walkthrough for lab exams & viva.",
      wantedSkill: "Web Frontend (HTML/CSS/JS)",
      learningMode: "In-Person",
      createdAt: "2024-02-04"
    },
    {
      id: "skill_4",
      userId: "user_8",
      userName: "Tanvi Mehta",
      userBranch: "Computer Science",
      userYear: "2nd Year",
      userAvatarColor: "#EA580C",
      offeredSkill: "Java & OOP Concepts",
      offeredCategory: "Programming",
      offeredLevel: "Intermediate",
      description: "Core Java syntax, inheritance, polymorphism, interfaces, and exception handling.",
      wantedSkill: "DSLR Photography Basics",
      learningMode: "Both",
      createdAt: "2024-02-05"
    },

    // Design (4)
    {
      id: "skill_5",
      userId: "user_2",
      userName: "Priya Patel",
      userBranch: "Information Technology",
      userYear: "2nd Year",
      userAvatarColor: "#7C3AED",
      offeredSkill: "Figma UI/UX Design",
      offeredCategory: "Design",
      offeredLevel: "Advanced",
      description: "Design systems, auto-layout, wireframing, and creating clickable modern mobile prototypes.",
      wantedSkill: "Python Programming",
      learningMode: "Both",
      createdAt: "2024-02-06"
    },
    {
      id: "skill_6",
      userId: "user_2",
      userName: "Priya Patel",
      userBranch: "Information Technology",
      userYear: "2nd Year",
      userAvatarColor: "#7C3AED",
      offeredSkill: "Canva Graphic Design",
      offeredCategory: "Design",
      offeredLevel: "Beginner",
      description: "Creating presentation decks, social media banners, event posters, and student club graphics.",
      wantedSkill: "C++ & Data Structures",
      learningMode: "Online",
      createdAt: "2024-02-07"
    },
    {
      id: "skill_7",
      userId: "user_8",
      userName: "Tanvi Mehta",
      userBranch: "Computer Science",
      userYear: "2nd Year",
      userAvatarColor: "#EA580C",
      offeredSkill: "Logo Design & Branding",
      offeredCategory: "Design",
      offeredLevel: "Intermediate",
      description: "Principles of memorable logo design, colour harmony, typography selection, and brand kits.",
      wantedSkill: "Web Frontend (HTML/CSS/JS)",
      learningMode: "Both",
      createdAt: "2024-02-08"
    },
    {
      id: "skill_8",
      userId: "user_8",
      userName: "Tanvi Mehta",
      userBranch: "Computer Science",
      userYear: "2nd Year",
      userAvatarColor: "#EA580C",
      offeredSkill: "Vector Illustration",
      offeredCategory: "Design",
      offeredLevel: "Advanced",
      description: "Vector bezier curves, flat character illustrations, and custom SVG icon drafting.",
      wantedSkill: "Acoustic Guitar",
      learningMode: "Online",
      createdAt: "2024-02-09"
    },

    // Music (3)
    {
      id: "skill_9",
      userId: "user_3",
      userName: "Aarav Sharma",
      userBranch: "Electronics & Comm.",
      userYear: "3rd Year",
      userAvatarColor: "#059669",
      offeredSkill: "Acoustic Guitar",
      offeredCategory: "Music",
      offeredLevel: "Intermediate",
      description: "Open chords, strumming rhythms, fingerpicking exercises, and playing popular acoustic songs.",
      wantedSkill: "Web Frontend (HTML/CSS/JS)",
      learningMode: "In-Person",
      createdAt: "2024-02-10"
    },
    {
      id: "skill_10",
      userId: "user_3",
      userName: "Aarav Sharma",
      userBranch: "Electronics & Comm.",
      userYear: "3rd Year",
      userAvatarColor: "#059669",
      offeredSkill: "Music Theory & Keyboard",
      offeredCategory: "Music",
      offeredLevel: "Beginner",
      description: "Reading sheet music, major & minor scales, circle of fifths, and basic keyboard chords.",
      wantedSkill: "Python Programming",
      learningMode: "Both",
      createdAt: "2024-02-11"
    },
    {
      id: "skill_11",
      userId: "user_2",
      userName: "Priya Patel",
      userBranch: "Information Technology",
      userYear: "2nd Year",
      userAvatarColor: "#7C3AED",
      offeredSkill: "Beatmaking & FL Studio",
      offeredCategory: "Music",
      offeredLevel: "Beginner",
      description: "Drum sequencing, sampling, synth melodies, and mixing lo-fi chill hip-hop tracks.",
      wantedSkill: "Engineering Mathematics",
      learningMode: "Online",
      createdAt: "2024-02-12"
    },

    // Languages (3)
    {
      id: "skill_12",
      userId: "user_4",
      userName: "Ananya Iyer",
      userBranch: "Mechanical Engineering",
      userYear: "2nd Year",
      userAvatarColor: "#DB2777",
      offeredSkill: "Spanish Basics",
      offeredCategory: "Languages",
      offeredLevel: "Beginner",
      description: "Everyday conversational greetings, basic grammar, verb conjugations, and vocabulary drills.",
      wantedSkill: "Python Programming",
      learningMode: "Both",
      createdAt: "2024-02-13"
    },
    {
      id: "skill_13",
      userId: "user_4",
      userName: "Ananya Iyer",
      userBranch: "Mechanical Engineering",
      userYear: "2nd Year",
      userAvatarColor: "#DB2777",
      offeredSkill: "German Level A1",
      offeredCategory: "Languages",
      offeredLevel: "Intermediate",
      description: "German sentence structure, noun genders (der/die/das), and conversational phrases.",
      wantedSkill: "Figma UI/UX Design",
      learningMode: "Online",
      createdAt: "2024-02-14"
    },
    {
      id: "skill_14",
      userId: "user_7",
      userName: "Vikram Singh",
      userBranch: "Electrical Engineering",
      userYear: "4th Year",
      userAvatarColor: "#0D9488",
      offeredSkill: "Spoken English & Fluency",
      offeredCategory: "Languages",
      offeredLevel: "Advanced",
      description: "Public speaking confidence, presentation delivery, group discussion skills, and campus interviews.",
      wantedSkill: "Python Programming",
      learningMode: "Both",
      createdAt: "2024-02-15"
    },

    // Academics (3)
    {
      id: "skill_15",
      userId: "user_7",
      userName: "Vikram Singh",
      userBranch: "Electrical Engineering",
      userYear: "4th Year",
      userAvatarColor: "#0D9488",
      offeredSkill: "Engineering Mathematics & Calculus",
      offeredCategory: "Academics",
      offeredLevel: "Advanced",
      description: "Differential equations, Laplace transforms, multiple integrals, and exam problem solving.",
      wantedSkill: "Python Programming",
      learningMode: "Both",
      createdAt: "2024-02-16"
    },
    {
      id: "skill_16",
      userId: "user_7",
      userName: "Vikram Singh",
      userBranch: "Electrical Engineering",
      userYear: "4th Year",
      userAvatarColor: "#0D9488",
      offeredSkill: "Circuit Analysis",
      offeredCategory: "Academics",
      offeredLevel: "Advanced",
      description: "KVL, KCL, Thevenin & Norton equivalent circuits, and AC power calculations.",
      wantedSkill: "C++ & Data Structures",
      learningMode: "In-Person",
      createdAt: "2024-02-17"
    },
    {
      id: "skill_17",
      userId: "user_5",
      userName: "Rohan Gupta",
      userBranch: "Computer Science",
      userYear: "1st Year",
      userAvatarColor: "#2563EB",
      offeredSkill: "Linear Algebra",
      offeredCategory: "Academics",
      offeredLevel: "Intermediate",
      description: "Matrices, determinants, eigenvalues, eigenvectors, and practical machine learning applications.",
      wantedSkill: "Spanish Basics",
      learningMode: "Online",
      createdAt: "2024-02-18"
    },

    // Photography (3)
    {
      id: "skill_18",
      userId: "user_6",
      userName: "Sneha Kulkarni",
      userBranch: "Civil Engineering",
      userYear: "3rd Year",
      userAvatarColor: "#D97706",
      offeredSkill: "DSLR Photography Basics",
      offeredCategory: "Photography",
      offeredLevel: "Intermediate",
      description: "Mastering the exposure triangle (ISO, Aperture, Shutter Speed), composition rules, and lighting.",
      wantedSkill: "C++ & Data Structures",
      learningMode: "In-Person",
      createdAt: "2024-02-19"
    },
    {
      id: "skill_19",
      userId: "user_6",
      userName: "Sneha Kulkarni",
      userBranch: "Civil Engineering",
      userYear: "3rd Year",
      userAvatarColor: "#D97706",
      offeredSkill: "Adobe Lightroom Photo Editing",
      offeredCategory: "Photography",
      offeredLevel: "Advanced",
      description: "Color grading, tone curves, masking, skin retouching, and batch processing workflow.",
      wantedSkill: "Figma UI/UX Design",
      learningMode: "Both",
      createdAt: "2024-02-20"
    },
    {
      id: "skill_20",
      userId: "user_6",
      userName: "Sneha Kulkarni",
      userBranch: "Civil Engineering",
      userYear: "3rd Year",
      userAvatarColor: "#D97706",
      offeredSkill: "Mobile Photography & Angles",
      offeredCategory: "Photography",
      offeredLevel: "Beginner",
      description: "Taking professional quality portraits and landscape shots using smartphone camera settings.",
      wantedSkill: "Canva Graphic Design",
      learningMode: "Both",
      createdAt: "2024-02-21"
    }
  ];

  // 3. Six Requests with Mixed Statuses (Pending, Accepted, Rejected, Completed)
  const initialRequests = [
    {
      id: "req_1",
      senderId: "user_2",
      senderName: "Priya Patel",
      receiverId: "user_demo",
      receiverName: "Rahul Verma",
      skillOffered: "Figma UI/UX Design",
      skillRequested: "Python Programming",
      status: "Pending",
      message: "Hey Rahul! I would love to trade Figma UI lessons for your Python tutorials.",
      date: "2024-02-22"
    },
    {
      id: "req_2",
      senderId: "user_3",
      senderName: "Aarav Sharma",
      receiverId: "user_demo",
      receiverName: "Rahul Verma",
      skillOffered: "Acoustic Guitar",
      skillRequested: "Web Frontend (HTML/CSS/JS)",
      status: "Completed",
      message: "Hi Rahul, let's exchange guitar lessons for frontend web dev help!",
      date: "2024-02-20"
    },
    {
      id: "req_3",
      senderId: "user_5",
      senderName: "Rohan Gupta",
      receiverId: "user_6",
      receiverName: "Sneha Kulkarni",
      skillOffered: "C++ & Data Structures",
      skillRequested: "DSLR Photography Basics",
      status: "Rejected",
      message: "Looking to swap C++ basics for photography tips on weekends.",
      date: "2024-02-18"
    },
    {
      id: "req_4",
      senderId: "user_4",
      senderName: "Ananya Iyer",
      receiverId: "user_demo",
      receiverName: "Rahul Verma",
      skillOffered: "Spanish Basics",
      skillRequested: "Python Programming",
      status: "Completed",
      message: "Spanish conversation exchange for Python loops & dictionary practice.",
      date: "2024-02-15"
    },
    {
      id: "req_5",
      senderId: "user_7",
      senderName: "Vikram Singh",
      receiverId: "user_demo",
      receiverName: "Rahul Verma",
      skillOffered: "Engineering Mathematics & Calculus",
      skillRequested: "Python Programming",
      status: "Accepted",
      message: "Ready to help you ace calculus in return for practical Python scripting.",
      date: "2024-02-17"
    },
    {
      id: "req_6",
      senderId: "user_8",
      senderName: "Tanvi Mehta",
      receiverId: "user_3",
      receiverName: "Aarav Sharma",
      skillOffered: "Logo Design & Branding",
      skillRequested: "Acoustic Guitar",
      status: "Pending",
      message: "Can design a custom guitar club logo in exchange for chord progressions.",
      date: "2024-02-23"
    },
    {
      id: "req_7",
      senderId: "user_2",
      senderName: "Priya Patel",
      receiverId: "user_8",
      receiverName: "Tanvi Mehta",
      skillOffered: "Figma UI/UX Design",
      skillRequested: "Vector Illustration",
      status: "Completed",
      message: "Hey Tanvi, let's exchange Figma UI tips for vector illustration techniques!",
      date: "2024-02-18"
    }
  ];

  // 4. Five Reviews (Every review belongs to a Completed exchange between those users)
  const initialReviews = [
    {
      id: "rev_1",
      requestId: "req_2",
      fromUserId: "user_3",
      fromUserName: "Aarav Sharma",
      toUserId: "user_demo",
      toUserName: "Rahul Verma",
      rating: 5,
      comment: "Super patient teacher! Helped me build my first responsive web portfolio using CSS Grid in two sessions.",
      date: "2024-02-21"
    },
    {
      id: "rev_2",
      requestId: "req_4",
      fromUserId: "user_4",
      fromUserName: "Ananya Iyer",
      toUserId: "user_demo",
      toUserName: "Rahul Verma",
      rating: 5,
      comment: "Rahul explains programming concepts with clear real-world examples. Highly recommended!",
      date: "2024-02-16"
    },
    {
      id: "rev_3",
      requestId: "req_4",
      fromUserId: "user_demo",
      fromUserName: "Rahul Verma",
      toUserId: "user_4",
      toUserName: "Ananya Iyer",
      rating: 5,
      comment: "Ananya made Spanish pronunciation so easy to grasp. Enjoyed every minute of our exchange.",
      date: "2024-02-16"
    },
    {
      id: "rev_4",
      requestId: "req_2",
      fromUserId: "user_demo",
      fromUserName: "Rahul Verma",
      toUserId: "user_3",
      toUserName: "Aarav Sharma",
      rating: 5,
      comment: "Aarav is an awesome guitar mentor. I can now transition between G, C, and D chords cleanly!",
      date: "2024-02-21"
    },
    {
      id: "rev_5",
      requestId: "req_7",
      fromUserId: "user_2",
      fromUserName: "Priya Patel",
      toUserId: "user_8",
      toUserName: "Tanvi Mehta",
      rating: 5,
      comment: "Tanvi's vector illustrations are top-notch. She taught me SVG pen tool tricks effectively.",
      date: "2024-02-19"
    }
  ];

  // Write all seed data to LocalStorage
  setData(STORAGE_KEYS.USERS, initialUsers);
  setData(STORAGE_KEYS.SKILLS, initialSkills);
  setData(STORAGE_KEYS.REQUESTS, initialRequests);
  setData(STORAGE_KEYS.REVIEWS, initialReviews);
  
  console.log("SkillSwap: Sample seed data successfully initialized.");
}

/**
 * Resets all application data to the factory sample seed data.
 * Useful for viva demonstrations and lab evaluation.
 */
function resetDemoData() {
  if (confirm("Reset SkillSwap to initial sample data? All newly added skills or requests will be restored to defaults.")) {
    seedInitialData(true);
    // Also set demo student as active session for convenience
    const demoUser = getData(STORAGE_KEYS.USERS)[0];
    setData(STORAGE_KEYS.SESSION, {
      userId: demoUser.id,
      name: demoUser.name,
      email: demoUser.email,
      branch: demoUser.branch,
      year: demoUser.year,
      avatarColor: demoUser.avatarColor
    });
    
    if (typeof showToast === 'function') {
      showToast("Demo data successfully reset! Welcome to SkillSwap.", "success");
    } else {
      alert("Demo data successfully reset!");
    }
    setTimeout(() => {
      window.location.reload();
    }, 600);
  }
}

// Automatically seed data on file load
seedInitialData();
