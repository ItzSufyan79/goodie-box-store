import { Gift, Heart, Users, Award } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl font-bold mb-2">About Goodie Box</h1>
      <p className="text-muted-foreground mb-8">
        Curated gift boxes, college essentials, and snacks — delivered with love.
      </p>

      <div className="space-y-8">
        <div className="flex gap-4">
          <Gift className="h-6 w-6 text-primary shrink-0 mt-1" />
          <div>
            <h2 className="text-xl font-semibold mb-2">Our Story</h2>
            <p className="text-muted-foreground">
              Goodie Box was born from a simple idea — thoughtful gifting should
              be easy, affordable, and delightful. We curate gift boxes for every
              occasion, from exam survival kits to birthday surprises, ensuring
              every box is packed with love.
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <Heart className="h-6 w-6 text-primary shrink-0 mt-1" />
          <div>
            <h2 className="text-xl font-semibold mb-2">What We Offer</h2>
            <p className="text-muted-foreground">
              From handpicked gift collections to custom requests, we cater to
              all your gifting needs. Our boxes include college essentials,
              snacks, accessories, and more — all carefully selected to bring
              a smile to your loved ones.
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <Users className="h-6 w-6 text-primary shrink-0 mt-1" />
          <div>
            <h2 className="text-xl font-semibold mb-2">Our Community</h2>
            <p className="text-muted-foreground">
              With 1000+ happy customers and 50+ gift collections, we&apos;re
              proud to be a part of your special moments. Every order supports
              our mission of making gifting effortless.
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <Award className="h-6 w-6 text-primary shrink-0 mt-1" />
          <div>
            <h2 className="text-xl font-semibold mb-2">Why Choose Us</h2>
            <p className="text-muted-foreground">
              Free shipping on orders over ₹999, easy returns within 7 days, and
              a dedicated support team ready to help. We&apos;re here to make
              your gifting experience seamless.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
