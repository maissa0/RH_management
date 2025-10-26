import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

import { AnimatedIcon } from "../shared/animated-icon";
import { Icons } from "../shared/icons";
import Orb from "../shared/orb";
import HeroCTA from "./hero-cta";

export default function HeroLanding() {
  return (
    <section className="relative pt-6 sm:pt-8">
      <div className="container relative flex max-w-6xl flex-col items-center gap-5 text-center">
        {/* ORB */}
        <div
          className="orb-fade-in absolute left-1/2 top-1/2 -z-10 !h-[700px] !w-full -translate-x-1/2 -translate-y-1/2 pt-24 lg:!w-[120%] lg:pt-0"
        >
          <Orb
            hoverIntensity={0.1}
            rotateOnHover={true}
            hue={120}
            forceHoverState={false}
          />
        </div>

        <div className="relative flex w-full justify-center rounded-3xl">
          <div className="relative z-50 flex max-w-4xl flex-col items-center gap-12 text-center">
            <Link
              href={siteConfig.links.bluesky}
              className={cn(
                "z-50 flex items-center gap-2 rounded-full border px-4 py-2.5 backdrop-blur-md transition-colors duration-300",
                "border-black/20 bg-white/10 hover:bg-black/20",
                "dark:border-white/20 dark:bg-neutral-800/10 dark:hover:bg-white/20",
                "animate-fade-down opacity-0 [animation-delay:100ms]",
              )}
              target="_blank"
            >
              <div className="flex items-center gap-2">
                <Badge className="gap-1.5 bg-primary/80 text-white transition-colors">
                  <Icons.bluesky className="size-3.5 text-black dark:text-white sm:size-4" />
                </Badge>
              </div>
              <p className="text-sm font-medium text-black/90 dark:text-white/90 sm:text-base">
                AI-Powered Recruiting
              </p>
              <ArrowRightIcon className="size-3.5 text-black dark:text-white" />
            </Link>

            <div className="flex animate-fade-down items-center justify-center gap-4 opacity-0 [animation-delay:1600ms]">
              <AnimatedIcon
                icon="videoConference"
                className="size-28 opacity-90 sm:size-32"
                playMode="loop"
                hoverDuration={3000}
                speed={0.6}
              />
            </div>

            <div className="space-y-6">
              <h1 className="animate-fade-up font-urban text-xl font-bold tracking-tight text-black opacity-0 [animation-delay:700ms] dark:text-white sm:text-5xl md:text-7xl">
                Find talent at{" "}
                <span className="relative inline-block font-light italic">
                  lightspeed
                  <span className="absolute -bottom-1.5 left-0 h-px w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent"></span>
                </span>{" "}
                precision
              </h1>

              <p className="mx-auto max-w-2xl animate-fade-up font-urban text-base font-light leading-relaxed text-black/80 opacity-0 [animation-delay:1000ms] dark:text-white/80 sm:text-lg md:text-xl">
                Where human intuition meets AI precision.{" "}
                <span className="relative inline-block">
                  Transform your hiring pipeline into a talent magnet.
                  <span className="absolute -bottom-0.5 left-0 h-px w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent"></span>
                </span>
              </p>
            </div>

            <div className="animate-fade-up opacity-0 [animation-delay:1300ms]">
              <HeroCTA />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
