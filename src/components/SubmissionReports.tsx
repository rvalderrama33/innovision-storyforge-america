import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Download, FileSpreadsheet, Users } from "lucide-react";
import * as XLSX from 'xlsx';

interface Submission {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  phone_number?: string;
  city?: string;
  state?: string;
  product_name?: string;
  category?: string;
  description?: string;
  problem_solved?: string;
  stage?: string;
  idea_origin?: string;
  biggest_challenge?: string;
  proudest_moment?: string;
  inspiration?: string;
  motivation?: string;
  background?: string;
  website?: string;
  social_media?: string;
  recommendations?: any;
  selected_vendors?: string[];
  status?: string;
  featured?: boolean;
  pinned?: boolean;
}

const SubmissionReports = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [reportData, setReportData] = useState<any[]>([]);
  const [showReport, setShowReport] = useState(false);
  const { toast } = useToast();

  const availableFields = [
    { key: 'full_name', label: 'Full Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone_number', label: 'Phone Number' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'product_name', label: 'Product Name' },
    { key: 'category', label: 'Category' },
    { key: 'description', label: 'Description' },
    { key: 'problem_solved', label: 'Problem Solved' },
    { key: 'stage', label: 'Stage' },
    { key: 'idea_origin', label: 'Idea Origin' },
    { key: 'biggest_challenge', label: 'Biggest Challenge' },
    { key: 'proudest_moment', label: 'Proudest Moment' },
    { key: 'inspiration', label: 'Inspiration' },
    { key: 'motivation', label: 'Motivation' },
    { key: 'background', label: 'Background' },
    { key: 'website', label: 'Website' },
    { key: 'social_media', label: 'Social Media' },
    { key: 'recommendations_count', label: 'Number of Recommendations' },
    { key: 'selected_vendors_count', label: 'Number of Selected Vendors' },
    { key: 'status', label: 'Status' },
    { key: 'created_at', label: 'Submission Date' },
  ];

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .neq('status', 'draft')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch submissions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleField = (fieldKey: string) => {
    setSelectedFields(prev => 
      prev.includes(fieldKey) 
        ? prev.filter(f => f !== fieldKey)
        : [...prev, fieldKey]
    );
  };

  const selectAllFields = () => {
    setSelectedFields(availableFields.map(f => f.key));
  };

  const clearAllFields = () => {
    setSelectedFields([]);
  };

  const generateReport = () => {
    if (selectedFields.length === 0) {
      toast({
        title: "No fields selected",
        description: "Please select at least one field for the report",
        variant: "destructive",
      });
      return;
    }

    const data = submissions.map(submission => {
      const row: any = {};
      
      selectedFields.forEach(field => {
        switch (field) {
          case 'recommendations_count':
            row[field] = Array.isArray(submission.recommendations) ? submission.recommendations.length : 0;
            break;
          case 'selected_vendors_count':
            row[field] = submission.selected_vendors?.length || 0;
            break;
          case 'created_at':
            row[field] = new Date(submission.created_at).toLocaleDateString();
            break;
          default:
            row[field] = submission[field as keyof Submission] || '';
        }
      });
      
      return row;
    });

    setReportData(data);
    setShowReport(true);
  };

  const downloadExcel = () => {
    if (reportData.length === 0) return;

    // Create headers based on selected fields
    const headers = selectedFields.map(field => 
      availableFields.find(f => f.key === field)?.label || field
    );

    // Create worksheet data with headers
    const worksheetData = [
      headers,
      ...reportData.map(row => selectedFields.map(field => row[field] || ''))
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Submissions Report");

    // Generate filename with current date
    const date = new Date().toISOString().split('T')[0];
    const filename = `submissions-report-${date}.xlsx`;

    XLSX.writeFile(workbook, filename);

    toast({
      title: "Report downloaded",
      description: `Report saved as ${filename}`,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Submission Reports
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Generate custom reports from completed submissions. Select the fields you want to include and download as Excel.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Submissions Overview
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{submissions.length}</div>
                <div className="text-sm text-blue-700">Total Submissions</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {submissions.filter(s => s.status === 'approved').length}
                </div>
                <div className="text-sm text-green-700">Approved</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {submissions.filter(s => s.status === 'pending').length}
                </div>
                <div className="text-sm text-yellow-700">Pending</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {submissions.filter(s => s.featured).length}
                </div>
                <div className="text-sm text-purple-700">Featured</div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Select Report Fields</h3>
              <div className="space-x-2">
                <Button variant="outline" size="sm" onClick={selectAllFields}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={clearAllFields}>
                  Clear All
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableFields.map((field) => (
                <div key={field.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={field.key}
                    checked={selectedFields.includes(field.key)}
                    onCheckedChange={() => toggleField(field.key)}
                  />
                  <label htmlFor={field.key} className="text-sm cursor-pointer">
                    {field.label}
                  </label>
                </div>
              ))}
            </div>

            {selectedFields.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Selected fields:</strong> {selectedFields.length} / {availableFields.length}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-center">
            <Button 
              onClick={generateReport}
              disabled={selectedFields.length === 0}
              className="flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {showReport && reportData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Generated Report</CardTitle>
              <Button onClick={downloadExcel} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download Excel
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Showing {reportData.length} submissions with {selectedFields.length} selected fields
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    {selectedFields.map(field => (
                      <th key={field} className="border border-gray-300 px-4 py-2 text-left text-sm font-medium">
                        {availableFields.find(f => f.key === field)?.label || field}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportData.slice(0, 10).map((row, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {selectedFields.map(field => (
                        <td key={field} className="border border-gray-300 px-4 py-2 text-sm">
                          {typeof row[field] === 'string' && row[field].length > 50 
                            ? `${row[field].substring(0, 50)}...`
                            : row[field]
                          }
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {reportData.length > 10 && (
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Showing first 10 rows. Download Excel file for complete data.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SubmissionReports;