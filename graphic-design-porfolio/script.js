// script.js

document.addEventListener("DOMContentLoaded", function () {
  // ========== Navbar Scroll Effect ==========
  const navbar = document.getElementById("navbar");
  let lastScroll = 0;

  window.addEventListener("scroll", () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 50) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }

    lastScroll = currentScroll;
  });

  // ========== Mobile Menu Toggle ==========
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.querySelector(".nav-links");

  hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("active");
    navLinks.classList.toggle("active");
  });

  // Close mobile menu when clicking a link
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      hamburger.classList.remove("active");
      navLinks.classList.remove("active");
    });
  });

  // ========== Active Navigation Link ==========
  const sections = document.querySelectorAll("section");
  const navItems = document.querySelectorAll(".nav-link");

  window.addEventListener("scroll", () => {
    let current = "";

    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;

      if (pageYOffset >= sectionTop - 200) {
        current = section.getAttribute("id");
      }
    });

    navItems.forEach((link) => {
      link.classList.remove("active");
      if (link.getAttribute("href") === `#${current}`) {
        link.classList.add("active");
      }
    });
  });

  // ========== Portfolio Filter ==========
  const filterBtns = document.querySelectorAll(".filter-btn");
  const portfolioItems = document.querySelectorAll(".portfolio-item");

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Remove active class from all buttons
      filterBtns.forEach((b) => b.classList.remove("active"));
      // Add active class to clicked button
      btn.classList.add("active");

      const filter = btn.getAttribute("data-filter");

      portfolioItems.forEach((item) => {
        if (filter === "all" || item.getAttribute("data-category") === filter) {
          item.classList.remove("hidden");
          setTimeout(() => {
            item.style.opacity = "1";
            item.style.transform = "scale(1)";
          }, 50);
        } else {
          item.style.opacity = "0";
          item.style.transform = "scale(0.8)";
          setTimeout(() => {
            item.classList.add("hidden");
          }, 300);
        }
      });
    });
  });

  // ========== Skill Bars Animation ==========
  const skillFills = document.querySelectorAll(".skill-fill");
  const skillsSection = document.querySelector(".skills-grid");
  let skillsAnimated = false;

  function animateSkills() {
    if (skillsAnimated) return;

    const sectionTop = skillsSection.getBoundingClientRect().top;
    const windowHeight = window.innerHeight;

    if (sectionTop < windowHeight - 100) {
      skillFills.forEach((fill) => {
        const width = fill.getAttribute("data-width");
        fill.style.width = width + "%";
      });
      skillsAnimated = true;
    }
  }

  // ========== Counter Animation ==========
  const statNumbers = document.querySelectorAll(".stat-number");
  const statsSection = document.querySelector(".about-stats");
  let statsAnimated = false;

  function animateStats() {
    if (statsAnimated) return;

    const sectionTop = statsSection.getBoundingClientRect().top;
    const windowHeight = window.innerHeight;

    if (sectionTop < windowHeight - 100) {
      statNumbers.forEach((stat) => {
        const target = parseInt(stat.getAttribute("data-target"));
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;

        const updateCounter = () => {
          current += increment;
          if (current < target) {
            stat.textContent = Math.floor(current);
            requestAnimationFrame(updateCounter);
          } else {
            stat.textContent = target;
          }
        };

        updateCounter();
      });
      statsAnimated = true;
    }
  }

  // ========== Process Timeline Animation ==========
  const processSteps = document.querySelectorAll(".process-step");

  function animateProcess() {
    processSteps.forEach((step, index) => {
      const stepTop = step.getBoundingClientRect().top;
      const windowHeight = window.innerHeight;

      if (stepTop < windowHeight - 100) {
        setTimeout(() => {
          step.classList.add("visible");
        }, index * 200);
      }
    });
  }

  // ========== Scroll Event Listener ==========
  window.addEventListener("scroll", () => {
    animateSkills();
    animateStats();
    animateProcess();
  });

  // Initial check
  animateSkills();
  animateStats();
  animateProcess();

  // ========== Smooth Scroll for Anchor Links ==========
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));

      if (target) {
        const offsetTop = target.offsetTop - 80;
        window.scrollTo({
          top: offsetTop,
          behavior: "smooth",
        });
      }
    });
  });

  // ========== Contact Form ==========
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
      submitBtn.textContent = "Message Sent!";
      submitBtn.style.backgroundColor = "#4a7c59";
      submitBtn.style.borderColor = "#4a7c59";

      setTimeout(() => {
        submitBtn.textContent = originalText;
        submitBtn.style.backgroundColor = "";
        submitBtn.style.borderColor = "";
        submitBtn.disabled = false;
        contactForm.reset();
      }, 3000);
    }, 1500);
  });

  // ========== Parallax Effect for Hero Shapes ==========
  const shapes = document.querySelectorAll(".abstract-shape");

  window.addEventListener("mousemove", (e) => {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;

    shapes.forEach((shape, index) => {
      const speed = (index + 1) * 20;
      const xOffset = (x - 0.5) * speed;
      const yOffset = (y - 0.5) * speed;

      shape.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
    });
  });
});
