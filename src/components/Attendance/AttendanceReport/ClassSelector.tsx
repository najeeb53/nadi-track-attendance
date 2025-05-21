
import React from 'react';
import { Class } from "@/services/SupabaseService";

interface ClassSelectorProps {
  classes: Class[];
  selectedClass: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled: boolean;
}

export function ClassSelector({ classes, selectedClass, onChange, disabled }: ClassSelectorProps) {
  return (
    <div>
      <label htmlFor="report-class-select" className="block text-sm font-medium mb-2">
        Select Class or Subject
      </label>
      <select
        id="report-class-select"
        value={selectedClass}
        onChange={onChange}
        className="w-full p-2 border rounded-md"
        disabled={disabled}
      >
        <option value="" disabled>Select a class</option>
        {classes.map((classItem) => (
          <option key={classItem.id} value={classItem.id}>
            {classItem.name}
          </option>
        ))}
      </select>
    </div>
  );
}
