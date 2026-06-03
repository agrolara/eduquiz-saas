/* ==========================================================================
   CRUJIENTES BAR REDESIGN PREMIUM JS CORE LOGIC
   ========================================================================== */

// 1. Menu Catalog Database
const menuCatalog = [
    // Cócteles
    {
        id: "c-1",
        title: "Mystic Obsidian Gold",
        category: "cocktails",
        price: "$8.900",
        description: "Cóctel premium de autor. Ron añejo infusionado, amaretto artesanal, reducción de jengibre y maracuyá fresca, decorado con láminas de oro comestible de 24k.",
        tags: ["Premium", "Autor", "Exclusivo"],
        icon: "fa-solid fa-martini-glass-citrus"
    },
    {
        id: "c-2",
        title: "Pisco Crujiente Especial",
        category: "cocktails",
        price: "$7.500",
        description: "Nuestra reinterpretación del chilcano clásico. Pisco chileno reposado de 40°, jarabe de goma especiado hecho en casa, jugo de lima, jengibre fresco y hojas de menta.",
        tags: ["Popular", "Refrescante"],
        icon: "fa-solid fa-whiskey-glass"
    },
    {
        id: "c-3",
        title: "Gin Catedral Calafate",
        category: "cocktails",
        price: "$8.200",
        description: "Gin patagónico de alta gama infusionado con bayas de calafate silvestres, tónica premium, ralladura de pomelo y toques aromáticos de cardamomo.",
        tags: ["Patagónico", "Aromático"],
        icon: "fa-solid fa-wine-glass"
    },
    // Cervezas
    {
        id: "b-1",
        title: "Kross 5 IPA Premium",
        category: "beers",
        price: "$4.900",
        description: "Cerveza artesanal chilena con gran carácter. Notas cítricas y resinosas con un amargor persistente, ideal para acompañar nuestras hamburguesas.",
        tags: ["Artesanal", "IPA", "Lúpulo"],
        icon: "fa-solid fa-beer-mug-empty"
    },
    {
        id: "b-2",
        title: "Austral Calafate Ale",
        category: "beers",
        price: "$4.900",
        description: "Cerveza de origen patagónico con un característico tono rubí y aroma dulce a calafate silvestre. Una tradición crujiente inigualable.",
        tags: ["Tradición", "Patagonia"],
        icon: "fa-solid fa-beer-mug-empty"
    },
    // Compartir
    {
        id: "s-1",
        title: "Papas Crujientes del Bar",
        category: "sharing",
        price: "$9.900",
        description: "La especialidad de la casa. Papas fritas con triple cocción para lograr una textura ultra crujiente, bañadas en salsa cheddar ahumada y aioli picante del bar.",
        tags: ["Recomendado", "Firma", "Ultra Crujiente"],
        icon: "fa-solid fa-bowl-food"
    },
    {
        id: "s-2",
        title: "Tabla de Selección Mar & Tierra",
        category: "sharing",
        price: "$14.900",
        description: "Perfecta para compartir entre amigos. Camarones al pilpil crujientes, bocados de lomo liso glaseados en stout oscura, empanaditas de queso y aderezos especiales.",
        tags: ["Para 3-4 Personas", "Favorito"],
        icon: "fa-solid fa-plate-wheat"
    },
    // Hamburguesas
    {
        id: "h-1",
        title: "Burger Obsidian Premium",
        category: "burgers",
        price: "$10.900",
        description: "Hamburguesa gourmet en pan brioche artesanal negro. 180g de carne angus premium, cebolla caramelizada en cerveza stout, tocino ahumado, queso cheddar fundido y aros de cebolla crujientes.",
        tags: ["Obsidian Style", "Doble Queso"],
        icon: "fa-solid fa-burger"
    },
    {
        id: "h-2",
        title: "Sándwich de Pollo Ultra Crujiente",
        category: "burgers",
        price: "$9.400",
        description: "Pechuga de pollo de corral marinada en buttermilk y rebozada en nuestra mezcla secreta ultra crujiente, servida con coleslaw fresca, pepinillos y salsa spicy.",
        tags: ["Pollo Frito", "Especialidad"],
        icon: "fa-solid fa-burger"
    }
];

// 2. Dynamic Menu Catalog Renderer
function renderMenu(categoryFilter = "all") {
    const catalog = document.getElementById("menu-grid-catalog");
    if (!catalog) return;

    catalog.innerHTML = ""; // Clear existing

    const filtered = categoryFilter === "all" 
        ? menuCatalog 
        : menuCatalog.filter(item => item.category === categoryFilter);

    filtered.forEach(item => {
        const card = document.createElement("div");
        card.className = "menu-item-card";
        card.setAttribute("data-category-type", item.category);

        let imageHTML = `<div class="menu-item-img"><i class="${item.icon}"></i></div>`;
        if (item.id === "c-1") {
            imageHTML = `<img class="menu-item-img" src="assets/luxury_cocktail.png" alt="${item.title}" style="object-fit: cover;">`;
        } else if (item.id === "c-2") {
            imageHTML = `<img class="menu-item-img" src="assets/pisco_crujiente.png" alt="${item.title}" style="object-fit: cover;">`;
        } else if (item.id === "c-3") {
            imageHTML = `<img class="menu-item-img" src="assets/gin_calafate.png" alt="${item.title}" style="object-fit: cover;">`;
        } else if (item.id === "b-1") {
            imageHTML = `<img class="menu-item-img" src="assets/kross_ipa.png" alt="${item.title}" style="object-fit: cover;">`;
        } else if (item.id === "b-2") {
            imageHTML = `<img class="menu-item-img" src="assets/austral_ale.png" alt="${item.title}" style="object-fit: cover;">`;
        } else if (item.id === "s-1") {
            imageHTML = `<img class="menu-item-img" src="assets/papas_crujientes.png" alt="${item.title}" style="object-fit: cover;">`;
        } else if (item.id === "s-2") {
            imageHTML = `<img class="menu-item-img" src="assets/tabla_compartir.png" alt="${item.title}" style="object-fit: cover;">`;
        } else if (item.id === "h-1" || item.id === "h-2") {
            imageHTML = `<img class="menu-item-img" src="assets/gourmet_burger.png" alt="${item.title}" style="object-fit: cover;">`;
        }

        card.innerHTML = `
            ${imageHTML}
            <div class="menu-item-info">
                <div class="menu-item-top">
                    <h3 class="menu-item-title">${item.title}</h3>
                    <span class="menu-item-price">${item.price}</span>
                </div>
                <p class="menu-item-desc">${item.description}</p>
                <div class="menu-item-tags">
                    ${item.tags.map(tag => `<span class="menu-tag">${tag}</span>`).join("")}
                </div>
            </div>
        `;

        catalog.appendChild(card);
    });

    // Simple GSAP entrance animation if available
    if (typeof gsap !== 'undefined') {
        gsap.from(".menu-item-card", {
            opacity: 0,
            y: 20,
            duration: 0.4,
            stagger: 0.05,
            ease: "power2.out"
        });
    }
}

// 3. Dynamic Happy Hour Countdown Timer
function startHappyHourTimer() {
    const timerElement = document.getElementById("hh-countdown-timer");
    if (!timerElement) return;

    const updateTimer = () => {
        const now = new Date();
        const start = new Date(now);
        const end = new Date(now);

        // Happy hour config: 15:00 to 20:00
        start.setHours(15, 0, 0, 0);
        end.setHours(20, 0, 0, 0);

        if (now >= start && now < end) {
            // It is Happy Hour! Count down to end (20:00)
            const diff = end - now;
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff / (1000 * 60)) % 60);
            const seconds = Math.floor((diff / 1000) % 60);

            timerElement.innerHTML = `¡ACTIVO! finaliza en: <span style="color: #22c55e;">${hours}h : ${minutes}m : ${seconds}s</span>`;
        } else {
            // Count down to next day's start (15:00)
            let nextStart = new Date(now);
            nextStart.setHours(15, 0, 0, 0);

            if (now >= end) {
                // Happy hour ended today, countdown to tomorrow's start
                nextStart.setDate(nextStart.getDate() + 1);
            }

            const diff = nextStart - now;
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff / (1000 * 60)) % 60);
            const seconds = Math.floor((diff / 1000) % 60);

            timerElement.innerHTML = `Inicia en: ${hours}h : ${minutes}m : ${seconds}s`;
        }
    };

    updateTimer();
    setInterval(updateTimer, 1000);
}

// 4. Booking & Table Reservations Form Controller
function setupBookingForm() {
    const form = document.getElementById("booking-form");
    const successBox = document.getElementById("booking-success");
    const btnClose = document.getElementById("btn-close-success");
    const successText = document.getElementById("success-text");

    if (!form || !successBox) return;

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        // Fetch inputs
        const name = document.getElementById("book-name").value;
        const phone = document.getElementById("book-phone").value;
        const sucursal = document.getElementById("book-sucursal").value;
        const guests = document.getElementById("book-guests").value;
        const date = document.getElementById("book-date").value;
        const time = document.getElementById("book-time").value;

        // Visual simulated delay for loading
        const btnSubmit = form.querySelector(".btn-submit-booking");
        btnSubmit.disabled = true;
        btnSubmit.textContent = "Procesando Reserva...";

        setTimeout(() => {
            // Restore button
            btnSubmit.disabled = false;
            btnSubmit.textContent = "Confirmar Reserva de Mesa";

            // Update success text
            successText.innerHTML = `Mesa para <b>${guests} personas</b> el <b>${date}</b> a las <b>${time} hrs</b> en la sucursal de <b>${sucursal.toUpperCase()}</b> a nombre de <b>${name}</b> ha sido bloqueada. Te enviaremos un SMS de confirmación a tu teléfono <b>${phone}</b>.`;

            // Display overlay dialog
            successBox.style.display = "flex";
            if (typeof gsap !== 'undefined') {
                gsap.from(successBox, {
                    opacity: 0,
                    scale: 0.9,
                    duration: 0.4,
                    ease: "back.out(1.7)"
                });
            }
        }, 1200);
    });

    if (btnClose) {
        btnClose.addEventListener("click", () => {
            // Hide success box
            successBox.style.display = "none";
            // Reset form
            form.reset();
        });
    }

    // Pre-populate date picker with today
    const dateInput = document.getElementById("book-date");
    if (dateInput) {
        const today = new Date().toISOString().split("T")[0];
        dateInput.value = today;
        dateInput.min = today;
    }
}

// 5. Theme Switcher Controller (Mutates entire UI layout per Taste Skill)
function setupThemeSwitcher() {
    const buttons = document.querySelectorAll(".switcher-btn");
    
    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            // Remove active from all
            buttons.forEach(b => b.classList.remove("active"));
            
            // Add active to current
            btn.classList.add("active");

            // Fetch theme string
            const theme = btn.getAttribute("data-theme");

            // Apply theme to body
            document.body.className = `theme-${theme}`;

            // Re-render menu catalog to update specific aesthetic icons or styles
            renderMenu(document.querySelector(".filter-btn.active").getAttribute("data-category"));

            // Dynamic header animations on style changes
            if (typeof gsap !== 'undefined') {
                gsap.from(".hero-title", {
                    opacity: 0,
                    scale: 0.95,
                    duration: 0.5,
                    ease: "power2.out"
                });
            }
        });
    });
}

// 6. Navigation Link Activator
function setupNavigation() {
    const navLinks = document.querySelectorAll(".nav-link");
    const sections = document.querySelectorAll("section");

    // Click activator
    navLinks.forEach(link => {
        link.addEventListener("click", () => {
            navLinks.forEach(l => l.classList.remove("active"));
            link.classList.add("active");
        });
    });

    // Simple scroll highlight listener
    window.addEventListener("scroll", () => {
        let currentSection = "";
        
        sections.forEach(sec => {
            const secTop = sec.offsetTop;
            const secHeight = sec.clientHeight;
            if (pageYOffset >= (secTop - 200)) {
                currentSection = sec.getAttribute("id");
            }
        });

        if (currentSection) {
            navLinks.forEach(link => {
                link.classList.remove("active");
                if (link.getAttribute("href") === `#${currentSection}`) {
                    link.classList.add("active");
                }
            });
        }
    });
}

// 7. Initialize Document Elements
document.addEventListener("DOMContentLoaded", () => {
    // Switcher
    setupThemeSwitcher();

    // Navigation
    setupNavigation();

    // Happy hour
    startHappyHourTimer();

    // Menu filters
    const filterButtons = document.querySelectorAll(".filter-btn");
    filterButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            filterButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            
            const category = btn.getAttribute("data-category");
            renderMenu(category);
        });
    });

    // Render default menu (All items)
    renderMenu("all");

    // Form setup
    setupBookingForm();

    // Smooth GSAP Entrance on load
    if (typeof gsap !== 'undefined') {
        gsap.from(".animate-reveal", {
            opacity: 0,
            y: 30,
            duration: 0.8,
            stagger: 0.15,
            ease: "power3.out"
        });

        // Simple scroll triggers approximation using manual scroll check (to save file sizes and load scripts)
        const scrollElements = document.querySelectorAll(".animate-scroll");
        
        const elementInView = (el, offset = 100) => {
            const elementTop = el.getBoundingClientRect().top;
            return (
                elementTop <= 
                (window.innerHeight || document.documentElement.clientHeight) - offset
            );
        };

        const displayScrollElement = (element) => {
            gsap.fromTo(element, 
                { opacity: 0, y: 40 },
                { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
            );
            element.classList.remove("animate-scroll"); // Avoid triggering multiple times
        };

        const handleScrollAnimation = () => {
            scrollElements.forEach((el) => {
                if (el.classList.contains("animate-scroll") && elementInView(el, 150)) {
                    displayScrollElement(el);
                }
            });
        };

        window.addEventListener("scroll", handleScrollAnimation);
        handleScrollAnimation(); // Trigger once on load
    }
});
