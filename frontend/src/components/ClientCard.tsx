// src/components/ClientCard.tsx
import React from 'react';

type Client = {
  id: string;
  name: string;
  goal?: string;
  avatar?: string;
};

export default function ClientCard({ client }: { client: Client }) {
  return (
    <div className="bg-white p-4 rounded shadow">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-xl">
          {client.name?.[0] ?? 'C'}
        </div>
        <div>
          <div className="font-medium">{client.name}</div>
          <div className="text-sm text-gray-500">{client.goal}</div>
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <button className="px-3 py-1 border rounded text-sm">Details</button>
      </div>
    </div>
  );
}
