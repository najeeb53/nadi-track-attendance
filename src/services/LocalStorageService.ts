
export interface Class {
  id: string;
  name: string;
}

export interface Student {
  id: string;
  trNo: string;
  name: string;
  itsNo: string;
  classId: string;
  division?: string;
  subject?: string;
  photo?: string;
}

export interface AttendanceRecord {
  date: string;
  classId: string;
  studentId: string;
  status: 'present' | 'absent';
}

class LocalStorageService {
  // Keys for storing data
  private readonly CLASSES_KEY = 'nadi_classes';
  private readonly STUDENTS_KEY = 'nadi_students';
  private readonly ATTENDANCE_KEY = 'nadi_attendance';

  // Class operations
  getClasses(): Class[] {
    const classes = localStorage.getItem(this.CLASSES_KEY);
    return classes ? JSON.parse(classes) : [];
  }

  addClass(classData: Omit<Class, 'id'>): Class {
    const classes = this.getClasses();
    const newClass = {
      ...classData,
      id: Date.now().toString(),
    };
    
    classes.push(newClass);
    localStorage.setItem(this.CLASSES_KEY, JSON.stringify(classes));
    return newClass;
  }

  updateClass(classData: Class): void {
    const classes = this.getClasses();
    const index = classes.findIndex(c => c.id === classData.id);
    
    if (index !== -1) {
      classes[index] = classData;
      localStorage.setItem(this.CLASSES_KEY, JSON.stringify(classes));
    }
  }

  deleteClass(id: string): void {
    const classes = this.getClasses().filter(c => c.id !== id);
    localStorage.setItem(this.CLASSES_KEY, JSON.stringify(classes));
    
    // Delete all students in this class
    const students = this.getStudents().filter(s => s.classId !== id);
    localStorage.setItem(this.STUDENTS_KEY, JSON.stringify(students));
    
    // Remove attendance records for this class
    const records = this.getAttendanceRecords().filter(r => r.classId !== id);
    localStorage.setItem(this.ATTENDANCE_KEY, JSON.stringify(records));
  }

  // Student operations
  getStudents(): Student[] {
    const students = localStorage.getItem(this.STUDENTS_KEY);
    return students ? JSON.parse(students) : [];
  }
  
  getStudentsByClass(classId: string): Student[] {
    return this.getStudents().filter(student => student.classId === classId);
  }

  addStudent(studentData: Omit<Student, 'id'>): Student {
    const students = this.getStudents();
    
    // Check for unique constraints
    const hasDuplicateTrNo = students.some(s => s.trNo === studentData.trNo);
    const hasDuplicateItsNo = students.some(s => s.itsNo === studentData.itsNo);
    
    if (hasDuplicateTrNo) {
      throw new Error('Tr. No. already exists');
    }
    
    if (hasDuplicateItsNo) {
      throw new Error('ITS No. already exists');
    }
    
    const newStudent = {
      ...studentData,
      id: Date.now().toString(),
    };
    
    students.push(newStudent);
    localStorage.setItem(this.STUDENTS_KEY, JSON.stringify(students));
    return newStudent;
  }

  updateStudent(studentData: Student): void {
    const students = this.getStudents();
    const index = students.findIndex(s => s.id === studentData.id);
    
    if (index !== -1) {
      // Check for unique constraints with other students
      const otherStudents = students.filter(s => s.id !== studentData.id);
      const hasDuplicateTrNo = otherStudents.some(s => s.trNo === studentData.trNo);
      const hasDuplicateItsNo = otherStudents.some(s => s.itsNo === studentData.itsNo);
      
      if (hasDuplicateTrNo) {
        throw new Error('Tr. No. already exists');
      }
      
      if (hasDuplicateItsNo) {
        throw new Error('ITS No. already exists');
      }
      
      students[index] = studentData;
      localStorage.setItem(this.STUDENTS_KEY, JSON.stringify(students));
    }
  }

  deleteStudent(id: string): void {
    const students = this.getStudents().filter(s => s.id !== id);
    localStorage.setItem(this.STUDENTS_KEY, JSON.stringify(students));
    
    // Remove attendance records for this student
    const records = this.getAttendanceRecords().filter(r => r.studentId !== id);
    localStorage.setItem(this.ATTENDANCE_KEY, JSON.stringify(records));
  }

  // Attendance operations
  getAttendanceRecords(): AttendanceRecord[] {
    const records = localStorage.getItem(this.ATTENDANCE_KEY);
    return records ? JSON.parse(records) : [];
  }
  
  getAttendanceByDateAndClass(date: string, classId: string): AttendanceRecord[] {
    return this.getAttendanceRecords().filter(
      record => record.date === date && record.classId === classId
    );
  }

  markAttendance(record: AttendanceRecord): void {
    const records = this.getAttendanceRecords();
    
    // Check if record already exists
    const existingIndex = records.findIndex(
      r => r.date === record.date && r.studentId === record.studentId
    );
    
    if (existingIndex !== -1) {
      // Update existing record
      records[existingIndex] = record;
    } else {
      // Add new record
      records.push(record);
    }
    
    localStorage.setItem(this.ATTENDANCE_KEY, JSON.stringify(records));
  }
  
  // Helper function to get attendance statistics
  getAttendanceStats(classId: string, startDate: string, endDate: string): { 
    totalDays: number;
    presentCount: Record<string, number>;
    absentCount: Record<string, number>;
  } {
    const records = this.getAttendanceRecords().filter(
      r => r.classId === classId && r.date >= startDate && r.date <= endDate
    );
    
    // Get unique dates for total days count
    const uniqueDates = [...new Set(records.map(r => r.date))];
    
    // Count present/absent by student
    const presentCount: Record<string, number> = {};
    const absentCount: Record<string, number> = {};
    
    records.forEach(record => {
      const { studentId, status } = record;
      
      if (status === 'present') {
        presentCount[studentId] = (presentCount[studentId] || 0) + 1;
      } else {
        absentCount[studentId] = (absentCount[studentId] || 0) + 1;
      }
    });
    
    return {
      totalDays: uniqueDates.length,
      presentCount,
      absentCount
    };
  }
  
  // Export attendance data to CSV
  exportAttendanceToCSV(startDate: string, endDate: string, classId?: string): string {
    // Get all necessary data
    let records = this.getAttendanceRecords().filter(
      r => r.date >= startDate && r.date <= endDate
    );
    
    if (classId) {
      records = records.filter(r => r.classId === classId);
    }
    
    const students = this.getStudents();
    const classes = this.getClasses();
    
    // Prepare CSV header
    const headers = ['Date', 'Class', 'Student Name', 'Tr. No.', 'ITS No.', 'Status'];
    let csv = headers.join(',') + '\n';
    
    // Add records to CSV
    records.forEach(record => {
      const student = students.find(s => s.id === record.studentId);
      const classData = classes.find(c => c.id === record.classId);
      
      if (student && classData) {
        const row = [
          record.date,
          classData.name,
          student.name,
          student.trNo,
          student.itsNo,
          record.status
        ];
        
        csv += row.join(',') + '\n';
      }
    });
    
    return csv;
  }
}

export const storageService = new LocalStorageService();
