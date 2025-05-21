
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ReportTypeTabsProps {
  selectedTab: string;
  onValueChange: (value: string) => void;
}

export function ReportTypeTabs({ selectedTab, onValueChange }: ReportTypeTabsProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        Report Type
      </label>
      <Tabs defaultValue="daily" value={selectedTab} onValueChange={onValueChange}>
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
