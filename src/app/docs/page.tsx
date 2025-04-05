'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Search, AlertCircle } from 'lucide-react';

import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardFooter,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function DocumentsPage() {
    const router = useRouter();
    const [applicationId, setApplicationId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!applicationId.trim()) {
            setError('Please enter an application ID');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        // Redirect to the docs page with the form ID
        router.push(`/docs/${applicationId}`);
    };

    return (
        <MainLayout>
            <div className="container mx-auto py-10">
                <div className="max-w-3xl mx-auto">
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <h2 className="text-2xl font-semibold">Check Application Documents</h2>
                            <p className="text-muted-foreground">
                                Enter your application ID to view and download your visa application documents
                            </p>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Application Documents</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <label htmlFor="applicationId" className="text-sm font-medium">
                                            Application ID
                                        </label>
                                        <Input
                                            id="applicationId"
                                            placeholder="Enter your application ID"
                                            value={applicationId}
                                            onChange={(e) => setApplicationId(e.target.value)}
                                        />
                                    </div>

                                    {error && (
                                        <Alert variant="destructive">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertTitle>Error</AlertTitle>
                                            <AlertDescription>{error}</AlertDescription>
                                        </Alert>
                                    )}
                                </form>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    className="w-full"
                                    size="lg"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Loading...
                                        </>
                                    ) : (
                                        <>
                                            <Search className="mr-2 h-4 w-4" />
                                            View Documents
                                        </>
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
