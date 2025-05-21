
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabaseService, Class, Student } from "@/services/SupabaseService";
import { formatDate, getStartOfWeek, getEndOfWeek, getStartOfMonth, getEndOfMonth, getDatesBetween } from "@/utils/dateUtils";
import { toast } from "sonner";
import { ClassSelector } from './ClassSelector';
import { DivisionSelector } from './DivisionSelector';
import { ReportTypeTabs } from './ReportTypeTabs';
import { DateSelector } from './DateSelector';
import { AttendanceSummaryChart } from './AttendanceSummaryChart';
import { AttendanceTable } from './AttendanceTable';

export function AttendanceReport() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedTab, setSelectedTab] = useState<string>("daily");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<string[]>([]);
  const [selectedDivision, setSelectedDivision] = useState<string>("all");
  const [loading, setLoading] = useState({
    classes: false,
    students: false,
    attendance: false,
    export: false,
    divisions: false
  });
  
  // Load classes on component mount
  useEffect(() => {
    loadClasses();
  }, []);
  
  // Load divisions when class changes
  useEffect(() => {
    if (selectedClass) {
      loadDivisions();
    } else {
      setDivisions([]);
      setSelectedDivision("all");
    }
  }, [selectedClass]);
  
  // Load students when class and division change
  useEffect(() => {
    if (selectedClass) {
      loadStudents();
    }
  }, [selectedClass, selectedDivision]);
  
  // Set date ranges when tab changes
  useEffect(() => {
    switch (selectedTab) {
      case "daily":
        setStartDate(new Date());
        setEndDate(undefined);
        break;
      case "weekly":
        setStartDate(new Date(getStartOfWeek()));
        setEndDate(new Date(getEndOfWeek()));
        break;
      case "monthly":
        setStartDate(new Date(getStartOfMonth()));
        setEndDate(new Date(getEndOfMonth()));
        break;
    }
  }, [selectedTab]);
  
  // Load attendance data when parameters change
  useEffect(() => {
    if (selectedClass && startDate) {
      loadAttendanceData();
    }
  }, [selectedClass, startDate, endDate, selectedTab, selectedDivision]);
  
  const loadClasses = async () => {
    try {
      setLoading(prev => ({ ...prev, classes: true }));
      const loadedClasses = await supabaseService.getClasses();
      setClasses(loadedClasses);
      
      // Auto-select first class if any
      if (loadedClasses.length > 0) {
        setSelectedClass(loadedClasses[0].id);
      }
    } catch (error) {
      console.error("Error loading classes:", error);
      toast.error("Failed to load classes");
    } finally {
      setLoading(prev => ({ ...prev, classes: false }));
    }
  };
  
  const loadDivisions = async () => {
    try {
      setLoading(prev => ({ ...prev, divisions: true }));
      const divisions = await supabaseService.getDivisionsByClass(selectedClass);
      setDivisions(divisions);
      
      // Auto-select "All Divisions" as default
      setSelectedDivision("all");
    } catch (error) {
      console.error("Error loading divisions:", error);
      toast.error("Failed to load divisions");
    } finally {
      setLoading(prev => ({ ...prev, divisions: false }));
    }
  };
  
  const loadStudents = async () => {
    try {
      setLoading(prev => ({ ...prev, students: true }));
      let loadedStudents;
      
      if (selectedDivision && selectedDivision !== "all") {
        // Load students for specific division
        loadedStudents = await supabaseService.getStudentsByClassAndDivision(selectedClass, selectedDivision);
      } else {
        // Load all students for the class
        loadedStudents = await supabaseService.getStudentsByClass(selectedClass);
      }
      
      setStudents(loadedStudents);
    } catch (error) {
      console.error("Error loading students:", error);
      toast.error("Failed to load students");
    } finally {
      setLoading(prev => ({ ...prev, students: false }));
    }
  };
  
  const loadAttendanceData = async () => {
    try {
      setLoading(prev => ({ ...prev, attendance: true }));
      
      if (selectedTab === "daily") {
        // For daily view
        const dateStr = formatDate(startDate);
        let records;
        
        if (selectedDivision && selectedDivision !== "all") {
          // Get attendance records for specific division
          records = await supabaseService.getAttendanceByDateClassAndDivision(dateStr, selectedClass, selectedDivision);
        } else {
          // Get all attendance records for class
          records = await supabaseService.getAttendanceByDateAndClass(dateStr, selectedClass);
        }
        
        // Find students who were marked present
        const presentStudents = students.filter(student => 
          records.some(r => r.studentId === student.id && r.status === 'present')
        );
        
        setAttendanceData(presentStudents);
        
        // Summary data for pie chart
        const present = records.filter(r => r.status === 'present').length;
        const absent = students.length - present;
        
        setSummaryData([
          { name: 'Present', value: present },
          { name: 'Absent', value: absent }
        ]);
        
      } else {
        // For weekly/monthly view
        const start = formatDate(startDate);
        const end = endDate ? formatDate(endDate) : start;
        
        // Get statistics for the date range and division if selected
        let stats;
        if (selectedDivision && selectedDivision !== "all") {
          stats = await supabaseService.getAttendanceStatsWithDivision(selectedClass, start, end, selectedDivision);
        } else {
          stats = await supabaseService.getAttendanceStats(selectedClass, start, end);
        }
        
        const dates = getDatesBetween(start, end);
        
        // Find students who were marked present at least once in the date range
        const presentStudents = students.filter(student => 
          (stats.presentCount[student.id] || 0) > 0
        );
        
        // Calculate summary for each student
        const studentSummary = presentStudents.map(student => {
          const presentCount = stats.presentCount[student.id] || 0;
          const totalDays = dates.length;
          
          return {
            ...student,
            presentDays: presentCount,
            totalDays
          };
        });
        
        setAttendanceData(studentSummary);
        
        // Summary data for pie chart - Ensure values are converted to numbers
        const totalPresent = Object.values(stats.presentCount).reduce((sum: number, count: any) => sum + Number(count), 0);
        // Convert to number to ensure it's a valid arithmetic operand
        const totalPossible = Number(students.length) * Number(dates.length);
        const totalAbsent = Number(totalPossible) - Number(totalPresent);
        
        setSummaryData([
          { name: 'Present', value: totalPresent },
          { name: 'Absent', value: totalAbsent }
        ]);
      }
    } catch (error) {
      console.error("Error loading attendance data:", error);
      toast.error("Failed to load attendance data");
    } finally {
      setLoading(prev => ({ ...prev, attendance: false }));
    }
  };
  
  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedClass(e.target.value);
    setSelectedDivision("all"); // Reset division when class changes
  };
  
  const handleDivisionChange = (value: string) => {
    setSelectedDivision(value);
  };
  
  const handleTabChange = (value: string) => {
    setSelectedTab(value);
  };
  
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setStartDate(date);
      if (selectedTab !== "daily") {
        setEndDate(undefined);
      }
    }
  };
  
  const handleEndDateChange = (date: Date | undefined) => {
    setEndDate(date);
  };
  
  const exportAttendance = async () => {
    try {
      setLoading(prev => ({ ...prev, export: true }));
      const start = formatDate(startDate);
      const end = endDate ? formatDate(endDate) : start;
      
      // Pass division parameter if selected and not "all"
      const division = selectedDivision !== "all" ? selectedDivision : "";
      const csv = await supabaseService.exportAttendanceToCSV(start, end, selectedClass, division);
      
      // Create a CSV download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `attendance_${start}_to_${end}${division ? `_${division}` : ''}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Attendance data exported successfully');
    } catch (error) {
      console.error("Error exporting attendance data:", error);
      toast.error("Failed to export attendance data");
    } finally {
      setLoading(prev => ({ ...prev, export: false }));
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Reports</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Class Selection */}
          <ClassSelector 
            classes={classes}
            selectedClass={selectedClass}
            onChange={handleClassChange}
            disabled={loading.classes}
          />
          
          {/* Report Type Tabs */}
          <ReportTypeTabs 
            selectedTab={selectedTab}
            onValueChange={handleTabChange}
          />
        </div>
        
        {/* Division Selection */}
        {selectedClass && divisions.length > 0 && (
          <DivisionSelector
            divisions={divisions}
            selectedDivision={selectedDivision}
            onValueChange={handleDivisionChange}
            disabled={loading.divisions}
          />
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Date Selection */}
          <DateSelector
            label={selectedTab === "daily" ? "Select Date" : "Start Date"}
            date={startDate}
            onSelect={handleDateChange}
            disabled={loading.attendance}
          />
          
          {/* End Date Selection (for weekly/monthly) */}
          {selectedTab !== "daily" && (
            <DateSelector
              label="End Date"
              date={endDate}
              onSelect={handleEndDateChange}
              minDate={startDate}
              disabled={loading.attendance}
            />
          )}
        </div>
        
        {/* Export Button */}
        <div className="flex justify-end mb-6">
          <Button 
            onClick={exportAttendance} 
            disabled={loading.export || loading.attendance}
          >
            {loading.export ? "Exporting..." : "Export to CSV"}
          </Button>
        </div>
        
        {/* Attendance Summary Chart */}
        <AttendanceSummaryChart
          startDate={startDate}
          endDate={endDate || startDate}
          selectedDivision={selectedDivision}
          loading={loading.attendance}
          summaryData={summaryData}
        />
        
        {/* Attendance Table */}
        <AttendanceTable
          selectedTab={selectedTab}
          selectedClass={selectedClass}
          selectedDivision={selectedDivision}
          loading={loading.attendance}
          attendanceData={attendanceData}
        />
      </CardContent>
    </Card>
  );
}
