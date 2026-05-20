// src/registerServiceWorker.js
export function register() {
    if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // En Vite, los archivos de public/ se sirven desde la raíz
        const swUrl = `/service-worker.js`;

        navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
            console.log('Service Worker registrado:', registration.scope);

            registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            
            installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                    console.log('Nueva versión disponible');
                    
                    // Opcional: notificar al usuario
                    const shouldReload = window.confirm(
                    'Nueva versión disponible. ¿Actualizar ahora?'
                    );
                    
                    if (shouldReload) {
                    installingWorker.postMessage({ type: 'SKIP_WAITING' });
                    window.location.reload();
                    }
                } else {
                    console.log('Contenido cacheado para uso offline');
                }
                }
            };
            };
        })
        .catch((error) => {
            console.error('Error al registrar Service Worker:', error);
        });

        // Recargar cuando cambie el controller
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
            window.location.reload();
            refreshing = true;
        }
        });
    });
    }
}

export function unregister() {
    if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
        .then((registration) => {
        registration.unregister();
        console.log('Service Worker desregistrado');
        })
        .catch((error) => {
        console.error('Error al desregistrar:', error.message);
        });
    }
}