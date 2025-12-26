
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Dimensions, ContainerBounds } from '../types';

interface InspectElementProps {
  children: React.ReactNode;
  containerRef: React.RefObject<HTMLDivElement>;
  label: string;
  gapToNext?: number;
  gapToPrev?: number;
  onHoverChange?: (isHovered: boolean) => void;
  forceShow?: boolean;
}

const InspectElement: React.FC<InspectElementProps> = ({ 
  children, 
  containerRef, 
  label,
  gapToNext,
  gapToPrev,
  onHoverChange,
  forceShow = false
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [dims, setDims] = useState<Dimensions | null>(null);
  const [parentBounds, setParentBounds] = useState<ContainerBounds | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);

  const shouldShow = isHovered || forceShow;

  const updateMeasurements = useCallback(() => {
    if (elementRef.current && containerRef.current) {
      const rect = elementRef.current.getBoundingClientRect();
      const parentRect = containerRef.current.getBoundingClientRect();

      setDims({
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        top: Math.round(rect.top - parentRect.top),
        left: Math.round(rect.left - parentRect.left),
        right: Math.round(parentRect.right - rect.right),
        bottom: Math.round(parentRect.bottom - rect.bottom),
      });

      setParentBounds({
        width: Math.round(parentRect.width),
        height: Math.round(parentRect.height),
      });
    }
  }, [containerRef]);

  useEffect(() => {
    if (shouldShow) {
      updateMeasurements();
      const observer = new ResizeObserver(updateMeasurements);
      if (containerRef.current) observer.observe(containerRef.current);
      window.addEventListener('scroll', updateMeasurements, true);
      
      return () => {
        observer.disconnect();
        window.removeEventListener('scroll', updateMeasurements, true);
      };
    }
  }, [shouldShow, updateMeasurements, containerRef]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    onHoverChange?.(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onHoverChange?.(false);
  };

  return (
    <div
      ref={elementRef}
      className="relative inline-block group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {shouldShow && dims && parentBounds && (
        <div className="pointer-events-none absolute inset-0 z-[999] transition-opacity duration-500">
          {/* Main Outline */}
          <div className="absolute inset-0 border border-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.3)]" />
          
          {/* Top Line to Boundary with numeric label */}
          <div 
            className="absolute bg-pink-500/40 w-[1px] flex justify-center items-center" 
            style={{ height: dims.top, bottom: '100%', left: '50%' }}
          >
            {dims.top > 20 && (
              <span className="absolute bg-pink-600 text-white text-[9px] px-1 rounded font-mono font-bold">
                {dims.top}px
              </span>
            )}
          </div>

          {/* Bottom Line to Boundary with numeric label */}
          <div 
            className="absolute bg-pink-500/40 w-[1px] flex justify-center items-center" 
            style={{ height: dims.bottom, top: '100%', left: '50%' }}
          >
             {dims.bottom > 20 && (
              <span className="absolute bg-pink-600 text-white text-[9px] px-1 rounded font-mono font-bold">
                {dims.bottom}px
              </span>
            )}
          </div>

          {/* Left Line to Boundary with numeric label */}
          <div 
            className="absolute bg-pink-500/40 h-[1px] flex justify-center items-center" 
            style={{ width: dims.left, right: '100%', top: '50%' }}
          >
            {dims.left > 30 && (
              <span className="absolute bg-pink-600 text-white text-[9px] px-1 rounded font-mono font-bold">
                {dims.left}px
              </span>
            )}
          </div>

          {/* Right Line to Boundary with numeric label */}
          <div 
            className="absolute bg-pink-500/40 h-[1px] flex justify-center items-center" 
            style={{ width: dims.right, left: '100%', top: '50%' }}
          >
            {dims.right > 30 && (
              <span className="absolute bg-pink-600 text-white text-[9px] px-1 rounded font-mono font-bold">
                {dims.right}px
              </span>
            )}
          </div>

          {/* GAP HIGHLIGHTS */}
          {gapToNext !== undefined && (
            <div 
              className="absolute w-screen -left-[50vw]"
              style={{ top: '100%', height: gapToNext }}
            >
              <div 
                className="w-full h-full bg-[#7c3aed]/10 border-y border-dashed border-[#7c3aed]/30" 
                style={{ 
                  backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(124, 58, 237, 0.05) 5px, rgba(124, 58, 237, 0.05) 10px)' 
                }}
              />
              <div className="absolute left-[15%] top-1/2 -translate-y-1/2 flex items-center gap-2">
                <div className="w-[1px] h-3 bg-pink-500" />
                <span className="bg-pink-600 text-white text-[9px] px-1 rounded font-mono font-bold">
                  {gapToNext}px
                </span>
              </div>
            </div>
          )}

          {gapToPrev !== undefined && (
            <div 
              className="absolute w-screen -left-[50vw]"
              style={{ bottom: '100%', height: gapToPrev }}
            >
              <div 
                className="w-full h-full bg-[#7c3aed]/10 border-y border-dashed border-[#7c3aed]/30" 
                style={{ 
                  backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(124, 58, 237, 0.05) 5px, rgba(124, 58, 237, 0.05) 10px)' 
                }}
              />
            </div>
          )}

          {/* Dimensions Label */}
          <div className="absolute -top-8 left-0 flex gap-1 items-center whitespace-nowrap">
            <span className="bg-pink-600 text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
              {label}
            </span>
            <span className="bg-[#1e1e1e] text-[#868686] text-[9px] px-1.5 py-0.5 rounded border border-pink-500/30 font-mono">
              {dims.width}px × {dims.height}px
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default InspectElement;
