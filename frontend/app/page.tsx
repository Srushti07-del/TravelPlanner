import Link from "next/link";
import { ArrowRight, Map, Sun, Wallet, MessageSquare, Compass, Share2 } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 pt-24 pb-32">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-purple-600/20 to-pink-500/20"></div>
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3">
          <div className="w-96 h-96 bg-primary/30 rounded-full blur-3xl"></div>
        </div>
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3">
          <div className="w-96 h-96 bg-secondary/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/90 text-sm mb-8 backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-secondary"></span>
            Adaptive AI Planning is now live
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-8">
            Your plan should follow <br className="hidden md:block"/> your trip.
          </h1>
          <p className="mt-4 text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto mb-10">
            Create highly personalized itineraries in seconds. When things change, our AI adapts your plan in real-time.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link href="/plan" className="px-8 py-4 bg-white text-slate-900 font-bold rounded-full hover:bg-slate-100 transition-all shadow-lg hover:shadow-xl flex items-center gap-2">
              Start Planning <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="#how-it-works" className="px-8 py-4 bg-white/10 text-white font-medium rounded-full hover:bg-white/20 transition-all backdrop-blur-sm border border-white/10">
              See How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Three steps to your perfect trip</h2>
            <p className="mt-4 text-lg text-slate-600">Planning a trip has never been this effortless.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { step: '1', title: 'Tell us your dreams', desc: 'Share your destination, dates, budget, and interests. We handle the complex logistics.' },
              { step: '2', title: 'Get an AI itinerary', desc: 'Receive a personalized, minute-by-minute plan optimized for routes, weather, and budget.' },
              { step: '3', title: 'Adapt on the go', desc: 'Train delayed? Raining? Just tell the AI and it will instantly replan your day.' }
            ].map((s, i) => (
              <div key={i} className="relative group">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-bold text-2xl mb-6 group-hover:scale-110 transition-transform">
                  {s.step}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{s.title}</h3>
                <p className="text-slate-600">{s.desc}</p>
                {i < 2 && <div className="hidden md:block absolute top-8 left-[calc(100%-2rem)] w-[calc(100%-4rem)] h-0.5 bg-slate-200" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Packed with superpower features</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Compass, title: 'Adaptive Replanning', desc: 'Plans adapt instantly to weather changes, delays, or just a change of heart.' },
              { icon: Wallet, title: 'Smart Budget Control', desc: 'Track spending visually and ask AI to adjust activities to fit your remaining budget.' },
              { icon: Map, title: 'Route Optimization', desc: 'Minimize travel time between locations with smart clustering.' },
              { icon: Sun, title: 'Weather Aware', desc: 'Automatically swaps outdoor activities for indoor ones if rain is forecasted.' },
              { icon: MessageSquare, title: 'Conversational AI', desc: 'Chat naturally with your assistant. "Find me a vegan place nearby" or "Make tomorrow more relaxing".' },
              { icon: Share2, title: 'Collaborate & Share', desc: 'Share your beautiful interactive itinerary with friends and family.' }
            ].map((f, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
                <p className="text-slate-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-primary text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-4xl font-bold mb-6">Ready for your next adventure?</h2>
          <p className="text-xl text-primary-100 mb-10">Join thousands of travelers who have upgraded their travel experience.</p>
          <Link href="/plan" className="px-8 py-4 bg-white text-primary font-bold rounded-full hover:bg-slate-100 transition-all shadow-lg text-lg">
            Plan a Trip for Free
          </Link>
        </div>
      </section>
    </div>
  );
}
