// src/components/TimeHistogram.tsx
import React, { useState, useMemo } from 'react';
import { ProgressEntry } from '../types';
import { STRING_COLORS, getStringLabel, GUITAR_STRINGS } from '../utils/noteUtils';
import _ from 'lodash';

interface TimeHistogramProps {
  progress: ProgressEntry[];
}

const TimeHistogram: React.FC<TimeHistogramProps> = ({ progress }) => {
  const [filter, setFilter] = useState<number | 'all'>('all');
  const [maxTime, setMaxTime] = useState<number>(5000); // 5 seconds default max
  
  // Always show all 6 string options
  const allStrings = GUITAR_STRINGS;
  
  // Filter progress data based on selected string number
  const filteredData = useMemo(() => {
    if (!progress || progress.length === 0) {
      return [];
    }
    
    console.log("Filtering progress data:", progress);
    
    // Apply string filter if needed
    if (filter === 'all') {
      return progress;
    }
    
    return progress.filter(entry => {
      // Check if entry has stringNumber property (backward compatibility)
      if ('stringNumber' in entry) {
        return entry.stringNumber === filter;
      }
      
      // Fallback to string parsing if stringNumber not available
      if (typeof (entry as ProgressEntry).string === 'string') {
        // Extract the number from the string label (e.g., "1 (E)" -> 1)
        const stringNumber = parseInt((entry as ProgressEntry).string.charAt(0));
        return stringNumber === filter;
      }
      
      return false;
    });
  }, [progress, filter]);
  
  // Calculate time brackets for histogram
  const timeBrackets = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return Array.from({ length: 10 }, (_, i) => ({
        start: i * 500,
        end: (i + 1) * 500,
        count: 0,
        label: `${(i * 500 / 1000).toFixed(1)}s`
      }));
    }
    
    // Create a default max time if all entries have time 0
    let dataMaxTime = 5000; // Default to 5 seconds
    
    // Try to get max time from non-zero entries
    const nonZeroTimes = filteredData
      .map(entry => entry.timeTaken)
      .filter(time => time > 0);
    
    if (nonZeroTimes.length > 0) {
      dataMaxTime = Math.max(...nonZeroTimes);
    }
    
    const newMaxTime = Math.max(Math.ceil(dataMaxTime * 1.1), 5000); // Minimum 5 seconds
    
    if (newMaxTime > maxTime) {
      setMaxTime(newMaxTime);
    }
    
    // Create 10 time brackets
    const bracketSize = maxTime / 10;
    const brackets = Array.from({ length: 10 }, (_, i) => ({
      start: Math.round(i * bracketSize),
      end: Math.round((i + 1) * bracketSize),
      count: 0,
      label: `${(i * bracketSize / 1000).toFixed(1)}s`
    }));
    
    // Count entries in each bracket
    filteredData.forEach(entry => {
      // Place time=0 entries in the first bracket
      const time = Math.max(entry.timeTaken, 1); // Ensure at least 1ms
      const bracketIndex = Math.min(Math.floor(time / bracketSize), 9);
      brackets[bracketIndex].count++;
    });
    
    return brackets;
  }, [filteredData, maxTime]);
  
  // Get the max count for scaling
  const maxCount = useMemo(() => {
    return Math.max(...timeBrackets.map(bracket => bracket.count), 1);
  }, [timeBrackets]);
  
  // Calculate statistics, handling zero values appropriately
  const stats = useMemo(() => {
    if (filteredData.length === 0) {
      return { average: 0, fastest: 0 };
    }
    
    // Get all times, defaulting to 0 if undefined
    const times = filteredData.map(entry => entry.timeTaken || 0);
    
    // For average time, include all times
    const average = times.reduce((sum, time) => sum + time, 0) / times.length;
    
    // For fastest time, if all are 0, return 0
    const fastest = times.every(t => t === 0) ? 0 : Math.min(...times.filter(t => t > 0) || [0]);
    
    return { average, fastest };
  }, [filteredData]);
  
  // Handle filter change
  const handleFilterChange = (newFilter: number | 'all') => {
    setFilter(newFilter);
  };
  
  return (
    <div className="bg-gray-800 rounded-xl p-6 shadow-lg mt-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <h3 className="text-xl font-bold text-gray-300">Response Time Histogram</h3>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'all' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            All Strings
          </button>
          
          {allStrings.map(stringNumber => {
            const stringLabel = getStringLabel(stringNumber);
            return (
              <button
                key={stringNumber}
                onClick={() => handleFilterChange(stringNumber)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filter === stringNumber 
                    ? 'text-white' 
                    : 'text-gray-300 opacity-70 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: filter === stringNumber 
                    ? STRING_COLORS[stringNumber] 
                    : '#374151'
                }}
              >
                {stringLabel}
              </button>
            );
          })}
        </div>
      </div>
      
      {filteredData.length === 0 ? (
        <div className="bg-gray-700/30 rounded-lg p-8 text-center my-4">
          <p className="text-gray-400">
            No data available {filter !== 'all' ? `for ${getStringLabel(filter)} string` : ''}.
            Complete some challenges to see statistics!
          </p>
        </div>
      ) : (
        <div className="mt-6">
          <div className="h-64 flex items-end space-x-1">
            {timeBrackets.map((bracket, index) => (
              <div key={index} className="flex flex-col items-center flex-1 h-full">
                <div className="w-full group relative h-full flex flex-col justify-end">
                  {/* The bar element */}
                  <div 
                    className="w-full rounded-t transition-all duration-300 hover:opacity-90 border border-gray-600"
                    style={{ 
                      height: bracket.count > 0 
                        ? `${Math.max((bracket.count / maxCount) * 100, 5)}%` 
                        : '4px',
                      backgroundColor: filter !== 'all' 
                        ? STRING_COLORS[filter] 
                        : '#3B82F6',
                      opacity: bracket.count > 0 ? 1 : 0.3
                    }}
                  ></div>
                  
                  {/* Count label above bar */}
                  {bracket.count > 0 && (
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-300">
                      {bracket.count}
                    </div>
                  )}
                  
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                    {bracket.count} challenges
                    {filteredData.length > 0 && ` (${(bracket.count / filteredData.length * 100).toFixed(1)}%)`}
                  </div>
                </div>
                
                {/* X-axis labels */}
                <div className="text-xs text-gray-400 mt-2 text-center whitespace-nowrap">
                  {bracket.label}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-10 grid grid-cols-2 gap-4 text-center">
            <div className="bg-gray-700/50 rounded-lg p-3">
              <div className="text-sm text-gray-400">Average Time</div>
              <div className="text-xl font-mono mt-1">
                {(stats.average / 1000).toFixed(2)}s
              </div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-3">
              <div className="text-sm text-gray-400">Fastest Time</div>
              <div className="text-xl font-mono mt-1">
                {(stats.fastest / 1000).toFixed(2)}s
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeHistogram;