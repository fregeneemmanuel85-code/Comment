// script.js

document.addEventListener("DOMContentLoaded", function () {
  // Navigation scroll effect
  const nav = document.querySelector(".nav");
  let lastScroll = 0;

  window.addEventListener("scroll", () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
      nav.classList.add("scrolled");
    } else {
      nav.classList.remove("scrolled");
    }

    lastScroll = currentScroll;
  });

  // Mobile navigation toggle
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");

  navToggle.addEventListener("click", () => {
    navToggle.classList.toggle("active");
    navLinks.classList.toggle("active");
  });

  // Close mobile menu when clicking a link
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      navToggle.classList.remove("active");
      navLinks.classList.remove("active");
    });
  });

  // Active navigation link based on scroll position
  const sections = document.querySelectorAll("section");
  const navLinksAll = document.querySelectorAll(".nav-link");

  window.addEventListener("scroll", () => {
    let current = "";

    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;

      if (pageYOffset >= sectionTop - 200) {
        current = section.getAttribute("id");
      }
    });

    navLinksAll.forEach((link) => {
      link.classList.remove("active");
      if (link.getAttribute("href") === `#${current}`) {
        link.classList.add("active");
      }
    });
  });

  // Counter animation for stats
  const counters = document.querySelectorAll(".stat-number");
  const speed = 200;

  const animateCounters = () => {
    counters.forEach((counter) => {
      const target = +counter.getAttribute("data-target");
      const count = +counter.innerText;
      const increment = target / speed;

      if (count < target) {
        counter.innerText = Math.ceil(count + increment);
        setTimeout(animateCounters, 20);
      } else {
        counter.innerText = target + "+";
      }
    });
  };

  // Intersection Observer for counters
  const statsSection = document.querySelector(".hero-stats");
  let counted = false;

  const observerOptions = {
    threshold: 0.5,
  };

  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !counted) {
        animateCounters();
        counted = true;
      }
    });
  }, observerOptions);

  if (statsSection) {
    statsObserver.observe(statsSection);
  }

  // Skills tabs
  const skillTabs = document.querySelectorAll(".skill-tab");
  const skillGrids = document.querySelectorAll(".skills-grid");
  const skillBars = document.querySelectorAll(".skill-progress");

  skillTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      // Remove active class from all tabs
      skillTabs.forEach((t) => t.classList.remove("active"));
      skillGrids.forEach((g) => g.classList.remove("active"));

      // Add active class to clicked tab
      tab.classList.add("active");

      // Show corresponding grid
      const category = tab.getAttribute("data-category");
      const activeGrid = document.querySelector(
        `.skills-grid[data-category="${category}"]`,
      );
      activeGrid.classList.add("active");

      // Animate skill bars
      setTimeout(() => {
        const activeBars = activeGrid.querySelectorAll(".skill-progress");
        activeBars.forEach((bar) => {
          const width = bar.style.width;
          bar.style.width = "0";
          setTimeout(() => {
            bar.style.width = width;
          }, 100);
        });
      }, 100);
    });
  });

  // Animate skill bars on initial load
  setTimeout(() => {
    const activeGrid = document.querySelector(".skills-grid.active");
    if (activeGrid) {
      const bars = activeGrid.querySelectorAll(".skill-progress");
      bars.forEach((bar) => {
        const width = bar.style.width;
        bar.style.width = "0";
        setTimeout(() => {
          bar.style.width = width;
        }, 100);
      });
    }
  }, 500);

  // Timeline animation
  const timelineItems = document.querySelectorAll(".timeline-item");

  const timelineObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add("visible");
          }, index * 200);
        }
      });
    },
    { threshold: 0.2 },
  );

  timelineItems.forEach((item) => {
    timelineObserver.observe(item);
  });

  // ==========================================
  // Portfolio Filter - UPDATED
  // ==========================================
  const filterBtns = document.querySelectorAll(".filter-btn");
  const portfolioItems = document.querySelectorAll(".portfolio-item");

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Remove active class from all buttons
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const filter = btn.getAttribute("data-filter");

      portfolioItems.forEach((item) => {
        const category = item.getAttribute("data-category");

        if (filter === "all" || category === filter) {
          // Use flex (not block) to maintain column layout with URL below
          item.style.display = "flex";
          setTimeout(() => {
            item.style.opacity = "1";
            item.style.transform = "scale(1)";
          }, 10);
        } else {
          item.style.opacity = "0";
          item.style.transform = "scale(0.8)";
          setTimeout(() => {
            item.style.display = "none";
          }, 300);
        }
      });
    });
  });

  // Testimonials slider
  const track = document.querySelector(".testimonials-track");
  const prevBtn = document.querySelector(".testimonial-btn.prev");
  const nextBtn = document.querySelector(".testimonial-btn.next");
  const cards = document.querySelectorAll(".testimonial-card");

  let currentIndex = 0;

  const updateSlider = () => {
    const cardWidth = cards[0].offsetWidth + 32; // Including gap
    track.scrollTo({
      left: currentIndex * cardWidth,
      behavior: "smooth",
    });
  };

  prevBtn.addEventListener("click", () => {
    currentIndex = currentIndex > 0 ? currentIndex - 1 : cards.length - 1;
    updateSlider();
  });

  nextBtn.addEventListener("click", () => {
    currentIndex = currentIndex < cards.length - 1 ? currentIndex + 1 : 0;
    updateSlider();
  });

  // Contact form handling
  const contactForm = document.getElementById("contactForm");

  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const formData = new FormData(contactForm);
    const data = Object.fromEntries(formData);

    // Simulate form submission
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    submitBtn.textContent = "Sending...";
    submitBtn.disabled = true;

    setTimeout(() => {
      alert("Thank you for your message! I'll get back to you soon.");
      contactForm.reset();
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }, 1500);
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });

  // Parallax effect for gradient orbs
  window.addEventListener("mousemove", (e) => {
    const orbs = document.querySelectorAll(".gradient-orb");
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;

    orbs.forEach((orb, index) => {
      const speed = (index + 1) * 20;
      const xOffset = (0.5 - x) * speed;
      const yOffset = (0.5 - y) * speed;

      orb.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
    });
  });

  // Reveal animations on scroll
  const revealElements = document.querySelectorAll(
    ".service-card, .process-card, .blog-card, .portfolio-item",
  );

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
          }, index * 100);
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 },
  );

  revealElements.forEach((el) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(30px)";
    el.style.transition = "all 0.6s ease";
    revealObserver.observe(el);
  });

  // Add glitch effect to hero title on load
  const heroTitle = document.querySelector(".hero-title");
  if (heroTitle) {
    setTimeout(() => {
      heroTitle.style.animation = "none";
    }, 1000);
  }
});

// Newsletter form handling
const newsletterForm = document.getElementById("newsletterForm");
if (newsletterForm) {
  newsletterForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = newsletterForm.querySelector('input[type="email"]').value;

    // Simulate subscription
    const button = newsletterForm.querySelector("button");
    const originalContent = button.innerHTML;

    button.innerHTML = "✓";
    button.style.background = "#10b981";

    setTimeout(() => {
      alert(
        `Thanks for subscribing with ${email}! You'll receive updates soon.`,
      );
      newsletterForm.reset();
      button.innerHTML = originalContent;
      button.style.background = "";
    }, 500);
  });
}

// Add smooth scroll for footer links
document.querySelectorAll('.footer-links a[href^="#"]').forEach((link) => {
  link.addEventListener("click", function (e) {
    const href = this.getAttribute("href");
    if (href !== "#") {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
  });
});
