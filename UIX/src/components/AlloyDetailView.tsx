import React from 'react';
import { Users } from 'lucide-react';

export const AlloyDetailView = () => {
  return (
    <div className="p-8 flex items-center justify-center h-[60vh]">
      <div className="text-center space-y-4">
        <div className="size-20 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-500 mx-auto">
          <Users size={40} />
        </div>
        <h2 className="text-2xl font-bold text-white">AlloyDB CRM Detail</h2>
        <p className="text-slate-400 max-w-md mx-auto">
          Detailed view for AlloyDB CRM is currently under development. 
          Check back soon for real-time customer insights and relationship mapping.
        </p>
      </div>
    </div>
  );
};
