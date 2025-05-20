
import { useState } from "react";
import { ClassForm } from "@/components/Setup/ClassForm";
import { StudentForm } from "@/components/Setup/StudentForm";
import { StudentTable } from "@/components/Setup/StudentTable";
import { Student } from "@/services/LocalStorageService";

export default function Setup() {
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const handleClassSelect = (classId: string) => {
    setSelectedClassId(classId);
  };
  
  const handleStudentAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    // Scroll to the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Setup</h1>
      
      {/* Class Management */}
      <ClassForm onClassSelect={handleClassSelect} />
      
      {/* Student Management */}
      {selectedClassId && (
        <div>
          <StudentForm 
            classId={selectedClassId}
            onStudentAdded={handleStudentAdded}
            editingStudent={editingStudent}
            setEditingStudent={setEditingStudent}
          />
          
          <StudentTable 
            classId={selectedClassId}
            onEdit={handleEditStudent}
            refreshTrigger={refreshTrigger}
          />
        </div>
      )}
    </div>
  );
}
