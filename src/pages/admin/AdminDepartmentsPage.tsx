import React, { useEffect, useState } from 'react';
import { Building2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { PortalLayout } from '../../components/PortalLayout';
import { civicApi } from '../../lib/civicApi';
import type { Department } from '../../types/civic';

export function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [headName, setHeadName] = useState('');
  const [slaHours, setSlaHours] = useState(48);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    civicApi
      .listDepartments()
      .then(setDepartments)
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const created = await civicApi.createDepartment({
        name,
        code,
        description,
        contactEmail,
        contactPhone,
        headName,
        slaHours,
      });
      setDepartments((prev) => [...prev, created]);
      setShowForm(false);
      setName('');
      setCode('');
      setDescription('');
      setContactEmail('');
      setContactPhone('');
      setHeadName('');
      setSlaHours(48);
      toast.success(`Department "${created.name}" created.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to create department.');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleDepartmentActive(dept: Department) {
    try {
      const updated = await civicApi.updateDepartment(dept.id, { isActive: !dept.isActive });
      setDepartments((prev) => prev.map((d) => (d.id === dept.id ? updated : d)));
      toast.success(
        `${updated.name} marked ${updated.isActive ? 'Active' : 'Inactive'}.`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to update department.');
    }
  }

  return (
    <PortalLayout
      portal="admin"
      title="Department Management"
      breadcrumb="Admin Portal / Departments"
      headerAction={
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#163A5F] rounded-md hover:bg-[#0B1F35] transition-colors whitespace-nowrap"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>{showForm ? 'Cancel' : 'Add Department'}</span>
        </button>
      }
    >
      <div className="space-y-6">
        {showForm && (
          <form
            onSubmit={handleCreate}
            className="bg-white border border-slate-200 rounded-lg p-6 space-y-4"
          >
            <h2 className="text-base font-bold text-slate-900">Create Municipal Department</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="dept-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Department Name
                </label>
                <input
                  id="dept-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Urban Forestry & Street Trees"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#163A5F]"
                />
              </div>
              <div>
                <label htmlFor="dept-code" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Code
                </label>
                <input
                  id="dept-code"
                  type="text"
                  required
                  maxLength={8}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="TREE"
                  className="w-full px-3.5 py-2 text-sm font-mono bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#163A5F]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="dept-head" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Department Lead
                </label>
                <input
                  id="dept-head"
                  type="text"
                  value={headName}
                  onChange={(e) => setHeadName(e.target.value)}
                  placeholder="Alex Rivera"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#163A5F]"
                />
              </div>
              <div>
                <label htmlFor="dept-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Dispatch Email
                </label>
                <input
                  id="dept-email"
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="forestry@civictrack.gov"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#163A5F]"
                />
              </div>
              <div>
                <label htmlFor="dept-sla" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Target SLA (Hours)
                </label>
                <input
                  id="dept-sla"
                  type="number"
                  min={1}
                  max={720}
                  value={slaHours}
                  onChange={(e) => setSlaHours(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-sm font-mono bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#163A5F]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="dept-desc" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Responsibilities
                </label>
                <input
                  id="dept-desc"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Street tree maintenance, fallen branch clearing..."
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#163A5F]"
                />
              </div>
              <div>
                <label htmlFor="dept-phone" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Phone
                </label>
                <input
                  id="dept-phone"
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="(555) 201-4600"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#163A5F]"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-[#163A5F] rounded-md hover:bg-[#0B1F35] disabled:opacity-60"
              >
                {submitting ? 'Creating...' : 'Save Department'}
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            <div className="h-32 bg-white border border-slate-200 rounded-lg animate-pulse" />
          ) : (
            departments.map((dept) => (
              <div
                key={dept.id}
                className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-md bg-[#E6EEF6] text-[#163A5F] flex items-center justify-center shrink-0">
                        <Building2 className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-xs font-mono font-semibold text-[#163A5F]">{dept.code}</p>
                        <h3 className="text-base font-bold text-slate-900">{dept.name}</h3>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                        dept.isActive
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {dept.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <p className="mt-3 text-xs text-slate-600 leading-relaxed">{dept.description}</p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                  <div>
                    <p className="font-semibold text-slate-800">{dept.headName || 'Unassigned Lead'}</p>
                    <p>
                      {dept.contactEmail} · SLA <span className="font-mono tabular-nums">{dept.slaHours}h</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleDepartmentActive(dept)}
                    className="px-3 py-1.5 font-semibold text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50"
                  >
                    {dept.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </PortalLayout>
  );
}
