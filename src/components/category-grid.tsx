import { Mic2, Users, Tent, BookOpen, Music, Video, Briefcase, Flame, UserPlus, Coffee, HeartHandshake } from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  { name: "Conferences", icon: Users, color: "text-brass", bg: "bg-brass/20" },
  { name: "Worship", icon: Mic2, color: "text-brass", bg: "bg-brass/20" },
  { name: "Business", icon: Briefcase, color: "text-brass", bg: "bg-brass/20" },
  { name: "Youth Meetings", icon: Flame, color: "text-brass", bg: "bg-brass/20" },
  { name: "Singles Program", icon: UserPlus, color: "text-brass", bg: "bg-brass/20" },
  { name: "Christian Hangout", icon: Coffee, color: "text-brass", bg: "bg-brass/20" },
  { name: "Married & Singles", icon: HeartHandshake, color: "text-brass", bg: "bg-brass/20" },
  { name: "Retreats", icon: Tent, color: "text-brass", bg: "bg-brass/20" },
  { name: "Seminars", icon: BookOpen, color: "text-brass", bg: "bg-brass/20" },
  { name: "Concerts", icon: Music, color: "text-brass", bg: "bg-brass/20" },
  { name: "Online", icon: Video, color: "text-brass", bg: "bg-brass/20" },
];

export function CategoryGrid() {
  return (
    <div className="mb-20 text-center">
      <h2 className="font-display text-4xl font-semibold text-white">There&apos;s something here for everyone</h2>
      <p className="mt-3 text-lg text-white/60 font-light">Explore Christian events across categories that matter to you</p>
      
      <div className="mt-12 flex flex-nowrap items-center justify-start sm:justify-center gap-4 overflow-x-auto pb-6 scrollbar-hide snap-x">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.name}
            href={`/?category=${cat.name.toLowerCase()}#events`}
            className="group flex-shrink-0 snap-start flex flex-col items-center justify-center w-40 h-40 rounded-[24px] border border-white/10 bg-[rgba(22,19,17,0.4)] shadow-sm hover:border-brass/40 hover:bg-white/5 transition-all"
          >
            <div className={`mb-4 inline-flex h-[60px] w-[60px] items-center justify-center rounded-[18px] ${cat.bg} group-hover:scale-110 transition-transform duration-300`}>
              <cat.icon size={28} className={cat.color} />
            </div>
            <span className="font-display font-semibold text-white/90">{cat.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
