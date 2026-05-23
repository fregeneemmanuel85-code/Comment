// ============================================
// SEO & PERFORMANCE OPTIMIZATION
// ============================================

// Defer non-critical operations
document.addEventListener("DOMContentLoaded", function () {
  initApp();
});

// Initialize all functionality
function initApp() {
  initNavigation();
  initMenuTabs();
  initTestimonialSlider();
  initForms();
  initGallery();
  initScrollEffects();
  initAccessibility();
  initPerformanceOptimizations();
  initSEOEnhancements();
}

// ============================================
// NAVIGATION
// ============================================

function initNavigation() {
  const navbar = document.getElementById("navbar");
  const hamburger = document.querySelector(".hamburger");
  const navLinks = document.querySelector(".nav-links");

  // Scroll effect for navbar
  let lastScroll = 0;
  window.addEventListener(
    "scroll",
    throttle(() => {
      const currentScroll = window.pageYOffset;

      // Add/remove scrolled class
      if (currentScroll > 50) {
        navbar.classList.add("scrolled");
      } else {
        navbar.classList.remove("scrolled");
      }

      // Hide/show on scroll direction (mobile)
      if (window.innerWidth <= 768) {
        if (currentScroll > lastScroll && currentScroll > 100) {
          navbar.style.transform = "translateY(-100%)";
        } else {
          navbar.style.transform = "translateY(0)";
        }
      }

      lastScroll = currentScroll;
    }, 100),
  );

  // Mobile menu toggle
  if (hamburger) {
    hamburger.addEventListener("click", () => {
      const isExpanded = hamburger.getAttribute("aria-expanded") === "true";
      hamburger.setAttribute("aria-expanded", !isExpanded);
      hamburger.classList.toggle("active");
      navLinks.classList.toggle("active");

      // Prevent body scroll when menu is open
      document.body.style.overflow = isExpanded ? "" : "hidden";
    });
  }

  // Close mobile menu on link click
  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.addEventListener("click", () => {
      hamburger.setAttribute("aria-expanded", "false");
      hamburger.classList.remove("active");
      navLinks.classList.remove("active");
      document.body.style.overflow = "";
    });
  });

  // Smooth scroll for anchor links with offset
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const targetId = this.getAttribute("href");
      const targetElement = document.querySelector(targetId);

      if (targetElement) {
        const headerOffset = 80;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition =
          elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });

        // Update URL without jumping
        history.pushState(null, null, targetId);

        // Set focus for accessibility
        targetElement.setAttribute("tabindex", "-1");
        targetElement.focus({ preventScroll: true });
      }
    });
  });
}

// ============================================
// MENU TABS
// ============================================

function initMenuTabs() {
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Remove active states
      tabBtns.forEach((b) => {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      tabContents.forEach((c) => {
        c.classList.remove("active");
        c.hidden = true;
      });

      // Add active state to clicked
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");

      // Show corresponding content
      const tabId = btn.getAttribute("data-tab");
      const tabContent = document.getElementById(tabId);
      if (tabContent) {
        tabContent.classList.add("active");
        tabContent.hidden = false;

        // Announce to screen readers
        announceToScreenReader(`Showing ${btn.textContent} menu`);
      }
    });
  });
}

// ============================================
// TESTIMONIAL SLIDER
// ============================================

function initTestimonialSlider() {
  const testimonialCards = document.querySelectorAll(".testimonial-card");
  const dots = document.querySelectorAll(".dot");
  const prevBtn = document.querySelector(".slider-prev");
  const nextBtn = document.querySelector(".slider-next");

  if (!testimonialCards.length) return;

  let currentSlide = 0;
  let autoplayInterval;
  let touchStartX = 0;
  let touchEndX = 0;

  function showSlide(index) {
    // Wrap around
    if (index >= testimonialCards.length) currentSlide = 0;
    else if (index < 0) currentSlide = testimonialCards.length - 1;
    else currentSlide = index;

    // Update slides
    testimonialCards.forEach((card, i) => {
      card.classList.toggle("active", i === currentSlide);
      card.setAttribute("aria-hidden", i !== currentSlide);
    });

    // Update dots
    dots.forEach((dot, i) => {
      dot.classList.toggle("active", i === currentSlide);
      dot.setAttribute("aria-selected", i === currentSlide);
    });

    // Announce change
    const author = testimonialCards[currentSlide].querySelector("h4");
    if (author) {
      announceToScreenReader(`Showing testimonial from ${author.textContent}`);
    }
  }

  function nextSlide() {
    showSlide(currentSlide + 1);
  }

  function prevSlide() {
    showSlide(currentSlide - 1);
  }

  function startAutoplay() {
    autoplayInterval = setInterval(nextSlide, 5000);
  }

  function stopAutoplay() {
    clearInterval(autoplayInterval);
  }

  // Event listeners
  if (nextBtn)
    nextBtn.addEventListener("click", () => {
      nextSlide();
      stopAutoplay();
      startAutoplay();
    });

  if (prevBtn)
    prevBtn.addEventListener("click", () => {
      prevSlide();
      stopAutoplay();
      startAutoplay();
    });

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      showSlide(index);
      stopAutoplay();
      startAutoplay();
    });
  });

  // Touch/swipe support
  const slider = document.querySelector(".testimonials-slider");
  if (slider) {
    slider.addEventListener(
      "touchstart",
      (e) => {
        touchStartX = e.changedTouches[0].screenX;
      },
      { passive: true },
    );

    slider.addEventListener(
      "touchend",
      (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
      },
      { passive: true },
    );
  }

  function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) nextSlide();
      else prevSlide();
    }
  }

  // Pause on hover/focus
  testimonialCards.forEach((card) => {
    card.addEventListener("mouseenter", stopAutoplay);
    card.addEventListener("mouseleave", startAutoplay);
    card.addEventListener("focusin", stopAutoplay);
    card.addEventListener("focusout", startAutoplay);
  });

  // Keyboard navigation
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      prevSlide();
      stopAutoplay();
    } else if (e.key === "ArrowRight") {
      nextSlide();
      stopAutoplay();
    }
  });

  // Start autoplay
  startAutoplay();
}

// ============================================
// FORMS
// ============================================

function initForms() {
  // Reservation form
  const reservationForm = document.getElementById("reservationForm");
  if (reservationForm) {
    // Set minimum date to today
    const dateInput = document.getElementById("date");
    if (dateInput) {
      const today = new Date().toISOString().split("T")[0];
      dateInput.setAttribute("min", today);
    }

    reservationForm.addEventListener("submit", handleReservationSubmit);

    // Real-time validation
    reservationForm
      .querySelectorAll("input, select, textarea")
      .forEach((field) => {
        field.addEventListener("blur", () => validateField(field));
        field.addEventListener("input", () => clearError(field));
      });
  }

  // Contact form
  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", handleContactSubmit);

    contactForm.querySelectorAll("input, textarea").forEach((field) => {
      field.addEventListener("blur", () => validateField(field));
      field.addEventListener("input", () => clearError(field));
    });
  }

  // Newsletter form
  const newsletterForm = document.querySelector(".newsletter-form");
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", handleNewsletterSubmit);
  }
}

function validateField(field) {
  const formGroup = field.closest(".form-group");
  const existingError = formGroup.querySelector(".error-message");

  // Remove existing error
  if (existingError) existingError.remove();

  // Check validity
  if (!field.validity.valid) {
    const error = document.createElement("span");
    error.className = "error-message";
    error.textContent =
      field.validationMessage || "Please fill out this field correctly";
    formGroup.appendChild(error);
    field.setAttribute("aria-invalid", "true");
    return false;
  }

  field.setAttribute("aria-invalid", "false");
  return true;
}

function clearError(field) {
  const formGroup = field.closest(".form-group");
  const error = formGroup.querySelector(".error-message");
  if (error) error.remove();
  field.setAttribute("aria-invalid", "false");
}

function handleReservationSubmit(e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);

  // Validate all fields
  let isValid = true;
  form.querySelectorAll("[required]").forEach((field) => {
    if (!validateField(field)) isValid = false;
  });

  if (!isValid) {
    announceToScreenReader("Please correct the errors in the form");
    return;
  }

  // Show loading state
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner"></span> Processing...';

  // Simulate API call
  setTimeout(() => {
    // Success message
    showNotification(
      "success",
      "Reservation Confirmed!",
      `Thank you, ${data.name}! Your table for ${data.guests} guests is reserved for ${data.date} at ${data.time}. A confirmation email has been sent to ${data.email}.`,
    );

    // Reset form
    form.reset();
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;

    // Track conversion
    trackEvent("reservation", "submit", {
      guests: data.guests,
      date: data.date,
    });
  }, 1500);
}

function handleContactSubmit(e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);

  // Validate
  let isValid = true;
  form.querySelectorAll("[required]").forEach((field) => {
    if (!validateField(field)) isValid = false;
  });

  if (!isValid) return;

  // Show loading
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = "Sending...";

  setTimeout(() => {
    showNotification(
      "success",
      "Message Sent!",
      `Thank you for reaching out, ${data.contactName}. We'll respond to your inquiry within 24 hours.`,
    );

    form.reset();
    submitBtn.disabled = false;
    submitBtn.textContent = "Send Message";

    trackEvent("contact", "submit");
  }, 1500);
}

function handleNewsletterSubmit(e) {
  e.preventDefault();
  const email = e.target.querySelector("input").value;

  showNotification(
    "success",
    "Subscribed!",
    `Thank you for subscribing! Updates will be sent to ${email}.`,
  );

  e.target.reset();
  trackEvent("newsletter", "subscribe");
}

// ============================================
// GALLERY LIGHTBOX
// ============================================

function initGallery() {
  const galleryItems = document.querySelectorAll(".gallery-item");
  if (!galleryItems.length) return;

  // Create modal once
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-label", "Image gallery");
  modal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close" aria-label="Close gallery">&times;</button>
            <img src="" alt="" loading="lazy">
            <p class="modal-caption"></p>
        </div>
    `;
  document.body.appendChild(modal);

  const modalImg = modal.querySelector("img");
  const modalCaption = modal.querySelector(".modal-caption");
  const closeBtn = modal.querySelector(".modal-close");

  let currentIndex = 0;
  const images = Array.from(galleryItems).map((item) => ({
    src: item.querySelector("img").src,
    caption: item.querySelector(".gallery-overlay span").textContent,
    alt: item.querySelector("img").alt,
  }));

  function openModal(index) {
    currentIndex = index;
    const image = images[index];
    modalImg.src = image.src;
    modalImg.alt = image.alt;
    modalCaption.textContent = image.caption;
    modal.classList.add("active");
    document.body.style.overflow = "hidden";

    // Trap focus
    trapFocus(modal);

    announceToScreenReader(`Opened gallery image: ${image.caption}`);
  }

  function closeModal() {
    modal.classList.remove("active");
    document.body.style.overflow = "";

    // Return focus to trigger
    if (galleryItems[currentIndex]) {
      galleryItems[currentIndex].focus();
    }
  }

  function showNext() {
    currentIndex = (currentIndex + 1) % images.length;
    updateModal();
  }

  function showPrev() {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    updateModal();
  }

  function updateModal() {
    const image = images[currentIndex];
    modalImg.style.opacity = "0";
    setTimeout(() => {
      modalImg.src = image.src;
      modalImg.alt = image.alt;
      modalCaption.textContent = image.caption;
      modalImg.style.opacity = "1";
    }, 200);
  }

  // Event listeners
  galleryItems.forEach((item, index) => {
    item.addEventListener("click", () => openModal(index));
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openModal(index);
      }
    });
    item.setAttribute("tabindex", "0");
    item.setAttribute("role", "button");
    item.setAttribute(
      "aria-label",
      `View larger image: ${item.querySelector(".gallery-overlay span").textContent}`,
    );
  });

  closeBtn.addEventListener("click", closeModal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (!modal.classList.contains("active")) return;

    switch (e.key) {
      case "Escape":
        closeModal();
        break;
      case "ArrowRight":
        showNext();
        break;
      case "ArrowLeft":
        showPrev();
        break;
    }
  });
}

// ============================================
// SCROLL EFFECTS
// ============================================

function initScrollEffects() {
  // Intersection Observer for fade-in animations
  const observerOptions = {
    root: null,
    rootMargin: "0px 0px -50px 0px",
    threshold: 0.1,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe all sections
  document.querySelectorAll("section").forEach((section) => {
    section.classList.add("scroll-animate");
    observer.observe(section);
  });

  // Parallax effect for hero
  const hero = document.querySelector(".hero");
  if (hero && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.addEventListener(
      "scroll",
      throttle(() => {
        const scrolled = window.pageYOffset;
        hero.style.backgroundPositionY = `${scrolled * 0.5}px`;
      }, 16),
    );
  }

  // Back to top button
  const backToTop = document.createElement("button");
  backToTop.className = "back-to-top";
  backToTop.innerHTML = "↑";
  backToTop.setAttribute("aria-label", "Back to top");
  backToTop.setAttribute("hidden", "");
  document.body.appendChild(backToTop);

  window.addEventListener(
    "scroll",
    throttle(() => {
      if (window.pageYOffset > 500) {
        backToTop.classList.add("visible");
        backToTop.removeAttribute("hidden");
      } else {
        backToTop.classList.remove("visible");
        backToTop.setAttribute("hidden", "");
      }
    }, 100),
  );

  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Reading progress bar
  const progressBar = document.createElement("div");
  progressBar.className = "reading-progress";
  progressBar.innerHTML = '<div class="reading-progress-bar"></div>';
  document.body.prepend(progressBar);

  const progressBarFill = progressBar.querySelector(".reading-progress-bar");

  window.addEventListener(
    "scroll",
    throttle(() => {
      const winScroll =
        document.body.scrollTop || document.documentElement.scrollTop;
      const height =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      progressBarFill.style.width = scrolled + "%";
    }, 16),
  );
}

// ============================================
// ACCESSIBILITY
// ============================================

function initAccessibility() {
  // Announce dynamic content changes
  const announcer = document.createElement("div");
  announcer.setAttribute("aria-live", "polite");
  announcer.setAttribute("aria-atomic", "true");
  announcer.className = "sr-only";
  document.body.appendChild(announcer);

  window.announcer = announcer;

  // Handle focus management for modal dialogs
  document.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      document.body.classList.add("user-is-tabbing");
    }
  });

  document.addEventListener("mousedown", () => {
    document.body.classList.remove("user-is-tabbing");
  });

  // Respect reduced motion preference
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.documentElement.style.scrollBehavior = "auto";
  }
}

function announceToScreenReader(message) {
  if (window.announcer) {
    window.announcer.textContent = message;
    setTimeout(() => {
      window.announcer.textContent = "";
    }, 1000);
  }
}

function trapFocus(element) {
  const focusableElements = element.querySelectorAll(
    'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select',
  );

  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  element.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        lastFocusable.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        firstFocusable.focus();
        e.preventDefault();
      }
    }
  });

  firstFocusable.focus();
}

// ============================================
// PERFORMANCE OPTIMIZATIONS
// ============================================

function initPerformanceOptimizations() {
  // Lazy load images with native loading="lazy"
  if ("loading" in HTMLImageElement.prototype) {
    document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
      img.addEventListener("load", () => {
        img.classList.add("loaded");
      });
    });
  } else {
    // Fallback for browsers without native lazy loading
    importLazyLoadPolyfill();
  }

  // Preload critical resources on user interaction
  let resourcesPreloaded = false;
  document.addEventListener(
    "mouseover",
    () => {
      if (!resourcesPreloaded) {
        preloadResources();
        resourcesPreloaded = true;
      }
    },
    { once: true },
  );

  // Optimize third-party scripts
  loadScriptsDeferred();
}

function importLazyLoadPolyfill() {
  const script = document.createElement("script");
  script.src =
    "https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js";
  script.async = true;
  document.head.appendChild(script);
}

function preloadResources() {
  const resources = [
    { href: "#menu", as: "document" },
    { href: "#reservations", as: "document" },
  ];

  resources.forEach((res) => {
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = res.href;
    link.as = res.as;
    document.head.appendChild(link);
  });
}

function loadScriptsDeferred() {
  // Load non-critical scripts after page load
  window.addEventListener("load", () => {
    // Analytics, chat widgets, etc.
    setTimeout(() => {
      // Load Google Analytics
      loadScript(
        "https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID",
        true,
      );
    }, 2000);
  });
}

function loadScript(src, async = false) {
  const script = document.createElement("script");
  script.src = src;
  script.async = async;
  document.body.appendChild(script);
}

// ============================================
// SEO ENHANCEMENTS
// ============================================

function initSEOEnhancements() {
  // Update page title on visibility change
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      document.title = "Come back! | Signature Bites";
    } else {
      document.title =
        "Signature Bites | Fine Dining Restaurant in New York | Michelin-Starred Chef";
    }
  });

  // Track outbound links
  document.querySelectorAll('a[href^="http"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      trackEvent("outbound", "click", {
        url: link.href,
        text: link.textContent,
      });
    });
  });

  // Dynamic meta description based on scroll position
  let metaUpdated = false;
  window.addEventListener(
    "scroll",
    throttle(() => {
      if (metaUpdated) return;

      const menuSection = document.getElementById("menu");
      if (menuSection && isInViewport(menuSection)) {
        updateMetaDescription(
          "Explore our award-winning menu featuring seasonal tasting menus, premium steaks, and fresh seafood at Signature Bites.",
        );
        metaUpdated = true;
      }
    }, 1000),
  );

  // Add structured data dynamically if needed
  addDynamicStructuredData();
}

function updateMetaDescription(description) {
  let meta = document.querySelector('meta[name="description"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "description");
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", description);
}

function addDynamicStructuredData() {
  // Add breadcrumb structured data based on current page
  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: getBreadcrumbItems(),
  };

  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(breadcrumbData);
  document.head.appendChild(script);
}

function getBreadcrumbItems() {
  const items = [];
  const sections = ["Home", "About", "Menu", "Reservations", "Contact"];

  sections.forEach((section, index) => {
    items.push({
      "@type": "ListItem",
      position: index + 1,
      name: section,
      item: `https://www.signaturebites.com/#${section.toLowerCase()}`,
    });
  });

  return items;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <=
      (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

function showNotification(type, title, message) {
  // Create notification element
  const notification = document.createElement("div");
  notification.className = `alert alert-${type}`;
  notification.setAttribute("role", "alert");
  notification.innerHTML = `
        <strong>${title}</strong>
        <p>${message}</p>
        <button class="close-btn" aria-label="Close notification">&times;</button>
    `;

  // Style the notification
  notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        max-width: 400px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;

  document.body.appendChild(notification);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease";
    setTimeout(() => notification.remove(), 300);
  }, 5000);

  // Close button
  notification.querySelector(".close-btn").addEventListener("click", () => {
    notification.remove();
  });

  // Announce to screen readers
  announceToScreenReader(`${title}: ${message}`);
}

function trackEvent(category, action, data = {}) {
  // Google Analytics 4
  if (typeof gtag !== "undefined") {
    gtag("event", action, {
      event_category: category,
      ...data,
    });
  }

  // Facebook Pixel
  if (typeof fbq !== "undefined") {
    fbq("trackCustom", `${category}_${action}`, data);
  }

  // Console log for debugging
  console.log("Event tracked:", { category, action, data });
}

// ============================================
// SERVICE WORKER REGISTRATION (PWA)
// ============================================

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered:", registration);
      })
      .catch((error) => {
        console.log("SW registration failed:", error);
      });
  });
}

// ============================================
// ERROR HANDLING
// ============================================

window.addEventListener("error", (e) => {
  console.error("Global error:", e.error);
  // Send to error tracking service
  trackEvent("error", "javascript", {
    message: e.message,
    filename: e.filename,
    lineno: e.lineno,
  });
});

window.addEventListener("unhandledrejection", (e) => {
  console.error("Unhandled promise rejection:", e.reason);
  trackEvent("error", "promise", {
    reason: e.reason.toString(),
  });
});
