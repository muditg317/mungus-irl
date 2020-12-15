import React from 'react';
import NavBar from 'components/nav-bar';

export default function AppHeader({ onAuthButtonPress }) {
    return (
            <header className="w-full sticky top-0 z-50 print:hidden">
                <NavBar onAuthButtonPress={onAuthButtonPress} />
            </header>
        );
}
