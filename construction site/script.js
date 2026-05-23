/* ================= MOBILE NAV TOGGLE ================= */
const hamburger = document.querySelector(".hamburger");
const navLinks = document.querySelector("nav ul");

if (hamburger) {
  hamburger.addEventListener("click", () => {
    navLinks.classList.toggle("show");
  });
}

/* ================= ANIMATED COUNTERS ================= */
const counters = document.querySelectorAll(".counter");
let counterStarted = false;

function startCounters() {
  counters.forEach((counter) => {
    const target = +counter.getAttribute("data-target");
    let count = 0;
    const increment = target / 100;

    const updateCounter = () => {
      count += increment;
      if (count < target) {
        counter.innerText = Math.floor(count);
        requestAnimationFrame(updateCounter);
      } else {
        counter.innerText = target + "+";
      }
    };

    updateCounter();
  });
}

function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return rect.top < window.innerHeight && rect.bottom >= 0;
}

window.addEventListener("scroll", () => {
  const statsSection = document.querySelector(".stats-section");
  if (statsSection && isInViewport(statsSection) && !counterStarted) {
    startCounters();
    counterStarted = true;
  }
});

/* ================= PROJECT FILTER WITH FADE ================= */
function filterProjects(category) {
  const cards = document.querySelectorAll(".project-card");
  const buttons = document.querySelectorAll(".filter-buttons button");

  buttons.forEach((btn) => btn.classList.remove("active"));
  event.target.classList.add("active");

  cards.forEach((card) => {
    card.style.opacity = "0";
    setTimeout(() => {
      if (category === "all" || card.dataset.category === category) {
        card.style.display = "block";
        setTimeout(() => (card.style.opacity = "1"), 50);
      } else {
        card.style.display = "none";
      }
    }, 300);
  });
}

/* ================= TESTIMONIAL SCROLL ================= */
const testimonials = document.querySelector(".testimonials");
const nextBtn = document.querySelector(".next-arrow");
const prevBtn = document.querySelector(".prev-arrow");

if (nextBtn && testimonials) {
  nextBtn.addEventListener("click", () => {
    testimonials.scrollBy({
      left: 320,
      behavior: "smooth",
    });
  });
}

if (prevBtn && testimonials) {
  prevBtn.addEventListener("click", () => {
    testimonials.scrollBy({
      left: -320,
      behavior: "smooth",
    });
  });
}

/* ================= DRAG SCROLL (Services & Testimonials) ================= */
function enableDragScroll(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  let isDown = false;
  let startX;
  let scrollLeft;

  container.addEventListener("mousedown", (e) => {
    isDown = true;
    startX = e.pageX - container.offsetLeft;
    scrollLeft = container.scrollLeft;
  });

  container.addEventListener("mouseleave", () => {
    isDown = false;
  });

  container.addEventListener("mouseup", () => {
    isDown = false;
  });

  container.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startX) * 2;
    container.scrollLeft = scrollLeft - walk;
  });
}

enableDragScroll(".scrolling-services");
enableDragScroll(".testimonials");
