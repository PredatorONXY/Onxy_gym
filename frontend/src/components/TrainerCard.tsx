"use client";

import { useState } from "react";
import { FiEdit2, FiTrash2, FiCopy, FiChevronDown } from "react-icons/fi";

type MealPlan = {
  morning?: string;
  afternoon?: string;
  evening?: string;
  night?: string;
  preWorkout?: string;
  postWorkout?: string;
  [key: string]: string | undefined;
};

type DietChart = {
  id: string;
  title: string;
  active: boolean;
  meals: MealPlan;
  createdDate?: string;
};

interface DietChartCardProps {
  chart: DietChart;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export default function DietChartCard({
  chart,
  onEdit,
  onDelete,
  onDuplicate,
}: DietChartCardProps) {
  const [expanded, setExpanded] = useState(false);

  const mealTimes = Object.keys(chart.meals).filter(
    (key) => chart.meals[key] && chart.meals[key]?.trim() !== ""
  );

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-3 transition-all duration-200">
      {/* Card Header */}
      <div
        className="bg-gray-50 px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-gray-100"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-3">
          <span
            className={`w-3 h-3 rounded-full flex-shrink-0 ${
              chart.active ? "bg-green-500" : "bg-gray-300"
            }`}
          />
          <div>
            <h4 className="font-medium text-gray-800">{chart.title}</h4>
            {chart.createdDate && (
              <p className="text-xs text-gray-500">
                Created: {chart.createdDate}
              </p>
            )}
          </div>
        </div>
        <FiChevronDown
          className={`text-gray-500 transition-transform transform ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="p-4 bg-white border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {mealTimes.map((time) => (
              <div key={time} className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center">
                  <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                  <h5 className="text-sm font-medium text-gray-700 capitalize">
                    {time.replace(/([A-Z])/g, " $1").trim()}
                  </h5>
                </div>
                <p className="text-gray-900 mt-1 pl-4">
                  {chart.meals[time]}
                </p>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 border-t pt-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="flex items-center px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
            >
              <FiEdit2 className="mr-1.5" /> Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
              className="flex items-center px-3 py-1.5 text-sm bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
            >
              <FiCopy className="mr-1.5" /> Duplicate
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="flex items-center px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
            >
              <FiTrash2 className="mr-1.5" /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
