"use client";

import { useState } from "react";
import {
  Plus,
  X,
  ArrowRight,
  Loader2,
  CalendarDays,
  MapPin,
  Tag,
  UploadCloud,
  ImageIcon,
  ListTodo,
  Palette,
  Copy,
  ShieldCheck,
  Users,
  Sparkles,
  HelpCircle,
  BedDouble,
  ChevronDown,
  ChevronUp,
  Utensils,
  CheckCircle2,
  Info,
} from "lucide-react";
import { createEvent, createEventFromBlueprint, updateEvent } from "@/lib/actions";
import { validateChristianEventContent } from "@/lib/christian-moderation";
import { useRouter } from "next/navigation";
import { FocusImageUpload } from "./focus-image-upload";

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
  const [attendeeTypes, setAttendeeTypes] = useState<string>(
    initialData?.attendeeTypes ? initialData.attendeeTypes.join(", ") : "Delegate, Student, Minister / clergy, Volunteer, Speaker, Guest"
  );
  const [accommodationMode, setAccommodationMode] = useState<string>(
    initialData?.accommodationMode || "none"
  );
  const [collectGender, setCollectGender] = useState<boolean>(
    initialData?.collectGender ?? false
  );
  const [collectAgeBracket, setCollectAgeBracket] = useState<boolean>(
    initialData?.collectAgeBracket ?? false
  );
  const [collectOccupation, setCollectOccupation] = useState<boolean>(
    initialData?.collectOccupation ?? false
  );
  const [callForVolunteers, setCallForVolunteers] = useState<boolean>(
    initialData ? (initialData.callForVolunteers !== false) : true
  );
  const [volunteerUnitsInput, setVolunteerUnitsInput] = useState<string>(
    initialData?.volunteerUnits && Array.isArray(initialData.volunteerUnits)
      ? initialData.volunteerUnits.join(", ")
      : "Ushering & Protocol, Media & Live Stream, Choir & Music, Medical & First Aid, Prayer Intercessors, Sanitation & Venue Prep, Children & Sunday School, Transport & Logistics"
  );
  const [selectedEventType, setSelectedEventType] = useState<string>(
    initialData?.eventType || "conference"
  );
  const [appliedPresetNotice, setAppliedPresetNotice] = useState<string | null>(null);
  const [showFeatureGuide, setShowFeatureGuide] = useState<boolean>(false);
  const [selectedBlueprintId, setSelectedBlueprintId] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  
  // Extract existing focus point if editing
  const existingCoverImage = initialData?.media?.[0];
  const [focus, setFocus] = useState<{ x: number; y: number }>(
    existingCoverImage?.focus || { x: 50, y: 50 }
  );

  function getPresetForType(type: string) {
    // 1. Campus & Student Fellowships
    if (type === "fyb_dinner" || type === "campus_handover") {
      return {
        title: type === "fyb_dinner" ? "Final Year Brethren (FYB) Dinner" : "Fellowship Handover Banquet",
        badge: "Table & Seat Allocation Enabled",
        accommodationMode: "none",
        collectGender: false,
        collectAgeBracket: false,
        collectOccupation: false,
        seating: "Table & Seat Allocation Active",
        why: "Send-off and transition banquets require assigned tables for graduating brethren, fellowship executives, and guests. Checkout is kept fast and frictionless.",
        suggestedQuestion: {
          label: "Department & Faculty / Final Year Set",
          type: "text" as const,
          required: true,
        },
      };
    }
    if (type === "campus_conference" || type === "academic_summit") {
      return {
        title: type === "campus_conference" ? "Campus Fellowship Conference" : "Students' Academic & Spiritual Summit",
        badge: "Campus Hostel Lodging & Demographics",
        accommodationMode: "both",
        collectGender: true,
        collectAgeBracket: true,
        collectOccupation: true,
        seating: "Open Seating",
        why: "Joint-campus conferences (NIFES, JCCF, RCF, CASOR, etc.) require gender collection to segregate male/female campus hostels, plus student vs graduate tracking.",
        suggestedQuestion: {
          label: "Institution & Campus Fellowship Chapter",
          type: "text" as const,
          required: true,
        },
      };
    }
    if (type === "freshers_welcome") {
      return {
        title: "Freshers' Welcome & Orientation Night",
        badge: "Fast Student Pass Access",
        accommodationMode: "none",
        collectGender: false,
        collectAgeBracket: true,
        collectOccupation: true,
        seating: "Open Seating",
        why: "Welcome new 100-level students into the fellowship with instant WhatsApp digital passes and department tracking.",
        suggestedQuestion: {
          label: "Course / Department of Study",
          type: "text" as const,
          required: true,
        },
      };
    }

    // 2. Youth, Teens & Young Adults
    if (type === "youth_camp" || type === "teens_camp") {
      return {
        title: type === "youth_camp" ? "Youth Camp & Retreat" : "Teenagers' Bootcamp & Camp",
        badge: "Camp Hostel Lodging & Welfare Segregation",
        accommodationMode: "both",
        collectGender: true,
        collectAgeBracket: true,
        collectOccupation: false,
        seating: "Open Seating",
        why: "Youth & Teen camps strictly mandate Gender tracking to automatically allocate campers to Men's or Women's dorms, with emergency guardian contact collection.",
        suggestedQuestion: {
          label: "Parent / Guardian Contact & Emergency Phone",
          type: "text" as const,
          required: true,
        },
      };
    }
    if (type === "youth_hangout" || type === "church_picnic" || type === "game_night" || type === "love_feast") {
      return {
        title: "Christian Social Hangout & Fun Day",
        badge: "Instant 10-Second Digital Pass",
        accommodationMode: "none",
        collectGender: false,
        collectAgeBracket: false,
        collectOccupation: false,
        seating: "Casual / Open Fellowship",
        why: "Picnics, games nights, and love feasts thrive on instant, frictionless registration so members and invited friends can grab passes in seconds.",
      };
    }
    if (type === "career_workshop") {
      return {
        title: "Career, Skills & Tech Workshop",
        badge: "Professional Mentorship & Streams",
        accommodationMode: "none",
        collectGender: false,
        collectAgeBracket: true,
        collectOccupation: true,
        seating: "Workshop Seating",
        why: "Career & skills hubs capture job status (student vs employed) to group delegates into relevant tech/business tracks.",
        suggestedQuestion: {
          label: "Target Career Stream / Field of Interest",
          type: "text" as const,
          required: true,
        },
      };
    }

    // 3. Singles & Relationships
    if (type === "singles_dinner") {
      return {
        title: "Singles Gala Dinner & Red Carpet",
        badge: "Table & Seat Allocation Enabled",
        accommodationMode: "none",
        collectGender: true,
        collectAgeBracket: true,
        collectOccupation: true,
        seating: "Table & Seat Allocation Active",
        why: "Formal dinner with assigned tables, allowing singles to dine, connect, and network in an elegant Christian environment.",
      };
    }
    if (type === "singles_program" || type === "singles_hangout" || type === "premarital_class") {
      return {
        title: "Singles Summit & Relationship Seminar",
        badge: "Demographic Breakouts & Networking",
        accommodationMode: "none",
        collectGender: true,
        collectAgeBracket: true,
        collectOccupation: true,
        seating: "Open Seating",
        why: "Capturing age ranges and occupations helps organizers guide delegates into age-appropriate breakout sessions and relationship panels.",
      };
    }

    // 4. Couples, Married & Family Life
    if (type === "couples_dinner") {
      return {
        title: "Couples Dinner & Romance Night",
        badge: "Table & Seat Allocation (Reserved Pairs)",
        accommodationMode: "none",
        collectGender: false,
        collectAgeBracket: false,
        collectOccupation: false,
        seating: "Table & Seat Allocation Active",
        why: "Couples dinners require reserved table numbers for pairs and served catering. Table assignments display on digital WhatsApp passes.",
        suggestedQuestion: {
          label: "Spouse's Full Name",
          type: "text" as const,
          required: true,
        },
      };
    }
    if (type === "marriage_retreat") {
      return {
        title: "Marriage Enrichment Retreat & Getaway",
        badge: "Couples Hotel / Chalet Lodging",
        accommodationMode: "paid",
        collectGender: false,
        collectAgeBracket: false,
        collectOccupation: false,
        seating: "Open Seating",
        why: "Weekend couples getaways offer paid hotel rooms or chalets. Create dedicated room upgrade packages under Tickets.",
        suggestedQuestion: {
          label: "Years of Marriage",
          type: "text" as const,
          required: false,
        },
      };
    }
    if (type === "wedding") {
      return {
        title: "Christian Wedding Celebration",
        badge: "Table Seating & Reception Invitations",
        accommodationMode: "none",
        collectGender: false,
        collectAgeBracket: false,
        collectOccupation: false,
        seating: "Table & Seat Allocation Active",
        why: "Weddings benefit from Table & Seat numbers on digital WhatsApp passes so family and invited guests find their tables effortlessly.",
        suggestedQuestion: {
          label: "Guest of Bride or Groom?",
          type: "select" as const,
          required: true,
          options: ["Bride's Family / Guest", "Groom's Family / Guest", "Church / Mutual Friend"],
        },
      };
    }
    if (type === "family_conference") {
      return {
        title: "Parents & Family Life Conference",
        badge: "Family Ministry & Parenting",
        accommodationMode: "none",
        collectGender: false,
        collectAgeBracket: false,
        collectOccupation: true,
        seating: "Open Seating",
        why: "Family life conferences focus on godly parenting and marital balance.",
      };
    }

    // 5. Pastors, Ministers & Church Leadership
    if (type === "ministers_conference" || type === "ministers_retreat" || type === "workers_retreat" || type === "elders_retreat") {
      return {
        title: "Pastors, Ministers & Leadership Gathering",
        badge: "Executive Lodging & Ministry Roles",
        accommodationMode: "both",
        collectGender: false,
        collectAgeBracket: false,
        collectOccupation: true,
        seating: "Reserved / Open Seating",
        why: "Leadership retreats provide executive lodging for pastors and ministers, with church leadership credentials tracking.",
        suggestedQuestion: {
          label: "Ministry Office / Church Title (e.g. Pastor, Deacon, Minister, Worker)",
          type: "text" as const,
          required: true,
        },
      };
    }

    // 6. Church Groups & Departmental Wings
    if (type === "mens_breakfast") {
      return {
        title: "Men's Fellowship Breakfast & Summit",
        badge: "Breakfast Table Seating & Brotherhood",
        accommodationMode: "none",
        collectGender: false,
        collectAgeBracket: false,
        collectOccupation: true,
        seating: "Table & Seat Allocation Active",
        why: "Men's breakfasts feature reserved dining tables and marketplace discussions.",
        suggestedQuestion: {
          label: "Profession / Industry",
          type: "text" as const,
          required: false,
        },
      };
    }
    if (type === "womens_conference") {
      return {
        title: "Women's Conference & Fellowship",
        badge: "Spiritual Empowerment & Fellowship",
        accommodationMode: "none",
        collectGender: false,
        collectAgeBracket: false,
        collectOccupation: false,
        seating: "Open Seating",
        why: "Annual gatherings for Women of Faith with keynote speakers and fellowship tea.",
      };
    }
    if (type === "choir_retreat" || type === "ushers_training" || type === "media_workshop" || type === "departmental_dinner") {
      return {
        title: "Church Department Training & Fellowship",
        badge: "Service Department Empowerment",
        accommodationMode: "none",
        collectGender: false,
        collectAgeBracket: false,
        collectOccupation: false,
        seating: type === "departmental_dinner" ? "Table & Seat Allocation Active" : "Open Seating",
        why: "Department bootcamps empower choir, ushers, media, and technical teams with team check-ins.",
        suggestedQuestion: {
          label: "Department Unit / Vocal Part (e.g. Soprano, Camera, Protocol)",
          type: "text" as const,
          required: true,
        },
      };
    }
    if (type === "vbs_camp") {
      return {
        title: "Children's Vacation Bible School (VBS)",
        badge: "Kids Camp & Child Safeguarding",
        accommodationMode: "none",
        collectGender: true,
        collectAgeBracket: true,
        collectOccupation: false,
        seating: "Classroom / Open",
        why: "VBS captures child age brackets and parent contacts for safety.",
        suggestedQuestion: {
          label: "Parent / Guardian Contact & Allergies",
          type: "text" as const,
          required: true,
        },
      };
    }

    // 7. Banquets & Social Celebrations
    if (type === "banquet" || type === "birthday") {
      return {
        title: "Christian Banquet & Dinner",
        badge: "Table & Seat Allocation Enabled",
        accommodationMode: "none",
        collectGender: false,
        collectAgeBracket: false,
        collectOccupation: false,
        seating: "Table & Seat Allocation Active",
        why: "Banquets require reserved Table & Seat allocation for dining and ushers. Lodging and demographic questions are disabled to keep checkout quick and frictionless.",
        suggestedQuestion: {
          label: "Dietary Restrictions / Food Allergies",
          type: "text" as const,
          required: false,
        },
      };
    }

    // 8. Congregational Conventions, Crusades, Vigils, Worship
    if (type === "church_convention") {
      return {
        title: "Annual Church Convention / Synod",
        badge: "General Assembly & Multi-Day Housing",
        accommodationMode: "both",
        collectGender: true,
        collectAgeBracket: false,
        collectOccupation: false,
        seating: "Auditorium Seating",
        why: "Annual church conventions feature thousands of delegates with hostel housing and executive lodging.",
      };
    }
    if (type === "crusade" || type === "vigil" || type === "worship" || type === "concert" || type === "youth_rally") {
      return {
        title: "Worship Night, Crusade & Concert",
        badge: "High-Volume Fast Pass Access",
        accommodationMode: "none",
        collectGender: false,
        collectAgeBracket: false,
        collectOccupation: false,
        seating: "Open Seating",
        why: "High-volume spiritual gatherings require instant frictionless registration so attendees can claim digital passes in seconds.",
      };
    }
    if (type === "business") {
      return {
        title: "Marketplace & Business Summit",
        badge: "Industry Networking & Professional Segmentation",
        accommodationMode: "none",
        collectGender: false,
        collectAgeBracket: false,
        collectOccupation: true,
        seating: "Open / VIP Seating",
        why: "Marketplace summits benefit from collecting Occupation and Industry so organizers can facilitate B2B networking and executive seating.",
        suggestedQuestion: {
          label: "Company / Organization & Industry",
          type: "text" as const,
          required: true,
        },
      };
    }
    if (type === "retreat") {
      return {
        title: "Spiritual Retreat",
        badge: "Hostel Lodging & Welfare Segregation",
        accommodationMode: "both",
        collectGender: true,
        collectAgeBracket: true,
        collectOccupation: false,
        seating: "Open Seating",
        why: "Multi-day retreats need Gender collection to automatically separate Men's and Women's camp dormitories.",
      };
    }

    return {
      title: "Christian Gathering & Fellowship",
      badge: "Standard Access",
      accommodationMode: "none",
      collectGender: false,
      collectAgeBracket: false,
      collectOccupation: false,
      seating: "Open Seating",
      why: "Streamlined registration with zero friction so attendees can claim their digital passes swiftly.",
    };
  }

  function applyPreset(type: string) {
    const preset = getPresetForType(type);
    setAccommodationMode(preset.accommodationMode);
    setCollectGender(preset.collectGender);
    setCollectAgeBracket(preset.collectAgeBracket);
    setCollectOccupation(preset.collectOccupation);

    if (preset.suggestedQuestion) {
      const alreadyHas = customQuestions.some(
        (q: CustomQuestion) => q.label.toLowerCase() === preset.suggestedQuestion!.label.toLowerCase()
      );
      if (!alreadyHas) {
        setCustomQuestions((prev: CustomQuestion[]) => [
          ...prev,
          {
            id: Math.random().toString(36).substring(7),
            label: preset.suggestedQuestion!.label,
            type: preset.suggestedQuestion!.type,
            required: preset.suggestedQuestion!.required,
            options: preset.suggestedQuestion!.options,
          },
        ]);
      }
    }

    setAppliedPresetNotice(`Applied recommended settings for ${preset.title}!`);
    setTimeout(() => setAppliedPresetNotice(null), 4000);
  }
  
  const existingVideoUrl = initialData?.media?.find((m: any) => m.type === "video")?.url;

  const isEditing = !!initialData;

  const toDateTimeLocal = (d?: string | Date) => 
    d ? new Date(new Date(d).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : undefined;

  function addQuestion() {
    setCustomQuestions([...customQuestions, { id: Math.random().toString(36).substring(7), label: "", type: "text", required: false }]);
  }
  
  function updateQuestion(id: string, field: keyof CustomQuestion, value: any) {
    setCustomQuestions(customQuestions.map((q: CustomQuestion) => q.id === id ? { ...q, [field]: value } : q));
  }

  function removeQuestion(id: string) {
    setCustomQuestions(customQuestions.filter((q: CustomQuestion) => q.id !== id));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    
    // Client-side Christian Ministry Moderation Guard
    const candidateTitle = (formData.get("title") as string) || "";
    const candidateTheme = (formData.get("theme") as string) || "";
    const candidateTagline = (formData.get("tagline") as string) || "";
    const candidateDescription = (formData.get("description") as string) || "";
    const candidateEventType = (formData.get("eventType") as string) || "";

    const moderation = validateChristianEventContent({
      title: candidateTitle,
      theme: candidateTheme,
      tagline: candidateTagline,
      description: candidateDescription,
      eventType: candidateEventType,
    });

    if (!moderation.isValid) {
      setError(moderation.reason || "This event does not comply with the Christian Ministry Covenant.");
      setIsPending(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Override media files with the React state to support removals
    formData.delete("media");
    if (coverImageFile) {
      formData.append("media", coverImageFile);
    }
    selectedFiles.forEach((file: File) => {
      formData.append("media", file);
    });

    // Pass focus data
    formData.append("coverImageFocusX", focus.x.toString());
    formData.append("coverImageFocusY", focus.y.toString());

    try {
      if (isEditing) {
        // Update existing event
        formData.append("customQuestions", JSON.stringify(customQuestions));
        formData.append(
          "attendeeTypes",
          JSON.stringify(attendeeTypes.split(",").map((t: string) => t.trim()).filter(Boolean))
        );
        formData.append("accommodationMode", accommodationMode);
        formData.append("collectGender", String(collectGender));
        formData.append("collectAgeBracket", String(collectAgeBracket));
        formData.append("collectOccupation", String(collectOccupation));
        formData.append("callForVolunteers", String(callForVolunteers));
        formData.append(
          "volunteerUnits",
          JSON.stringify(volunteerUnitsInput.split(",").map((u: string) => u.trim()).filter(Boolean))
        );
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
          router.push(`/dashboard/events/${res.eventId}`);
        }
      } else {
        // Create new from scratch
        formData.append("customQuestions", JSON.stringify(customQuestions));
        formData.append(
          "attendeeTypes",
          JSON.stringify(attendeeTypes.split(",").map((t: string) => t.trim()).filter(Boolean))
        );
        formData.append("accommodationMode", accommodationMode);
        formData.append("collectGender", String(collectGender));
        formData.append("collectAgeBracket", String(collectAgeBracket));
        formData.append("collectOccupation", String(collectOccupation));
        formData.append("callForVolunteers", String(callForVolunteers));
        formData.append(
          "volunteerUnits",
          JSON.stringify(volunteerUnitsInput.split(",").map((u: string) => u.trim()).filter(Boolean))
        );
        const res = await createEvent(formData);
        
        // createEvent redirects on success, so if it returns it's usually an error
        if (res && res.error) {
          const resolved = typeof res.error === "object" && res.error !== null && "then" in res.error
            ? await res.error
            : res.error;
          throw new Error(typeof resolved === "string" ? resolved : "Could not create event. Please verify all details.");
        }
      }
    } catch (err: any) {
      // Next.js redirect() throws NEXT_REDIRECT — this is not an error, ignore it
      if (err?.message?.includes("NEXT_REDIRECT") || err?.digest?.startsWith("NEXT_REDIRECT")) {
        return;
      }
      console.error(err);
      setIsPending(false);
      let message = err?.message;
      if (!message || message === "[object Promise]" || message === "[object Object]") {
        message = "Could not complete event setup. Please verify required fields and try again.";
      }
      setError(message);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      {/* Christian Ministry Guard & Covenant Notice */}
      <div className="rounded-2xl border border-brass/35 bg-brass/10 p-5 backdrop-blur-md shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brass/20 text-brass border border-brass/40 shadow-sm mt-0.5">
            <Sparkles size={18} />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-sm font-bold text-ink">
              Selah Christian Ministry Covenant · 1 Corinthians 14:40
            </h3>
            <p className="text-xs text-warm-500 leading-relaxed font-light">
              Selah is consecrated exclusively for Christ-honoring church programs, conferences, camp retreats, and Christian fellowships. All events are automatically screened to protect the sanctuary of this platform. Secular parties, nightclubs, gambling, and worldly entertainment cannot be hosted on Selah.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        
        {!isEditing && blueprints && blueprints.length > 0 && (
          <div className="rounded-[16px] border border-white/10 bg-brass/10 backdrop-blur-md p-6 shadow-sm">
            <h2 className="font-display mb-2 flex items-center gap-2 text-lg font-semibold text-white">
              <Copy size={18} className="text-brass" /> Start from Blueprint
            </h2>
            <p className="mb-4 text-sm text-white/60">
              Save time by copying ticket tiers, custom questions, and sessions from a past event.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label
                className={`relative flex cursor-pointer rounded-xl border p-4 transition-all ${
                  selectedBlueprintId === ""
                    ? "border-brass bg-brass/10 shadow-sm"
                    : "border-white/10 bg-[rgba(16,16,18,0.5)] backdrop-blur-md hover:border-brass/40"
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
                  <span className="font-semibold text-white">Start from scratch</span>
                  <span className="text-xs text-white/60 mt-1">Empty canvas.</span>
                </div>
              </label>
              
              {blueprints.map(bp => (
                <label
                  key={bp.id}
                  className={`relative flex cursor-pointer rounded-xl border p-4 transition-all ${
                    selectedBlueprintId === bp.id
                      ? "border-brass bg-brass/10 shadow-sm"
                      : "border-white/10 bg-[rgba(16,16,18,0.5)] backdrop-blur-md hover:border-brass/40"
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
                    <span className="font-semibold text-white">{bp.name}</span>
                    <span className="text-xs text-white/60 mt-1">
                      {bp.includes.join(" • ")}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Basic Details */}
        <div className="rounded-[16px] border border-white/10 bg-[rgba(16,16,18,0.5)] backdrop-blur-md p-6 shadow-sm">
          <h2 className="font-display mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <Tag size={18} className="text-brass" /> Basic Details
          </h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-white">
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
              <label htmlFor="eventType" className="mb-1.5 block text-sm font-medium text-white">
                Event Type & Category
              </label>
              <select
                id="eventType"
                name="eventType"
                required
                value={selectedEventType}
                onChange={(e) => setSelectedEventType(e.target.value)}
                className="input !w-full bg-black/20"
              >
                {/* 1. Campus Fellowships & Student Ministries */}
                <optgroup label="🎓 Campus Fellowships & Student Ministries">
                  <option value="fyb_dinner">Final Year Brethren (FYB) Dinner (Tag: Christian Hangout · Table Seated)</option>
                  <option value="campus_conference">All-Campus Fellowship Conference (Tag: Conferences · Camp Lodging)</option>
                  <option value="freshers_welcome">Freshers&apos; Welcome &amp; Orientation (Tag: Youth Meetings)</option>
                  <option value="campus_handover">Fellowship Handover Banquet (Tag: Christian Hangout · Table Seated)</option>
                  <option value="academic_summit">Students&apos; Academic &amp; Spiritual Summit (Tag: Conferences)</option>
                </optgroup>

                {/* 2. Youth, Teenagers & Young Adults */}
                <optgroup label="⚡ Youth, Teenagers & Young Adults">
                  <option value="youth_camp">Youth Camp &amp; Retreat (Tag: Retreats · Camp Lodging)</option>
                  <option value="teens_camp">Teenagers&apos; Bootcamp &amp; Camp (Tag: Youth Meetings · Dorms)</option>
                  <option value="youth_meetings">Youth Meeting &amp; Service (Tag: Youth Meetings)</option>
                  <option value="youth_hangout">Youth Games Day &amp; Hangout (Tag: Christian Hangout)</option>
                  <option value="youth_rally">Youth Praise Rally &amp; Explosion (Tag: Concerts)</option>
                  <option value="career_workshop">Youth Career, Tech &amp; Skills Hub (Tag: Seminars)</option>
                </optgroup>

                {/* 3. Singles & Courtship */}
                <optgroup label="💍 Singles & Courtship">
                  <option value="singles_dinner">Singles Gala Dinner (Tag: Christian Hangout · Table Seated)</option>
                  <option value="singles_hangout">Singles Mixer &amp; Outdoor Hangout (Tag: Christian Hangout)</option>
                  <option value="singles_program">Singles Summit &amp; Seminar (Tag: Singles Program)</option>
                  <option value="premarital_class">Courtship &amp; Pre-Marital Class (Tag: Seminars)</option>
                </optgroup>

                {/* 4. Couples, Married & Family Life */}
                <optgroup label="💑 Couples, Married & Family Life">
                  <option value="couples_dinner">Couples Dinner &amp; Romance Night (Tag: Married &amp; Singles · Table Seated)</option>
                  <option value="marriage_retreat">Marriage Enrichment Retreat &amp; Getaway (Tag: Retreats · Hotel)</option>
                  <option value="wedding">Christian Wedding Celebration (Tag: Married &amp; Singles · Table Seated)</option>
                  <option value="family_conference">Parents &amp; Family Life Conference (Tag: Married &amp; Singles)</option>
                </optgroup>

                {/* 5. Pastors, Ministers & Church Leadership */}
                <optgroup label="👑 Pastors, Ministers & Church Leadership">
                  <option value="ministers_conference">Pastors &amp; Church Leaders Conference (Tag: Conferences)</option>
                  <option value="ministers_retreat">Ministers Impartation Retreat (Tag: Retreats · Lodging)</option>
                  <option value="workers_retreat">Church Workers Induction Retreat (Tag: Retreats)</option>
                  <option value="elders_retreat">Elders, Deacons &amp; Council Retreat (Tag: Retreats)</option>
                </optgroup>

                {/* 6. Church Groups & Departmental Hangouts */}
                <optgroup label="🏛️ Church Groups & Departmental Wings">
                  <option value="mens_breakfast">Men&apos;s Fellowship Breakfast &amp; Summit (Tag: Christian Hangout · Table Seated)</option>
                  <option value="womens_conference">Women&apos;s Conference &amp; Fellowship (Tag: Conferences)</option>
                  <option value="choir_retreat">Choir &amp; Music Ministry Retreat (Tag: Retreats)</option>
                  <option value="departmental_dinner">Departmental End-of-Year Banquet (Tag: Christian Hangout · Table Seated)</option>
                  <option value="ushers_training">Ushers, Greeters &amp; Protocol Summit (Tag: Seminars)</option>
                  <option value="media_workshop">Media, Sound &amp; Tech Workshop (Tag: Seminars)</option>
                  <option value="vbs_camp">Children&apos;s Vacation Bible School - VBS (Tag: Bible Study)</option>
                </optgroup>

                {/* 7. Christian Socials, Banquets & Hangouts */}
                <optgroup label="🍽️ Christian Socials, Banquets & Hangouts">
                  <option value="banquet">Christian Banquet / Gala Dinner (Tag: Christian Hangout · Table Seated)</option>
                  <option value="church_picnic">Church Picnic &amp; Outdoor Fellowship (Tag: Christian Hangout)</option>
                  <option value="game_night">Christian Board Games &amp; Quiz Night (Tag: Christian Hangout)</option>
                  <option value="love_feast">Love Feast &amp; Praise Buffet (Tag: Christian Hangout)</option>
                  <option value="birthday">Christian Birthday / Thanksgiving Celebration (Tag: Christian Hangout · Table Seated)</option>
                  <option value="christian_hangout">General Christian Hangout (Tag: Christian Hangout)</option>
                </optgroup>

                {/* 8. Congregational Worship, Crusades & Outreaches */}
                <optgroup label="🕊️ Congregational Worship, Crusades & Outreaches">
                  <option value="church_convention">Annual Church Convention / Synod (Tag: Conferences · Camp Lodging)</option>
                  <option value="crusade">Miracle Crusade &amp; City Outreach (Tag: Worship)</option>
                  <option value="worship">Worship &amp; Praise Night (Tag: Worship)</option>
                  <option value="vigil">All-Night Prayer Vigil (Tag: Worship)</option>
                  <option value="concert">Gospel Music Concert (Tag: Concerts)</option>
                  <option value="conference">General Christian Conference (Tag: Conferences)</option>
                  <option value="retreat">General Spiritual Retreat (Tag: Retreats · Lodging)</option>
                  <option value="seminar">Teaching Seminar &amp; Masterclass (Tag: Seminars)</option>
                  <option value="bible_study">Bible Study &amp; Expository School (Tag: Bible Study)</option>
                  <option value="business">Marketplace &amp; Business Summit (Tag: Business)</option>
                  <option value="church_service">Regular Church Service (Tag: Worship)</option>
                  <option value="online">Online Gathering / Webinar (Tag: Online)</option>
                </optgroup>
              </select>

              {/* Dynamic Smart Event Preset Assistant */}
              {(() => {
                const currentPreset = getPresetForType(selectedEventType);
                return (
                  <div className="mt-3.5 rounded-xl border border-brass/40 bg-brass/10 p-4 transition-all">
                    <div className="flex flex-col gap-3.5 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Sparkles size={16} className="text-brass shrink-0" />
                          <span className="font-semibold text-white text-sm">
                            Smart Setup: {currentPreset.title}
                          </span>
                          <span className="pill border-brass/40 bg-brass/20 text-brass-light !text-[0.65rem] !py-0.2 !px-2 font-medium">
                            {currentPreset.badge}
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs text-white/70 leading-relaxed">
                          {currentPreset.why}
                        </p>
                        <div className="mt-2.5 flex flex-wrap gap-2 text-[0.725rem] text-white/80">
                          <span className="rounded-md bg-black/30 px-2 py-0.5 border border-white/10">
                            🛏️ Lodging: <strong className="text-brass capitalize">{currentPreset.accommodationMode === "both" ? "Free & Paid Upgrades" : currentPreset.accommodationMode}</strong>
                          </span>
                          <span className="rounded-md bg-black/30 px-2 py-0.5 border border-white/10">
                            🚻 Collect Gender: <strong className="text-brass">{currentPreset.collectGender ? "Yes (Dorms)" : "No"}</strong>
                          </span>
                          <span className="rounded-md bg-black/30 px-2 py-0.5 border border-white/10">
                            💼 Demographics: <strong className="text-brass">{currentPreset.collectAgeBracket || currentPreset.collectOccupation ? "Enabled" : "Off"}</strong>
                          </span>
                          <span className="rounded-md bg-black/30 px-2 py-0.5 border border-white/10">
                            🍽️ Seating: <strong className="text-brass">{currentPreset.seating}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <button
                          type="button"
                          onClick={() => applyPreset(selectedEventType)}
                          className="btn btn-primary !py-2 !px-3.5 !text-xs cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-transform"
                        >
                          <Sparkles size={13} className="mr-1" /> Apply Recommended Setup
                        </button>
                        {appliedPresetNotice && (
                          <span className="inline-flex items-center gap-1 text-[0.7rem] text-emerald-300 font-semibold mt-1">
                            <CheckCircle2 size={12} /> {appliedPresetNotice}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Expandable Feature Guide & Logistics Checklist */}
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setShowFeatureGuide(!showFeatureGuide)}
                  className="flex items-center gap-1.5 text-xs text-brass hover:underline font-semibold cursor-pointer"
                >
                  <HelpCircle size={14} />
                  <span>
                    {showFeatureGuide ? "Hide Feature Guide & Checklist" : "Guide: What features to add or remove for your event type?"}
                  </span>
                  {showFeatureGuide ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>

                {showFeatureGuide && (
                  <div className="mt-2.5 rounded-xl border border-white/15 bg-black/40 p-4 text-xs text-white/80 space-y-3.5 leading-relaxed">
                    <div className="font-semibold text-white flex items-center gap-1.5 border-b border-white/10 pb-2">
                      <Info size={14} className="text-brass" /> Everything you can enable or disable for your event:
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg bg-white/5 p-3 border border-white/5">
                        <strong className="text-brass block mb-1">🍽️ Table & Seat Allocation</strong>
                        <p className="text-white/60 text-[0.725rem]">
                          <strong>When to use:</strong> FYB Dinners, Fellowship Handovers, Couples Dinners, Singles Galas, Weddings, and Banquets.
                          <br />
                          <strong>What it does:</strong> Ushers and gate staff assign or view table &amp; seat numbers on badges and WhatsApp passes. Keep off for open-seating conventions.
                        </p>
                      </div>
                      <div className="rounded-lg bg-white/5 p-3 border border-white/5">
                        <strong className="text-brass block mb-1">🛏️ Accommodation Modes</strong>
                        <p className="text-white/60 text-[0.725rem]">
                          <strong>Options:</strong> None &bull; Free Dorms &bull; Paid Rooms &bull; Both.
                          <br />
                          <strong>What it does:</strong> Provides lodging intake. Choose <em>Both</em> for youth/campus camps with free hostels and paid chalets. Choose <em>None</em> for 1-day dinners &amp; hangouts.
                        </p>
                      </div>
                      <div className="rounded-lg bg-white/5 p-3 border border-white/5">
                        <strong className="text-brass block mb-1">🚻 Gender &amp; Dorm Segregation</strong>
                        <p className="text-white/60 text-[0.725rem]">
                          <strong>When to use:</strong> Whenever lodging or student dormitories are enabled.
                          <br />
                          <strong>What it does:</strong> Automatically tags campers as Men&apos;s Dorm or Women&apos;s Dorm to prevent accommodation mix-ups.
                        </p>
                      </div>
                      <div className="rounded-lg bg-white/5 p-3 border border-white/5">
                        <strong className="text-brass block mb-1">💼 Age &amp; Occupation Demographics</strong>
                        <p className="text-white/60 text-[0.725rem]">
                          <strong>When to use:</strong> Campus summits, Youth conferences, Singles summits, and Marketplace hubs.
                          <br />
                          <strong>What it does:</strong> Groups attendees into age brackets and student/professional categories for tailored workshops.
                        </p>
                      </div>
                      <div className="rounded-lg bg-white/5 p-3 border border-white/5">
                        <strong className="text-brass block mb-1">💬 Instant WhatsApp Passes</strong>
                        <p className="text-white/60 text-[0.725rem]">
                          <strong>Active for all events:</strong> Attendees can save their digital ticket, QR entry code, and table assignment straight to WhatsApp with 1 tap.
                        </p>
                      </div>
                      <div className="rounded-lg bg-white/5 p-3 border border-white/5">
                        <strong className="text-brass block mb-1">🏷️ Walk-In Desk Registration</strong>
                        <p className="text-white/60 text-[0.725rem]">
                          <strong>For reception teams:</strong> Use <code>/register?mode=desk</code> at the venue entrance for rapid on-site registrations.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="theme" className="mb-1.5 block text-sm font-medium text-white">
                Theme <span className="text-white/40 font-normal">(Optional)</span>
              </label>
              <input
                id="theme"
                name="theme"
                type="text"
                defaultValue={initialData?.theme}
                placeholder="e.g. Arise and Shine"
                className="input !w-full"
              />
            </div>

            <div>
              <label htmlFor="tagline" className="mb-1.5 block text-sm font-medium text-white">
                Tagline <span className="text-white/40 font-normal">(Optional)</span>
              </label>
              <input
                id="tagline"
                name="tagline"
                type="text"
                defaultValue={initialData?.tagline}
                placeholder="e.g. A weekend of spiritual renewal"
                className="input !w-full"
              />
            </div>

            <div>
              <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-white">
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

            <div>
              <label htmlFor="capacity" className="mb-1.5 block text-sm font-medium text-white">
                Capacity (0 for unlimited)
              </label>
              <input
                id="capacity"
                name="capacity"
                type="number"
                min="0"
                required
                defaultValue={initialData?.capacity ?? 0}
                className="input !w-full"
              />
            </div>
          </div>
        </div>

        {/* Date & Time */}
        <div className="rounded-[16px] border border-white/10 bg-[rgba(16,16,18,0.5)] backdrop-blur-md p-6 shadow-sm">
          <h2 className="font-display mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <CalendarDays size={18} className="text-brass" /> Date & Time
          </h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="timezone" className="mb-1.5 block text-sm font-medium text-white">
                Timezone
              </label>
              <select
                id="timezone"
                name="timezone"
                required
                defaultValue={initialData?.timezone || "Africa/Lagos"}
                className="input !w-full bg-black/20"
              >
                <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
                <option value="America/New_York">America/New_York (EST/EDT)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="startsAt" className="mb-1.5 block text-sm font-medium text-white">
                  Event Start Date & Time
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
                <label htmlFor="endsAt" className="mb-1.5 block text-sm font-medium text-white">
                  Event End Date & Time
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
              <div>
                <label htmlFor="registrationOpensAt" className="mb-1.5 block text-sm font-medium text-white">
                  Registration Opens <span className="text-white/40 font-normal">(Optional)</span>
                </label>
                <input
                  id="registrationOpensAt"
                  name="registrationOpensAt"
                  type="datetime-local"
                  defaultValue={toDateTimeLocal(initialData?.registrationOpensAt)}
                  className="input !w-full"
                />
              </div>
              <div>
                <label htmlFor="registrationClosesAt" className="mb-1.5 block text-sm font-medium text-white">
                  Registration Closes <span className="text-white/40 font-normal">(Optional)</span>
                </label>
                <input
                  id="registrationClosesAt"
                  name="registrationClosesAt"
                  type="datetime-local"
                  defaultValue={toDateTimeLocal(initialData?.registrationClosesAt)}
                  className="input !w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className={`rounded-[16px] border border-white/10 bg-[rgba(16,16,18,0.5)] backdrop-blur-md p-6 shadow-sm transition-opacity duration-300 ${selectedBlueprintId ? 'opacity-50 pointer-events-none hidden' : ''}`}>
          <h2 className="font-display mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <Palette size={18} className="text-brass" /> Branding
          </h2>
          
          <div>
            <label htmlFor="brandColor" className="mb-1.5 block text-sm font-medium text-white">
              Brand Color
            </label>
            <p className="mb-3 text-xs text-white/60">
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
              <span className="text-sm text-white/60 font-mono">#c08a2e</span>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="rounded-[16px] border border-white/10 bg-[rgba(16,16,18,0.5)] backdrop-blur-md p-6 shadow-sm">
          <h2 className="font-display mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <MapPin size={18} className="text-brass" /> Location
          </h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="mode" className="mb-1.5 block text-sm font-medium text-white">
                Event Mode
              </label>
              <select
                id="mode"
                name="mode"
                required
                defaultValue={initialData?.mode || "in_person"}
                className="input !w-full bg-black/20"
              >
                <option value="in_person">In Person</option>
                <option value="online">Online</option>
                <option value="hybrid">Hybrid (In Person & Online)</option>
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="venueName" className="mb-1.5 block text-sm font-medium text-white">
                  Venue Name <span className="text-white/40 font-normal">(if physical)</span>
                </label>
                <input
                  id="venueName"
                  name="venueName"
                  type="text"
                  defaultValue={initialData?.venueName}
                  placeholder="e.g. Main Auditorium"
                  className="input !w-full"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="venueAddress" className="mb-1.5 block text-sm font-medium text-white">
                  Venue Address <span className="text-white/40 font-normal">(Optional)</span>
                </label>
                <input
                  id="venueAddress"
                  name="venueAddress"
                  type="text"
                  defaultValue={initialData?.venueAddress}
                  placeholder="e.g. 123 Church Way"
                  className="input !w-full"
                />
              </div>
              <div>
                <label htmlFor="city" className="mb-1.5 block text-sm font-medium text-white">
                  City
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  required
                  defaultValue={initialData?.city}
                  placeholder="e.g. Lagos"
                  className="input !w-full"
                />
              </div>
              <div>
                <label htmlFor="country" className="mb-1.5 block text-sm font-medium text-white">
                  Country
                </label>
                <input
                  id="country"
                  name="country"
                  type="text"
                  required
                  defaultValue={initialData?.country || "Nigeria"}
                  placeholder="e.g. Nigeria"
                  className="input !w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Visibility */}
        <div className="rounded-[16px] border border-white/10 bg-[rgba(16,16,18,0.5)] backdrop-blur-md p-6 shadow-sm">
          <h2 className="font-display mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <ShieldCheck size={18} className="text-brass" /> Visibility
          </h2>
          <div>
            <label htmlFor="visibility" className="mb-1.5 block text-sm font-medium text-white">
              Event Privacy
            </label>
            <select
              id="visibility"
              name="visibility"
              required
              defaultValue={initialData?.visibility || "public"}
              className="input !w-full bg-black/20"
            >
              <option value="public">Public (Anyone can see and register)</option>
              <option value="private">Private (Only accessible via direct link)</option>
            </select>
          </div>
        </div>

        {/* Registration Demographics & Accommodation Logistics */}
        <div className="rounded-[16px] border border-white/10 bg-[rgba(16,16,18,0.5)] backdrop-blur-md p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="font-display flex items-center gap-2 text-lg font-semibold text-white">
              <Users size={18} className="text-brass" /> Demographics & Accommodation
            </h2>
            <p className="mt-1 text-sm text-white/60">
              Control what information is asked on the registration form. Keep it short for single-day events, or enable lodging and demographics for conventions and retreats.
            </p>
          </div>

          <div className="space-y-6">
            {/* Accommodation Policy */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-brass">
                Accommodation / Lodging Policy
              </label>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className={`flex cursor-pointer flex-col justify-between rounded-xl border p-4 transition-colors ${accommodationMode === "none" ? "border-brass bg-brass/10 text-white" : "border-white/10 bg-black/20 text-white/70 hover:border-white/20"}`}>
                  <div className="flex items-center gap-2 font-medium text-sm">
                    <input
                      type="radio"
                      name="accommodationModeChoice"
                      value="none"
                      checked={accommodationMode === "none"}
                      onChange={() => setAccommodationMode("none")}
                      className="text-brass focus:ring-brass"
                    />
                    Not Offered (None)
                  </div>
                  <p className="mt-2 text-xs text-white/50 leading-relaxed">
                    Hides lodging questions completely. Recommended for 1-day events, dinners & banquets.
                  </p>
                </label>

                <label className={`flex cursor-pointer flex-col justify-between rounded-xl border p-4 transition-colors ${accommodationMode === "free" ? "border-brass bg-brass/10 text-white" : "border-white/10 bg-black/20 text-white/70 hover:border-white/20"}`}>
                  <div className="flex items-center gap-2 font-medium text-sm">
                    <input
                      type="radio"
                      name="accommodationModeChoice"
                      value="free"
                      checked={accommodationMode === "free"}
                      onChange={() => {
                        setAccommodationMode("free");
                        setCollectGender(true);
                      }}
                      className="text-brass focus:ring-brass"
                    />
                    Free Dorms Only
                  </div>
                  <p className="mt-2 text-xs text-white/50 leading-relaxed">
                    Hostel/dorm provided by ministry for all. Prompts for dorm & gender segregation.
                  </p>
                </label>

                <label className={`flex cursor-pointer flex-col justify-between rounded-xl border p-4 transition-colors ${accommodationMode === "paid" ? "border-brass bg-brass/10 text-white" : "border-white/10 bg-black/20 text-white/70 hover:border-white/20"}`}>
                  <div className="flex items-center gap-2 font-medium text-sm">
                    <input
                      type="radio"
                      name="accommodationModeChoice"
                      value="paid"
                      checked={accommodationMode === "paid"}
                      onChange={() => setAccommodationMode("paid")}
                      className="text-brass focus:ring-brass"
                    />
                    Paid Rooms Only
                  </div>
                  <p className="mt-2 text-xs text-white/50 leading-relaxed">
                    Strictly paid lodging. Attendees purchase hotel/room packages upfront via ticket tiers.
                  </p>
                </label>

                <label className={`flex cursor-pointer flex-col justify-between rounded-xl border p-4 transition-colors ${accommodationMode === "both" ? "border-brass bg-brass/10 text-white" : "border-white/10 bg-black/20 text-white/70 hover:border-white/20"}`}>
                  <div className="flex items-center gap-2 font-medium text-sm">
                    <input
                      type="radio"
                      name="accommodationModeChoice"
                      value="both"
                      checked={accommodationMode === "both"}
                      onChange={() => {
                        setAccommodationMode("both");
                        setCollectGender(true);
                      }}
                      className="text-brass focus:ring-brass"
                    />
                    Both (Free & Paid)
                  </div>
                  <p className="mt-2 text-xs text-white/50 leading-relaxed">
                    General dorms are free, plus paid executive chalets/hotel upgrades via ticket tiers.
                  </p>
                </label>
              </div>

              {/* Informative Guidance for Paid Lodging Packages */}
              {(accommodationMode === "paid" || accommodationMode === "both") && (
                <div className="mt-4 rounded-xl border border-[rgba(192,138,46,0.35)] bg-[rgba(192,138,46,0.12)] p-4 text-xs text-white/90 leading-relaxed shadow-sm">
                  <div className="flex items-center gap-2 font-semibold text-brass mb-1.5 text-sm">
                    <BedDouble size={16} /> How to configure Paid Accommodation Packages
                  </div>
                  <p>
                    After saving this event, navigate to <strong>Tickets &rarr; New Ticket</strong> to create your paid lodging tiers (such as <em>&ldquo;Executive Chalet Pass - ₦50,000&rdquo;</em>, <em>&ldquo;Partner Hotel Room&rdquo;</em>, or <em>&ldquo;Guest House Suite&rdquo;</em>).
                  </p>
                  <p className="mt-1.5 text-white/70">
                    Use our 1-click room presets on the ticket form to automatically badge the package with its lodging type. In your dashboard, you can filter attendees directly by this package and export dedicated rooming lists for your housing &amp; welfare team!
                  </p>
                </div>
              )}
            </div>

            {/* Demographic Toggles */}
            <div className="border-t border-white/10 pt-5">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-brass">
                Standard Demographic Questions (1-Click Toggles)
              </label>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-black/20 p-3.5 hover:border-white/20 transition-colors">
                  <input
                    type="checkbox"
                    checked={collectGender}
                    onChange={(e) => setCollectGender(e.target.checked)}
                    className="mt-0.5 rounded border-warm-300 text-brass focus:ring-brass"
                  />
                  <div>
                    <span className="block text-sm font-medium text-white">Collect Gender</span>
                    <span className="mt-0.5 block text-xs text-white/50">
                      Male / Female (vital for dorm allocation & retreats)
                    </span>
                  </div>
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-black/20 p-3.5 hover:border-white/20 transition-colors">
                  <input
                    type="checkbox"
                    checked={collectAgeBracket}
                    onChange={(e) => setCollectAgeBracket(e.target.checked)}
                    className="mt-0.5 rounded border-warm-300 text-brass focus:ring-brass"
                  />
                  <div>
                    <span className="block text-sm font-medium text-white">Collect Age Bracket</span>
                    <span className="mt-0.5 block text-xs text-white/50">
                      Under 18, 18-24, 25-34, 35-49, 50+
                    </span>
                  </div>
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-black/20 p-3.5 hover:border-white/20 transition-colors">
                  <input
                    type="checkbox"
                    checked={collectOccupation}
                    onChange={(e) => setCollectOccupation(e.target.checked)}
                    className="mt-0.5 rounded border-warm-300 text-brass focus:ring-brass"
                  />
                  <div>
                    <span className="block text-sm font-medium text-white">Collect Occupation</span>
                    <span className="mt-0.5 block text-xs text-white/50">
                      Employed, Self-Employed, Student, etc.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Custom Registration Questions */}
        <div className={`rounded-[16px] border border-white/10 bg-[rgba(16,16,18,0.5)] backdrop-blur-md p-6 shadow-sm transition-opacity duration-300 ${selectedBlueprintId ? 'opacity-50 pointer-events-none hidden' : ''}`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display flex items-center gap-2 text-lg font-semibold text-white">
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
          <p className="mb-6 text-sm text-white/60">
            Ask attendees for specific information during registration (e.g. Dietary Restrictions, Job Title).
          </p>

          <div className="space-y-4">
            {customQuestions.length === 0 ? (
              <div className="text-center py-6 border border-dashed rounded-xl border-warm-200 text-white/60 text-sm">
                No custom questions added.
              </div>
            ) : (
              customQuestions.map((q: CustomQuestion, index: number) => (
                <div key={q.id} className="relative rounded-xl border border-warm-200 bg-black/20 p-4 pr-12">
                  <button
                    type="button"
                    onClick={() => removeQuestion(q.id)}
                    className="absolute right-3 top-3 text-white/40 hover:text-red-500 transition-colors"
                  >
                    <X size={18} />
                  </button>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-xs font-medium text-white">Question Label</label>
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
                      <label className="mb-1.5 block text-xs font-medium text-white">Answer Type</label>
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
                      <label className="flex items-center gap-2 cursor-pointer text-sm text-white">
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
                        <label className="mb-1.5 block text-xs font-medium text-white">Dropdown Options (comma separated)</label>
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

        {/* Attendee Types */}
        <div className={`rounded-[16px] border border-white/10 bg-[rgba(16,16,18,0.5)] backdrop-blur-md p-6 shadow-sm transition-opacity duration-300 ${selectedBlueprintId ? 'opacity-50 pointer-events-none hidden' : ''}`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display flex items-center gap-2 text-lg font-semibold text-white">
              <ListTodo size={18} className="text-brass" /> Attendee Types
            </h2>
          </div>
          <p className="mb-6 text-sm text-white/60">
            Define the options attendees can choose from when asked &quot;I am attending as...&quot; (comma separated).
          </p>
          <div>
            <input
              type="text"
              value={attendeeTypes}
              onChange={(e) => setAttendeeTypes(e.target.value)}
              placeholder="e.g. Delegate, Student, Minister, Volunteer, Guest"
              className="input !w-full"
            />
          </div>
        </div>

        {/* Volunteer Workforce Configuration */}
        <div className="rounded-[16px] border border-white/10 bg-[rgba(16,16,18,0.5)] backdrop-blur-md p-6 shadow-sm">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="font-display flex items-center gap-2 text-lg font-semibold text-white">
              <Sparkles size={18} className="text-brass" /> Volunteer Workforce &amp; Ministry Units
            </h2>
            <label className="flex items-center gap-2.5 text-xs font-semibold text-white cursor-pointer select-none bg-white/5 border border-white/10 rounded-full px-3.5 py-1.5 hover:bg-white/10 transition-colors">
              <input
                type="checkbox"
                checked={callForVolunteers}
                onChange={(e) => setCallForVolunteers(e.target.checked)}
                className="checkbox"
              />
              Accept Volunteer Signups
            </label>
          </div>
          <p className="mb-4 text-sm text-white/60">
            Invite attendees to volunteer for specific ministry departments during registration.
          </p>
          {callForVolunteers && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white">
                Available Ministry Units / Departments (Comma-separated)
              </label>
              <input
                type="text"
                value={volunteerUnitsInput}
                onChange={(e) => setVolunteerUnitsInput(e.target.value)}
                placeholder="Ushering & Protocol, Media & Live Stream, Medical & First Aid, Choir, Prayer"
                className="input !w-full"
              />
              <p className="mt-2 text-xs text-white/40 leading-relaxed">
                Attendees pick their serving unit on checkout, and their assigned department appears directly on their gate pass and badge.
              </p>
            </div>
          )}
        </div>

        {/* Media Upload */}
        <div className="rounded-[16px] border border-white/10 bg-[rgba(16,16,18,0.5)] backdrop-blur-md p-6 shadow-sm">
          <h2 className="font-display mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <ImageIcon size={18} className="text-brass" /> Event Media
          </h2>
          
          <div className="mb-8">
            <label className="mb-1.5 block text-sm font-medium text-white">
              Main Event Flyer (Cover Image)
            </label>
            <p className="mb-4 text-sm text-white/60">
              This is the primary image shown on event cards and headers. Use the focus tool to ensure it looks great in any aspect ratio.
            </p>
            <FocusImageUpload
              initialImage={isEditing && initialData?.media?.[0]?.url ? initialData.media[0].url : undefined}
              initialFocus={isEditing ? initialData?.media?.[0]?.focus : undefined}
              onImageChange={(file) => setCoverImageFile(file)}
              onFocusChange={(f) => setFocus(f)}
            />
          </div>

          <div className="mb-8">
            <label htmlFor="videoUrl" className="mb-1.5 block text-sm font-medium text-white">
              Event Trailer (YouTube or Vimeo Link)
            </label>
            <p className="mb-4 text-sm text-white/60">
              Paste a link to your event&apos;s promo video. We&apos;ll automatically embed it beautifully on your event page.
            </p>
            <input
              id="videoUrl"
              name="videoUrl"
              type="url"
              defaultValue={existingVideoUrl}
              placeholder="https://youtube.com/watch?v=..."
              className="input !w-full"
            />
          </div>

          <hr className="my-8 border-t border-[rgba(255,255,255,0.08)]" />

          <div>
            <label htmlFor="media" className="mb-1.5 block text-sm font-medium text-white">
              Additional Photos & Videos (Gallery)
            </label>
            <p className="mb-4 text-sm text-white/60">
              Add more photos to showcase your event or past events.
            </p>
            
            <div className="relative flex flex-col items-center justify-center rounded-[12px] border-2 border-dashed border-[rgba(255,255,255,0.15)] bg-black/20 py-8 transition-colors hover:border-[var(--color-brass)] hover:bg-[rgba(226,192,115,0.05)]">
              <UploadCloud size={24} className="mb-2 text-brass-light" />
              <p className="mb-1 text-sm font-semibold text-white">
                Click to upload additional media
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
                    setSelectedFiles((prev: File[]) => [...prev, ...Array.from(e.target.files!)]);
                  }
                }}
              />
            </div>

            {isEditing && initialData?.media && initialData.media.length > 1 && selectedFiles.length === 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {initialData.media.slice(1).map((file: any, i: number) => (
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
                {selectedFiles.map((file: File, i: number) => (
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
                      }}
                      className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-signal-red/80 opacity-0 group-hover:opacity-100"
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
