import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    // Check for mobile device characteristics
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    const isSmallScreen = window.innerWidth < MOBILE_BREAKPOINT
    
    const checkMobile = () => {
      const currentWidth = window.innerWidth
      const currentIsMobile = currentWidth < MOBILE_BREAKPOINT || isMobileDevice
      setIsMobile(currentIsMobile)
    }

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      checkMobile()
    }
    
    mql.addEventListener("change", onChange)
    checkMobile()
    
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
