import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Calendar, Building2, Users, DollarSign } from "lucide-react";
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
  properties: Property[];
}

const DocumentReport = ({ properties, isOpen, onClose }: DocumentReportProps) => {
  const { toast } = useToast();
  const [selectedReport, setSelectedReport] = useState<MonthlyReport | null>(null);
  
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
      properties: properties
    }));
  };

  const [previousReports] = useState<MonthlyReport[]>(generatePreviousMonths());

  const handleViewReport = (report: MonthlyReport) => {
    setSelectedReport(report);
  };

  const handleDownloadReport = (report: MonthlyReport) => {
    const reportData = [
      {
        Month: `${report.month} ${report.year}`,
        "Total Revenue": `KSh ${report.totalRevenue.toLocaleString()}`,
        "Occupancy Rate": `${report.occupancyRate}%`,
        "Maintenance Requests": report.maintenanceRequests,
        "New Tenants": report.newTenants,
        "Properties": properties.length,
        "Total Rooms": properties.reduce((sum, prop) => sum + prop.totalRooms, 0),
      },
      ...properties.map(prop => ({
        Property: prop.name,
        Location: prop.location,
        "Total Rooms": prop.totalRooms,
        "Occupied Rooms": prop.occupiedRooms,
        "Vacant Rooms": prop.totalRooms - prop.occupiedRooms,
        "Occupancy Rate": `${((prop.occupiedRooms / prop.totalRooms) * 100).toFixed(1)}%`,
        "Rent Per Room": `KSh ${prop.rentPerRoom.toLocaleString()}`,
        "Monthly Revenue": `KSh ${(prop.occupiedRooms * prop.rentPerRoom).toLocaleString()}`,
      }))
    ];
    
    const csvHeaders = Object.keys(reportData[0]).join(",");
    const csvRows = reportData.map(row => Object.values(row).join(","));
    const csvContent = [csvHeaders, ...csvRows].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `property-report-${report.month.toLowerCase()}-${report.year}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Report Downloaded",
      description: `${report.month} ${report.year} report has been downloaded.`,
    });
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Property Management Reports
          </DialogTitle>
        </DialogHeader>

        <div className="flex h-[75vh]">
          {/* Report List */}
          <div className="w-1/3 border-r pr-4 overflow-y-auto">
            <h3 className="font-semibold mb-4">Available Reports</h3>
            <div className="space-y-2">
              {/* Current Month */}
              <Card 
                className={`cursor-pointer transition-colors ${!selectedReport ? "border-primary bg-primary/5" : ""}`}
                onClick={() => setSelectedReport(null)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      Current Month ({new Date().toLocaleString('default', { month: 'long' })})
                    </span>
                    <Badge variant="default">Live</Badge>
                  </div>
                </CardContent>
              </Card>
              
              {/* Previous Months */}
              {previousReports.map((report, index) => (
                <Card 
                  key={index}
                  className={`cursor-pointer transition-colors ${
                    selectedReport?.month === report.month && selectedReport?.year === report.year 
                      ? "border-primary bg-primary/5" : ""
                  }`}
                  onClick={() => handleViewReport(report)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{report.month} {report.year}</span>
                      <Badge variant="secondary">Archived</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Report Document View */}
          <div className="flex-1 pl-4 overflow-y-auto">
            {selectedReport ? (
              <div className="space-y-6 print:space-y-4">
                {/* Report Header */}
                <div className="border-b pb-4 print:border-black">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h1 className="text-2xl font-bold">Property Management Report</h1>
                      <p className="text-lg text-muted-foreground">{selectedReport.month} {selectedReport.year}</p>
                    </div>
                    <div className="flex gap-2 print:hidden">
                      <Button variant="outline" onClick={handlePrintReport}>
                        Print Report
                      </Button>
                      <Button onClick={() => handleDownloadReport(selectedReport)}>
                        <Download className="mr-2 h-4 w-4" />
                        Download CSV
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Generated on: {new Date().toLocaleDateString()}
                  </div>
                </div>

                {/* Summary Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <DollarSign className="h-8 w-8 mx-auto text-primary mb-2" />
                      <p className="text-2xl font-bold text-primary">
                        KSh {selectedReport.totalRevenue.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Users className="h-8 w-8 mx-auto text-accent mb-2" />
                      <p className="text-2xl font-bold text-accent">{selectedReport.occupancyRate}%</p>
                      <p className="text-sm text-muted-foreground">Occupancy Rate</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Building2 className="h-8 w-8 mx-auto text-primary mb-2" />
                      <p className="text-2xl font-bold">{selectedReport.maintenanceRequests}</p>
                      <p className="text-sm text-muted-foreground">Maintenance Requests</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Users className="h-8 w-8 mx-auto text-accent mb-2" />
                      <p className="text-2xl font-bold text-accent">{selectedReport.newTenants}</p>
                      <p className="text-sm text-muted-foreground">New Tenants</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Property Details Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Property Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-border">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2 border-r">Property</th>
                            <th className="text-left p-2 border-r">Location</th>
                            <th className="text-right p-2 border-r">Total Rooms</th>
                            <th className="text-right p-2 border-r">Occupied</th>
                            <th className="text-right p-2 border-r">Vacant</th>
                            <th className="text-right p-2 border-r">Occupancy %</th>
                            <th className="text-right p-2">Monthly Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedReport.properties.map((property) => (
                            <tr key={property.id} className="border-b">
                              <td className="p-2 border-r font-medium">{property.name}</td>
                              <td className="p-2 border-r text-sm text-muted-foreground">{property.location}</td>
                              <td className="p-2 border-r text-right">{property.totalRooms}</td>
                              <td className="p-2 border-r text-right">{property.occupiedRooms}</td>
                              <td className="p-2 border-r text-right">{property.totalRooms - property.occupiedRooms}</td>
                              <td className="p-2 border-r text-right">
                                {((property.occupiedRooms / property.totalRooms) * 100).toFixed(1)}%
                              </td>
                              <td className="p-2 text-right font-medium">
                                KSh {(property.occupiedRooms * property.rentPerRoom).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              // Current Month Report
              <div className="space-y-6 print:space-y-4">
                <div className="border-b pb-4 print:border-black">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h1 className="text-2xl font-bold">Property Management Report</h1>
                      <p className="text-lg text-muted-foreground">
                        {new Date().toLocaleString('default', { month: 'long' })} {new Date().getFullYear()}
                      </p>
                    </div>
                    <div className="flex gap-2 print:hidden">
                      <Button variant="outline" onClick={handlePrintReport}>
                        Print Report
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Generated on: {new Date().toLocaleDateString()}
                  </div>
                </div>

                {/* Current Month Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <DollarSign className="h-8 w-8 mx-auto text-primary mb-2" />
                      <p className="text-2xl font-bold text-primary">
                        KSh {properties.reduce((sum, prop) => sum + (prop.occupiedRooms * prop.rentPerRoom), 0).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Users className="h-8 w-8 mx-auto text-accent mb-2" />
                      <p className="text-2xl font-bold text-accent">
                        {((properties.reduce((sum, prop) => sum + prop.occupiedRooms, 0) / 
                           properties.reduce((sum, prop) => sum + prop.totalRooms, 0)) * 100).toFixed(1)}%
                      </p>
                      <p className="text-sm text-muted-foreground">Occupancy Rate</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Building2 className="h-8 w-8 mx-auto text-primary mb-2" />
                      <p className="text-2xl font-bold">{properties.length}</p>
                      <p className="text-sm text-muted-foreground">Total Properties</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Users className="h-8 w-8 mx-auto text-accent mb-2" />
                      <p className="text-2xl font-bold text-accent">
                        {properties.reduce((sum, prop) => sum + prop.occupiedRooms, 0)}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Tenants</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Current Month Property Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Current Property Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-border">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2 border-r">Property</th>
                            <th className="text-left p-2 border-r">Location</th>
                            <th className="text-right p-2 border-r">Total Rooms</th>
                            <th className="text-right p-2 border-r">Occupied</th>
                            <th className="text-right p-2 border-r">Vacant</th>
                            <th className="text-right p-2 border-r">Occupancy %</th>
                            <th className="text-right p-2">Monthly Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {properties.map((property) => (
                            <tr key={property.id} className="border-b">
                              <td className="p-2 border-r font-medium">{property.name}</td>
                              <td className="p-2 border-r text-sm text-muted-foreground">{property.location}</td>
                              <td className="p-2 border-r text-right">{property.totalRooms}</td>
                              <td className="p-2 border-r text-right">{property.occupiedRooms}</td>
                              <td className="p-2 border-r text-right">{property.totalRooms - property.occupiedRooms}</td>
                              <td className="p-2 border-r text-right">
                                {((property.occupiedRooms / property.totalRooms) * 100).toFixed(1)}%
                              </td>
                              <td className="p-2 text-right font-medium">
                                KSh {(property.occupiedRooms * property.rentPerRoom).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentReport;