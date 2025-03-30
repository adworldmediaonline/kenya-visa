"use client";
import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import DesktopNav from './DesktopNav';
import MobileNav from './MobileNav';
import Link from 'next/link';

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header className={`sticky top-0 z-50 bg-white ${isScrolled ? 'shadow-md' : ''}`}>
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <button
                            className="md:hidden p-2 rounded-md text-gray-700 hover:text-gray-900 focus:outline-none"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                        <Link href="/">
                            <div className="flex items-center ml-2 md:ml-0">
                                <div className="h-10 w-10 bg-green-600 rounded-full flex items-center justify-center mr-2">
                                    <span className="text-white font-bold">ET</span>
                                </div>
                                <span className="font-bold text-xl text-green-800">Ethiopia eVisa</span>
                            </div>
                        </Link>
                    </div>

                    <DesktopNav />
                </div>
            </div>

            {isMenuOpen && <MobileNav closeMenu={() => setIsMenuOpen(false)} />}
        </header>
    );
}