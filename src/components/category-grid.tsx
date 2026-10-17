import { Mic2, Users, Tent, BookOpen, Music, Video, Briefcase, Flame, UserPlus, Coffee, HeartHandshake, Sparkles } from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  { name: "Conferences", icon: Users },
  { name: "Worship", icon: Mic2 },
  { name: "Business", icon: Briefcase },
  { name: "Youth Meetings", icon: Flame },
  { name: "Singles Program", icon: UserPlus },
  { name: "Christian Hangout", icon: Coffee },
  { name: "Married & Singles", icon: HeartHandshake },
  { name: "Retreats", icon: Tent },
  { name: "Seminars", icon: BookOpen },
  { name: "Concerts", icon: Music },
  { name: "Online", icon: Video },
];

export function CategoryGrid() {
  return (
    <div className="mb-20 text-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-brass/25 bg-brass/10 px-4 py-1.5 text-xs font-bold text-brass-deep dark:text-brass uppercase tracking-widest mb-3">
        <Sparkles size={13} className="text-brass-deep dark:text-brass-light" />
        <span>Fellowships of Faith · Psalm 133:1</span>
      </div>

      <h2 className="font-display text-3xl sm:text-4xl font-semibold text-ink">
        Gatherings Across the Body of Christ
      </h2>

      <p className="mt-3 text-base sm:text-lg text-warm-600 dark:text-warm-500 font-normal max-w-2xl mx-auto">
        &ldquo;Behold, how good and how pleasant it is for brethren to dwell together in unity!&rdquo; — Psalm 133:1
      </p>
      
      <div className="mt-10 flex flex-nowrap items-center justify-start sm:justify-center gap-4 overflow-x-auto pb-6 scrollbar-hide snap-x">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.name}
            href={`/?category=${cat.name.toLowerCase()}#events`}
            className="group flex-shrink-0 snap-start flex flex-col items-center justify-center w-36 h-36 sm:w-40 sm:h-40 rounded-[24px] border border-[var(--card-border)] bg-[var(--card-bg)] shadow-md hover:border-brass/60 hover:shadow-lift transition-all duration-300 hover:-translate-y-1"
          >
            <div className="mb-3.5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brass/15 border border-brass/30 text-brass-deep dark:text-brass group-hover:scale-110 transition-transform duration-300 shadow-sm">
              <cat.icon size={26} className="text-brass-deep dark:text-brass" />
            </div>
            <span className="font-display font-semibold text-ink text-sm sm:text-[0.925rem] group-hover:text-brass-deep dark:group-hover:text-brass transition-colors">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
