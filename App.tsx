
import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import InspectElement from './components/InspectElement';

interface GapHighlightProps {
  height: number;
  onMouseDown: (e: React.MouseEvent) => void;
  isDragging: boolean;
  blurAmount: number;
  onHoverChange?: (isHovered: boolean) => void;
}

const GapHighlight: React.FC<GapHighlightProps> = ({ height, onMouseDown, isDragging, blurAmount, onHoverChange }) => {
  const [isHovered, setIsHovered] = useState(false);

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
      className="relative w-full transition-colors duration-150"
      style={{ height, filter: `blur(${blurAmount}px)` }}
    >
      <div 
        className="absolute inset-0 z-30"
        style={{ cursor: 'ns-resize' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={onMouseDown}
      />
      
      {(isHovered || isDragging) && (
        <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
          <div 
            className={`w-full h-full ${isDragging ? 'bg-[#7c3aed]/30' : 'bg-[#7c3aed]/20'}`} 
            style={{ 
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(124, 58, 237, 0.1) 5px, rgba(124, 58, 237, 0.1) 10px)' 
            }}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#7c3aed] text-white text-[10px] px-1.5 py-0.5 rounded font-mono font-bold shadow-lg">
            gap: {Math.round(height)}px
          </div>
        </div>
      )}
    </div>
  );
};

const ProjectCard: React.FC<{ index: number; bgColor: string; isActive: boolean; onHoverChange?: (isHovered: boolean) => void }> = ({ index, bgColor, isActive, onHoverChange }) => (
  <div 
    className="group relative aspect-square w-[clamp(280px,85vw,520px)] overflow-hidden cursor-pointer shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] pointer-events-auto"
    style={{ backgroundColor: bgColor }}
    onClick={() => isActive && console.log(`Project ${index + 1} clicked`)}
    onMouseEnter={() => onHoverChange?.(true)}
    onMouseLeave={() => onHoverChange?.(false)}
  >
    {/* Subtle Inner Glow */}
    <div className={`absolute inset-0 ${bgColor === '#f6f6f6' ? 'bg-black/5' : 'bg-white/10'} pointer-events-none`} />
    
    {/* Figma-style grid overlay on hover */}
    <div className="absolute inset-0 opacity-0 group-hover:opacity-10 pointer-events-none transition-opacity duration-300"
      style={{ backgroundImage: `radial-gradient(${bgColor === '#f6f6f6' ? '#000' : '#fff'} 1px, transparent 1px)`, backgroundSize: '30px 30px' }}
    />
    
    {/* Label for visual confirmation of clickability */}
    <div className={`absolute bottom-4 left-4 text-[9px] font-mono opacity-0 group-hover:opacity-40 transition-opacity ${bgColor === '#f6f6f6' ? 'text-black' : 'text-white'}`}>
      {isActive ? `CLICK_TO_VIEW_0${index + 1}` : 'COVERED_BY_LAYER'}
    </div>
  </div>
);

const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const firstCardRef = useRef<HTMLDivElement>(null);
  
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [windowHeight, setWindowHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 800);
  const [blurAmount, setBlurAmount] = useState(0);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isHoveringInteractive, setIsHoveringInteractive] = useState(false);
  
  // Animation Orchestration States
  const [animStage, setAnimStage] = useState<'idle' | 'lines' | 'content' | 'settled'>('idle');
  
  const [rowGap, setRowGap] = useState(42);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartGap = useRef(0);
  const hasManuallyAdjusted = useRef(false);

  const getResponsiveGap = useCallback((width: number) => {
    if (width < 640) return 12;
    if (width < 1024) return 16;
    return 42;
  }, []);

  const isInteracting = isDragging || isHoveringInteractive;
  const lineOpacity = isInteracting ? '0.7' : '0.5';

  // Entrance Animation Sequence - Removed "inspect" stage to hide automatic padding overlays
  useEffect(() => {
    const timer1 = setTimeout(() => setAnimStage('lines'), 100);
    const timer2 = setTimeout(() => setAnimStage('content'), 500);
    const timer3 = setTimeout(() => {
      setAnimStage('settled');
    }, 1200);

    return () => {
      [timer1, timer2, timer3].forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scroll = window.scrollY;
      const maxBlur = 12;
      const blurStart = 100; 
      const blurEnd = window.innerHeight * 0.7;
      
      if (scroll < blurStart) {
        setBlurAmount(0);
      } else {
        const amount = Math.min(maxBlur, ((scroll - blurStart) / (blurEnd - blurStart)) * maxBlur);
        setBlurAmount(amount);
      }

      const cardContainers = document.querySelectorAll('.project-sticky-container');
      let currentActive = 0;
      const threshold = window.innerHeight / 2;

      cardContainers.forEach((container, idx) => {
        const rect = container.getBoundingClientRect();
        if (rect.top <= threshold) {
          currentActive = idx;
        }
      });
      setActiveCardIndex(currentActive);
    };

    const handleResize = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      setWindowHeight(window.innerHeight);
      if (!hasManuallyAdjusted.current) {
        setRowGap(getResponsiveGap(width));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    setRowGap(getResponsiveGap(window.innerWidth));
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [getResponsiveGap]);

  const fontSizeClass = "text-[clamp(26px,9vw,125px)]";
  const trackingClass = "tracking-[-0.08em] lg:tracking-[-0.1em]";
  const lineStyle = { lineHeight: 'calc(0.72em + 2px)' };

  const phrases = useMemo(() => {
    if (isOverflowing) {
      return [
        { label: "row_1", text: "DESIGNING" },
        { label: "row_2", text: "BETTER," },
        { label: "row_3", text: "ONE STEP DAILY" }
      ];
    }
    return [
      { label: "row_1", text: "DESIGNING BETTER," },
      { label: "row_2", text: "ONE STEP DAILY" }
    ];
  }, [isOverflowing]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const x = Math.round(e.clientX - rect.left);
        const y = Math.round(e.clientY - rect.top);
        setMousePos({ x, y });
      }

      if (isDragging) {
        const deltaY = e.clientY - dragStartY.current;
        const currentFontSize = Math.min(Math.max(26, window.innerWidth * 0.09), 125);
        const phraseHeight = currentFontSize * 0.72 + 2;
        const totalPhrasesHeight = phrases.length * phraseHeight;
        const navBottom = navRef.current?.getBoundingClientRect().bottom || 82;
        const safeTop = navBottom + 16;
        const maxContentHeight = Math.max(0, window.innerHeight - (2 * safeTop));
        const maxTotalGap = Math.max(0, maxContentHeight - totalPhrasesHeight);
        const maxGap = phrases.length > 1 ? maxTotalGap / (phrases.length - 1) : 400;

        const newGap = Math.max(4, Math.min(maxGap, dragStartGap.current + deltaY));
        setRowGap(newGap);
        hasManuallyAdjusted.current = true;
      }
    };

    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, phrases.length]);

  const handleGapMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartGap.current = rowGap;
  };

  useEffect(() => {
    const checkOverflow = () => {
      const width = window.innerWidth;
      const currentFontSize = Math.min(Math.max(26, width * 0.09), 125);
      const estimatedWidth = 16 * currentFontSize * 0.52; 
      setIsOverflowing(estimatedWidth > (width * 0.7));
    };
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, []);

  const scrollToWork = (e: React.MouseEvent) => {
    e.preventDefault();
    if (firstCardRef.current) {
        const element = firstCardRef.current;
        const elementRect = element.getBoundingClientRect();
        const absoluteElementTop = elementRect.top + window.pageYOffset;
        const middleOffset = (window.innerHeight / 2) - (element.offsetHeight / 2);
        
        window.scrollTo({
          top: absoluteElementTop - middleOffset,
          behavior: 'smooth'
        });
    }
  };

  const stickyTop = "top-[calc(50vh-clamp(140px,42.5vw,260px))]";

  return (
    <div 
      ref={containerRef}
      className={`relative w-full bg-[#050505] text-white font-mono-jb ${isDragging ? 'cursor-ns-resize' : 'figma-cursor'}`}
    >
      <div className="fixed top-0 left-0 w-full h-32 bg-gradient-to-b from-[#050505] to-transparent z-[90] pointer-events-none" />

      {/* Navigation Indicators */}
      <div 
        className={`fixed top-8 left-[16%] z-[999] flex flex-col gap-2.5 text-[10px] pointer-events-none select-none uppercase tracking-tighter font-medium transition-all duration-700 ${animStage === 'idle' ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}
        onMouseEnter={() => setIsHoveringInteractive(true)}
        onMouseLeave={() => setIsHoveringInteractive(false)}
      >
        <div className="flex gap-3 items-center">
          <span className="text-[#868686] font-mono">x: {mousePos.x}px / y: {mousePos.y}px</span>
        </div>
        <div className="flex gap-3 items-center">
          <span className="text-[#868686] font-mono">{windowWidth}px × {windowHeight}px</span>
        </div>
      </div>

      <nav 
        ref={navRef}
        className={`fixed top-8 right-[16%] z-[999] flex flex-col items-end gap-2.5 text-[10px] uppercase tracking-tighter font-medium transition-all duration-700 ${animStage === 'idle' ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}
        onMouseEnter={() => setIsHoveringInteractive(true)}
        onMouseLeave={() => setIsHoveringInteractive(false)}
      >
        <a 
          href="#work" 
          onClick={scrollToWork}
          className="text-[#868686] font-mono hover:text-white transition-all cursor-pointer select-none"
        >
          Work
        </a>
        <a href="#about" className="text-[#868686] font-mono hover:text-white transition-all cursor-pointer select-none">About</a>
        <a href="#resume" className="text-[#868686] font-mono hover:text-white transition-all cursor-pointer select-none">Resume</a>
      </nav>

      <section 
        id="hero" 
        className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden z-0"
      >
        {/* VERTICAL LINES - Entering from top */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div 
            className="absolute left-[15%] h-full w-[1px] bg-[#654000] transition-all duration-700 ease-out" 
            style={{ 
              opacity: animStage === 'idle' ? 0 : lineOpacity,
              transform: animStage === 'idle' ? 'scaleY(0)' : 'scaleY(1)',
              transformOrigin: 'top'
            }}
          />
          <div 
            className="absolute right-[15%] h-full w-[1px] bg-[#654000] transition-all duration-700 ease-out" 
            style={{ 
              opacity: animStage === 'idle' ? 0 : lineOpacity,
              transform: animStage === 'idle' ? 'scaleY(0)' : 'scaleY(1)',
              transformOrigin: 'top'
            }}
          />
        </div>

        <main 
          className="relative z-10 w-full flex flex-col items-start"
        >
          <div className="flex flex-col w-full">
            {phrases.map((phrase, i) => {
              const horizontalOrigin = i % 2 === 0 ? 'left' : 'right';
              
              return (
                <React.Fragment key={`${isOverflowing ? 'overflow' : 'normal'}-${phrase.label}`}>
                  <div className="w-full relative">
                    {/* Horizontal Line Above */}
                    <div 
                      className="w-full h-[1px] bg-[#654000] transition-all duration-700 ease-out" 
                      style={{ 
                        filter: `blur(${blurAmount}px)`,
                        opacity: animStage === 'idle' ? 0 : lineOpacity,
                        transform: animStage === 'idle' ? 'scaleX(0)' : 'scaleX(1)',
                        transformOrigin: horizontalOrigin
                      }}
                    />
                    
                    <div className="pl-[15%] flex items-center">
                      <InspectElement 
                        containerRef={containerRef} 
                        label={phrase.label}
                        gapToNext={i < phrases.length - 1 ? rowGap : undefined}
                        gapToPrev={i > 0 ? rowGap : undefined}
                        onHoverChange={setIsHoveringInteractive}
                        forceShow={false} // Never force show during loading now
                      >
                        <h1 
                          style={{ 
                            ...lineStyle, 
                            opacity: animStage === 'content' || animStage === 'settled' ? 1 : 0,
                            transform: animStage === 'content' || animStage === 'settled' ? 'translateY(0)' : 'translateY(10px)',
                            filter: `blur(${blurAmount}px)`,
                            transition: 'opacity 0.6s ease-out, transform 0.6s ease-out'
                          }}
                          className={`${fontSizeClass} ${trackingClass} font-light uppercase whitespace-nowrap block select-none text-zinc-400`}
                        >
                          {phrase.text}
                        </h1>
                      </InspectElement>
                    </div>

                    {/* Horizontal Line Below */}
                    <div 
                      className="w-full h-[1px] bg-[#654000] transition-all duration-700 ease-out" 
                      style={{ 
                        filter: `blur(${blurAmount}px)`,
                        opacity: animStage === 'idle' ? 0 : lineOpacity,
                        transform: animStage === 'idle' ? 'scaleX(0)' : 'scaleX(1)',
                        transformOrigin: horizontalOrigin === 'left' ? 'right' : 'left'
                      }}
                    />
                  </div>
                  {i < phrases.length - 1 && (
                    <GapHighlight 
                      height={rowGap} 
                      onMouseDown={handleGapMouseDown} 
                      isDragging={isDragging}
                      blurAmount={blurAmount}
                      onHoverChange={setIsHoveringInteractive}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </main>
      </section>

      <section id="work" className="relative z-20 w-full flex flex-col items-center pt-[50vh] pb-[80vh]">
        <div className="w-full flex flex-col items-center">
          
          <div className="relative w-full flex flex-col items-center">
            <div 
              ref={firstCardRef}
              className={`project-sticky-container sticky ${stickyTop} w-full flex justify-center mb-[50vh] z-10 pointer-events-none`}
            >
                <ProjectCard index={0} bgColor="#6F47EB" isActive={activeCardIndex === 0} onHoverChange={setIsHoveringInteractive} />
            </div>

            <div className={`project-sticky-container sticky ${stickyTop} w-full flex justify-center mb-[50vh] z-20 pointer-events-none`}>
                <ProjectCard index={1} bgColor="#0084FF" isActive={activeCardIndex === 1} onHoverChange={setIsHoveringInteractive} />
            </div>

            <div className={`project-sticky-container sticky ${stickyTop} w-full flex justify-center mb-[50vh] z-30 pointer-events-none`}>
                <ProjectCard index={2} bgColor="#f6f6f6" isActive={activeCardIndex === 2} onHoverChange={setIsHoveringInteractive} />
            </div>
          </div>
        </div>

        <div className="w-full flex justify-center mt-64 opacity-30">
          <div className="w-[70%] h-[1px] bg-[#654000]/50" />
        </div>
      </section>
    </div>
  );
};

export default App;
