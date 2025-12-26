import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: number;
  title: string;
  description: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="relative">
      {/* Progress Line */}
      <div className="absolute left-4 top-4 h-[calc(100%-32px)] w-0.5 bg-border">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{
            height: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
          }}
        />
      </div>

      {/* Steps */}
      <div className="relative space-y-8">
        {steps.map((step) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;

          return (
            <div key={step.id} className="flex gap-4">
              {/* Step Circle */}
              <div
                className={cn(
                  "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300",
                  isCompleted && "border-primary bg-primary",
                  isCurrent && "border-primary bg-primary/20",
                  !isCompleted && !isCurrent && "border-border bg-card"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4 text-primary-foreground" />
                ) : (
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      isCurrent ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {step.id}
                  </span>
                )}
              </div>

              {/* Step Content */}
              <div className="pb-2">
                <h3
                  className={cn(
                    "font-semibold transition-colors",
                    isCurrent ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground/70">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
