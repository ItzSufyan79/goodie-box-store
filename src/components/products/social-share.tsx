"use client";

import { ExternalLink } from "lucide-react";

export function SocialShare({ title, url }: { title: string; url: string }) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = [
    {
      name: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      bg: "hover:bg-blue-100 hover:text-blue-600",
    },
    {
      name: "Twitter",
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      bg: "hover:bg-sky-100 hover:text-sky-500",
    },
    {
      name: "WhatsApp",
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      bg: "hover:bg-green-100 hover:text-green-600",
    },
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Share:</span>
      {shareLinks.map((link) => (
        <a
          key={link.name}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1 text-xs h-7 px-2.5 rounded-full border hover:${link.bg} transition-colors text-muted-foreground`}
          aria-label={`Share on ${link.name}`}
        >
          <ExternalLink className="h-3 w-3" />
          {link.name}
        </a>
      ))}
    </div>
  );
}
