"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function CopyBookingLinkButton({ username, slug, label = "Copy booking link" }: { username: string; slug: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  function legacyCopy(value: string) {
    const textArea = document.createElement("textarea");
    textArea.value = value;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const succeeded = document.execCommand("copy");
    textArea.remove();
    return succeeded;
  }

  async function copyLink() {
    const bookingUrl = `${window.location.origin}/${username}/${slug}`;
    let succeeded = legacyCopy(bookingUrl);
    if (!succeeded && navigator.clipboard?.writeText) {
      try { await navigator.clipboard.writeText(bookingUrl); succeeded = true; }
      catch { succeeded = false; }
    }
    if (!succeeded) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return <Button type="button" variant="outline" size="sm" onClick={copyLink}>{copied ? <Check className="size-4" /> : <Copy className="size-4" />}{copied ? "Link copied" : label}</Button>;
}
