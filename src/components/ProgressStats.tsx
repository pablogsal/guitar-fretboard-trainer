import React from 'react';
import { ProgressEntry } from '../types';
import { STRING_COLORS } from '../utils/noteUtils';
import _ from 'lodash';

interface ProgressStatsProps {
  progress: ProgressEntry[];
  elapsedTime: number;
  correctNotes: string[];
  errorCount?: number;
  maxErrors?: number;
}

const ProgressStats: React.FC<ProgressStatsProps> = ({
  progress,
  elapsedTime,
  correctNotes,
  errorCount = 0,
  maxErrors = 3
}) => {
  // Calculate success rate
  const successRate = progress.length > 0
    ? (progress.filter(entry => entry.success).length / progress.length) * 100
    : 0;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
        <h3 className="text-xl font-bold mb-4 text-gray-300">Current Session</h3>
        <div className="flex justify-between mb-4">
          <div>
            <div className="text-sm text-gray-400">ELAPSED TIME</div>
            <div className="text-2xl font-mono">
              {(elapsedTime / 1000).toFixed(2)}s
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-400">CHALLENGES</div>
            <div className="text-2xl font-mono">{progress.length}</div>
          </div>
          <div>
            <div className="text-sm text-gray-400">SUCCESS RATE</div>
            <div className="text-2xl font-mono">
              {successRate.toFixed(0)}%
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Current Challenge</span>
            <span>{correctNotes.length}/2 notes</span>
          </div>
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
              style={{ width: `${Math.min(100, (correctNotes.length / 2) * 100)}%` }}
            ></div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Error Tolerance</span>
            <span>{errorCount}/{maxErrors} errors</span>
          </div>
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full transition-all"
              style={{ 
                width: `${Math.min(100, (errorCount / maxErrors) * 100)}%`,
                backgroundColor: errorCount === 0 ? '#10B981' : 
                               errorCount < maxErrors - 1 ? '#FBBF24' : 
                               '#EF4444'
              }}
            ></div>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
        <h3 className="text-xl font-bold mb-4 text-gray-300">Last 5 Challenges</h3>
        <div className="space-y-2">
          {progress.slice(-5).reverse().map((entry, i) => (
            <div key={i} className="flex justify-between p-2 bg-gray-700/50 rounded">
              <div className="flex items-center">
                <div 
                  className="w-3 h-12 mr-3 rounded-sm" 
                  style={{ backgroundColor: STRING_COLORS[parseInt(entry.string)] }}
                ></div>
                <div>
                  <div className="font-semibold flex items-center">
                    {entry.note}
                    {entry.success 
                      ? <span className="ml-2 text-xs bg-green-500/20 text-green-300 px-1.5 py-0.5 rounded">Success</span>
                      : <span className="ml-2 text-xs bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded">Failed</span>
                    }
                  </div>
                  <div className="text-sm text-gray-400">{entry.string} string</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono">{(entry.timeTaken / 1000).toFixed(2)}s</div>
                <div className="text-sm text-gray-400">
                  {entry.errors > 0 && <span className="text-red-400">{entry.errors} errors</span>}
                </div>
              </div>
            </div>
          ))}
          {progress.length === 0 && (
            <div className="text-center text-gray-500 py-4">No challenges completed yet</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressStats;