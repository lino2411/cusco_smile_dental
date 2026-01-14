import React, { useRef, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import formatoAdulto from '../../assets/odontograma/formato-adulto.jpg';

const OdontogramaCanvas = ({
    hallazgos = [],
    onMarcarPunto,
    modoMarcado = false,
    tratamientoActivo = null,
    onAbrirBuscador,
    modoEdicion = true
}) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [imagenCargada, setImagenCargada] = useState(false);
    const imagenRef = useRef(null);

    const ANCHO_CANVAS = 700;
    const ALTO_CANVAS = 873;

    // Cargar imagen
    useEffect(() => {
        const img = new Image();
        img.src = formatoAdulto;
        img.onload = () => {
            imagenRef.current = img;
            setImagenCargada(true);
            dibujarCanvas();
        };
    }, []);

    // Redibujar cuando cambien los hallazgos o el modo
    useEffect(() => {
        if (imagenCargada) {
            dibujarCanvas();
        }
    }, [hallazgos, imagenCargada, modoMarcado]);

    // Función para dibujar símbolos según tipo de tratamiento
    // Función para dibujar símbolos según tipo de tratamiento
    const dibujarSimbolo = (ctx, x, y, hallazgo, escalaX, escalaY) => {
        const color = hallazgo.color === 'rojo' ? '#FF0000' : '#0000FF';
        const codigo = hallazgo.codigo ? hallazgo.codigo.toUpperCase() : '';
        const nombre = hallazgo.nombre ? hallazgo.nombre.toLowerCase() : '';

        ctx.save();

        // Detectar tipo de tratamiento por código O por nombre
        const esExtraccion = codigo === 'EX' || codigo === 'EXT' || codigo === 'EXTRACCION' || codigo === 'AUS' || nombre.includes('extrac') || nombre.includes('ausente');
        const esCaries = codigo === 'CA' || codigo === 'CAR' || codigo === 'CARIES' || nombre.includes('caries');
        const esCorona = codigo === 'CC' || codigo === 'CMC' || codigo === 'CJ' || codigo === 'CF' || codigo === 'CV' || codigo === 'CP' || codigo === 'CTEMP' || codigo === 'CORONA' || nombre.includes('corona');
        const esImplante = codigo === 'IMP' || codigo === 'IMPLANTE' || nombre.includes('implante');
        const esRestauracion = codigo === 'R' || codigo === 'AM' || codigo === 'IV' || codigo === 'IM' || codigo === 'IE' || codigo === 'RTEMP' || codigo === 'RESTAURACION' || nombre.includes('restaura') || nombre.includes('amalgama') || nombre.includes('resina') || nombre.includes('ionómero') || nombre.includes('incrustación');
        const esTratamientoConducto = codigo === 'TC' || codigo === 'PC' || codigo === 'PP' || nombre.includes('conducto') || nombre.includes('endodoncia') || nombre.includes('pulpectomía') || nombre.includes('pulpotomía');
        const esFractura = codigo === 'FR' || codigo === 'FRAC' || codigo === 'FRACTURA' || nombre.includes('fractura');
        const esRemanente = codigo === 'RR' || nombre.includes('remanente') || nombre.includes('radicular');
        const esProtesis = codigo === 'PR' || codigo === 'PT' || nombre.includes('prótesis');

        if (esExtraccion) {
            // Extracción / Ausente - X (aspa) TAMAÑO ORIGINAL
            ctx.strokeStyle = color;
            ctx.lineWidth = 5;
            const tamañoX = 25;
            ctx.beginPath();
            ctx.moveTo(x - tamañoX, y - tamañoX);
            ctx.lineTo(x + tamañoX, y + tamañoX);
            ctx.moveTo(x + tamañoX, y - tamañoX);
            ctx.lineTo(x - tamañoX, y + tamañoX);
            ctx.stroke();
        } else if (esCaries) {
            // Caries - Círculo relleno MÁS PEQUEÑO
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, 2 * Math.PI); // ✅ REDUCIDO de 15 a 8
            ctx.fill();
        } else if (esCorona) {
            // Corona - Círculo vacío (contorno) TAMAÑO ORIGINAL
            ctx.strokeStyle = color;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(x, y, 22, 0, 2 * Math.PI);
            ctx.stroke();
        } else if (esImplante) {
            // Implante - Texto "IMP"
            ctx.fillStyle = color;
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('IMP', x, y);
        } else if (esRestauracion) {
            // Restauración - Cuadrado relleno MÁS PEQUEÑO
            ctx.fillStyle = color;
            const tamañoCuadrado = 6; // ✅ REDUCIDO de 12 a 8
            ctx.fillRect(x - tamañoCuadrado, y - tamañoCuadrado, tamañoCuadrado * 2, tamañoCuadrado * 2);
        } else if (esTratamientoConducto) {
            // Tratamiento de conducto - Línea vertical
            ctx.strokeStyle = color;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(x, y - 28);
            ctx.lineTo(x, y + 28);
            ctx.stroke();
        } else if (esFractura) {
            // Fractura - Línea diagonal
            ctx.strokeStyle = color;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(x - 18, y - 18);
            ctx.lineTo(x + 18, y + 18);
            ctx.stroke();
        } else if (esRemanente) {
            // Remanente radicular - Texto "RR"
            ctx.fillStyle = color;
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('RR', x, y);
        } else if (esProtesis) {
            // Prótesis - Dos líneas paralelas
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x - 20, y - 5);
            ctx.lineTo(x + 20, y - 5);
            ctx.moveTo(x - 20, y + 5);
            ctx.lineTo(x + 20, y + 5);
            ctx.stroke();
        } else {
            // Por defecto - Punto
            ctx.beginPath();
            ctx.arc(x, y, 8, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = color === '#FF0000' ? '#CC0000' : '#0000CC';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        ctx.restore();
    };

    // Función para dibujar el canvas
    const dibujarCanvas = () => {
        if (!canvasRef.current || !imagenRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Limpiar canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Dibujar imagen de fondo escalada
        ctx.drawImage(imagenRef.current, 0, 0, ANCHO_CANVAS, ALTO_CANVAS);

        // Calcular escala de coordenadas
        const escalaX = ANCHO_CANVAS / imagenRef.current.width;
        const escalaY = ALTO_CANVAS / imagenRef.current.height;

        // Dibujar marcas existentes
        hallazgos.forEach(hallazgo => {
            if (hallazgo.coordenada_x && hallazgo.coordenada_y) {
                const x = hallazgo.coordenada_x * escalaX;
                const y = hallazgo.coordenada_y * escalaY;
                dibujarSimbolo(ctx, x, y, hallazgo, escalaX, escalaY);
            }
        });
    };

    // Manejar click en canvas
    const handleCanvasClick = (e) => {
        if (!modoMarcado || !tratamientoActivo || !canvasRef.current || !imagenRef.current) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();

        const xCanvas = e.clientX - rect.left;
        const yCanvas = e.clientY - rect.top;

        const escalaX = imagenRef.current.width / ANCHO_CANVAS;
        const escalaY = imagenRef.current.height / ALTO_CANVAS;

        const xOriginal = xCanvas * escalaX;
        const yOriginal = yCanvas * escalaY;

        onMarcarPunto?.(xOriginal, yOriginal);
    };

    return (
        <div ref={containerRef} className="w-full space-y-4">

            {/* Botón para abrir buscador */}
            {modoEdicion && !modoMarcado && (
                <div className="flex justify-center">
                    <button
                        onClick={onAbrirBuscador}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-smile_600 to-smile_700 hover:from-smile_700 hover:to-smile_800 text-white rounded-lg transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                        <Plus className="w-6 h-6" />
                        Agregar Tratamiento
                    </button>
                </div>
            )}

            {imagenCargada ? (
                <div className="flex justify-center">
                    <canvas
                        ref={canvasRef}
                        width={ANCHO_CANVAS}
                        height={ALTO_CANVAS}
                        onClick={handleCanvasClick}
                        className={`border-2 ${modoMarcado
                            ? 'border-smile_500 cursor-crosshair shadow-xl ring-4 ring-smile_200'
                            : 'border-gray-300 cursor-default'
                            } rounded-lg shadow-lg`}
                        style={{ maxWidth: '100%', height: 'auto' }}
                    />
                </div>
            ) : (
                <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
                    <p className="text-gray-500">Cargando odontograma...</p>
                </div>
            )}

            {/* Leyenda */}
            <div className="mt-4 p-4 bg-gradient-to-r from-smile_50 to-blue-50 rounded-xl border-2 border-smile_200 shadow-sm">
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-red-700 shadow-sm"></div>
                        <span className="font-semibold text-red-700 text-sm">Rojo = Plan de tratamiento</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-blue-700 shadow-sm"></div>
                        <span className="font-semibold text-blue-700 text-sm">Azul = Tratamiento existente</span>
                    </div>
                </div>
                {modoMarcado && tratamientoActivo && (
                    <div className="mt-3 p-3 bg-smile_600 rounded-lg border-2 border-smile_700 animate-pulse">
                        <p className="text-sm font-bold text-white text-center">
                            🎯 MODO MARCADO: Diente {tratamientoActivo.numero_diente} - {tratamientoActivo.nombre}
                        </p>
                        <p className="text-xs text-smile_100 mt-1 text-center">
                            Haz click donde quieras marcar (Color: {tratamientoActivo.color === 'rojo' ? '🔴 Rojo' : '🔵 Azul'})
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OdontogramaCanvas;
