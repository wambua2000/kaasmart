import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, Download, Calendar, Building2, Users, DollarSign, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Property {
  id: string;
  name: string;
  location: string;
  rentPerRoom: number;
  totalRooms: number;
  occupiedRooms: number;
  image: string;
}

interface DocumentReportProps {
  properties: Property[];
  isOpen: boolean;
  onClose: () => void;
}

interface MonthlyReport {
  month: string;
  year: number;
  totalRevenue: number;
  occupancyRate: number;
  maintenanceRequests: number;
  newTenants: number;
}

const DocumentReport = ({ properties, isOpen, onClose }: DocumentReportProps) => {
  const { toast } = useToast();
  
  // Generate mock previous months data
  const generatePreviousMonths = (): MonthlyReport[] => {
    const months = ["December", "November", "October", "September", "August", "July"];
    const currentYear = new Date().getFullYear();
    
    return months.map((month, index) => ({
      month,
      year: index === 0 ? currentYear - 1 : currentYear,
      totalRevenue: Math.floor(Math.random() * 500000) + 800000,
      occupancyRate: Math.floor(Math.random() * 20) + 75,
      maintenanceRequests: Math.floor(Math.random() * 15) + 5,
      newTenants: Math.floor(Math.random() * 8) + 2,
    }));
  };

  const [previousReports] = useState<MonthlyReport[]>(generatePreviousMonths());
  const [selectedReport, setSelectedReport] = useState<MonthlyReport | null>(null);

  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const currentYear = new Date().getFullYear();

  const currentReport = {
    month: currentMonth,
    year: currentYear,
    totalRevenue: properties.reduce((sum, prop) => sum + (prop.occupiedRooms * prop.rentPerRoom), 0),
    occupancyRate: Math.round((properties.reduce((sum, prop) => sum + prop.occupiedRooms, 0) / 
                   properties.reduce((sum, prop) => sum + prop.totalRooms, 0)) * 100),
    maintenanceRequests: 8,
    newTenants: 5,
  };

  const handleDownloadPDF = (report: MonthlyReport) => {
    // Create a formatted document structure
    const documentContent = `
PROPERTY MANAGEMENT REPORT
${report.month} ${report.year}

EXECUTIVE SUMMARY
================
Total Revenue: KSh ${report.totalRevenue.toLocaleString()}
Occupancy Rate: ${report.occupancyRate}%
Maintenance Requests: ${report.maintenanceRequests}
New Tenants: ${report.newTenants}
Total Properties: ${properties.length}

PROPERTY BREAKDOWN
==================
${properties.map(prop => `
Property: ${prop.name}
Location: ${prop.location}
Total Rooms: ${prop.totalRooms}
Occupied Rooms: ${prop.occupiedRooms}
Vacancy Rate: ${Math.round(((prop.totalRooms - prop.occupiedRooms) / prop.totalRooms) * 100)}%
Monthly Revenue: KSh ${(prop.occupiedRooms * prop.rentPerRoom).toLocaleString()}
Rent per Room: KSh ${prop.rentPerRoom.toLocaleString()}
`).join('\n')}

FINANCIAL ANALYSIS
==================
Average Rent: KSh ${Math.round(properties.reduce((sum, prop) => sum + prop.rentPerRoom, 0) / properties.length).toLocaleString()}
Total Rooms: ${properties.reduce((sum, prop) => sum + prop.totalRooms, 0)}
Occupied Rooms: ${properties.reduce((sum, prop) => sum + prop.occupiedRooms, 0)}
Vacant Rooms: ${properties.reduce((sum, prop) => sum + prop.totalRooms - prop.occupiedRooms, 0)}

Generated on: ${new Date().toLocaleDateString()}
    `.trim();
    
    const blob = new Blob([documentContent], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `property-report-${report.month.toLowerCase()}-${report.year}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Document Downloaded",
      description: `${report.month} ${report.year} document report has been downloaded.`,
    });
  };

  const reportToDisplay = selectedReport || currentReport;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Property Management Reports - Document View
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-6 h-[80vh]">
          {/* Report Selection Sidebar */}
          <div className="w-1/3 border-r pr-6 overflow-y-auto">
            <h3 className="font-semibold mb-4">Available Reports</h3>
            <div className="space-y-2">
              {/* Current Month */}
              <Card 
                className={`cursor-pointer transition-colors ${
                  !selectedReport ? "border-primary bg-primary/5" : ""
                }`}
                onClick={() => setSelectedReport(null)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{currentMonth} {currentYear}</p>
                      <p className="text-sm text-muted-foreground">Current Month</p>
                    </div>
                    <Badge variant="default">Live</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Previous Months */}
              {previousReports.map((report, index) => (
                <Card 
                  key={index}
                  className={`cursor-pointer transition-colors ${
                    selectedReport?.month === report.month && selectedReport?.year === report.year ? "border-primary bg-primary/5" : ""
                  }`}
                  onClick={() => setSelectedReport(report)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{report.month} {report.year}</p>
                        <p className="text-sm text-muted-foreground">
                          KSh {report.totalRevenue.toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="secondary">{report.occupancyRate}%</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Document View */}
          <div className="flex-1 overflow-y-auto">
            <div className="bg-white p-8 shadow-lg rounded-lg min-h-full">
              {/* Document Header */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  PROPERTY MANAGEMENT REPORT
                </h1>
                <p className="text-xl text-gray-600">
                  {reportToDisplay.month} {reportToDisplay.year}
                </p>
                <Separator className="my-4" />
              </div>

              {/* Executive Summary */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  EXECUTIVE SUMMARY
                </h2>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Revenue:</span>
                      <span className="font-semibold">KSh {reportToDisplay.totalRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Occupancy Rate:</span>
                      <span className="font-semibold">{reportToDisplay.occupancyRate}%</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Maintenance Requests:</span>
                      <span className="font-semibold">{reportToDisplay.maintenanceRequests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">New Tenants:</span>
                      <span className="font-semibold">{reportToDisplay.newTenants}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Property Breakdown */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  PROPERTY BREAKDOWN
                </h2>
                <div className="space-y-4">
                  {properties.map((property, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h3 className="font-semibold text-lg mb-2">{property.name}</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p><span className="text-gray-600">Location:</span> {property.location}</p>
                          <p><span className="text-gray-600">Total Rooms:</span> {property.totalRooms}</p>
                          <p><span className="text-gray-600">Occupied Rooms:</span> {property.occupiedRooms}</p>
                        </div>
                        <div>
                          <p><span className="text-gray-600">Rent per Room:</span> KSh {property.rentPerRoom.toLocaleString()}</p>
                          <p><span className="text-gray-600">Monthly Revenue:</span> KSh {(property.occupiedRooms * property.rentPerRoom).toLocaleString()}</p>
                          <p><span className="text-gray-600">Occupancy Rate:</span> {Math.round((property.occupiedRooms / property.totalRooms) * 100)}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="my-6" />

              {/* Financial Summary */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  FINANCIAL ANALYSIS
                </h2>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average Rent:</span>
                      <span className="font-semibold">
                        KSh {Math.round(properties.reduce((sum, prop) => sum + prop.rentPerRoom, 0) / properties.length).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Properties:</span>
                      <span className="font-semibold">{properties.length}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Rooms:</span>
                      <span className="font-semibold">{properties.reduce((sum, prop) => sum + prop.totalRooms, 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vacant Rooms:</span>
                      <span className="font-semibold">{properties.reduce((sum, prop) => sum + prop.totalRooms - prop.occupiedRooms, 0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Footer */}
              <div className="border-t pt-4 text-center text-sm text-gray-500">
                <p>Generated on {new Date().toLocaleDateString()} | KaaSmart Property Management System</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => handleDownloadPDF(reportToDisplay)}>
            <Download className="mr-2 h-4 w-4" />
            Download Document
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentReport;