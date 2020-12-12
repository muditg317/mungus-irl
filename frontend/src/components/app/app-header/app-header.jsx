import React from 'react';
import NavBar from 'components/nav-bar';

export default function AppHeader({ onAuthButtonPress }) {
    return (
            <header className="w-full sticky top-0 print:hidden">
                <NavBar onAuthButtonPress={onAuthButtonPress} />
            </header>
        );
}
