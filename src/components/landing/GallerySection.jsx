import React from 'react'
import { motion } from 'framer-motion'
import TimelineDemo from '../timeline-demo'

export default function GallerySection() {
  return (
    <section id="fotos" className="py-16 sm:py-24 px-4 sm:px-6 bg-gray-50">
      <div className="container mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl sm:text-4xl font-bold mb-12 text-center"
        >
        </motion.h2>
        <TimelineDemo />
      </div>
    </section>
  )
} 