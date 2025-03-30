export default function AboutEthiopia() {
    return (
        <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">About Ethiopia</h2>
                        <p className="text-gray-600 mb-4">
                            Ethiopia, officially the Federal Democratic Republic of Ethiopia, is a landlocked country in the Horn of Africa.
                            With a rich history dating back to ancient times, Ethiopia is known as the only African country that was never colonized.
                        </p>
                        <p className="text-gray-600 mb-4">
                            Home to diverse landscapes from the Simien Mountains to the Danakil Depression, Ethiopia offers visitors a unique experience
                            with its distinct culture, ancient historical sites, and breathtaking natural beauty.
                        </p>
                        <p className="text-gray-600">
                            Ethiopia is also known for its distinctive cuisine, coffee ceremony, and vibrant festivals. The country hosts nine UNESCO
                            World Heritage sites, including the rock-hewn churches of Lalibela and the ancient obelisks of Axum.
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-bold mb-4 text-gray-900">Quick Facts</h3>
                        <ul className="space-y-3">
                            <li className="flex items-start">
                                <span className="h-5 w-5 rounded-full bg-green-600 flex items-center justify-center mr-2 mt-1">
                                    <span className="text-white text-xs">✓</span>
                                </span>
                                <span><strong>Capital:</strong> Addis Ababa</span>
                            </li>
                            <li className="flex items-start">
                                <span className="h-5 w-5 rounded-full bg-green-600 flex items-center justify-center mr-2 mt-1">
                                    <span className="text-white text-xs">✓</span>
                                </span>
                                <span><strong>Official Language:</strong> Amharic</span>
                            </li>
                            <li className="flex items-start">
                                <span className="h-5 w-5 rounded-full bg-green-600 flex items-center justify-center mr-2 mt-1">
                                    <span className="text-white text-xs">✓</span>
                                </span>
                                <span><strong>Currency:</strong> Ethiopian Birr (ETB)</span>
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
                                <span><strong>Best Time to Visit:</strong> October to June (dry season)</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}