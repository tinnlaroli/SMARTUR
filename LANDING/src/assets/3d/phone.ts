import { Application } from '@splinetool/runtime';

export function initPhoneScene(container: HTMLElement, onLoad?: () => void) {
    // Evitar duplicados
    if (container.querySelector('canvas')) return;

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
    
    // Smooth opacity transition for loading
    canvas.style.opacity = '0';
    canvas.style.transition = 'opacity 1s ease-in-out';
    
    container.appendChild(canvas);

    // Inicializar Spline Application
    const app = new Application(canvas);
    
    // Cargar Escena
    app.load('https://prod.spline.design/l6CGSfUVQH65tNtB/scene.splinecode')
        .then(() => {
            // Si el componente ya se desmontó, no hacemos nada
            if (!isMounted) return;
            
            // Notificar que se cargó
            canvas.style.opacity = '1';
            if (onLoad) onLoad();

            // Buscamos el objeto por el nombre que aparece en tu panel de "Objects"
            const phone = app.findObjectByName('iPhone 14 Pro');

            if (phone) {
                // Los valores suelen estar en radianes (aprox 0.5 para 30 grados)
                phone.rotation.x = -0.6; 

                // Valor negativo para girar hacia la izquierda
                phone.rotation.y = 0.4; 

                
                phone.scale.x = 1.1;
                phone.scale.y = 1.1;
                phone.scale.z = 1.1;

                // Variables para la animación
                const baseRotationX = -0.6;
                const baseRotationY = 0.4;
                const sensitivity = 0.5; // Ajusta qué tanto se mueve

                // Definir el listener dentro del scope donde existe 'phone'
                onMouseMove = (e: MouseEvent) => {
                    // Normalizar posición del mouse (-1 a 1)
                    const mouseX = (e.clientX / window.innerWidth) * 2 - 1;
                    const mouseY = (e.clientY / window.innerHeight) * 2 - 1;
                    
                    // Actualizar rotación
                    phone.rotation.y = baseRotationY + (mouseX * sensitivity);
                    phone.rotation.x = baseRotationX + (mouseY * sensitivity);
                };

                // Agregar el listener solo si sigue montado y NO es móvil
                if (isMounted && window.innerWidth > 768) {
                    window.addEventListener('mousemove', onMouseMove);
                } else if (isMounted) {
                    // Optional: Set a static pleasant rotation for mobile since interaction is disabled
                    phone.rotation.x = -0.5;
                    phone.rotation.y = 0.5;
                }
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
    };
}