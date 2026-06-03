/* ==========================================================================
   ANTIGRAVITY TASTE-SKILL PLAYGROUND JS CORE ENGINE
   ========================================================================== */

// 1. Taste-Skills Data Registry (Defines visual properties and demo content for each skill)
const skillsRegistry = {
    "minimalist-ui": {
        title: "Minimalist UI",
        category: "Estilos de UI",
        description: "Interfaces limpias de estilo editorial. Paleta monocromática cálida, tipografía refinada, bento grids planos y nula dependencia de degradados o sombras pesadas.",
        typography: "Outfit / Inter",
        density: "Baja (Espacioso)",
        colors: "Monocromo Cálido",
        principles: [
            "<strong>Monocromo cálido:</strong> Uso de fondos hueso (#F9F6F0) y textos carbón suave para una lectura descansada.",
            "<strong>Contraste tipográfico amplio:</strong> Títulos elegantes combinados con cuerpos de texto compactos.",
            "<strong>Bento Grids planos:</strong> Estructura modular limpia con bordes delgados de 1px sin sombras.",
            "<strong>Cero slop visual:</strong> Ausencia total de degradados neón, sombras artificiales o rellenos innecesarios."
        ],
        directive: `// Directiva Minimalista
const designTokens = {
  theme: 'minimalist',
  colors: {
    bg: '#F9F6F0',
    card: '#FFFFFF',
    text: '#1C1917',
    border: '1px solid rgba(28, 25, 23, 0.12)'
  },
  typography: {
    heading: '"Outfit", sans-serif',
    body: '"Inter", sans-serif'
  }
};`,
        renderDemo: function() {
            return `
            <div class="minimalist-demo-container">
                <header class="min-header">
                    <div class="min-title">L'Édition</div>
                    <div class="min-date">Junio 2026 / Issue #12</div>
                </header>
                <div class="min-grid">
                    <div class="min-card">
                        <span class="min-tag">Diseño Editorial</span>
                        <h2 class="min-card-title">La belleza del vacío en interfaces modernas</h2>
                        <p class="min-card-desc">El diseño de interfaces contemporáneo ha abusado de las sombras pesadas y los degradados neón. Recuperar el espacio, la tipografía cuidada y las grillas asimétricas limpias genera una sensación premium inigualable.</p>
                        <button class="min-btn">Leer Ensayo</button>
                    </div>
                    <div class="min-side-col">
                        <div class="min-card" style="padding: 16px;">
                            <span class="min-tag">Principios</span>
                            <h3 class="min-card-title" style="font-size: 16px;">01 / Tipografía</h3>
                            <p class="min-card-desc" style="font-size: 12px;">Escalas visuales drásticas y proporcionales.</p>
                        </div>
                        <div class="min-card" style="padding: 16px;">
                            <span class="min-tag">Principios</span>
                            <h3 class="min-card-title" style="font-size: 16px;">02 / Espaciado</h3>
                            <p class="min-card-desc" style="font-size: 12px;">El vacío como elemento de jerarquía principal.</p>
                        </div>
                    </div>
                </div>
            </div>`;
        }
    },

    "industrial-brutalist-ui": {
        title: "Industrial Brutalist UI",
        category: "Estilos de UI",
        description: "Interfaces mecánicas rígidas inspiradas en el estilo tipográfico suizo y las terminales de control militar. Bordes gruesos, cuadrículas duras y efectos de degradación analógica.",
        typography: "JetBrains Mono / Monospace",
        density: "Alta (Utilitario)",
        colors: "Negro & Verde CRT",
        principles: [
            "<strong>Cuadrícula Rígida:</strong> Divisiones de bordes gruesos de 2px de color neón constante.",
            "<strong>Swiss Monospace:</strong> Toda la información usa fuentes de ancho fijo para legibilidad técnica absoluta.",
            "<strong>Efectos CRT:</strong> Simulación de barrido y líneas de fósforo analógicas sobre el visor de datos.",
            "<strong>Cero Gracia:</strong> Botones y elementos sin suavizado de esquinas; todo es estrictamente rectangular."
        ],
        directive: `// Directiva Brutalista Industrial
const designTokens = {
  theme: 'brutalist-military',
  border: '2px solid #00ff66',
  borderRadius: '0px',
  colors: {
    bg: '#000000',
    screen: '#0a0a0a',
    glow: '#00ff66'
  },
  typography: {
    all: '"JetBrains Mono", monospace'
  }
};`,
        renderDemo: function() {
            return `
            <div class="brutalist-overlay"></div>
            <div class="brutalist-demo-container">
                <header class="brut-header">
                    <div class="brut-title">// TELEMETRÍA_RED_GLOBAL</div>
                    <div style="font-size: 12px;">ESTADO: ONLINE</div>
                </header>
                <div class="brut-grid">
                    <div class="brut-card">
                        <div class="brut-card-header">
                            <span>MÓDULO // 01</span>
                            <span>CPU_LOAD</span>
                        </div>
                        <div class="brut-value">44.2%</div>
                        <p style="font-size: 11px; line-height: 1.4;">[||||||||||||||..........] CLÚSTER ESTABLE EN SECTOR D-19</p>
                    </div>
                    <div class="brut-card">
                        <div class="brut-card-header">
                            <span>MÓDULO // 02</span>
                            <span>MEM_BUFF</span>
                        </div>
                        <div class="brut-value">8.9 GB</div>
                        <button class="brut-btn" onclick="alert('FLUSH_BUFFER COMANDO ENVIADO')">PULGAR MEMORIA</button>
                    </div>
                </div>
            </div>`;
        }
    },

    "high-end-visual-design": {
        title: "High-End Visual Design",
        category: "Estilos de UI",
        description: "Estética sofisticada de lujo oscuro. Glassmorphic sutil con desenfoque de fondo avanzado, degradados profundos enriquecidos con HSL, bordes semi-transparentes y detalles metálicos.",
        typography: "Outfit / Inter",
        density: "Media-Alta",
        colors: "Negro Obsidiana / Oro / Violeta",
        principles: [
            "<strong>Glassmorphism premium:</strong> Fondos oscuros translúcidos con filtros blur de 12px a 20px.",
            "<strong>Brillo de bordes:</strong> Líneas finas semi-transparentes que reflejan la luz ambiental.",
            "<strong>Acentos metálicos:</strong> Toques sutiles de oro (#D4AF37) y degradados violetas elegantes.",
            "<strong>Profundidad espacial:</strong> Capas visuales superpuestas mediante sombras profundas con HSL."
        ],
        directive: `// Directiva de Diseño de Alta Gama
const luxTheme = {
  background: 'linear-gradient(135deg, #07070a 0%, #121218 100%)',
  card: {
    background: 'rgba(255, 255, 255, 0.02)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.08)'
  },
  accent: '#D4AF37'
};`,
        renderDemo: function() {
            return `
            <div class="highend-demo-container">
                <div class="lux-card" id="lux-interactive-card">
                    <div class="lux-card-glow"></div>
                    <div class="lux-header">
                        <div>
                            <span class="lux-label">MEMBRESÍA EXCLUSIVA</span>
                            <h2 class="lux-title">AURUM CLUB</h2>
                        </div>
                        <div style="font-size: 24px; color: #d4af37;"><i class="fa-solid fa-crown"></i></div>
                    </div>
                    <div style="font-size: 13px; line-height: 1.6; color: var(--text-secondary);">
                        Acceso preferente al ecosistema de IA avanzada de Antigravity. Diseñado para marcas y desarrolladores que exigen excelencia absoluta sin compromisos estéticos.
                    </div>
                    <div class="lux-details-grid">
                        <div>
                            <div class="lux-label">TITULAR</div>
                            <div class="lux-detail-val" style="font-size: 15px; margin-top: 4px;">Premium User</div>
                        </div>
                        <div>
                            <div class="lux-label">RANGO</div>
                            <div class="lux-detail-val" style="font-size: 15px; margin-top: 4px;">Socio Fundador</div>
                        </div>
                        <div style="display: flex; justify-content: flex-end; align-items: flex-end;">
                            <button class="lux-btn">ACCEDER</button>
                        </div>
                    </div>
                </div>
            </div>`;
        },
        init: function() {
            const card = document.getElementById('lux-interactive-card');
            if (card) {
                card.addEventListener('mousemove', (e) => {
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;
                    const rotateX = -(y - centerY) / 20;
                    const rotateY = (x - centerX) / 20;
                    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
                });
                card.addEventListener('mouseleave', () => {
                    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
                });
            }
        }
    },

    "gpt-taste": {
        title: "GPT Taste (GSAP Motion)",
        category: "Estilos de UI",
        description: "Ingeniería de movimiento premium con animaciones fluidas y perpetuas utilizando GSAP. Tarjetas apilables que interactúan físicamente al arrastrarse.",
        typography: "Outfit / Inter",
        density: "Media",
        colors: "Cyber Pink & Negro",
        principles: [
            "<strong>Física de arrastre:</strong> Capacidad de manipular e interactuar con los elementos en tiempo real.",
            "<strong>Micro-movimiento perpetuo:</strong> Las tarjetas flotan levemente en su estado inactivo de forma natural.",
            "<strong>Retornos suaves:</strong> Transiciones fluidas con elasticidad matemática controlada.",
            "<strong>Apilado interactivo:</strong> Las capas de información se ordenan jerárquicamente al hacer clic."
        ],
        directive: `// Directiva de Movimiento GSAP
import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';

gsap.registerPlugin(Draggable);

Draggable.create('.card', {
  type: 'x,y',
  edgeResistance: 0.65,
  bounds: '.container',
  inertia: true
});`,
        renderDemo: function() {
            return `
            <div class="gsap-demo-container" id="gsap-container">
                <div class="gsap-instruction">// Arrastra y lanza las tarjetas para experimentar la física de movimiento de GSAP</div>
                
                <div class="gsap-card" id="card-1" style="top: 80px; left: 60px; z-index: 3;">
                    <div class="gsap-card-num">01</div>
                    <div>
                        <div class="gsap-card-title">Interacción Física</div>
                        <div class="gsap-card-desc" style="margin-top: 4px;">Arrastra este elemento en cualquier dirección.</div>
                    </div>
                </div>

                <div class="gsap-card" id="card-2" style="top: 120px; left: 300px; z-index: 2;">
                    <div class="gsap-card-num">02</div>
                    <div>
                        <div class="gsap-card-title">Micro-animación</div>
                        <div class="gsap-card-desc" style="margin-top: 4px;">El movimiento fluido genera engagement inmediato.</div>
                    </div>
                </div>

                <div class="gsap-card" id="card-3" style="top: 100px; left: 540px; z-index: 1;">
                    <div class="gsap-card-num">03</div>
                    <div>
                        <div class="gsap-card-title">Efecto Elástico</div>
                        <div class="gsap-card-desc" style="margin-top: 4px;">Retornos y desaceleración premium configurada.</div>
                    </div>
                </div>
            </div>`;
        },
        init: function() {
            // Check if GSAP is available
            if (typeof gsap !== 'undefined') {
                const cards = ['.gsap-card'];
                
                // Animate floating effect
                gsap.to("#card-1", { y: "+=12", rotation: "+=3", duration: 3, repeat: -1, yoyo: true, ease: "sine.inOut" });
                gsap.to("#card-2", { y: "-=15", rotation: "-=4", duration: 3.5, repeat: -1, yoyo: true, ease: "sine.inOut" });
                gsap.to("#card-3", { y: "+=10", rotation: "+=2", duration: 2.8, repeat: -1, yoyo: true, ease: "sine.inOut" });

                // Set up simple drag event simulation if Draggable isn't loaded, or custom drag simulation
                const containers = document.querySelectorAll('.gsap-card');
                containers.forEach(card => {
                    let isDragging = false;
                    let startX, startY;
                    let currentX = 0, currentY = 0;

                    // Bring card to top on click
                    card.addEventListener('mousedown', () => {
                        containers.forEach(c => c.style.zIndex = "1");
                        card.style.zIndex = "5";
                    });

                    // Simple drag logic
                    card.addEventListener('mousedown', (e) => {
                        isDragging = true;
                        startX = e.clientX - card.offsetLeft;
                        startY = e.clientY - card.offsetTop;
                        card.style.cursor = 'grabbing';
                        gsap.killTweensOf(card); // Stop float
                    });

                    document.addEventListener('mousemove', (e) => {
                        if (!isDragging) return;
                        const container = document.getElementById('gsap-container');
                        const rect = container.getBoundingClientRect();
                        
                        let left = e.clientX - rect.left - (card.offsetWidth / 2);
                        let top = e.clientY - rect.top - (card.offsetHeight / 2);

                        // Clamp inside container
                        left = Math.max(0, Math.min(left, rect.width - card.offsetWidth));
                        top = Math.max(0, Math.min(top, rect.height - card.offsetHeight));

                        card.style.left = left + 'px';
                        card.style.top = top + 'px';
                    });

                    document.addEventListener('mouseup', () => {
                        if (isDragging) {
                            isDragging = false;
                            card.style.cursor = 'grab';
                        }
                    });
                });
            }
        }
    },

    "brandkit": {
        title: "Brandkit Assets",
        category: "Prototipado e Imágenes",
        description: "Habilitador de identidad visual corporativa. Define variantes lógicas de logotipos, colores complementarios e interactividad de la marca.",
        typography: "Outfit / Inter",
        density: "Media",
        colors: "Blanco / Carbón / Neutros",
        principles: [
            "<strong>Manual de marca dinámico:</strong> Las variantes cromáticas responden a la luz ambiente del sitio.",
            "<strong>Geometría de Logotipos:</strong> Creación de imagotipos legibles en formatos minúsculos.",
            "<strong>Tokens de paleta:</strong> Códigos de color accesibles en HEX y HSL.",
            "<strong>Tipografías de soporte:</strong> Directivas claras de jerarquías tipográficas principales."
        ],
        directive: `// Brandkit Token Configuration
const brandAssets = {
  logo: {
    symbol: '▲',
    text: 'A N T I G R A V I T Y'
  },
  palette: {
    primary: '#1d1d1f',
    secondary: '#f5f5f7',
    accent: '#6366f1'
  }
};`,
        renderDemo: function() {
            return `
            <div class="brandkit-container">
                <div class="brand-section-header">
                    <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #6366f1; font-weight: bold;">Identidad de Marca</span>
                    <h2 class="brand-title">Ecosistema Brandkit</h2>
                </div>
                <div class="brand-grid">
                    <div class="brand-logos">
                        <div style="font-size: 12px; font-weight: bold; color: #86868b; margin-bottom: 4px;">Logotipo: Positivo / Negativo</div>
                        <div class="brand-logo-card">
                            <span>▲ ANTIGRAVITY</span>
                        </div>
                        <div class="brand-logo-card brand-logo-dark">
                            <span>▲ ANTIGRAVITY</span>
                        </div>
                    </div>
                    <div class="brand-colors">
                        <div style="font-size: 12px; font-weight: bold; color: #86868b; margin-bottom: 4px;">Paleta Cromática Interactiva</div>
                        <div class="brand-palette">
                            <div class="color-swatch" style="background-color: #1d1d1f;">
                                <span class="swatch-hex">#1D1D1F</span>
                            </div>
                            <div class="color-swatch" style="background-color: #6366f1;">
                                <span class="swatch-hex">#6366F1</span>
                            </div>
                            <div class="color-swatch" style="background-color: #a855f7;">
                                <span class="swatch-hex">#A855F7</span>
                            </div>
                            <div class="color-swatch" style="background-color: #f5f5f7; border: 1px solid #d2d2d7;">
                                <span class="swatch-hex" style="color: #1d1d1f;">#F5F5F7</span>
                            </div>
                        </div>
                        <div class="brand-typography">
                            <div style="font-size: 12px; font-weight: bold; color: #86868b; margin-bottom: 12px;">Tipografía Corporativa</div>
                            <div class="typo-spec">
                                <span style="font-family: 'Outfit'; font-weight: 800; font-size: 18px;">Outfit Bold</span>
                                <span style="font-size: 11px; color: #86868b;">Títulos principales / Logotipos</span>
                            </div>
                            <div class="typo-spec">
                                <span style="font-family: 'Inter'; font-weight: 400; font-size: 14px;">Inter Regular</span>
                                <span style="font-size: 11px; color: #86868b;">Cuerpo de texto / Legibilidad</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        }
    },

    "imagegen-frontend-mobile": {
        title: "Imagegen Mobile App",
        category: "Prototipado e Imágenes",
        description: "Habilidad para maquetar interfaces nativas móviles consistentes y de alta fidelidad, enmarcadas dentro de smartphones interactivos detallados.",
        typography: "System Sans",
        density: "Media-Alta",
        colors: "Gris Oscuro / Neon / HSL",
        principles: [
            "<strong>Consistencia de pantallas:</strong> Estructura visual homogénea a lo largo del flujo del usuario.",
            "<strong>Estética Nativa:</strong> Elementos de interacción específicos de sistemas operativos móviles (iOS/Android).",
            "<strong>Mockup Framing:</strong> Visualización interactiva en tiempo real simulando el dispositivo físico real."
        ],
        directive: `// Configuración de visualización móvil nativa
const mobileLayout = {
  notch: true,
  statusBar: 'light-content',
  paddingHorizontal: '16px',
  borderRadius: '24px'
};`,
        renderDemo: function() {
            return `
            <div class="mobilegen-container">
                <div class="iphone-frame">
                    <div class="iphone-notch"></div>
                    <div class="iphone-screen">
                        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; margin-top: 6px;">
                            <span>9:41</span>
                            <div style="display: flex; gap: 4px;">
                                <i class="fa-solid fa-signal"></i>
                                <i class="fa-solid fa-wifi"></i>
                                <i class="fa-solid fa-battery-full"></i>
                            </div>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                            <div>
                                <span style="font-size: 11px; color: rgba(255,255,255,0.4);">Bienvenido</span>
                                <div style="font-size: 15px; font-weight: bold; font-family: sans-serif;">Premium User</div>
                            </div>
                            <div style="width: 32px; height: 32px; border-radius: 50%; background-color: #6366f1; display:flex; align-items:center; justify-content:center; font-size: 12px; font-weight:bold;">PU</div>
                        </div>
                        
                        <!-- Premium Mobile Card -->
                        <div class="mobile-card-lux" style="background: linear-gradient(135deg, #1e1b4b, #311042);">
                            <span style="font-size: 10px; opacity: 0.6; text-transform: uppercase;">Saldo Total</span>
                            <div style="font-size: 26px; font-weight: bold; margin: 4px 0 12px 0; font-family: sans-serif;">$24,890.00</div>
                            <div style="display: flex; justify-content: space-between; font-size: 11px;">
                                <span>**** 8840</span>
                                <span style="color: #a855f7; font-weight: bold;">VISA PLATINUM</span>
                            </div>
                        </div>

                        <!-- Actions Grid -->
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                            <div style="background-color: rgba(255,255,255,0.03); border-radius: 12px; padding: 12px; text-align: center; border: 1px solid rgba(255,255,255,0.05);">
                                <i class="fa-solid fa-paper-plane" style="color: #6366f1; margin-bottom: 6px;"></i>
                                <div style="font-size: 10px;">Enviar</div>
                            </div>
                            <div style="background-color: rgba(255,255,255,0.03); border-radius: 12px; padding: 12px; text-align: center; border: 1px solid rgba(255,255,255,0.05);">
                                <i class="fa-solid fa-qrcode" style="color: #a855f7; margin-bottom: 6px;"></i>
                                <div style="font-size: 10px;">QR</div>
                            </div>
                            <div style="background-color: rgba(255,255,255,0.03); border-radius: 12px; padding: 12px; text-align: center; border: 1px solid rgba(255,255,255,0.05);">
                                <i class="fa-solid fa-chart-simple" style="color: #10b981; margin-bottom: 6px;"></i>
                                <div style="font-size: 10px;">Estadísticas</div>
                            </div>
                        </div>

                        <!-- Recent activity -->
                        <div>
                            <div style="font-size: 11px; font-weight: bold; margin-bottom: 8px; color: rgba(255,255,255,0.4);">Actividad Reciente</div>
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                                <div style="display:flex; gap: 10px; align-items:center;">
                                    <div style="width: 28px; height: 28px; border-radius: 8px; background-color: rgba(255,255,255,0.05); display:flex; align-items:center; justify-content:center;"><i class="fa-solid fa-coffee" style="font-size: 11px;"></i></div>
                                    <div>
                                        <div style="font-size: 11px; font-weight: bold;">Starbucks</div>
                                        <div style="font-size: 9px; color: rgba(255,255,255,0.4);">Hoy, 08:30 AM</div>
                                    </div>
                                </div>
                                <span style="font-size: 11px; font-weight: bold; color: #f43f5e;">-$4.50</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        }
    },

    "imagegen-frontend-web": {
        title: "Imagegen Web Sections",
        category: "Prototipado e Imágenes",
        description: "Dirección visual y secuencial premium para interfaces de escritorio. Crea propuestas maquetables con variedad compositiva y de CTA.",
        typography: "Outfit / Inter",
        density: "Media-Baja",
        colors: "Profundos & HSL Acoplados",
        principles: [
            "<strong>Cero aburrimiento compositivo:</strong> Variedad de maquetación (imágenes a izquierda, centradas, rejillas bento).",
            "<strong>Historias visuales:</strong> Distribución lógica de la información en secciones de scroll secuenciales.",
            "<strong>Fondo de alta gama:</strong> Integración armónica de texturas e imágenes abstractas en tiempo real."
        ],
        directive: `// Maquetación Web Secuencial
const sections = [
  { id: 'hero', alignment: 'center-spacious' },
  { id: 'features', alignment: 'bento-grid' },
  { id: 'cta', alignment: 'glass-fullwidth' }
];`,
        renderDemo: function() {
            return `
            <div class="webgen-container">
                <div style="font-size: 12px; font-weight: bold; color: #818cf8; margin-bottom: 8px;">SECTOR MAP // SECUENCIACIÓN WEB DE ALTA GAMA</div>
                
                <div class="web-section-comp">
                    <div>
                        <span class="web-section-num">01 / HERO SECTION</span>
                        <h4 style="margin-top: 4px; font-size: 14px;">Alineación: Centrado Minimalista</h4>
                        <p style="font-size: 11px; color: #94a3b8; margin-top: 2px;">Título espaciado gigante con tipografía de 64px y un único CTA premium.</p>
                    </div>
                    <div style="background-color: rgba(255,255,255,0.05); padding: 8px 12px; border-radius: 4px; font-size: 10px; font-family: monospace;">CENTRAL_GRID</div>
                </div>

                <div class="web-section-comp">
                    <div>
                        <span class="web-section-num">02 / PRODUCT FEATURES</span>
                        <h4 style="margin-top: 4px; font-size: 14px;">Alineación: Asymmetric Bento Grid</h4>
                        <p style="font-size: 11px; color: #94a3b8; margin-top: 2px;">Grilla modular de 3 columnas desiguales que rompe la monotonía visual del scroll.</p>
                    </div>
                    <div style="background-color: rgba(255,255,255,0.05); padding: 8px 12px; border-radius: 4px; font-size: 10px; font-family: monospace;">BENTO_GRID</div>
                </div>

                <div class="web-section-comp">
                    <div>
                        <span class="web-section-num">03 / CONVERSION AREA</span>
                        <h4 style="margin-top: 4px; font-size: 14px;">Alineación: Split Screen Glass</h4>
                        <p style="font-size: 11px; color: #94a3b8; margin-top: 2px;">Formulario interactivo sutil a la derecha con un render de producto en alta resolución a la izquierda.</p>
                    </div>
                    <div style="background-color: rgba(255,255,255,0.05); padding: 8px 12px; border-radius: 4px; font-size: 10px; font-family: monospace;">SPLIT_SCREEN</div>
                </div>
            </div>`;
        }
    },

    "design-taste-frontend": {
        title: "Design Taste Frontend",
        category: "Ingeniería y Optimización",
        description: "Ingeniería frontend contra plantillas genéricas. Lee la intención de diseño y produce componentes anti-slop responsivos con CSS limpio y modular.",
        typography: "Outfit / Inter",
        density: "Media-Baja",
        colors: "Vibrantes HSL / Oscuro Profundo",
        principles: [
            "<strong>Anti-slop:</strong> Sin plantillas repetitivas o elementos genéricos sacados de librerías comunes.",
            "<strong>Fidelidad Absoluta:</strong> Traduce intenciones estéticas complejas a código CSS interactivo perfecto.",
            "<strong>Sistemas Reales:</strong> Estructuración lógica mediante variables nativas CSS y responsive flexible."
        ],
        directive: `// Directiva Anti-Slop Premium
const buildStyle = () => {
  return \`
    .premium-element {
      background: radial-gradient(circle at top, rgba(255,255,255,0.05), transparent);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255,255,255,0.08);
      transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }
  \`;
};`,
        renderDemo: function() {
            return `
            <div class="slider-container" id="slider-compare">
                <div class="slider-pane pane-before">
                    <div class="pane-content slop-card">
                        <div class="slop-title">GENERIC AI SLOP</div>
                        <p style="font-size: 12px; line-height: 1.5;">Una plantilla común con degradado plano morado-azul llamativo artificial, botones redondeados de Tailwind genéricos y una sombra artificial exagerada.</p>
                        <button class="generic-btn-old" style="border-radius: 4px;">Call to Action</button>
                    </div>
                    <div class="slider-label label-before">Sloppy AI Template</div>
                </div>
                
                <div class="slider-pane pane-after" id="pane-after">
                    <div class="pane-content premium-card">
                        <div class="premium-title">Premium Custom Hub</div>
                        <p style="font-size: 12px; line-height: 1.5; color: var(--text-secondary);">Una interfaz glassmorphic premium. Uso de bordes sutiles de 1px con transparencias, colores HSL integrados armoniosamente y tipografía Outfit elegante.</p>
                        <button style="background: linear-gradient(135deg, #38bdf8, #818cf8); border: none; color: black; font-weight: bold; border-radius: 8px; padding: 10px; cursor: pointer;">Experimentar</button>
                    </div>
                    <div class="slider-label label-after">Premium Anti-Slop UI</div>
                </div>
                
                <div class="slider-handle" id="slider-handle">
                    <div class="slider-handle-button"><i class="fa-solid fa-arrows-left-right"></i></div>
                </div>
            </div>`;
        },
        init: function() {
            const container = document.getElementById('slider-compare');
            const handle = document.getElementById('slider-handle');
            const afterPane = document.getElementById('pane-after');
            
            if (container && handle && afterPane) {
                let isSliding = false;

                const moveSlider = (clientX) => {
                    const rect = container.getBoundingClientRect();
                    const x = clientX - rect.left;
                    let percentage = (x / rect.width) * 100;
                    percentage = Math.max(0, Math.min(percentage, 100));
                    
                    handle.style.left = `${percentage}%`;
                    afterPane.style.clipPath = `polygon(0 0, ${percentage}% 0, ${percentage}% 100%, 0 100%)`;
                };

                handle.addEventListener('mousedown', () => isSliding = true);
                window.addEventListener('mouseup', () => isSliding = false);
                
                window.addEventListener('mousemove', (e) => {
                    if (!isSliding) return;
                    moveSlider(e.clientX);
                });

                // Touch support
                handle.addEventListener('touchstart', () => isSliding = true);
                window.addEventListener('touchend', () => isSliding = false);
                window.addEventListener('touchmove', (e) => {
                    if (!isSliding) return;
                    moveSlider(e.touches[0].clientX);
                });
            }
        }
    },

    "redesign-existing-projects": {
        title: "Redesign Projects",
        category: "Ingeniería y Optimización",
        description: "Habilidad para auditar visualmente componentes genéricos de IA, identificar patrones repetitivos o deficientes, y aplicar estándares de alta gama sin alterar la funcionalidad del código.",
        typography: "Outfit / Inter / Arial",
        density: "Variable",
        colors: "Consistentes con la marca",
        principles: [
            "<strong>Auditoría primero:</strong> Identificación precisa de inconsistencias visuales antes de reescribir código.",
            "<strong>Preservación funcional:</strong> Garantiza que toda la lógica interactiva o de backend permanezca intacta.",
            "<strong>Modernización:</strong> Eleva componentes planos a interfaces atractivas de alta fidelidad."
        ],
        directive: `// Auditoría de Rediseño
const auditCard = (cardElement) => {
  const issues = [];
  if (getComputedStyle(cardElement).boxShadow.includes('rgba(0, 0, 0, 0.5)')) {
    issues.push('Sombra artificial pesada detectada.');
  }
  return {
    status: 'audit-failed',
    actions: ['Reducir sombras', 'Añadir bordes finos translúcidos']
  };
};`,
        renderDemo: function() {
            return `
            <div class="redesign-container">
                <div class="redesign-box">
                    <div class="redesign-box-header" style="color: #ef4444;">
                        <i class="fa-solid fa-circle-exclamation"></i> COMPONENTE GENÉRICO (ANTES)
                    </div>
                    <div class="redesign-view">
                        <div class="generic-card-old">
                            <h4 style="margin-bottom: 8px;">User Card</h4>
                            <p style="font-size: 12px; color: #555555;">Este es un diseño estándar hecho por una IA sin criterio estético refinado. Bastante plano.</p>
                            <button class="generic-btn-old">Saber Más</button>
                        </div>
                    </div>
                </div>

                <div class="redesign-box">
                    <div class="redesign-box-header" style="color: #22c55e;">
                        <i class="fa-solid fa-circle-check"></i> COMPONENTE REDISEÑADO (DESPUÉS)
                    </div>
                    <div class="redesign-view">
                        <div class="premium-card-new">
                            <span style="font-size: 9px; text-transform: uppercase; color: #22c55e; font-weight: bold; letter-spacing: 1px;">Usuario Premium</span>
                            <h4 style="margin-top: 4px; font-family: 'Outfit'; font-size: 18px;">Tarjeta Refinada</h4>
                            <p style="font-size: 11px; color: #a1a1aa; margin-top: 8px; line-height: 1.5;">Una interfaz modular que respeta el espacio negativo, utiliza grillas asimétricas sutiles y bordes limpios de alta gama.</p>
                            <button class="premium-btn-new">Explorar Perfil</button>
                        </div>
                    </div>
                </div>
            </div>`;
        }
    },

    "image-to-code": {
        title: "Image to Code",
        category: "Ingeniería y Optimización",
        description: "Traducción impecable de bocetos visuales o composiciones de diseño a código HTML5/CSS3 interactivo con píxel-perfect de precisión.",
        typography: "Outfit / JetBrains Mono",
        density: "Media",
        colors: "Vibrantes HSL",
        principles: [
            "<strong>Análisis de bocetos:</strong> Traduce la distribución visual y proporciones en una estructura modular CSS.",
            "<strong>Píxel Perfect:</strong> Garantiza que el espaciado, tipografía y transiciones coincidan exactamente con la imagen de origen.",
            "<strong>HTML Semántico:</strong> Escribe código estructurado, accesible y limpio."
        ],
        directive: `// Conversión de Boceto a Código
const sketchLayout = {
  wireframe: 'sketch_hero_draft.png',
  output: {
    tag: 'section',
    className: 'hero-section-premium',
    style: { display: 'grid', gridTemplateColumns: '1fr 1fr' }
  }
};`,
        renderDemo: function() {
            return `
            <div class="imgcode-container">
                <div class="imgcode-pane">
                    <div class="pane-label">Boceto Visual / Imagen Draft</div>
                    <div class="imgcode-draft">
                        <div class="wireframe-box">
                            <div class="wireframe-image">IMAGEN_DRAFT.PNG</div>
                            <div class="wireframe-element"></div>
                            <div class="wireframe-element" style="width: 60%;"></div>
                        </div>
                    </div>
                </div>

                <div class="imgcode-pane">
                    <div class="pane-label">Render de Código Real (HTML/CSS)</div>
                    <div class="imgcode-draft" style="background-color: #0b0f19;">
                        <div style="background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 24px; width: 250px; text-align: left; box-shadow: 0 10px 25px rgba(0,0,0,0.4);">
                            <span style="font-size: 10px; color: #a855f7; font-weight: bold; text-transform: uppercase;">Render en Vivo</span>
                            <h4 style="font-family: 'Outfit'; font-size: 16px; margin-top: 4px; color: white;">Componente Real</h4>
                            <p style="font-size: 11px; color: #94a3b8; margin-top: 8px; line-height: 1.5;">El código HTML estructurado y CSS limpio replicado exactamente a partir de la imagen de borrador.</p>
                            <div style="height: 4px; background: linear-gradient(to right, #a855f7, #6366f1); border-radius: 2px; margin-top: 16px;"></div>
                        </div>
                    </div>
                </div>
            </div>`;
        }
    },

    "stitch-design-taste": {
        title: "Stitch Tokens System",
        category: "Ingeniería y Optimización",
        description: "Gestión semántica de sistemas de diseño para Google Stitch. Permite configurar y exportar variables de tokens de diseño consistentes en archivos DESIGN.md.",
        typography: "Outfit / JetBrains Mono",
        density: "Media-Alta",
        colors: "Blue Tech",
        principles: [
            "<strong>Centralización cromática:</strong> Control de paletas enteras desde tokens de colores primarios y secundarios.",
            "<strong>Espaciados dinámicos:</strong> Variables proporcionales para rellenos y márgenes uniformes.",
            "<strong>Documentación automatizada:</strong> Exporta toda la estructura estética en archivos de documentación estandarizados."
        ],
        directive: `// Tokens Semánticos para Stitch
const stitchTokens = {
  spacing: { small: '8px', medium: '16px', large: '32px' },
  borders: { radius: '8px', width: '1px' },
  motion: { curve: 'cubic-bezier(0.16, 1, 0.3, 1)', duration: '0.4s' }
};`,
        renderDemo: function() {
            return `
            <div class="stitch-container">
                <div class="stitch-panel">
                    <h4 style="font-family: 'Outfit'; font-size: 16px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">Configuración de Tokens</h4>
                    
                    <div class="token-slider-row">
                        <label for="token-radius">Radio de Borde: <span id="radius-val">12px</span></label>
                        <input type="range" id="token-radius" min="0" max="32" value="12">
                    </div>

                    <div class="token-slider-row">
                        <label for="token-spacing">Espaciado Interno: <span id="spacing-val">20px</span></label>
                        <input type="range" id="token-spacing" min="8" max="40" value="20">
                    </div>

                    <button class="lux-btn" id="btn-export-stitch" style="margin-top: auto; border-radius: 8px; background: #3b82f6; color: white; padding: 10px; font-size: 11px;">EXPORTAR DESIGN.MD</button>
                </div>

                <div class="stitch-panel" style="background-color: #0b0f19;">
                    <h4 style="font-family: 'Outfit'; font-size: 16px; color: #3b82f6;">Vista Previa del Token</h4>
                    <div style="display:flex; align-items:center; justify-content:center; flex-grow: 1;">
                        <div id="stitch-preview-card" style="background-color: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); width: 220px; box-shadow: 0 10px 20px rgba(0,0,0,0.3); transition: all 0.2s;">
                            <span style="font-size: 10px; color: #3b82f6; font-weight: bold; text-transform: uppercase;">CARD INTERACTIVA</span>
                            <p style="font-size: 11px; color: #94a3b8; margin-top: 8px; line-height: 1.4;">Los controles del slider izquierdo cambian la forma y el espaciado interno de esta tarjeta de forma reactiva.</p>
                        </div>
                    </div>
                </div>
            </div>`;
        },
        init: function() {
            const radSlider = document.getElementById('token-radius');
            const radVal = document.getElementById('radius-val');
            const spaceSlider = document.getElementById('token-spacing');
            const spaceVal = document.getElementById('spacing-val');
            const card = document.getElementById('stitch-preview-card');
            const btnExport = document.getElementById('btn-export-stitch');

            if (radSlider && spaceSlider && card) {
                const updateCard = () => {
                    const radius = radSlider.value;
                    const padding = spaceSlider.value;
                    
                    radVal.textContent = `${radius}px`;
                    spaceVal.textContent = `${padding}px`;
                    
                    card.style.borderRadius = `${radius}px`;
                    card.style.padding = `${padding}px`;
                };

                radSlider.addEventListener('input', updateCard);
                spaceSlider.addEventListener('input', updateCard);
                updateCard(); // Initial call

                if (btnExport) {
                    btnExport.addEventListener('click', () => {
                        const content = `# SYSTEM DESIGN TOKENS\n\n- Border Radius: ${radSlider.value}px\n- Padding Spacing: ${spaceSlider.value}px\n- Core Theme: Google Stitch Semantics`;
                        const blob = new Blob([content], { type: 'text/markdown' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'DESIGN.md';
                        a.click();
                        URL.revokeObjectURL(url);
                    });
                }
            }
        }
    },

    "full-output-enforcement": {
        title: "Full Output Enforcement",
        category: "Ingeniería y Optimización",
        description: "Control absoluto de generación de código completo. Reemplaza el comportamiento perezoso de la IA (placeholders u omisiones) por archivos fuentes exhaustivos e íntegros.",
        typography: "JetBrains Mono / Monospace",
        density: "Alta",
        colors: "Verde / Rojo de diferencias",
        principles: [
            "<strong>Cero omisiones:</strong> Prohibición estricta de marcadores de posición o código resumido.",
            "<strong>Exhaustividad:</strong> Código limpio, completo y directamente utilizable en producción.",
            "<strong>Estructuración Íntegra:</strong> Todo el árbol jerárquico de archivos se despliega detalladamente."
        ],
        directive: `// Directiva de Generación Completa
const enforceFullOutput = (prompt) => {
  return {
    enforceExhaustiveGeneration: true,
    banPlaceholders: true,
    maxReturnLengthAllowed: 'infinite'
  };
};`,
        renderDemo: function() {
            return `
            <div class="fo-container">
                <div class="fo-panel">
                    <div style="font-size: 12px; font-weight: bold; color: #f43f5e; margin-bottom: 8px;"><i class="fa-solid fa-ban"></i> Código Truncado Convencional</div>
                    <div class="fo-code-view">
<pre style="margin: 0; color: #a1a1aa;">
function handleRequest(req) {
  setupHeaders(req);
  
  <span class="fo-slop">// ... implementar el resto del manejo de peticiones aquí ...</span>
  <span class="fo-slop">// ... validación de usuarios ...</span>
  <span class="fo-slop">// TODO: Retornar la respuesta final</span>
}
</pre>
                    </div>
                </div>

                <div class="fo-panel">
                    <div style="font-size: 12px; font-weight: bold; color: #10b981; margin-bottom: 8px;"><i class="fa-solid fa-circle-check"></i> Enforced Full Output (Antigravity)</div>
                    <div class="fo-code-view">
<pre style="margin: 0; color: #e4e4e7;">
function handleRequest(req) {
  setupHeaders(req);
  
  <span class="fo-correct">const user = validateAuth(req);
  if (!user.isValid) {
    return { status: 401, error: 'Unauthorized' };
  }
  
  const data = processPayload(req.body);
  const response = formatResponse(data);
  return {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(response)
  };</span>
}
</pre>
                    </div>
                </div>
            </div>`;
        }
    },

    "android-cli": {
        title: "Android CLI",
        category: "Ingeniería y Optimización",
        description: "Consola de comando interactiva simulada para tareas de desarrollo móvil, automatizando la creación de proyectos, builds y depuración.",
        typography: "JetBrains Mono / Monospace",
        density: "Alta",
        colors: "Cyan / Negro",
        principles: [
            "<strong>Consola Interactiva:</strong> Admite la ejecución de comandos móviles reales simulados.",
            "<strong>Diagnósticos Rápidos:</strong> Rutinas de prueba del entorno SDK de Android.",
            "<strong>Mockup Móvil Integrado:</strong> Visualización interactiva en tiempo real del progreso del build en pantalla."
        ],
        directive: `// Directiva de Control Móvil
const androidCLI = {
  sdkPath: 'C:\\\\Android\\\\Sdk',
  emulator: 'Pixel_6_API_33',
  buildCommand: 'gradlew assembleDebug'
};`,
        renderDemo: function() {
            return `
            <div class="cli-demo-container">
                <div class="cli-terminal">
                    <div class="cli-term-header">
                        <span>ANTIGRAVITY ANDROID SHELL v1.0.4</span>
                        <span>[ONLINE]</span>
                    </div>
                    <div class="cli-term-body" id="term-body">
                        <div class="cli-line" style="color: #71717a;">Escribe "help" para ver la lista de comandos disponibles.</div>
                        <div class="cli-input-container">
                            <span>$ android</span>
                            <input type="text" class="cli-input" id="term-input" placeholder="escribe un comando..." autofocus>
                        </div>
                    </div>
                </div>
                
                <div class="phone-mockup">
                    <div class="phone-camera"></div>
                    <div class="phone-screen" id="phone-app-screen">
                        <i class="fa-brands fa-android phone-app-logo"></i>
                        <span class="phone-app-status" id="phone-status">EMULADOR APAGADO</span>
                    </div>
                </div>
            </div>`;
        },
        init: function() {
            const input = document.getElementById('term-input');
            const body = document.getElementById('term-body');
            const phoneStatus = document.getElementById('phone-status');
            const phoneScreen = document.getElementById('phone-app-screen');

            if (input && body) {
                const addLine = (text, color = '#e4e4e7') => {
                    const line = document.createElement('div');
                    line.className = 'cli-line';
                    line.style.color = color;
                    line.innerHTML = text;
                    body.insertBefore(line, body.lastElementChild);
                    body.scrollTop = body.scrollHeight;
                };

                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        const cmd = input.value.trim().toLowerCase();
                        input.value = '';

                        // Echo command
                        addLine(`$ android ${cmd}`, '#38bdf8');

                        if (cmd === 'help') {
                            addLine(`Comandos disponibles:<br>
                            - <b>status</b>: Verifica el estado del entorno Android SDK.<br>
                            - <b>create project</b>: Inicializa una nueva app de Android interactiva.<br>
                            - <b>build debug</b>: Compila la aplicación en modo depuración.<br>
                            - <b>clear</b>: Limpia la terminal.`, '#a1a1aa');
                        } else if (cmd === 'status') {
                            addLine('Diagnosticando entorno de desarrollo...', '#a1a1aa');
                            setTimeout(() => {
                                addLine('✔ Android SDK: C:\\Users\\Usuario\\AppData\\Local\\Android\\Sdk [INSTALADO]', '#10b981');
                                addLine('✔ Java JDK: OpenJDK 17.0.2 [INSTALADO]', '#10b981');
                                addLine('✔ Dispositivo Encontrado: Pixel_6_Emulator (API 33) [CONECTADO]', '#10b981');
                            }, 500);
                        } else if (cmd === 'create project') {
                            addLine('Creando estructura de archivos del proyecto Android...', '#a1a1aa');
                            setTimeout(() => {
                                addLine('→ Creado: app/src/main/java/com/antigravity/taste/MainActivity.kt', '#71717a');
                                addLine('→ Creado: app/src/main/res/layout/activity_main.xml', '#71717a');
                                addLine('✔ ¡Proyecto Android Inicializado Correctamente!', '#10b981');
                                
                                if (phoneStatus && phoneScreen) {
                                    phoneStatus.textContent = "APP INICIALIZADA";
                                    phoneStatus.style.color = "#38bdf8";
                                }
                            }, 800);
                        } else if (cmd === 'build debug') {
                            addLine('Ejecutando gradle build: gradlew assembleDebug...', '#a1a1aa');
                            if (phoneStatus) phoneStatus.textContent = "COMPILANDO...";
                            
                            setTimeout(() => {
                                addLine(':app:compileDebugJavaWithJavac [EJECUTADO]', '#71717a');
                                addLine(':app:packageDebug [EJECUTADO]', '#71717a');
                                addLine('✔ ¡BUILD SUCCESSFUL en 2.4s!', '#10b981');
                                addLine('Instalando apk en Pixel_6_Emulator...', '#a1a1aa');
                                
                                setTimeout(() => {
                                    addLine('✔ APK instalado correctamente. Lanzando MainActivity...', '#10b981');
                                    if (phoneStatus && phoneScreen) {
                                        phoneScreen.style.backgroundColor = '#0b0f19';
                                        phoneStatus.innerHTML = "<span style='color: #10b981; font-weight: bold;'><i class='fa-solid fa-circle-check'></i> APP EN EJECUCIÓN</span>";
                                    }
                                }, 800);
                            }, 1200);
                        } else if (cmd === 'clear') {
                            // Remove all except input
                            const lines = body.querySelectorAll('.cli-line');
                            lines.forEach(l => l.remove());
                        } else {
                            addLine(`Comando no reconocido: "${cmd}". Escribe "help" para ver los comandos válidos.`, '#f43f5e');
                        }
                    }
                });
            }
        }
    }
};

// 2. Global State Engine & Theme Controller
let currentSkill = 'minimalist-ui';

function setSkillTheme(skillId) {
    const registryEntry = skillsRegistry[skillId];
    if (!registryEntry) return;

    // Update state
    currentSkill = skillId;

    // A. Switch CSS Theme on viewport
    const viewport = document.getElementById('viewport-container');
    const appBody = document.body;
    
    // Clear previous themes
    appBody.className = '';
    viewport.className = 'playground-viewport';
    
    // Set appropriate theme classes
    let themeClass = 'theme-default';
    if (skillId === 'minimalist-ui') themeClass = 'theme-minimalist';
    else if (skillId === 'industrial-brutalist-ui') themeClass = 'theme-brutalist';
    else if (skillId === 'high-end-visual-design') themeClass = 'theme-highend';
    else if (skillId === 'gpt-taste') themeClass = 'theme-gpt-taste';
    else if (skillId === 'android-cli') themeClass = 'theme-android-cli';
    else if (skillId === 'brandkit') themeClass = 'theme-brandkit';
    else if (skillId === 'design-taste-frontend') themeClass = 'theme-design-taste';
    else if (skillId === 'redesign-existing-projects') themeClass = 'theme-redesign';
    else if (skillId === 'image-to-code') themeClass = 'theme-image-to-code';
    else if (skillId === 'imagegen-frontend-mobile') themeClass = 'theme-mobilegen';
    else if (skillId === 'imagegen-frontend-web') themeClass = 'theme-webgen';
    else if (skillId === 'stitch-design-taste') themeClass = 'theme-stitch';
    else if (skillId === 'full-output-enforcement') themeClass = 'theme-fulloutput';

    viewport.classList.add(themeClass);

    // B. Update text content in Hub Header
    document.getElementById('skill-title').textContent = registryEntry.title;
    document.getElementById('skill-description').textContent = registryEntry.description;
    document.getElementById('skill-category').textContent = registryEntry.category;
    document.getElementById('meta-typography').textContent = registryEntry.typography;
    document.getElementById('meta-density').textContent = registryEntry.density;
    document.getElementById('meta-colors').textContent = registryEntry.colors;
    
    // C. Update frame label
    document.getElementById('frame-label').textContent = `PLAYGROUND // ${skillId.toUpperCase()}`;

    // D. Update Principles list
    const principlesList = document.getElementById('principles-list');
    principlesList.innerHTML = '';
    registryEntry.principles.forEach(principle => {
        const li = document.createElement('li');
        li.innerHTML = principle;
        principlesList.appendChild(li);
    });

    // E. Update Technical Directive
    document.getElementById('code-directive').textContent = registryEntry.directive;

    // F. Render actual Demo content inside viewport
    const demoWrapper = document.getElementById('demo-content');
    demoWrapper.innerHTML = registryEntry.renderDemo();

    // G. Initialize dynamic interactive code if declared
    if (typeof registryEntry.init === 'function') {
        registryEntry.init();
    }
}

// 3. Document Initialization & Navigation Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Nav menu buttons
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active from all
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // Add active to current
            item.classList.add('active');

            // Switch theme
            const skillId = item.getAttribute('data-skill');
            setSkillTheme(skillId);
        });
    });

    // Reset button listener
    const btnReset = document.getElementById('btn-reset-demo');
    if (btnReset) {
        btnReset.addEventListener('click', () => {
            setSkillTheme(currentSkill);
        });
    }

    // Set initial default theme (Minimalist UI)
    setSkillTheme('minimalist-ui');
});
