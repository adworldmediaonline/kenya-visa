import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const destinations = [
    {
        name: "Lalibela",
        description: "Famous for its rock-cut churches",
        image: "https://placehold.co/400x400/png"
    },
    {
        name: "Simien Mountains",
        description: "UNESCO World Heritage site with breathtaking landscapes",
        image: "https://placehold.co/400x400/png"
    },
    {
        name: "Danakil Depression",
        description: "One of the hottest places on Earth with unique geological features",
        image: "https://placehold.co/400x400/png"
    },
    {
        name: "Gondar",
        description: "Known for its medieval castles and palaces",
        image: "https://placehold.co/400x400/png"
    }
];

export default function MustVisitDestinations() {
    return (
        <section className="py-16">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Must Visit Destinations</h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Explore these incredible destinations when you visit Ethiopia
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {destinations.map((destination, index) => (
                        <Card key={index} className="overflow-hidden">
                            <div className="h-48 relative">
                                <Image
                                    src={destination.image}
                                    alt={destination.name}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <CardHeader className="pb-2">
                                <CardTitle>{destination.name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription>{destination.description}</CardDescription>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}