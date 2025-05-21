
import React from 'react';
import { Student } from "@/services/SupabaseService";

interface ExtendedStudent extends Student {
  presentDays?: number;
  totalDays?: number;
}

interface AttendanceTableProps {
  selectedTab: string;
  selectedClass: string;
  selectedDivision: string;
  loading: boolean;
  attendanceData: ExtendedStudent[];
}

export function AttendanceTable({ 
  selectedTab, 
  selectedClass, 
  selectedDivision, 
  loading, 
  attendanceData 
}: AttendanceTableProps) {
  return (
    <>
      {loading ? (
        <div className="text-center py-8">
          <p>Loading attendance data...</p>
        </div>
      ) : selectedClass && attendanceData.length > 0 ? (
        <div className="overflow-x-auto mt-4">
          <table className="nadi-table">
            <thead>
              <tr>
                <th>Tr. No.</th>
                <th>Name</th>
                <th>Division</th>
                <th>Subject</th>
                {selectedTab !== "daily" && (
                  <th>Present Days</th>
                )}
              </tr>
            </thead>
            <tbody>
              {attendanceData.map((student: ExtendedStudent) => (
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
                  <td>{student.division || "-"}</td>
                  <td>{student.subject || "-"}</td>
                  {selectedTab !== "daily" && (
                    <td className="text-green-600">{student.presentDays}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8">
          {!selectedClass ? (
            <p>Please select a class to view reports</p>
          ) : (
            <p>No students marked present {selectedDivision ? `in division ${selectedDivision}` : 'in this class'}</p>
          )}
        </div>
      )}
    </>
  );
}
