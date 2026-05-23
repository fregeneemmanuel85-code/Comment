// ===============================
// SCROLL REVEAL FOR ARTICLE
// ===============================

const content = document.querySelector(".ebook-content");
const cards = document.querySelectorAll(".card");

function revealElements() {
  const triggerPoint = window.innerHeight * 0.85;

  if (content) {
    const contentTop = content.getBoundingClientRect().top;
    if (contentTop < triggerPoint) {
      content.classList.add("show");
    }
  }

  cards.forEach((card) => {
    const cardTop = card.getBoundingClientRect().top;
    if (cardTop < triggerPoint) {
      card.classList.add("show");
    }
  });
}

window.addEventListener("scroll", revealElements);
window.addEventListener("load", revealElements);

// ===============================
// BACK TO TOP BUTTON
// ===============================

const topBtn = document.createElement("button");
topBtn.innerHTML = "↑";
topBtn.classList.add("top-btn");
document.body.appendChild(topBtn);

window.addEventListener("scroll", () => {
  if (window.scrollY > 400) {
    topBtn.classList.add("show-top");
  } else {
    topBtn.classList.remove("show-top");
  }
});

topBtn.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
});

// ===============================
// PAGE SCROLL PROGRESS BAR
// ===============================

const progressBar = document.createElement("div");
progressBar.classList.add("progress-bar");
document.body.appendChild(progressBar);

window.addEventListener("scroll", () => {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const scrollPercent = (scrollTop / docHeight) * 100;
  progressBar.style.width = scrollPercent + "%";
});
