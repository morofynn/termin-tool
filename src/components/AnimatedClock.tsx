import { motion } from 'framer-motion';

export default function AnimatedClock() {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
      style={{ marginBottom: 'clamp(1rem, 4vw, 1.5rem)' }}
    >
      <style>{`
        @keyframes rotateMinuteHand {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes rotateHourHand {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        .minute-hand {
          transform-origin: 50px 50px;
          animation: rotateMinuteHand 4s linear infinite;
        }
        
        .hour-hand {
          transform-origin: 50px 50px;
          animation: rotateHourHand 2s linear infinite;
        }
      `}</style>
      
      <div style={{
        width: 'clamp(4rem, 15vw, 6rem)',
        height: 'clamp(4rem, 15vw, 6rem)',
        margin: '0 auto',
        background: '#fef3c7',
        borderRadius: '9999px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}>
        {/* Clock Face */}
        <svg 
          width="100%" 
          height="100%" 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          style={{
            maxWidth: 'clamp(2.5rem, 10vw, 3.5rem)',
            maxHeight: 'clamp(2.5rem, 10vw, 3.5rem)'
          }}
        >
          {/* Clock Circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="#ca8a04"
            strokeWidth="3"
            fill="none"
          />
          
          {/* Hour Marks */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
            <line
              key={angle}
              x1="50"
              y1="8"
              x2="50"
              y2="15"
              stroke="#ca8a04"
              strokeWidth="2"
              transform={`rotate(${angle} 50 50)`}
            />
          ))}
          
          {/* Minute Hand */}
          <line
            className="minute-hand"
            x1="50"
            y1="50"
            x2="50"
            y2="15"
            stroke="#ca8a04"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          
          {/* Hour Hand */}
          <line
            className="hour-hand"
            x1="50"
            y1="50"
            x2="50"
            y2="25"
            stroke="#ca8a04"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          
          {/* Center Dot */}
          <circle
            cx="50"
            cy="50"
            r="4"
            fill="#ca8a04"
          />
        </svg>
      </div>
    </motion.div>
  );
}
