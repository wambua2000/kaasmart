import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { cn } from "@/lib/utils";

type AnimationType = "fade-in-up" | "fade-in-left" | "fade-in-right" | "scale-in";

interface AnimatedSectionProps {
  children: React.ReactNode;
  animation?: AnimationType;
  delay?: number;
  className?: string;
  as?: "section" | "div";
}

const AnimatedSection = ({
  children,
  animation = "fade-in-up",
  delay = 0,
  className,
  as: Component = "section",
}: AnimatedSectionProps) => {
  const { ref, isVisible } = useScrollAnimation(0.1);

  return (
    <Component
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out",
        isVisible ? `animate-${animation}` : "opacity-0 translate-y-8",
        className
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      {children}
    </Component>
  );
};

export default AnimatedSection;
