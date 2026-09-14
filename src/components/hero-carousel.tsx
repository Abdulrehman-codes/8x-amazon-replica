"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { HERO_SLIDES } from "@/lib/shelves";
import { cn } from "@/lib/utils";

const ROTATE_MS = 6000;

export function HeroCarousel({ images }: { images: Record<string, string> }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback((next: number) => {
    setIndex((next + HERO_SLIDES.length) % HERO_SLIDES.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const id = setInterval(() => go(index + 1), ROTATE_MS);
    return () => clearInterval(id);
  }, [index, paused, go]);

  const slide = HERO_SLIDES[index];
  const image = images[slide.categorySlug];

  return (
    <section
      className="relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured"
    >
      <div
        aria-hidden
        className="absolute inset-0 transition-[background] duration-700"
        style={{
          background: `linear-gradient(105deg, ${slide.from} 0%, ${slide.to} 68%)`,
        }}
      />

      <div className="relative mx-auto grid max-w-[1500px] items-center gap-6 px-6 pb-36 pt-12 sm:pt-16 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div key={slide.title} className="animate-fade-up">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
            {slide.eyebrow}
          </p>
          <h1 className="mt-3 max-w-2xl text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl">
            {slide.title}
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/70">{slide.body}</p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href={slide.href}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-ink transition hover:bg-accent-hover hover:shadow-lg active:scale-[0.98]"
            >
              {slide.cta}
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/s?sort=rating"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Browse top rated
            </Link>
          </div>
        </div>

        {image && (
          <div
            key={image}
            className="animate-fade-up relative hidden aspect-square w-full max-w-[20rem] justify-self-end lg:block"
          >
            <span className="absolute inset-0 rounded-full bg-white/10 blur-2xl" />
            <Image
              src={image}
              alt=""
              fill
              priority
              sizes="320px"
              className="object-contain drop-shadow-2xl"
            />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute inset-x-0 bottom-28 mx-auto flex max-w-[1500px] items-center gap-3 px-6">
        <button
          type="button"
          onClick={() => go(index - 1)}
          aria-label="Previous slide"
          className="grid h-8 w-8 place-items-center rounded-full border border-white/25 text-white transition hover:bg-white/15"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          onClick={() => go(index + 1)}
          aria-label="Next slide"
          className="grid h-8 w-8 place-items-center rounded-full border border-white/25 text-white transition hover:bg-white/15"
        >
          <ChevronRight size={16} />
        </button>

        <div className="flex gap-1.5">
          {HERO_SLIDES.map((s, i) => (
            <button
              key={s.title}
              type="button"
              onClick={() => go(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === index ? "w-7 bg-accent" : "w-3 bg-white/35 hover:bg-white/60",
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
