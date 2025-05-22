import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, Check, X, RefreshCw, Trash2 } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { supabaseService, Student } from "@/services/SupabaseService";
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
import { Switch } from "@/components/ui/switch";

export function AttendanceForm() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateSubmitted, setDateSubmitted] = useState<boolean>(false);
  const [trNumber, setTrNumber] = useState<string>("");
  const [presentStudents, setPresentStudents] = useState<Student[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState({
    submit: false,
    attendance: false,
    markPresent: false,
    toggleStatus: false,
    deleteDate: false,
    markAllPresent: false
  });

  // Load attendance data for the selected date when date is submitted
  useEffect(() => {
    if (dateSubmitted) {
      loadAttendanceData();
      loadAllStudents();
    }
  }, [selectedDate, dateSubmitted]);

  const loadAllStudents = async () => {
    try {
      const students = await supabaseService.getStudents();
      setAllStudents(students);
    } catch (error) {
      console.error("Error loading students:", error);
      toast.error("Failed to load students");
    }
  };

  const loadAttendanceData = async () => {
    try {
      setLoading(prev => ({ ...prev, attendance: true }));
      
      const dateStr = formatDate(selectedDate);
      
      // Get attendance records for the selected date (across all classes)
      const records = await supabaseService.getAttendanceByDate(dateStr);
      
      // Get all students
      const students = await supabaseService.getStudents();
      
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
      setIsEditMode(false); // Reset edit mode
    }
  };

  const checkAttendanceExists = async (dateStr: string) => {
    try {
      const records = await supabaseService.getAttendanceByDate(dateStr);
      return records.length > 0;
    } catch (error) {
      console.error("Error checking attendance:", error);
      return false;
    }
  };

  const handleDateSubmit = async () => {
    try {
      setLoading(prev => ({ ...prev, submit: true }));
      
      const dateStr = formatDate(selectedDate);
      
      // Check if attendance records already exist for this date
      const attendanceExists = await checkAttendanceExists(dateStr);
      
      if (attendanceExists) {
        // If records exist, just load them without resetting
        setDateSubmitted(true);
        setIsEditMode(true);
        toast.success(`Attendance for ${format(selectedDate, "PPP")} loaded for editing`);
      } else {
        // If no records exist, initialize all students as absent
        const allStudents = await supabaseService.getStudents();
        
        // Mark all students as absent first by ensuring records exist
        for (const student of allStudents) {
          await supabaseService.markAttendance({
            date: dateStr,
            classId: student.classId,
            studentId: student.id,
            status: 'absent'
          });
        }
        
        setDateSubmitted(true);
        setIsEditMode(false);
        toast.success(`New attendance sheet initialized for ${format(selectedDate, "PPP")}`);
      }
    } catch (error) {
      console.error("Error setting up attendance:", error);
      toast.error("Failed to set up attendance");
    } finally {
      setLoading(prev => ({ ...prev, submit: false }));
    }
  };

  const handleMarkPresent = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      
      // Find student by Tr. No. across all classes
      const students = await supabaseService.getStudents();
      const student = students.find(s => s.trNo === trNumber.trim());
      
      if (!student) {
        toast.error(`No student found with Tr. No. ${trNumber}`);
        return;
      }
      
      // Mark student as present
      const dateStr = formatDate(selectedDate);
      await supabaseService.markAttendance({
        date: dateStr,
        classId: student.classId,
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

  const handleToggleAttendance = async (student: Student) => {
    try {
      setLoading(prev => ({ ...prev, toggleStatus: true }));
      
      const dateStr = formatDate(selectedDate);
      const isPresent = presentStudents.some(s => s.id === student.id);
      
      // Toggle student's status
      await supabaseService.markAttendance({
        date: dateStr,
        classId: student.classId,
        studentId: student.id,
        status: isPresent ? 'absent' : 'present'
      });
      
      // Reload attendance data
      await loadAttendanceData();
      
      toast.success(`${student.name}'s attendance updated to ${isPresent ? 'absent' : 'present'}`);
    } catch (error) {
      console.error("Error toggling attendance:", error);
      toast.error("Failed to update attendance");
    } finally {
      setLoading(prev => ({ ...prev, toggleStatus: false }));
    }
  };

  const isStudentPresent = (student: Student) => {
    return presentStudents.some(s => s.id === student.id);
  };

  // New function to sort students by attendance status
  const getSortedStudents = () => {
    return [...allStudents].sort((a, b) => {
      const aPresent = isStudentPresent(a);
      const bPresent = isStudentPresent(b);
      
      // Present students come first
      if (aPresent && !bPresent) return -1;
      if (!aPresent && bPresent) return 1;
      
      // If both have same status, sort by name
      return a.name.localeCompare(b.name);
    });
  };

  // New function to delete all attendance records for the selected date
  const handleDeleteDate = async () => {
    if (!dateSubmitted) {
      toast.error("Please set the date first");
      return;
    }
    
    try {
      setLoading(prev => ({ ...prev, deleteDate: true }));
      
      const dateStr = formatDate(selectedDate);
      
      // Delete all attendance records for the selected date (across all classes)
      await supabaseService.deleteAttendanceByDate(dateStr);
      
      // Reset states
      setDateSubmitted(false);
      setPresentStudents([]);
      setIsEditMode(false);
      
      toast.success(`Attendance records for ${format(selectedDate, "PPP")} have been deleted`);
    } catch (error) {
      console.error("Error deleting attendance records:", error);
      toast.error("Failed to delete attendance records");
    } finally {
      setLoading(prev => ({ ...prev, deleteDate: false }));
      setDeleteDialogOpen(false);
    }
  };

  // New function to mark all students as present for the selected date
  const handleMarkAllPresent = async () => {
    if (!dateSubmitted) {
      toast.error("Please set the date first");
      return;
    }
    
    try {
      setLoading(prev => ({ ...prev, markAllPresent: true }));
      
      const dateStr = formatDate(selectedDate);
      
      // Mark all students as present
      for (const student of allStudents) {
        await supabaseService.markAttendance({
          date: dateStr,
          classId: student.classId,
          studentId: student.id,
          status: 'present'
        });
      }
      
      // Reload attendance data
      await loadAttendanceData();
      
      toast.success(`All students marked present for ${format(selectedDate, "PPP")}`);
    } catch (error) {
      console.error("Error marking all students as present:", error);
      toast.error("Failed to mark all students as present");
    } finally {
      setLoading(prev => ({ ...prev, markAllPresent: false }));
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
            <div className="flex items-end space-x-2">
              <Button 
                type="button" 
                onClick={handleDateSubmit}
                disabled={loading.submit}
                className="mb-2"
              >
                {loading.submit ? "Setting..." : dateSubmitted ? "Refresh Data" : "Set Date"}
                {dateSubmitted && <RefreshCw className="ml-1 h-4 w-4" />}
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
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                Students Present on {format(selectedDate, "PPP")}
              </h3>
              
              <div className="flex space-x-2">
                <Button
                  type="button"
                  onClick={handleMarkAllPresent}
                  disabled={loading.markAllPresent}
                  variant="default"
                >
                  {loading.markAllPresent ? "Processing..." : "Mark All Present"}
                </Button>
                
                <Button
                  type="button"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={loading.deleteDate}
                  variant="destructive"
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  Delete Date
                </Button>
              </div>
            </div>
            
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Attendance Records</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete all attendance records for {format(selectedDate, "PPP")}?
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteDate}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={loading.deleteDate}
                  >
                    {loading.deleteDate ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            {loading.attendance ? (
              <div className="text-center py-6">
                <p>Loading data...</p>
              </div>
            ) : allStudents.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tr. No.</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Division</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getSortedStudents().map((student) => (
                    <TableRow key={student.id} className={isStudentPresent(student) ? "bg-green-50" : ""}>
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
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={isStudentPresent(student)}
                            onCheckedChange={() => handleToggleAttendance(student)}
                            disabled={loading.toggleStatus}
                          />
                          <span>{isStudentPresent(student) ? "Present" : "Absent"}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-6 border rounded-md bg-gray-50">
                <p className="text-muted-foreground">No students found</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
