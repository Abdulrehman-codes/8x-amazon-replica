import { Check } from "lucide-react";
import { STATUS_LABELS } from "@/lib/delivery";
import { cn } from "@/lib/utils";

const STEPS = ["placed", "preparing", "shipped", "out_for_delivery", "delivered"];

export function TrackingStrip({ status }: { status: string }) {
  const current = Math.max(0, STEPS.indexOf(status));

  return (
    <ol className="flex items-start">
      {STEPS.map((step, i) => {
        const done = i <= current;
        return (
          <li key={step} className="flex flex-1 flex-col items-center text-center">
            <div className="flex w-full items-center">
              <span
                className={cn(
                  "h-1 flex-1 rounded-l",
                  i === 0 ? "bg-transparent" : done ? "bg-success" : "bg-border",
                )}
              />
              <span
                className={cn(
                  "grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 transition",
                  done
                    ? "border-success bg-success text-white"
                    : "border-border bg-surface text-fg-subtle",
                )}
              >
                {done ? (
                  <Check size={14} strokeWidth={3} />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                )}
              </span>
              <span
                className={cn(
                  "h-1 flex-1 rounded-r",
                  i === STEPS.length - 1
                    ? "bg-transparent"
                    : i < current
                      ? "bg-success"
                      : "bg-border",
                )}
              />
            </div>
            <span
              className={cn(
                "mt-2 px-1 text-[11px] leading-tight sm:text-xs",
                done ? "font-semibold text-fg" : "text-fg-subtle",
              )}
            >
              {STATUS_LABELS[step]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
