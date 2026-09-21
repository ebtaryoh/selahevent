"use client";

import { useState } from "react";
import { ArrowLeft, Plus, Mail, Trash2 } from "lucide-react";
import Link from "next/link";
import { CommunicationForm } from "@/components/communication-form";
import { deleteCommsPlanItem } from "@/lib/actions/communications";

export default function CommunicationsPage({
  event,
}: {
  event: any;
}) {
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (itemId: string) => {
    if (confirm("Are you sure you want to delete this communication?")) {
      setDeleting(itemId);
      await deleteCommsPlanItem(event.id, itemId);
      setDeleting(null);
    }
  };

  const commsPlan = event.commsPlan || [];

  return (
    <div className="max-w-[54rem]">
      <header className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/events/${event.id}`}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(22,19,17,0.11)] transition-colors hover:bg-[rgba(22,19,17,0.04)]"
          >
            <ArrowLeft size={16} className="text-ink" />
          </Link>
          <h1 className="font-display text-[1.75rem] font-semibold text-ink">
            Communications Timeline
          </h1>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary"
          >
            <Plus size={16} /> New Email
          </button>
        )}
      </header>

      {showForm && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-display text-lg font-medium text-ink">Draft Message</h2>
            <button 
              onClick={() => setShowForm(false)}
              className="text-sm text-warm-500 hover:text-ink transition-colors"
            >
              Cancel
            </button>
          </div>
          <CommunicationForm eventId={event.id} onSuccess={() => setShowForm(false)} />
        </div>
      )}

      {commsPlan.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center rounded-[16px] border border-dashed border-[rgba(22,19,17,0.2)] bg-[rgba(22,19,17,0.02)] py-20 text-center">
          <Mail size={48} className="text-warm-300 mb-4" />
          <h3 className="text-lg font-medium text-ink">No communications scheduled</h3>
          <p className="mt-1 text-sm text-warm-500 max-w-sm">
            Plan out emails to attendees, speakers, and volunteers leading up to the event.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary mt-6"
          >
            <Plus size={16} /> Draft First Email
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {commsPlan.map((item: any) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-[16px] border border-[rgba(22,19,17,0.09)] bg-paper p-6"
            >
              <div className="flex items-center gap-5">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  item.status === 'sent' ? 'bg-green-50 text-green-600' :
                  item.status === 'scheduled' ? 'bg-blue-50 text-blue-600' :
                  'bg-warm-100 text-warm-500'
                }`}>
                  <Mail size={18} />
                </div>
                <div>
                  <h3 className="font-display text-[1.125rem] font-medium text-ink">
                    {item.title}
                  </h3>
                  <div className="text-[0.875rem] text-warm-500 mt-1 flex items-center gap-2">
                    <span className="capitalize">{item.audience}</span>
                    <span>·</span>
                    <span className={`capitalize ${
                      item.status === 'sent' ? 'text-green-600 font-medium' :
                      item.status === 'scheduled' ? 'text-blue-600 font-medium' : ''
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDelete(item.id)}
                disabled={deleting === item.id}
                className="btn btn-ghost text-warm-500 hover:text-red-600 hover:bg-red-50 !p-2"
                aria-label="Delete communication"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
