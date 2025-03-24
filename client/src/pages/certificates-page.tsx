import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Interface for a certificate
interface Certificate {
  id: string;
  userId: number;
  courseId: string;
  courseName: string;
  issuedDate: string | Date;
  expiryDate: string | Date | null;
  credentialId: string;
  thumbnailUrl: string;
}

// Interface for certificate creation
interface CreateCertificateData {
  courseId: string;
  courseName: string;
  thumbnailUrl: string;
  expiryDate?: string | Date | null;
}

export default function CertificatesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const isMobile = useIsMobile();
  const { toast } = useToast();

  // Define the user profile interface to fix type issues
  interface UserProfile {
    id: number;
    userId: number;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    position: string | null;
    department: string | null;
    about: string | null;
    avatarUrl: string | null;
  }

  // Fetch user profile
  const { data: userProfile } = useQuery<UserProfile>({
    queryKey: ["/api/user/profile"],
  });

  // Fetch certificates from the API
  const { data: certificates, isLoading } = useQuery<Certificate[]>({
    queryKey: ["/api/user/certificates"],
  });
  
  // Create certificate mutation
  const createCertificateMutation = useMutation({
    mutationFn: async (data: CreateCertificateData) => {
      const res = await apiRequest("POST", "/api/certificates", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/certificates"] });
      toast({
        title: "Certificate created",
        description: "Your certificate has been successfully created.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create certificate",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter certificates based on search term
  const filteredCertificates = certificates?.filter(cert =>
    cert.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.credentialId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format date to a more readable format
  const formatDate = (dateStr: string | Date) => {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  // Add state for the certificate viewer modal
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Handle viewing a certificate
  const handleViewCertificate = (certificate: Certificate) => {
    setSelectedCertificate(certificate);
    setIsViewModalOpen(true);
    // In a full implementation, you might want to fetch the full certificate data here
  };

  // Handle downloading a certificate
  const handleDownloadCertificate = (certificate: Certificate) => {
    // In a real implementation, this would trigger the certificate PDF download
    alert(`Downloading certificate for ${certificate.courseName}...`);
    
    // Simulate download by creating a link to the certificate image
    // In production, this would be an actual PDF
    const link = document.createElement('a');
    link.href = certificate.thumbnailUrl;
    link.download = `${certificate.courseName} Certificate.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          <Button 
            variant="outline" 
            className="flex-1 text-sm"
            onClick={() => handleViewCertificate(certificate)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 text-sm"
            onClick={() => handleDownloadCertificate(certificate)}
          >
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
        
        {/* Certificate Viewer Modal */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="sm:max-w-3xl">
            {selectedCertificate && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl">Certificate of Completion</DialogTitle>
                  <DialogDescription>
                    Awarded for successfully completing the course.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="mt-4">
                  <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-gradient-to-r from-cyan-700 to-blue-500">
                    <img
                      src={selectedCertificate.thumbnailUrl}
                      alt={`${selectedCertificate.courseName} Certificate`}
                      className="h-full w-full object-cover opacity-30"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8">
                      <div className="text-center">
                        <h2 className="text-3xl font-bold mb-2">{selectedCertificate.courseName}</h2>
                        <p className="text-lg mb-6">Certificate of Completion</p>
                        
                        <div className="w-32 h-1 bg-white/30 mx-auto mb-6"></div>
                        
                        <p className="text-base mb-1">This certifies that</p>
                        <p className="text-lg font-semibold mb-4">
                          {userProfile?.firstName && userProfile?.lastName 
                            ? `${userProfile.firstName} ${userProfile.lastName}` 
                            : "Certificate Recipient"}
                        </p>
                        
                        <p className="text-base mb-2">has successfully completed the course</p>
                        
                        <div className="w-24 h-0.5 bg-white/30 mx-auto my-6"></div>
                        
                        <div className="grid grid-cols-2 gap-12 mt-8">
                          <div className="text-center">
                            <p className="text-sm mb-1">Issue Date</p>
                            <p className="text-base">{formatDate(selectedCertificate.issuedDate)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm mb-1">Credential ID</p>
                            <p className="text-base">{selectedCertificate.credentialId}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div>
                      <h3 className="text-sm font-medium text-slate-500">Certificate Details</h3>
                      <div className="mt-3 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-500">Course:</span>
                          <span className="text-sm font-medium">{selectedCertificate.courseName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-500">Issued On:</span>
                          <span className="text-sm font-medium">{formatDate(selectedCertificate.issuedDate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-500">Valid Until:</span>
                          <span className="text-sm font-medium">
                            {selectedCertificate.expiryDate 
                              ? formatDate(selectedCertificate.expiryDate)
                              : "No Expiration"
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-500">Credential ID:</span>
                          <span className="text-sm font-medium">{selectedCertificate.credentialId}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-slate-500">Verification</h3>
                      <p className="mt-2 text-sm text-slate-500">
                        This certificate can be verified online using the credential ID.
                      </p>
                      <div className="mt-4">
                        <Button 
                          onClick={() => handleDownloadCertificate(selectedCertificate)}
                          className="w-full"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download Certificate
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}