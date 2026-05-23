// ============================================
// PORTFOLIO PAGE JAVASCRIPT
// Laurel-G Dezyns & Fashionique
// ============================================

// Portfolio Data - 10 Images (matching updated HTML)
const portfolioData = [
  {
    src: "./images/design4.jpeg",
    category: "Bridal",
    title: "Ivory Dreams",
    description:
      "Traditional meets contemporary in this stunning bridal masterpiece. Hand-embroidered lace details with a modern silhouette.",
  },
  {
    src: "./images/brand2.jpeg",
    category: "Evening Wear",
    title: "Crimson Elegance",
    description:
      "A bold statement piece for the modern woman. Deep red silk with intricate beadwork and dramatic train.",
  },
  {
    src: "./images/design3.jpeg",
    category: "Corporate",
    title: "Executive Power",
    description:
      "Command the boardroom with confidence and style. Tailored navy suit with gold accents.",
  },
  {
    src: "./images/service2.jpg",
    category: "Casual",
    title: "Urban Street",
    description:
      "Effortless style for the city dweller. Comfortable yet chic everyday wear.",
  },
  {
    src: "./images/service3.jpg",
    category: "Simple Gown",
    title: "Simple Luxery Gown",
    description: "Simple and elegant for the discerning client.",
  },
  {
    src: "./images/design7.jpeg",
    category: "Bridal",
    title: "Royal Wedding",
    description:
      "Regal elegance for your special day. Crystal embellishments with cathedral veil.",
  },
  {
    src: "./images/design5.jpeg",
    category: "Evening Wear",
    title: "Midnight Gala",
    description:
      "Sophisticated glamour for exclusive events. Black velvet with diamond neckline.",
  },
  {
    src: "./images/brand6.jpeg",
    category: "Corporate",
    title: "Modern Professional",
    description:
      "Redefining office wear with contemporary flair. Structured blazer with wide-leg trousers.",
  },
  {
    src: "./images/design10.jpeg",
    category: "Casual",
    title: "Weekend Chic",
    description:
      "Relaxed elegance for your days off. Linen blend with artisanal details.",
  },
  {
    src: "./images/design8.jpeg",
    category: "Simple Gown",
    title: "Statement Pieces",
    description: "Simple and bold to complete any ensemble.",
  },
];

let currentImageIndex = 0;

document.addEventListener("DOMContentLoaded", function () {
  // Initialize AOS
  AOS.init({
    duration: 800,
    once: true,
    offset: 100,
    easing: "ease-out-cubic",
  });

  // Preloader
  const preloader = document.querySelector(".preloader");
  setTimeout(() => {
    preloader.classList.add("hidden");
  }, 1500);

  // Navbar Scroll Effect
  const navbar = document.getElementById("navbar");
  window.addEventListener("scroll", () => {
    if (window.pageYOffset > 50) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  });

  // Mobile Menu Toggle
  const hamburger = document.querySelector(".hamburger");
  const navLinks = document.querySelector(".nav-links");

  hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("active");
    navLinks.classList.toggle("active");
  });

  // Close mobile menu when clicking on a link
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      hamburger.classList.remove("active");
      navLinks.classList.remove("active");
    });
  });

  // Filter Functionality
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
        if (filter === "all" || item.classList.contains(filter)) {
          item.classList.remove("hide");
          setTimeout(() => {
            item.style.opacity = "1";
            item.style.transform = "scale(1)";
          }, 10);
        } else {
          item.style.opacity = "0";
          item.style.transform = "scale(0.8)";
          setTimeout(() => {
            item.classList.add("hide");
          }, 300);
        }
      });
    });
  });

  // Back to Top Button
  const backToTop = document.getElementById("backToTop");
  window.addEventListener("scroll", () => {
    if (window.pageYOffset > 500) {
      backToTop.classList.add("visible");
    } else {
      backToTop.classList.remove("visible");
    }
  });

  backToTop.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });

  // Keyboard Navigation for Lightbox
  document.addEventListener("keydown", (e) => {
    const lightbox = document.getElementById("lightbox");
    if (lightbox.classList.contains("active")) {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") changeImage(-1);
      if (e.key === "ArrowRight") changeImage(1);
    }
  });
});

// Lightbox Functions
function openLightbox(index) {
  currentImageIndex = index;
  const lightbox = document.getElementById("lightbox");
  const img = document.getElementById("lightbox-img");
  const category = document.getElementById("lightbox-category");
  const title = document.getElementById("lightbox-title");
  const desc = document.getElementById("lightbox-desc");

  img.src = portfolioData[index].src;
  category.textContent = portfolioData[index].category;
  title.textContent = portfolioData[index].title;
  desc.textContent = portfolioData[index].description;

  lightbox.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  const lightbox = document.getElementById("lightbox");
  lightbox.classList.remove("active");
  document.body.style.overflow = "";
}

function changeImage(direction) {
  currentImageIndex += direction;

  if (currentImageIndex < 0) {
    currentImageIndex = portfolioData.length - 1;
  } else if (currentImageIndex >= portfolioData.length) {
    currentImageIndex = 0;
  }

  const img = document.getElementById("lightbox-img");
  const category = document.getElementById("lightbox-category");
  const title = document.getElementById("lightbox-title");
  const desc = document.getElementById("lightbox-desc");

  // Add fade effect
  img.style.opacity = "0";

  setTimeout(() => {
    img.src = portfolioData[currentImageIndex].src;
    category.textContent = portfolioData[currentImageIndex].category;
    title.textContent = portfolioData[currentImageIndex].title;
    desc.textContent = portfolioData[currentImageIndex].description;
    img.style.opacity = "1";
  }, 200);
}

// Close lightbox when clicking outside
document.addEventListener("click", (e) => {
  const lightbox = document.getElementById("lightbox");
  if (e.target === lightbox) {
    closeLightbox();
  }
});
