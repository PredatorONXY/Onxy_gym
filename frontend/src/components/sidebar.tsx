// src/components/Sidebar.tsx
import Link from 'next/link';
import React from 'react';

export default function Sidebar() {
  return (
    <div className="h-full bg-white border-r p-4">
      <ul className="space-y-2">
        <li><Link href="/dashboard/trainer" className="block p-2 rounded hover:bg-gray-100">Trainer Dashboard</Link></li>
        <li><Link href="/dashboard/client" className="block p-2 rounded hover:bg-gray-100">Client Dashboard</Link></li>
        <li><Link href="/auth/login" className="block p-2 rounded hover:bg-gray-100">Login</Link></li>
      </ul>
    </div>
  );
}
