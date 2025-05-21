
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, Check, X } from "lucide-react";
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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateSubmitted, setDateSubmitted] = useState<boolean>(false);
  const [trNumber, setTrNumber] = useState<string>("");
  const [presentStudents, setPresentStudents] = useState<Student[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState({
    submit: false,
    attendance: false,
    markPresent: false
  });

  // Default to first class
  const [defaultClass, setDefaultClass] = useState<string>("");

  // Load default class on component mount
  useEffect(() => {
    loadDefaultClass();
  }, []);

  // Load attendance data for the selected date and default class when date is submitted
  useEffect(() => {
    if (defaultClass && dateSubmitted) {
      loadAttendanceData();
      loadAllStudents();
    }
  }, [defaultClass, selectedDate, dateSubmitted]);

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

  const loadAllStudents = async () => {
    try {
      if (!defaultClass) return;
      
      const students = await supabaseService.getStudentsByClass(defaultClass);
      setAllStudents(students);
    } catch (error) {
      console.error("Error loading students:", error);
      toast.error("Failed to load students");
    }
  };

  const loadAttendanceData = async () => {
    try {
      setLoading(prev => ({ ...prev, attendance: true }));
      if (!defaultClass) return;
      
      const dateStr = formatDate(selectedDate);
      
      // Get attendance records for the selected date and class
      const records = await supabaseService.getAttendanceByDateAndClass(dateStr, defaultClass);
      
      // Get all students for this class with present status
      const students = await supabaseService.getStudentsByClass(defaultClass);
      
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

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setDateSubmitted(false); // Reset submission state when date changes
      setTrNumber(""); // Clear TR number input
      setPresentStudents([]); // Clear present students list
    }
  };

  const handleDateSubmit = async () => {
    if (!defaultClass) {
      toast.error("No class available");
      return;
    }
    
    try {
      setLoading(prev => ({ ...prev, submit: true }));
      
      const dateStr = formatDate(selectedDate);
      const allStudents = await supabaseService.getStudentsByClass(defaultClass);
      
      // Mark all students as absent first by ensuring records exist
      for (const student of allStudents) {
        await supabaseService.markAttendance({
          date: dateStr,
          classId: defaultClass,
          studentId: student.id,
          status: 'absent'
        });
      }
      
      setDateSubmitted(true);
      toast.success(`Attendance sheet initialized for ${format(selectedDate, "PPP")}`);
    } catch (error) {
      console.error("Error initializing attendance:", error);
      toast.error("Failed to initialize attendance");
    } finally {
      setLoading(prev => ({ ...prev, submit: false }));
    }
  };

  const handleMarkPresent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!defaultClass) {
      toast.error("No class available");
      return;
    }
    
    if (!dateSubmitted) {
      toast.error("Please set the date first");
      return;
    }
    
    if (!trNumber.trim()) {
      toast.error("Please enter a Tr. Number");
      return;
    }
    
    try {
      setLoading(prev => ({ ...prev, markPresent: true }));
      
      // Find student by Tr. No.
      const students = await supabaseService.getStudentsByClass(defaultClass);
      const student = students.find(s => s.trNo === trNumber.trim());
      
      if (!student) {
        toast.error(`No student found with Tr. No. ${trNumber}`);
        return;
      }
      
      // Mark student as present
      const dateStr = formatDate(selectedDate);
      await supabaseService.markAttendance({
        date: dateStr,
        classId: defaultClass,
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
      setLoading(prev => ({ ...prev, markPresent: false }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mark Attendance</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    disabled={loading.submit}
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
            
            {/* Submit Button */}
            <div className="flex items-end">
              <Button 
                type="button" 
                onClick={handleDateSubmit}
                disabled={loading.submit || !defaultClass}
                className="mb-2"
              >
                {loading.submit ? "Setting..." : "Set Date"}
              </Button>
            </div>
          </div>
          
          {/* Tr. No. Input - Only shown after date is submitted */}
          {dateSubmitted && (
            <div className="space-y-2">
              <label htmlFor="tr-number" className="block text-sm font-medium">
                Enter Tr. No. to Mark Present
              </label>
              <div className="flex space-x-2">
                <Input
                  id="tr-number"
                  type="text"
                  value={trNumber}
                  onChange={(e) => setTrNumber(e.target.value)}
                  placeholder="Enter Tr. No."
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  onClick={handleMarkPresent}
                  disabled={loading.markPresent || !trNumber}
                >
                  {loading.markPresent ? "Marking..." : "Mark Present"}
                </Button>
              </div>
            </div>
          )}
        </form>
        
        {/* Display present students - Only shown after date is submitted */}
        {dateSubmitted && (
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
        )}
      </CardContent>
    </Card>
  );
}
