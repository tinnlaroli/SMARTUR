'use client'
import { useScroll, useTransform, motion } from 'motion/react'
import React, { useEffect, useRef, useState } from 'react'

export const Timeline = ({ data }) => {
  const ref = useRef(null)
  const containerRef = useRef(null)
  const [height, setHeight] = useState(0)

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      setHeight(rect.height)
    }
  }, [ref])

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 10%', 'end 50%'],
  })

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height])
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1])

  return (
    <div
      className="w-full bg-white font-sans md:px-10" // Fondo claro, sin dark mode
      ref={containerRef}
    >
      {/* Eliminado el encabezado y subtítulo */}
      <div ref={ref} className="relative max-w-7xl mx-auto pb-20">
        {data.map((item, index) => (
          <motion.div
            key={index}
            className="flex justify-start pt-10 md:pt-40 md:gap-10"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, delay: index * 0.25 }}
          >
            <div className="sticky flex flex-col md:flex-row z-40 items-center top-40 self-start max-w-xs lg:max-w-sm md:w-full">
              <div className="h-10 absolute left-3 md:left-3 w-10 rounded-full bg-white flex items-center justify-center">
                <div className="h-4 w-4 rounded-full bg-neutral-200 border border-neutral-300 p-2" />
              </div>
              <h3 className="hidden md:block text-xl md:pl-20 md:text-5xl font-bold text-purple">
                {item.title}
              </h3>
            </div>

            <div className="relative pl-20 pr-4 md:pl-4 w-full">
              <h3 className="md:hidden block text-2xl mb-4 text-left font-bold text-purple">
                {item.title}
              </h3>
              {item.content}{' '}
            </div>
          </motion.div>
        ))}
        <div
          style={{
            height: height + 'px',
          }}
          className="absolute md:left-8 left-8 top-0 overflow-hidden w-[8px] [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)]"
        >
          <motion.div
            style={{
              height: heightTransform,
              opacity: opacityTransform,
            }}
            className="absolute inset-x-0 top-0 w-full bg-gradient-to-b from-white via-purple-400 via-60% to-blue-500 to-90% rounded-full shadow-[0_0_32px_8px_rgba(124,58,237,0.25)] blur-[0.5px]"
          >
            {/* Glow animado en la punta */}
            <motion.div
              style={{
                top: heightTransform,
                opacity: opacityTransform,
                translateY: '-50%',
              }}
              animate={{
                scale: [1, 1.25, 1],
                boxShadow: [
                  '0 0 32px 8px rgba(124,58,237,0.5), 0 0 0 0 rgba(255,255,255,0.7)',
                  '0 0 48px 16px rgba(124,58,237,0.7), 0 0 16px 8px rgba(255,255,255,0.8)',
                  '0 0 32px 8px rgba(124,58,237,0.5), 0 0 0 0 rgba(255,255,255,0.7)',
                ],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: 'loop',
                ease: 'easeInOut',
              }}
              className="absolute left-1/2 -translate-x-1/2 w-10 h-10 bg-white/80 rounded-full blur-2xl"
            />
          </motion.div>
        </div>
      </div>
    </div>
  )
}
