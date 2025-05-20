"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from 'next/link';

export default function AdminSettingsPage() {
  const { data: session, status } = useSession();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [timeHistory, setTimeHistory] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState(null);
  const [form, setForm] = useState({
    votingStartTime: "",
    votingEndTime: "",
    autoResetEnabled: false,
    autoResetTime: "",
    autoResetDay: "",
    autoResetMonth: ""
  });

  console.log("SESSION:", session, "STATUS:", status);

  useEffect(() => {
    fetchSettings();
    fetchTimeHistory();
  }, []);

  async function fetchTimeHistory() {
    try {
      const res = await fetch("/api/admin/settings/history");
      if (!res.ok) throw new Error("Failed to fetch time history");
      const data = await res.json();
      setTimeHistory(data);
    } catch (e) {
      setError(e.message);
    }
  }

  async function fetchSettings() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      const data = await res.json();
      setSettings(data);
      setForm({
        votingStartTime: data?.votingStartTime ? data.votingStartTime.slice(0, 16) : "",
        votingEndTime: data?.votingEndTime ? data.votingEndTime.slice(0, 16) : "",
        autoResetEnabled: !!data?.autoResetEnabled,
        autoResetTime: data?.autoResetTime || "",
        autoResetDay: data?.autoResetDay || "",
        autoResetMonth: data?.autoResetMonth || ""
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error("Failed to update settings");
      setSuccess("Settings updated successfully.");
      fetchSettings();
      fetchTimeHistory();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleDelete(settingId) {
    try {
      const res = await fetch(`/api/admin/settings/${settingId}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete setting");
      setSuccess("Setting deleted successfully.");
      fetchTimeHistory();
      setShowDeleteConfirm(false);
      setSelectedSetting(null);
    } catch (e) {
      setError(e.message);
    }
  }

  function handleEdit(setting) {
    setForm({
      votingStartTime: setting.votingStartTime.slice(0, 16),
      votingEndTime: setting.votingEndTime.slice(0, 16),
      autoResetEnabled: !!setting.autoResetEnabled,
      autoResetTime: setting.autoResetTime || "",
      autoResetDay: setting.autoResetDay || "",
      autoResetMonth: setting.autoResetMonth || ""
    });
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 bg-white p-8 rounded shadow">
      <div className="mb-6">
        <Link href="/admin" className="text-blue-600 hover:text-blue-800 flex items-center">
          ← Back to Dashboard
        </Link>
      </div>
      <h2 className="text-xl font-bold mb-4 text-blue-700">Election Settings</h2>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="space-y-4 mb-8">
            {error && <div className="text-red-600">{error}</div>}
            {success && <div className="text-green-600">{success}</div>}
            <div>
              <label className="block font-medium">Voting Start Time</label>
              <input type="datetime-local" name="votingStartTime" value={form.votingStartTime} onChange={handleChange} className="border p-2 rounded w-full" required />
            </div>
            <div>
              <label className="block font-medium">Voting End Time</label>
              <input type="datetime-local" name="votingEndTime" value={form.votingEndTime} onChange={handleChange} className="border p-2 rounded w-full" required />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" name="autoResetEnabled" checked={form.autoResetEnabled} onChange={handleChange} />
              <label className="font-medium">Enable Yearly Auto-Reset</label>
            </div>
            {form.autoResetEnabled && (
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-medium">Reset Time (HH:mm)</label>
                  <input type="time" name="autoResetTime" value={form.autoResetTime} onChange={handleChange} className="border p-2 rounded w-full" required={form.autoResetEnabled} />
                </div>
                <div>
                  <label className="block font-medium">Reset Day</label>
                  <input type="number" name="autoResetDay" value={form.autoResetDay} onChange={handleChange} className="border p-2 rounded w-full" min="1" max="31" required={form.autoResetEnabled} />
                </div>
                <div>
                  <label className="block font-medium">Reset Month</label>
                  <input type="number" name="autoResetMonth" value={form.autoResetMonth} onChange={handleChange} className="border p-2 rounded w-full" min="1" max="12" required={form.autoResetEnabled} />
                </div>
              </div>
            )}
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Save Settings</button>
          </form>

          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Time Settings History</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 border">Start Time</th>
                    <th className="px-4 py-2 border">End Time</th>
                    <th className="px-4 py-2 border">Auto Reset</th>
                    <th className="px-4 py-2 border">Created At</th>
                    <th className="px-4 py-2 border">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {timeHistory.map((setting) => (
                    <tr key={setting.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 border">{new Date(setting.votingStartTime).toLocaleString()}</td>
                      <td className="px-4 py-2 border">{new Date(setting.votingEndTime).toLocaleString()}</td>
                      <td className="px-4 py-2 border">{setting.autoResetEnabled ? "Yes" : "No"}</td>
                      <td className="px-4 py-2 border">{new Date(setting.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-2 border">
                        <button
                          onClick={() => handleEdit(setting)}
                          className="text-blue-600 hover:text-blue-800 mr-2"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSetting(setting);
                            setShowDeleteConfirm(true);
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
                <p className="mb-4">Are you sure you want to delete this time setting?</p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setSelectedSetting(null);
                    }}
                    className="px-4 py-2 border rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(selectedSetting.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}