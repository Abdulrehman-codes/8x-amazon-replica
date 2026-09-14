"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertCircle, Loader2, LocateFixed, MapPin, X } from "lucide-react";
import { setLocation, type LocationState } from "@/lib/actions/location";
import type { DeliveryLocation } from "@/lib/location";

type Detected = { city: string; postal: string; country: string; code: string };

export function LocationPicker({ location }: { location: DeliveryLocation }) {
  const [open, setOpen] = useState(false);
  const [detected, setDetected] = useState<Detected | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const [state, formAction] = useActionState<LocationState, FormData>(
    async (prev, formData) => {
      const result = await setLocation(prev, formData);
      if (!result.error) setOpen(false);
      return result;
    },
    {},
  );

  function detect() {
    if (!("geolocation" in navigator)) {
      setGeoError("This browser can't share a location.");
      return;
    }
    setDetecting(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          // Keyless reverse geocoding, so nothing extra has to be configured
          // to run this project.
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client` +
              `?latitude=${coords.latitude}&longitude=${coords.longitude}&localityLanguage=en`,
          );
          if (!res.ok) throw new Error();
          const data = await res.json();
          setDetected({
            city: data.city || data.locality || data.principalSubdivision || "",
            postal: data.postcode || "",
            country: data.countryName || "",
            code: data.countryCode || "",
          });
        } catch {
          setGeoError("Couldn't look that position up. Enter it by hand.");
        } finally {
          setDetecting(false);
        }
      },
      () => {
        setDetecting(false);
        setGeoError("Location permission was declined. Enter it by hand.");
      },
      { timeout: 10_000 },
    );
  }

  const values = detected ?? {
    city: location.city,
    postal: location.postal,
    country: location.country,
    code: location.code,
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="hidden items-center gap-1 rounded px-2 py-1.5 text-left transition hover:bg-ink-hover lg:flex">
        <MapPin size={18} className="mt-1.5 shrink-0" />
        <span className="leading-tight">
          <span className="block text-[11px] text-white/70">Deliver to</span>
          <span className="block max-w-[10rem] truncate text-sm font-semibold">
            {location.city} {location.postal}
          </span>
        </span>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[26rem] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-card bg-surface p-5 shadow-2xl focus:outline-none">
          <Dialog.Title className="flex items-center justify-between text-lg font-semibold">
            Choose your location
            <Dialog.Close aria-label="Close" className="rounded p-1 hover:bg-canvas">
              <X size={18} />
            </Dialog.Close>
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-fg-muted">
            Delivery dates and shipping are estimated from this.
          </Dialog.Description>

          <button
            type="button"
            onClick={detect}
            disabled={detecting}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-md border border-border-strong py-2.5 text-sm font-semibold transition hover:bg-canvas disabled:opacity-70"
          >
            {detecting ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <LocateFixed size={15} />
            )}
            {detecting ? "Locating…" : "Use my current location"}
          </button>

          {geoError && (
            <p className="mt-2 flex items-start gap-2 text-xs text-price">
              <AlertCircle size={13} className="mt-0.5 shrink-0" />
              {geoError}
            </p>
          )}

          <div className="relative my-4 text-center">
            <span className="absolute inset-x-0 top-1/2 h-px bg-border" />
            <span className="relative bg-surface px-3 text-xs text-fg-subtle">
              or enter it
            </span>
          </div>

          {/* keyed so a detected result repopulates the defaults */}
          <form action={formAction} key={detected ? "detected" : "manual"}>
            <input type="hidden" name="code" value={values.code} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="City" name="city" defaultValue={values.city} required />
              <Field label="Postal code" name="postal" defaultValue={values.postal} />
              <Field
                label="Country"
                name="country"
                defaultValue={values.country}
                className="sm:col-span-2"
                required
              />
            </div>

            {state.error && (
              <p role="alert" className="mt-3 flex items-start gap-2 text-sm text-price">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                {state.error}
              </p>
            )}

            <SaveButton />
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Field({
  label,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={className}>
      <span className="mb-1 block text-xs font-semibold text-fg-muted">
        {label}
      </span>
      <input
        {...props}
        className="w-full rounded border border-border-strong px-3 py-2 text-sm outline-none focus:border-link"
      />
    </label>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-accent py-2.5 text-sm font-semibold text-ink transition hover:bg-accent-hover disabled:opacity-70"
    >
      {pending && <Loader2 size={14} className="animate-spin" />}
      Deliver here
    </button>
  );
}
