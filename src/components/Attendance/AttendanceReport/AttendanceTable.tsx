
import React from 'react';
import { Student } from "@/services/SupabaseService";
import { ArrowDown, ArrowUp } from "lucide-react";

interface ExtendedStudent extends Student {
  presentDays?: number;
  totalDays?: number;
  absentDays?: number;
  attendancePercentage?: number;
}

type SortDirection = 'asc' | 'desc';
type SortField = keyof ExtendedStudent;

interface AttendanceTableProps {
  students: ExtendedStudent[];
  loading: boolean;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  showAttendanceColumns?: boolean;
}

export function AttendanceTable({ 
  students,
  loading,
  sortField,
  sortDirection,
  onSort,
  showAttendanceColumns = false
}: AttendanceTableProps) {
  
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return null;
    }
    
    return sortDirection === 'asc' ? 
      <ArrowUp className="inline-block ml-1 h-4 w-4" /> : 
      <ArrowDown className="inline-block ml-1 h-4 w-4" />;
  };
  
  return (
    <>
      {loading ? (
        <div className="text-center py-8">
          <p>Loading data...</p>
        </div>
      ) : students.length > 0 ? (
        <div className="overflow-x-auto mt-4">
          <table className="nadi-table w-full">
            <thead>
              <tr>
                <th onClick={() => onSort('trNo')} className="cursor-pointer">
                  Tr. No. {getSortIcon('trNo')}
                </th>
                <th onClick={() => onSort('name')} className="cursor-pointer">
                  Name {getSortIcon('name')}
                </th>
                <th onClick={() => onSort('division')} className="cursor-pointer">
                  Division {getSortIcon('division')}
                </th>
                <th onClick={() => onSort('subject')} className="cursor-pointer">
                  Subject {getSortIcon('subject')}
                </th>
                
                {showAttendanceColumns && (
                  <>
                    <th onClick={() => onSort('presentDays')} className="cursor-pointer">
                      Present {getSortIcon('presentDays')}
                    </th>
                    <th onClick={() => onSort('absentDays')} className="cursor-pointer">
                      Absent {getSortIcon('absentDays')}
                    </th>
                    <th onClick={() => onSort('totalDays')} className="cursor-pointer">
                      Total {getSortIcon('totalDays')}
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
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
                  
                  {showAttendanceColumns && (
                    <>
                      <td>{student.presentDays || 0}</td>
                      <td>{student.absentDays || 0}</td>
                      <td>{student.totalDays || 0}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8">
          <p>No students found</p>
        </div>
      )}
    </>
  );
}
