import { useEffect, useRef, useState, ReactNode } from 'react';

/**
 * Wraps an A4-width (210mm ≈ 794px) invoice preview and scales it
 * down to fit narrow viewports without horizontal scroll.
 */
const A4_PX = 794; // 210mm at 96dpi

const ResponsiveInvoiceFrame = ({ children }: { children: ReactNode }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number | undefined>();

  useEffect(() => {
    const update = () => {
      const w = wrapRef.current?.clientWidth ?? A4_PX;
      const s = Math.min(1, w / A4_PX);
      setScale(s);
      const innerH = innerRef.current?.scrollHeight;
      if (innerH) setHeight(innerH * s);
    };
    update();
    const ro = new ResizeObserver(update);
    if (wrapRef.current) ro.observe(wrapRef.current);
    if (innerRef.current) ro.observe(innerRef.current);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="w-full overflow-hidden print:overflow-visible"
      style={{ height }}
    >
      <div
        ref={innerRef}
        className="origin-top-left print:!transform-none"
        style={{ width: A4_PX, transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
};

export default ResponsiveInvoiceFrame;