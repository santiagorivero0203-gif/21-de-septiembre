import { motion } from 'framer-motion';

export default function CuteYellowFlower() {
    return (
        // Este div controla la animación de levitar arriba y abajo
        <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{
                duration: 4, // Tarda 4 segundos en subir y bajar
                repeat: Infinity, // Se repite por siempre
                ease: "easeInOut" // Hace que el movimiento sea muy suave en las puntas
            }}
            className="w-64 max-w-[80vw] mx-auto drop-shadow-2xl" // Tailwind para tamaño y sombra suave
        >
            {/* PEGA AQUÍ EL CÓDIGO SVG DE ARRIBA */}

        </motion.div>
    );
}