import React from 'react';
import { ArrowRight, ShieldCheck, Truck, RefreshCw } from 'lucide-react';

interface HeroBannerProps {
  onExplore: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onExplore }) => {
  return (
    <section className="relative overflow-hidden bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Editorial Headline & Actions */}
          <div className="lg:col-span-6 space-y-6">
            {/* Clean unboxed metadata separator - Zero Pill Discipline */}
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 tracking-wide uppercase">
              <span>Collection 2026</span>
              <span aria-hidden="true">·</span>
              <span>Acoustics & Precision Hardware</span>
              <span aria-hidden="true">·</span>
              <span>Direct Studio Edition</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold tracking-tight text-neutral-900 leading-[1.1] text-balance">
              Engineered sound and tactile mechanics.
            </h1>

            <p className="text-base sm:text-lg text-neutral-600 leading-relaxed max-w-xl">
              Precision-machined beryllium drivers, isolated gasket mechanical keypads,
              and titanium calibres crafted without acoustic compromise.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onExplore}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-neutral-900 rounded-xl hover:bg-neutral-800 transition-all shadow-sm group"
              >
                <span>Browse Storefront</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>

              <div className="text-xs text-neutral-500 font-mono">
                Authoritative Pricing · Real-Time Stock
              </div>
            </div>

            {/* Adjacent Trust Proof - Adjacency Rule */}
            <div className="pt-6 border-t border-neutral-100 grid grid-cols-3 gap-4 text-xs text-neutral-600">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-neutral-900 shrink-0" />
                <span>Complimentary Delivery &gt; $150</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-neutral-900 shrink-0" />
                <span>3-Year Studio Warranty</span>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-neutral-900 shrink-0" />
                <span>Verified Owner Reviews</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Slot */}
          <div className="lg:col-span-6 relative">
            <div className="relative aspect-16/10 rounded-2xl overflow-hidden bg-neutral-100 shadow-sm border border-neutral-200/80 group">
              <img
                src="/src/assets/images/hero_luxury_audio_1790879068988.jpg"
                alt="Veloce Studio Reference Acoustics Setup"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-103"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6">
                <div className="text-white space-y-1">
                  <span className="text-[11px] font-mono tracking-widest uppercase text-neutral-300">
                    Featured Masterpiece
                  </span>
                  <h3 className="text-xl font-display font-semibold">
                    Studio Reference Sound Stage
                  </h3>
                  <p className="text-xs text-neutral-300">
                    Dual bi-amplified ribbon monitors with isolated acoustic dampeners
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
