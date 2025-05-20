
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { supabaseService, Class, Student } from "@/services/SupabaseService";
import { formatDate, getStartOfWeek, getEndOfWeek, getStartOfMonth, getEndOfMonth, getDatesBetween } from "@/utils/dateUtils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';

export function AttendanceReport() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedTab, setSelectedTab] = useState<string>("daily");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState<any[]>([]);
  const [loading, setLoading] = useState({
    classes: false,
    students: false,
    attendance: false,
    export: false
  });
  
  // Load classes on component mount
  useEffect(() => {
    loadClasses();
  }, []);
  
  // Load students when class changes
  useEffect(() => {
    if (selectedClass) {
      loadStudents();
    }
  }, [selectedClass]);
  
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
  }, [selectedClass, startDate, endDate, selectedTab]);
  
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
  
  const loadStudents = async () => {
    try {
      setLoading(prev => ({ ...prev, students: true }));
      const loadedStudents = await supabaseService.getStudentsByClass(selectedClass);
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
        const records = await supabaseService.getAttendanceByDateAndClass(dateStr, selectedClass);
        
        const studentAttendance = students.map(student => {
          const record = records.find(r => r.studentId === student.id);
          return {
            ...student,
            status: record ? record.status : 'absent'
          };
        });
        
        setAttendanceData(studentAttendance);
        
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
        
        // Get statistics for the date range
        const stats = await supabaseService.getAttendanceStats(selectedClass, start, end);
        const dates = getDatesBetween(start, end);
        
        // Calculate summary for each student
        const studentSummary = students.map(student => {
          const presentCount = stats.presentCount[student.id] || 0;
          const absentCount = stats.absentCount[student.id] || 0;
          const totalDays = dates.length;
          const attendanceRate = totalDays > 0 ? (presentCount / totalDays) * 100 : 0;
          
          return {
            ...student,
            presentDays: presentCount,
            absentDays: absentCount,
            totalDays,
            attendanceRate: attendanceRate.toFixed(2)
          };
        });
        
        setAttendanceData(studentSummary);
        
        // Summary data for pie chart
        const totalPresent = Object.values(stats.presentCount).reduce((sum, count) => sum + count, 0);
        const totalPossible = students.length * dates.length;
        const totalAbsent = totalPossible - totalPresent;
        
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
      
      const csv = await supabaseService.exportAttendanceToCSV(start, end, selectedClass);
      
      // Create a CSV download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `attendance_${start}_to_${end}.csv`);
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
  
  // Pie chart colors
  const COLORS = ['#0ea5e9', '#f97316'];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Reports</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Class Selection */}
          <div>
            <label htmlFor="report-class-select" className="block text-sm font-medium mb-2">
              Select Class or Subject
            </label>
            <select
              id="report-class-select"
              value={selectedClass}
              onChange={handleClassChange}
              className="w-full p-2 border rounded-md"
              disabled={loading.classes}
            >
              <option value="" disabled>Select a class</option>
              {classes.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Report Type Tabs */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Report Type
            </label>
            <Tabs defaultValue="daily" value={selectedTab} onValueChange={handleTabChange}>
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="daily">Daily</TabsTrigger>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {selectedTab === "daily" ? "Select Date" : "Start Date"}
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                  disabled={loading.attendance}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={handleDateChange}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* End Date Selection (for weekly/monthly) */}
          {selectedTab !== "daily" && (
            <div>
              <label className="block text-sm font-medium mb-2">
                End Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                    disabled={loading.attendance}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={handleEndDateChange}
                    initialFocus
                    disabled={(date) => date < startDate}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
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
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Attendance Summary</CardTitle>
            <CardDescription>
              {selectedTab === "daily" 
                ? format(startDate, "PPP")
                : `${format(startDate, "PPP")} to ${endDate ? format(endDate, "PPP") : format(startDate, "PPP")}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading.attendance ? (
              <div className="h-64 flex items-center justify-center">
                <p>Loading data...</p>
              </div>
            ) : (
              <div className="h-64">
                {summaryData.length > 0 && summaryData.some(item => item.value > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={summaryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {summaryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-muted-foreground">No attendance data available</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Attendance Table */}
        {loading.attendance ? (
          <div className="text-center py-8">
            <p>Loading attendance data...</p>
          </div>
        ) : selectedClass && students.length > 0 ? (
          <div className="overflow-x-auto mt-4">
            <table className="nadi-table">
              <thead>
                <tr>
                  <th>Tr. No.</th>
                  <th>Name</th>
                  <th>ITS No.</th>
                  {selectedTab === "daily" ? (
                    <th>Status</th>
                  ) : (
                    <>
                      <th>Present Days</th>
                      <th>Absent Days</th>
                      <th>Attendance Rate</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {attendanceData.map((student: any) => (
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
                    <td>{student.itsNo}</td>
                    {selectedTab === "daily" ? (
                      <td>
                        <span 
                          className={`px-3 py-1 rounded-full text-white ${
                            student.status === 'present' ? 'bg-green-600' : 'bg-red-600'
                          }`}
                        >
                          {student.status === 'present' ? 'Present' : 'Absent'}
                        </span>
                      </td>
                    ) : (
                      <>
                        <td className="text-green-600">{student.presentDays}</td>
                        <td className="text-red-600">{student.absentDays}</td>
                        <td>{student.attendanceRate}%</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            {!selectedClass ? (
              <p>Please select a class to view reports</p>
            ) : (
              <p>No students found in this class</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
