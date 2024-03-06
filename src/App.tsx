import React, { useEffect } from 'react'
import { useSpring, animated } from '@react-spring/web'
import { createUseGesture, dragAction, pinchAction } from '@use-gesture/react'
import { useBreakpointValue } from '@chakra-ui/react';

import './styles.module.css'

const useGesture = createUseGesture([dragAction, pinchAction])
function useIsMobile() {
  return useBreakpointValue({ base: true, sm: false, md: false, lg: false, xl: false });
}

export default function App() {
  const isMobile = useIsMobile();
  useEffect(() => {
    const handler = (e: Event) => e.preventDefault()
    document.addEventListener('gesturestart', handler)
    document.addEventListener('gesturechange', handler)
    document.addEventListener('gestureend', handler)
    return () => {
      document.removeEventListener('gesturestart', handler)
      document.removeEventListener('gesturechange', handler)
      document.removeEventListener('gestureend', handler)
    }
  }, [])

  const [style, api] = useSpring(() => ({
    x: 0,
    y: 0,
    scale: 1,
    rotateZ: 0,
  }))
  const ref = React.useRef<HTMLDivElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = React.useState({});
  const [maxScale, setMaxScale] = React.useState(2);

  const onImgLoad = ({ target: img }) => {
    // ref?.current.style.height = img.naturalHeight;
    // ref?.current.style.width = img.naturalWidth;
    setDimensions({
      imgHeight: img.naturalHeight,
      imgWidth: img.naturalWidth,
      divHeight: contentRef.current.clientHeight,
      divWidth: contentRef.current.clientWidth,
    });
    if (img.naturalWidth >= 1024) {
      setMaxScale(10);
    } else {
      setMaxScale(3);
    }
  };

  useEffect(() => {
    if (isMobile) {
      const scaledX = (0 - window.innerWidth) / 1.5;
      const scaledY = (0 - window.innerHeight) / 2.5;
      api.start({ x: scaledX, y: scaledY });
      api.start({ scale: 0.4 });
    } else {
      api.start({ scale: 1, x: 0, y: 0 });
    }
  }, [isMobile, api]);
  useGesture(
    {
      // onHover: ({ active, event }) => console.log('hover', event, active),
      // onMove: ({ event }) => console.log('move', event),
      onDrag: ({ pinching, cancel, offset: [x, y], ...rest }) => {
        if (pinching) return cancel()
        api.start({ x, y })
      },
      onPinch: ({ origin: [ox, oy], first, movement: [ms], offset: [s, a], memo }) => {
        if (first) {
          const { width, height, x, y } = ref.current!.getBoundingClientRect()
          const tx = ox - (x + width / 2)
          const ty = oy - (y + height / 2)
          memo = [style.x.get(), style.y.get(), tx, ty]
        }

        const x = memo[0] - (ms - 1) * memo[2]
        const y = memo[1] - (ms - 1) * memo[3]
        api.start({ scale: s, x, y})
        return memo
      },
    },
    {
      target: ref,
      drag: { from: () => [style.x.get(), style.y.get()] },
      pinch: { scaleBounds: { min: 0.5, max: maxScale }, rubberband: true },
    }
  )

  return (
    <div>
      <h1>Layout</h1>
      <div className={`canvas`}>
        
        <animated.div className={"container"} ref={ref} style={style}>
          <div className='content' ref={contentRef}>
            <img onLoad={onImgLoad} draggable={false}  
            src={require("./paulding-county.png")}
            />
          </div>
        </animated.div>

      </div>
    </div>
  )
}
