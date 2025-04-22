const countries = [
    "United States", "United Kingdom", "Canada", "Australia",
    "Germany", "France", "Spain", "Italy", "Japan",
    "South Korea", "China", "India", "Brazil", "Mexico"
];

export default function EligibleCountries() {
    return (
        <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Eligible Countries</h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Citizens from the following countries can apply for an Kenya eTA online
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    {countries.map((country, index) => (
                        <div key={index} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 text-center">
                            <span className="text-sm font-medium">{country}</span>
                        </div>
                    ))}
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 text-center">
                        <span className="text-sm font-medium text-amber-600">+100 more</span>
                    </div>
                </div>
            </div>
        </section>
    );
}