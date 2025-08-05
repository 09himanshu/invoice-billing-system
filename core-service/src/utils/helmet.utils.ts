export const helmetUtils = {
  development: {
    // Disable HSTS in development (since we're using HTTP)
    hsts: false,

    // Relaxed Content Security Policy for development
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
        imgSrc: ["'self'", "data:", "https:", "http://localhost:*"],
        scriptSrc: ["'self'", "'unsafe-eval'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        connectSrc: ["'self'", "http://localhost:*", "ws://localhost:*", "wss://localhost:*"],
        frameSrc: ["'self'"],
        objectSrc: ["'none'"],
        // Allow upgrade to HTTPS but don't enforce it
        upgradeInsecureRequests: [],
      },
      // Report violations in console instead of blocking
      reportOnly: false,
    },

    // More permissive cross-origin policies for development
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },

    // Keep other security headers
    referrerPolicy: { policy: "origin-when-cross-origin" },
    hidePoweredBy: true,
    noSniff: true,
    ieNoOpen: true,
    frameguard: { action: 'sameorigin' } // Allow same-origin frames for dev tools
  },
  production: {
    // Strict Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", "https:"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        upgradeInsecureRequests: [], // Force HTTPS
      },
    },

    // Strict Transport Security - ONLY for HTTPS
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },

    // Strict cross-origin policies
    crossOriginEmbedderPolicy: { policy: "require-corp" },
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "same-origin" },

    // Security headers
    referrerPolicy: { policy: "no-referrer" },
    hidePoweredBy: true,
    noSniff: true,
    ieNoOpen: true,
    frameguard: { action: 'deny' }, // Block all frames

    // Additional production security
    originAgentCluster: true,
    permittedCrossDomainPolicies: false
  }
} as const;