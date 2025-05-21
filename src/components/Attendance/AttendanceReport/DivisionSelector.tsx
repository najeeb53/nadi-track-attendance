
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DivisionSelectorProps {
  divisions: string[];
  selectedDivision: string;
  onValueChange: (value: string) => void;
  disabled: boolean;
}

export function DivisionSelector({ divisions, selectedDivision, onValueChange, disabled }: DivisionSelectorProps) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium mb-2">
        Select Division
      </label>
      <Select value={selectedDivision} onValueChange={onValueChange}>
        <SelectTrigger className="w-full" disabled={disabled}>
          <SelectValue placeholder="All Divisions" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Divisions</SelectItem>
          {divisions.map((division) => (
            <SelectItem key={division} value={division}>
              {division}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
