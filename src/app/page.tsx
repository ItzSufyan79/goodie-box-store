import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Gift, Sparkles, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/products/product-card";
import { HeroEditor } from "@/components/homepage/hero-editor";
import { HeroImageEditor } from "@/components/homepage/hero-image-editor";
import { ScrollReveal } from "@/components/animations/scroll-reveal";
import { HoverLift } from "@/components/animations/hover-lift";
import { AnimatedCounter } from "@/components/animations/animated-counter";
import { ParallaxSection } from "@/components/animations/parallax-section";
import { getProductsAction, getCollectionsAction } from "@/actions/products";
import { getHeroSettings } from "@/actions/settings";
import { auth } from "@/lib/auth";

export default async function HomePage() {
  const [{ products: featured }, { products: latest }, collections, heroSettings, session] =
    await Promise.all([
      getProductsAction({ featured: true, limit: 8 }),
      getProductsAction({ limit: 8 }),
      getCollectionsAction(),
      getHeroSettings(),
      auth(),
    ]);

  const canEdit = session?.user && (session.user.role === "ADMIN" || session.user.role === "SELLER");

  const statMatch = heroSettings.statNumber.match(/^(\d+)(.*)$/);
  const statValue = statMatch ? parseInt(statMatch[1]) : 0;
  const statSuffix = statMatch ? statMatch[2] ?? "" : "";

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-pink-50 via-purple-50 to-white dark:from-background dark:via-background dark:to-background group">
        {canEdit && <HeroEditor settings={heroSettings} />}
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <ScrollReveal delay={0}>
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                <Sparkles className="h-4 w-4" />
                {heroSettings.badge}
              </div>
              </ScrollReveal>
              <ScrollReveal delay={0.1}>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                {heroSettings.heading.split(heroSettings.headingHighlight).length > 1 ? (
                  <>
                    {heroSettings.heading.split(heroSettings.headingHighlight)[0]}
                    <span className="text-primary">{heroSettings.headingHighlight}</span>
                    {heroSettings.heading.split(heroSettings.headingHighlight)[1]}
                  </>
                ) : (
                  heroSettings.heading
                )}
              </h1>
              </ScrollReveal>
              <ScrollReveal delay={0.2}>
              <p className="text-lg text-muted-foreground mb-8 max-w-lg">
                {heroSettings.subtitle}
              </p>
              </ScrollReveal>
              <ScrollReveal delay={0.3}>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" asChild>
                  <Link href="/products">
                    Shop Now <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/custom-request">Custom Request</Link>
                </Button>
              </div>
              </ScrollReveal>
              <ScrollReveal delay={0.4}>
              <div className="flex flex-wrap justify-center sm:flex-nowrap gap-4 sm:gap-8 mt-10 text-sm">
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <Truck className="h-5 w-5 text-primary shrink-0" />
                  <span>Free shipping over ₹999</span>
                </div>
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <Gift className="h-5 w-5 text-primary shrink-0" />
                  <span>1000+ happy customers</span>
                </div>
              </div>
              </ScrollReveal>
            </div>
            <ScrollReveal delay={0.2} direction="right" className="relative hidden lg:block">
              {canEdit ? (
                <HeroImageEditor
                  src={heroSettings.image}
                  alt="Curated gift boxes"
                  settings={heroSettings}
                />
              ) : (
                <ParallaxSection speed={0.3} className="aspect-square relative rounded-3xl overflow-hidden shadow-2xl">
                  <Image
                    src={heroSettings.image}
                    alt="Curated gift boxes"
                    fill
                    className="object-cover"
                    priority
                  />
                </ParallaxSection>
              )}
              <ScrollReveal delay={0.5} direction="up" className="absolute -bottom-4 -left-4 bg-background rounded-2xl shadow-lg p-4">
                <AnimatedCounter to={statValue} suffix={statSuffix} className="text-2xl font-bold text-primary" />
                <p className="text-sm text-muted-foreground">{heroSettings.statLabel}</p>
              </ScrollReveal>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Collections */}
      {collections.length > 0 && (
        <>
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <ScrollReveal>
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-2">Gift Guides</h2>
                <p className="text-muted-foreground">
                  Curated collections for every occasion
                </p>
              </div>
              <Button variant="ghost" asChild>
                <Link href="/collections">
                  View All <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
            </ScrollReveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.slice(0, 3).map((collection, i) => (
                <ScrollReveal key={collection.id} delay={i * 0.1}>
                <HoverLift lift={6}>
                <Link
                  href={`/collections/${collection.slug}`}
                  className="group relative aspect-[4/3] rounded-2xl overflow-hidden block"
                >
                  <Image
                    src={
                      collection.image ??
                      "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=600&q=80"
                    }
                    alt={collection.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-0 p-6 text-white">
                    <h3 className="text-xl font-bold">{collection.title}</h3>
                    {collection.occasion && (
                      <p className="text-sm opacity-80">{collection.occasion}</p>
                    )}
                  </div>
                </Link>
                </HoverLift>
                </ScrollReveal>
              ))}
            </div>
        </div>
      </section>
      <div className="h-8 bg-gradient-to-b from-transparent to-background -mt-8 relative z-10" />
      </>
      )}

      {/* Featured Products */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <ScrollReveal>
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-2">Trending Now</h2>
            <p className="text-muted-foreground">
              Most loved gift boxes and essentials
            </p>
          </div>
          </ScrollReveal>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {(featured.length > 0 ? featured : latest).map((product, i) => (
              <ScrollReveal key={product.id} delay={i * 0.05}>
              <HoverLift>
              <ProductCard {...product} />
              </HoverLift>
              </ScrollReveal>
            ))}
          </div>
          <ScrollReveal>
          <div className="text-center mt-10">
            <Button size="lg" variant="outline" asChild>
              <Link href="/products">Browse All Products</Link>
            </Button>
          </div>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <ScrollReveal>
          <h2 className="text-3xl font-bold mb-4">
            Can&apos;t Find What You&apos;re Looking For?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Submit a custom request and we&apos;ll create a personalized gift
            box tailored to your needs and budget.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/custom-request">Submit Custom Request</Link>
          </Button>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
