// Menu Data
const menuItems = [
  // Rice
  {
    id: 1,
    name: "Party Jollof Rice",
    price: 1500,
    category: "rice",
    image:
      "https://images.unsplash.com/photo-1512058564366-18510be2db19?ixlib=rb-4.0.3&w=400&q=80",
    desc: "Smoky party-style rice with rich tomato stew",
    spice: 2,
  },
  {
    id: 2,
    name: "Fried Rice Special",
    price: 1600,
    category: "rice",
    image:
      "https://images.unsplash.com/photo-1603133872878-684f208fb74b?ixlib=rb-4.0.3&w=400&q=80",
    desc: "Mixed vegetables and liver with seasoned rice",
    spice: 1,
  },
  {
    id: 3,
    name: "Ofada Rice & Sauce",
    price: 2000,
    category: "rice",
    image:
      "https://images.unsplash.com/photo-1596560548464-f010549b84d7?ixlib=rb-4.0.3&w=400&q=80",
    desc: "Local brown rice with spicy ayamase sauce",
    spice: 4,
  },

  // Swallows
  {
    id: 4,
    name: "Pounded Yam & Egusi",
    price: 2500,
    category: "swallows",
    image:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&w=400&q=80",
    desc: "Smooth pounded yam with thick egusi soup",
    spice: 2,
  },
  {
    id: 5,
    name: "Amala & Ewedu",
    price: 1800,
    category: "swallows",
    image:
      "https://images.unsplash.com/photo-1565557623262-b51c2513a641?ixlib=rb-4.0.3&w=400&q=80",
    desc: "Yam flour with jute leaf soup and stew",
    spice: 3,
  },
  {
    id: 6,
    name: "Semo & Ogbono",
    price: 2200,
    category: "swallows",
    image:
      "https://images.unsplash.com/photo-1589302168068-964664d93dc0?ixlib=rb-4.0.3&w=400&q=80",
    desc: "Draw soup with assorted meat and fish",
    spice: 2,
  },

  // Grills
  {
    id: 7,
    name: "Beef Suya",
    price: 1500,
    category: "grills",
    image:
      "https://images.unsplash.com/photo-1529193591184-b1d580690dd0?ixlib=rb-4.0.3&w=400&q=80",
    desc: "Spicy grilled beef skewers with onions",
    spice: 3,
  },
  {
    id: 8,
    name: "Chicken Suya",
    price: 1800,
    category: "grills",
    image:
      "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?ixlib=rb-4.0.3&w=400&q=80",
    desc: "Grilled chicken with yaji spice",
    spice: 3,
  },
  {
    id: 9,
    name: "Asun (Goat Meat)",
    price: 2500,
    category: "grills",
    image:
      "https://images.unsplash.com/photo-1544025162-d76694265947?ixlib=rb-4.0.3&w=400&q=80",
    desc: "Spicy peppered goat meat",
    spice: 4,
  },

  // Snacks
  {
    id: 10,
    name: "Puff Puff (5pcs)",
    price: 500,
    category: "snacks",
    image:
      "https://images.unsplash.com/photo-1601050690597-df0568f70950?ixlib=rb-4.0.3&w=400&q=80",
    desc: "Sweet fried dough balls",
    spice: 0,
  },
  {
    id: 11,
    name: "Meat Pie",
    price: 600,
    category: "snacks",
    image:
      "https://images.unsplash.com/photo-1512152272829-e3139601d185?ixlib=rb-4.0.3&w=400&q=80",
    desc: "Flaky pastry with minced beef filling",
    spice: 1,
  },
  {
    id: 12,
    name: "Akara (Bean Cake)",
    price: 400,
    category: "snacks",
    image:
      "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?ixlib=rb-4.0.3&w=400&q=80",
    desc: "Fried bean fritters",
    spice: 1,
  },
  {
    id: 13,
    name: "Chin Chin",
    price: 300,
    category: "snacks",
    image:
      "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?ixlib=rb-4.0.3&w=400&q=80",
    desc: "Crunchy fried snack",
    spice: 0,
  },

  // Drinks
  {
    id: 14,
    name: "Chapman",
    price: 800,
    category: "drinks",
    image:
      "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?ixlib=rb-4.0.3&w=400&q=80",
    desc: "Nigerian mocktail with fruits",
    spice: 0,
  },
  {
    id: 15,
    name: "Zobo Drink",
    price: 500,
    category: "drinks",
    image:
      "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?ixlib=rb-4.0.3&w=400&q=80",
    desc: "Hibiscus flower drink",
    spice: 0,
  },
  {
    id: 16,
    name: "Fresh Palm Wine",
    price: 1000,
    category: "drinks",
    image:
      "https://images.unsplash.com/photo-1560512823-8c267324300e?ixlib=rb-4.0.3&w=400&q=80",
    desc: "Tapped fresh palm wine",
    spice: 0,
  },
];

// WhatsApp Number - Change this to your actual WhatsApp number
const WHATSAPP_NUMBER = "2348001234567";

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  renderMenu("all");
  setupNavbarScroll();
});

/**
 * Render menu items based on category filter
 * @param {string} category - Category to filter by ('all' for all items)
 */
function renderMenu(category) {
  const grid = document.getElementById("menu-grid");
  grid.innerHTML = "";

  const filtered =
    category === "all"
      ? menuItems
      : menuItems.filter((item) => item.category === category);

  filtered.forEach((item) => {
    const spiceHtml = generateSpiceIndicator(item.spice);
    const card = createMenuCard(item, spiceHtml);
    grid.appendChild(card);
  });
}

/**
 * Generate spice level HTML indicator
 * @param {number} level - Spice level (0-5)
 * @returns {string} HTML string of pepper icons
 */
function generateSpiceIndicator(level) {
  return Array(5)
    .fill(0)
    .map(
      (_, i) => `<span class="${i < level ? "pepper" : "no-pepper"}">🌶</span>`,
    )
    .join("");
}

/**
 * Create WhatsApp order link
 * @param {string} itemName - Name of the item
 * @param {number} price - Price of the item
 * @returns {string} WhatsApp URL
 */
function createWhatsAppLink(itemName, price) {
  const message = `Hello ChopLife! I want to order: ${itemName} (₦${price.toLocaleString()})`;
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
}

/**
 * Create menu card HTML element
 * @param {Object} item - Menu item data
 * @param {string} spiceHtml - Spice indicator HTML
 * @returns {HTMLElement} Card element
 */
function createMenuCard(item, spiceHtml) {
  const card = document.createElement("div");
  card.className =
    "food-card bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition duration-300 border border-gray-100";

  const whatsappLink = createWhatsAppLink(item.name, item.price);

  card.innerHTML = `
        <div class="h-48 overflow-hidden relative">
            <img src="${item.image}" alt="${item.name}" class="food-img w-full h-full object-cover">
            <div class="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-bold text-green-700">
                ₦${item.price.toLocaleString()}
            </div>
        </div>
        <div class="p-6">
            <div class="flex justify-between items-start mb-2">
                <h3 class="text-xl font-bold text-gray-900">${item.name}</h3>
                <div class="spice-level text-xs">${spiceHtml}</div>
            </div>
            <p class="text-gray-600 text-sm mb-4">${item.desc}</p>
            <a href="${whatsappLink}" target="_blank" class="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                Order on WhatsApp
            </a>
        </div>
    `;
  return card;
}

/**
 * Filter menu by category
 * @param {string} category - Category to filter
 */
function filterMenu(category) {
  // Update button styles
  document.querySelectorAll(".category-btn").forEach((btn) => {
    btn.classList.remove("bg-green-600", "text-white", "active");
    btn.classList.add("bg-white", "text-gray-700");
  });

  // Highlight active button
  const activeBtn = event.target;
  activeBtn.classList.remove("bg-white", "text-gray-700");
  activeBtn.classList.add("bg-green-600", "text-white", "active");

  renderMenu(category);
}

/**
 * Setup navbar scroll effect
 */
function setupNavbarScroll() {
  window.addEventListener("scroll", () => {
    const navbar = document.getElementById("navbar");

    if (window.scrollY > 50) {
      navbar.classList.add("shadow-lg");
      navbar.classList.remove("h-20");
      navbar.classList.add("h-16");
    } else {
      navbar.classList.remove("shadow-lg");
      navbar.classList.remove("h-16");
      navbar.classList.add("h-20");
    }
  });
}

// Export functions for testing (if needed)
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    menuItems,
    generateSpiceIndicator,
    createWhatsAppLink,
  };
}
