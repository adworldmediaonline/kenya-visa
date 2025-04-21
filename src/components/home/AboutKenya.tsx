export default function AboutKenya() {
    return (
        <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">About Kenya</h2>
                        <p className="text-gray-600 mb-4">
                            Kenya, officially the Republic of Kenya, is a country in Eastern Africa.
                            With a diverse landscape that includes savannahs, lakes, the dramatic Great Rift Valley,
                            and mountain highlands, Kenya is known for its remarkable wildlife and safari experiences.
                        </p>
                        <p className="text-gray-600 mb-4">
                            From the iconic Maasai Mara National Reserve to the pristine beaches along the Indian Ocean,
                            Kenya offers visitors an unforgettable experience with its rich cultural heritage,
                            diverse ecosystems, and warm hospitality.
                        </p>
                        <p className="text-gray-600">
                            Kenya is home to numerous national parks and reserves, making it one of the world's premier
                            safari destinations. The country also boasts a vibrant culture with over 40 ethnic groups,
                            each with their own unique traditions and customs.
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-bold mb-4 text-gray-900">Quick Facts</h3>
                        <ul className="space-y-3">
                            <li className="flex items-start">
                                <span className="h-5 w-5 rounded-full bg-green-600 flex items-center justify-center mr-2 mt-1">
                                    <span className="text-white text-xs">✓</span>
                                </span>
                                <span><strong>Capital:</strong> Nairobi</span>
                            </li>
                            <li className="flex items-start">
                                <span className="h-5 w-5 rounded-full bg-green-600 flex items-center justify-center mr-2 mt-1">
                                    <span className="text-white text-xs">✓</span>
                                </span>
                                <span><strong>Official Languages:</strong> Swahili and English</span>
                            </li>
                            <li className="flex items-start">
                                <span className="h-5 w-5 rounded-full bg-green-600 flex items-center justify-center mr-2 mt-1">
                                    <span className="text-white text-xs">✓</span>
                                </span>
                                <span><strong>Currency:</strong> Kenyan Shilling (KES)</span>
                            </li>
                            <li className="flex items-start">
                                <span className="h-5 w-5 rounded-full bg-green-600 flex items-center justify-center mr-2 mt-1">
                                    <span className="text-white text-xs">✓</span>
                                </span>
                                <span><strong>Time Zone:</strong> East Africa Time (GMT+3)</span>
                            </li>
                            <li className="flex items-start">
                                <span className="h-5 w-5 rounded-full bg-green-600 flex items-center justify-center mr-2 mt-1">
                                    <span className="text-white text-xs">✓</span>
                                </span>
                                <span><strong>Best Time to Visit:</strong> June to October and January to February (dry seasons)</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}