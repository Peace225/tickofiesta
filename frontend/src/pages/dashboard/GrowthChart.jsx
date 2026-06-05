import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function GrowthChart({ data, dark }) {
  return (
    <div className={`h-64 w-full ${dark ? 'bg-zinc-900/50' : 'bg-white'} p-6 rounded-3xl border ${dark ? 'border-zinc-800' : 'border-gray-100'} shadow-sm`}>
      <h3 className={`font-black mb-4 ${dark ? 'text-white' : 'text-gray-900'}`}>Croissance des abonnés</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="name" hide />
          <YAxis hide />
          <Tooltip 
            contentStyle={{ backgroundColor: dark ? '#18181b' : '#fff', borderRadius: '12px', border: 'none' }}
          />
          <Area type="monotone" dataKey="total" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorSub)" strokeWidth={3} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}