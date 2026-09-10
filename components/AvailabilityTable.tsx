'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { DAYS, TIME_SLOTS, STATUS_CONFIG, TOTAL_SLOTS } from '@/lib/constants';
import { AvailabilityRecord, AvailabilityStatus, Member } from '@/lib/types';
import StatusSelector from './StatusSelector';
import ProgressCounter from './ProgressCounter';
import { Check, Clock, UserCheck, ShieldAlert, Eye, Edit3, ChevronDown, ChevronUp } from 'lucide-react';

interface AvailabilityTableProps {
  currentMemberId: string;
  currentMemberName: string;
  initialAvailability: AvailabilityRecord[];
  allMembers: Member[];
}

export default function AvailabilityTable({
  currentMemberId,
  currentMemberName,
  initialAvailability,
  allMembers,
}: AvailabilityTableProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(currentMemberId);
  const [records, setRecords] = useState<AvailabilityRecord[]>(initialAvailability);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>(
    DAYS.reduce((acc, day) => ({ ...acc, [day]: true }), {})
  );

  const toggleDay = (day: string) => {
    setExpandedDays((prev) => ({ ...prev, [day]: !prev[day] }));
  };


  const isSelf = selectedMemberId === currentMemberId;
  const selectedMember = allMembers.find((m) => m.id === selectedMemberId) || {
    id: selectedMemberId,
    name: selectedMemberId,
    email: '',
  };

  // Helper to find a record for the selected member
  const getRecord = (day: string, timeSlot: string): AvailabilityRecord | undefined => {
    return records.find(
      (r) => r.member_id === selectedMemberId && r.day === day && r.time_slot === timeSlot
    );
  };

  // Auto-save status change immediately
  const handleStatusChange = async (day: string, timeSlot: string, newStatus: AvailabilityStatus) => {
    if (!isSelf) return; // Read-only for other members

    const key = `${day}-${timeSlot}`;
    setSavingKey(key);

    // Optimistic UI update
    const previousRecords = [...records];
    const existingIndex = records.findIndex(
      (r) => r.member_id === currentMemberId && r.day === day && r.time_slot === timeSlot
    );

    let updatedRecords: AvailabilityRecord[];
    if (existingIndex >= 0) {
      updatedRecords = [...records];
      updatedRecords[existingIndex] = {
        ...updatedRecords[existingIndex],
        status: newStatus,
        updated_at: new Date().toISOString(),
      };
    } else {
      updatedRecords = [
        ...records,
        {
          member_id: currentMemberId,
          day,
          time_slot: timeSlot,
          status: newStatus,
          remarks: '',
          updated_at: new Date().toISOString(),
        },
      ];
    }
    setRecords(updatedRecords);

    try {
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day,
          time_slot: timeSlot,
          status: newStatus,
          remarks: getRecord(day, timeSlot)?.remarks || '',
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to save');
      }

      toast.success(`Saved ✓ (${day} ${timeSlot})`, {
        duration: 2000,
      });
    } catch (err: any) {
      console.error('Error saving status:', err);
      setRecords(previousRecords);
      toast.error('Failed to save availability. Please try again.');
    } finally {
      setSavingKey(null);
    }
  };

  // Auto-save remarks on blur
  const handleRemarksBlur = async (day: string, timeSlot: string, newRemarks: string) => {
    if (!isSelf) return;

    const currentRec = getRecord(day, timeSlot);
    const oldRemarks = currentRec?.remarks || '';
    if (oldRemarks === newRemarks) return; // No change

    const key = `${day}-${timeSlot}`;
    setSavingKey(key);

    try {
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day,
          time_slot: timeSlot,
          status: currentRec?.status || 'available',
          remarks: newRemarks,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to save remarks');
      }

      // Update local state
      setRecords((prev) => {
        const idx = prev.findIndex(
          (r) => r.member_id === currentMemberId && r.day === day && r.time_slot === timeSlot
        );
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], remarks: newRemarks };
          return copy;
        }
        return [
          ...prev,
          {
            member_id: currentMemberId,
            day,
            time_slot: timeSlot,
            status: 'available',
            remarks: newRemarks,
            updated_at: new Date().toISOString(),
          },
        ];
      });

      toast.success(`Note saved ✓`, { duration: 1800 });
    } catch (err) {
      console.error('Error saving remarks:', err);
      toast.error('Failed to save remarks.');
    } finally {
      setSavingKey(null);
    }
  };

  // Count filled slots for the currently viewed member
  const memberRecords = records.filter((r) => r.member_id === selectedMemberId);
  const filledCount = memberRecords.filter((r) => Boolean(r.status)).length;

  return (
    <div className="space-y-6">
      {/* Top Controls: Member Selector for Read-only inspection + Progress */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Weekly Availability
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            {isSelf
              ? `Click a status to immediately save your schedule. All ${TOTAL_SLOTS} slots are required.`
              : `Viewing ${selectedMember.name}'s schedule (Read-only).`}
          </p>
        </div>

        {/* Member View Switcher (Self + Read-only team members) */}
        <div className="flex items-center gap-1.5 p-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto max-w-full">
          {allMembers.map((member) => {
            const isSelected = selectedMemberId === member.id;
            const isUserSelf = member.id === currentMemberId;

            return (
              <button
                key={member.id}
                onClick={() => setSelectedMemberId(member.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-navy-700 text-white shadow-md shadow-navy-700/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{member.name}</span>
                {isUserSelf ? (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/20 text-white font-semibold">
                    You
                  </span>
                ) : (
                  <Eye className="w-3 h-3 opacity-60" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Progress Counter Card */}
      <ProgressCounter
        filledCount={filledCount}
        totalCount={TOTAL_SLOTS}
        memberName={selectedMember.name}
        isSelf={isSelf}
      />

      {/* Mode Indicator Banner */}
      {!isSelf && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 text-xs font-semibold text-amber-800">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-600" />
            <span>
              You are in <strong>Read-Only</strong> mode inspecting {selectedMember.name}&apos;s schedule.
            </span>
          </div>
          <button
            onClick={() => setSelectedMemberId(currentMemberId)}
            className="px-3 py-1 bg-amber-200/70 hover:bg-amber-300 text-amber-900 rounded-lg transition-colors font-bold"
          >
            Switch to My Schedule
          </button>
        </div>
      )}

      {/* Mobile Card-Based Layout (md:hidden) */}
      <div className="md:hidden space-y-4">
        {DAYS.map((day) => {
          const isExpanded = expandedDays[day] ?? true;
          const daySlotsFilled = TIME_SLOTS.filter(
            (slot) => Boolean(getRecord(day, slot)?.status)
          ).length;

          return (
            <div
              key={day}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden"
            >
              {/* Day Accordion Header */}
              <button
                type="button"
                onClick={() => toggleDay(day)}
                className="w-full py-3.5 px-4 bg-[#1F4E79] text-white flex items-center justify-between text-left transition-colors hover:bg-navy-800"
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-extrabold text-base tracking-tight">{day}</span>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      daySlotsFilled === TIME_SLOTS.length
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white/20 text-navy-100'
                    }`}
                  >
                    {daySlotsFilled}/{TIME_SLOTS.length} Set
                  </span>
                </div>
                <div className="text-white/80">
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </button>

              {/* Slot Cards List */}
              {isExpanded && (
                <div className="p-3 space-y-3 bg-slate-50/50">
                  {TIME_SLOTS.map((timeSlot) => {
                    const record = getRecord(day, timeSlot);
                    const status = record?.status;
                    const remarks = record?.remarks || '';
                    const key = `${day}-${timeSlot}`;
                    const isSaving = savingKey === key;

                    // Left border color & card background
                    let cardBorder = 'border-l-4 border-l-slate-300 bg-white';
                    if (status === 'available') {
                      cardBorder = 'border-l-4 border-l-[#70AD47] bg-emerald-50/40';
                    } else if (status === 'not_available') {
                      cardBorder = 'border-l-4 border-l-[#FF0000] bg-rose-50/40';
                    } else if (status === 'maybe') {
                      cardBorder = 'border-l-4 border-l-[#FFAB00] bg-amber-50/40';
                    }

                    return (
                      <div
                        key={key}
                        className={`rounded-2xl p-3.5 border border-slate-200/80 shadow-xs space-y-2.5 ${cardBorder}`}
                      >
                        {/* Time Slot Label + Status Indicator */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs sm:text-sm">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{timeSlot}</span>
                          </div>

                          {isSaving ? (
                            <span className="text-[11px] font-bold text-navy-700 animate-pulse flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-navy-700 animate-ping" />
                              Saving...
                            </span>
                          ) : status ? (
                            <span className="text-[11px] font-bold text-slate-600">
                              {STATUS_CONFIG[status]?.emoji} {STATUS_CONFIG[status]?.label}
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-slate-400">
                              Not set
                            </span>
                          )}
                        </div>

                        {/* Full Width 3-Button Status Selector */}
                        <StatusSelector
                          value={status}
                          onChange={(newStatus) => handleStatusChange(day, timeSlot, newStatus)}
                          disabled={isSaving || !isSelf}
                          readOnly={!isSelf}
                          fullWidth
                        />

                        {/* Remarks Input or Display */}
                        {isSelf ? (
                          <input
                            type="text"
                            maxLength={100}
                            defaultValue={remarks}
                            placeholder="Add remark (e.g., Lab free, Exam)..."
                            onBlur={(e) => handleRemarksBlur(day, timeSlot, e.target.value.trim())}
                            className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300/80 bg-white focus:border-navy-600 focus:ring-2 focus:ring-navy-600/20 placeholder:text-slate-400 transition-all outline-none"
                          />
                        ) : (
                          remarks && (
                            <div className="text-xs text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 font-medium">
                              <span className="text-slate-400 font-semibold mr-1">Note:</span> {remarks}
                            </div>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Mobile Quick Legend */}
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2">
          <span className="font-bold text-slate-800 block">Status Legend:</span>
          <div className="grid grid-cols-3 gap-1.5 text-[11px]">
            <span className="px-2 py-1 rounded-lg bg-[#C6EFCE] text-[#375623] font-bold text-center">
              ✅ Available (+2)
            </span>
            <span className="px-2 py-1 rounded-lg bg-[#FFEB9C] text-[#7D4E00] font-bold text-center">
              ⚠️ Maybe (+1)
            </span>
            <span className="px-2 py-1 rounded-lg bg-[#FFC7CE] text-[#9C0006] font-bold text-center">
              ❌ Not Avail (0)
            </span>
          </div>
        </div>
      </div>

      {/* Main Desktop Availability 25-Slot Table (hidden on mobile, visible on md+) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[70vh]">
          <table className="w-full min-w-[620px] text-left border-collapse">
            {/* Frozen Header Row */}
            <thead className="sticky top-0 z-30 bg-[#1F4E79] text-white shadow-sm">
              <tr>
                <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider w-36 border-r border-navy-800">
                  Day
                </th>
                <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider w-44 border-r border-navy-800">
                  Time Slot
                </th>
                <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider border-r border-navy-800">
                  Availability {isSelf && <span className="text-[10px] lowercase text-navy-200 font-normal">(auto-saves)</span>}
                </th>
                <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider w-52 sm:w-64">
                  Remarks / Notes
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200/80 text-sm">
              {DAYS.map((day) => {
                return TIME_SLOTS.map((timeSlot, slotIndex) => {
                  const record = getRecord(day, timeSlot);
                  const status = record?.status;
                  const remarks = record?.remarks || '';
                  const key = `${day}-${timeSlot}`;
                  const isSaving = savingKey === key;

                  // Row background styling based on status
                  let rowBgClass = 'bg-[#F5F5F5] hover:bg-[#EFEFEF]';
                  if (status === 'available') {
                    rowBgClass = 'bg-[#C6EFCE]/90 hover:bg-[#BDE8C5]';
                  } else if (status === 'not_available') {
                    rowBgClass = 'bg-[#FFC7CE]/90 hover:bg-[#F8BAC1]';
                  } else if (status === 'maybe') {
                    rowBgClass = 'bg-[#FFEB9C]/90 hover:bg-[#F5DF8E]';
                  }

                  return (
                    <tr
                      key={key}
                      className={`transition-colors duration-150 ${rowBgClass}`}
                    >
                      {/* Day Column (merged/rowspan=5 for first slot of the day) */}
                      {slotIndex === 0 && (
                        <td
                          rowSpan={TIME_SLOTS.length}
                          className="py-4 px-4 bg-[#1F4E79] text-white font-extrabold text-base align-middle text-center border-r border-navy-800 border-b-2 border-b-white/20 select-none"
                        >
                          <div className="flex flex-col items-center justify-center gap-1">
                            <span>{day}</span>
                            <span className="text-[10px] font-medium text-navy-200 uppercase tracking-widest bg-navy-900/60 px-2 py-0.5 rounded-full">
                              {TIME_SLOTS.length} Slots
                            </span>
                          </div>
                        </td>
                      )}

                      {/* Time Slot Column */}
                      <td className="py-3.5 px-4 font-semibold text-slate-800 border-r border-slate-200/70 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{timeSlot}</span>
                        </div>
                      </td>

                      {/* Availability Selector Column */}
                      <td className="py-2.5 px-4 border-r border-slate-200/70">
                        <div className="flex items-center gap-3">
                          <StatusSelector
                            value={status}
                            onChange={(newStatus) => handleStatusChange(day, timeSlot, newStatus)}
                            disabled={isSaving || !isSelf}
                            readOnly={!isSelf}
                          />
                          {isSaving && (
                            <span className="text-xs font-semibold text-navy-700 animate-pulse flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-navy-700 animate-ping" />
                              Saving...
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Remarks Column (auto-save on blur) */}
                      <td className="py-2.5 px-4">
                        {isSelf ? (
                          <input
                            type="text"
                            maxLength={100}
                            defaultValue={remarks}
                            placeholder="Add remark (e.g., Lab free)..."
                            onBlur={(e) => handleRemarksBlur(day, timeSlot, e.target.value.trim())}
                            className="w-full px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-300/80 bg-white/80 focus:bg-white focus:border-navy-600 focus:ring-2 focus:ring-navy-600/20 placeholder:text-slate-400 transition-all outline-none"
                          />
                        ) : (
                          <span className="text-xs font-medium text-slate-600 italic">
                            {remarks || '—'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Summary / Quick Legend */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 font-medium">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-bold text-slate-700">Status Legend:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#C6EFCE] border border-[#70AD47]" />
              <span>✅ Available (+2 pts)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#FFEB9C] border border-[#FFAB00]" />
              <span>⚠️ Maybe (+1 pt)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#FFC7CE] border border-[#FF0000]" />
              <span>❌ Not Available (0 pts)</span>
            </div>
          </div>

          <span className="text-slate-400 text-[11px]">
            Changes synchronize automatically to Supabase.
          </span>
        </div>
      </div>
    </div>
  );
}
