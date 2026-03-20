"use client";

interface BlosmLogoProps {
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  className?: string;
}

export default function BlosmLogo({ variant = "dark", size = "md", showTagline = true, className = "" }: BlosmLogoProps) {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-4xl",
  };

  const taglineSizeClasses = {
    sm: "text-[0.55rem]",
    md: "text-[0.6rem]",
    lg: "text-xs",
  };

  const taglineColor = variant === "light" ? "text-white" : "text-black";

  return (
    <div className={`flex flex-col ${className}`}>
      <span className={`font-display font-semibold tracking-wide uppercase ${sizeClasses[size]} logo-blosm`}>
        BLOSM
      </span>
      {showTagline && (
        <span className={`logo-tagline ${taglineSizeClasses[size]} ${taglineColor} mt-0.5`}>
          HAIR & BEAUTY
        </span>
      )}
    </div>
  );
}
