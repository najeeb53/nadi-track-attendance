
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AttendanceForm } from "@/components/Attendance/AttendanceForm";
import { AttendanceReport } from "@/components/Attendance/AttendanceReport";

export default function Attendance() {
  const [activeTab, setActiveTab] = useState("mark");
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Attendance & Reports</h1>
      
      <Tabs defaultValue="mark" value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="mark">Mark Attendance</TabsTrigger>
          <TabsTrigger value="reports">View Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="mark">
          <AttendanceForm />
        </TabsContent>
        
        <TabsContent value="reports">
          <AttendanceReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
