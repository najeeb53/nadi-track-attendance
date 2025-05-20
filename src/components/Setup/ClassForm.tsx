
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { storageService, Class } from "@/services/LocalStorageService";

interface ClassFormProps {
  onClassSelect: (classId: string) => void;
}

export function ClassForm({ onClassSelect }: ClassFormProps) {
  const [className, setClassName] = useState("");
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");

  // Load classes on component mount
  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = () => {
    const loadedClasses = storageService.getClasses();
    setClasses(loadedClasses);
    
    // Set first class as selected if any exist
    if (loadedClasses.length > 0 && !selectedClass) {
      setSelectedClass(loadedClasses[0].id);
      onClassSelect(loadedClasses[0].id);
    }
  };

  const handleAddClass = () => {
    if (!className.trim()) {
      toast.error("Please enter a class name");
      return;
    }
    
    try {
      // Check if we already have maximum classes (2)
      if (classes.length >= 2) {
        toast.error("Maximum of 2 classes allowed");
        return;
      }
      
      const newClass = storageService.addClass({ name: className });
      setClassName("");
      loadClasses();
      
      // Select the new class
      setSelectedClass(newClass.id);
      onClassSelect(newClass.id);
      
      toast.success("Class added successfully");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const classId = e.target.value;
    setSelectedClass(classId);
    onClassSelect(classId);
  };

  const handleDeleteClass = (id: string) => {
    if (confirm("Are you sure you want to delete this class? This will also delete all students and attendance records for this class.")) {
      storageService.deleteClass(id);
      loadClasses();
      setSelectedClass("");
      toast.success("Class deleted successfully");
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Class Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="class-name">Class or Subject Name</Label>
              <Input
                id="class-name"
                placeholder="Enter class or subject name"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleAddClass}
              disabled={classes.length >= 2}
            >
              Add Class
            </Button>
          </div>
          
          {classes.length > 0 && (
            <div className="mt-4">
              <Label htmlFor="class-select">Select Class or Subject</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center mt-2">
                <div className="col-span-2">
                  <select
                    id="class-select"
                    value={selectedClass}
                    onChange={handleClassChange}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="" disabled>Select a class</option>
                    {classes.map((classItem) => (
                      <option key={classItem.id} value={classItem.id}>
                        {classItem.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => selectedClass && handleDeleteClass(selectedClass)}
                  disabled={!selectedClass}
                >
                  Delete Class
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
