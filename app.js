// --- PLANT DATABASE ---
const PLANT_DATABASE = [
  {
    id: 'monstera',
    name: 'Monstera Deliciosa',
    latin: 'Monstera deliciosa',
    description: 'Famous for its iconic leaf fenestrations, the Monstera Deliciosa is a statement piece for any room. It is a climbing evergreen climber that thrives in indirect sunlight and moderate watering.',
    prices: { small: 32, medium: 48, large: 75 },
    image: 'assets/images/monstera.jpg',
    light: 'indirect', // indirect, low, direct
    difficulty: 'beginner', // beginner, intermediate, wizard
    petSafe: false,
    waterCycleDays: 14 // Will map to 140 seconds in fast simulation mode
  },
  {
    id: 'snake_plant',
    name: 'Snake Plant Laurentii',
    latin: 'Sansevieria trifasciata',
    description: 'Virtually indestructible. The Snake Plant features stiff, sword-like variegated leaves with gold borders. It filters indoor air and is extremely tolerant of neglect.',
    prices: { small: 24, medium: 36, large: 58 },
    image: 'assets/images/snake_plant.jpg',
    light: 'low',
    difficulty: 'beginner',
    petSafe: false,
    waterCycleDays: 28 // 280 seconds in simulation
  },
  {
    id: 'calathea',
    name: 'Calathea Rattlesnake',
    latin: 'Calathea lancifolia',
    description: 'Featuring beautiful spotted leaves with deep purple undersides, the Rattlesnake plant folds its leaves up at night. It loves high humidity and indirect light.',
    prices: { small: 28, medium: 42, large: 64 },
    image: 'assets/images/calathea.jpg',
    light: 'indirect',
    difficulty: 'intermediate',
    petSafe: true,
    waterCycleDays: 8 // 80 seconds in simulation
  }
];

// --- APP STATE ---
let state = {
  cart: [],
  garden: [
    // Pre-seed one plant in the garden so it doesn't start completely blank
    {
      id: 'preseed-snake',
      plantId: 'snake_plant',
      name: 'Office Companion',
      image: 'assets/images/snake_plant.jpg',
      registeredAt: Date.now() - 100000,
      lastWatered: Date.now() - 80000,
      waterCycleDays: 28,
      hydration: 70
    }
  ],
  activePage: 'home',
  selectedFilters: {
    light: [],
    difficulty: [],
    petSafe: false
  },
  checkoutZip: '',
  heatPackAdded: false,
  pendingGardenRegistration: null // Stores plant details after check-out for QR scan
};

// --- SIMULATION PARAMETERS ---
// 1 plant day = 5 seconds of real time for demo purposes, so hydration drains visibly
const SIM_DAY_MS = 5000; 

// --- ROUTING / NAVIGATION ---
function navigate(pageId) {
  state.activePage = pageId;
  
  // Update navigation visual indicator
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.dataset.page === pageId) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Switch visible sections
  document.querySelectorAll('.page-section').forEach(section => {
    if (section.id === `${pageId}-page`) {
      section.classList.add('active');
    } else {
      section.classList.remove('active');
    }
  });

  // Additional rendering logic when entering pages
  if (pageId === 'catalog') {
    renderCatalog();
  } else if (pageId === 'garden') {
    renderGarden();
  }

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- CATALOG RENDERING & FILTERING ---
function renderCatalog() {
  const grid = document.getElementById('catalog-grid');
  grid.innerHTML = '';

  const filtered = PLANT_DATABASE.filter(plant => {
    // Light filter
    if (state.selectedFilters.light.length > 0 && !state.selectedFilters.light.includes(plant.light)) {
      return false;
    }
    // Difficulty filter
    if (state.selectedFilters.difficulty.length > 0 && !state.selectedFilters.difficulty.includes(plant.difficulty)) {
      return false;
    }
    // Pet safety filter
    if (state.selectedFilters.petSafe && !plant.petSafe) {
      return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: var(--color-text-muted);">
        <p style="font-size: 1.1rem; margin-bottom: 1rem;">No plants match your specific criteria.</p>
        <button class="btn btn-secondary" onclick="resetFilters()">Reset Filters</button>
      </div>
    `;
    return;
  }

  filtered.forEach(plant => {
    const card = document.createElement('div');
    card.className = 'plant-card';
    card.innerHTML = `
      <div class="card-img-wrapper">
        <img src="${plant.image}" alt="${plant.name}">
        <div class="card-badges">
          <span class="card-badge">${capitalize(plant.light)} Light</span>
          <span class="card-badge">${capitalize(plant.difficulty)}</span>
          ${plant.petSafe 
            ? '<span class="card-badge badge-accent">🐱 Pet Friendly</span>' 
            : '<span class="card-badge badge-danger">⚠️ Toxic to Pets</span>'}
        </div>
      </div>
      <div class="card-content">
        <h3 class="card-title">${plant.name}</h3>
        <p class="card-latin">${plant.latin}</p>
        <div class="card-footer">
          <span class="card-price">$${plant.prices.small}+</span>
          <button class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.85rem;" onclick="openBuilder('${plant.id}')">Configure</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function handleFilterChange(category, value, checked) {
  if (category === 'petSafe') {
    state.selectedFilters.petSafe = checked;
  } else {
    if (checked) {
      state.selectedFilters[category].push(value);
    } else {
      state.selectedFilters[category] = state.selectedFilters[category].filter(val => val !== value);
    }
  }
  renderCatalog();
}

function resetFilters() {
  state.selectedFilters = { light: [], difficulty: [], petSafe: false };
  document.querySelectorAll('.filters-sidebar input[type="checkbox"]').forEach(cb => cb.checked = false);
  renderCatalog();
}

// --- PRODUCT BUILDER MODAL ---
let activeBuilderPlant = null;

function openBuilder(plantId) {
  const plant = PLANT_DATABASE.find(p => p.id === plantId);
  activeBuilderPlant = plant;

  document.getElementById('builder-title').textContent = plant.name;
  document.getElementById('builder-latin').textContent = plant.latin;
  document.getElementById('builder-description').textContent = plant.description;
  document.getElementById('builder-image').src = plant.image;
  
  // Set default values in options inputs
  document.getElementById('size-small').checked = true;
  document.getElementById('pot-terracotta').checked = true;

  // Set tags
  const tagsContainer = document.getElementById('builder-tags');
  tagsContainer.innerHTML = `
    <span class="card-badge">${capitalize(plant.light)} Light</span>
    <span class="card-badge">${capitalize(plant.difficulty)}</span>
    ${plant.petSafe ? '<span class="card-badge badge-accent">🐱 Pet Friendly</span>' : '<span class="card-badge badge-danger">⚠️ Toxic to Pets</span>'}
  `;

  updateBuilderPriceAndPreview();

  document.getElementById('builder-modal').classList.add('active');
}

function closeBuilder() {
  document.getElementById('builder-modal').classList.remove('active');
  activeBuilderPlant = null;
}

function updateBuilderPriceAndPreview() {
  if (!activeBuilderPlant) return;

  const size = document.querySelector('input[name="size"]:checked').value;
  const potColor = document.querySelector('input[name="pot"]:checked').value;

  // Dynamic Price calculations
  let basePrice = activeBuilderPlant.prices[size];
  let potSurcharge = potColor === 'white' || potColor === 'grey' ? 10 : 0; // custom design pots cost extra
  const totalPrice = basePrice + potSurcharge;

  document.getElementById('builder-price').textContent = `$${totalPrice}`;

  // Preview pot borders changes
  const wrapper = document.getElementById('builder-img-wrapper');
  wrapper.className = 'plant-view-wrapper'; // reset
  wrapper.classList.add(`pot-${potColor}`);
}

function addConfiguredToCart() {
  if (!activeBuilderPlant) return;

  const size = document.querySelector('input[name="size"]:checked').value;
  const potColor = document.querySelector('input[name="pot"]:checked').value;
  
  let basePrice = activeBuilderPlant.prices[size];
  let potSurcharge = potColor === 'white' || potColor === 'grey' ? 10 : 0;
  const price = basePrice + potSurcharge;

  const item = {
    cartId: `${activeBuilderPlant.id}-${size}-${potColor}-${Date.now()}`,
    id: activeBuilderPlant.id,
    name: activeBuilderPlant.name,
    latin: activeBuilderPlant.latin,
    size: size,
    potColor: potColor,
    price: price,
    image: activeBuilderPlant.image,
    waterCycleDays: activeBuilderPlant.waterCycleDays
  };

  state.cart.push(item);
  closeBuilder();
  updateCartBadge();
  openCart();
}

// --- SHOPPING CART & SHIPPING ENVIRONMENT ---
function openCart() {
  renderCart();
  document.getElementById('cart-sidebar').classList.add('active');
}

function closeCart() {
  document.getElementById('cart-sidebar').classList.remove('active');
}

function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  badge.textContent = state.cart.length;
  badge.style.display = state.cart.length > 0 ? 'flex' : 'none';
}

function renderCart() {
  const container = document.getElementById('cart-items-container');
  container.innerHTML = '';

  if (state.cart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty-state">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
        <p>Your cart is looking empty. Let's add some life to it!</p>
        <button class="btn btn-primary" onclick="closeCart(); navigate('catalog')">Browse Catalog</button>
      </div>
    `;
    document.getElementById('cart-warning-box').style.display = 'none';
    document.getElementById('cart-summary').style.display = 'none';
    return;
  }

  // Show summary components
  document.getElementById('cart-summary').style.display = 'block';

  state.cart.forEach(item => {
    const el = document.createElement('div');
    el.className = 'cart-item';
    el.innerHTML = `
      <div class="cart-item-img">
        <img src="${item.image}" alt="${item.name}">
      </div>
      <div class="cart-item-details">
        <h4>${item.name}</h4>
        <div class="cart-item-meta">${capitalize(item.size)} • ${capitalize(item.potColor)} Pot</div>
        <a href="#" class="cart-item-remove" onclick="removeCartItem('${item.cartId}'); return false;">Remove</a>
      </div>
      <div class="cart-item-price">$${item.price}</div>
    `;
    container.appendChild(el);
  });

  calculateCartTotals();
}

function removeCartItem(cartId) {
  state.cart = state.cart.filter(item => item.cartId !== cartId);
  updateCartBadge();
  renderCart();
}

function checkZipCode() {
  const zip = document.getElementById('zip-code-input').value.trim();
  state.checkoutZip = zip;

  const warningBox = document.getElementById('cart-warning-box');
  
  if (!zip || zip.length < 5) {
    showToast('Please enter a valid 5-digit ZIP code.', true);
    return;
  }

  // Simulation: Cold Weather ZIP lists (e.g., zip codes starting with '5', '0', '1' are designated cold winter areas)
  const isColdArea = /^[015]/.test(zip);

  if (isColdArea) {
    warningBox.style.display = 'flex';
    document.getElementById('heat-pack-toggle').checked = true;
    state.heatPackAdded = true;
    showToast('Cold climate detected! Autoselected Winter Heat Pack for safe delivery.');
  } else {
    warningBox.style.display = 'flex';
    document.getElementById('heat-pack-toggle').checked = false;
    state.heatPackAdded = false;
    showToast('Temperate climate confirmed. Winter heat pack optional.');
  }

  calculateCartTotals();
}

function toggleHeatPack(checked) {
  state.heatPackAdded = checked;
  calculateCartTotals();
}

function calculateCartTotals() {
  let subtotal = state.cart.reduce((sum, item) => sum + item.price, 0);
  let shipping = subtotal > 60 ? 0 : 12; // free shipping on orders over $60
  let heatPackCost = state.heatPackAdded ? 5 : 0;
  let total = subtotal + shipping + heatPackCost;

  document.getElementById('summary-subtotal').textContent = `$${subtotal}`;
  document.getElementById('summary-shipping').textContent = shipping === 0 ? 'FREE' : `$${shipping}`;
  
  const heatPackRow = document.getElementById('summary-heatpack-row');
  if (state.heatPackAdded) {
    heatPackRow.style.display = 'flex';
    document.getElementById('summary-heatpack').textContent = `$5.00`;
  } else {
    heatPackRow.style.display = 'none';
  }

  document.getElementById('summary-total').textContent = `$${total}`;
}

function checkout() {
  if (state.cart.length === 0) return;

  // Checkout completes: take the last item and set it as pending in the digital garden
  // So that user scans the QR code to "unpack" and place it in the digital garden
  const purchasedPlant = state.cart[0]; // demo purposes: queue the first plant for registration
  state.pendingGardenRegistration = {
    plantId: purchasedPlant.id,
    name: purchasedPlant.name,
    image: purchasedPlant.image,
    waterCycleDays: purchasedPlant.waterCycleDays
  };

  // Reset cart
  state.cart = [];
  state.heatPackAdded = false;
  document.getElementById('zip-code-input').value = '';
  updateCartBadge();
  closeCart();

  showToast('Order confirmed! Let\'s unpack and scan your care tag.');
  
  // Redirect to Garden to register the plant
  navigate('garden');
  
  // Show prompt/modal to scan QR code
  openQRScanner();
}

// --- MY DIGITAL GARDEN & QR CARE TAG SIMULATION ---
function openQRScanner() {
  document.getElementById('qr-modal').classList.add('active');
  // Auto-scan after 2.5 seconds
  setTimeout(() => {
    completeQRScan();
  }, 2500);
}

function closeQRScanner() {
  document.getElementById('qr-modal').classList.remove('active');
}

function completeQRScan() {
  closeQRScanner();
  
  if (!state.pendingGardenRegistration) {
    // If scanner opened manually without purchase, pre-seed a Calathea
    state.pendingGardenRegistration = {
      plantId: 'calathea',
      name: 'Living Room Prayer Plant',
      image: 'assets/images/calathea.jpg',
      waterCycleDays: 8
    };
  }

  const newGardenPlant = {
    id: `garden-${state.pendingGardenRegistration.plantId}-${Date.now()}`,
    plantId: state.pendingGardenRegistration.plantId,
    name: state.pendingGardenRegistration.name,
    image: state.pendingGardenRegistration.image,
    registeredAt: Date.now(),
    lastWatered: Date.now(),
    waterCycleDays: state.pendingGardenRegistration.waterCycleDays,
    hydration: 100
  };

  state.garden.push(newGardenPlant);
  state.pendingGardenRegistration = null;

  showToast(`Successfully registered ${newGardenPlant.name} in your Garden!`);
  renderGarden();
}

function renderGarden() {
  const grid = document.getElementById('garden-grid');
  grid.innerHTML = '';

  if (state.garden.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: var(--color-text-muted);">
        <p style="font-size: 1.1rem; margin-bottom: 1.5rem;">No plants registered yet. Buy a plant or simulate scanning a care tag!</p>
        <button class="btn btn-primary" onclick="openQRScanner()">Simulate QR Scan</button>
      </div>
    `;
    return;
  }

  state.garden.forEach(plant => {
    const card = document.createElement('div');
    card.id = `garden-card-${plant.id}`;
    card.className = `garden-card ${plant.hydration <= 25 ? 'needs-water' : ''}`;
    
    // Convert days cycle count into hours remaining
    const waterLeftStr = plant.hydration > 0 
      ? `Water level: ${Math.round(plant.hydration)}%` 
      : 'Thirsty! Please water now';

    card.innerHTML = `
      <div class="garden-card-img">
        <img src="${plant.image}" alt="${plant.name}">
      </div>
      <div class="garden-card-details">
        <h3>${plant.name}</h3>
        <p class="garden-card-meta">Registered: ${new Date(plant.registeredAt).toLocaleDateString()}</p>
        
        <div class="care-status-indicator">
          <div class="care-status-label">
            <span>Hydration</span>
            <span>${Math.round(plant.hydration)}%</span>
          </div>
          <div class="progress-bar-small">
            <div id="hydration-bar-${plant.id}" class="progress-bar-fill" style="width: ${plant.hydration}%"></div>
          </div>
        </div>

        <button class="water-btn" onclick="waterPlant('${plant.id}')">
          <svg style="width: 14px; height: 14px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z"/>
          </svg>
          ${plant.hydration <= 25 ? 'Water Immediately' : 'Water Plant'}
        </button>
      </div>
    `;
    grid.appendChild(card);
  });
}

function waterPlant(gardenPlantId) {
  const plant = state.garden.find(p => p.id === gardenPlantId);
  if (!plant) return;

  plant.lastWatered = Date.now();
  plant.hydration = 100;
  
  // Sound effect simulation/Visual cue
  showToast(`Splendid! Watered ${plant.name}. Hydration is back at 100%.`);
  
  // Re-render
  renderGarden();
}

// Hydration drain simulation loop running every second
function runHydrationSimulation() {
  state.garden.forEach(plant => {
    const elapsedMs = Date.now() - plant.lastWatered;
    // convert actual cycle days to simulated cycle time (days * SIM_DAY_MS)
    const totalSimCycleMs = plant.waterCycleDays * SIM_DAY_MS;
    
    let currentHydration = 100 - (elapsedMs / totalSimCycleMs * 100);
    currentHydration = Math.max(0, currentHydration); // minimum 0
    
    // Check transitions
    const wasSafe = plant.hydration > 25;
    plant.hydration = currentHydration;
    const isThirsty = plant.hydration <= 25;

    // Direct DOM updating to avoid heavy list re-renders every second
    const bar = document.getElementById(`hydration-bar-${plant.id}`);
    if (bar) {
      bar.style.width = `${currentHydration}%`;
      const label = bar.parentElement.previousElementSibling.lastElementChild;
      if (label) label.textContent = `${Math.round(currentHydration)}%`;
      
      const card = document.getElementById(`garden-card-${plant.id}`);
      if (card) {
        if (isThirsty) {
          card.classList.add('needs-water');
          const waterBtn = card.querySelector('.water-btn');
          if (waterBtn) waterBtn.innerHTML = '⚠️ Water Immediately';
        } else {
          card.classList.remove('needs-water');
          const waterBtn = card.querySelector('.water-btn');
          if (waterBtn) waterBtn.innerHTML = '💧 Water Plant';
        }
      }
    }

    // Trigger alerts
    if (wasSafe && isThirsty) {
      showToast(`⚠️ ${plant.name} is drying out! It needs water soon.`, true);
    }
  });
}

// --- ROOM MATCHER QUIZ LOGIC ---
const QUIZ_QUESTIONS = [
  {
    question: "How would you describe the light level in your room?",
    options: [
      { text: "Bright, direct sunlight", value: "direct", desc: "Large south-facing windows, hot rooms." },
      { text: "Bright, indirect light", value: "indirect", desc: "Near windows but filtered by trees or blinds." },
      { text: "Low, dim lighting", value: "low", desc: "Corner of rooms, north windows, or bathrooms." }
    ]
  },
  {
    question: "Do you have curious pets running around?",
    options: [
      { text: "Yes, I have dogs/cats", value: "petSafe", desc: "Requires non-toxic, safe varieties." },
      { text: "No, my home is pet-free", value: "all", desc: "All plants can be safely curated." }
    ]
  },
  {
    question: "How is your schedule for watering plants?",
    options: [
      { text: "I often forget to water", value: "beginner", desc: "Need robust, low-maintenance plants." },
      { text: "I am ready for a weekly schedule", value: "intermediate", desc: "Willing to spend occasional attention." }
    ]
  }
];

let quizAnswers = {};
let activeQuizStep = 0;

function startQuiz() {
  quizAnswers = {};
  activeQuizStep = 0;
  navigate('quiz');
  renderQuizStep();
}

function renderQuizStep() {
  const container = document.getElementById('quiz-question-container');
  container.innerHTML = '';

  const totalSteps = QUIZ_QUESTIONS.length;
  const progressPercent = (activeQuizStep / totalSteps) * 100;
  document.getElementById('quiz-progress-fill').style.width = `${progressPercent}%`;

  if (activeQuizStep >= totalSteps) {
    showQuizResults();
    return;
  }

  const data = QUIZ_QUESTIONS[activeQuizStep];
  
  const stepDiv = document.createElement('div');
  stepDiv.className = 'quiz-slide active';
  
  const questionTitle = document.createElement('h3');
  questionTitle.className = 'quiz-question';
  questionTitle.textContent = data.question;
  stepDiv.appendChild(questionTitle);

  const optionsContainer = document.createElement('div');
  optionsContainer.className = 'quiz-options';

  data.options.forEach((opt, idx) => {
    const card = document.createElement('div');
    card.className = 'quiz-option-card';
    card.onclick = () => selectQuizOption(data.options[idx].value);
    card.innerHTML = `
      <div class="quiz-option-icon">${idx + 1}</div>
      <div>
        <span class="quiz-option-text">${opt.text}</span>
        <span class="quiz-option-desc">${opt.desc}</span>
      </div>
    `;
    optionsContainer.appendChild(card);
  });

  stepDiv.appendChild(optionsContainer);
  container.appendChild(stepDiv);
}

function selectQuizOption(val) {
  if (activeQuizStep === 0) {
    quizAnswers.light = val;
  } else if (activeQuizStep === 1) {
    quizAnswers.petSafe = (val === 'petSafe');
  } else if (activeQuizStep === 2) {
    quizAnswers.difficulty = val;
  }
  
  activeQuizStep++;
  renderQuizStep();
}

function showQuizResults() {
  document.getElementById('quiz-progress-fill').style.width = '100%';
  
  // Match algorithm
  let match = PLANT_DATABASE.find(plant => {
    let lightMatch = plant.light === quizAnswers.light;
    let petMatch = !quizAnswers.petSafe || plant.petSafe;
    let diffMatch = plant.difficulty === quizAnswers.difficulty;
    return lightMatch && petMatch && diffMatch;
  });

  // Fallback match if exact constraints yield zero results
  if (!match) {
    match = PLANT_DATABASE.find(plant => !quizAnswers.petSafe || plant.petSafe);
  }

  const container = document.getElementById('quiz-question-container');
  container.innerHTML = `
    <div style="text-align: center; animation: fadeIn 0.5s ease;">
      <h3 class="quiz-question" style="margin-bottom: 0.5rem;">Your Perfect Match!</h3>
      <p style="color: var(--color-text-muted); margin-bottom: 2rem;">Based on your space light, pet concerns, and watering lifestyle.</p>
      
      <div style="max-width: 320px; margin: 0 auto 2rem; background: var(--color-bg-secondary); border-radius: var(--border-radius-md); padding: 1.5rem; border: 1px solid var(--glass-border); box-shadow: var(--glass-shadow)">
        <img src="${match.image}" alt="${match.name}" style="border-radius: var(--border-radius-sm); margin-bottom: 1rem;">
        <h4 style="font-family: var(--font-serif); font-size: 1.4rem; color: var(--color-primary);">${match.name}</h4>
        <p style="font-style: italic; font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 1rem;">${match.latin}</p>
        <span class="card-badge" style="display: inline-block; margin-bottom: 1rem;">${capitalize(match.light)} Light</span>
        <span class="card-badge" style="display: inline-block;">${capitalize(match.difficulty)}</span>
      </div>

      <div style="display: flex; gap: 1rem; justify-content: center;">
        <button class="btn btn-primary" onclick="openBuilder('${match.id}')">Configure & Shop</button>
        <button class="btn btn-secondary" onclick="startQuiz()">Retake Quiz</button>
      </div>
    </div>
  `;
}

// --- UTILS & TOASTS ---
function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function showToast(message, isDanger = false) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${isDanger ? 'toast-danger' : ''}`;
  toast.innerHTML = `
    <span>${message}</span>
  `;
  container.appendChild(toast);
  
  // Auto remove toast
  setTimeout(() => {
    toast.style.animation = 'fadeIn 0.3s ease reverse forwards';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  // Navigation setup
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(e.target.dataset.page);
    });
  });

  // Start simulation loop (runs hydration changes check)
  setInterval(runHydrationSimulation, 1000);

  // Initial load
  navigate('home');
});
