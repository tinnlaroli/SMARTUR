import { Application } from '@splinetool/runtime';

// Nombres alternativos aceptados para el telefono. Si en tu escena
// Spline lo renombraste (p.ej. "iPhone", "Telefono", "Welltur Phone"),
// agregalo aqui. Mientras el objeto principal se llame igual, no hace
// falta ningun cambio.
const PHONE_OBJECT_NAMES = [
    'iPhone 14 Pro',
    'iPhone 14',
    'iPhone',
    'Telefono',
    'Phone',
    'Smartur Phone',
    'Welltur Phone',
    'iPhone 14 Pro Max',
];

interface InitPhoneSceneOptions {
    onLoad?: () => void;
    /** true = escena WELLTUR (tema welltur), false = escena SMARTUR. */
    isWelltur?: boolean;
}

const SMARTUR_SCENE_URL = 'https://prod.spline.design/l6CGSfUVQH65tNtB/scene.splinecode';
const WELLTUR_SCENE_URL = 'https://my.spline.design/iphone3dspinning-OenO3OROCEw96oKtvtc5KJvT/';

export function initPhoneScene(container: HTMLElement, options: InitPhoneSceneOptions = {}) {
    const { onLoad, isWelltur = false } = options;

    // Evitar duplicados si ya existe un canvas
    if (container.querySelector('canvas')) return;
    if (container.dataset.splinePending === '1') return;
    container.dataset.splinePending = '1';

    // Variable para controlar si el componente sigue montado
    let isMounted = true;

    // Control del listener
    let onMouseMove: ((e: MouseEvent) => void) | null = null;

    // Crear canvas
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.marginLeft = '10%';
    canvas.style.marginTop = '-10%';
    canvas.style.filter = "drop-shadow(30px 0 20px rgba(0,0,0,0.3))";
    canvas.style.display = 'block';

    // Transform CSS para corregir fondo
    canvas.style.transform = 'scale(0.7)';
    canvas.style.transformOrigin = 'center';

    // Smooth opacity transition for loading
    canvas.style.opacity = '0';
    canvas.style.transition = 'opacity 1s ease-in-out';

    container.appendChild(canvas);

    // Inicializar Spline
    const app = new Application(canvas);

    // Busqueda tolerante del objeto del telefono
    const findPhoneObject = (): any => {
        for (const name of PHONE_OBJECT_NAMES) {
            const found = app.findObjectByName(name);
            if (found) return found;
        }

        // Fallback: el objeto mas grande de la escena
        const root: any = (app as any).scene ?? (app as any)._objects ?? [];
        const candidates = Array.isArray(root) ? root : [root];
        let best: any = null;
        let bestSize = 0;
        for (const obj of candidates) {
            const s = obj?.worldScale ?? obj?.scale;
            const size = Math.abs(s?.x ?? 1) * Math.abs(s?.y ?? 1) * Math.abs(s?.z ?? 1);
            if (size > bestSize) { bestSize = size; best = obj ?? null; }
        }
        return best;
    };

    // Cargar Escena (la URL correcta segun el tema)
    app.load(isWelltur ? WELLTUR_SCENE_URL : SMARTUR_SCENE_URL)
        .then(() => {
            // Si el componente ya se desmonto, no hacemos nada
            if (!isMounted) return;

            // Notificar que se cargo
            canvas.style.opacity = '1';
            if (onLoad) onLoad();

            // Buscamos el objeto por el nombre que aparece en tu panel de "Objects"
            const phone = findPhoneObject();

            if (phone) {
                // Rotaciones en radianes (aprox 0.5 = 30 grados)
                phone.rotation.x = -0.6;
                phone.rotation.y = 0.4;

                phone.scale.x = 1.1;
                phone.scale.y = 1.1;
                phone.scale.z = 1.1;

                // Normalizacion de escala por BOUNDING BOX:
                // Si reexportaste la escena (p.ej. para WELLTUR) y el objeto
                // quedo a otra escala, el bounding box nos dice el tamano
                // real EN MUNDO. Escalamos para que el ancho del telefono
                // ocupe siempre un ancho objetivo fijo -> NUNCA se ve enorme.
                const targetWorldWidth = 170;
                try {
                    const box = (phone as any).getBoundingBox?.();
                    const ext = box && typeof box === 'object' ? (box as any) : null;
                    const min = ext?.min ?? ext?.minCorner ?? null;
                    const max = ext?.max ?? ext?.maxCorner ?? null;
                    if (min && max) {
                        const sx = max.x - min.x;
                        const sy = max.y - min.y;
                        const sz = max.z - min.z;
                        const worldWidth = Math.max(sx, sy, sz) || 1;
                        const k = targetWorldWidth / worldWidth;
                        if (k > 0 && (k < 0.7 || k > 1.4)) {
                            phone.scale.x *= k;
                            phone.scale.y *= k;
                            phone.scale.z *= k;
                        }
                    }
                } catch { /* Sin getBoundingBox: ignorar, sigue abajo */ }

                // Variables para animacion
                const baseRotationX = -0.6;
                const baseRotationY = 0.4;
                const sensitivity = 0.5;

                onMouseMove = (e: MouseEvent) => {
                    const mouseX = (e.clientX / window.innerWidth) * 2 - 1;
                    const mouseY = (e.clientY / window.innerHeight) * 2 - 1;
                    phone.rotation.y = baseRotationY + (mouseX * sensitivity);
                    phone.rotation.x = baseRotationX + (mouseY * sensitivity);
                };

                // Listener solo si sigue montado y NO es movil
                if (isMounted && window.innerWidth > 768) {
                    window.addEventListener('mousemove', onMouseMove);
                } else if (isMounted) {
                    phone.rotation.x = -0.5;
                    phone.rotation.y = 0.5;
                }
            }
        })
        .catch(() => {
            // Fallback: si la escena WELLTUR fallo, cargar la SMARTUR
            if (isWelltur) {
                app.load(SMARTUR_SCENE_URL).catch(() => { /* silencioso */ });
                if (onLoad) onLoad();
            }
        });

    // Limpieza (Cleanup)
    return () => {
        isMounted = false;
        if (onMouseMove) {
            window.removeEventListener('mousemove', onMouseMove);
        }
        app.dispose();
        if (container.contains(canvas)) {
            container.removeChild(canvas);
        }
        delete container.dataset.splinePending;
    };
}