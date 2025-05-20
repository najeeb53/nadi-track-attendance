
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { supabaseService, Student, Class } from "@/services/SupabaseService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/dateUtils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AttendanceForm() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, 'present' | 'absent'>>({});
  const [divisions, setDivisions] = useState<string[]>([]);
  const [selectedDivision, setSelectedDivision] = useState<string>("");
  const [loading, setLoading] = useState({
    classes: false,
    students: false,
    attendance: false,
    saving: false,
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
      setSelectedDivision("");
    }
  }, [selectedClass]);
  
  // Load students when class and division changes
  useEffect(() => {
    if (selectedClass) {
      loadStudents();
    }
  }, [selectedClass, selectedDivision]);
  
  // Load attendance records when class, division or date changes
  useEffect(() => {
    if (selectedClass && selectedDate) {
      loadAttendanceRecords();
    }
  }, [selectedClass, selectedDivision, selectedDate]);
  
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
      setSelectedDivision("");
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
      
      if (selectedDivision) {
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
  
  const loadAttendanceRecords = async () => {
    try {
      setLoading(prev => ({ ...prev, attendance: true }));
      const dateStr = formatDate(selectedDate);
      const records = await supabaseService.getAttendanceByDateAndClass(dateStr, selectedClass);
      
      const recordMap: Record<string, 'present' | 'absent'> = {};
      records.forEach(record => {
        recordMap[record.studentId] = record.status;
      });
      
      // Set default status as absent for all students
      students.forEach(student => {
        if (!recordMap[student.id]) {
          recordMap[student.id] = 'absent';
        }
      });
      
      setAttendanceRecords(recordMap);
    } catch (error) {
      console.error("Error loading attendance records:", error);
      toast.error("Failed to load attendance records");
    } finally {
      setLoading(prev => ({ ...prev, attendance: false }));
    }
  };
  
  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedClass(e.target.value);
    setSelectedDivision(""); // Reset division when class changes
  };
  
  const handleDivisionChange = (value: string) => {
    setSelectedDivision(value);
  };
  
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };
  
  const toggleAttendance = async (studentId: string) => {
    try {
      setLoading(prev => ({ ...prev, saving: true }));
      
      const currentStatus = attendanceRecords[studentId] || 'absent';
      const newStatus = currentStatus === 'absent' ? 'present' : 'absent';
      
      setAttendanceRecords(prev => ({
        ...prev,
        [studentId]: newStatus
      }));
      
      // Save to database
      await supabaseService.markAttendance({
        date: formatDate(selectedDate),
        classId: selectedClass,
        studentId,
        status: newStatus
      });
      
      // Show toast
      toast.success(`${newStatus === 'present' ? 'Present' : 'Absent'} marked successfully`);
    } catch (error) {
      console.error("Error marking attendance:", error);
      toast.error("Failed to mark attendance");
      
      // Revert the optimistic update
      loadAttendanceRecords();
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mark Attendance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
            <label className="block text-sm font-medium mb-2">
              Select Date
            </label>
            <div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                    disabled={loading.attendance}
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
        </div>
        
        {/* Division Selection */}
        {selectedClass && divisions.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Select Division
            </label>
            <Select value={selectedDivision} onValueChange={handleDivisionChange}>
              <SelectTrigger className="w-full" disabled={loading.divisions}>
                <SelectValue placeholder="All Divisions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Divisions</SelectItem>
                {divisions.map((division) => (
                  <SelectItem key={division} value={division}>
                    {division}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {/* Attendance Table */}
        {loading.students || loading.attendance ? (
          <div className="text-center py-8">
            <p>Loading...</p>
          </div>
        ) : selectedClass && students.length > 0 ? (
          <div className="overflow-x-auto mt-4">
            <table className="nadi-table">
              <thead>
                <tr>
                  <th>Tr. No.</th>
                  <th>Name</th>
                  <th>ITS No.</th>
                  <th>Division</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
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
                    <td>{student.division || "-"}</td>
                    <td>
                      <Button
                        variant={attendanceRecords[student.id] === 'present' ? 'default' : 'outline'}
                        className={attendanceRecords[student.id] === 'present' ? 'bg-green-600 hover:bg-green-700' : ''}
                        onClick={() => toggleAttendance(student.id)}
                        disabled={loading.saving}
                      >
                        {attendanceRecords[student.id] === 'present' ? 'Present' : 'Absent'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            {!selectedClass ? (
              <p>Please select a class to mark attendance</p>
            ) : (
              <p>No students found {selectedDivision ? `in division ${selectedDivision}` : 'in this class'}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
