import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ====================================================================
 * UTILIDAD DE RETROALIMENTACIÓN HÁPTICA (Móviles)
 * Proporciona respuesta táctil en dispositivos compatibles al tocar
 * la caja o interactuar con las sorpresas.
 * ====================================================================
 */
const triggerHaptic = (pattern = 40) => {
  if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
    try {
      window.navigator.vibrate(pattern);
    } catch {
      // Silencioso en navegadores sin soporte
    }
  }
};

/**
 * ====================================================================
 * GENERADOR DE SPRITES EN MEMORIA (HiDPI / Retina Sharp)
 * Dibuja 3 estilos de flores en lienzos offscreen a 180x180 px.
 * Al redimensionarse hacia abajo en pantallas de alta densidad,
 * lucen nítidas y sin consumo extra de CPU/GPU.
 * ====================================================================
 */
function createFlowerSprites() {
  const size = 180;
  const half = size / 2;

  // 1. Sprite Girasol Dorado
  const canvas1 = document.createElement('canvas');
  canvas1.width = size;
  canvas1.height = size;
  const ctx1 = canvas1.getContext('2d');
  
  const petalCount = 12;
  for (let i = 0; i < petalCount; i++) {
    const angle = (i * Math.PI * 2) / petalCount;
    ctx1.save();
    ctx1.translate(half, half);
    ctx1.rotate(angle);
    ctx1.beginPath();
    ctx1.moveTo(0, 0);
    ctx1.quadraticCurveTo(18, -half + 10, 0, -half + 3);
    ctx1.quadraticCurveTo(-18, -half + 10, 0, 0);
    ctx1.fillStyle = '#FBBF24';
    ctx1.strokeStyle = '#F59E0B';
    ctx1.lineWidth = 1.5;
    ctx1.fill();
    ctx1.stroke();

    // Brillo interior del pétalo
    ctx1.beginPath();
    ctx1.moveTo(0, 0);
    ctx1.quadraticCurveTo(10, -half + 24, 0, -half + 16);
    ctx1.quadraticCurveTo(-10, -half + 24, 0, 0);
    ctx1.fillStyle = '#FDE047';
    ctx1.fill();
    ctx1.restore();
  }
  // Centro texturizado
  ctx1.beginPath();
  ctx1.arc(half, half, 28, 0, Math.PI * 2);
  ctx1.fillStyle = '#78350F';
  ctx1.fill();
  ctx1.beginPath();
  ctx1.arc(half, half, 20, 0, Math.PI * 2);
  ctx1.fillStyle = '#451A03';
  ctx1.strokeStyle = '#92400E';
  ctx1.lineWidth = 2;
  ctx1.stroke();
  ctx1.fill();
  ctx1.beginPath();
  ctx1.arc(half, half, 10, 0, Math.PI * 2);
  ctx1.fillStyle = '#291102';
  ctx1.fill();

  // 2. Sprite Margarita Amarilla Chibi
  const canvas2 = document.createElement('canvas');
  canvas2.width = size;
  canvas2.height = size;
  const ctx2 = canvas2.getContext('2d');
  const daisyPetals = 8;
  for (let i = 0; i < daisyPetals; i++) {
    const angle = (i * Math.PI * 2) / daisyPetals;
    ctx2.save();
    ctx2.translate(half, half);
    ctx2.rotate(angle);
    ctx2.beginPath();
    ctx2.ellipse(0, -half + 30, 16, 28, 0, 0, Math.PI * 2);
    ctx2.fillStyle = '#FDE047';
    ctx2.strokeStyle = '#FACC15';
    ctx2.lineWidth = 1.5;
    ctx2.fill();
    ctx2.stroke();
    ctx2.beginPath();
    ctx2.ellipse(0, -half + 34, 10, 18, 0, 0, Math.PI * 2);
    ctx2.fillStyle = '#FEF08A';
    ctx2.fill();
    ctx2.restore();
  }
  ctx2.beginPath();
  ctx2.arc(half, half, 22, 0, Math.PI * 2);
  ctx2.fillStyle = '#D97706';
  ctx2.fill();
  ctx2.beginPath();
  ctx2.arc(half, half, 16, 0, Math.PI * 2);
  ctx2.fillStyle = '#F59E0B';
  ctx2.fill();
  ctx2.beginPath();
  ctx2.arc(half - 5, half - 5, 5, 0, Math.PI * 2);
  ctx2.fillStyle = '#FEF08A';
  ctx2.fill();

  // 3. Sprite Flor Silvestre con Hojitas
  const canvas3 = document.createElement('canvas');
  canvas3.width = size;
  canvas3.height = size;
  const ctx3 = canvas3.getContext('2d');
  // Hojas verdes
  [-0.65, 0.65].forEach(rot => {
    ctx3.save();
    ctx3.translate(half, half);
    ctx3.rotate(rot);
    ctx3.beginPath();
    ctx3.ellipse(0, half - 28, 16, 30, 0, 0, Math.PI * 2);
    ctx3.fillStyle = '#4ADE80';
    ctx3.strokeStyle = '#16A34A';
    ctx3.lineWidth = 1.5;
    ctx3.fill();
    ctx3.stroke();
    ctx3.restore();
  });
  // 5 pétalos redondeados
  for (let i = 0; i < 5; i++) {
    const angle = (i * Math.PI * 2) / 5;
    ctx3.save();
    ctx3.translate(half, half);
    ctx3.rotate(angle);
    ctx3.beginPath();
    ctx3.arc(0, -half + 36, 22, 0, Math.PI * 2);
    ctx3.fillStyle = '#FACC15';
    ctx3.strokeStyle = '#EAB308';
    ctx3.lineWidth = 1.5;
    ctx3.fill();
    ctx3.stroke();
    ctx3.beginPath();
    ctx3.arc(0, -half + 36, 15, 0, Math.PI * 2);
    ctx3.fillStyle = '#FEF08A';
    ctx3.fill();
    ctx3.restore();
  }
  ctx3.beginPath();
  ctx3.arc(half, half, 18, 0, Math.PI * 2);
  ctx3.fillStyle = '#CA8A04';
  ctx3.fill();
  ctx3.beginPath();
  ctx3.arc(half, half, 11, 0, Math.PI * 2);
  ctx3.fillStyle = '#A16207';
  ctx3.fill();

  return [canvas1, canvas2, canvas3];
}

/**
 * ====================================================================
 * CANVAS OPTIMIZADO: LLUVIA DE FLORES POR GRAVEDAD
 * - Soporte nativo para Retina / HiDPI (devicePixelRatio)
 * - Calibrado específicamente para móviles: costados laterales
 *   despejados con flores más pequeñas (50px - 85px) y centro balanceado.
 * ====================================================================
 */
const FallingFlowersCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = window.innerWidth;
    let height = window.innerHeight;

    const setupCanvasSize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.resetTransform?.();
      ctx.scale(dpr, dpr);
    };

    setupCanvasSize();
    window.addEventListener('resize', setupCanvasSize);

    const sprites = createFlowerSprites();

    // 42 partículas dan excelente presencia visual sin sobrecargar
    const count = 42;
    const particles = [];

    for (let i = 0; i < count; i++) {
      const x = Math.random() * width;
      const relX = x / (width || 1);
      const distFromCenter = Math.abs(relX - 0.5);

      let size;
      let opacity;
      if (distFromCenter > 0.32) {
        // En los bordes: delicadas y pequeñas para no saturar los costados en móvil
        size = Math.floor(Math.random() * 35) + 50; // 50px a 85px
        opacity = Math.random() * 0.25 + 0.35;
      } else {
        // En el centro: tamaño medio visible
        const roll = Math.random();
        if (roll < 0.25) {
          size = Math.floor(Math.random() * 25) + 115; // 115 - 140px
        } else if (roll < 0.75) {
          size = Math.floor(Math.random() * 25) + 85;  // 85 - 110px
        } else {
          size = Math.floor(Math.random() * 20) + 65;  // 65 - 85px
        }
        opacity = size > 110 ? 0.45 : 0.65;
      }

      const speed = Math.random() * 0.6 + 0.55;

      particles.push({
        x,
        y: Math.random() * (height + 150) - 75,
        size,
        opacity,
        speed,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() * 0.012 - 0.006),
        swayOffset: Math.random() * Math.PI * 2,
        swayWidth: distFromCenter > 0.32 ? 0.4 : 0.9,
        type: i % 3
      });
    }

    let lastTime = performance.now();

    const render = (time) => {
      const dt = Math.min((time - lastTime) / 16.666, 2);
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < count; i++) {
        const p = particles[i];

        p.y += p.speed * dt;
        p.rot += p.rotSpeed * dt;
        p.x += Math.sin(p.y * 0.008 + p.swayOffset) * p.swayWidth * dt;

        if (p.y > height + p.size) {
          p.y = -p.size;
          p.x = Math.random() * width;

          const relX = p.x / (width || 1);
          const distFromCenter = Math.abs(relX - 0.5);
          if (distFromCenter > 0.32) {
            p.size = Math.floor(Math.random() * 35) + 50;
            p.opacity = Math.random() * 0.25 + 0.35;
          } else {
            p.size = Math.floor(Math.random() * 40) + 80;
            p.opacity = p.size > 110 ? 0.45 : 0.65;
          }
        }

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.drawImage(
          sprites[p.type],
          -p.size / 2,
          -p.size / 2,
          p.size,
          p.size
        );
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', setupCanvasSize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
};

/**
 * ====================================================================
 * COMPONENTE DEL RAMO DE FLORES AMARILLAS PROFESIONAL
 * Ilustración estilizada de floristería (Girasoles, rosas y follaje).
 * Con contención vertical max-h-[34vh] para pantallas de baja altura.
 * ====================================================================
 */
const BouquetDisplay = () => (
  <div className="relative flex items-center justify-center w-full">
    <div className="absolute w-52 h-52 bg-amber-300/35 rounded-full blur-2xl pointer-events-none -z-10 animate-pulse" />
    
    <img
      src="/bouquet.png"
      alt="Ramo de Flores Amarillas"
      className="w-full max-w-[250px] sm:max-w-[290px] md:max-w-[320px] max-h-[34vh] h-auto object-contain drop-shadow-[0_10px_24px_rgba(0,0,0,0.28)] select-none pointer-events-none"
      draggable={false}
    />
  </div>
);

/**
 * ====================================================================
 * CAJA DE REGALO KAWAII CON ANIMACIÓN DE TAPA VOLADORA
 * ====================================================================
 */
const GiftBoxSVG = ({ isOpen }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl cursor-pointer overflow-visible">
    <ellipse cx="100" cy="180" rx="60" ry="10" fill="#000000" opacity="0.18" />
    <rect x="40" y="80" width="120" height="90" rx="8" fill="#FF8A80" />
    <rect x="90" y="80" width="20" height="90" fill="#D50000" />
    
    {isOpen ? (
      <>
        <circle cx="70" cy="122" r="6" fill="#3E2723" />
        <circle cx="130" cy="122" r="6" fill="#3E2723" />
        <circle cx="68" cy="120" r="2" fill="#FFFFFF" />
        <circle cx="128" cy="120" r="2" fill="#FFFFFF" />
        <circle cx="100" cy="135" r="6" fill="#3E2723" />
      </>
    ) : (
      <>
        <circle cx="70" cy="125" r="5" fill="#3E2723" />
        <circle cx="130" cy="125" r="5" fill="#3E2723" />
        <circle cx="68" cy="123" r="1.5" fill="#FFFFFF" />
        <circle cx="128" cy="123" r="1.5" fill="#FFFFFF" />
        <path d="M 92 130 Q 96 135 100 130 Q 104 135 108 130" stroke="#3E2723" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </>
    )}
    
    <ellipse cx="58" cy="132" rx="6" ry="3" fill="#FF5252" opacity="0.6" />
    <ellipse cx="142" cy="132" rx="6" ry="3" fill="#FF5252" opacity="0.6" />

    <motion.g
      initial={false}
      animate={isOpen ? { y: -90, rotate: -18, opacity: 0 } : { y: 0, rotate: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 160, damping: 14, opacity: { duration: 0.4, delay: 0.15 } }}
    >
      <rect x="30" y="60" width="140" height="30" rx="5" fill="#FF5252" /> 
      <rect x="90" y="60" width="20" height="30" fill="#D50000" />
      <path d="M 100 60 C 60 20, 30 50, 100 65" fill="#FF1744" />
      <path d="M 100 60 C 140 20, 170 50, 100 65" fill="#FF1744" />
      <circle cx="100" cy="62" r="8" fill="#D50000" />
    </motion.g>
  </svg>
);

/**
 * ====================================================================
 * APLICACIÓN PRINCIPAL
 * - Transición en 3 fases intuitiva y memorable
 * - Soporte háptico para smartphones
 * - Botón sutil de repetición tras disfrutar la sorpresa
 * ====================================================================
 */
export default function App() {
  const [tapCount, setTapCount] = useState(0);
  const [isUnboxed, setIsUnboxed] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  let promptText = "Tienes un regalo... ¡Toca la caja 3 veces para abrirlo!";
  if (tapCount === 1) promptText = "¡Eso es! Sigue tocando...";
  if (tapCount === 2) promptText = "¡Casi...! Una vez más.";
  if (tapCount >= 3) promptText = "¡Wow! 😲";

  useEffect(() => {
    if (tapCount === 3) {
      triggerHaptic([60, 50, 100]); // Respuesta de celebración al abrir
      const timer = setTimeout(() => setIsUnboxed(true), 1300);
      return () => clearTimeout(timer);
    }
  }, [tapCount]);

  const handleBoxTap = () => {
    if (tapCount < 3) {
      triggerHaptic(45);
      setTapCount(prev => prev + 1);
    }
  };

  const handleRevealTap = () => {
    triggerHaptic(60);
    setIsRevealed(true);
  };

  const handleReset = () => {
    triggerHaptic(30);
    setIsRevealed(false);
    setIsUnboxed(false);
    setTapCount(0);
  };

  return (
    <div className="relative w-full min-h-[100dvh] bg-gradient-to-b from-amber-50 via-rose-50 to-orange-100 flex flex-col items-center justify-center font-sans touch-manipulation select-none overflow-hidden">
      
      {/* 1. FONDO PIXEL ART CHIBI (Aparece suavemente tras abrir la caja) */}
      <AnimatePresence>
        {isUnboxed && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="fixed inset-0 z-0 bg-cover bg-bottom md:bg-center pointer-events-none"
            style={{
              backgroundImage: "url('/bg-pixel.jpg')",
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'cover'
            }}
          >
            <div className="absolute inset-0 bg-black/10" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. FLORES CAYENDO POR GRAVEDAD (Aparecen tras abrir la caja) */}
      <AnimatePresence>
        {isUnboxed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="fixed inset-0 z-10 pointer-events-none overflow-hidden"
          >
            <FallingFlowersCanvas />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. CONTENIDO INTERACTIVO PRINCIPAL */}
      <div className="relative w-full max-w-md h-full min-h-[100dvh] flex flex-col items-center justify-center z-20 px-4 py-4 sm:py-6">

        <AnimatePresence mode="wait">
          
          {/* FASE 1: LA CAJA DE REGALO KAWAII */}
          {!isUnboxed ? (
            <motion.div
              key="phase1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center w-full px-4 relative"
            >
              <motion.div
                onClick={handleBoxTap}
                role="button"
                tabIndex={0}
                aria-label="Abrir caja de regalo"
                className="w-60 h-60 sm:w-68 sm:h-68 md:w-72 md:h-72 mb-6 cursor-pointer focus:outline-none"
                animate={
                  tapCount === 0 ? { scale: [1, 1.03, 1] } :
                  tapCount === 1 ? { x: [-10, 10, -10, 10, 0] } :
                  tapCount === 2 ? { x: [-15, 15, -15, 15, 0], scale: 1.08 } :
                  { scale: 1.15 }
                }
                transition={
                  tapCount === 0 ? { repeat: Infinity, duration: 2.2 } :
                  tapCount === 3 ? { type: "spring", stiffness: 200, damping: 15 } :
                  { type: "spring", stiffness: 300, damping: 15 }
                }
              >
                <GiftBoxSVG isOpen={tapCount >= 3} />
              </motion.div>

              <motion.div
                animate={tapCount >= 3 ? { scale: 1.1 } : { opacity: [0.85, 1, 0.85] }}
                transition={tapCount >= 3 ? { type: "spring" } : { repeat: Infinity, duration: 2 }}
                className="bg-white/95 px-6 py-3 rounded-2xl shadow-xl border border-white"
              >
                <p className="text-base sm:text-lg md:text-xl font-bold text-rose-600 font-['Quicksand',sans-serif] text-center">
                  {promptText}
                </p>
              </motion.div>
            </motion.div>
          ) : (

            /* FASE 2 & 3: BOTÓN DE SORPRESA Y DESPLIEGUE DEL RAMO */
            <motion.div
              key="phase2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="relative flex flex-col items-center justify-center w-full h-full min-h-[500px]"
            >
              <AnimatePresence>
                {isRevealed && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.35, y: 50 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: "spring", bounce: 0.28, duration: 0.85 }}
                    className="flex flex-col items-center w-full max-w-sm max-h-[92dvh]"
                  >
                    {/* Ramo con animación suave de flotación */}
                    <motion.div
                      animate={{ y: [-4, 4, -4], rotate: [-0.6, 0.6, -0.6] }}
                      transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                      className="w-full flex justify-center mb-[-10px] z-10"
                    >
                      <BouquetDisplay />
                    </motion.div>

                    {/* Tarjeta con dedicatoria */}
                    <motion.div
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.55 }}
                      className="w-full p-5 sm:p-6 rounded-3xl bg-white/95 border border-white shadow-2xl text-center relative z-20"
                    >
                      <h1 className="text-3xl sm:text-4xl font-bold text-amber-700 mb-2 font-['Dancing_Script',cursive]">
                        ¡Feliz 21 de Septiembre!
                      </h1>
                      <p className="text-sm sm:text-base md:text-lg text-gray-800 font-bold leading-relaxed font-['Quicksand',sans-serif]">
                        "Para mi niña hermosa: Aunque hoy no podamos vernos, no podía faltar tu ramo de flores amarillas. Te amo demasiado."
                      </p>
                      <motion.div 
                        animate={{ scale: [1, 1.25, 1] }}
                        transition={{ repeat: Infinity, duration: 1.3, ease: "easeInOut" }}
                        className="mt-2 text-3xl inline-block"
                      >
                        💛
                      </motion.div>

                      {/* Botón discreto para reiniciar la experiencia si lo desea */}
                      <div className="mt-3 flex justify-center">
                        <button
                          onClick={handleReset}
                          className="text-xs text-amber-800/60 hover:text-amber-900 transition-colors cursor-pointer flex items-center gap-1 font-medium font-['Quicksand',sans-serif] px-3 py-1 rounded-full hover:bg-amber-50"
                        >
                          <span>↺</span> Volver a abrir
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Botón de sorpresa antes de revelar el ramo */}
              <AnimatePresence>
                {!isRevealed && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1,
                      boxShadow: [
                        '0px 4px 15px rgba(245, 158, 11, 0.4)', 
                        '0px 4px 28px rgba(245, 158, 11, 0.8)', 
                        '0px 4px 15px rgba(245, 158, 11, 0.4)'
                      ] 
                    }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={{ 
                      opacity: { duration: 0.25 },
                      scale: { duration: 0.25 },
                      boxShadow: { repeat: Infinity, duration: 1.8 }
                    }}
                    onClick={handleRevealTap}
                    className="w-[90%] max-w-[290px] min-h-[4rem] bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-amber-950 font-bold text-xl rounded-full shadow-xl active:scale-95 flex items-center justify-center font-['Quicksand',sans-serif] cursor-pointer"
                  >
                    Toca aquí para tu sorpresa ✨
                  </motion.button>
                )}
              </AnimatePresence>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
