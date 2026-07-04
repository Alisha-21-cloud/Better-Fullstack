import {
  Check,
  Copy,
  Github,
  MessageCircle,
  Radio,
  Send,
  Share2,
  Twitter,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dotted-dialog";
import {
  hasSeenBuilderShareModal,
  markBuilderShareModalSeen,
} from "@/lib/builder-share-modal-visibility";
import { SITE_URL } from "@/lib/seo";
import { cn } from "@/lib/utils";

const TELEGRAM_URL = "https://t.me/TheCr1nge";
const X_PROFILE_URL = "https://x.com/IbrahimElkamali";
const WHATSAPP_URL = "https://wa.me/380665662448";
const SIGNAL_URL = "https://signal.me/#p/+380665662448";
const GITHUB_DISCUSSIONS_URL = "https://github.com/Marve10s/Better-Fullstack/discussions";

type ShareTarget = {
  label: string;
  description: string;
  href: string;
  icon: typeof MessageCircle;
  className: string;
};

const contactTargets: ShareTarget[] = [
  {
    label: "Telegram",
    description: "@TheCr1nge",
    href: TELEGRAM_URL,
    icon: Send,
    className: "text-sky-500",
  },
  {
    label: "X",
    description: "@IbrahimElkamali",
    href: X_PROFILE_URL,
    icon: Twitter,
    className: "text-foreground",
  },
  {
    label: "Signal",
    description: "+380 66 566 2448",
    href: SIGNAL_URL,
    icon: Radio,
    className: "text-blue-500",
  },
  {
    label: "WhatsApp",
    description: "+380 66 566 2448",
    href: WHATSAPP_URL,
    icon: MessageCircle,
    className: "text-emerald-500",
  },
  {
    label: "GitHub Discussions",
    description: "Show the community",
    href: GITHUB_DISCUSSIONS_URL,
    icon: Github,
    className: "text-foreground",
  },
];

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function getShareMessage(url: string) {
  return `I built a full-stack app setup with Better Fullstack. Try the visual builder and share what you make: ${url}`;
}

export function BuilderShareModal() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState(SITE_URL);

  useEffect(() => {
    if (window.navigator.webdriver || !canUseBrowserStorage()) {
      return;
    }

    try {
      if (hasSeenBuilderShareModal(window.localStorage)) {
        return;
      }

      setShareUrl(window.location.href || SITE_URL);
      setOpen(true);
    } catch {
      setOpen(false);
    }
  }, []);

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    if (!nextOpen) {
      try {
        markBuilderShareModalSeen(window.localStorage);
      } catch {}
    }

    setOpen(nextOpen);
  }, []);

  const shareMessage = useMemo(() => getShareMessage(shareUrl), [shareUrl]);
  const encodedShareMessage = encodeURIComponent(shareMessage);
  const xShareUrl = `https://twitter.com/intent/tweet?text=${encodedShareMessage}`;
  const whatsAppShareUrl = `https://wa.me/?text=${encodedShareMessage}`;

  const copyMessage = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareMessage);
      setCopied(true);
      toast.success("Share message copied");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy share message");
    }
  }, [shareMessage]);

  const shareWithFriends = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Better Fullstack",
          text: "I built a full-stack app setup with Better Fullstack.",
          url: shareUrl,
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    await copyMessage();
  }, [copyMessage, shareUrl]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0 overflow-hidden border-border/70 bg-fd-background p-0 shadow-2xl shadow-black/20 sm:max-w-xl">
        <div className="border-border/70 border-b bg-muted/20 px-5 py-4 sm:px-6">
          <DialogHeader className="pr-8">
            <div className="mb-2 flex w-fit items-center gap-2 border border-primary/25 bg-primary/10 px-2 py-1 font-mono text-[10px] text-primary uppercase">
              <Share2 className="size-3" aria-hidden="true" />
              Built with Better Fullstack?
            </div>
            <DialogTitle className="text-balance font-semibold text-2xl text-foreground leading-tight">
              Show us what you shipped
            </DialogTitle>
            <DialogDescription className="max-w-[32rem] text-sm leading-relaxed">
              If Better Fullstack helped you start a project, send it over. A repo, demo,
              screenshot, launch post, or tiny work-in-progress is perfect.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="grid gap-4 px-5 py-5 sm:px-6">
          <div className="grid gap-2 sm:grid-cols-2">
            {contactTargets.map((target) => {
              const Icon = target.icon;

              return (
                <a
                  key={target.label}
                  href={target.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex min-h-16 items-center gap-3 border border-border/70 bg-background/70 px-3 py-3 text-left transition-colors hover:border-primary/35 hover:bg-muted/35"
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center border border-border/70 bg-muted/35 transition-colors group-hover:border-primary/30",
                      target.className,
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-medium text-sm text-foreground">
                      {target.label}
                    </span>
                    <span className="block truncate text-muted-foreground text-xs">
                      {target.description}
                    </span>
                  </span>
                </a>
              );
            })}
          </div>

          <div className="border border-border/70 bg-muted/20 p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-sm text-foreground">
                  Please share a project with friends!
                </p>
                <p className="mt-1 text-muted-foreground text-xs">
                  One post helps more builders discover the project.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                className="w-full sm:w-auto"
                onClick={shareWithFriends}
              >
                <Share2 className="size-3.5" aria-hidden="true" />
                Share
              </Button>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <a
                href={xShareUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 items-center justify-center gap-2 border border-border bg-background px-3 font-medium text-xs transition-colors hover:bg-muted"
              >
                <Twitter className="size-3.5" aria-hidden="true" />
                Post on X
              </a>
              <a
                href={whatsAppShareUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 items-center justify-center gap-2 border border-border bg-background px-3 font-medium text-xs transition-colors hover:bg-muted"
              >
                <MessageCircle className="size-3.5 text-emerald-500" aria-hidden="true" />
                WhatsApp
              </a>
              <button
                type="button"
                onClick={copyMessage}
                className="inline-flex h-8 items-center justify-center gap-2 border border-border bg-background px-3 font-medium text-xs transition-colors hover:bg-muted"
              >
                {copied ? (
                  <Check className="size-3.5 text-green-500" aria-hidden="true" />
                ) : (
                  <Copy className="size-3.5" aria-hidden="true" />
                )}
                {copied ? "Copied" : "Copy text"}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
