"use client";

import { useState } from "react";
import { Plus, X, ArrowRight, Loader2, CalendarDays, MapPin, Tag, UploadCloud, ImageIcon, ListTodo, Palette, Copy } from "lucide-react";
import { createEvent, createEventFromBlueprint, updateEvent } from "@/lib/actions";
import { useRouter } from "next/navigation";

export type CustomQuestion = {
  id: string;
  label: string;
  type: "text" | "select";
  required: boolean;
  options?: string[];
};

export function CreateEventForm({ blueprints = [], initialData }: { blueprints?: any[]; initialData?: any }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>(initialData?.customQuestions || []);
  const [selectedBlueprintId, setSelectedBlueprintId] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const isEditing = !!initialData;

  const toDateTimeLocal = (d?: string | Date) => 
    d ? new Date(new Date(d).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : undefined;

  function addQuestion() {
    setCustomQuestions([...customQuestions, { id: Math.random().toString(36).substring(7), label: "", type: "text", required: false }]);
  }
  
  function updateQuestion(id: string, field: keyof CustomQuestion, value: any) {
    setCustomQuestions(customQuestions.map(q => q.id === id ? { ...q, [field]: value } : q));
  }

  function removeQuestion(id: string) {
    setCustomQuestions(customQuestions.filter(q => q.id !== id));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    
    // Override media files with the React state to support removals
    formData.delete("media");
    selectedFiles.forEach((file) => {
      formData.append("media", file);
    });

    try {
      if (isEditing) {
        // Update existing event
        formData.append("customQuestions", JSON.stringify(customQuestions));
        const res = await updateEvent(initialData.id, formData);
        
        if (res && res.error) {
          throw new Error(res.error);
        }
      } else if (selectedBlueprintId) {
        // Create from blueprint
        const title = formData.get("title") as string;
        const baseSlug = title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "");
        const slug = `${baseSlug}-${Math.floor(Math.random() * 1000)}`;
        
        const res = await createEventFromBlueprint(selectedBlueprintId, {
          title,
          slug,
          startsAt: new Date(formData.get("startsAt") as string),
          endsAt: new Date(formData.get("endsAt") as string),
          venueName: formData.get("venueName") as string,
          city: formData.get("city") as string,
        });
        
        if (res.error) {
          throw new Error(res.error);
        }
        
        if (res.slug) {
          router.push(`/dashboard/events/${res.eventId}/command`);
        }
      } else {
        // Create new from scratch
        formData.append("customQuestions", JSON.stringify(customQuestions));
        const res = await createEvent(formData);
        
        // createEvent redirects on success, so if it returns it's usually an error
        if (res && res.error) {
          throw new Error(res.error);
        }
      }
    } catch (err: any) {
      // Next.js redirect() throws NEXT_REDIRECT — this is not an error, ignore it
      if (err?.message?.includes("NEXT_REDIRECT") || err?.digest?.startsWith("NEXT_REDIRECT")) {
        return;
      }
      console.error(err);
      setIsPending(false);
      setError(err.message || "Something went wrong. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      <div className="space-y-6">
        
        {!isEditing && blueprints && blueprints.length > 0 && (
          <div className="rounded-[16px] border border-[rgba(22,19,17,0.1)] bg-[rgba(192,138,46,0.04)] p-6 shadow-sm">
            <h2 className="font-display mb-2 flex items-center gap-2 text-lg font-semibold text-ink">
              <Copy size={18} className="text-brass" /> Start from Blueprint
            </h2>
            <p className="mb-4 text-sm text-warm-600">
              Save time by copying ticket tiers, custom questions, and sessions from a past event.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label
                className={`relative flex cursor-pointer rounded-xl border p-4 transition-all ${
                  selectedBlueprintId === ""
                    ? "border-brass bg-brass/10 shadow-sm"
                    : "border-[rgba(22,19,17,0.1)] bg-paper hover:border-brass/40"
                }`}
              >
                <input
                  type="radio"
                  name="blueprint"
                  value=""
                  className="sr-only"
                  checked={selectedBlueprintId === ""}
                  onChange={() => setSelectedBlueprintId("")}
                />
                <div className="flex flex-col">
                  <span className="font-semibold text-ink">Start from scratch</span>
                  <span className="text-xs text-warm-500 mt-1">Empty canvas.</span>
                </div>
              </label>
              
              {blueprints.map(bp => (
                <label
                  key={bp.id}
                  className={`relative flex cursor-pointer rounded-xl border p-4 transition-all ${
                    selectedBlueprintId === bp.id
                      ? "border-brass bg-brass/10 shadow-sm"
                      : "border-[rgba(22,19,17,0.1)] bg-paper hover:border-brass/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="blueprint"
                    value={bp.id}
                    className="sr-only"
                    checked={selectedBlueprintId === bp.id}
                    onChange={() => setSelectedBlueprintId(bp.id)}
                  />
                  <div className="flex flex-col">
                    <span className="font-semibold text-ink">{bp.name}</span>
                    <span className="text-xs text-warm-500 mt-1">
                      {bp.includes.join(" • ")}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Basic Details */}
        <div className="rounded-[16px] border border-[rgba(22,19,17,0.1)] bg-paper p-6 shadow-sm">
          <h2 className="font-display mb-4 flex items-center gap-2 text-lg font-semibold text-ink">
            <Tag size={18} className="text-brass" /> Basic Details
          </h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-ink">
                Event Title
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                defaultValue={initialData?.title}
                placeholder="e.g. Annual Youth Retreat 2026"
                className="input !w-full"
              />
            </div>
            
            <div>
              <label htmlFor="eventType" className="mb-1.5 block text-sm font-medium text-ink">
                Event Type
              </label>
              <select
                id="eventType"
                name="eventType"
                required
                defaultValue={initialData?.eventType}
                className="input !w-full bg-parchment"
              >
                <option value="conference">Conference</option>
                <option value="retreat">Retreat</option>
                <option value="worship">Worship Night</option>
                <option value="church_service">Church Service</option>
              </select>
            </div>

            <div>
              <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-ink">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={4}
                defaultValue={initialData?.description}
                placeholder="Describe your event..."
                className="input !w-full !rounded-[12px] !py-3 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Date & Time */}
        <div className="rounded-[16px] border border-[rgba(22,19,17,0.1)] bg-paper p-6 shadow-sm">
          <h2 className="font-display mb-4 flex items-center gap-2 text-lg font-semibold text-ink">
            <CalendarDays size={18} className="text-brass" /> Date & Time
          </h2>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="startsAt" className="mb-1.5 block text-sm font-medium text-ink">
                Start Date & Time
              </label>
              <input
                id="startsAt"
                name="startsAt"
                type="datetime-local"
                required
                defaultValue={toDateTimeLocal(initialData?.startsAt)}
                className="input !w-full"
              />
            </div>
            <div>
              <label htmlFor="endsAt" className="mb-1.5 block text-sm font-medium text-ink">
                End Date & Time
              </label>
              <input
                id="endsAt"
                name="endsAt"
                type="datetime-local"
                required
                defaultValue={toDateTimeLocal(initialData?.endsAt)}
                className="input !w-full"
              />
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className={`rounded-[16px] border border-[rgba(22,19,17,0.1)] bg-paper p-6 shadow-sm transition-opacity duration-300 ${selectedBlueprintId ? 'opacity-50 pointer-events-none hidden' : ''}`}>
          <h2 className="font-display mb-4 flex items-center gap-2 text-lg font-semibold text-ink">
            <Palette size={18} className="text-brass" /> Branding
          </h2>
          
          <div>
            <label htmlFor="brandColor" className="mb-1.5 block text-sm font-medium text-ink">
              Brand Color
            </label>
            <p className="mb-3 text-xs text-warm-500">
              Select a primary color for your event page. This will adapt buttons, borders, and accents to match your brand.
            </p>
            <div className="flex items-center gap-3">
              <input
                id="brandColor"
                name="brandColor"
                type="color"
                defaultValue={initialData?.brandColor || "#c08a2e"}
                className="h-10 w-14 cursor-pointer rounded border border-warm-200 bg-transparent p-1"
                onChange={(e) => {
                  const span = e.target.nextElementSibling;
                  if (span) span.textContent = e.target.value;
                }}
              />
              <span className="text-sm text-warm-600 font-mono">#c08a2e</span>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="rounded-[16px] border border-[rgba(22,19,17,0.1)] bg-paper p-6 shadow-sm">
          <h2 className="font-display mb-4 flex items-center gap-2 text-lg font-semibold text-ink">
            <MapPin size={18} className="text-brass" /> Location
          </h2>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="venueName" className="mb-1.5 block text-sm font-medium text-ink">
                Venue Name
              </label>
              <input
                id="venueName"
                name="venueName"
                type="text"
                required
                defaultValue={initialData?.venueName}
                placeholder="e.g. Main Auditorium"
                className="input !w-full"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="city" className="mb-1.5 block text-sm font-medium text-ink">
                City
              </label>
              <input
                id="city"
                name="city"
                type="text"
                required
                defaultValue={initialData?.city}
                placeholder="e.g. Lagos, Nigeria"
                className="input !w-full"
              />
            </div>
          </div>
        </div>

        {/* Custom Registration Questions */}
        <div className={`rounded-[16px] border border-[rgba(22,19,17,0.1)] bg-paper p-6 shadow-sm transition-opacity duration-300 ${selectedBlueprintId ? 'opacity-50 pointer-events-none hidden' : ''}`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display flex items-center gap-2 text-lg font-semibold text-ink">
              <ListTodo size={18} className="text-brass" /> Custom Questions
            </h2>
            <button
              type="button"
              onClick={addQuestion}
              className="btn btn-secondary !py-1.5 !px-3 !text-sm"
            >
              <Plus size={16} className="mr-1" /> Add Question
            </button>
          </div>
          <p className="mb-6 text-sm text-warm-500">
            Ask attendees for specific information during registration (e.g. Dietary Restrictions, Job Title).
          </p>

          <div className="space-y-4">
            {customQuestions.length === 0 ? (
              <div className="text-center py-6 border border-dashed rounded-xl border-warm-200 text-warm-500 text-sm">
                No custom questions added.
              </div>
            ) : (
              customQuestions.map((q, index) => (
                <div key={q.id} className="relative rounded-xl border border-warm-200 bg-parchment p-4 pr-12">
                  <button
                    type="button"
                    onClick={() => removeQuestion(q.id)}
                    className="absolute right-3 top-3 text-warm-400 hover:text-red-500 transition-colors"
                  >
                    <X size={18} />
                  </button>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-xs font-medium text-ink">Question Label</label>
                      <input
                        type="text"
                        value={q.label}
                        onChange={(e) => updateQuestion(q.id, "label", e.target.value)}
                        placeholder="e.g. Do you have any dietary restrictions?"
                        className="input !w-full !py-2 !text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-ink">Answer Type</label>
                      <select
                        value={q.type}
                        onChange={(e) => updateQuestion(q.id, "type", e.target.value)}
                        className="input !w-full !py-2 !text-sm"
                      >
                        <option value="text">Short Text</option>
                        <option value="select">Dropdown Select</option>
                      </select>
                    </div>
                    <div className="flex items-center pt-6">
                      <label className="flex items-center gap-2 cursor-pointer text-sm text-ink">
                        <input
                          type="checkbox"
                          checked={q.required}
                          onChange={(e) => updateQuestion(q.id, "required", e.target.checked)}
                          className="rounded border-warm-300 text-brass focus:ring-brass"
                        />
                        Required answer
                      </label>
                    </div>
                    {q.type === "select" && (
                      <div className="sm:col-span-2">
                        <label className="mb-1.5 block text-xs font-medium text-ink">Dropdown Options (comma separated)</label>
                        <input
                          type="text"
                          value={q.options?.join(", ") || ""}
                          onChange={(e) => updateQuestion(q.id, "options", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                          placeholder="e.g. Vegetarian, Vegan, Gluten-Free"
                          className="input !w-full !py-2 !text-sm"
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Media Upload */}
        <div className="rounded-[16px] border border-[rgba(22,19,17,0.1)] bg-paper p-6 shadow-sm">
          <h2 className="font-display mb-4 flex items-center gap-2 text-lg font-semibold text-ink">
            <ImageIcon size={18} className="text-brass" /> Event Media
          </h2>
          
          <div>
            <label htmlFor="media" className="mb-1.5 block text-sm font-medium text-ink">
              Upload Photos & Videos
            </label>
            <p className="mb-4 text-sm text-warm-500">
              Showcase your event with high-quality promotional materials. You can select multiple files.
            </p>
            
            <div className="relative flex flex-col items-center justify-center rounded-[12px] border-2 border-dashed border-[rgba(22,19,17,0.15)] bg-parchment py-12 transition-colors hover:border-[var(--color-brass)] hover:bg-[rgba(192,138,46,0.05)]">
              <UploadCloud size={40} className="mb-4 text-brass-light" />
              <p className="mb-1 text-sm font-semibold text-ink">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-warm-500">
                SVG, PNG, JPG, or MP4 (max 20MB)
              </p>
              <input
                id="media"
                name="media"
                type="file"
                multiple
                accept="image/*,video/*"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                onChange={(e) => {
                  if (e.target.files) {
                    setSelectedFiles(Array.from(e.target.files));
                  }
                }}
              />
            </div>

            {isEditing && initialData?.media && initialData.media.length > 0 && selectedFiles.length === 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {initialData.media.map((file: any, i: number) => (
                  <div key={i} className="relative aspect-video overflow-hidden rounded-lg border border-warm-200">
                    {file.type === "video" ? (
                      <video src={file.url} className="h-full w-full object-cover" />
                    ) : (
                      <img src={file.url} alt="media" className="h-full w-full object-cover" />
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {selectedFiles.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {selectedFiles.map((file, i) => (
                  <div key={i} className="group relative aspect-video overflow-hidden rounded-lg border border-warm-200">
                    {file.type.startsWith("video/") ? (
                      <video src={URL.createObjectURL(file)} className="h-full w-full object-cover" />
                    ) : (
                      <img src={URL.createObjectURL(file)} alt="media" className="h-full w-full object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        const newFiles = [...selectedFiles];
                        newFiles.splice(i, 1);
                        setSelectedFiles(newFiles);
                        // Also clear the file input if empty
                        if (newFiles.length === 0) {
                          const input = document.getElementById('media') as HTMLInputElement;
                          if (input) input.value = '';
                        }
                      }}
                      className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-signal-red/80"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-[var(--color-signal-red)]">
            {error}
          </div>
        )}
        <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="btn btn-primary !px-8 !py-3 w-full sm:w-auto"
        >
          {isPending ? (
            <>
              <Loader2 size={18} className="mr-2 animate-spin" />
              {isEditing ? "Saving Changes..." : "Creating Event..."}
            </>
          ) : (
            <>
              {isEditing ? "Save Changes" : "Create Event"}
              <ArrowRight size={18} className="ml-2" />
            </>
          )}
        </button>
        </div>
      </div>
    </form>
  );
}
