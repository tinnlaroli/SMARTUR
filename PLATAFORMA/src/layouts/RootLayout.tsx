import { Outlet } from 'react-router-dom';
import { AuthModal } from '../features/auth/components/AuthModal';

export const RootLayout = () => {
    return (
        <>
            <Outlet />
            <AuthModal />
        </>
    );
};
