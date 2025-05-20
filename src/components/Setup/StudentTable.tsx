
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { storageService, Student } from "@/services/LocalStorageService";
import { toast } from "sonner";

interface StudentTableProps {
  classId: string;
  onEdit: (student: Student) => void;
  refreshTrigger: number;
}

export function StudentTable({ classId, onEdit, refreshTrigger }: StudentTableProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [sortField, setSortField] = useState<keyof Student>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState("");
  
  // Load students when component mounts or classId/refreshTrigger changes
  useState(() => {
    if (classId) {
      loadStudents();
    }
  });
  
  // Update when classId or refreshTrigger changes
  useState(() => {
    if (classId) {
      loadStudents();
    } else {
      setStudents([]);
    }
  }, [classId, refreshTrigger]);
  
  const loadStudents = () => {
    const loadedStudents = storageService.getStudentsByClass(classId);
    setStudents(loadedStudents);
  };
  
  const handleSort = (field: keyof Student) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
  };
  
  const sortedStudents = [...students]
    .filter(student => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        student.name.toLowerCase().includes(term) ||
        student.trNo.toLowerCase().includes(term) ||
        student.itsNo.toLowerCase().includes(term)
      );
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue === undefined || bValue === undefined) return 0;
      
      const comparison = typeof aValue === 'string' && typeof bValue === 'string'
        ? aValue.localeCompare(bValue)
        : String(aValue).localeCompare(String(bValue));
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  
  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this student? This will also delete their attendance records.")) {
      storageService.deleteStudent(id);
      loadStudents();
      toast.success("Student deleted successfully");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle>Students List</CardTitle>
          <div className="w-full md:w-64">
            <Input
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="nadi-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('trNo')} className="cursor-pointer">
                  Tr. No. {sortField === 'trNo' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('name')} className="cursor-pointer">
                  Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('itsNo')} className="cursor-pointer">
                  ITS No. {sortField === 'itsNo' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th>Division</th>
                <th>Subject</th>
                <th>Photo</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedStudents.length > 0 ? (
                sortedStudents.map((student) => (
                  <tr key={student.id}>
                    <td>{student.trNo}</td>
                    <td>{student.name}</td>
                    <td>{student.itsNo}</td>
                    <td>{student.division || '-'}</td>
                    <td>{student.subject || '-'}</td>
                    <td>
                      {student.photo ? (
                        <img 
                          src={student.photo} 
                          alt={student.name} 
                          className="w-10 h-10 object-cover rounded-full" 
                        />
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => onEdit(student)}
                        >
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDelete(student.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-4">
                    {classId ? "No students found" : "Please select a class first"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
