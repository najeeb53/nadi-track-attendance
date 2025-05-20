
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabaseService, Student } from "@/services/SupabaseService";

interface StudentFormProps {
  classId: string;
  onStudentAdded: () => void;
  editingStudent: Student | null;
  setEditingStudent: (student: Student | null) => void;
}

export function StudentForm({ 
  classId, 
  onStudentAdded, 
  editingStudent,
  setEditingStudent
}: StudentFormProps) {
  const [trNo, setTrNo] = useState("");
  const [name, setName] = useState("");
  const [itsNo, setItsNo] = useState("");
  const [division, setDivision] = useState("");
  const [subject, setSubject] = useState("");
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  
  // Set form data when editing student
  useEffect(() => {
    if (editingStudent) {
      setTrNo(editingStudent.trNo);
      setName(editingStudent.name);
      setItsNo(editingStudent.itsNo);
      setDivision(editingStudent.division || "");
      setSubject(editingStudent.subject || "");
      setPhoto(editingStudent.photo);
    }
  }, [editingStudent]);
  
  const resetForm = () => {
    setTrNo("");
    setName("");
    setItsNo("");
    setDivision("");
    setSubject("");
    setPhoto(undefined);
    setEditingStudent(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!trNo || !name || !itsNo) {
      toast.error("Tr. No, Name and ITS No. are required");
      return;
    }
    
    try {
      setLoading(true);
      
      if (editingStudent) {
        // Update existing student
        await supabaseService.updateStudent({
          id: editingStudent.id,
          trNo,
          name,
          itsNo,
          classId,
          division,
          subject,
          photo
        });
        toast.success("Student updated successfully");
      } else {
        // Add new student
        await supabaseService.addStudent({
          trNo,
          name,
          itsNo,
          classId,
          division,
          subject,
          photo
        });
        toast.success("Student added successfully");
      }
      
      resetForm();
      onStudentAdded();
    } catch (error) {
      console.error("Error saving student:", error);
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (max 1MB)
    if (file.size > 1024 * 1024) {
      toast.error("File size should not exceed 1MB");
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const handleCancel = () => {
    resetForm();
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>
          {editingStudent ? "Edit Student" : "Add Student"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tr-no">Tr. No.</Label>
              <Input
                id="tr-no"
                placeholder="Enter Tr. No."
                value={trNo}
                onChange={(e) => setTrNo(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Enter student name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="its-no">ITS No.</Label>
              <Input
                id="its-no"
                placeholder="Enter ITS No."
                value={itsNo}
                onChange={(e) => setItsNo(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="division">Division (Optional)</Label>
              <Input
                id="division"
                placeholder="Enter division"
                value={division}
                onChange={(e) => setDivision(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subject">Subject (Optional)</Label>
              <Input
                id="subject"
                placeholder="Enter subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="photo">Photo (Optional)</Label>
              <Input
                id="photo"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
              />
            </div>
          </div>
          
          {photo && (
            <div className="mt-4">
              <p className="text-sm mb-2">Photo Preview:</p>
              <img 
                src={photo} 
                alt="Student" 
                className="w-32 h-32 object-cover rounded-md border" 
              />
            </div>
          )}
          
          <div className="flex justify-end gap-4 mt-6">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : (editingStudent ? "Update Student" : "Add Student")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
