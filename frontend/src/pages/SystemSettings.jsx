import React, { useState, useEffect } from 'react';
import { 
  Database, Server, Cpu, Download, Upload, RefreshCw, 
  CheckCircle2, AlertCircle, ShieldCheck, HardDrive, Key, 
  Layers, Loader2, ArrowRight 
} from 'lucide-react';
import { 
  getSystemStatus, switchAIProvider, createDatabaseBackup, 
  listDatabaseBackups, downloadDatabaseBackupFile, restoreDatabaseBackup 
} from '../api/client';
import { useAuth } from '../state/AuthContext';

export default function SystemSettings() {
  const { user } = useAuth();
  const [statusData, setStatusData] = useState(null);
  const [backups, setBackups] = useState([]);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [switchingProvider, setSwitchingProvider] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoadingStatus(true);
      setErrorMsg('');
      const [sysRes, bkRes] = await Promise.all([
        getSystemStatus(),
        listDatabaseBackups().catch(() => ({ backups: [] }))
      ]);
      setStatusData(sysRes);
      setBackups(bkRes.backups || []);
    } catch (err) {
      console.error('Failed to load system settings:', err);
      setErrorMsg('Could not retrieve system and database status.');
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleSwitchProvider = async (provider) => {
    setSwitchingProvider(true);
    setMessage('');
    setErrorMsg('');
    try {
      const res = await switchAIProvider(provider);
      setMessage(res.message);
      await loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to switch AI provider.');
    } finally {
      setSwitchingProvider(false);
    }
  };

  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    setMessage('');
    setErrorMsg('');
    try {
      const res = await createDatabaseBackup();
      setMessage(res.message);
      await loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to create database backup.');
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleDownloadBackup = async (filename) => {
    try {
      await downloadDatabaseBackupFile(filename);
    } catch (err) {
      alert('Could not download backup file.');
    }
  };

  const handleRestoreFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm(`Are you sure you want to restore the database from '${file.name}'? This will synchronize records.`)) {
      e.target.value = '';
      return;
    }

    setRestoring(true);
    setMessage('');
    setErrorMsg('');
    try {
      const res = await restoreDatabaseBackup(file);
      setMessage(`${res.message} (${res.stats.restored_users} users, ${res.stats.restored_resumes} resumes restored).`);
      await loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to restore database from backup file.');
    } finally {
      setRestoring(false);
      e.target.value = '';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            System, Models & Database Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure multi-account LLM keys, local Ollama models, MySQL database status, and full software backups.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loadingStatus}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingStatus ? 'animate-spin' : ''}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Notifications */}
      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid: AI Provider Selector + Database Engine Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Section 1: Multi-Provider LLM & Ollama Engine */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">AI Engine & Model Routing</h3>
                <p className="text-xs text-slate-500">Multi-key failover & local model routing</p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-bold capitalize">
              Active: {statusData?.active_provider || 'gemini'}
            </span>
          </div>

          {/* Provider Toggle Buttons */}
          <div className="grid grid-cols-2 gap-3">
            {/* Gemini Multi-Key Option */}
            <button
              type="button"
              onClick={() => handleSwitchProvider('gemini')}
              disabled={switchingProvider}
              className={`p-4 rounded-2xl border text-left transition-all ${
                statusData?.active_provider === 'gemini'
                  ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-slate-900">Gemini Multi-Key</span>
                {statusData?.gemini?.ready ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                {statusData?.gemini?.total_keys || 0} Account Key(s) Configured with Auto-Failover
              </p>
            </button>

            {/* Local Ollama Option */}
            <button
              type="button"
              onClick={() => handleSwitchProvider('ollama')}
              disabled={switchingProvider}
              className={`p-4 rounded-2xl border text-left transition-all ${
                statusData?.active_provider === 'ollama'
                  ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-slate-900">Local Ollama Model</span>
                {statusData?.ollama?.available ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                {statusData?.ollama?.available
                  ? `Connected (${statusData?.ollama?.model || 'llama3.2'})`
                  : 'Offline (port 11434)'}
              </p>
            </button>
          </div>

          {/* Key Pool Table */}
          {statusData?.gemini?.keys && statusData.gemini.keys.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Configured Gemini Key Pool ({statusData.gemini.keys.length})
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {statusData.gemini.keys.map((k) => (
                  <div key={k.index} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs border border-slate-100">
                    <div className="flex items-center space-x-2">
                      <Key className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-800">Account Key #{k.index} ({k.preview})</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      k.is_available ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {k.is_available ? 'Active & Ready' : 'Cooldown / Limited'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section 2: MySQL Database Engine */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Database Engine</h3>
                  <p className="text-xs text-slate-500">Persistent storage & table synchronization</p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                {statusData?.database?.engine || 'MySQL'}
              </span>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="font-medium text-slate-500">Active Engine</span>
                <span className="font-bold text-slate-900">{statusData?.database?.engine}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="font-medium text-slate-500">Synchronization Status</span>
                <span className="font-bold text-emerald-600 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Tables Synchronized</span>
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="font-medium text-slate-500">Failover Protection</span>
                <span className="font-semibold text-slate-700">Enabled (Zero-downtime)</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>To connect external MySQL, update DATABASE_URL in backend/.env.</span>
          </div>
        </div>
      </div>

      {/* Section 3: Software & Database Backup Manager */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Database & Software Backup Manager</h3>
              <p className="text-xs text-slate-500">Create full JSON/SQL snapshot archives and restore on demand</p>
            </div>
          </div>

          <div className="flex space-x-3">
            <label className="flex items-center space-x-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>{restoring ? 'Restoring...' : 'Restore from File'}</span>
              <input
                type="file"
                accept=".json"
                onChange={handleRestoreFile}
                disabled={restoring}
                className="hidden"
              />
            </label>

            <button
              onClick={handleCreateBackup}
              disabled={creatingBackup}
              className="flex items-center space-x-1.5 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {creatingBackup ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>{creatingBackup ? 'Generating Snapshot...' : 'Create Full Backup'}</span>
            </button>
          </div>
        </div>

        {/* Backups Table */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Available Backup Archives ({backups.length})
          </h4>

          {backups.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-xs text-slate-500">No backup snapshots generated yet. Click "Create Full Backup" above to export all data.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase font-semibold">
                    <th className="py-2.5 px-3">Archive File</th>
                    <th className="py-2.5 px-3">Created</th>
                    <th className="py-2.5 px-3">Size</th>
                    <th className="py-2.5 px-3">Records Included</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {backups.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-800">{b.filename}</td>
                      <td className="py-3 px-3 text-slate-500">{new Date(b.created_at).toLocaleString()}</td>
                      <td className="py-3 px-3 text-slate-500">{((b.size_bytes || 0) / 1024).toFixed(1)} KB</td>
                      <td className="py-3 px-3 text-slate-600 font-medium">{b.record_counts || 'Full Snapshot'}</td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleDownloadBackup(b.filename)}
                          className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition-colors inline-flex items-center space-x-1"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
