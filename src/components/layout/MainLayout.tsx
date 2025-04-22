'use client';

import { useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';

interface MainLayoutProps {
    children: React.ReactNode;
    title?: string;
    description?: string;
}

export default function MainLayout({
    children,
    title = 'Kenya Visa - Official e-Visa Application Portal',
    description = 'Apply for your Kenya e-Visa online. Fast, secure, and convenient application process.'
}: MainLayoutProps) {
    useEffect(() => {
        // Update document title on the client side
        document.title = title;

        // Update meta description
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute('content', description);
        } else {
            const meta = document.createElement('meta');
            meta.name = 'description';
            meta.content = description;
            document.head.appendChild(meta);
        }
    }, [title, description]);

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-grow">
                {children}
            </main>
            <Footer />
        </div>
    );
}
