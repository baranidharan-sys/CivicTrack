import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';
import { PortalLayout } from '../../components/PortalLayout';
import { civicApi } from '../../lib/civicApi';
import { formatDateTime } from '../../utils/civicLogic';
import type { NotificationItem } from '../../types/civic';

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const items = await civicApi.listNotifications();
      setNotifications(items);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleMarkRead(id: string) {
    await civicApi.markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }

  async function handleMarkAllRead() {
    await civicApi.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast.success('All notifications marked as read.');
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <PortalLayout
      portal="citizen"
      title="Notifications"
      breadcrumb="Citizen Portal / Notifications"
      unreadNotifications={unreadCount}
      headerAction={
        unreadCount > 0 ? (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#163A5F] bg-[#F2F6FA] border border-slate-200 rounded-md hover:bg-[#E6EEF6] transition-colors whitespace-nowrap"
          >
            <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Mark All Read</span>
          </button>
        ) : undefined
      }
    >
      <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
        {loading ? (
          <div className="p-6 space-y-3">
            <div className="h-14 bg-slate-100 rounded animate-pulse" />
            <div className="h-14 bg-slate-100 rounded animate-pulse" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-10 text-center">
            <Bell className="h-8 w-8 text-slate-300 mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm font-semibold text-slate-900">No notifications yet</p>
            <p className="mt-1 text-xs text-slate-500">
              Status changes and resolution notes for your reports will appear here.
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                n.isRead ? 'bg-white' : 'bg-[#F2F6FA]'
              }`}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  {n.referenceId && (
                    <span className="font-mono font-semibold text-[#163A5F]">{n.referenceId}</span>
                  )}
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{formatDateTime(n.createdAt)}</span>
                  {!n.isRead && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-[#163A5F]">Unread</span>
                    </>
                  )}
                </div>
                <h2 className="mt-1 text-sm font-bold text-slate-900">{n.title}</h2>
                <p className="mt-1 text-sm text-slate-600">{n.message}</p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {n.complaintId && (
                  <Link
                    to={`/citizen/complaints/${n.complaintId}`}
                    className="px-3 py-1.5 text-xs font-semibold text-[#163A5F] border border-slate-300 rounded-md bg-white hover:bg-slate-50 whitespace-nowrap"
                  >
                    View Report
                  </Link>
                )}
                {!n.isRead && (
                  <button
                    type="button"
                    onClick={() => handleMarkRead(n.id)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 whitespace-nowrap"
                  >
                    Mark Read
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </PortalLayout>
  );
}
