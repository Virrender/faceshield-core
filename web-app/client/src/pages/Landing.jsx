import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import { Shield, Upload, Cpu, Download, Zap, Scale, Lock, Github, ChevronDown, Eye, EyeOff } from 'lucide-react'

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
}

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

function Landing() {
  return (
    <div className="min-h-screen bg-[#0f0f13]">
      <Header />
      <Hero />
      <ProblemSection />
      <HowItWorks />
      <ScienceSection />
      <ProtectionModes />
      <StatsBar />
      <Footer />
    </div>
  )
}

function Header() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#0f0f13]/90 backdrop-blur-xl border-b border-[#2a2a38]' : ''}`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-[#6c63ff]" />
          <span className="text-lg font-semibold tracking-tight">FaceShield</span>
        </div>
        <div className="flex items-center gap-5 sm:gap-6">
          <Link
            to="/login"
            className="inline-flex items-center justify-center min-w-[140px] sm:min-w-[160px] min-h-[44px] px-7 sm:px-8 py-2.5 text-base font-medium text-[#a1a1aa] hover:text-white border border-[#2a2a38] hover:border-[#6c63ff]/40 rounded-xl transition-colors"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center justify-center min-w-[170px] sm:min-w-[190px] min-h-[44px] px-8 sm:px-9 py-2.5 text-base font-medium bg-[#6c63ff] hover:bg-[#5a52e0] text-white rounded-xl transition-colors"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  )
}

function Hero() {
  const scrollToHowItWorks = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-16 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#6c63ff]/5 via-transparent to-transparent pointer-events-none" />
      
      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#6c63ff]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#43d9ad]/10 rounded-full blur-3xl" />
      
      <motion.div
        className="max-w-4xl mx-auto text-center relative z-10"
        initial="initial"
        animate="animate"
        variants={stagger}
      >
        <motion.div
          variants={fadeInUp}
          className="inline-flex items-center justify-center gap-2 min-w-[300px] sm:min-w-[340px] min-h-[46px] px-10 sm:px-12 py-2.5 rounded-full bg-[#1a1a24] border border-[#2a2a38] text-sm sm:text-base text-[#a1a1aa] text-center whitespace-nowrap mt-24 mb-10"
        >
          <div className="w-2 h-2 rounded-full bg-[#43d9ad] animate-pulse" />
          Privacy-first face protection
        </motion.div>
        
        <motion.h1
          variants={fadeInUp}
          className="text-5xl md:text-7xl font-bold tracking-tight leading-tight mb-6"
        >
          Your face.
          <br />
          <span className="text-[#6c63ff]">Your privacy.</span>
        </motion.h1>
        
        <motion.p
          variants={fadeInUp}
          className="text-xl md:text-2xl text-[#a1a1aa] max-w-2xl mx-auto pt-6 md:pt-8 mb-20 leading-relaxed"
        >
          FaceShield makes you invisible to AI face recognition — while your photo looks completely normal to human eyes.
        </motion.p>
        
        <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-6 w-full max-w-2xl mx-auto px-4 sm:px-0 mt-6">
          <Link
            to="/register"
            className="inline-flex items-center justify-center w-full sm:w-auto sm:min-w-[250px] min-h-[60px] whitespace-nowrap px-8 py-4 text-lg sm:text-xl leading-none font-semibold bg-[#6c63ff] hover:bg-[#5a52e0] text-white rounded-2xl transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-[#6c63ff]/25 text-center"
          >
            Try it free
          </Link>
          <button
            onClick={scrollToHowItWorks}
            className="inline-flex items-center justify-center w-full sm:w-auto sm:min-w-[250px] min-h-[60px] whitespace-nowrap px-8 py-4 text-lg sm:text-xl leading-none font-medium text-[#a1a1aa] hover:text-white border border-[#2a2a38] hover:border-[#6c63ff]/50 rounded-2xl transition-all gap-2 text-center"
          >
            See how it works
          </button>
        </motion.div>

        <motion.button
          type="button"
          onClick={scrollToHowItWorks}
          variants={fadeInUp}
          className="mt-6 mx-auto block text-[#71717a] hover:text-white transition-colors"
          aria-label="Scroll to how it works section"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          >
            <ChevronDown className="w-7 h-7" />
          </motion.div>
        </motion.button>
      </motion.div>
    </section>
  )
}

function ProblemSection() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  })
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0])
  const y = useTransform(scrollYProgress, [0, 0.3], [100, 0])

  return (
    <section ref={ref} className="pt-32 pb-[1cm] px-6 relative">
      <motion.div style={{ opacity, y }} className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-sm font-medium text-[#ff6b6b] uppercase tracking-wider">The Problem</span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">Your face is being tracked</h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-stretch">
          <div className="px-12 py-[0.5cm] bg-[#1a1a24] border border-[#2a2a38] rounded-2xl text-center">
            <div className="m-[0.5cm]">
              <div className="w-12 h-12 rounded-xl bg-[#ff6b6b]/10 flex items-center justify-center mb-6 mx-auto">
                <Eye className="w-6 h-6 text-[#ff6b6b]" />
              </div>
              <h3 className="text-xl font-semibold mb-4 p-0">30 billion photos scraped</h3>
              <p className="text-[#a1a1aa] leading-relaxed px-2 md:px-4 max-w-md mx-auto">
                Companies like Clearview AI have scraped over 30 billion photos from social media platforms without consent, building massive facial recognition databases.
              </p>
            </div>
          </div>
          
          <div className="px-12 py-[0.5cm] bg-[#1a1a24] border border-[#2a2a38] rounded-2xl text-center">
            <div className="m-[0.5cm]">
              <div className="w-12 h-12 rounded-xl bg-[#ffd166]/10 flex items-center justify-center mb-6 mx-auto">
                <EyeOff className="w-6 h-6 text-[#ffd166]" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Identified from a single photo</h3>
              <p className="text-[#a1a1aa] leading-relaxed px-2 md:px-4 max-w-md mx-auto">
                Modern AI can identify anyone from just one photo. Your privacy is at risk every time you share an image online. This is happening right now.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    {
      icon: Upload,
      title: "Upload your photo",
      description: "Drag and drop or select up to 5 photos. We support JPG and PNG formats."
    },
    {
      icon: Cpu,
      title: "AI computes invisible noise",
      description: "Our adversarial ML model generates imperceptible perturbations that fool recognition systems."
    },
    {
      icon: Download,
      title: "Download protected photo",
      description: "Get your cloaked image that looks identical to humans but unrecognizable to AI."
    }
  ]

  return (
    <section id="how-it-works" className="mt-[1cm] py-36 px-6 bg-gradient-to-b from-[#111118] via-[#0f0f13] to-[#101019]">
      <div className="max-w-[96rem] mx-auto">
        <div className="text-center mb-24">
          <span className="inline-block text-lg md:text-xl font-semibold text-[#8f88ff] uppercase tracking-wider">
            How It Works
          </span>
          <h2 className="text-5xl md:text-6xl font-bold mt-6 bg-gradient-to-r from-white via-[#cfcdfd] to-[#a8a3ff] bg-clip-text text-transparent">
            Three simple steps
          </h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 md:gap-10 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-16 left-1/6 right-1/6 h-px bg-gradient-to-r from-transparent via-[#6c63ff]/45 to-transparent" />
          
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
              className={`relative text-center rounded-2xl bg-gradient-to-b from-[#1d1d2a] to-[#171723] border border-[#34344a] shadow-[0_14px_40px_rgba(108,99,255,0.14)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(108,99,255,0.2)] ${index === 0 ? 'px-[1cm] py-[1.1cm]' : 'px-[0.8cm] py-[0.9cm]'}`}
            >
              <div className="w-18 h-18 rounded-2xl bg-gradient-to-br from-[#26263a] to-[#1a1a2b] border border-[#49496a] flex items-center justify-center mx-auto mt-[0.5cm] mb-6 relative z-10 shadow-[0_8px_24px_rgba(108,99,255,0.25)]">
                <step.icon className="w-8 h-8 text-[#8b84ff]" />
              </div>
              <span className="absolute -top-2 -right-2 w-9 h-9 rounded-full bg-gradient-to-br from-[#7d75ff] to-[#5b53de] text-white text-sm font-bold flex items-center justify-center shadow-md">
                {index + 1}
              </span>
              <h3 className="text-2xl font-semibold mb-4 text-[#f4f3ff]">{step.title}</h3>
              <p className={`text-[#b7b7c9] leading-relaxed text-base mx-auto my-2 ${index === 0 ? 'max-w-[30ch] px-2 py-1' : 'max-w-[34ch] py-1'}`}>
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ScienceSection() {
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isAnimating, setIsAnimating] = useState(true)

  // Animated embedding values
  const [embeddings, setEmbeddings] = useState({
    original: Array.from({ length: 8 }, () => Math.random()),
    cloaked: Array.from({ length: 8 }, () => Math.random())
  })

  useEffect(() => {
    if (!isAnimating) return
    const interval = setInterval(() => {
      setEmbeddings({
        original: Array.from({ length: 8 }, () => Math.random()),
        cloaked: Array.from({ length: 8 }, () => Math.random())
      })
    }, 1500)
    return () => clearInterval(interval)
  }, [isAnimating])

  return (
    <section className="py-32 px-6 bg-gradient-to-b from-[#0f0f13] via-[#1a1a24]/50 to-[#0f0f13]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mt-[1cm] mb-16">
          <span className="text-lg md:text-xl font-semibold text-[#43d9ad] uppercase tracking-wider">The Science</span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">Same photo. Different identity.</h2>
          <p className="text-xl text-[#a1a1aa] max-w-2xl mx-auto">
            Drag the slider to reveal the invisible noise pattern that makes AI see a completely different person.
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-12 justify-items-center">
          {/* What humans see */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full max-w-5xl bg-[#1a1a24] border border-[#2a2a38] rounded-2xl p-8"
          >
            <div className="flex items-center justify-center gap-3 mt-3 mb-8 py-2">
              <Eye className="w-7 h-7 text-[#6c63ff]" />
              <span className="text-xl font-semibold">What humans see</span>
            </div>
            
            {/* Image comparison slider */}
            <div 
              className="relative aspect-[16/9] rounded-xl overflow-hidden bg-[#27272a] cursor-ew-resize"
              onMouseDown={() => setIsAnimating(false)}
              onMouseMove={(e) => {
                if (e.buttons === 1) {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const x = ((e.clientX - rect.left) / rect.width) * 100
                  setSliderPosition(Math.max(0, Math.min(100, x)))
                }
              }}
            >
              {/* Original (left side) */}
              <div className="absolute inset-0">
                <img
                  src="/science-original.png"
                  alt="Original face example"
                  className="h-full w-full object-cover"
                />
              </div>
              
              {/* Cloaked (right side) - clipped */}
              <div 
                className="absolute inset-0"
                style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
              >
                <img
                  src="/science-cloaked.png"
                  alt="Cloaked face example"
                  className="h-full w-full object-cover"
                />
              </div>
              
              {/* Slider handle */}
              <div 
                className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center">
                  <div className="flex gap-0.5">
                    <div className="w-0.5 h-4 bg-[#71717a] rounded-full" />
                    <div className="w-0.5 h-4 bg-[#71717a] rounded-full" />
                  </div>
                </div>
              </div>
              
              {/* Labels */}
              <div className="absolute top-4 left-4 px-3 py-1 bg-[#0f0f13]/80 backdrop-blur rounded-lg text-sm">
                Original
              </div>
              <div className="absolute top-4 right-4 px-3 py-1 bg-[#0f0f13]/80 backdrop-blur rounded-lg text-sm">
                Cloaked
              </div>
            </div>
            
            <p className="text-center text-[#c6c4da] text-lg font-medium tracking-wide mt-8 mb-4 py-3">
              Identical to the human eye
            </p>
          </motion.div>
          
          {/* What AI sees */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full max-w-5xl bg-[#1a1a24] border border-[#2a2a38] rounded-2xl px-10 py-7 my-2"
          >
            <div className="flex items-center justify-center gap-3 mt-2 mb-6 py-2">
              <Cpu className="w-7 h-7 text-[#ff6b6b]" />
              <span className="text-xl font-semibold">What AI sees</span>
            </div>
            
            <div className="space-y-5 px-1 md:px-2">
              {/* Original embeddings */}
              <div className="py-1 mx-2 md:mx-4 px-1 md:px-2">
                <div className="flex items-center justify-between mb-2 px-4 md:px-6">
                  <span className="text-base font-medium text-[#b8b8c7]">Original embedding</span>
                  <span className="text-sm text-[#8f8f9b] font-mono">Person A</span>
                </div>
                <div className="flex gap-1 h-14 px-4 md:px-6">
                  {embeddings.original.map((val, i) => (
                    <motion.div
                      key={i}
                      className="flex-1 bg-[#6c63ff] rounded-sm"
                      initial={false}
                      animate={{ height: `${val * 100}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      style={{ alignSelf: 'flex-end' }}
                    />
                  ))}
                </div>
              </div>
              
              {/* Cloaked embeddings */}
              <div className="py-1 mx-2 md:mx-4 px-1 md:px-2">
                <div className="flex items-center justify-between mb-2 px-4 md:px-6">
                  <span className="text-base font-medium text-[#b8b8c7]">Cloaked embedding</span>
                  <span className="text-sm text-[#8f8f9b] font-mono">Person ???</span>
                </div>
                <div className="flex gap-1 h-14 px-4 md:px-6">
                  {embeddings.cloaked.map((val, i) => (
                    <motion.div
                      key={i}
                      className="flex-1 bg-[#43d9ad] rounded-sm"
                      initial={false}
                      animate={{ height: `${val * 100}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      style={{ alignSelf: 'flex-end' }}
                    />
                  ))}
                </div>
              </div>
              
              {/* Similarity indicator */}
              <div className="pt-6 pb-5 mt-2 mb-1 border-t border-[#2a2a38] text-center">
                <div className="flex items-center justify-center gap-3 px-4 md:px-6 py-2">
                  <span className="text-xl md:text-2xl font-semibold text-[#d0cfe2]">Cosine similarity</span>
                  <span className="text-2xl md:text-3xl font-mono text-[#43d9ad]">0.12</span>
                </div>
                <p className="text-base md:text-lg text-[#a8a8ba] mt-3 px-4 md:px-6 py-2">
                  Two completely different identities to AI
                </p>
              </div>
            </div>
          </motion.div>
        </div>
        
        <p className="text-center text-xl font-medium text-[#a1a1aa] mt-16">
          The same photo. <span className="text-white">Two completely different identities</span> to AI.
        </p>
      </div>
    </section>
  )
}

function ProtectionModes() {
  const modes = [
    {
      name: "Quick Cloak",
      icon: Zap,
      time: "~45 sec",
      description: "Fast processing for quick protection when you need it now.",
      features: ["Good protection", "Fast turnaround", "Standard quality"],
      color: "#ffd166"
    },
    {
      name: "Balanced",
      icon: Scale,
      time: "~3 min",
      description: "The perfect balance of speed and protection for everyday use.",
      features: ["Strong protection", "Invisible noise", "Great quality"],
      color: "#6c63ff",
      popular: true
    },
    {
      name: "Max Protection",
      icon: Lock,
      time: "~6 min",
      description: "Maximum identity shift with the best visual quality.",
      features: ["Maximum protection", "Best quality", "Highest identity shift"],
      color: "#43d9ad"
    }
  ]

  return (
    <section className="py-32 px-6 mb-[2.4cm]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-sm font-medium text-[#6c63ff] uppercase tracking-wider">Protection Modes</span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4">Choose your level</h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 sm:gap-7 items-stretch">
          {modes.map((mode, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative px-8 sm:px-10 pt-11 pb-16 sm:pt-12 sm:pb-18 bg-[#1a1a24] border rounded-2xl transition-all h-full flex flex-col items-center text-center my-2 ${mode.popular ? 'border-[#6c63ff]' : 'border-[#2a2a38] hover:border-[#6c63ff]/40'}`}
            >
              {mode.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#6c63ff] text-white text-xs font-medium rounded-full">
                  Most Popular
                </div>
              )}
              
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center mt-2 mb-8"
                style={{ backgroundColor: `${mode.color}15` }}
              >
                <mode.icon className="w-8 h-8" style={{ color: mode.color }} />
              </div>
              
              <h3 className="text-2xl font-semibold mt-1 mb-4">{mode.name}</h3>
              <p className="text-3xl font-bold mb-6" style={{ color: mode.color }}>{mode.time}</p>
              <p className="text-[#b8b8c8] text-base mb-9 leading-relaxed max-w-[30ch]">{mode.description}</p>
              
              <ul className="space-y-4 mt-auto pt-3 pb-[3.2cm] mb-2 w-full max-w-[28ch]">
                {mode.features.map((feature, i) => (
                  <li key={i} className="flex items-center justify-center gap-3 text-base text-[#b8b8c8]">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: mode.color }} />
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function StatsBar() {
  const stats = [
    { value: "> 97%", label: "SSIM visual similarity" },
    { value: "> 80%", label: "Cosine similarity shift" },
    { value: "100%", label: "FaceNet fooled in tests" }
  ]

  return (
    <section className="mt-[2cm] py-16 px-6 bg-[#1a1a24] border-y border-[#2a2a38] relative">
      <div className="max-w-6xl mx-auto relative">
        {/* Desktop connector lines: upper mode cards -> stats */}
        <div className="hidden md:grid md:grid-cols-3 gap-8 absolute left-0 right-0 -top-[2cm] h-[2cm] pointer-events-none">
          {stats.map((_, index) => (
            <div key={`connector-${index}`} className="relative flex justify-center">
              <div className="w-px h-full bg-gradient-to-b from-[#6c63ff]/0 via-[#8b84ff]/80 to-[#6c63ff] shadow-[0_0_14px_rgba(108,99,255,0.55)]" />
              <div className="absolute -top-1 w-2.5 h-2.5 rounded-full bg-[#8b84ff] shadow-[0_0_12px_rgba(139,132,255,0.85)]" />
              <div className="absolute -bottom-1 w-3 h-3 rounded-full bg-[#6c63ff] shadow-[0_0_14px_rgba(108,99,255,0.9)]" />
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-bold text-[#6c63ff] mb-2">{stat.value}</div>
              <div className="text-[#a1a1aa] text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="py-12 px-6 border-t border-[#2a2a38]">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#6c63ff]" />
          <span className="font-semibold">FaceShield</span>
        </div>
        
        <div className="flex items-center gap-6 text-sm text-[#71717a]">
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <a href="#" className="hover:text-white transition-colors flex items-center gap-2">
            <Github className="w-4 h-4" />
            GitHub
          </a>
        </div>
        
        <div className="text-sm text-[#71717a]">
          Built with adversarial ML
        </div>
      </div>
    </footer>
  )
}

export default Landing
