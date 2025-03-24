import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import DashboardLayout from "@/components/layout/dashboard-layout";

// Interface for a certificate
interface Certificate {
  id: string;
  courseId: string;
  courseName: string;
  issuedDate: string;
  expiryDate: string | null;
  credentialId: string;
  thumbnailUrl: string;
}

export default function CertificatesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const isMobile = useIsMobile();

  // This would fetch certificates in a real implementation
  const { data: certificates, isLoading } = useQuery<Certificate[]>({
    queryKey: ["/api/user/certificates"],
    // Using placeholder data since API endpoint doesn't exist yet
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return [
        {
          id: "cert-1",
          courseId: "course-1",
          courseName: "ISO 9001 Quality Management Systems",
          issuedDate: "2023-11-12",
          expiryDate: "2026-11-12",
          credentialId: "ISO-9001-QMS-2023-001",
          thumbnailUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
        },
        {
          id: "cert-2",
          courseId: "course-2",
          courseName: "Statistical Process Control (SPC)",
          issuedDate: "2023-12-15",
          expiryDate: null,
          credentialId: "SPC-ADV-2023-042",
          thumbnailUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
        }
      ];
    },
  });

  // Filter certificates based on search term
  const filteredCertificates = certificates?.filter(cert =>
    cert.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.credentialId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format date to a more readable format
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const renderCertificateCard = (certificate: Certificate) => (
    <Card
      key={certificate.id}
      className="overflow-hidden transition-all duration-200 hover:shadow-md"
    >
      <div className="relative h-48 bg-gradient-to-r from-cyan-700 to-blue-500">
        {certificate.thumbnailUrl && (
          <img
            src={certificate.thumbnailUrl}
            alt={certificate.courseName}
            className="h-full w-full object-cover opacity-30"
          />
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6">
          <div className="text-center">
            <h3 className="text-xl font-bold mb-1">{certificate.courseName}</h3>
            <p className="text-sm opacity-90">Certificate of Completion</p>
            <div className="my-3 border-t border-white/30 w-16 mx-auto"></div>
            <p className="text-xs opacity-80">Credential ID: {certificate.credentialId}</p>
          </div>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-slate-500">Issued On</p>
            <p className="text-sm font-medium">{formatDate(certificate.issuedDate)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Valid Until</p>
            <p className="text-sm font-medium">
              {certificate.expiryDate ? formatDate(certificate.expiryDate) : "No Expiration"}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" className="flex-1 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View
          </Button>
          <Button variant="outline" className="flex-1 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 px-4 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">My Certificates</h1>
          <p className="text-slate-500 mt-1">
            View and download your earned certificates
          </p>
        </div>

        <div className="mb-6">
          <Input
            type="text"
            placeholder="Search certificates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <Skeleton className="h-48" />
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <Skeleton className="h-10" />
                    <Skeleton className="h-10" />
                  </div>
                  <Skeleton className="h-10" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCertificates && filteredCertificates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCertificates.map(renderCertificateCard)}
          </div>
        ) : (
          <div className="text-center p-12">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mx-auto text-slate-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium">No certificates found</h3>
            <p className="mt-1 text-slate-500">
              {searchTerm 
                ? `No certificates matching "${searchTerm}"`
                : "Complete courses to earn certificates."
              }
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}