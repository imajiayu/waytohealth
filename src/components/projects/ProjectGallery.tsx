import Image from 'next/image';
import { ImageIcon } from 'lucide-react';

interface Props {
  images: string[];
  projectId: number;
  title: string;
  placeholderText: string;
  placeholderCount?: number;
}

export default function ProjectGallery({
  images,
  projectId,
  title,
  placeholderText,
  placeholderCount = 3,
}: Props) {
  const hasImages = images.length > 0;
  const count = hasImages ? images.length : placeholderCount;

  return (
    <section className="mt-12 sm:mt-16">
      <h3 className="font-[family-name:var(--font-data)] text-[10px] font-semibold uppercase tracking-[0.2em] text-ukraine-blue-500">
        {title}
      </h3>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {Array.from({ length: count }, (_, i) => {
          const imagePath = images[i]
            ? `/data/projects/${projectId}/${images[i]}`
            : null;

          return (
            <div
              key={i}
              className="relative aspect-[4/3] overflow-hidden rounded-xl"
            >
              {imagePath ? (
                <Image
                  src={imagePath}
                  alt={`${title} ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 border-2 border-dashed border-ukraine-blue-100 bg-ukraine-blue-50/20">
                  <ImageIcon className="h-8 w-8 text-ukraine-blue-200" />
                  <span className="font-[family-name:var(--font-data)] text-[10px] uppercase tracking-wider text-ukraine-blue-300">
                    {placeholderText}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
