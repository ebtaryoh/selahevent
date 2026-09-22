"use client";

import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

export function RegistrationChart({ data }: { data: { date: string; count: number }[] }) {
  // Format dates for display
  const chartData = useMemo(() => {
    return data.map(d => ({
      ...d,
      displayDate: format(new Date(d.date), "MMM d")
    }));
  }, [data]);

  return (
    <div className="h-[300px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#c08a2e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#c08a2e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(22,19,17,0.1)" />
          <XAxis 
            dataKey="displayDate" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: "var(--color-warm-500)" }}
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: "var(--color-warm-500)" }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "#ffffff", 
              borderRadius: "8px", 
              border: "1px solid rgba(22,19,17,0.1)",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
            }}
            itemStyle={{ color: "#161311", fontWeight: "600" }}
          />
          <Area 
            type="monotone" 
            dataKey="count" 
            name="Registrations"
            stroke="#c08a2e" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorCount)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
