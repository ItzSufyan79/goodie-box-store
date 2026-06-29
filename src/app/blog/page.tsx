import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

const posts = [
  {
    title: "The Ultimate College Survival Kit",
    date: "June 15, 2026",
    excerpt:
      "Packing for college? Here's everything you need to survive and thrive — from late-night snack essentials to must-have accessories.",
    slug: "college-survival-kit",
  },
  {
    title: "5 Thoughtful Gift Ideas for Every Occasion",
    date: "May 28, 2026",
    excerpt:
      "Stuck on what to gift? Explore our handpicked ideas that work for birthdays, anniversaries, and just-because moments.",
    slug: "thoughtful-gift-ideas",
  },
  {
    title: "How to Style Your Gift Box Like a Pro",
    date: "May 10, 2026",
    excerpt:
      "Make your gift box instagram-worthy with these simple styling tips and tricks.",
    slug: "style-gift-box",
  },
];

export default function BlogPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Blog</h1>
      <p className="text-muted-foreground mb-8">
        Tips, guides, and stories from the Goodie Box team.
      </p>

      <div className="space-y-6">
        {posts.map((post) => (
          <article
            key={post.slug}
            className="border rounded-xl p-6 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <Calendar className="h-3 w-3" />
              {post.date}
            </div>
            <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
            <p className="text-muted-foreground mb-4">{post.excerpt}</p>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/blog/${post.slug}`}>
                Read More <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </article>
        ))}
      </div>
    </div>
  );
}
