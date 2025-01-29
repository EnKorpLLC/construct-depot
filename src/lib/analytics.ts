import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/crypto';

interface GA4Config {
  measurementId: string;
  enabled: boolean;
  anonymizeIp: boolean;
  enableDebugMode: boolean;
}

let cachedConfig: GA4Config | null = null;

export async function getGA4Config(): Promise<GA4Config | null> {
  if (cachedConfig) return cachedConfig;

  try {
    const config = await prisma.serviceConfig.findUnique({
      where: { service: 'analytics' },
    });

    if (!config) return null;

    const decryptedConfig = JSON.parse(decrypt(config.config as string)) as GA4Config;
    cachedConfig = decryptedConfig;
    return decryptedConfig;
  } catch (error) {
    console.error('Error fetching GA4 config:', error);
    return null;
  }
}

export function getGA4Script(config: GA4Config): string {
  const debugMode = config.enableDebugMode ? 'true' : 'false';
  const anonymizeIp = config.anonymizeIp ? 'true' : 'false';

  return `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${config.measurementId}', {
      debug_mode: ${debugMode},
      anonymize_ip: ${anonymizeIp},
      send_page_view: true,
      cookie_flags: 'SameSite=Strict;Secure'
    });
  `;
}

export function GA4Script() {
  const config = useGA4Config();
  
  if (!config?.enabled || !config.measurementId) {
    return null;
  }

  return (
    <>
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${config.measurementId}`}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: getGA4Script(config),
        }}
      />
    </>
  );
}

// React hook for GA4 config
import { useState, useEffect } from 'react';

export function useGA4Config() {
  const [config, setConfig] = useState<GA4Config | null>(null);

  useEffect(() => {
    async function fetchConfig() {
      const ga4Config = await getGA4Config();
      setConfig(ga4Config);
    }
    fetchConfig();
  }, []);

  return config;
}

// Analytics event tracking functions
export const analytics = {
  pageview: (url: string) => {
    const config = cachedConfig;
    if (!config?.enabled) return;

    window.gtag('config', config.measurementId, {
      page_path: url,
    });
  },

  event: (action: string, params: Record<string, any>) => {
    const config = cachedConfig;
    if (!config?.enabled) return;

    window.gtag('event', action, params);
  },

  // Common events
  purchase: (params: {
    transaction_id: string;
    value: number;
    currency: string;
    items: any[];
  }) => {
    analytics.event('purchase', params);
  },

  addToCart: (params: {
    items: any[];
    value: number;
    currency: string;
  }) => {
    analytics.event('add_to_cart', params);
  },

  login: (method: string) => {
    analytics.event('login', { method });
  },

  signup: (method: string) => {
    analytics.event('sign_up', { method });
  },

  search: (search_term: string) => {
    analytics.event('search', { search_term });
  },
};

// Add types for window object
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
} 