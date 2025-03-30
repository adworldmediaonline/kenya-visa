import Link from 'next/link';
import { Home, FileText, ClipboardCheck, Phone } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface MobileNavProps {
    closeMenu: () => void;
}

export default function MobileNav({ closeMenu }: MobileNavProps) {
    const pathname = usePathname();

    return (
        <div className="md:hidden bg-white border-t border-gray-200 py-2">
            <div className="container mx-auto px-4">
                <div className="flex flex-col space-y-3 py-2">
                    <Link
                        href="/"
                        className={`flex items-center font-medium hover:text-green-600 py-2 ${pathname === '/' ? 'text-green-800' : 'text-gray-700'
                            }`}
                        onClick={closeMenu}
                    >
                        <Home className="h-4 w-4 mr-2" />
                        Home
                    </Link>
                    <Link
                        href="/apply"
                        className={`flex items-center font-medium hover:text-green-600 py-2 ${pathname === '/apply' ? 'text-green-800' : 'text-gray-700'
                            }`}
                        onClick={closeMenu}
                    >
                        <FileText className="h-4 w-4 mr-2" />
                        Apply
                    </Link>
                    <Link
                        href="/status"
                        className={`flex items-center font-medium hover:text-green-600 py-2 ${pathname === '/status' ? 'text-green-800' : 'text-gray-700'
                            }`}
                        onClick={closeMenu}
                    >
                        <ClipboardCheck className="h-4 w-4 mr-2" />
                        Application Status
                    </Link>
                    <Link
                        href="/contact"
                        className={`flex items-center font-medium hover:text-green-600 py-2 ${pathname === '/contact' ? 'text-green-800' : 'text-gray-700'
                            }`}
                        onClick={closeMenu}
                    >
                        <Phone className="h-4 w-4 mr-2" />
                        Contact Us
                    </Link>
                </div>
            </div>
        </div>
    );
}
