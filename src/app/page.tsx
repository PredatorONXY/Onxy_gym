"use client";

import React, { useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dumbbell, 
  Users, 
  Heart, 
  Calendar,
  Mail,
  Phone,
  CheckCircle,
  Star,
  ArrowRight,
  Play
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Enhanced Parallax Section Component
const ParallaxSection = ({
  imageSrc,
  speed = 0.5,
  children,
  className = "",
  height = "100vh",
  overlayOpacity = 0.7,
  blurEffect = false,
  zoomEffect = false
}: {
  imageSrc: string;
  speed?: number;
  children?: React.ReactNode;
  className?: string;
  height?: string;
  overlayOpacity?: number;
  blurEffect?: boolean;
  zoomEffect?: boolean;
}) => {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -500 * speed]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1.05, 1.1]);
  const blur = useTransform(scrollYProgress, [0, 1], [0, 5]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [1, 0.9, 0.9, 1]);

  return (
    <section className={`relative overflow-hidden ${className}`} style={{ height }}>
      <motion.div
        style={{ 
          y, 
          scale: zoomEffect ? scale : 1,
          filter: blurEffect ? `blur(${blur}px)` : 'none',
          opacity 
        }}
        className="absolute inset-0 z-0"
      >
        <Image
          src={imageSrc}
          alt="Parallax background"
          fill
          className="object-cover"
          priority
        />
        <motion.div 
          className="absolute inset-0"
          style={{ 
            background: `linear-gradient(to bottom, 
              rgba(0,0,0,${overlayOpacity}), 
              rgba(0,0,0,${overlayOpacity * 0.8}), 
              rgba(0,0,0,${overlayOpacity}))`
          }}
        />
      </motion.div>
      <div className="relative z-10 h-full flex items-center justify-center">
        {children}
      </div>
    </section>
  );
};

export default function HarryPortfolio() {
  const router = useRouter();
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // Services
  const services = [
    {
      icon: <Dumbbell className="w-8 h-8" />,
      title: "Personal Training",
      description: "One-on-one sessions tailored to your specific goals and fitness level.",
      price: "From $80/session",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Group Fitness Classes",
      description: "High-energy group sessions including HIIT, strength, and functional training.",
      price: "From $25/class",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Nutrition Coaching",
      description: "Personalized meal plans and nutritional guidance for optimal results.",
      price: "From $150/month",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: "Online Coaching",
      description: "Remote training programs with weekly check-ins and progress tracking.",
      price: "From $200/month",
      color: "from-orange-500 to-red-500"
    }
  ];

  // Certifications
  const certifications = [
    "NASM Certified Personal Trainer",
    "Precision Nutrition Certified Coach",
    "CrossFit Level 2 Trainer",
    "Functional Movement Screen Certified",
    "CPR/AED Certified"
  ];

  // Testimonials
  const testimonials = [
    {
      name: "Sarah Mitchell",
      role: "Weight Loss Client",
      content: "Harry helped me lose 45 pounds in 8 months! His personalized approach and constant motivation made all the difference. I'm stronger and more confident than ever!",
      rating: 5
    },
    {
      name: "Mike Rodriguez",
      role: "Strength Training Client",
      content: "I've been training with Harry for 2 years. He helped me increase my deadlift from 225 to 405 lbs while staying injury-free. Best investment I've made in my health!",
      rating: 5
    },
    {
      name: "Emma Thompson",
      role: "Postpartum Fitness Client",
      content: "Harry's understanding and expertise helped me safely regain my strength after pregnancy. His nutrition guidance was invaluable. I feel better than pre-baby!",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen text-white bg-gray-950 overflow-x-hidden">
      {/* Hero Section */}
      <ParallaxSection
        imageSrc="/img_proj/parallax_pic/gym_background.jpg"
        speed={0.5}
        height="h-[70vh] md:h-[90vh] lg:h-[100vh]"
        className="items-center"
        zoomEffect={true}
        blurEffect={true}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 flex flex-col lg:flex-row gap-8 md:gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="space-y-8 w-full lg:w-1/2"
          >
            <div>
              <h1 className="text-3xl md:text-5xl lg:text-7xl font-extrabold mb-4 leading-tight text-center lg:text-left">
                <span className="bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
                  Harry
                </span>
                <br />
                <span className="text-3xl md:text-4xl text-gray-300 font-semibold">
                  Your Personal Fitness Coach
                </span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-6 font-medium text-center lg:text-left">
                Transform your body, transform your life. 8+ years of experience and proven results.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 justify-center lg:justify-start">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>NASM Certified Personal Trainer</span>
              </div>
              <div className="flex items-center space-x-2 justify-center lg:justify-start">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>500+ Successful Transformations</span>
              </div>
              <div className="flex items-center space-x-2 justify-center lg:justify-start">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>Science-Based Training Methods</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 pt-2 justify-center lg:justify-start">
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg font-bold rounded-full shadow-lg"
                onClick={() => router.push('/auth/register')}
              >
                Book Free Consultation
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-purple-500 text-purple-400 hover:bg-purple-500/10 px-8 py-4 text-lg font-bold rounded-full"
                onClick={() => setIsVideoPlaying(true)}
              >
                <Play className="mr-2 w-5 h-5" />
                Watch My Story
              </Button>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            className="relative w-full lg:w-1/2"
          >
            <div className="relative w-full aspect-square max-w-xs sm:max-w-md mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-3xl opacity-30" />
              <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-purple-500/50">
                <Image
                  src="/img_proj/harry_pic/first_img.jpg"
                  alt="Harry - Personal Trainer"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </motion.div>
        </div>
      </ParallaxSection>

      {/* About Section */}
      <ParallaxSection
        imageSrc="/img_proj/parallax_pic/exercise_weights.jpg"
        speed={0.4}
        height="h-[70vh] md:h-[90vh] lg:h-[100vh]"
        className="items-center"
      >
        <section id="about" className="w-full py-12 md:py-24 px-4 sm:px-6 md:px-8 bg-black/70 rounded-xl shadow-xl">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 items-center px-2">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="relative w-full aspect-square max-w-xs sm:max-w-md mx-auto mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur-3xl opacity-30" />
                <div className="relative w-full h-full rounded-lg overflow-hidden border-4 border-purple-500/50">
                  <Image
                    src="/img_proj/harry_pic/Secon_img.jpg"
                    alt="Harry in action"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-5xl font-extrabold mb-4 text-center lg:text-left">
                About <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Harry</span>
              </h2>
              <h3 className="text-2xl font-bold mb-4 text-center lg:text-left">My Mission</h3>
              <p className="text-gray-300 mb-6 leading-relaxed text-lg max-w-screen-sm mx-auto lg:mx-0 text-center lg:text-left">
                I believe that fitness is not just about looking good, but about feeling confident, strong, and capable in every aspect of life. My approach combines evidence-based training methods with personalized nutrition coaching to deliver sustainable results.
              </p>
              <div className="space-y-2 flex flex-col">
                <h4 className="text-xl font-semibold mb-2 text-center lg:text-left">Certifications</h4>
                {certifications.map((cert, index) => (
                  <div key={index} className="flex items-center space-x-3 justify-center lg:justify-start">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-gray-300">{cert}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      </ParallaxSection>

      {/* Services Section */}
      <ParallaxSection
        imageSrc="/img_proj/parallax_pic/boxeritems.jpg"
        speed={0.4}
        height="h-[70vh] md:h-[90vh] lg:h-[100vh]"
        className="items-center"
      >
        <section id="services" className="w-full py-12 md:py-24 px-4 sm:px-6 md:px-8 bg-black/70 rounded-xl shadow-xl">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
                My <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Services</span>
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Choose from a range of personalized services designed to meet your unique fitness needs.
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {services.map((service, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="bg-gray-800/70 border-gray-700 hover:border-purple-500/50 transition-all duration-300 h-full shadow-lg">
                    <CardContent className="p-6 flex flex-col h-full">
                      <div className={`w-16 h-16 bg-gradient-to-r ${service.color} rounded-lg flex items-center justify-center mb-4`}>
                        {service.icon}
                      </div>
                      <h3 className="text-xl font-bold mb-2">{service.title}</h3>
                      <p className="text-gray-400 mb-4 flex-grow">{service.description}</p>
                      <p className="text-purple-400 font-semibold">{service.price}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </ParallaxSection>

      {/* Testimonials Section */}
      <ParallaxSection
        imageSrc="/img_proj/parallax_pic/gym_background.jpg"
        speed={0.3}
        height="h-[70vh] md:h-[90vh] lg:h-[100vh]"
        className="items-center"
      >
        <section id="testimonials" className="w-full py-12 md:py-24 px-4 sm:px-6 md:px-8 bg-black/70 rounded-xl shadow-xl">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
                Client <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Success Stories</span>
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Real results from real people who trusted me with their fitness journey.
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="bg-gray-800/70 border-gray-700 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex mb-4">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <p className="text-gray-300 mb-4 italic">"{testimonial.content}"</p>
                      <div>
                        <p className="font-semibold">{testimonial.name}</p>
                        <p className="text-sm text-gray-400">{testimonial.role}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </ParallaxSection>

      {/* Contact Section */}
      <ParallaxSection
        imageSrc="/img_proj/parallax_pic/smoke.jpg"
        speed={0.2}
        height="h-[60vh] md:h-[80vh]"
        className="items-center"
      >
        <section id="contact" className="w-full py-12 md:py-20 px-4 sm:px-6 md:px-8 bg-black/70 rounded-xl shadow-xl">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
              Contact <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Harry</span>
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Ready to start your journey? Reach out for a free consultation!
            </p>
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-purple-400" />
                <span>harry@fitness.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-purple-400" />
                <span>+1 234 567 8901</span>
              </div>
            </div>
          </div>
        </section>
      </ParallaxSection>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 border-t border-gray-800">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-400 mb-4">
            © 2024 Harry Fitness. Transform your body, transform your life.
          </p>
          <p className="text-sm text-gray-500">
            Personal Trainer | Nutrition Coach | Fitness Expert
          </p>
        </div>
      </footer>

      {/* Video Modal */}
      {isVideoPlaying && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setIsVideoPlaying(false)}
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
            className="relative w-full max-w-4xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
              <p className="text-2xl text-gray-400">Harry's Training Philosophy Video</p>
            </div>
            <button
              className="absolute top-4 right-4 text-white hover:text-gray-300"
              onClick={() => setIsVideoPlaying(false)}
            >
              ✕
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
