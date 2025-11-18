"use client";

type ScrollToSectionProps = {
  targetId: string;
  children: React.ReactNode;
  className?: string;
};

export function ScrollToSection({ targetId, children, className }: ScrollToSectionProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <a href={`#${targetId}`} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}

