import React from 'react';
import { 
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

export default function MonthlyChart({ data }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="bg-[#18181b] dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm mt-4">
      <h3 className="text-center text-sm font-bold text-zinc-100 mb-6 tracking-wide">
        Expenses and Distance Traveled by Month
      </h3>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 10, right: 0, left: 0, bottom: 20 }}
          >
            <CartesianGrid stroke="#27272a" vertical={false} />
            <XAxis 
              dataKey="month" 
              tick={{ fill: '#a1a1aa', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              angle={-30}
              textAnchor="end"
              dy={10}
              interval={0}
            />
            {/* Left YAxis: Expenses */}
            <YAxis 
              yAxisId="left" 
              tick={{ fill: '#e4e4e7', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => val.toLocaleString()}
              width={45}
            />
            {/* Right YAxis: Distance */}
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              tick={{ fill: '#e4e4e7', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => val.toLocaleString()}
              width={45}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '8px', color: '#fff' }}
              itemStyle={{ color: '#fff' }}
              formatter={(value, name) => [value.toLocaleString(), name === 'expense' ? 'Cost (रू)' : 'Distance (km)']}
            />
            
            {/* Bar for Expenses */}
            <Bar 
              yAxisId="left" 
              dataKey="expense" 
              barSize={24}
              radius={[2, 2, 0, 0]}
            >
              {data.map((entry, index) => {
                const colors = ['#9dbb74', '#7aa361', '#e6c46a', '#d97757', '#e6a456', '#e6c46a', '#d95a4e', '#d97757', '#bed28b', '#0f7d5c', '#2c3e2e', '#4da96c'];
                return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
              })}
            </Bar>
            
            {/* Line for Distance */}
            <Line 
              yAxisId="right" 
              type="linear" 
              dataKey="distance" 
              stroke="#ffffff" 
              strokeWidth={2}
              dot={{ r: 4, fill: '#000', stroke: '#fff', strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
