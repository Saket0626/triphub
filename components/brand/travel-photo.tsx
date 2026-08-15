import Image from "next/image";
import { cn } from "@/lib/utils";

const U = (id: string, w = 2400) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=90`;

export const LANDING_PHOTOS = {
  hero: {
    src: U("photo-1534430480872-3498386e7856"),
    alt: "Empire State Building over Manhattan at dusk",
  },
  research: {
    src: U("photo-1555881400-74d7acaacd8b"),
    alt: "Lisbon tram on a steep European street",
  },
  flights: {
    src: U("photo-1464037866556-6812c9d1c72e"),
    alt: "Window-seat view of clouds at sunrise",
  },
  hotels: {
    src: U("photo-1551882547-ff40c63fe5fa"),
    alt: "European hotel at evening",
  },
  activities: {
    src: U("photo-1523906834658-6e24ef2386f9"),
    alt: "Venice canal in late afternoon light",
  },
  points: {
    src: U("photo-1485871981521-5b1fd3805eee"),
    alt: "New York at night from the river",
  },
} as const;

export const PHOTOS = {
  hero: {
    src: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1800&q=80",
    alt: "Cliffside town on the Italian coast",
  },
  plane: {
    src: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1400&q=80",
    alt: "Airplane wing above the clouds",
  },
  hotel: {
    src: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1400&q=80",
    alt: "Sunlit luxury hotel pool",
  },
  city: {
    src: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=1400&q=80",
    alt: "Temple and gardens in Kyoto",
  },
  road: {
    src: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1800&q=80",
    alt: "Open road trip through hills",
  },
  villa: {
    src: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1600&q=80",
    alt: "Modern villa overlooking the water",
  },
  pack: {
    src: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1400&q=80",
    alt: "Passport, camera, and travel extras on a table",
  },
  car: {
    src: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1400&q=80",
    alt: "City street with cars at dusk",
  },
} as const;

export function TravelPhoto({
  src,
  alt,
  className,
  sizes = "(max-width: 768px) 100vw, 50vw",
  priority = false,
  caption,
  drift = false,
  objectPosition,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  caption?: string;
  drift?: boolean;
  objectPosition?: string;
}) {
  return (
    <div className={cn("group relative overflow-hidden bg-secondary", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        quality={90}
        style={
          objectPosition
            ? { objectPosition, transformOrigin: objectPosition }
            : undefined
        }
        className={cn(
          "object-cover will-change-transform",
          drift
            ? "photo-drift"
            : "transition-transform duration-1000 ease-out group-hover:scale-[1.06]"
        )}
      />
      {caption ? (
        <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-soundings shadow-sm backdrop-blur-sm">
          {caption}
        </span>
      ) : null}
    </div>
  );
}
