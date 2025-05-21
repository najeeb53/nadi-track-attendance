
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
import { formatDate, getFormattedDate } from "@/utils/dateUtils";
import { toast } from "sonner";
import { AttendanceTable } from './AttendanceTable';
import { ArrowDown, ArrowUp, Download, FileText } from "lucide-react";

type SortDirection = 'asc' | 'desc';
type SortField = 'trNo' | 'name' | 'division' | 'subject';
type ViewMode = 'present' | 'absent';

export function AttendanceReport() {
  const [defaultClass, setDefaultClass] = useState<string>("");
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>('present');
  const [students, setStudents] = useState<Student[]>([]);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [loading, setLoading] = useState({
    dates: false,
    students: false,
    export: false,
    exportAll: false
  });
  
  // Load default class on component mount
  useEffect(() => {
    loadDefaultClass();
  }, []);
  
  // Load available dates when default class is set
  useEffect(() => {
    if (defaultClass) {
      loadAvailableDates();
    }
  }, [defaultClass]);
  
  // Load student data when date and view mode change
  useEffect(() => {
    if (defaultClass && selectedDate) {
      loadStudentData();
    }
  }, [defaultClass, selectedDate, viewMode]);
  
  const loadDefaultClass = async () => {
    try {
      const loadedClasses = await supabaseService.getClasses();
      
      // Auto-select first class if any
      if (loadedClasses.length > 0) {
        setDefaultClass(loadedClasses[0].id);
      }
    } catch (error) {
      console.error("Error loading default class:", error);
      toast.error("Failed to load classes");
    }
  };
  
  const loadAvailableDates = async () => {
    try {
      setLoading(prev => ({ ...prev, dates: true }));
      
      // Get all unique dates for which attendance was recorded for this class
      const dates = await supabaseService.getAttendanceDatesByClass(defaultClass);
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
      
      // Get all students for this class
      const allStudents = await supabaseService.getStudentsByClass(defaultClass);
      
      // Get attendance records for the selected date
      const records = await supabaseService.getAttendanceByDateAndClass(selectedDate, defaultClass);
      
      let filteredStudents: Student[] = [];
      
      if (viewMode === 'present') {
        // Filter for present students
        filteredStudents = allStudents.filter(student => 
          records.some(record => record.studentId === student.id && record.status === 'present')
        );
      } else {
        // Filter for absent students
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
  
  const getSortedStudents = (): Student[] => {
    return [...students].sort((a, b) => {
      const aValue = a[sortField as keyof Student];
      const bValue = b[sortField as keyof Student];
      
      const comparison = typeof aValue === 'string' && typeof bValue === 'string'
        ? aValue.localeCompare(bValue)
        : String(aValue || '').localeCompare(String(bValue || ''));
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };
  
  const handleExport = async () => {
    try {
      setLoading(prev => ({ ...prev, export: true }));
      
      if (!selectedDate || !defaultClass) {
        toast.error("Please select a date first");
        return;
      }
      
      // Create CSV content
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
      
      if (!defaultClass || availableDates.length === 0) {
        toast.error("No attendance data available");
        return;
      }
      
      const csv = await supabaseService.exportAttendanceToCSV('', '', defaultClass, '');
      
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
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Reports</CardTitle>
      </CardHeader>
      <CardContent>
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
          
          {/* View Mode Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              View Mode
            </label>
            <Select value={viewMode} onValueChange={handleViewModeChange as (value: string) => void}>
              <SelectTrigger className="w-full" disabled={!selectedDate}>
                <SelectValue placeholder="Select view mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="present">Present Students</SelectItem>
                <SelectItem value="absent">Absent Students</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Export Buttons */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Button 
            onClick={handleExport} 
            disabled={loading.export || loading.students || !selectedDate}
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
        {selectedDate ? (
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
                </tr>
              </thead>
              <tbody>
                {loading.students ? (
                  <tr>
                    <td colSpan={4} className="text-center py-6">Loading students...</td>
                  </tr>
                ) : getSortedStudents().length > 0 ? (
                  getSortedStudents().map(student => (
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
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-6">
                      No {viewMode === 'present' ? 'present' : 'absent'} students found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
