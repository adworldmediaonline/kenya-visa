import { FileText, ClipboardCheck, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const visaSteps = [
    {
        step: 1,
        title: "Apply Online",
        description: "Complete the secure online application form with your personal information and travel details",
        icon: <FileText className="h-8 w-8 text-amber-600" />
    },
    {
        step: 2,
        title: "Submit Documents",
        description: "Upload required documents including passport copy, photo, and travel itinerary",
        icon: <ClipboardCheck className="h-8 w-8 text-amber-600" />
    },
    {
        step: 3,
        title: "Pay Visa Fee",
        description: "Submit payment using secure online payment options",
        icon: <Globe className="h-8 w-8 text-amber-600" />
    },
    {
        step: 4,
        title: "Receive E-Visa",
        description: "Receive your approved e-Visa via email within 3 business days",
        icon: <FileText className="h-8 w-8 text-amber-600" />
    }
];

export default function VisaProcess() {
    return (
        <section className="py-16">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Visa Application Process</h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Complete your Ethiopia e-Visa application in 4 simple steps
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {visaSteps.map((step, index) => (
                        <div key={index} className="bg-white p-6 rounded-lg shadow-md border border-gray-100 text-center">
                            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-amber-100 mb-4">
                                {step.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-gray-900">Step {step.step}: {step.title}</h3>
                            <p className="text-gray-600">{step.description}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-12 text-center">
                    <Link href="/apply">
                        <Button className="bg-green-700 hover:bg-green-800 text-white px-8 py-3 rounded-md font-medium cursor-pointer">
                            Start Your Application
                        </Button></Link>
                </div>
            </div>
        </section>
    );
}