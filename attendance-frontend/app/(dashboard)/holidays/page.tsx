"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";

type Holiday = {
    id: number;
    name: string;
    date: string;
    end_date: string | null;
    type: "public" | "company";
};

type FormData = {
    name: string;
    date: string;
    end_date: string;
    type: "public" | "company";
};

const emptyForm: FormData = {
    name: "",
    date: "",
    end_date: "",
    type: "public",
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function HolidaysPage() {
    const today = new Date();

    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Holiday | null>(null);
    const [form, setForm] = useState<FormData>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState<number | null>(null);

    const fetchHolidays = useCallback(async () => {
        try {
            const res = await apiFetch(`/holidays?year=${currentYear}`);
            const json = await res.json();
            setHolidays(json.data ?? []);
        } catch {
            // silently fail
        } finally {
            setLoading(false);
        }
    }, [currentYear]);

    useEffect(() => { fetchHolidays(); }, [fetchHolidays]);

    // Calendar helpers
    function getDaysInMonth(year: number, month: number): number {
        return new Date(year, month + 1, 0).getDate();
    }

    function getFirstDayOfMonth(year: number, month: number): number {
        return new Date(year, month, 1).getDay();
    }

    //   function isHoliday(day: number): Holiday | undefined {
    //     const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    //     return holidays.find((h) => h.date.startsWith(dateStr));
    //   }

    function isHoliday(day: number): Holiday | undefined {
        const dateStr = new Date(currentYear, currentMonth, day);
        return holidays.find((h) => {
            const start = new Date(h.date);
            const end = h.end_date ? new Date(h.end_date) : start;
            return dateStr >= start && dateStr <= end;
        });
    }

    function isToday(day: number): boolean {
        return (
            day === today.getDate() &&
            currentMonth === today.getMonth() &&
            currentYear === today.getFullYear()
        );
    }

    function isFriday(day: number): boolean {
        return new Date(currentYear, currentMonth, day).getDay() === 5;
    }

    function prevMonth() {
        if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1); }
        else setCurrentMonth((m) => m - 1);
    }

    function nextMonth() {
        if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1); }
        else setCurrentMonth((m) => m + 1);
    }

    // Build calendar grid
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const prevDays = getDaysInMonth(currentYear, currentMonth - 1);
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

    const calendarDays = Array.from({ length: totalCells }, (_, i) => {
        if (i < firstDay) return { day: prevDays - firstDay + i + 1, type: "prev" };
        if (i >= firstDay + daysInMonth) return { day: i - firstDay - daysInMonth + 1, type: "next" };
        return { day: i - firstDay + 1, type: "current" };
    });

    // Holidays for current month sidebar
    const monthHolidays = holidays.filter((h) => {
        const d = new Date(h.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    // All holidays for list
    function openAddModal() {
        setEditing(null);
        setForm(emptyForm);
        setShowModal(true);
    }

    function openEditModal(h: Holiday) {
        setEditing(h);
        setForm({
            name: h.name,
            date: h.date.split("T")[0],
            end_date: h.end_date ? h.end_date.split("T")[0] : "",
            type: h.type,
        });
        setShowModal(true);
    }

    async function handleSave() {
        if (!form.name.trim() || !form.date) return;
        setSaving(true);
        try {
            const url = editing ? `/holidays/${editing.id}` : `/holidays`;
            const method = editing ? "PUT" : "POST";
            const res = await apiFetch(url, { method, body: JSON.stringify(form) });
            if (res.ok) {
                setMessage({ text: `Holiday ${editing ? "updated" : "added"}.`, ok: true });
                setShowModal(false);
                fetchHolidays();
            }
        } catch {
            setMessage({ text: "Could not save holiday.", ok: false });
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(h: Holiday) {
        if (!confirm(`Delete "${h.name}"?`)) return;
        setDeleting(h.id);
        try {
            await apiFetch(`/holidays/${h.id}`, { method: "DELETE" });
            setMessage({ text: `"${h.name}" deleted.`, ok: true });
            fetchHolidays();
        } catch {
            setMessage({ text: "Could not delete.", ok: false });
        } finally {
            setDeleting(null);
        }
    }

    function formatHolidayDate(h: Holiday) {
        const start = new Date(h.date).toLocaleDateString("en-US", {
            month: "short", day: "numeric", weekday: "short"
        });
        if (!h.end_date) return start;
        const end = new Date(h.end_date).toLocaleDateString("en-US", {
            month: "short", day: "numeric", weekday: "short"
        });
        // Calculate days
        const days = Math.round(
            (new Date(h.end_date).getTime() - new Date(h.date).getTime()) / (1000 * 60 * 60 * 24)
        ) + 1;
        return `${start} – ${end} · ${days} days`;
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-xl font-medium text-gray-900">Holiday Calendar</h1>
                    <p className="text-sm text-gray-400 mt-0.5">Manage public and company holidays</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <i className="ti ti-plus text-sm" aria-hidden="true" />
                    Add holiday
                </button>
            </div>

            {/* Message */}
            {message && (
                <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-lg mb-5 ${message.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                    }`}>
                    <i className={`ti ${message.ok ? "ti-circle-check" : "ti-alert-circle"} text-base`} aria-hidden="true" />
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                {/* Calendar */}
                <div className="xl:col-span-2 bg-white border border-gray-100 rounded-xl overflow-hidden">
                    {/* Calendar header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <h2 className="text-sm font-medium text-gray-900">
                                {MONTHS[currentMonth]} {currentYear}
                            </h2>
                            {/* Year navigation */}
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setCurrentYear((y) => y - 1)}
                                    className="px-2 py-1 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded"
                                >
                                    {currentYear - 1}
                                </button>
                                <button
                                    onClick={() => setCurrentYear((y) => y + 1)}
                                    className="px-2 py-1 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded"
                                >
                                    {currentYear + 1}
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-1.5">
                            <button
                                onClick={prevMonth}
                                className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors"
                            >
                                <i className="ti ti-chevron-left text-sm" aria-hidden="true" />
                            </button>
                            <button
                                onClick={nextMonth}
                                className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors"
                            >
                                <i className="ti ti-chevron-right text-sm" aria-hidden="true" />
                            </button>
                        </div>
                    </div>

                    <div className="p-4">
                        {/* Day names */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {DAYS.map((d) => (
                                <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">
                                    {d}
                                </div>
                            ))}
                        </div>

                        {/* Days */}
                        <div className="grid grid-cols-7 gap-1">
                            {calendarDays.map((cell, i) => {
                                if (cell.type !== "current") {
                                    return (
                                        <div key={i} className="aspect-square flex items-center justify-center text-sm text-gray-200 rounded-lg">
                                            {cell.day}
                                        </div>
                                    );
                                }

                                const holiday = isHoliday(cell.day);
                                const today_ = isToday(cell.day);
                                const friday = isFriday(cell.day);

                                return (
                                    <div
                                        key={i}
                                        onClick={() => {
                                            if (holiday) openEditModal(holiday);
                                            else {
                                                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}`;
                                                setForm({ ...emptyForm, date: dateStr });
                                                setEditing(null);
                                                setShowModal(true);
                                            }
                                        }}
                                        className={`aspect-square flex flex-col items-center justify-center text-sm rounded-lg cursor-pointer transition-colors relative ${holiday
                                            ? holiday.type === "public"
                                                ? "bg-red-50 text-red-700 font-medium hover:bg-red-100"
                                                : "bg-blue-50 text-blue-700 font-medium hover:bg-blue-100"
                                            : today_
                                                ? "bg-blue-600 text-white font-semibold"
                                                : friday
                                                    ? "text-gray-400 hover:bg-gray-50"
                                                    : "text-gray-700 hover:bg-gray-50"
                                            }`}
                                    >
                                        {cell.day}
                                        {holiday && (
                                            <div className={`w-1 h-1 rounded-full mt-0.5 ${holiday.type === "public" ? "bg-red-400" : "bg-blue-400"
                                                }`} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-50">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-sm bg-red-50 border border-red-200" />
                                <span className="text-xs text-gray-400">Public holiday</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-sm bg-blue-50 border border-blue-200" />
                                <span className="text-xs text-gray-400">Company holiday</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-blue-600" />
                                <span className="text-xs text-gray-400">Today</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Holidays list */}
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-800">
                            {MONTHS[currentMonth]} Holidays
                        </p>
                        <span className="text-xs text-gray-400">{currentYear}</span>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <i className="ti ti-loader-2 animate-spin text-gray-400 text-lg" aria-hidden="true" />
                        </div>
                    ) : monthHolidays.length === 0 ? (
                        <div className="py-10 text-center text-sm text-gray-400">
                            No holidays this month.
                        </div>
                    ) : (
                        <div className="p-2">
                            {monthHolidays.map((h) => (
                                <div
                                    key={h.id}
                                    className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors group"
                                >
                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${h.type === "public" ? "bg-red-400" : "bg-blue-400"
                                        }`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800 truncate">{h.name}</p>
                                        <p className="text-xs text-gray-400">{formatHolidayDate(h)}</p>
                                    </div>
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${h.type === "public"
                                        ? "bg-red-50 text-red-600"
                                        : "bg-blue-50 text-blue-600"
                                        }`}>
                                        {h.type === "public" ? "Public" : "Company"}
                                    </span>
                                    <div className="hidden group-hover:flex gap-1">
                                        <button
                                            onClick={() => openEditModal(h)}
                                            className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-600"
                                        >
                                            <i className="ti ti-edit text-xs" aria-hidden="true" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(h)}
                                            disabled={deleting === h.id}
                                            className="w-6 h-6 flex items-center justify-center rounded text-red-400 hover:text-red-600"
                                        >
                                            <i className={`ti ${deleting === h.id ? "ti-loader-2 animate-spin" : "ti-trash"} text-xs`} aria-hidden="true" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* All year holidays count */}
                    <div className="px-5 py-3 border-t border-gray-50">
                        <p className="text-xs text-gray-400">
                            {holidays.length} total holiday{holidays.length !== 1 ? "s" : ""} in {currentYear}
                        </p>
                    </div>
                </div>
            </div>

            {/* Add/Edit modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                            <div>
                                <h2 className="text-base font-medium text-gray-900">
                                    {editing ? "Edit holiday" : "Add holiday"}
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {editing ? editing.name : "Add a new holiday to the calendar"}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400"
                            >
                                <i className="ti ti-x text-base" aria-hidden="true" />
                            </button>
                        </div>
                        <div className="px-6 py-5 flex flex-col gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1.5">Holiday name</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                                    placeholder="e.g. Eid ul Fitr"
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                            {/* <div>
                                <label className="block text-xs text-gray-500 mb-1.5">Date</label>
                                <input
                                    type="date"
                                    value={form.date}
                                    onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                />
                            </div> */}

                            <div>
                                <label className="block text-xs text-gray-500 mb-1.5">Start date</label>
                                <input
                                    type="date"
                                    value={form.date}
                                    onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1.5">
                                    End date
                                    <span className="text-gray-400 ml-1">(optional — for multi-day holidays)</span>
                                </label>
                                <input
                                    type="date"
                                    value={form.end_date}
                                    min={form.date}
                                    onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1.5">Type</label>
                                <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                                    <button
                                        onClick={() => setForm((p) => ({ ...p, type: "public" }))}
                                        className={`flex-1 py-2.5 text-sm font-medium transition-colors ${form.type === "public"
                                            ? "bg-red-50 text-red-700"
                                            : "bg-white text-gray-400 hover:bg-gray-50"
                                            }`}
                                    >
                                        Public
                                    </button>
                                    <button
                                        onClick={() => setForm((p) => ({ ...p, type: "company" }))}
                                        className={`flex-1 py-2.5 text-sm font-medium border-l border-gray-200 transition-colors ${form.type === "company"
                                            ? "bg-blue-50 text-blue-700"
                                            : "bg-white text-gray-400 hover:bg-gray-50"
                                            }`}
                                    >
                                        Company
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !form.name.trim() || !form.date}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {saving && <i className="ti ti-loader-2 animate-spin text-sm" aria-hidden="true" />}
                                {saving ? "Saving..." : editing ? "Update" : "Add holiday"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}