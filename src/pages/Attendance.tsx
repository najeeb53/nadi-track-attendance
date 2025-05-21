
import { AttendanceTabs } from "@/components/Attendance/AttendanceTabs";
import { AttendanceHeader } from "@/components/Attendance/AttendanceHeader";

export default function Attendance() {
  return (
    <div className="container mx-auto px-4 py-8">
      <AttendanceHeader />
      <AttendanceTabs />
    </div>
  );
}
