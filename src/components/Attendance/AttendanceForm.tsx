
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { supabaseService, Class, Student } from "@/services/SupabaseService";
import { formatDate } from "@/utils/dateUtils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

export function AttendanceForm() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [trNumber, setTrNumber] = useState<string>("");
  const [presentStudents, setPresentStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState({
    classes: false,
    submit: false,
    attendance: false
  });

  // Load classes on component mount
  useEffect(() => {
    loadClasses();
  }, []);

  // Load attendance data for the selected date and class
  useEffect(() => {
    if (selectedClass && selectedDate) {
      loadAttendanceData();
    }
  }, [selectedClass, selectedDate]);

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

  const loadAttendanceData = async () => {
    try {
      setLoading(prev => ({ ...prev, attendance: true }));
      const dateStr = formatDate(selectedDate);
      
      // Get attendance records for the selected date and class
      const records = await supabaseService.getAttendanceByDateAndClass(dateStr, selectedClass);
      
      // Get all students for this class with present status
      const students = await supabaseService.getStudentsByClass(selectedClass);
      
      // Filter to get only students marked as present
      const studentsPresent = students.filter(student => 
        records.some(record => record.studentId === student.id && record.status === 'present')
      );
      
      setPresentStudents(studentsPresent);
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

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClass) {
      toast.error("Please select a class first");
      return;
    }
    
    if (!trNumber.trim()) {
      toast.error("Please enter a Tr. Number");
      return;
    }
    
    try {
      setLoading(prev => ({ ...prev, submit: true }));
      
      // Find student by Tr. No.
      const students = await supabaseService.getStudentsByClass(selectedClass);
      const student = students.find(s => s.trNo === trNumber.trim());
      
      if (!student) {
        toast.error(`No student found with Tr. No. ${trNumber} in this class`);
        return;
      }
      
      // Mark student as present
      const dateStr = formatDate(selectedDate);
      await supabaseService.markAttendance({
        date: dateStr,
        classId: selectedClass,
        studentId: student.id,
        status: 'present'
      });
      
      // Clear input
      setTrNumber("");
      
      // Reload attendance data
      await loadAttendanceData();
      
      toast.success(`${student.name} marked present for ${format(selectedDate, "PPP")}`);
    } catch (error) {
      console.error("Error marking attendance:", error);
      toast.error("Failed to mark attendance");
    } finally {
      setLoading(prev => ({ ...prev, submit: false }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mark Attendance</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Class Selection */}
            <div>
              <label htmlFor="class-select" className="block text-sm font-medium mb-2">
                Select Class or Subject
              </label>
              <select
                id="class-select"
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
            
            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Select Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateChange}
                    initialFocus
                    className="p-3"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          {/* Tr. No. Input */}
          <div className="space-y-2">
            <label htmlFor="tr-number" className="block text-sm font-medium">
              Enter Tr. No. to Mark Present
            </label>
            <div className="flex space-x-2">
              <Input
                id="tr-number"
                type="number"
                value={trNumber}
                onChange={(e) => setTrNumber(e.target.value)}
                placeholder="Enter Tr. No."
                className="flex-1"
              />
              <Button 
                type="submit" 
                disabled={loading.submit || !selectedClass}
              >
                {loading.submit ? "Marking..." : "Mark Present"}
              </Button>
            </div>
          </div>
        </form>
        
        {/* Display present students */}
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">
            Students Present on {format(selectedDate, "PPP")}
          </h3>
          
          {loading.attendance ? (
            <div className="text-center py-6">
              <p>Loading data...</p>
            </div>
          ) : presentStudents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tr. No.</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Division</TableHead>
                  <TableHead>Subject</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {presentStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>{student.trNo}</TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell>{student.division || "-"}</TableCell>
                    <TableCell>{student.subject || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-6 border rounded-md bg-gray-50">
              <p className="text-muted-foreground">No students marked present yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
