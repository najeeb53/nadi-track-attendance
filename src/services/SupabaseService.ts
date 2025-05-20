
import { supabase } from "@/integrations/supabase/client";

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

class SupabaseService {
  // Class operations
  async getClasses(): Promise<Class[]> {
    const { data, error } = await supabase
      .from('classes')
      .select('*');
    
    if (error) {
      console.error('Error fetching classes:', error);
      return [];
    }
    
    return data.map(item => ({
      id: item.id,
      name: item.name
    }));
  }

  async addClass(classData: Omit<Class, 'id'>): Promise<Class | null> {
    const { data, error } = await supabase
      .from('classes')
      .insert([{ name: classData.name }])
      .select()
      .single();
    
    if (error) {
      console.error('Error adding class:', error);
      throw new Error(error.message);
    }
    
    return {
      id: data.id,
      name: data.name
    };
  }

  async updateClass(classData: Class): Promise<void> {
    const { error } = await supabase
      .from('classes')
      .update({ name: classData.name })
      .eq('id', classData.id);
    
    if (error) {
      console.error('Error updating class:', error);
      throw new Error(error.message);
    }
  }

  async deleteClass(id: string): Promise<void> {
    // Note: We don't need to delete students and attendance records
    // as we've set up cascade deletion in the database
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting class:', error);
      throw new Error(error.message);
    }
  }

  // Student operations
  async getStudents(): Promise<Student[]> {
    const { data, error } = await supabase
      .from('students')
      .select('*');
    
    if (error) {
      console.error('Error fetching students:', error);
      return [];
    }
    
    return data.map(item => ({
      id: item.id,
      trNo: item.tr_no,
      name: item.name,
      itsNo: item.its_no,
      classId: item.class_id,
      division: item.division,
      subject: item.subject,
      photo: item.photo
    }));
  }
  
  async getStudentsByClass(classId: string): Promise<Student[]> {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('class_id', classId);
    
    if (error) {
      console.error('Error fetching students by class:', error);
      return [];
    }
    
    return data.map(item => ({
      id: item.id,
      trNo: item.tr_no,
      name: item.name,
      itsNo: item.its_no,
      classId: item.class_id,
      division: item.division,
      subject: item.subject,
      photo: item.photo
    }));
  }

  async addStudent(studentData: Omit<Student, 'id'>): Promise<Student | null> {
    // Check for unique constraints
    const { data: existingTrNo } = await supabase
      .from('students')
      .select('id')
      .eq('tr_no', studentData.trNo)
      .maybeSingle();
    
    if (existingTrNo) {
      throw new Error('Tr. No. already exists');
    }
    
    const { data: existingItsNo } = await supabase
      .from('students')
      .select('id')
      .eq('its_no', studentData.itsNo)
      .maybeSingle();
    
    if (existingItsNo) {
      throw new Error('ITS No. already exists');
    }
    
    // Insert new student
    const { data, error } = await supabase
      .from('students')
      .insert([{
        tr_no: studentData.trNo,
        name: studentData.name,
        its_no: studentData.itsNo,
        class_id: studentData.classId,
        division: studentData.division,
        subject: studentData.subject,
        photo: studentData.photo
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error adding student:', error);
      throw new Error(error.message);
    }
    
    return {
      id: data.id,
      trNo: data.tr_no,
      name: data.name,
      itsNo: data.its_no,
      classId: data.class_id,
      division: data.division,
      subject: data.subject,
      photo: data.photo
    };
  }

  async updateStudent(studentData: Student): Promise<void> {
    // Check for unique constraints with other students
    const { data: existingTrNo } = await supabase
      .from('students')
      .select('id')
      .eq('tr_no', studentData.trNo)
      .neq('id', studentData.id)
      .maybeSingle();
    
    if (existingTrNo) {
      throw new Error('Tr. No. already exists');
    }
    
    const { data: existingItsNo } = await supabase
      .from('students')
      .select('id')
      .eq('its_no', studentData.itsNo)
      .neq('id', studentData.id)
      .maybeSingle();
    
    if (existingItsNo) {
      throw new Error('ITS No. already exists');
    }
    
    // Update student
    const { error } = await supabase
      .from('students')
      .update({
        tr_no: studentData.trNo,
        name: studentData.name,
        its_no: studentData.itsNo,
        class_id: studentData.classId,
        division: studentData.division,
        subject: studentData.subject,
        photo: studentData.photo
      })
      .eq('id', studentData.id);
    
    if (error) {
      console.error('Error updating student:', error);
      throw new Error(error.message);
    }
  }

  async deleteStudent(id: string): Promise<void> {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting student:', error);
      throw new Error(error.message);
    }
  }

  // Attendance operations
  async getAttendanceRecords(): Promise<AttendanceRecord[]> {
    const { data, error } = await supabase
      .from('attendance')
      .select('*');
    
    if (error) {
      console.error('Error fetching attendance records:', error);
      return [];
    }
    
    return data.map(item => ({
      date: item.date,
      classId: item.class_id,
      studentId: item.student_id,
      status: item.status as 'present' | 'absent'
    }));
  }
  
  async getAttendanceByDateAndClass(date: string, classId: string): Promise<AttendanceRecord[]> {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('date', date)
      .eq('class_id', classId);
    
    if (error) {
      console.error('Error fetching attendance by date and class:', error);
      return [];
    }
    
    return data.map(item => ({
      date: item.date,
      classId: item.class_id,
      studentId: item.student_id,
      status: item.status as 'present' | 'absent'
    }));
  }

  async markAttendance(record: AttendanceRecord): Promise<void> {
    // Check if record already exists
    const { data: existingRecord } = await supabase
      .from('attendance')
      .select('id')
      .eq('date', record.date)
      .eq('student_id', record.studentId)
      .maybeSingle();
    
    if (existingRecord) {
      // Update existing record
      const { error } = await supabase
        .from('attendance')
        .update({
          status: record.status
        })
        .eq('id', existingRecord.id);
      
      if (error) {
        console.error('Error updating attendance record:', error);
        throw new Error(error.message);
      }
    } else {
      // Add new record
      const { error } = await supabase
        .from('attendance')
        .insert([{
          date: record.date,
          class_id: record.classId,
          student_id: record.studentId,
          status: record.status
        }]);
      
      if (error) {
        console.error('Error adding attendance record:', error);
        throw new Error(error.message);
      }
    }
  }
  
  // Helper function to get attendance statistics
  async getAttendanceStats(classId: string, startDate: string, endDate: string): Promise<{ 
    totalDays: number;
    presentCount: Record<string, number>;
    absentCount: Record<string, number>;
  }> {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('class_id', classId)
      .gte('date', startDate)
      .lte('date', endDate);
    
    if (error) {
      console.error('Error fetching attendance stats:', error);
      return {
        totalDays: 0,
        presentCount: {},
        absentCount: {}
      };
    }
    
    // Get unique dates for total days count
    const uniqueDates = [...new Set(data.map(r => r.date))];
    
    // Count present/absent by student
    const presentCount: Record<string, number> = {};
    const absentCount: Record<string, number> = {};
    
    data.forEach(record => {
      const { student_id, status } = record;
      
      if (status === 'present') {
        presentCount[student_id] = (presentCount[student_id] || 0) + 1;
      } else {
        absentCount[student_id] = (absentCount[student_id] || 0) + 1;
      }
    });
    
    return {
      totalDays: uniqueDates.length,
      presentCount,
      absentCount
    };
  }
  
  // Export attendance data to CSV
  async exportAttendanceToCSV(startDate: string, endDate: string, classId?: string): Promise<string> {
    // Query to fetch attendance records
    let query = supabase
      .from('attendance')
      .select(`
        date,
        classes:class_id(name),
        students:student_id(name, tr_no, its_no),
        status
      `)
      .gte('date', startDate)
      .lte('date', endDate);
    
    // Filter by class if specified
    if (classId) {
      query = query.eq('class_id', classId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error exporting attendance data:', error);
      return '';
    }
    
    // Prepare CSV header
    const headers = ['Date', 'Class', 'Student Name', 'Tr. No.', 'ITS No.', 'Status'];
    let csv = headers.join(',') + '\n';
    
    // Add records to CSV
    data.forEach((record: any) => {
      if (record.classes && record.students) {
        const row = [
          record.date,
          record.classes.name,
          record.students.name,
          record.students.tr_no,
          record.students.its_no,
          record.status
        ];
        
        csv += row.join(',') + '\n';
      }
    });
    
    return csv;
  }
}

export const supabaseService = new SupabaseService();
