/**
 * UNSPOKEN — A place where hearts find words.
 * Vanilla JavaScript ES6+ Architecture
 * 
 * Strict mode, defensive programming, Supabase integration with graceful
 * demo/local sanctuary fallback, accessibility, and magical animations.
 */
"use strict";

/* ==========================================================================
   1. CONFIGURATION & BACKEND CONNECTION
   ========================================================================== */
// Replace these with your project's Supabase credentials to enable live cross-device sharing.
const SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_PUBLISHABLE_KEY";

// Optional secure backend endpoint for the AI Companion (e.g., Cloud Function or Express proxy)
const AI_ENDPOINT = "";

// State management
const state = {
  supabaseClient: null,
  connectionStatus: "checking", // "connected" | "offline" | "demo"
  confessions: [],
  advicePosts: [],
  kindnessMessages: [],
  healingEntries: [],
  activeCategory: "all",
  searchQuery: "",
  visibleConfessionsCount: 6,
  userReactions: JSON.parse(localStorage.getItem("unspoken_reactions") || "{}"),
  privateLetters: JSON.parse(localStorage.getItem("unspoken_private_letters") || "[]"),
  breathingInterval: null,
  breathingStep: 0,
  activeReportTarget: null,
  stars: [],
  fireflies: [],
  lastReminderIndex: -1
};

/* ==========================================================================
   2. INITIAL PRE-SEEDED SANCTUARY DATA (Used in Demo / Offline Mode)
   ========================================================================== */
const SEED_CONFESSIONS = [
  {
    id: "seed-conf-1",
    message: "I smile and ask everyone how they are doing every single morning, but no one ever stops to notice that my eyes look so tired.",
    category: "Loneliness",
    visibility: "public",
    moderation_status: "approved",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    hearts: 28,
    hugs: 42
  },
  {
    id: "seed-conf-2",
    message: "I finally blocked your number today. Not because I stopped loving you, but because holding onto you was slowly breaking every piece of me.",
    category: "Heartbreak",
    visibility: "public",
    moderation_status: "approved",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
    hearts: 64,
    hugs: 89
  },
  {
    id: "seed-conf-3",
    message: "I pretend I have my career and entire future figured out, but inside I feel like a child lost in a supermarket looking for a familiar face.",
    category: "Stress",
    visibility: "public",
    moderation_status: "approved",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
    hearts: 51,
    hugs: 37
  },
  {
    id: "seed-conf-4",
    message: "My parents sacrificed everything for me, but the expectations they placed on my shoulders feel like lead weights every night.",
    category: "Family",
    visibility: "public",
    moderation_status: "approved",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    hearts: 39,
    hugs: 58
  },
  {
    id: "seed-conf-5",
    message: "I watched my best friend get married yesterday. I am genuinely happy for them, but walking home to an empty apartment broke my heart in silence.",
    category: "Friendship",
    visibility: "public",
    moderation_status: "approved",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
    hearts: 47,
    hugs: 73
  },
  {
    id: "seed-conf-6",
    message: "I stayed alive through another brutal week. Nobody in my physical life knows how close I came to giving up, but I am still here.",
    category: "Personal struggles",
    visibility: "public",
    moderation_status: "approved",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    hearts: 112,
    hugs: 164
  }
];

const SEED_ADVICE_POSTS = [
  {
    id: "seed-adv-1",
    situation: "I feel like I'm constantly falling behind my peers who are buying homes, getting promoted, and getting engaged. How do I stop comparing my timeline?",
    need: "Gentle perspective & reassurance",
    category: "Personal growth",
    moderation_status: "approved",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    replies: [
      {
        id: "rep-1",
        body: "Comparison measures someone else's highlight reel against your behind-the-scenes. You aren't running their race; you're cultivating your own garden at your own natural season.",
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
        hearts: 19
      },
      {
        id: "rep-2",
        body: "I felt this way at 27. Now at 34, I realize half those people were rushing into things they weren't ready for. Build a life you actually enjoy waking up to, not one that looks good on paper.",
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
        hearts: 25
      }
    ]
  },
  {
    id: "seed-adv-2",
    situation: "My partner of four years stopped putting effort into our relationship. Every conversation turns into silence. How do I communicate without sounding accusatory?",
    need: "Communication strategy",
    category: "Relationships",
    moderation_status: "approved",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    replies: [
      {
        id: "rep-3",
        body: "Use 'I feel' statements instead of 'You never'. Try asking: 'I miss the closeness we used to share. How have you been feeling about us lately?' It invites them into dialogue rather than defense.",
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
        hearts: 14
      }
    ]
  }
];

const SEED_KINDNESS = [
  {
    id: "seed-kind-1",
    message: "To whoever is reading this: I hope life becomes gentler for you. You have carried so much for so long.",
    signature: "A midnight friend",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    hearts: 44,
    hugs: 67
  },
  {
    id: "seed-kind-2",
    message: "You deserve to be loved without having to beg for it, shrink yourself, or constantly apologize for existing.",
    signature: "Someone who cares",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 15).toISOString(),
    hearts: 62,
    hugs: 81
  },
  {
    id: "seed-kind-3",
    message: "Please don't give up on yourself. The world is softer and more beautiful with you still breathing in it.",
    signature: "Anonymous",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(),
    hearts: 91,
    hugs: 114
  },
  {
    id: "seed-kind-4",
    message: "You matter, even on days when you feel invisible. Your quiet existence touches more lives than you will ever know.",
    signature: "A fellow wanderer",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 40).toISOString(),
    hearts: 58,
    hugs: 72
  }
];

const SEED_GARDEN = [
  { id: "g1", text: "I managed to take a shower and make my bed after 4 days in the dark.", category: "A small victory", x: 22, y: 72, color: "#e8c9da" },
  { id: "g2", text: "Grateful for the warm cup of tea my grandmother made me this afternoon.", category: "Something I'm grateful for", x: 45, y: 65, color: "#b8a6e5" },
  { id: "g3", text: "I survived the one-year anniversary of the worst day of my life.", category: "Something I survived", x: 68, y: 78, color: "#81c995" },
  { id: "g4", text: "I said 'no' to extra unpaid work without feeling guilty.", category: "Something I'm proud of", x: 34, y: 82, color: "#e9d39b" },
  { id: "g5", text: "Looking forward to feeling the ocean breeze next weekend.", category: "Something I'm looking forward to", x: 79, y: 68, color: "#9ab9e8" }
];

/* 42 Original comforting reminders */
const REMINDERS = [
  "You are allowed to have difficult days.",
  "Being strong doesn't mean you never cry.",
  "You deserve the same kindness you give to others.",
  "Your healing doesn't have to happen overnight.",
  "One bad chapter doesn't define your whole story.",
  "You are not behind in life. You are on your own journey.",
  "You do not have to explain your pain to deserve kindness.",
  "Rest is not failure.",
  "You have survived 100% of the days that felt impossible.",
  "Give yourself credit for the quiet battles nobody else sees.",
  "It is okay to be a masterpiece and a work in progress at the same time.",
  "Not every feeling is a permanent fact.",
  "You don't have to carry the weight of the entire world on your shoulders.",
  "Healing is not linear; falling back a step is still part of the path.",
  "You are worthy of love, peace, and patience.",
  "Be gentle with yourself; you are doing the best you can with what you have.",
  "The sun will rise again tomorrow, and so will you.",
  "Your feelings are valid, even if someone else experienced worse.",
  "You don't have to figure out your entire life tonight. Just make it through this evening.",
  "Sometimes walking away is the kindest form of self-respect.",
  "Your worth is not measured by your productivity.",
  "It's okay to outgrow spaces, habits, and people that make you feel small.",
  "A tender heart in a harsh world is courage, not weakness.",
  "You are allowed to take up space without apology.",
  "Whatever you couldn't finish today can wait until you've rested.",
  "The right people will never make you feel like you are hard to love.",
  "May you find the courage to forgive yourself for who you were when surviving.",
  "Breathe in peace, exhale tension. You are safe in this quiet moment.",
  "Small steps taken in the dark still lead you toward the light.",
  "You are much stronger than the doubts whispering in your ear.",
  "It takes immense bravery to be vulnerable with your pain.",
  "Even the moon goes through phases before it is whole and radiant again.",
  "You do not need to earn your right to rest and exist.",
  "Trust the timing of your life; your story is still unfolding.",
  "You are not broken; you are simply healing.",
  "May tonight grant your mind the quiet it has longed for all day.",
  "Loneliness is painful, but you are never as truly alone as the silence suggests.",
  "A little progress every day adds up to big results in your soul.",
  "You are allowed to say no to protect your peace.",
  "There is beauty in who you are becoming, even through the cracks.",
  "Your heart has carried you through storms; honor its resilience.",
  "Hold on. Better days are quietly making their way toward you."
];

/* Emotional check-in messages */
const MOOD_MESSAGES = {
  Happy: {
    title: "May Your Light Linger",
    text: "Hold onto this warmth. Let it settle into your chest like honey. Even on quiet days ahead, remember what peace feels like."
  },
  Peaceful: {
    title: "The Quiet Within",
    text: "There is immense grace in stillness. Savor this breath. The world moves fast, but you are rooted in gentle serenity."
  },
  Okay: {
    title: "Just Okay Is Enough",
    text: "You don't need fireworks every day. An ordinary, quiet, neutral afternoon is a sanctuary in itself. You are doing well."
  },
  Tired: {
    title: "Permission to Rest",
    text: "Weariness is your body's honest whisper. You do not have to conquer anything tonight. Put down the armor and close your eyes."
  },
  Anxious: {
    title: "You Are Safe Right Now",
    text: "Notice the ground beneath your feet. The thoughts racing through your mind are echoes, not prophecies. Breathe with us."
  },
  Lonely: {
    title: "You Are Not Forgotten",
    text: "Even when the room is empty, you share this sky with thousands of wandering souls reading these exact words. You belong here."
  },
  Sad: {
    title: "Honor Your Tears",
    text: "Sadness is not a flaw; it is proof of how deeply you can feel and care. Let the water fall. The heart clears after the rain."
  },
  Overwhelmed: {
    title: "One Single Second at a Time",
    text: "Do not look at the whole mountain. Just breathe. Untangle one thread. You do not have to resolve everything this evening."
  },
  Confused: {
    title: "Clarity Takes Time",
    text: "The fog is okay. You do not have to know the final destination to take the next gentle step. Trust that understanding will arrive."
  }
};

/* ==========================================================================
   3. INITIALIZATION & SETUP
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  initBackend();
  initStarsCanvas();
  initNav();
  initReleaseForm();
  initCloudsWall();
  initCheckIn();
  initAdviceCorner();
  initLettersNeverSent();
  initWordsOfComfort();
  initHealingGarden();
  initKindnessWall();
  initAiCompanion();
  initModals();
});

function initBackend() {
  const statusEl = document.getElementById("backend-status-text");
  const dotEl = document.getElementById("backend-status-dot");

  const isConfigured = 
    SUPABASE_URL && 
    SUPABASE_URL.startsWith("https://") && 
    SUPABASE_URL !== "YOUR_SUPABASE_PROJECT_URL" &&
    SUPABASE_ANON_KEY &&
    SUPABASE_ANON_KEY !== "YOUR_SUPABASE_PUBLISHABLE_KEY";

  if (isConfigured && window.supabase) {
    try {
      state.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      // Quick test ping
      state.supabaseClient
        .from("confessions")
        .select("id")
        .limit(1)
        .then(({ error }) => {
          if (error) {
            console.warn("Supabase ping warning:", error.message);
            setConnectionStatus("offline", "Supabase Offline / RLS Locked");
            loadLocalSanctuaryData();
          } else {
            setConnectionStatus("connected", "Connected to Supabase");
            loadSupabaseData();
          }
        })
        .catch((err) => {
          console.warn("Supabase network error:", err);
          setConnectionStatus("offline", "Backend Offline");
          loadLocalSanctuaryData();
        });
    } catch (e) {
      console.error("Failed to init Supabase client:", e);
      setConnectionStatus("offline", "Connection Error");
      loadLocalSanctuaryData();
    }
  } else {
    setConnectionStatus("demo", "Demo Sanctuary Mode");
    loadLocalSanctuaryData();
  }
}

function setConnectionStatus(type, label) {
  state.connectionStatus = type;
  const statusEl = document.getElementById("backend-status-text");
  const dotEl = document.getElementById("backend-status-dot");
  if (statusEl) statusEl.textContent = label;
  if (dotEl) {
    dotEl.className = "status-dot " + type;
  }
}

function loadLocalSanctuaryData() {
  const localConfessions = JSON.parse(localStorage.getItem("unspoken_local_confessions") || "[]");
  state.confessions = [...localConfessions, ...SEED_CONFESSIONS];

  const localAdvice = JSON.parse(localStorage.getItem("unspoken_local_advice") || "[]");
  state.advicePosts = [...localAdvice, ...SEED_ADVICE_POSTS];

  const localKindness = JSON.parse(localStorage.getItem("unspoken_local_kindness") || "[]");
  state.kindnessMessages = [...localKindness, ...SEED_KINDNESS];

  const localGarden = JSON.parse(localStorage.getItem("unspoken_local_garden") || "[]");
  state.healingEntries = [...localGarden, ...SEED_GARDEN];

  renderConfessions();
  renderAdvicePosts();
  renderKindnessWall();
  drawHealingGarden();
}

async function loadSupabaseData() {
  try {
    // 1. Confessions
    const { data: confData, error: confErr } = await state.supabaseClient
      .from("confessions")
      .select("*")
      .eq("visibility", "public")
      .eq("moderation_status", "approved")
      .order("created_at", { ascending: false });

    if (!confErr && confData && confData.length > 0) {
      state.confessions = confData;
    } else {
      state.confessions = SEED_CONFESSIONS;
    }
    renderConfessions();

    // 2. Advice Posts
    const { data: advData, error: advErr } = await state.supabaseClient
      .from("advice_posts")
      .select("*, advice_replies(*)")
      .eq("moderation_status", "approved")
      .order("created_at", { ascending: false });

    if (!advErr && advData && advData.length > 0) {
      state.advicePosts = advData.map(post => ({
        ...post,
        replies: (post.advice_replies || []).filter(r => r.moderation_status === "approved")
      }));
    } else {
      state.advicePosts = SEED_ADVICE_POSTS;
    }
    renderAdvicePosts();

    // 3. Kindness
    const { data: kindData, error: kindErr } = await state.supabaseClient
      .from("kindness_messages")
      .select("*")
      .eq("moderation_status", "approved")
      .order("created_at", { ascending: false });

    if (!kindErr && kindData && kindData.length > 0) {
      state.kindnessMessages = kindData;
    } else {
      state.kindnessMessages = SEED_KINDNESS;
    }
    renderKindnessWall();

    // 4. Garden entries
    const { data: gardenData, error: gardenErr } = await state.supabaseClient
      .from("healing_entries")
      .select("*")
      .eq("moderation_status", "approved")
      .order("created_at", { ascending: false });

    if (!gardenErr && gardenData && gardenData.length > 0) {
      state.healingEntries = gardenData.map((item, idx) => ({
        id: item.id,
        text: item.text,
        category: item.category,
        x: (15 + (idx * 17) % 70),
        y: (60 + (idx * 11) % 25),
        color: ["#b8a6e5", "#e8c9da", "#81c995", "#e9d39b", "#9ab9e8"][idx % 5]
      }));
    } else {
      state.healingEntries = SEED_GARDEN;
    }
    drawHealingGarden();

  } catch (err) {
    console.error("Error fetching Supabase data:", err);
    loadLocalSanctuaryData();
  }
}

/* ==========================================================================
   4. NAVIGATION & MOBILE MENU
   ========================================================================== */
function initNav() {
  const toggleBtn = document.getElementById("mobile-nav-toggle");
  const menu = document.getElementById("mobile-menu");
  if (!toggleBtn || !menu) return;

  toggleBtn.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("open");
    toggleBtn.setAttribute("aria-expanded", String(isOpen));
  });

  menu.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => {
      menu.classList.remove("open");
      toggleBtn.setAttribute("aria-expanded", "false");
    });
  });
}

/* ==========================================================================
   5. STARRY CANVAS & ATMOSPHERE
   ========================================================================== */
function initStarsCanvas() {
  const canvas = document.getElementById("stars-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener("resize", () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    generateStars();
  });

  function generateStars() {
    state.stars = [];
    const count = Math.floor((width * height) / 3200);
    for (let i = 0; i < count; i++) {
      state.stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.4 + 0.4,
        alpha: Math.random() * 0.8 + 0.2,
        twinkleSpeed: (Math.random() * 0.02 + 0.005) * (Math.random() > 0.5 ? 1 : -1)
      });
    }
  }

  generateStars();

  // Shooting star timing
  let shootingStar = null;
  function maybeTriggerShootingStar() {
    if (!shootingStar && Math.random() < 0.003) {
      shootingStar = {
        x: Math.random() * (width * 0.7),
        y: Math.random() * (height * 0.4),
        len: Math.random() * 80 + 60,
        speed: Math.random() * 8 + 6,
        life: 0,
        maxLife: 35
      };
    }
  }

  function loop() {
    ctx.clearRect(0, 0, width, height);

    // Draw stars
    for (const s of state.stars) {
      s.alpha += s.twinkleSpeed;
      if (s.alpha > 0.95 || s.alpha < 0.15) {
        s.twinkleSpeed = -s.twinkleSpeed;
      }
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(248, 245, 255, ${s.alpha.toFixed(2)})`;
      ctx.fill();
    }

    // Shooting star
    maybeTriggerShootingStar();
    if (shootingStar) {
      shootingStar.life++;
      shootingStar.x += shootingStar.speed;
      shootingStar.y += shootingStar.speed * 0.6;
      ctx.beginPath();
      ctx.moveTo(shootingStar.x, shootingStar.y);
      ctx.lineTo(shootingStar.x - shootingStar.len, shootingStar.y - shootingStar.len * 0.6);
      ctx.strokeStyle = `rgba(248, 245, 255, ${(1 - shootingStar.life / shootingStar.maxLife).toFixed(2)})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (shootingStar.life >= shootingStar.maxLife) {
        shootingStar = null;
      }
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

/* ==========================================================================
   6. RELEASE YOUR WORDS (MAIN FEATURE)
   ========================================================================== */
function initReleaseForm() {
  const form = document.getElementById("release-form");
  const textarea = document.getElementById("release-message");
  const charCounter = document.getElementById("release-char-count");
  const privacyRadios = document.querySelectorAll("input[name='release-privacy']");
  const consentBox = document.getElementById("public-consent-box");
  const consentCheckbox = document.getElementById("public-consent-checkbox");
  const statusContainer = document.getElementById("release-status-container");
  const submitBtn = document.getElementById("release-submit-btn");

  if (!form || !textarea) return;

  // Character counter
  textarea.addEventListener("input", () => {
    const len = textarea.value.length;
    if (charCounter) {
      charCounter.textContent = `${len} / 1500`;
      charCounter.style.color = len > 1450 ? "var(--color-danger)" : "var(--color-text-muted)";
    }
  });

  // Privacy radio choice toggling
  privacyRadios.forEach(radio => {
    radio.addEventListener("change", () => {
      document.querySelectorAll(".privacy-option").forEach(opt => opt.classList.remove("active"));
      const parent = radio.closest(".privacy-option");
      if (parent) parent.classList.add("active");

      const isPublic = radio.value === "public";
      if (consentBox) {
        consentBox.classList.toggle("disabled", !isPublic);
      }
      if (consentCheckbox) {
        consentCheckbox.disabled = !isPublic;
        if (!isPublic) consentCheckbox.checked = false;
      }
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const message = textarea.value.trim();
    const categorySelect = document.getElementById("release-category");
    const category = categorySelect ? categorySelect.value : "Things I cannot explain";
    const selectedPrivacy = document.querySelector("input[name='release-privacy']:checked");
    const isPublic = selectedPrivacy ? selectedPrivacy.value === "public" : false;

    // Validation
    if (message.length < 10) {
      showReleaseError("Please write at least 10 characters to let your words breathe.");
      return;
    }
    if (message.length > 1500) {
      showReleaseError("Your message exceeds 1,500 characters. Please gently condense it.");
      return;
    }
    if (isPublic && consentCheckbox && !consentCheckbox.checked) {
      showReleaseError("Please confirm public sharing consent so we can keep our community safe.");
      return;
    }

    // Submission start
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Releasing to the sky...</span>`;
    clearReleaseAlert();

    try {
      const isConfigured = state.supabaseClient && state.connectionStatus === "connected";

      if (isConfigured) {
        // Save to Supabase
        const payload = {
          message: message,
          category: category,
          visibility: isPublic ? "public" : "private",
          moderation_status: isPublic ? "pending" : "approved"
        };

        const { data, error } = await state.supabaseClient.from("confessions").insert([payload]).select();

        if (error) {
          throw new Error(error.message);
        }
      } else {
        // Local sanctuary mode fallback
        const localItem = {
          id: "local-" + Date.now(),
          message: message,
          category: category,
          visibility: isPublic ? "public" : "private",
          moderation_status: isPublic ? "approved" : "approved", // in demo mode, auto-approves locally for testing
          created_at: new Date().toISOString(),
          hearts: 0,
          hugs: 0
        };

        const existing = JSON.parse(localStorage.getItem("unspoken_local_confessions") || "[]");
        existing.unshift(localItem);
        localStorage.setItem("unspoken_local_confessions", JSON.stringify(existing));

        if (isPublic) {
          state.confessions.unshift(localItem);
          renderConfessions();
        }
      }

      // Success! Trigger floating letter animation
      triggerFloatingLetterAnimation(message, isPublic);

      // Reset form
      form.reset();
      if (charCounter) charCounter.textContent = "0 / 1500";
      // Restore default private selection
      const privateRadio = document.querySelector("input[name='release-privacy'][value='private']");
      if (privateRadio) {
        privateRadio.checked = true;
        document.querySelectorAll(".privacy-option").forEach(opt => opt.classList.remove("active"));
        privateRadio.closest(".privacy-option")?.classList.add("active");
        if (consentBox) consentBox.classList.add("disabled");
        if (consentCheckbox) {
          consentCheckbox.disabled = true;
          consentCheckbox.checked = false;
        }
      }

    } catch (err) {
      console.error("Submission error:", err);
      showReleaseError("We couldn't release your letter due to a network error. Your words are preserved below — please try again.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>Release My Letter ♡</span>`;
    }
  });

  function showReleaseError(msg) {
    if (!statusContainer) return;
    statusContainer.innerHTML = `
      <div class="alert-banner alert-error" role="alert">
        <span>⚠</span>
        <span>${escapeHtml(msg)}</span>
      </div>
    `;
  }

  function clearReleaseAlert() {
    if (statusContainer) statusContainer.innerHTML = "";
  }
}

/* ==========================================================================
   7. FLOATING LETTER ANIMATION
   ========================================================================== */
function triggerFloatingLetterAnimation(messageExcerpt, isPublic) {
  const overlay = document.getElementById("letter-animation-overlay");
  const excerptEl = document.getElementById("letter-animation-excerpt");
  const comfortEl = document.getElementById("letter-animation-comfort");
  const dismissBtn = document.getElementById("letter-dismiss-btn");

  if (!overlay || !excerptEl) return;

  excerptEl.textContent = messageExcerpt.length > 220 
    ? messageExcerpt.substring(0, 220) + "..." 
    : messageExcerpt;

  if (comfortEl) {
    comfortEl.textContent = isPublic
      ? "Your letter has been released to the night sky. It will join the community once gently reviewed. ♡"
      : "Your words are yours. They have been gently placed in your private sanctuary. ♡";
  }

  overlay.classList.add("active");

  const closeHandler = () => {
    overlay.classList.remove("active");
    dismissBtn?.removeEventListener("click", closeHandler);
  };

  dismissBtn?.addEventListener("click", closeHandler);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeHandler();
  });
}

/* ==========================================================================
   8. LETTERS IN THE CLOUDS (COMMUNITY WALL)
   ========================================================================== */
function initCloudsWall() {
  const searchInput = document.getElementById("wall-search-input");
  const filterBtns = document.querySelectorAll(".filter-btn");
  const loadMoreBtn = document.getElementById("load-more-letters-btn");

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      state.searchQuery = e.target.value.toLowerCase().trim();
      renderConfessions();
    });
  }

  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.activeCategory = btn.dataset.category || "all";
      state.visibleConfessionsCount = 6;
      renderConfessions();
    });
  });

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", () => {
      state.visibleConfessionsCount += 6;
      renderConfessions();
    });
  }
}

function renderConfessions() {
  const container = document.getElementById("letters-wall-grid");
  const loadMoreBtn = document.getElementById("load-more-letters-btn");
  if (!container) return;

  // Filter
  let filtered = state.confessions.filter(item => {
    // Only approved and public
    if (item.visibility && item.visibility !== "public") return false;
    if (item.moderation_status && item.moderation_status !== "approved") return false;

    // Category
    if (state.activeCategory !== "all" && item.category !== state.activeCategory) {
      return false;
    }

    // Search query
    if (state.searchQuery && !item.message.toLowerCase().includes(state.searchQuery)) {
      return false;
    }

    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">☁</div>
        <h3 class="empty-title">The sky is quiet right now</h3>
        <p class="empty-desc">No public letters match your filter. Be the first to release words in this space.</p>
      </div>
    `;
    if (loadMoreBtn) loadMoreBtn.style.display = "none";
    return;
  }

  const visible = filtered.slice(0, state.visibleConfessionsCount);
  container.innerHTML = "";

  visible.forEach(letter => {
    const card = document.createElement("article");
    card.className = "letter-card";
    card.setAttribute("data-id", letter.id);

    const hasHearted = Boolean(state.userReactions[`conf_${letter.id}_heart`]);
    const hasHugged = Boolean(state.userReactions[`conf_${letter.id}_hug`]);

    const formattedDate = formatDate(letter.created_at);

    // Meta (Zero-pill discipline: unboxed text with typographic dot separators)
    const meta = document.createElement("div");
    meta.className = "card-meta";
    meta.innerHTML = `
      <span>A quiet heart</span>
      <span aria-hidden="true">·</span>
      <span class="meta-category">${escapeHtml(letter.category || "Unspoken")}</span>
      <span aria-hidden="true">·</span>
      <time datetime="${letter.created_at || ''}">${formattedDate}</time>
    `;

    // Safe body content
    const body = document.createElement("p");
    body.className = "card-body";
    body.textContent = letter.message;

    // Footer actions
    const footer = document.createElement("div");
    footer.className = "card-footer";

    const reactionGroup = document.createElement("div");
    reactionGroup.className = "reaction-group";

    // Heart button
    const heartBtn = document.createElement("button");
    heartBtn.className = `reaction-btn ${hasHearted ? 'reacted' : ''}`;
    heartBtn.setAttribute("aria-label", "Send love to this letter");
    heartBtn.innerHTML = `<span>♡</span> <span>${letter.hearts || 0}</span>`;
    heartBtn.onclick = () => handleReaction("confessions", letter.id, "heart", heartBtn, letter);

    // Hug button
    const hugBtn = document.createElement("button");
    hugBtn.className = `reaction-btn ${hasHugged ? 'reacted' : ''}`;
    hugBtn.setAttribute("aria-label", "Send virtual hug");
    hugBtn.innerHTML = `<span>🫂</span> <span>${letter.hugs || 0}</span>`;
    hugBtn.onclick = () => handleReaction("confessions", letter.id, "hug", hugBtn, letter);

    reactionGroup.appendChild(heartBtn);
    reactionGroup.appendChild(hugBtn);

    // Right action buttons
    const actionsGroup = document.createElement("div");
    actionsGroup.style.display = "flex";
    actionsGroup.style.gap = "8px";

    const adviceBtn = document.createElement("button");
    adviceBtn.className = "btn-icon";
    adviceBtn.textContent = "Offer Advice";
    adviceBtn.onclick = () => openOfferAdviceModal(letter);

    const reportBtn = document.createElement("button");
    reportBtn.className = "btn-icon";
    reportBtn.setAttribute("aria-label", "Report inappropriate letter");
    reportBtn.innerHTML = "<span>⚐</span>";
    reportBtn.onclick = () => openReportModal("confessions", letter.id);

    actionsGroup.appendChild(adviceBtn);
    actionsGroup.appendChild(reportBtn);

    footer.appendChild(reactionGroup);
    footer.appendChild(actionsGroup);

    card.appendChild(meta);
    card.appendChild(body);
    card.appendChild(footer);

    container.appendChild(card);
  });

  if (loadMoreBtn) {
    loadMoreBtn.style.display = filtered.length > state.visibleConfessionsCount ? "inline-flex" : "none";
  }
}

/* Reaction handler */
async function handleReaction(table, id, type, btnEl, item) {
  const key = `${table}_${id}_${type}`;
  if (state.userReactions[key]) {
    return; // prevent spamming reaction
  }

  state.userReactions[key] = true;
  localStorage.setItem("unspoken_reactions", JSON.stringify(state.userReactions));

  btnEl.classList.add("reacted");
  const countSpan = btnEl.querySelectorAll("span")[1];
  if (countSpan) {
    const current = parseInt(countSpan.textContent, 10) || 0;
    countSpan.textContent = String(current + 1);
  }

  // Update object
  if (type === "heart") item.hearts = (item.hearts || 0) + 1;
  if (type === "hug") item.hugs = (item.hugs || 0) + 1;

  // Supabase update if configured
  if (state.supabaseClient && state.connectionStatus === "connected") {
    try {
      await state.supabaseClient.from("reactions").insert([
        { target_type: table, target_id: id, reaction_type: type }
      ]);
    } catch (e) {
      console.warn("Supabase reaction sync error:", e);
    }
  }
}

/* ==========================================================================
   9. ADVICE CORNER
   ========================================================================== */
function initAdviceCorner() {
  const form = document.getElementById("advice-request-form");
  const situationText = document.getElementById("advice-situation");
  const needText = document.getElementById("advice-need");
  const categorySelect = document.getElementById("advice-category");
  const submitBtn = document.getElementById("advice-submit-btn");
  const statusContainer = document.getElementById("advice-status-container");

  if (!form || !situationText) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const situation = situationText.value.trim();
    const need = needText ? needText.value.trim() : "Gentle perspective";
    const category = categorySelect ? categorySelect.value : "Life decisions";

    if (situation.length < 15) {
      showAdviceAlert("Please describe what is happening in a few more words (at least 15 characters).", "error");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Sending request...</span>`;

    try {
      const isConfigured = state.supabaseClient && state.connectionStatus === "connected";

      if (isConfigured) {
        const payload = {
          situation: situation,
          need: need,
          category: category,
          moderation_status: "pending"
        };
        const { error } = await state.supabaseClient.from("advice_posts").insert([payload]);
        if (error) throw new Error(error.message);
      } else {
        const localPost = {
          id: "local-adv-" + Date.now(),
          situation: situation,
          need: need,
          category: category,
          moderation_status: "approved",
          created_at: new Date().toISOString(),
          replies: []
        };
        const existing = JSON.parse(localStorage.getItem("unspoken_local_advice") || "[]");
        existing.unshift(localPost);
        localStorage.setItem("unspoken_local_advice", JSON.stringify(existing));
        state.advicePosts.unshift(localPost);
        renderAdvicePosts();
      }

      showAdviceAlert("Your advice request has been sent into the sanctuary. Once approved, visitors can offer gentle words.", "success");
      form.reset();

    } catch (err) {
      console.error("Advice request error:", err);
      showAdviceAlert("Could not submit your request. Your words are preserved — please try again.", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>Ask for Advice ♡</span>`;
    }
  });

  function showAdviceAlert(msg, type) {
    if (!statusContainer) return;
    statusContainer.innerHTML = `
      <div class="alert-banner alert-${type}" role="alert">
        <span>${type === 'success' ? '✓' : '⚠'}</span>
        <span>${escapeHtml(msg)}</span>
      </div>
    `;
  }
}

function renderAdvicePosts() {
  const container = document.getElementById("advice-posts-container");
  if (!container) return;

  const approvedPosts = state.advicePosts.filter(p => p.moderation_status === "approved");

  if (approvedPosts.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🕊</div>
        <h3 class="empty-title">No pending advice requests</h3>
        <p class="empty-desc">Have a question or heavy heart? Ask above, or check back soon.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = "";

  approvedPosts.forEach(post => {
    const card = document.createElement("article");
    card.className = "advice-card";

    // Meta
    const meta = document.createElement("div");
    meta.className = "card-meta";
    meta.innerHTML = `
      <span>Someone seeking light</span>
      <span aria-hidden="true">·</span>
      <span class="meta-category">${escapeHtml(post.category || "Guidance")}</span>
      <span aria-hidden="true">·</span>
      <time datetime="${post.created_at || ''}">${formatDate(post.created_at)}</time>
    `;

    // Situation
    const sitEl = document.createElement("p");
    sitEl.className = "advice-situation";
    sitEl.textContent = post.situation;

    // Need
    const needBox = document.createElement("div");
    needBox.className = "advice-need-box";
    needBox.innerHTML = `<strong>Looking for:</strong> ${escapeHtml(post.need || "Listening ear")}`;

    // Replies list
    const repliesSec = document.createElement("div");
    repliesSec.className = "replies-section";

    const repliesTitle = document.createElement("h4");
    repliesTitle.className = "replies-title";
    const repCount = (post.replies || []).length;
    repliesTitle.textContent = `${repCount} ${repCount === 1 ? 'Gentle Reply' : 'Gentle Replies'}`;
    repliesSec.appendChild(repliesTitle);

    if (repCount > 0) {
      post.replies.forEach(rep => {
        const repItem = document.createElement("div");
        repItem.className = "reply-item";

        const repMeta = document.createElement("div");
        repMeta.className = "card-meta";
        repMeta.style.fontSize = "11.5px";
        repMeta.innerHTML = `
          <span>A fellow soul</span>
          <span aria-hidden="true">·</span>
          <span>${formatDate(rep.created_at)}</span>
        `;

        const repBody = document.createElement("p");
        repBody.className = "reply-body";
        repBody.textContent = rep.body;

        repItem.appendChild(repMeta);
        repItem.appendChild(repBody);
        repliesSec.appendChild(repItem);
      });
    }

    // Inline reply form
    const replyForm = document.createElement("form");
    replyForm.style.marginTop = "10px";
    replyForm.innerHTML = `
      <div style="display:flex; gap:10px;">
        <input type="text" class="form-input reply-input" placeholder="Offer kind, non-judgmental advice..." style="font-size:13.5px;" required />
        <button type="submit" class="btn btn-primary btn-sm" style="flex-shrink:0;">Reply</button>
      </div>
      <div class="reply-feedback" style="margin-top:6px; font-size:12px;"></div>
    `;

    replyForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const input = replyForm.querySelector(".reply-input");
      const feedback = replyForm.querySelector(".reply-feedback");
      const replyText = input.value.trim();

      if (replyText.length < 5) return;

      input.disabled = true;
      try {
        const isConfigured = state.supabaseClient && state.connectionStatus === "connected";
        if (isConfigured) {
          await state.supabaseClient.from("advice_replies").insert([
            { post_id: post.id, body: replyText, moderation_status: "pending" }
          ]);
          feedback.innerHTML = `<span style="color:#a3e8b4;">✓ Your reply was submitted and will appear once approved.</span>`;
        } else {
          // Demo fallback
          const newRep = {
            id: "local-rep-" + Date.now(),
            body: replyText,
            created_at: new Date().toISOString()
          };
          if (!post.replies) post.replies = [];
          post.replies.push(newRep);
          renderAdvicePosts();
        }
        input.value = "";
      } catch (err) {
        feedback.innerHTML = `<span style="color:#f7a8a2;">Could not send reply. Please try again.</span>`;
      } finally {
        input.disabled = false;
      }
    });

    card.appendChild(meta);
    card.appendChild(sitEl);
    card.appendChild(needBox);
    card.appendChild(repliesSec);
    card.appendChild(replyForm);

    container.appendChild(card);
  });
}

/* ==========================================================================
   10. DAILY EMOTIONAL CHECK-IN
   ========================================================================== */
function initCheckIn() {
  const moodBtns = document.querySelectorAll(".mood-btn");
  const responseCard = document.getElementById("mood-response-card");
  const responseTitle = document.getElementById("mood-response-title");
  const responseText = document.getElementById("mood-response-text");

  moodBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      moodBtns.forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");

      const moodKey = btn.dataset.mood;
      const moodData = MOOD_MESSAGES[moodKey];

      if (moodData && responseCard && responseTitle && responseText) {
        responseTitle.textContent = moodData.title;
        responseText.textContent = moodData.text;
        responseCard.classList.add("active");
        responseCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });
  });

  // Breathing Box Interaction
  const breathToggleBtn = document.getElementById("breath-toggle-btn");
  const breathCircle = document.getElementById("breathing-circle");
  const breathCue = document.getElementById("breathing-cue");

  if (breathToggleBtn && breathCircle && breathCue) {
    let isBreathing = false;
    let stepIndex = 0;
    const steps = [
      { text: "Breathe In (4s)...", cls: "inhale" },
      { text: "Hold gently (4s)...", cls: "hold" },
      { text: "Release slowly (4s)...", cls: "exhale" },
      { text: "Rest in stillness (4s)...", cls: "" }
    ];

    breathToggleBtn.addEventListener("click", () => {
      isBreathing = !isBreathing;
      if (isBreathing) {
        breathToggleBtn.textContent = "Pause Exercise";
        stepIndex = 0;
        runStep();
        state.breathingInterval = setInterval(runStep, 4000);
      } else {
        breathToggleBtn.textContent = "Start Breathing Exercise";
        clearInterval(state.breathingInterval);
        breathCircle.className = "breathing-circle";
        breathCue.textContent = "Take a calm moment whenever you need.";
      }
    });

    function runStep() {
      const current = steps[stepIndex % steps.length];
      breathCue.textContent = current.text;
      breathCircle.className = "breathing-circle " + current.cls;
      stepIndex++;
    }
  }
}

/* ==========================================================================
   11. LETTERS NEVER SENT
   ========================================================================== */
function initLettersNeverSent() {
  const recipientBtns = document.querySelectorAll(".recipient-btn");
  const salutationInput = document.getElementById("unspoken-recipient-input");
  const bodyText = document.getElementById("unspoken-body");
  const saveBtn = document.getElementById("unspoken-save-btn");
  const burnBtn = document.getElementById("unspoken-burn-btn");
  const statusEl = document.getElementById("unspoken-status");
  const sheet = document.getElementById("unspoken-sheet");
  const viewArchiveBtn = document.getElementById("view-archive-btn");

  recipientBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      recipientBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      if (salutationInput) {
        salutationInput.value = `Dear ${btn.dataset.recipient},`;
      }
    });
  });

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const salutation = salutationInput.value.trim();
      const body = bodyText.value.trim();

      if (body.length < 10) {
        showStatus("Write a little more before saving to your private archive.", "error");
        return;
      }

      const letterObj = {
        id: "priv-" + Date.now(),
        salutation: salutation || "Dear You,",
        body: body,
        date: new Date().toISOString()
      };

      state.privateLetters.unshift(letterObj);
      localStorage.setItem("unspoken_private_letters", JSON.stringify(state.privateLetters));

      showStatus("Letter saved in your browser's private vault. Only you can read it.", "success");
      updateArchiveCount();
    });
  }

  if (burnBtn && sheet) {
    burnBtn.addEventListener("click", () => {
      const body = bodyText.value.trim();
      if (body.length === 0) {
        showStatus("There is nothing written to let go of yet.", "error");
        return;
      }

      // Paper burning animation
      sheet.classList.add("burning");
      burnBtn.disabled = true;

      setTimeout(() => {
        bodyText.value = "";
        sheet.classList.remove("burning");
        burnBtn.disabled = false;
        showStatus("Your unspoken words have dissolved into smoke and night air. May you feel lighter. ♡", "success");
      }, 1300);
    });
  }

  if (viewArchiveBtn) {
    viewArchiveBtn.addEventListener("click", openPrivateArchiveModal);
  }

  function showStatus(msg, type) {
    if (!statusEl) return;
    statusEl.innerHTML = `
      <div class="alert-banner alert-${type}">
        <span>${type === 'success' ? '✓' : '⚠'}</span>
        <span>${escapeHtml(msg)}</span>
      </div>
    `;
    setTimeout(() => {
      if (statusEl) statusEl.innerHTML = "";
    }, 6000);
  }

  function updateArchiveCount() {
    const badge = document.getElementById("archive-count-badge");
    if (badge) badge.textContent = String(state.privateLetters.length);
  }

  updateArchiveCount();
}

/* ==========================================================================
   12. WORDS YOU NEED TODAY (REMINDERS)
   ========================================================================== */
function initWordsOfComfort() {
  const quoteText = document.getElementById("comfort-quote-text");
  const nextBtn = document.getElementById("next-comfort-btn");
  const copyBtn = document.getElementById("copy-comfort-btn");

  if (!quoteText || !nextBtn) return;

  function pickRandomReminder() {
    let nextIdx;
    do {
      nextIdx = Math.floor(Math.random() * REMINDERS.length);
    } while (nextIdx === state.lastReminderIndex && REMINDERS.length > 1);

    state.lastReminderIndex = nextIdx;

    quoteText.style.opacity = "0";
    quoteText.style.transform = "translateY(8px)";

    setTimeout(() => {
      quoteText.textContent = `“${REMINDERS[nextIdx]}”`;
      quoteText.style.opacity = "1";
      quoteText.style.transform = "translateY(0)";
    }, 200);
  }

  nextBtn.addEventListener("click", pickRandomReminder);

  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      const textToCopy = quoteText.textContent;
      navigator.clipboard?.writeText(textToCopy).then(() => {
        copyBtn.textContent = "Copied ♡";
        setTimeout(() => {
          copyBtn.textContent = "Copy Reminder";
        }, 2000);
      }).catch(() => {
        copyBtn.textContent = "Could not copy";
      });
    });
  }

  // Initial reminder
  pickRandomReminder();
}

/* ==========================================================================
   13. HEALING GARDEN
   ========================================================================== */
function initHealingGarden() {
  const canvas = document.getElementById("garden-canvas");
  const form = document.getElementById("garden-seed-form");
  const textInput = document.getElementById("garden-text");
  const catSelect = document.getElementById("garden-category");
  const submitBtn = document.getElementById("garden-submit-btn");

  if (form && textInput) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const text = textInput.value.trim();
      const cat = catSelect ? catSelect.value : "A small victory";

      if (text.length < 5) return;

      submitBtn.disabled = true;

      try {
        const isConfigured = state.supabaseClient && state.connectionStatus === "connected";
        if (isConfigured) {
          await state.supabaseClient.from("healing_entries").insert([
            { text: text, category: cat, moderation_status: "pending" }
          ]);
        } else {
          // Demo fallback
          const newBloom = {
            id: "garden-" + Date.now(),
            text: text,
            category: cat,
            x: Math.floor(Math.random() * 70 + 15),
            y: Math.floor(Math.random() * 25 + 60),
            color: ["#b8a6e5", "#e8c9da", "#81c995", "#e9d39b", "#9ab9e8"][Math.floor(Math.random() * 5)]
          };
          state.healingEntries.push(newBloom);
          drawHealingGarden();
        }

        form.reset();
        alert("Your seed has been gently planted in the garden. ♡");
      } catch (err) {
        console.error("Garden submit error:", err);
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  if (canvas) {
    canvas.addEventListener("click", (e) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = ((e.clientX - rect.left) / rect.width) * 100;
      const clickY = ((e.clientY - rect.top) / rect.height) * 100;

      // Find nearest bloom
      for (const flower of state.healingEntries) {
        const dist = Math.hypot(clickX - flower.x, clickY - flower.y);
        if (dist < 6) {
          openFlowerModal(flower);
          return;
        }
      }
    });
  }
}

function drawHealingGarden() {
  const canvas = document.getElementById("garden-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const w = (canvas.width = canvas.parentElement.clientWidth);
  const h = (canvas.height = canvas.parentElement.clientHeight);

  ctx.clearRect(0, 0, w, h);

  // Gentle grassy hills
  ctx.beginPath();
  ctx.moveTo(0, h * 0.75);
  ctx.quadraticCurveTo(w * 0.35, h * 0.65, w * 0.7, h * 0.78);
  ctx.quadraticCurveTo(w * 0.85, h * 0.82, w, h * 0.72);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fillStyle = "rgba(18, 38, 36, 0.95)";
  ctx.fill();

  // Draw blossoms
  state.healingEntries.forEach((bloom) => {
    const px = (bloom.x / 100) * w;
    const py = (bloom.y / 100) * h;

    // Stem
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px, py + 22);
    ctx.strokeStyle = "rgba(129, 201, 149, 0.45)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Petals glow
    ctx.beginPath();
    ctx.arc(px, py, 9, 0, Math.PI * 2);
    ctx.fillStyle = bloom.color || "#e8c9da";
    ctx.shadowColor = bloom.color || "#e8c9da";
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Center pistil
    ctx.beginPath();
    ctx.arc(px, py, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = "#fff8db";
    ctx.fill();
  });
}

function openFlowerModal(flower) {
  const modal = document.getElementById("flower-modal");
  const textEl = document.getElementById("flower-modal-text");
  const catEl = document.getElementById("flower-modal-category");
  if (!modal || !textEl) return;

  textEl.textContent = `“${flower.text}”`;
  if (catEl) catEl.textContent = flower.category || "A Step of Healing";
  modal.classList.add("open");
}

/* ==========================================================================
   14. COMMUNITY KINDNESS WALL
   ========================================================================== */
function initKindnessWall() {
  const form = document.getElementById("kindness-form");
  const textInput = document.getElementById("kindness-message-input");
  const sigInput = document.getElementById("kindness-sig-input");
  const submitBtn = document.getElementById("kindness-submit-btn");

  if (!form || !textInput) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = textInput.value.trim();
    const sig = sigInput ? sigInput.value.trim() : "Anonymous";

    if (msg.length < 5) return;

    submitBtn.disabled = true;

    try {
      const isConfigured = state.supabaseClient && state.connectionStatus === "connected";
      if (isConfigured) {
        await state.supabaseClient.from("kindness_messages").insert([
          { message: msg, signature: sig || "Anonymous", moderation_status: "pending" }
        ]);
      } else {
        const localKind = {
          id: "local-kind-" + Date.now(),
          message: msg,
          signature: sig || "Anonymous",
          created_at: new Date().toISOString(),
          hearts: 0,
          hugs: 0
        };
        state.kindnessMessages.unshift(localKind);
        renderKindnessWall();
      }

      form.reset();
      alert("Your message of kindness has been released into the sanctuary. ♡");
    } catch (err) {
      console.error("Kindness submission error:", err);
    } finally {
      submitBtn.disabled = false;
    }
  });
}

function renderKindnessWall() {
  const container = document.getElementById("kindness-grid");
  if (!container) return;

  container.innerHTML = "";

  state.kindnessMessages.forEach((note) => {
    const card = document.createElement("article");
    card.className = "letter-card";

    const body = document.createElement("p");
    body.className = "card-body";
    body.style.fontSize = "16px";
    body.textContent = note.message;

    const footer = document.createElement("div");
    footer.className = "card-footer";

    const sig = document.createElement("div");
    sig.className = "card-meta";
    sig.innerHTML = `<span>— ${escapeHtml(note.signature || "Anonymous")}</span>`;

    const reactionGroup = document.createElement("div");
    reactionGroup.className = "reaction-group";

    const heartBtn = document.createElement("button");
    heartBtn.className = "reaction-btn";
    heartBtn.innerHTML = `<span>♡</span> <span>${note.hearts || 0}</span>`;
    heartBtn.onclick = () => handleReaction("kindness_messages", note.id, "heart", heartBtn, note);

    const hugBtn = document.createElement("button");
    hugBtn.className = "reaction-btn";
    hugBtn.innerHTML = `<span>🫂</span> <span>${note.hugs || 0}</span>`;
    hugBtn.onclick = () => handleReaction("kindness_messages", note.id, "hug", hugBtn, note);

    reactionGroup.appendChild(heartBtn);
    reactionGroup.appendChild(hugBtn);

    footer.appendChild(sig);
    footer.appendChild(reactionGroup);

    card.appendChild(body);
    card.appendChild(footer);

    container.appendChild(card);
  });
}

/* ==========================================================================
   15. TALK IT OUT (AI COMPANION)
   ========================================================================== */
function initAiCompanion() {
  const intentChips = document.querySelectorAll(".intent-chip");
  const chatMessages = document.getElementById("chat-messages");
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");
  const clearBtn = document.getElementById("clear-chat-btn");
  const crisisBanner = document.getElementById("companion-crisis-banner");

  // Initial welcome greeting
  appendChatMessage("companion", "Hello, quiet wanderer. I'm here to sit with you in the stillness. You don't have to pretend you're okay here. What is on your mind tonight?");

  intentChips.forEach(chip => {
    chip.addEventListener("click", () => {
      const intentText = chip.textContent.trim();
      if (chatInput) {
        chatInput.value = intentText;
        chatForm?.dispatchEvent(new Event("submit", { cancelable: true }));
      }
    });
  });

  if (clearBtn && chatMessages) {
    clearBtn.addEventListener("click", () => {
      chatMessages.innerHTML = "";
      if (crisisBanner) crisisBanner.style.display = "none";
      appendChatMessage("companion", "The space is quiet and clear again. Whenever you are ready, I am here.");
    });
  }

  if (chatForm && chatInput) {
    chatForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const userText = chatInput.value.trim();
      if (!userText) return;

      appendChatMessage("user", userText);
      chatInput.value = "";

      // Crisis check
      if (detectCrisis(userText)) {
        if (crisisBanner) crisisBanner.style.display = "block";
        appendChatMessage("companion", "I hear how deeply in pain you are right now, and I want you to know your life is precious and irreplaceable. Please, connect with someone who can support you through this dark night:");
        return;
      }

      // Thinking indicator
      const thinkingBubble = appendChatMessage("companion", "Listening...");

      try {
        if (AI_ENDPOINT && AI_ENDPOINT.startsWith("http")) {
          const res = await fetch(AI_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: userText })
          });
          const json = await res.json();
          thinkingBubble.querySelector(".chat-bubble").textContent = json.reply || "Thank you for sharing that with me. I hear you.";
        } else {
          // Predefined compassionate reflection engine
          setTimeout(() => {
            const reply = generateEmpathicResponse(userText);
            thinkingBubble.querySelector(".chat-bubble").textContent = reply;
          }, 650);
        }
      } catch (err) {
        thinkingBubble.querySelector(".chat-bubble").textContent = "I'm listening quietly. Whatever you are feeling right now is valid. Take your time.";
      }
    });
  }

  function appendChatMessage(sender, text) {
    if (!chatMessages) return;
    const msgEl = document.createElement("div");
    msgEl.className = `chat-msg ${sender}`;

    const bubble = document.createElement("div");
    bubble.className = "chat-bubble";
    bubble.textContent = text;

    const time = document.createElement("span");
    time.className = "chat-msg-time";
    const now = new Date();
    time.textContent = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    msgEl.appendChild(bubble);
    msgEl.appendChild(time);
    chatMessages.appendChild(msgEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return msgEl;
  }
}

function detectCrisis(text) {
  const normalized = text.toLowerCase();
  const crisisWords = [
    "suicide", "kill myself", "end my life", "want to die", "better off dead", 
    "hurt myself", "take my own life", "self harm", "don't want to live"
  ];
  return crisisWords.some(w => normalized.includes(w));
}

function generateEmpathicResponse(userText) {
  const lower = userText.toLowerCase();

  if (lower.includes("lost") || lower.includes("direction") || lower.includes("purpose")) {
    return "Feeling lost is often the quiet prelude to discovering what actually matters to you. When all expectations fall away, what is one tiny thing that brings your heart even a second of peace?";
  }
  if (lower.includes("heartbreak") || lower.includes("ex") || lower.includes("breakup") || lower.includes("miss him") || lower.includes("miss her")) {
    return "Heartbreak is grief for a future you were looking forward to holding. It is okay to mourn that person while simultaneously knowing you deserve to be loved completely.";
  }
  if (lower.includes("overthink") || lower.includes("anxious") || lower.includes("panic") || lower.includes("worried")) {
    return "Your mind is trying so hard to protect you by anticipating every storm. Can you take a long breath with me right now? Let's ground in this exact second: what is one real, safe thing in front of you?";
  }
  if (lower.includes("tired") || lower.includes("exhausted") || lower.includes("drain")) {
    return "You have been holding up so many invisible walls for so long. You don't have to perform strength right now. Give yourself permission to just exist and rest.";
  }
  if (lower.includes("decision") || lower.includes("choose") || lower.includes("choice")) {
    return "When decisions feel paralyzing, ask yourself: which path honors your self-respect and boundaries, even if it feels temporarily harder? Which option lets you sleep with a quiet conscience?";
  }

  const generalReflections = [
    "Thank you for sharing that with me. It takes courage to put words to feelings we usually bury. How long have you been carrying this inside?",
    "I hear you. You don't have to fix everything in this very hour. Sometimes just letting the words exist outside your head is the first step.",
    "That sounds so heavy. If a dear friend came to you with this exact burden, what gentle words would you give them? Would you offer that same grace to yourself?",
    "I'm sitting right here with you in this feeling. Take as much time as you need. There is no rush."
  ];

  return generalReflections[Math.floor(Math.random() * generalReflections.length)];
}

/* ==========================================================================
   16. MODALS & REPORTING WORKFLOW
   ========================================================================== */
function initModals() {
  // Generic modal close hooks
  document.querySelectorAll(".modal-close-btn, .modal-overlay").forEach(el => {
    el.addEventListener("click", (e) => {
      if (e.target === el) {
        document.querySelectorAll(".modal-overlay").forEach(m => m.classList.remove("open"));
      }
    });
  });

  // Report Modal submission
  const reportForm = document.getElementById("report-form");
  if (reportForm) {
    reportForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const reason = document.getElementById("report-reason")?.value;
      const details = document.getElementById("report-details")?.value;
      const target = state.activeReportTarget;

      if (!target) return;

      try {
        if (state.supabaseClient && state.connectionStatus === "connected") {
          await state.supabaseClient.from("content_reports").insert([
            {
              target_type: target.type,
              target_id: target.id,
              reason: reason,
              details: details
            }
          ]);
        }
        alert("Thank you. Your report has been securely filed for moderator review.");
        document.getElementById("report-modal")?.classList.remove("open");
        reportForm.reset();
      } catch (err) {
        alert("Could not file report due to a network error.");
      }
    });
  }

  // Backend Status details trigger
  const statusBtn = document.getElementById("backend-status-btn");
  if (statusBtn) {
    statusBtn.addEventListener("click", () => {
      document.getElementById("backend-info-modal")?.classList.add("open");
    });
  }
}

function openReportModal(targetType, targetId) {
  state.activeReportTarget = { type: targetType, id: targetId };
  document.getElementById("report-modal")?.classList.add("open");
}

function openOfferAdviceModal(letter) {
  const sitInput = document.getElementById("advice-situation");
  const adviceSec = document.getElementById("advice");
  if (sitInput && adviceSec) {
    sitInput.value = `Regarding this story: "${letter.message.substring(0, 100)}..."\n\n`;
    adviceSec.scrollIntoView({ behavior: "smooth" });
    sitInput.focus();
  }
}

function openPrivateArchiveModal() {
  const modal = document.getElementById("private-archive-modal");
  const listEl = document.getElementById("private-archive-list");
  if (!modal || !listEl) return;

  if (state.privateLetters.length === 0) {
    listEl.innerHTML = `<p style="color:var(--color-text-muted); text-align:center; padding:32px 0;">No private letters saved yet.</p>`;
  } else {
    listEl.innerHTML = "";
    state.privateLetters.forEach((letter, index) => {
      const item = document.createElement("div");
      item.className = "reply-item";
      item.style.marginBottom = "14px";
      item.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong style="color:var(--color-lavender);">${escapeHtml(letter.salutation)}</strong>
          <span style="font-size:11px; color:var(--color-text-muted);">${formatDate(letter.date)}</span>
        </div>
        <p style="font-family:var(--font-serif); font-size:16px; margin-block:8px; line-height:1.6;">${escapeHtml(letter.body)}</p>
        <button class="btn btn-danger btn-sm" style="align-self:flex-end;">Delete Permanently</button>
      `;

      item.querySelector(".btn-danger")?.addEventListener("click", () => {
        if (confirm("Are you sure you want to permanently delete this private letter?")) {
          state.privateLetters.splice(index, 1);
          localStorage.setItem("unspoken_private_letters", JSON.stringify(state.privateLetters));
          openPrivateArchiveModal();
          const badge = document.getElementById("archive-count-badge");
          if (badge) badge.textContent = String(state.privateLetters.length);
        }
      });

      listEl.appendChild(item);
    });
  }

  modal.classList.add("open");
}

/* ==========================================================================
   17. UTILITY HELPERS
   ========================================================================== */
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(isoStr) {
  if (!isoStr) return "Some time ago";
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch (e) {
    return "Recently";
  }
}
