
import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { format } from "date-fns";
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';

interface ChartDataItem {
  name: string;
  value: number;
}

interface AttendanceSummaryChartProps {
  startDate: Date;
  endDate: Date | undefined;
  selectedDivision: string;
  loading: boolean;
  summaryData: ChartDataItem[];
}

export function AttendanceSummaryChart({ 
  startDate, 
  endDate, 
  selectedDivision, 
  loading, 
  summaryData 
}: AttendanceSummaryChartProps) {
  // Pie chart colors
  const COLORS = ['#0ea5e9', '#f97316'];
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Attendance Summary</CardTitle>
        <CardDescription>
          {format(startDate, "PPP")}
          {endDate && endDate !== startDate ? ` to ${format(endDate, "PPP")}` : ''}
          {selectedDivision && ` - Division: ${selectedDivision}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <p>Loading data...</p>
          </div>
        ) : (
          <div className="h-64">
            {summaryData.length > 0 && summaryData.some(item => item.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={summaryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {summaryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-muted-foreground">No attendance data available</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
