import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card } from "@/components/ui/card";

const PASTORS = [
  { name: "Pastor", role: "Família Pastoral" },
  { name: "Pastora", role: "Família Pastoral" },
  { name: "Liderança", role: "Família Pastoral" },
  { name: "Ministério", role: "Família Pastoral" },
];

export function PastorsCarousel() {
  return (
    <div className="relative">
      <Carousel opts={{ align: "start", loop: true }}>
        <CarouselContent>
          {PASTORS.map((p) => (
            <CarouselItem key={p.name} className="md:basis-1/2 lg:basis-1/3">
              <Card className="h-full p-6 text-left">
                <p className="font-display text-lg">{p.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{p.role}</p>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-2" />
        <CarouselNext className="right-2" />
      </Carousel>
    </div>
  );
}
