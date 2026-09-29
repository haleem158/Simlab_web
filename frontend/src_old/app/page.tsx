// frontend/src/app/page.tsx
'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { BarChart3, TrendingUp, Calendar, ArrowRight, Github } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Hero Section - Split Screen */}
      <HeroSection />
      
      {/* Statistics Section */}
      <StatisticsSection />
      
      {/* Problem Statement */}
      <ProblemSection />
      
      {/* Simulators Grid */}
      <SimulatorsSection />
      
      {/* Features */}
      <FeaturesSection />
      
      {/* Footer */}
      <Footer />
    </div>
  );
}

function HeroSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      if (!canvas || !ctx) return;
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle system representing token flow
    class Particle {
      x: number;
      y: number;
      angle: number;
      radius: number;
      speed: number;
      opacity: number;
      phase: number;

      constructor(centerX: number, centerY: number, radius: number) {
        this.angle = Math.random() * Math.PI * 2;
        this.radius = radius;
        this.speed = 0.0005 + Math.random() * 0.001;
        this.opacity = 0.3 + Math.random() * 0.4;
        this.phase = Math.random() * Math.PI * 2;
        this.x = centerX + Math.cos(this.angle) * this.radius;
        this.y = centerY + Math.sin(this.angle) * this.radius;
      }

      update(centerX: number, centerY: number, time: number) {
        // Circular orbit with subtle perturbation
        this.angle += this.speed;
        const perturbation = Math.sin(time * 0.001 + this.phase) * 5;
        this.x = centerX + Math.cos(this.angle) * (this.radius + perturbation);
        this.y = centerY + Math.sin(this.angle) * (this.radius + perturbation);
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = `rgba(59, 130, 246, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Create particle systems (supply, demand, incentive loops)
    const centerX = canvas.offsetWidth / 2;
    const centerY = canvas.offsetHeight / 2;
    
    const supplyRing = Array.from({ length: 40 }, () => new Particle(centerX, centerY, 80));
    const demandRing = Array.from({ length: 35 }, () => new Particle(centerX, centerY, 140));
    const incentiveRing = Array.from({ length: 30 }, () => new Particle(centerX, centerY, 200));

    let time = 0;
    let animationId: number;

    function animate() {
      if (!ctx || !canvas) return;
      
      ctx.fillStyle = 'rgba(2, 6, 23, 0.1)';
      ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      time += 16;

      // Draw connecting lines between rings (flow representation)
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.1)';
      ctx.lineWidth = 1;
      
      for (let i = 0; i < supplyRing.length; i += 4) {
        const supply = supplyRing[i];
        const demand = demandRing[Math.floor(i * demandRing.length / supplyRing.length)];
        ctx.beginPath();
        ctx.moveTo(supply.x, supply.y);
        ctx.lineTo(demand.x, demand.y);
        ctx.stroke();
      }

      // Update and draw particles
      [...supplyRing, ...demandRing, ...incentiveRing].forEach(particle => {
        particle.update(centerX, centerY, time);
        particle.draw(ctx);
      });

      // Draw central equilibrium point
      const pulse = Math.sin(time * 0.002) * 0.3 + 0.7;
      ctx.fillStyle = `rgba(59, 130, 246, ${pulse * 0.5})`;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
      ctx.fill();

      // Draw ring outlines
      [80, 140, 200].forEach((radius, idx) => {
        ctx.strokeStyle = `rgba(59, 130, 246, ${0.15 - idx * 0.03})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
      });

      animationId = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <section className="relative min-h-screen flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Narrative */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              Evidence-Based Token Design
            </div>

            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              Design Token Economies
              <span className="block text-blue-400 mt-2">That Last</span>
            </h1>

            <p className="text-xl text-slate-300 leading-relaxed">
              Most protocols fail not from technology, but from broken incentives. 
              SIMLAB helps you model supply, demand, and participant behavior before 
              deployment — turning guesswork into evidence-based design.
            </p>

            <div className="space-y-4 text-slate-400">
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2"></div>
                <p>Test "what-if" scenarios across years of token emission</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2"></div>
                <p>Stress-test staking rewards, burns, and vesting schedules</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2"></div>
                <p>Avoid the $790M+ lost annually to poor tokenomics</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                href="/token-supply"
                className="group inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold transition-all transform hover:scale-105"
              >
                Start Simulation
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <a
                href="#problem"
                className="inline-flex items-center justify-center gap-2 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white px-8 py-4 rounded-lg font-semibold transition-all"
              >
                Learn Why It Matters
              </a>
            </div>
          </div>

          {/* Right Side - Dynamic Visual */}
          <div className="relative">
            <canvas
              ref={canvasRef}
              className="w-full h-[500px] rounded-2xl"
              style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
            />
            
            {/* Legend Overlay */}
            <div className="absolute bottom-8 left-8 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <div className="w-3 h-3 rounded-full bg-blue-400/80"></div>
                <span>Supply Flow</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <div className="w-3 h-3 rounded-full bg-blue-400/50"></div>
                <span>Demand Signals</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <div className="w-3 h-3 rounded-full bg-blue-400/30"></div>
                <span>Incentive Loops</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatisticsSection() {
  const statsRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated.current) {
            hasAnimated.current = true;
            animateCounters();
          }
        });
      },
      { threshold: 0.3 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, []);

  function animateCounters() {
    const counters = document.querySelectorAll('[data-count]');
    
    counters.forEach((counter) => {
      const target = parseInt(counter.getAttribute('data-count') || '0');
      const duration = parseInt(counter.getAttribute('data-duration') || '2000');
      const suffix = counter.getAttribute('data-suffix') || '';
      
      let startTime: number | null = null;
      
      function easeOutQuart(t: number): number {
        return 1 - Math.pow(1 - t, 4);
      }
      
      function updateCounter(currentTime: number) {
        if (!startTime) startTime = currentTime;
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const currentValue = Math.floor(easeOutQuart(progress) * target);
        
        // Format with commas
        const formatted = currentValue.toLocaleString();
        counter.textContent = formatted + suffix;
        
        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        }
      }
      
      requestAnimationFrame(updateCounter);
    });
  }

  return (
    <section ref={statsRef} className="py-24 bg-slate-900/50 border-y border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">The Token Economy Crisis</h2>
          <p className="text-slate-400 text-lg">Real numbers from protocol failures</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
            <div className="text-5xl font-bold text-red-400 mb-2">
              <span data-count="90" data-duration="2000" data-suffix="%">0%</span>
            </div>
            <p className="text-slate-300 font-semibold mb-2">Startup Failure Rate</p>
            <p className="text-slate-500 text-sm">Poor tokenomics is a leading cause</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
            <div className="text-5xl font-bold text-red-400 mb-2">
              <span data-count="4000" data-duration="2500" data-suffix="+">0+</span>
            </div>
            <p className="text-slate-300 font-semibold mb-2">Dead Coins Tracked</p>
            <p className="text-slate-500 text-sm">65% from broken incentive models</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
            <div className="text-5xl font-bold text-red-400 mb-2">
              $<span data-count="790" data-duration="2000" data-suffix="M">0M</span>
            </div>
            <p className="text-slate-300 font-semibold mb-2">Lost in 2022 Alone</p>
            <p className="text-slate-500 text-sm">From tokenomics-related failures</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProblemSection() {
  return (
    <section id="problem" className="py-24 bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold mb-8 text-center">Why Protocols Fail</h2>
        
        <div className="space-y-6 text-lg text-slate-300 leading-relaxed">
          <p>
            Token economies are <span className="text-blue-400 font-semibold">complex, non-deterministic systems</span> where 
            supply, demand, user behavior, and governance interact dynamically.
          </p>
          
          <p>
            Most founders launch with assumptions that collapse under real-world stress:
          </p>

          <div className="grid md:grid-cols-2 gap-6 my-8">
            <div className="bg-slate-900 border border-red-900/30 rounded-xl p-6">
              <h3 className="text-red-400 font-semibold mb-3">❌ Misaligned Incentives</h3>
              <p className="text-slate-400 text-base">
                Unsustainable yields attract mercenary capital. Teams and VCs dump at unlock.
              </p>
            </div>

            <div className="bg-slate-900 border border-red-900/30 rounded-xl p-6">
              <h3 className="text-red-400 font-semibold mb-3">❌ Hyperinflation</h3>
              <p className="text-slate-400 text-base">
                Excessive emissions and farming rewards create runaway supply growth.
              </p>
            </div>

            <div className="bg-slate-900 border border-red-900/30 rounded-xl p-6">
              <h3 className="text-red-400 font-semibold mb-3">❌ Broken Token Design</h3>
              <p className="text-slate-400 text-base">
                No utility, weak burns, over-reliance on airdrops create boom-bust cycles.
              </p>
            </div>

            <div className="bg-slate-900 border border-red-900/30 rounded-xl p-6">
              <h3 className="text-red-400 font-semibold mb-3">❌ No Stress Testing</h3>
              <p className="text-slate-400 text-base">
                Founders don't model edge cases or test sustainability under different scenarios.
              </p>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-8 text-center">
            <p className="text-xl font-semibold text-blue-400 mb-2">
              The Solution: Model Before You Deploy
            </p>
            <p className="text-slate-300">
              SIMLAB turns complex token dynamics into testable, visual simulations — 
              so you can design for sustainability, not speculation.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function SimulatorsSection() {
  return (
    <section className="py-24 bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Three Core Simulators</h2>
          <p className="text-slate-400 text-lg">
            Model every critical dimension of your token economy
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Link href="/token-supply" className="group">
            <div className="bg-slate-950 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-8 transition-all duration-300 h-full">
              <div className="bg-blue-500/10 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-7 h-7 text-blue-400" />
              </div>
              
              <h3 className="text-2xl font-bold mb-4 group-hover:text-blue-400 transition-colors">
                Token Supply Simulator
              </h3>
              
              <p className="text-slate-400 mb-6 leading-relaxed">
                Model inflation, staking, burning, and vesting over time. Run Monte Carlo 
                simulations to test supply stability under uncertainty.
              </p>

              <ul className="space-y-2 text-sm text-slate-500">
                <li>• Emission schedules & decay rates</li>
                <li>• Staking participation curves</li>
                <li>• Burn mechanism modeling</li>
                <li>• Price impact estimation</li>
              </ul>

              <div className="mt-8 flex items-center text-blue-400 font-semibold group-hover:gap-3 gap-2 transition-all">
                Open Simulator
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          </Link>

          <Link href="/vesting" className="group">
            <div className="bg-slate-950 border border-slate-800 hover:border-green-500/50 rounded-2xl p-8 transition-all duration-300 h-full">
              <div className="bg-green-500/10 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Calendar className="w-7 h-7 text-green-400" />
              </div>
              
              <h3 className="text-2xl font-bold mb-4 group-hover:text-green-400 transition-colors">
                Vesting Simulator
              </h3>
              
              <p className="text-slate-400 mb-6 leading-relaxed">
                Visualize token unlocks for team, investors, and community. Test cliff 
                schedules and governance locks to prevent sell pressure.
              </p>

              <ul className="space-y-2 text-sm text-slate-500">
                <li>• Multi-stakeholder allocations</li>
                <li>• Cliff & linear vesting curves</li>
                <li>• Governance vs. liquid splits</li>
                <li>• Monthly inflation tracking</li>
              </ul>

              <div className="mt-8 flex items-center text-green-400 font-semibold group-hover:gap-3 gap-2 transition-all">
                Open Simulator
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          </Link>

          <Link href="/token-impact" className="group">
            <div className="bg-slate-950 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-8 transition-all duration-300 h-full">
              <div className="bg-purple-500/10 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-7 h-7 text-purple-400" />
              </div>
              
              <h3 className="text-2xl font-bold mb-4 group-hover:text-purple-400 transition-colors">
                Price Impact Model
              </h3>
              
              <p className="text-slate-400 mb-6 leading-relaxed">
                Estimate how demand growth and supply changes affect token price. 
                Calibrate models to real market data.
              </p>

              <ul className="space-y-2 text-sm text-slate-500">
                <li>• Demand vs. supply dynamics</li>
                <li>• Transaction & staking growth</li>
                <li>• Price sensitivity analysis</li>
                <li>• CSV data import</li>
              </ul>

              <div className="mt-8 flex items-center text-purple-400 font-semibold group-hover:gap-3 gap-2 transition-all">
                Open Simulator
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section className="py-24 bg-slate-950 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold mb-12 text-center">Built for Serious Teams</h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center p-6">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-bold mb-2">Visual Analytics</h3>
            <p className="text-slate-400 text-sm">
              Interactive charts showing supply curves, inflation rates, and price trajectories
            </p>
          </div>

          <div className="text-center p-6">
            <div className="text-3xl mb-3">🎲</div>
            <h3 className="font-bold mb-2">Monte Carlo Simulation</h3>
            <p className="text-slate-400 text-sm">
              Run stochastic models with confidence intervals for uncertainty analysis
            </p>
          </div>

          <div className="text-center p-6">
            <div className="text-3xl mb-3">📥</div>
            <h3 className="font-bold mb-2">CSV Import/Export</h3>
            <p className="text-slate-400 text-sm">
              Upload your own data or download results for deeper analysis
            </p>
          </div>

          <div className="text-center p-6">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="font-bold mb-2">Preset Scenarios</h3>
            <p className="text-slate-400 text-sm">
              Start with Bitcoin, Ethereum, or DeFi templates and customize
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-lg">SIMLAB</div>
              <div className="text-slate-500 text-sm">Evidence-Based Token Design</div>
            </div>
          </div>

          <div className="flex gap-6 text-slate-400">
            <a href="https://github.com" className="hover:text-white transition-colors">
              <Github className="w-5 h-5" />
            </a>
            <a href= {`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/docs`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors text-sm">
              API Docs
            </a>
            <a href="#" className="hover:text-white transition-colors text-sm">
              Documentation
            </a>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-800 text-center text-slate-500 text-sm">
          <p>© 2025 SIMLAB. Empowering data-driven token design.</p>
          <p className="mt-2">Built with Next.js, FastAPI, and modern Web3 economics principles.</p>
        </div>
      </div>
    </footer>
  );
}