"use client";

import { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "@/lib/api";
import { apiFetch } from "@/lib/api";

type Device = {
  id: number;
  name: string;
  ip_address: string;
  port: number;
  serial_number: string | null;
  last_sync_at: string | null;
  employees_count: number;
  attendance_logs_count: number;
};

type FormData = {
  name: string;
  ip_address: string;
  port: string;
  serial_number: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const emptyForm: FormData = {
  name: "",
  ip_address: "",
  port: "4370",
  serial_number: "",
};

export default function DevicesPage() {
  const [devices, setDevices]     = useState<Device[]>([]);
  const [loading, setLoading]     = useState(true);
  const [syncing, setSyncing]     = useState<number | null>(null);
  const [message, setMessage]     = useState<{ text: string; ok: boolean } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState<FormData>(emptyForm);
  const [errors, setErrors]       = useState<FormErrors>({});
  const [saving, setSaving]       = useState(false);

  const fetchDevices = useCallback(async () => {
    try {
      const res  = await apiFetch(`/devices`);
      const json = await res.json();
      setDevices(json.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDevices(); }, [fetchDevices]);

  async function handleSync(device: Device) {
    setSyncing(device.id);
    setMessage(null);
    try {
      const res  = await apiFetch(`/devices/${device.id}/sync`, { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        setMessage({ text: `${device.name} synced successfully.`, ok: true });
        fetchDevices();
      } else {
        setMessage({ text: json.message ?? "Sync failed.", ok: false });
      }
    } catch {
      setMessage({ text: "Could not reach the API.", ok: false });
    } finally {
      setSyncing(null);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  }

  function validate(): boolean {
    const e: FormErrors = {};
    if (!form.name.trim())       e.name       = "Name is required.";
    if (!form.ip_address.trim()) e.ip_address = "IP address is required.";
    if (!form.port)              e.port       = "Port is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await apiFetch(`/devices`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body:    JSON.stringify(form),
      });
      const json = await res.json();

      if (res.ok) {
        setMessage({ text: `${json.data.name} added successfully.`, ok: true });
        setShowModal(false);
        setForm(emptyForm);
        fetchDevices();
      } else {
        // Laravel validation errors come as json.errors
        if (json.errors) {
          const e: FormErrors = {};
          Object.keys(json.errors).forEach((key) => {
            e[key as keyof FormData] = json.errors[key][0];
          });
          setErrors(e);
        } else {
          setMessage({ text: json.message ?? "Failed to add device.", ok: false });
          setShowModal(false);
        }
      }
    } catch {
      setMessage({ text: "Could not reach the API.", ok: false });
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  }

  function closeModal() {
    setShowModal(false);
    setForm(emptyForm);
    setErrors({});
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-medium text-gray-900">Devices</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage your ZKTeco attendance devices</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-lg mb-5 ${
          message.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
        }`}>
          <i className={`ti ${message.ok ? "ti-circle-check" : "ti-alert-circle"} text-base`} aria-hidden="true" />
          {message.text}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 text-gray-400 text-sm py-12 justify-center">
          <i className="ti ti-loader-2 animate-spin text-lg" aria-hidden="true" />
          Loading devices...
        </div>
      )}

      {/* Device grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {devices.map((device) => (
            <div key={device.id} className="bg-white border border-gray-100 rounded-xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <i className="ti ti-device-desktop text-xl" aria-hidden="true" />
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Online
                </span>
              </div>

              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-900">{device.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {device.serial_number ? `SN: ${device.serial_number}` : "No serial number"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 py-4 border-t border-gray-50">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">IP address</p>
                  <p className="text-sm font-medium text-gray-700">{device.ip_address}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Port</p>
                  <p className="text-sm font-medium text-gray-700">{device.port}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Employees</p>
                  <p className="text-sm font-medium text-gray-700">{device.employees_count}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Total logs</p>
                  <p className="text-sm font-medium text-gray-700">{device.attendance_logs_count.toLocaleString()}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <span className="text-xs text-gray-400">Last sync: {timeAgo(device.last_sync_at)}</span>
                <button
                  onClick={() => handleSync(device)}
                  disabled={syncing === device.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors disabled:opacity-50"
                >
                  <i className={`ti ti-refresh text-sm ${syncing === device.id ? "animate-spin" : ""}`} aria-hidden="true" />
                  {syncing === device.id ? "Syncing..." : "Sync now"}
                </button>
              </div>
            </div>
          ))}

          {/* Add device card */}
          <div
            onClick={() => setShowModal(true)}
            className="bg-white border border-dashed border-gray-200 rounded-xl p-5 flex flex-col items-center justify-center gap-2 min-h-48 cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
              <i className="ti ti-plus text-xl" aria-hidden="true" />
            </div>
            <p className="text-sm font-medium text-gray-500">Add device</p>
            <p className="text-xs text-gray-400">Connect a new ZKTeco device</p>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-base font-medium text-gray-900">Add device</h2>
                <p className="text-xs text-gray-400 mt-0.5">Connect a new ZKTeco attendance device</p>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <i className="ti ti-x text-base" aria-hidden="true" />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 flex flex-col gap-4">
              {/* Name */}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Device name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Main Office K40"
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                    errors.name ? "border-red-300" : "border-gray-200"
                  }`}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              {/* IP + Port */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">IP address</label>
                  <input
                    name="ip_address"
                    value={form.ip_address}
                    onChange={handleChange}
                    placeholder="192.168.0.130"
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                      errors.ip_address ? "border-red-300" : "border-gray-200"
                    }`}
                  />
                  {errors.ip_address && <p className="text-xs text-red-500 mt-1">{errors.ip_address}</p>}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Port</label>
                  <input
                    name="port"
                    value={form.port}
                    onChange={handleChange}
                    placeholder="4370"
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                      errors.port ? "border-red-300" : "border-gray-200"
                    }`}
                  />
                  {errors.port && <p className="text-xs text-red-500 mt-1">{errors.port}</p>}
                </div>
              </div>

              {/* Serial number */}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">
                  Serial number <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  name="serial_number"
                  value={form.serial_number}
                  onChange={handleChange}
                  placeholder="e.g. ABCD1234567"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving && <i className="ti ti-loader-2 animate-spin text-sm" aria-hidden="true" />}
                {saving ? "Adding..." : "Add device"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}