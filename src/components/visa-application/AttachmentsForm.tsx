'use client';

import { useState } from 'react';
import { Loader2, Upload, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFormContext } from '@/providers/FormProvider';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AttachmentsForm() {
  const { updateFormData, markStepCompleted, setCurrentStep } =
    useFormContext();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock function for handling file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // This would typically handle file upload to a server
    console.log('Files selected:', e.target.files);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update form context
      updateFormData('attachments', { filesUploaded: true });
      markStepCompleted('attachments');
      setCurrentStep('review');
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Required Documents</h2>
        <p className="text-muted-foreground">
          Please upload the following documents to complete your application
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Passport Scan Card */}
        <Card>
          <CardHeader>
            <CardTitle>Passport Scan</CardTitle>
            <CardDescription>
              Upload a clear scan of your passport photo page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center p-6 border-2 border-dashed rounded-md">
              <div className="space-y-2 text-center">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <div className="text-sm">
                  <label
                    htmlFor="passport-file"
                    className="relative cursor-pointer rounded-md font-medium text-primary"
                  >
                    <span>Upload a file</span>
                    <input
                      id="passport-file"
                      name="passport-file"
                      type="file"
                      className="sr-only"
                      onChange={handleFileUpload}
                    />
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG or PDF up to 5MB
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Photo Card */}
        <Card>
          <CardHeader>
            <CardTitle>Passport-size Photo</CardTitle>
            <CardDescription>
              Upload a recent passport-size photo with white background
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center p-6 border-2 border-dashed rounded-md">
              <div className="space-y-2 text-center">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <div className="text-sm">
                  <label
                    htmlFor="photo-file"
                    className="relative cursor-pointer rounded-md font-medium text-primary"
                  >
                    <span>Upload a file</span>
                    <input
                      id="photo-file"
                      name="photo-file"
                      type="file"
                      className="sr-only"
                      onChange={handleFileUpload}
                    />
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG or JPG up to 2MB
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Alert className="bg-amber-50 border-amber-200">
          <CheckCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            For demonstration purposes, you can proceed without actual file
            uploads.
          </AlertDescription>
        </Alert>

        <div className="flex justify-between pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => setCurrentStep('additional-applicants')}
          >
            Previous
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Continue to Review'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
