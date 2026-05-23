// ============================================
// PART 1: Core Setup & Navigation
// ============================================

const elements = {
  navbar: document.getElementById("navbar"),
  hamburger: document.getElementById("hamburger"),
  navLinks: document.querySelector(".nav-links"),
  contactForm: document.getElementById("contactForm"),
  countrySelect: document.getElementById("countrySelect"),
  budgetSelect: document.getElementById("budgetSelect"),
  currencyLabel: document.getElementById("currencyLabel"),
  currencyName: document.getElementById("currencyName"),
};

const safeAddEvent = (el, event, handler) =>
  el?.addEventListener(event, handler);

safeAddEvent(elements.hamburger, "click", () => {
  elements.hamburger.classList.toggle("active");
  elements.navLinks.classList.toggle("active");
  document.body.style.overflow = elements.navLinks.classList.contains("active")
    ? "hidden"
    : "";
});

document.querySelectorAll(".nav-link").forEach((link) => {
  safeAddEvent(link, "click", () => {
    elements.hamburger?.classList.remove("active");
    elements.navLinks?.classList.remove("active");
    document.body.style.overflow = "";
  });
});

let lastScroll = 0,
  ticking = false;

const updateNavbar = () => {
  const current = window.pageYOffset;
  elements.navbar?.classList.toggle("scrolled", current > 50);
  elements.navbar &&
    (elements.navbar.style.transform =
      current > lastScroll && current > 100
        ? "translateY(-100%)"
        : "translateY(0)");
  lastScroll = current;
  ticking = false;
};

safeAddEvent(window, "scroll", () => {
  if (!ticking) {
    requestAnimationFrame(updateNavbar);
    ticking = true;
  }
});

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  safeAddEvent(anchor, "click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    target &&
      window.scrollTo({ top: target.offsetTop - 80, behavior: "smooth" });
  });
});
// ============================================
// PART 2: Portfolio, Services Only
// ============================================

// Portfolio Filter
document.querySelectorAll(".filter-btn").forEach((btn) => {
  safeAddEvent(btn, "click", () => {
    document
      .querySelectorAll(".filter-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const filter = btn.dataset.filter;
    document.querySelectorAll(".portfolio-item").forEach((item) => {
      const match = filter === "all" || item.dataset.category === filter;
      item.style.display = match ? "block" : "none";
      requestAnimationFrame(() => {
        item.style.opacity = match ? "1" : "0";
        item.style.transform = match ? "scale(1)" : "scale(0.8)";
      });
    });
  });
});

// Service Cards
document.querySelectorAll(".service-card").forEach((card) => {
  safeAddEvent(card, "click", () => {
    const section = document.getElementById(`${card.dataset.service}-detail`);
    section &&
      window.scrollTo({ top: section.offsetTop - 80, behavior: "smooth" });
  });
});

// No currency converter, no form handler
// Netlify handles form submission automatically
// ============================================
// PART 3: Animations, Stats & Effects
// ============================================

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("animate-in");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
);

document
  .querySelectorAll(
    ".service-card, .portfolio-item, .process-step, .about-stat, .feature-item, .testimonial-card",
  )
  .forEach((el) => {
    el.style.cssText =
      "opacity:0;transform:translateY(30px);transition:opacity 0.6s ease,transform 0.6s ease";
    observer.observe(el);
  });

const style = document.createElement("style");
style.textContent = `.animate-in{opacity:1!important;transform:translateY(0)!important}`;
document.head.appendChild(style);

const animateCounter = (el, target, duration = 2000) => {
  const start = performance.now();
  const hasPlus = el.textContent.includes("+");
  const update = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(target * ease) + (hasPlus ? "+" : "");
    progress < 1
      ? requestAnimationFrame(update)
      : (el.textContent = target + (hasPlus ? "+" : ""));
  };
  requestAnimationFrame(update);
};

const statObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target
        .querySelectorAll(".stat-number, .exp-number")
        .forEach((stat) => {
          const num = parseInt(stat.textContent, 10);
          !isNaN(num) && animateCounter(stat, num);
        });
      statObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.5 },
);

document.querySelector(".hero-stats") &&
  statObserver.observe(document.querySelector(".hero-stats"));
document.querySelector(".experience-badge") &&
  statObserver.observe(document.querySelector(".experience-badge"));

let heroTicking = false;
safeAddEvent(window, "scroll", () => {
  if (heroTicking) return;
  heroTicking = true;
  requestAnimationFrame(() => {
    const hero = document.querySelector(".hero-img");
    const scrolled = window.pageYOffset;
    hero &&
      scrolled < window.innerHeight &&
      (hero.style.transform = `translateY(${scrolled * 0.5}px)`);
    heroTicking = false;
  });
});

document.querySelectorAll("img").forEach((img) => {
  img.hasAttribute("loading") || img.setAttribute("loading", "lazy");
  const loadHandler = () => img.classList.add("loaded");
  img.addEventListener("load", loadHandler);
  img.complete && img.classList.add("loaded");
});

const lazyStyle = document.createElement("style");
lazyStyle.textContent = `img{opacity:0;transition:opacity 0.3s,filter 0.3s;filter:blur(10px)}img.loaded{opacity:1;filter:blur(0)}`;
document.head.appendChild(lazyStyle);
// ============================================
// PART 4: Effects Only (No Currency)
// ============================================

// 3D Tilt Effect
document.querySelectorAll(".service-card").forEach((card) => {
  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left,
      y = e.clientY - rect.top;
    const rotateX = (y - rect.height / 2) / 20;
    const rotateY = (rect.width / 2 - x) / 20;
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px)`;
  });
  card.addEventListener("mouseleave", () => (card.style.transform = ""));
});

// Typing Effect
const typeWriter = (el, text, speed = 50) => {
  let i = 0;
  el.textContent = "";
  const type = () =>
    i < text.length &&
    ((el.textContent += text.charAt(i++)), setTimeout(type, speed));
  type();
};

const heroObs = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const sub = entry.target.querySelector(".hero-subtitle");
      if (sub && !sub.classList.contains("typed")) {
        typeWriter(sub, sub.textContent, 30);
        sub.classList.add("typed");
      }
      heroObs.unobserve(entry.target);
    });
  },
  { threshold: 0.5 },
);

document.querySelector(".hero") &&
  heroObs.observe(document.querySelector(".hero"));

// Ripple Effect
document.querySelectorAll(".btn").forEach((btn) => {
  safeAddEvent(btn, "click", function (e) {
    const rect = this.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.style.cssText = `position:absolute;background:rgba(255,255,255,0.3);border-radius:50%;transform:scale(0);animation:ripple 0.6s linear;pointer-events:none;width:20px;height:20px;left:${e.clientX - rect.left - 10}px;top:${e.clientY - rect.top - 10}px`;
    this.style.cssText = "position:relative;overflow:hidden";
    this.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
});

const rippleStyle = document.createElement("style");
rippleStyle.textContent = `@keyframes ripple{to{transform:scale(4);opacity:0}}`;
document.head.appendChild(rippleStyle);

// Preload Images
safeAddEvent(window, "load", () => {
  [
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1920&q=80",
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80",
  ].forEach((src) => (new Image().src = src));
});

// Console
console.log(
  "%c Dream Visual ",
  "background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;font-size:24px;font-weight:bold;padding:10px 20px;border-radius:10px;",
);
console.log(
  "%c Creative Solutions for Modern Businesses ",
  "color:#667eea;font-size:14px;",
);
