'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { DAYS, TIME_SLOTS, STATUS_CONFIG, TOTAL_SLOTS } from '@/lib/constants';
import { AvailabilityRecord, AvailabilityStatus, Member } from '@/lib/types';
import StatusSelector from './StatusSelector';
import ProgressCounter from './ProgressCounter';
import { Clock, Eye, ChevronDown, ChevronUp } from 'lucide-react';

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
  const [, startTransition] = useTransition();
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
    if (!isSelf) return;

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

      toast.success(`Saved (${day} ${timeSlot})`, {
        id: 'slot-saved',
        duration: 1500,
      });
    } catch (err: any) {
      console.error('Error saving status:', err);
      setRecords(previousRecords);
      toast.error('Failed to save availability. Please try again.', { id: 'slot-saved' });
    } finally {
      setSavingKey(null);
    }
  };

  // Auto-save remarks on blur
  const handleRemarksBlur = async (day: string, timeSlot: string, newRemarks: string) => {
    if (!isSelf) return;

    const currentRec = getRecord(day, timeSlot);
    const oldRemarks = currentRec?.remarks || '';
    if (oldRemarks === newRemarks) return;

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

      toast.success(`Note saved`, { duration: 1800 });
    } catch (err) {
      console.error('Error saving remarks:', err);
      toast.error('Failed to save remarks.');
    } finally {
      setSavingKey(null);
    }
  };

  const memberRecords = records.filter((r) => r.member_id === selectedMemberId);
  const filledCount = memberRecords.filter((r) => Boolean(r.status)).length;

  return (
    <div className="space-y-8">
      {/* Top Controls: Member Selector for Read-only inspection + Progress */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-2 border-black pb-4">
        <div>
          <span className="font-mono text-[10px] tracking-widest uppercase text-[#525252] block mb-1">
            INDIVIDUAL MATRIX ENTRY
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-black uppercase">
            Schedule Entry
          </h1>
          <p className="font-body text-xs sm:text-sm text-[#525252] mt-1">
            {isSelf
              ? `Select status per cell to persist schedule instantly. All ${TOTAL_SLOTS} slots required.`
              : `Inspecting ${selectedMember.name}'s schedule in read-only telemetry mode.`}
          </p>
        </div>

        {/* Member View Switcher */}
        <div className="flex items-center border border-black p-0.5 bg-white overflow-x-auto max-w-full">
          {allMembers.map((member) => {
            const isSelected = selectedMemberId === member.id;
            const isUserSelf = member.id === currentMemberId;

            return (
              <button
                key={member.id}
                onClick={() => setSelectedMemberId(member.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider whitespace-nowrap transition-invert ${
                  isSelected
                    ? 'bg-black text-white font-bold'
                    : 'bg-white text-black hover:bg-[#F5F5F5]'
                }`}
              >
                <span>{member.name}</span>
                {isUserSelf ? (
                  <span className="text-[9px] px-1 bg-white/20 text-white font-bold border border-white/30">
                    YOU
                  </span>
                ) : (
                  <Eye className="w-3 h-3 opacity-60" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Progress Counter */}
      <ProgressCounter
        filledCount={filledCount}
        totalCount={TOTAL_SLOTS}
        memberName={selectedMember.name}
        isSelf={isSelf}
      />

      {/* Mode Indicator Banner */}
      {!isSelf && (
        <div className="p-4 bg-black text-white border border-black flex items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-white" />
            <span>
              READ-ONLY MODE: Inspecting <strong>{selectedMember.name}</strong>&apos;s schedule.
            </span>
          </div>
          <button
            onClick={() => setSelectedMemberId(currentMemberId)}
            className="px-3 py-1 bg-white text-black border border-white hover:bg-[#E5E5E5] transition-invert font-mono text-xs uppercase tracking-wider font-bold"
          >
            My Schedule &rarr;
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
              className="bg-white border-2 border-black overflow-hidden"
            >
              {/* Day Accordion Header */}
              <button
                type="button"
                onClick={() => toggleDay(day)}
                className="w-full py-3.5 px-4 bg-black text-white flex items-center justify-between text-left border-b border-black"
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-serif text-base font-bold uppercase tracking-wider">{day}</span>
                  <span className="font-mono text-[9px] uppercase px-2 py-0.5 bg-white text-black border border-white font-bold">
                    {daySlotsFilled}/{TIME_SLOTS.length} SET
                  </span>
                </div>
                <div className="text-white">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {/* Slot Cards List */}
              {isExpanded && (
                <div className="p-3 space-y-3 bg-[#FAFAFA]">
                  {TIME_SLOTS.map((timeSlot) => {
                    const record = getRecord(day, timeSlot);
                    const status = record?.status;
                    const remarks = record?.remarks || '';
                    const key = `${day}-${timeSlot}`;
                    const isSaving = savingKey === key;

                    return (
                      <div
                        key={key}
                        className="p-3.5 border border-black bg-white space-y-2.5"
                      >
                        {/* Time Slot Label + Status Indicator */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 font-mono font-bold text-black text-xs">
                            <Clock className="w-3.5 h-3.5 text-[#525252] shrink-0" />
                            <span>{timeSlot}</span>
                          </div>

                          {isSaving ? (
                            <span className="font-mono text-[10px] uppercase font-bold text-black animate-pulse">
                              SAVING...
                            </span>
                          ) : status ? (
                            <span className="font-mono text-[10px] uppercase font-bold text-black">
                              {STATUS_CONFIG[status]?.emoji} {STATUS_CONFIG[status]?.label}
                            </span>
                          ) : (
                            <span className="font-mono text-[10px] uppercase text-[#737373]">
                              NOT SET
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
                            className="w-full px-2 py-1 text-xs font-mono border-b-2 border-black rounded-none bg-transparent focus:bg-white outline-none placeholder:text-[#A3A3A3]"
                          />
                        ) : (
                          remarks && (
                            <div className="font-mono text-xs text-black border-t border-black/10 pt-1">
                              <span className="text-[#525252] font-semibold mr-1">Note:</span> {remarks}
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
        <div className="p-3.5 bg-white border border-black font-mono text-xs text-black space-y-2">
          <span className="font-bold uppercase tracking-wider block">Status Legend:</span>
          <div className="grid grid-cols-3 gap-1.5 text-[10px]">
            <span className="px-2 py-1 bg-[#C6EFCE] text-[#375623] border border-[#70AD47] font-bold text-center">
              ✓ Avail (+2)
            </span>
            <span className="px-2 py-1 bg-[#FFEB9C] text-[#7D4E00] border border-[#FFAB00] font-bold text-center">
              ? Maybe (+1)
            </span>
            <span className="px-2 py-1 bg-[#FFC7CE] text-[#9C0006] border border-[#FF0000] font-bold text-center">
              ✗ Not Avail (0)
            </span>
          </div>
        </div>
      </div>

      {/* Main Desktop Availability Table */}
      <div className="hidden md:block bg-white border-2 border-black overflow-hidden">
        <div className="overflow-x-auto max-h-[70vh]">
          <table className="w-full min-w-[620px] text-left border-collapse">
            {/* Frozen Header Row */}
            <thead className="sticky top-0 z-30 bg-black text-white">
              <tr>
                <th className="py-3.5 px-4 font-mono text-xs font-bold uppercase tracking-wider w-36 border-r border-white/20">
                  Day
                </th>
                <th className="py-3.5 px-4 font-mono text-xs font-bold uppercase tracking-wider w-44 border-r border-white/20">
                  Time Slot
                </th>
                <th className="py-3.5 px-4 font-mono text-xs font-bold uppercase tracking-wider border-r border-white/20">
                  Availability {isSelf && <span className="text-[10px] text-[#A3A3A3] font-normal">(auto-saves)</span>}
                </th>
                <th className="py-3.5 px-4 font-mono text-xs font-bold uppercase tracking-wider w-56 sm:w-72">
                  Remarks / Notes
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-black/20 text-sm">
              {DAYS.map((day) => {
                return TIME_SLOTS.map((timeSlot, slotIndex) => {
                  const record = getRecord(day, timeSlot);
                  const status = record?.status;
                  const remarks = record?.remarks || '';
                  const key = `${day}-${timeSlot}`;
                  const isSaving = savingKey === key;

                  // Data-ink row status styling
                  let rowBgClass = 'bg-[#F5F5F5] hover:bg-[#EBEBEB]';
                  if (status === 'available') {
                    rowBgClass = 'bg-[#C6EFCE]/85 hover:bg-[#BBE4C3]';
                  } else if (status === 'not_available') {
                    rowBgClass = 'bg-[#FFC7CE]/85 hover:bg-[#F3BAC1]';
                  } else if (status === 'maybe') {
                    rowBgClass = 'bg-[#FFEB9C]/85 hover:bg-[#F3DE8E]';
                  }

                  return (
                    <tr
                      key={key}
                      className={`transition-colors duration-100 ${rowBgClass}`}
                    >
                      {/* Day Column (merged/rowspan for first slot of the day) */}
                      {slotIndex === 0 && (
                        <td
                          rowSpan={TIME_SLOTS.length}
                          className="py-4 px-4 bg-black text-white font-serif font-bold text-base align-middle text-center border-r-2 border-black border-b-2 border-b-white/20 select-none uppercase tracking-wider"
                        >
                          <div className="flex flex-col items-center justify-center gap-1">
                            <span>{day}</span>
                            <span className="font-mono text-[9px] uppercase tracking-widest bg-white text-black px-2 py-0.5 border border-white font-bold">
                              {TIME_SLOTS.length} SLOTS
                            </span>
                          </div>
                        </td>
                      )}

                      {/* Time Slot Column */}
                      <td className="py-3 px-4 font-mono text-xs font-semibold text-black border-r border-black/20 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-[#525252]" />
                          <span>{timeSlot}</span>
                        </div>
                      </td>

                      {/* Availability Selector Column */}
                      <td className="py-2.5 px-4 border-r border-black/20">
                        <div className="flex items-center gap-3">
                          <StatusSelector
                            value={status}
                            onChange={(newStatus) => handleStatusChange(day, timeSlot, newStatus)}
                            disabled={isSaving || !isSelf}
                            readOnly={!isSelf}
                          />
                          {isSaving && (
                            <span className="font-mono text-[10px] uppercase font-bold text-black animate-pulse">
                              SAVING...
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Remarks Column */}
                      <td className="py-2.5 px-4">
                        {isSelf ? (
                          <input
                            type="text"
                            maxLength={100}
                            defaultValue={remarks}
                            placeholder="Add remark (e.g., Lab free)..."
                            onBlur={(e) => handleRemarksBlur(day, timeSlot, e.target.value.trim())}
                            className="w-full px-2 py-1 text-xs font-mono border-b-2 border-black rounded-none bg-transparent focus:bg-white outline-none placeholder:text-[#A3A3A3]"
                          />
                        ) : (
                          <span className="font-mono text-xs text-black">
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
        <div className="p-4 bg-white border-t-2 border-black flex flex-wrap items-center justify-between gap-3 font-mono text-xs text-black">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-bold uppercase tracking-wider">Legend:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 border border-[#70AD47] bg-[#C6EFCE]" />
              <span>Available (+2 pts)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 border border-[#FFAB00] bg-[#FFEB9C]" />
              <span>Maybe (+1 pt)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 border border-[#FF0000] bg-[#FFC7CE]" />
              <span>Not Available (0 pts)</span>
            </div>
          </div>

          <span className="text-[#525252] text-[10px] uppercase tracking-wider">
            Changes persist automatically to cloud.
          </span>
        </div>
      </div>
    </div>
  );
}

