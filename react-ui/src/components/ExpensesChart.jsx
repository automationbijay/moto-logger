import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function ExpensesChart({ costs }) {
  const [timeRange, setTimeRange] = useState('All Time');
  
  // Format data for Recharts
  const data = [
    { name: 'Service', value: costs.service || 0, color: '#0f4c75' },
    { name: 'Upgrades', value: costs.upgrades || 0, color: '#c74b8f' },
    { name: 'Fuel', value: costs.fuel || 0, color: '#fca311' },
    { name: 'Tax', value: costs.tax || 0, color: '#ff6b6b' },
  ].filter(item => item.value > 0);

  // If no expenses at all, show a placeholder
  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center h-80">
        <p className="text-zinc-500">No expenses recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
      <div className="flex justify-start mb-2">
        <select 
          className="bg-transparent text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-500 cursor-pointer"
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
        >
          <option value="All Time" className="dark:bg-zinc-800">All Time</option>
          <option value="This Year" className="dark:bg-zinc-800">This Year</option>
          <option value="This Month" className="dark:bg-zinc-800">This Month</option>
        </select>
      </div>

      <h3 className="text-center text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-6">Expenses by Type</h3>

      <div className="h-56 w-full flex justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={0}
              outerRadius={90}
              paddingAngle={1}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={1} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => [`रू ${value.toLocaleString()}`, 'Cost']}
              contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '8px', color: '#fff' }}
              itemStyle={{ color: '#fff' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Custom Legend */}
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-2 mt-6 px-2">
        {data.map((entry, index) => (
          <div key={`legend-${index}`} className="flex items-center gap-1.5">
            <div 
              className="w-8 h-3 border border-white dark:border-zinc-800" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-[11px] font-medium text-zinc-800 dark:text-zinc-200">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
