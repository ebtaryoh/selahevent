"use client";

import { useState } from "react";
import { saveEventAsBlueprint } from "@/lib/actions";
import { Sparkles, X, Loader2 } from "lucide-react";

export function SaveBlueprintButton({ eventId }: { eventId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsSaving(true);
    setError(null);
    try {
      const res = await saveEventAsBlueprint(eventId, name, description);
      if (res.error) {
        setError(res.error);
      } else {
        setIsOpen(false);
        // We could show a toast here
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <button 
        type="button" 
        onClick={() => setIsOpen(true)}
        className="btn btn-ghost !border-[rgba(247,243,236,0.18)] !text-parchment hover:!bg-[rgba(247,243,236,0.1)]"
      >
        <Sparkles size={16} /> Save as blueprint
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
            onClick={() => !isSaving && setIsOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-[20px] bg-paper p-8 shadow-2xl">
            <button
              onClick={() => setIsOpen(false)}
              disabled={isSaving}
              className="absolute right-6 top-6 text-warm-400 hover:text-ink"
            >
              <X size={20} />
            </button>

            <h3 className="font-display text-[1.4rem] font-semibold text-ink">Save as Blueprint</h3>
            <p className="mt-2 text-[0.875rem] text-warm-500">
              Preserve this event's structure—including ticket types, questions, and sessions—to instantly duplicate it later.
            </p>

            <form onSubmit={handleSave} className="mt-6 space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}
              
              <div>
                <label className="mb-1.5 block text-[0.8125rem] font-medium text-ink">Blueprint Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  disabled={isSaving}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Annual Youth Conference"
                  className="input"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[0.8125rem] font-medium text-ink">Description (Optional)</label>
                <textarea
                  disabled={isSaving}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Briefly describe what this blueprint is best for..."
                  className="input min-h-[80px] resize-y"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsOpen(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !name.trim()}
                  className="btn btn-primary"
                >
                  {isSaving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : "Save blueprint"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
