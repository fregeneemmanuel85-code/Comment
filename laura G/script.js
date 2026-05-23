// ============================================
// LAUREL-G DEZYNS & FASHIONIQUE
// Main JavaScript File - Optimized
// ============================================

document.addEventListener("DOMContentLoaded", function () {
  initAOS();
  initLazyLoading();
  initPreloader();
  initNavbar();
  initMobileMenu();
  initSmoothScroll();
  initActiveNav();
  initFAQ();
  initBackToTop();
  initLightbox();
  initCounters();
});

// ============================================
// AOS INITIALIZATION
// ============================================
function initAOS() {
  if (typeof AOS !== "undefined") {
    AOS.init({
      duration: 800,
      once: true,
      offset: 100,
      easing: "ease-out-cubic",
      disable: function () {
        return window.innerWidth < 768;
      },
    });
  }
}

// ============================================
// LAZY LOADING
// ============================================
function initLazyLoading() {
  const lazyImages = document.querySelectorAll("img[data-src]");

  if (lazyImages.length === 0) return;

  if ("loading" in HTMLImageElement.prototype) {
    lazyImages.forEach((img) => {
      if (img.dataset.src) {
        img.src = img.dataset.src;
        img.loading = "lazy";
        img.removeAttribute("data-src");
      }
    });
    return;
  }

  if ("IntersectionObserver" in window) {
    const imageObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute("data-src");
            }
            observer.unobserve(img);
          }
        });
      },
      {
        rootMargin: "50px 0px",
      },
    );

    lazyImages.forEach((img) => imageObserver.observe(img));
  } else {
    lazyImages.forEach((img) => {
      if (img.dataset.src) {
        img.src = img.dataset.src;
        img.removeAttribute("data-src");
      }
    });
  }
}

// ============================================
// PRELOADER
// ============================================
function initPreloader() {
  const preloader = document.querySelector(".preloader");

  if (!preloader) return;

  const maxWait = setTimeout(() => {
    hidePreloader(preloader);
  }, 3000);

  window.addEventListener("load", () => {
    clearTimeout(maxWait);
    setTimeout(() => hidePreloader(preloader), 500);
  });
}

function hidePreloader(preloader) {
  preloader.classList.add("hidden");
  setTimeout(() => {
    preloader.style.display = "none";
  }, 500);
}

// ============================================
// NAVBAR
// ============================================
function initNavbar() {
  const navbar = document.getElementById("navbar");
  if (!navbar) return;

  let ticking = false;

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (window.pageYOffset > 50) {
            navbar.classList.add("scrolled");
          } else {
            navbar.classList.remove("scrolled");
          }
          ticking = false;
        });
        ticking = true;
      }
    },
    { passive: true },
  );
}

// ============================================
// MOBILE MENU
// ============================================
function initMobileMenu() {
  const hamburger = document.querySelector(".hamburger");
  const navLinks = document.querySelector(".nav-links");

  if (!hamburger || !navLinks) return;

  hamburger.addEventListener("click", (e) => {
    e.stopPropagation();
    hamburger.classList.toggle("active");
    navLinks.classList.toggle("active");
    document.body.style.overflow = navLinks.classList.contains("active")
      ? "hidden"
      : "";
  });

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      hamburger.classList.remove("active");
      navLinks.classList.remove("active");
      document.body.style.overflow = "";
    });
  });

  document.addEventListener("click", (e) => {
    if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
      hamburger.classList.remove("active");
      navLinks.classList.remove("active");
      document.body.style.overflow = "";
    }
  });
}

// ============================================
// SMOOTH SCROLL
// ============================================
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const targetId = this.getAttribute("href");

      if (!targetId || targetId === "#" || targetId === "#!") return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();

      const offsetTop = target.offsetTop - 80;

      window.scrollTo({
        top: offsetTop,
        behavior: "smooth",
      });
    });
  });
}

// ============================================
// ACTIVE NAVIGATION LINK
// ============================================
function initActiveNav() {
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-link");

  if (sections.length === 0) return;

  let ticking = false;

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          let current = "";
          const scrollPos = window.pageYOffset;

          sections.forEach((section) => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollPos >= sectionTop - 200) {
              current = section.getAttribute("id");
            }
          });

          navLinks.forEach((link) => {
            link.classList.remove("active");
            if (link.getAttribute("href") === `#${current}`) {
              link.classList.add("active");
            }
          });

          ticking = false;
        });
        ticking = true;
      }
    },
    { passive: true },
  );
}

// ============================================
// FAQ ACCORDION
// ============================================
function initFAQ() {
  const faqItems = document.querySelectorAll(".faq-item");
  if (faqItems.length === 0) return;

  faqItems.forEach((item) => {
    const question = item.querySelector(".faq-question");
    if (!question) return;

    question.addEventListener("click", () => {
      const isActive = item.classList.contains("active");

      faqItems.forEach((faq) => {
        faq.classList.remove("active");
      });

      if (!isActive) {
        item.classList.add("active");
      }
    });
  });
}

// ============================================
// BACK TO TOP
// ============================================
function initBackToTop() {
  const backToTop = document.getElementById("backToTop");
  if (!backToTop) return;

  let ticking = false;

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (window.pageYOffset > 500) {
            backToTop.classList.add("visible");
          } else {
            backToTop.classList.remove("visible");
          }
          ticking = false;
        });
        ticking = true;
      }
    },
    { passive: true },
  );

  backToTop.addEventListener("click", (e) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });
}

// ============================================
// LIGHTBOX
// ============================================
function initLightbox() {
  const galleryItems = document.querySelectorAll(".gallery-item");
  if (galleryItems.length === 0) return;

  galleryItems.forEach((item) => {
    item.addEventListener("click", () => {
      const img = item.querySelector("img");
      const titleEl = item.querySelector("h4");

      if (!img || !img.src) return;

      const title = titleEl ? titleEl.textContent : "";
      createLightbox(img.src, img.alt || title, title);
    });
  });
}

function createLightbox(src, alt, title) {
  const lightbox = document.createElement("div");
  lightbox.className = "lightbox";
  lightbox.innerHTML = `
    <div class="lightbox-content">
      <button class="lightbox-close" aria-label="Close">&times;</button>
      <img src="${src}" alt="${alt}">
      ${title ? `<h4>${title}</h4>` : ""}
    </div>
  `;

  document.body.appendChild(lightbox);
  document.body.style.overflow = "hidden";

  const closeLightbox = () => {
    lightbox.remove();
    document.body.style.overflow = "";
    cleanup();
  };

  const handleEsc = (e) => {
    if (e.key === "Escape") closeLightbox();
  };

  const cleanup = () => {
    document.removeEventListener("keydown", handleEsc);
  };

  lightbox.addEventListener("click", (e) => {
    if (
      e.target === lightbox ||
      e.target.classList.contains("lightbox-close")
    ) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", handleEsc);
}

// ============================================
// COUNTER ANIMATION
// ============================================
function initCounters() {
  const stats = document.querySelectorAll(".stat-number");
  if (stats.length === 0) return;

  if (!("IntersectionObserver" in window)) {
    stats.forEach((stat) => animateCounter(stat));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 },
  );

  stats.forEach((stat) => observer.observe(stat));
}

function animateCounter(el) {
  const text = el.textContent;
  const match = text.match(/[\d,]+/);
  if (!match) return;

  const target = parseInt(match[0].replace(/,/g, ""));
  const suffix = text.replace(/[\d,]/g, "");
  const duration = 2000;
  const startTime = performance.now();

  const updateCounter = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
    const current = Math.floor(target * easeOutQuart);

    el.textContent = current.toLocaleString() + suffix;

    if (progress < 1) {
      requestAnimationFrame(updateCounter);
    } else {
      el.textContent = target.toLocaleString() + suffix;
    }
  };

  requestAnimationFrame(updateCounter);
}
