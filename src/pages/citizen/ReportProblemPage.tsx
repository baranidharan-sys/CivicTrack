import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Crosshair, ImagePlus, MapPin, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { PortalLayout } from '../../components/PortalLayout';
import { CivicMap } from '../../components/CivicMap';
import { civicApi } from '../../lib/civicApi';
import { validateComplaintInput } from '../../utils/civicLogic';
import {
  COMPLAINT_CATEGORIES,
  type Complaint,
  type ComplaintCategory,
  type ComplaintSeverity,
} from '../../types/civic';

const DEFAULT_LAT = 45.5202;
const DEFAULT_LNG = -122.6742;

export function ReportProblemPage() {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ComplaintCategory>('Road Damage & Potholes');
  const [severity, setSeverity] = useState<ComplaintSeverity>('medium');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [ward, setWard] = useState('');
  const [latitude, setLatitude] = useState<number>(DEFAULT_LAT);
  const [longitude, setLongitude] = useState<number>(DEFAULT_LNG);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createdComplaint, setCreatedComplaint] = useState<Complaint | null>(null);

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser. Click the map to place a pin.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setLatitude(lat);
        setLongitude(lng);
        if (!address.trim()) {
          setAddress(`GPS Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        }
        setLocating(false);
        toast.success('Current GPS coordinates applied.');
      },
      () => {
        setLocating(false);
        toast.error('Location permission unavailable. Click directly on the map to pin the issue.');
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a PNG, JPEG, or WebP image.');
      return;
    }

    setUploadingPhoto(true);
    try {
      const localPreview = URL.createObjectURL(file);
      setPhotoPreview(localPreview);
      const uploadedUrl = await civicApi.uploadPhoto(file);
      setPhotoUrl(uploadedUrl);
      toast.success('Photograph uploaded successfully.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload image.');
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const check = validateComplaintInput({
      title,
      description,
      category,
      address,
      latitude,
      longitude,
    });

    if (!check.valid) {
      setErrors(check.errors);
      toast.error(Object.values(check.errors)[0]);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const created = await civicApi.createComplaint({
        title,
        description,
        category,
        severity,
        address,
        ward,
        latitude,
        longitude,
        photoUrl,
      });
      setCreatedComplaint(created);
      toast.success(`Complaint submitted — Reference ID ${created.referenceId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to submit complaint.');
    } finally {
      setSubmitting(false);
    }
  }

  if (createdComplaint) {
    return (
      <PortalLayout
        portal="citizen"
        title="Complaint Submitted"
        breadcrumb="Citizen Portal / Report a Problem / Confirmation"
      >
        <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-lg p-8">
          <div className="flex items-center gap-3 text-emerald-700">
            <CheckCircle2 className="h-7 w-7 shrink-0" aria-hidden="true" />
            <h2 className="text-xl font-bold text-slate-900">
              Your Public Issue Report Has Been Logged
            </h2>
          </div>

          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            Municipal dispatchers can now inspect your report, assign it to the responsible city department, and post live status updates. Save your reference ID below to track progress anytime.
          </p>

          <div className="mt-6 p-5 rounded-lg bg-[#F2F6FA] border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-500">Complaint Reference ID</p>
              <p
                data-testid="generated-reference-id"
                className="mt-1 text-2xl font-mono font-bold text-[#163A5F] tracking-tight"
              >
                {createdComplaint.referenceId}
              </p>
            </div>
            <Link
              to={`/citizen/complaints/${createdComplaint.id}`}
              className="px-4 py-2.5 text-sm font-semibold text-white bg-[#163A5F] rounded-md hover:bg-[#0B1F35] transition-colors whitespace-nowrap text-center"
            >
              View Complaint Details
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to="/citizen/complaints"
              className="px-4 py-2 text-sm font-semibold text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50"
            >
              Go to My Complaints
            </Link>
            <button
              type="button"
              onClick={() => {
                setCreatedComplaint(null);
                setTitle('');
                setDescription('');
                setAddress('');
                setWard('');
                setPhotoUrl('');
                setPhotoPreview('');
              }}
              className="px-4 py-2 text-sm font-semibold text-[#163A5F] hover:underline"
            >
              Submit Another Issue
            </button>
          </div>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout
      portal="citizen"
      title="Report a Public Problem"
      breadcrumb="Citizen Portal / Report a Problem"
    >
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">1. Issue Details</h2>

            <div>
              <label htmlFor="report-title" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Problem Summary Title
              </label>
              <input
                id="report-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Deep pothole blocking bike lane on Main St"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#163A5F]"
              />
              {errors.title && <p className="mt-1 text-xs text-red-700">{errors.title}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="report-category" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Category
                </label>
                <select
                  id="report-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#163A5F]"
                >
                  {COMPLAINT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {errors.category && <p className="mt-1 text-xs text-red-700">{errors.category}</p>}
              </div>

              <div>
                <label htmlFor="report-severity" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Severity Level
                </label>
                <select
                  id="report-severity"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as ComplaintSeverity)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#163A5F]"
                >
                  <option value="low">Low — Minor inconvenience</option>
                  <option value="medium">Medium — Standard repair needed</option>
                  <option value="high">High — Safety or traffic hazard</option>
                  <option value="critical">Critical — Urgent emergency hazard</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="report-description" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Detailed Description
              </label>
              <textarea
                id="report-description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe exact hazards, visibility concerns, or how long the issue has been present..."
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#163A5F]"
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-700">{errors.description}</p>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">2. Photographic Evidence</h2>
            <p className="text-xs text-slate-500">
              Attach a clear photo of the issue to help municipal crews assess equipment and dispatch needs.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <label
                htmlFor="report-photo-input"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#163A5F] bg-[#F2F6FA] border border-slate-300 rounded-md hover:bg-[#E6EEF6] cursor-pointer transition-colors"
              >
                <Upload className="h-4 w-4" aria-hidden="true" />
                <span>{uploadingPhoto ? 'Uploading...' : 'Upload Photograph'}</span>
                <input
                  id="report-photo-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
              {photoUrl && (
                <span className="text-xs text-emerald-700 font-medium">
                  Image attached and ready
                </span>
              )}
            </div>

            {(photoPreview || photoUrl) ? (
              <div className="h-52 rounded-md overflow-hidden border border-slate-200 bg-slate-100">
                <img
                  src={photoPreview || photoUrl}
                  alt="Uploaded issue preview"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="h-36 rounded-md border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-slate-400 text-xs">
                <ImagePlus className="h-6 w-6 mb-1.5" aria-hidden="true" />
                <span>PNG, JPEG, or WebP up to 8 MB</span>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-slate-900">3. Location &amp; Map Pin</h2>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={locating}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#163A5F] bg-[#F2F6FA] border border-slate-200 rounded-md hover:bg-[#E6EEF6] transition-colors whitespace-nowrap"
              >
                <Crosshair className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{locating ? 'Locating...' : 'Use Current GPS'}</span>
              </button>
            </div>

            <div>
              <label htmlFor="report-address" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Street Address or Landmark
              </label>
              <div className="relative">
                <MapPin
                  className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                />
                <input
                  id="report-address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 412 SW Alder Street"
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#163A5F]"
                />
              </div>
              {errors.address && <p className="mt-1 text-xs text-red-700">{errors.address}</p>}
            </div>

            <div>
              <label htmlFor="report-ward" className="block text-xs font-semibold text-slate-700 mb-1.5">
                District / Neighborhood (Optional)
              </label>
              <input
                id="report-ward"
                type="text"
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                placeholder="e.g. District 1 — Downtown"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#163A5F]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span>Click map or drag pin to set exact coordinates</span>
                <span className="font-mono tabular-nums">
                  {latitude.toFixed(4)}, {longitude.toFixed(4)}
                </span>
              </div>
              <CivicMap
                latitude={latitude}
                longitude={longitude}
                zoom={14}
                heightClass="h-64"
                interactive
                onSelectLocation={(lat, lng) => {
                  setLatitude(lat);
                  setLongitude(lng);
                }}
              />
              {errors.location && <p className="mt-1 text-xs text-red-700">{errors.location}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting || uploadingPhoto}
              className="w-full py-3 px-4 text-sm font-semibold text-white bg-[#163A5F] rounded-md hover:bg-[#0B1F35] disabled:opacity-60 transition-colors"
            >
              {submitting ? 'Submitting Report...' : 'Submit Problem Report'}
            </button>
          </div>
        </div>
      </form>
    </PortalLayout>
  );
}
