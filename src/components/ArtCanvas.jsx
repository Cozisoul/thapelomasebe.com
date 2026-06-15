import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

export default function ArtCanvas({ projects }) {
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const containerRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  
  // Layout and Filtering State
  const [layoutMode, setLayoutMode] = useState('chaos'); // 'chaos' | 'grid'
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterYear, setFilterYear] = useState('All');

  // Touch/swipe tracking for modal
  const touchStartRef = useRef({ x: 0, y: 0 });
  const touchEndRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    setIsTouchDevice(window.matchMedia("(pointer: coarse)").matches);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const openModal = (project) => {
    if (window.gtmPush) window.gtmPush('art_view', { artwork_title: project.title, artwork_year: project.year });
    setSelectedProject(project);
    setActiveImageIndex(0);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = useCallback(() => {
    setSelectedProject(null);
    document.body.style.overflow = 'auto';
  }, []);

  const nextImage = useCallback((e) => {
    if (e) e.stopPropagation();
    if (!selectedProject) return;
    if (window.gtmPush) window.gtmPush('art_carousel_nav', { artwork_title: selectedProject.title, direction: 'next' });
    setActiveImageIndex((prev) => 
      prev === selectedProject.media.length - 1 ? 0 : prev + 1
    );
  }, [selectedProject]);

  const prevImage = useCallback((e) => {
    if (e) e.stopPropagation();
    if (!selectedProject) return;
    if (window.gtmPush) window.gtmPush('art_carousel_nav', { artwork_title: selectedProject.title, direction: 'prev' });
    setActiveImageIndex((prev) => 
      prev === 0 ? selectedProject.media.length - 1 : prev - 1
    );
  }, [selectedProject]);

  // Touch swipe handlers for modal
  const handleTouchStart = useCallback((e) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    touchEndRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  }, []);

  const handleTouchMove = useCallback((e) => {
    touchEndRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  }, []);

  const handleTouchEnd = useCallback(() => {
    const deltaX = touchStartRef.current.x - touchEndRef.current.x;
    const deltaY = touchStartRef.current.y - touchEndRef.current.y;
    const minSwipeDistance = 50;

    // Only trigger horizontal swipe if it's more horizontal than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        nextImage();
      } else {
        prevImage();
      }
    }
  }, [nextImage, prevImage]);

  // Keyboard Navigation for Modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedProject) return;
      switch (e.key) {
        case 'ArrowRight':
          nextImage();
          break;
        case 'ArrowLeft':
          prevImage();
          break;
        case 'Escape':
          closeModal();
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedProject, nextImage, prevImage, closeModal]);

  // Internal/branding tags to hide from filter UI
  const ignoredTags = ['aes72studio', 'thapography', 'masebe-data', '0723', 'Study'];

  // Extract unique public-facing categories
  const categories = useMemo(() => {
    const tags = new Set();
    projects.forEach(p => p.tags.forEach(t => {
      if (!ignoredTags.includes(t)) tags.add(t);
    }));
    return ['All', ...Array.from(tags).sort()];
  }, [projects]);

  // Extract unique years
  const years = useMemo(() => {
    const yrs = new Set();
    projects.forEach(p => yrs.add(p.year));
    return ['All', ...Array.from(yrs).sort((a, b) => b - a)];
  }, [projects]);

  // Filter Projects by category AND year
  const visibleProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesCat = filterCategory === 'All' || p.tags.includes(filterCategory);
      const matchesYear = filterYear === 'All' || p.year === Number(filterYear);
      return matchesCat && matchesYear;
    });
  }, [projects, filterCategory, filterYear]);

  const isGrid = layoutMode === 'grid';

  // Count visible for feedback
  const projectCount = visibleProjects.length;

  // State for mobile filter panel
  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <div 
      className={clsx(
        "relative w-full overflow-hidden transition-colors duration-500",
        isGrid ? "min-h-screen bg-system-black text-cosmic-latte pt-40 pb-32 px-4 md:px-6" : "min-h-[150vh] md:min-h-[200vh] bg-cosmic-latte"
      )} 
      ref={containerRef}
    >
      
      {/* Background hint (Chaos Mode Only) */}
      {!isGrid && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10vw] font-bold text-system-black/5 whitespace-nowrap pointer-events-none select-none z-0">
          DRAG & EXPLORE
        </div>
      )}

      {/* Grid Mode Header */}
      {isGrid && (
        <header className="max-w-[1440px] mx-auto mb-12 md:mb-16 relative z-10">
          <h1 className="font-sans text-3xl md:text-6xl font-bold uppercase tracking-tighter mb-4">Visual Archive</h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <p className="font-mono text-xs md:text-sm text-cosmic-latte/50">00.07 // PHOTOGRAPHY, PAINTING & TRANSDISCIPLINARY FORMS</p>
            <span className="font-mono text-[10px] text-cosmic-latte/30 border border-cosmic-latte/10 px-2 py-0.5 w-fit">
              {projectCount} {projectCount === 1 ? 'WORK' : 'WORKS'}
            </span>
          </div>
        </header>
      )}

      {/* Layout Container */}
      <div className={clsx(
        "relative w-full h-full max-w-[1440px] mx-auto",
        isGrid ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-12" : (isMobile ? "flex flex-col items-center pt-24 pb-48 px-4 overflow-hidden" : "p-4 md:p-0")
      )}>
        <AnimatePresence>
          {visibleProjects.map((project, idx) => {
            const layout = project.chaosLayout || { x: 0, y: 0, width: '300px', rotation: 0 };
            const hasMedia = project.media && project.media.length > 0;
            
            return (
              <motion.div
                key={project.id}
                layout
                drag={!isGrid}
                dragConstraints={containerRef}
                dragElastic={0.2}
                dragTransition={{ bounceStiffness: 100, bounceDamping: 10 }}
                initial={isGrid ? { opacity: 0, y: 20 } : (isMobile ? { y: 20, opacity: 1, rotate: layout.rotation } : { x: layout.x, y: layout.y, rotate: layout.rotation, opacity: 1 })}
                animate={isGrid 
                  ? { opacity: 1, y: 0, x: 0, rotate: 0, width: '100%' }
                  : (isMobile 
                    ? { y: 0, x: 0, opacity: 1, rotate: layout.rotation, width: '85%' } 
                    : { x: layout.x, y: layout.y, rotate: layout.rotation, opacity: 1, width: layout.width })}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: isGrid ? idx * 0.03 : 0 }}
                whileHover={!isGrid ? { scale: 1.02, zIndex: 50 } : {}}
                whileDrag={!isGrid ? { scale: 1.05, zIndex: 100, cursor: 'grabbing' } : {}}
                style={{
                  position: isGrid ? 'relative' : (isMobile ? 'relative' : 'absolute'),
                  margin: isGrid ? '0' : (isMobile ? '20px auto 40px auto' : '0'),
                  maxWidth: isGrid ? 'none' : '500px',
                  zIndex: isMobile ? visibleProjects.length - idx : 10
                }}
                className={clsx(
                  "group transition-colors duration-300",
                  isGrid 
                    ? "border border-cosmic-latte/20 p-3 md:p-4 hover:border-cosmic-latte/60 bg-[#0a0a0a] cursor-crosshair" 
                    : (isMobile ? "bg-system-black p-3 pb-8 shadow-2xl cursor-grab border border-system-black/10" : "bg-system-black p-3 pb-8 shadow-2xl cursor-grab")
                )}
                onClick={() => openModal(project)}
              >
                
                {/* Evidence Room Framing (Grid Mode Only) */}
                {isGrid && (
                  <div className="flex justify-between font-mono text-[10px] text-cosmic-latte/50 uppercase tracking-widest mb-3 md:mb-4 border-b border-cosmic-latte/20 pb-2">
                      <span>SYS_ID: {project.id}</span>
                      <span>{project.year}</span>
                  </div>
                )}

                <div className={clsx(
                  "relative w-full overflow-hidden",
                  isGrid ? "aspect-[4/3] bg-system-black" : "aspect-auto border border-system-black/20 bg-cosmic-latte"
                )}>
                  <img 
                    src={project.coverImageUrl} 
                    alt={project.title} 
                    className={clsx(
                      "w-full h-full object-cover transition-all duration-700 ease-out pointer-events-none",
                      isGrid ? "grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105" : "opacity-90 group-hover:opacity-100"
                    )}
                    loading="lazy"
                  />
                  {isGrid && (
                    <div className="absolute inset-0 border border-cosmic-latte/0 group-hover:border-cosmic-latte/20 m-4 transition-colors pointer-events-none"></div>
                  )}
                  {/* Album count badge */}
                  {hasMedia && project.media.length > 1 && (
                    <div className={clsx(
                      "absolute top-2 right-2 font-mono text-[9px] px-1.5 py-0.5 pointer-events-none",
                      isGrid 
                        ? "bg-system-black/70 text-cosmic-latte/70 border border-cosmic-latte/20" 
                        : "bg-cosmic-latte/90 text-system-black/70"
                    )}>
                      {project.media.length}
                    </div>
                  )}
                </div>

                {/* Bottom Metadata */}
                {isGrid ? (
                  <div className="mt-4 md:mt-6">
                      <span className="inline-block bg-system-black text-cosmic-latte border border-cosmic-latte/20 font-mono text-[10px] px-2 py-1 uppercase tracking-widest mb-2 md:mb-3">
                          {project.tags.find(t => !ignoredTags.includes(t)) || 'Visual Archive'}
                      </span>
                      <h2 className="text-lg md:text-xl font-medium tracking-tight text-cosmic-latte/90 group-hover:text-cosmic-latte transition-colors">
                          {project.title}
                      </h2>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-col items-center">
                    <h3 className="font-mono text-cosmic-latte text-xs uppercase tracking-widest text-center">{project.title}</h3>
                    <span className="font-sans text-[10px] text-cosmic-latte/50 mt-1">{project.year}</span>
                  </div>
                )}

              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {visibleProjects.length === 0 && (
          <div className="col-span-full py-20 text-center font-mono text-sm text-system-black/50">
            NO ASSETS FOUND IN DIRECTORY
          </div>
        )}
      </div>

      {/* Control Bar (Fixed Dock) — Desktop: horizontal, Mobile: compact with expandable filters */}
      <div className="fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-system-black text-cosmic-latte border border-cosmic-latte/20 shadow-2xl backdrop-blur-md w-[92vw] md:w-auto max-w-5xl safe-bottom">
        
        {/* Main row: always visible */}
        <div className="flex items-center justify-between md:justify-start gap-2 md:gap-3 p-3 md:p-4">
          {/* Layout Toggle */}
          <div className="flex gap-2 md:border-r border-cosmic-latte/20 md:pr-4">
            <button 
              onClick={() => {
                if (window.gtmPush) window.gtmPush('art_layout_toggle', { layout_mode: 'chaos' });
                setLayoutMode('chaos');
              }}
              className={clsx("font-mono text-[10px] md:text-xs px-2 md:px-3 py-1.5 border transition-all duration-200", !isGrid ? 'bg-cosmic-latte text-system-black border-cosmic-latte' : 'border-cosmic-latte/20 hover:border-cosmic-latte/80 hover:bg-cosmic-latte/5')}
            >
              [CHAOS]
            </button>
            <button 
              onClick={() => {
                if (window.gtmPush) window.gtmPush('art_layout_toggle', { layout_mode: 'grid' });
                setLayoutMode('grid');
              }}
              className={clsx("font-mono text-[10px] md:text-xs px-2 md:px-3 py-1.5 border transition-all duration-200", isGrid ? 'bg-cosmic-latte text-system-black border-cosmic-latte' : 'border-cosmic-latte/20 hover:border-cosmic-latte/80 hover:bg-cosmic-latte/5')}
            >
              [GRID]
            </button>
          </div>

          {/* Desktop filters (hidden on mobile) */}
          <div className="hidden md:flex gap-1.5 overflow-x-auto no-scrollbar md:border-r border-cosmic-latte/20 md:pr-4">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => {
                  if (window.gtmPush) window.gtmPush('art_filter', { filter_type: 'category', filter_value: cat });
                  setFilterCategory(cat);
                }}
                className={clsx("font-mono text-[10px] px-2 py-1 border whitespace-nowrap transition-all duration-200 uppercase", filterCategory === cat ? 'bg-accent-blue text-cosmic-latte border-accent-blue' : 'border-cosmic-latte/20 hover:border-cosmic-latte/80 hover:bg-cosmic-latte/5')}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="hidden md:flex gap-1.5 overflow-x-auto no-scrollbar">
            {years.map(yr => (
              <button
                key={yr}
                onClick={() => {
                  if (window.gtmPush) window.gtmPush('art_filter', { filter_type: 'year', filter_value: String(yr) });
                  setFilterYear(String(yr));
                }}
                className={clsx("font-mono text-[10px] px-2 py-1 border whitespace-nowrap transition-all duration-200", String(filterYear) === String(yr) ? 'bg-accent-red text-cosmic-latte border-accent-red' : 'border-cosmic-latte/20 hover:border-cosmic-latte/80 hover:bg-cosmic-latte/5')}
              >
                {yr}
              </button>
            ))}
          </div>

          {/* Mobile filter toggle */}
          <button
            className="md:hidden font-mono text-[10px] px-2 py-1.5 border border-cosmic-latte/20 hover:border-cosmic-latte/80 transition-all uppercase"
            onClick={() => setFilterOpen(!filterOpen)}
          >
            {filterOpen ? '[CLOSE]' : '[FILTER]'}
          </button>
        </div>

        {/* Mobile expandable filter panel */}
        {filterOpen && (
          <div className="md:hidden border-t border-cosmic-latte/10 p-3 space-y-3">
            <div>
              <div className="font-mono text-[9px] text-cosmic-latte/40 uppercase tracking-widest mb-2">CATEGORY</div>
              <div className="flex flex-wrap gap-1.5">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => {
                      if (window.gtmPush) window.gtmPush('art_filter', { filter_type: 'category', filter_value: cat });
                      setFilterCategory(cat);
                    }}
                    className={clsx("font-mono text-[10px] px-2 py-1 border whitespace-nowrap transition-all duration-200 uppercase", filterCategory === cat ? 'bg-accent-blue text-cosmic-latte border-accent-blue' : 'border-cosmic-latte/20 hover:border-cosmic-latte/80')}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="font-mono text-[9px] text-cosmic-latte/40 uppercase tracking-widest mb-2">YEAR</div>
              <div className="flex flex-wrap gap-1.5">
                {years.map(yr => (
                  <button
                    key={yr}
                    onClick={() => {
                      if (window.gtmPush) window.gtmPush('art_filter', { filter_type: 'year', filter_value: String(yr) });
                      setFilterYear(String(yr));
                    }}
                    className={clsx("font-mono text-[10px] px-2 py-1 border whitespace-nowrap transition-all duration-200", String(filterYear) === String(yr) ? 'bg-accent-red text-cosmic-latte border-accent-red' : 'border-cosmic-latte/20 hover:border-cosmic-latte/80')}
                  >
                    {yr}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox / Modal */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-system-black/95 p-2 md:p-8 backdrop-blur-sm"
            onClick={closeModal}
          >
            {/* Close Button */}
            <button 
              className="absolute top-4 right-4 md:top-6 md:right-6 text-cosmic-latte font-mono text-xs hover:text-accent-blue transition-colors z-50 uppercase tracking-widest"
              onClick={closeModal}
            >
              [CLOSE] <span className="hidden md:inline text-cosmic-latte/30 ml-2">ESC</span>
            </button>

            <div 
              className="relative w-full max-w-6xl h-full max-h-[90vh] md:max-h-[85vh] flex flex-col md:flex-row gap-4 md:gap-8 bg-cosmic-latte text-system-black p-1 md:p-6 shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Media Section */}
              <div 
                className="flex-1 relative bg-system-black flex items-center justify-center overflow-hidden min-h-[200px] md:min-h-[300px] group"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {selectedProject.media && selectedProject.media.length > 0 ? (
                  <motion.img 
                    key={activeImageIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    src={selectedProject.media[activeImageIndex].url}
                    alt={`${selectedProject.title} — ${activeImageIndex + 1}`}
                    className="max-w-full max-h-full object-contain"
                    draggable={false}
                  />
                ) : (
                  <div className="font-mono text-xs text-cosmic-latte/50">NO ASSET FOUND</div>
                )}
                
                {/* Image Navigation — always visible on touch, hover on desktop */}
                {selectedProject.media && selectedProject.media.length > 1 && (
                  <>
                    <button 
                      onClick={prevImage}
                      className={clsx(
                        "absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-cosmic-latte/20 md:bg-cosmic-latte/10 hover:bg-cosmic-latte/30 text-cosmic-latte p-2 md:p-3 transition-all font-mono text-sm",
                        isTouchDevice ? "opacity-70" : "opacity-0 group-hover:opacity-100"
                      )}
                      aria-label="Previous image"
                    >
                      &larr;
                    </button>
                    <button 
                      onClick={nextImage}
                      className={clsx(
                        "absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-cosmic-latte/20 md:bg-cosmic-latte/10 hover:bg-cosmic-latte/30 text-cosmic-latte p-2 md:p-3 transition-all font-mono text-sm",
                        isTouchDevice ? "opacity-70" : "opacity-0 group-hover:opacity-100"
                      )}
                      aria-label="Next image"
                    >
                      &rarr;
                    </button>
                    <div className="absolute bottom-2 md:bottom-4 left-1/2 -translate-x-1/2 font-mono text-[10px] text-cosmic-latte/50 bg-system-black/80 px-2 py-1">
                      {activeImageIndex + 1} / {selectedProject.media.length}
                      {isTouchDevice && <span className="ml-2 text-cosmic-latte/30">SWIPE TO NAVIGATE</span>}
                    </div>
                  </>
                )}
              </div>

              {/* Info Section */}
              <div className="w-full md:w-80 flex flex-col p-3 md:p-0 overflow-y-auto max-h-[35vh] md:max-h-none shrink-0">
                <div className="font-mono text-xs text-accent-blue uppercase tracking-widest mb-2 border-b border-system-black/20 pb-2">
                  {selectedProject.year}
                </div>
                <h2 className="font-sans text-xl md:text-3xl font-bold uppercase tracking-tight leading-none mb-4 md:mb-6">
                  {selectedProject.title}
                </h2>
                <p className="font-sans text-sm md:text-base leading-relaxed opacity-90 mb-6 md:mb-8">
                  {selectedProject.description}
                </p>
                
                <div className="mt-auto">
                  <div className="font-mono text-[10px] text-system-black/50 uppercase tracking-widest mb-2">Tags</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.tags
                      .filter(tag => !ignoredTags.includes(tag))
                      .map(tag => (
                        <span key={tag} className="border border-system-black/20 px-2 py-1 font-mono text-[10px] uppercase text-system-black/80">
                          {tag}
                        </span>
                      ))}
                  </div>
                  {selectedProject.media && selectedProject.media.length > 0 && (
                    <div className="font-mono text-[10px] text-system-black/30 mt-4">
                      {selectedProject.media.length} {selectedProject.media.length === 1 ? 'IMAGE' : 'IMAGES'} IN ALBUM {!isTouchDevice && '// USE ← → TO NAVIGATE'}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
