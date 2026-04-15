import { motion } from 'motion/react';
import { User, MapPin, Briefcase, Heart } from 'lucide-react';

export function AboutDisplay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="my-2 sm:my-4"
    >
      <div className="border border-[#00ff41] rounded-lg p-4 sm:p-6 bg-[#0f0f0f]">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-lg sm:text-xl mb-3 sm:mb-4 flex items-center gap-2">
            <User size={18} className="sm:w-5 sm:h-5" />
            Frank Emesinwa
          </h2>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-4 text-sm"
        >
          <div className="flex items-start gap-3">
            <Briefcase size={16} className="mt-1 flex-shrink-0" />
            <p>
              Full-Stack Developer specializing in building exceptional digital
              experiences. I create seamless web and mobile applications with a
              focus on performance, scalability, and user experience.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <MapPin size={16} className="mt-1 flex-shrink-0" />
            <p>
              Based in Abuja,Nigeria• Available for remote opportunities
              worldwide
            </p>
          </div>

          <div className="border-t border-[#00ff41] opacity-30 my-4" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-[#00d9ff] mb-2">🎯 Specializations</h3>
              <ul className="space-y-1 text-xs opacity-80">
                <li>• Mobile Development (React Native + Expo)</li>
                <li>• Web Development (Next.js, React)</li>
                <li>• AI Engineering (Vercel AI SDK, LLMs)</li>
                <li>• Backend Engineering (Node.js, Express)</li>
                <li>• Database Design (PostgreSQL, Prisma)</li>
                <li>• UI/UX Design (Figma)</li>
              </ul>
            </div>

            <div>
              <h3 className="text-[#00d9ff] mb-2">💡 Philosophy</h3>
              <p className="text-xs opacity-80">
                I believe in writing clean, maintainable code that solves real
                problems. Always learning, always building, always pushing the
                boundaries of what's possible.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 mt-4">
            <Heart size={16} className="mt-1 flex-shrink-0" />
            <p className="text-xs opacity-80">
              When I'm not coding, you'll find me exploring new technologies,
              contributing to open source, or mentoring aspiring developers.
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
