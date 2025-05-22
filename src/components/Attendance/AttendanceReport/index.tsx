
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabaseService, Student } from "@/services/SupabaseService";
import { getFormattedDate } from "@/utils/dateUtils";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Download, FileText, BarChart2 } from "lucide-react";
import { AttendanceTable } from '@/components/Attendance/AttendanceReport/AttendanceTable';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type SortDirection = 'asc' | 'desc';
type SortField = 'trNo' | 'name' | 'division' | 'subject' | 'presentDays' | 'totalDays';
type ViewMode = 'present' | 'absent' | 'summary';

interface ExtendedStudent extends Student {
  presentDays?: number;
  totalDays?: number;
  absentDays?: number;
  attendancePercentage?: number;
}

export function AttendanceReport() {
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>('present');
  const [students, setStudents] = useState<ExtendedStudent[]>([]);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [loading, setLoading] = useState({
    dates: false,
    students: false,
    export: false,
    exportAll: false
  });
  
  // Load available dates on component mount
  useEffect(() => {
    loadAvailableDates();
  }, []);
  
  // Load student data when date and view mode change
  useEffect(() => {
    if (selectedDate && viewMode !== 'summary') {
      loadStudentData();
    } else if (viewMode === 'summary') {
      loadAttendanceSummary();
    }
  }, [selectedDate, viewMode]);
  
  const loadAvailableDates = async () => {
    try {
      setLoading(prev => ({ ...prev, dates: true }));
      
      // Get all unique dates for which attendance was recorded for any class
      const dates = await supabaseService.getAllAttendanceDates();
      setAvailableDates(dates);
      
      // Select the most recent date by default if available
      if (dates.length > 0) {
        setSelectedDate(dates[0]);
      } else {
        setSelectedDate("");
      }
    } catch (error) {
      console.error("Error loading available dates:", error);
      toast.error("Failed to load attendance dates");
    } finally {
      setLoading(prev => ({ ...prev, dates: false }));
    }
  };
  
  const loadStudentData = async () => {
    try {
      setLoading(prev => ({ ...prev, students: true }));
      
      // Get all students
      const allStudents = await supabaseService.getStudents();
      
      // Get attendance records for the selected date (across all classes)
      const records = await supabaseService.getAttendanceByDate(selectedDate);
      
      let filteredStudents: ExtendedStudent[] = [];
      
      if (viewMode === 'present') {
        // Filter for present students across all classes
        filteredStudents = allStudents.filter(student => 
          records.some(record => record.studentId === student.id && record.status === 'present')
        );
      } else {
        // Filter for absent students across all classes
        filteredStudents = allStudents.filter(student => 
          records.every(record => record.studentId !== student.id || record.status !== 'present')
        );
      }
      
      setStudents(filteredStudents);
    } catch (error) {
      console.error("Error loading student data:", error);
      toast.error("Failed to load student data");
    } finally {
      setLoading(prev => ({ ...prev, students: false }));
    }
  };
  
  const loadAttendanceSummary = async () => {
    try {
      setLoading(prev => ({ ...prev, students: true }));
      
      // Get all students
      const allStudents = await supabaseService.getStudents();
      
      // Get all attendance records
      const allRecords = await supabaseService.getAttendanceRecords();
      
      // Get unique dates for total day count
      const uniqueDates = [...new Set(allRecords.map(record => record.date))];
      const totalDays = uniqueDates.length;
      
      // Calculate attendance statistics for each student
      const extendedStudents: ExtendedStudent[] = allStudents.map(student => {
        // Get all records for this student
        const studentRecords = allRecords.filter(record => record.studentId === student.id);
        
        // Count present days
        const presentDays = studentRecords.filter(record => record.status === 'present').length;
        
        // Calculate absent days
        const absentDays = totalDays - presentDays;
        
        // Calculate attendance percentage
        const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
        
        return {
          ...student,
          presentDays,
          absentDays,
          totalDays,
          attendancePercentage
        };
      });
      
      setStudents(extendedStudents);
    } catch (error) {
      console.error("Error loading attendance summary:", error);
      toast.error("Failed to load attendance summary");
    } finally {
      setLoading(prev => ({ ...prev, students: false }));
    }
  };
  
  const handleDateChange = (value: string) => {
    setSelectedDate(value);
  };
  
  const handleViewModeChange = (value: ViewMode) => {
    setViewMode(value);
  };
  
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  const getSortedStudents = (): ExtendedStudent[] => {
    return [...students].sort((a, b) => {
      const aValue = a[sortField as keyof ExtendedStudent];
      const bValue = b[sortField as keyof ExtendedStudent];
      
      // Handle numeric fields differently
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      // Handle string fields
      const comparison = typeof aValue === 'string' && typeof bValue === 'string'
        ? aValue.localeCompare(bValue)
        : String(aValue || '').localeCompare(String(bValue || ''));
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };
  
  const handleExport = async () => {
    try {
      setLoading(prev => ({ ...prev, export: true }));
      
      if (viewMode === 'summary') {
        // Create CSV content for summary
        let csvContent = "Tr. No.,Name,Division,Subject,Present Days,Absent Days,Total Days,Attendance %\n";
        
        getSortedStudents().forEach(student => {
          const row = [
            student.trNo,
            student.name,
            student.division || "",
            student.subject || "",
            student.presentDays || 0,
            student.absentDays || 0,
            student.totalDays || 0,
            student.attendancePercentage ? student.attendancePercentage.toFixed(1) + '%' : "0%"
          ].map(value => `"${value}"`).join(",");
          
          csvContent += row + "\n";
        });
        
        // Create download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `attendance_summary.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (selectedDate) {
        // Create CSV content for daily report
        let csvContent = "Tr. No.,Name,Division,Subject,Status\n";
        
        getSortedStudents().forEach(student => {
          const row = [
            student.trNo,
            student.name,
            student.division || "",
            student.subject || "",
            viewMode
          ].map(value => `"${value}"`).join(",");
          
          csvContent += row + "\n";
        });
        
        // Create download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        const formattedDate = selectedDate.replace(/-/g, '');
        
        link.setAttribute('href', url);
        link.setAttribute('download', `attendance_${formattedDate}_${viewMode}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        toast.error("No data available to export");
        return;
      }
      
      toast.success('Report exported successfully');
    } catch (error) {
      console.error("Error exporting report:", error);
      toast.error("Failed to export report");
    } finally {
      setLoading(prev => ({ ...prev, export: false }));
    }
  };
  
  const handleExportAll = async () => {
    try {
      setLoading(prev => ({ ...prev, exportAll: true }));
      
      if (availableDates.length === 0) {
        toast.error("No attendance data available");
        return;
      }
      
      const csv = await supabaseService.exportAttendanceToCSV('', '');
      
      // Create download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `all_attendance_data.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('All attendance data exported successfully');
    } catch (error) {
      console.error("Error exporting all data:", error);
      toast.error("Failed to export all data");
    } finally {
      setLoading(prev => ({ ...prev, exportAll: false }));
    }
  };
  
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return null;
    }
    
    return sortDirection === 'asc' ? 
      <ArrowUp className="inline-block ml-1 h-4 w-4" /> : 
      <ArrowDown className="inline-block ml-1 h-4 w-4" />;
  };
  
  const renderSummaryTable = () => {
    if (loading.students) {
      return (
        <div className="text-center py-6">
          <p>Loading attendance summary...</p>
        </div>
      );
    }
    
    if (students.length === 0) {
      return (
        <div className="text-center py-6 border rounded-md bg-gray-50">
          <p className="text-muted-foreground">No attendance data available</p>
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto">
        <table className="nadi-table w-full">
          <thead>
            <tr>
              <th onClick={() => toggleSort('trNo')} className="cursor-pointer">
                Tr. No. {getSortIcon('trNo')}
              </th>
              <th onClick={() => toggleSort('name')} className="cursor-pointer">
                Name {getSortIcon('name')}
              </th>
              <th onClick={() => toggleSort('division')} className="cursor-pointer">
                Division {getSortIcon('division')}
              </th>
              <th onClick={() => toggleSort('subject')} className="cursor-pointer">
                Subject {getSortIcon('subject')}
              </th>
              <th onClick={() => toggleSort('presentDays')} className="cursor-pointer">
                Present Days {getSortIcon('presentDays')}
              </th>
              <th onClick={() => toggleSort('totalDays')} className="cursor-pointer">
                Absent Days {getSortIcon('totalDays')}
              </th>
              <th onClick={() => toggleSort('totalDays')} className="cursor-pointer">
                Total Days {getSortIcon('totalDays')}
              </th>
              <th onClick={() => toggleSort('totalDays')} className="cursor-pointer">
                Attendance % {getSortIcon('totalDays')}
              </th>
            </tr>
          </thead>
          <tbody>
            {getSortedStudents().map(student => (
              <tr key={student.id}>
                <td>{student.trNo}</td>
                <td>
                  <div className="flex items-center gap-2">
                    {student.photo && (
                      <img
                        src={student.photo}
                        alt={student.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    )}
                    {student.name}
                  </div>
                </td>
                <td>{student.division || "-"}</td>
                <td>{student.subject || "-"}</td>
                <td>{student.presentDays || 0}</td>
                <td>{student.absentDays || 0}</td>
                <td>{student.totalDays || 0}</td>
                <td>
                  {student.attendancePercentage ? student.attendancePercentage.toFixed(1) + '%' : "0%"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Reports</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <ToggleGroup 
            type="single" 
            value={viewMode} 
            onValueChange={(value) => handleViewModeChange(value as ViewMode)}
            className="justify-start border rounded-md p-1"
          >
            <ToggleGroupItem value="present">Present</ToggleGroupItem>
            <ToggleGroupItem value="absent">Absent</ToggleGroupItem>
            <ToggleGroupItem value="summary" className="flex items-center gap-1">
              <BarChart2 className="h-4 w-4" />
              Summary
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        
        {viewMode !== 'summary' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Select Date
              </label>
              <Select value={selectedDate} onValueChange={handleDateChange}>
                <SelectTrigger className="w-full" disabled={loading.dates || availableDates.length === 0}>
                  <SelectValue placeholder="Select a date" />
                </SelectTrigger>
                <SelectContent>
                  {availableDates.map(date => (
                    <SelectItem key={date} value={date}>
                      {getFormattedDate(date)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        
        {/* Export Buttons */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Button 
            onClick={handleExport} 
            disabled={loading.export || loading.students || (viewMode !== 'summary' && !selectedDate)}
            className="flex items-center gap-2"
          >
            <Download size={16} />
            {loading.export ? "Exporting..." : "Export Current View"}
          </Button>
          
          <Button 
            onClick={handleExportAll} 
            disabled={loading.exportAll || availableDates.length === 0}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FileText size={16} />
            {loading.exportAll ? "Exporting..." : "Export All Dates Data"}
          </Button>
        </div>
        
        {/* Student Table */}
        {viewMode === 'summary' ? (
          renderSummaryTable()
        ) : selectedDate ? (
          <AttendanceTable 
            students={getSortedStudents()}
            loading={loading.students}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={toggleSort}
            showAttendanceColumns={false}
          />
        ) : (
          <div className="text-center py-8 border rounded-md bg-gray-50">
            <p className="text-muted-foreground">
              {availableDates.length === 0 ? 
                "No attendance data available yet" : 
                "Please select a date to view attendance"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
