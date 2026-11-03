import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Card } from '../../components/common/Card';
import { Calendar, Clock, MapPin, GraduationCap } from 'lucide-react';
import { TimetableSession } from '../../types';

export const StudentTimetable: React.FC = () => {
  const [sessions, setSessions] = useState<TimetableSession[]>([]);
  const [loading, setLoading] = useState(true);

  const days = [
    { dayNumber: 1, name: 'Monday' },
    { dayNumber: 2, name: 'Tuesday' },
    { dayNumber: 3, name: 'Wednesday' },
    { dayNumber: 4, name: 'Thursday' },
    { dayNumber: 5, name: 'Friday' },
    { dayNumber: 6, name: 'Saturday' },
    { dayNumber: 7, name: 'Sunday' },
  ];

  useEffect(() => {
    const loadTimetable = async () => {
      try {
        setLoading(true);
        const res = await api.get('/timetable/my');
        setSessions(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadTimetable();
  }, []);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Class Lecture Timetable</h1>
        <p className="text-xs text-slate-500">Weekly schedule across Monday through Saturday</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
        {days.map((day) => {
          const daySessions = sessions.filter((s) => s.dayOfWeek === day.dayNumber);
          return (
            <div key={day.dayNumber} className="flex flex-col space-y-3">
              <div className="p-3 bg-[#1e1b4b] text-white rounded-2xl text-center shadow-sm">
                <span className="text-xs font-bold uppercase tracking-wider">{day.name}</span>
                <span className="block text-[10px] text-indigo-300 font-medium">
                  {daySessions.length} {daySessions.length === 1 ? 'Class' : 'Classes'}
                </span>
              </div>

              <div className="space-y-3 min-h-[300px]">
                {daySessions.length === 0 ? (
                  <div className="h-32 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-xs">
                    No Lectures
                  </div>
                ) : (
                  daySessions.map((s) => (
                    <Card
                      key={s.id}
                      className="p-3.5 space-y-2 border-l-4"
                      style={{ borderLeftColor: s.subject?.colorHex || '#6366f1' }}
                    >
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md inline-block">
                        {s.subject?.name}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 font-mono font-bold">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{s.startTime} - {s.endTime}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                        <GraduationCap className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="truncate">{s.teacher?.user?.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <MapPin className="w-3 h-3" />
                        <span>{s.roomNumber}</span>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

