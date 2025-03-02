import React from 'react';
import { ProgressEntry } from '../types';
import { STRING_COLORS } from '../utils/noteUtils';
import _ from 'lodash';

interface ProgressStatsProps {
  progress: ProgressEntry[];
  elapsedTime: number;
  correctNotes: string[];
}

const ProgressStats: React.FC<ProgressStatsProps> = ({
  progress,
  elapsedTime,
  correctNotes
}) => {
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
            <div className="text-sm text-gray-400">AVG TIME</div>
            <div className="text-2xl font-mono">
              {progress.length ? (_.meanBy(progress, 'timeTaken') / 1000).toFixed(2) : '0.00'}s
            </div>
          </div>
        </div>
        
        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
            style={{ width: `${Math.min(100, (correctNotes.length / 2) * 100)}%` }}
          ></div>
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
                  style={{ backgroundColor: STRING_COLORS[entry.string] }}
                ></div>
                <div>
                  <div className="font-semibold">{entry.note}</div>
                  <div className="text-sm text-gray-400">{entry.string} string</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono">{(entry.timeTaken / 1000).toFixed(2)}s</div>
                <div className="text-sm text-gray-400">
                  {new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
