import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

const config = defineConfig({
  theme: {
    semanticTokens: {
      colors: {
        page: {
          value: {
            _light: '{colors.gray.50}',
            _dark: '{colors.gray.950}',
          },
        },
        panelFloat: {
          value: {
            _light: 'rgba(255, 255, 255, 0.90)',
            _dark: 'rgba(8, 8, 8, 0.90)',
          },
        },
      },
      radii: {
        l1: {
          value: '{radii.xs}',
        },
        l2: {
          value: '{radii.sm}',
        },
        l3: {
          value: '{radii.lg}',
        },
      },
      shadows: {
        card: {
          value: {
            _light: '0 18px 48px rgba(15, 23, 42, 0.08), 0 1px 0 rgba(15, 23, 42, 0.04)',
            _dark: '0 24px 64px rgba(0, 0, 0, 0.34), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
          },
        },
        floating: {
          value: {
            _light: '0 18px 40px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.78)',
            _dark: '0 24px 56px rgba(0, 0, 0, 0.52), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
          },
        },
        stage: {
          value: {
            _light: '0 18px 44px rgba(15, 23, 42, 0.10)',
            _dark: '0 24px 52px rgba(0, 0, 0, 0.42)',
          },
        },
        frame: {
          value: {
            _light: '0 0 0 1px rgba(15, 23, 42, 0.06)',
            _dark: '0 0 0 1px rgba(255, 255, 255, 0.08)',
          },
        },
        frameActive: {
          value: {
            _light: '0 0 0 3px rgba(15, 23, 42, 0.12)',
            _dark: '0 0 0 3px rgba(255, 255, 255, 0.18)',
          },
        },
      },
    },
    tokens: {
      fonts: {
        body: {
          value: "'Avenir Next', 'PingFang SC', 'Hiragino Sans GB', sans-serif",
        },
        heading: {
          value: "'Avenir Next', 'PingFang SC', 'Hiragino Sans GB', sans-serif",
        },
      },
      radii: {
        xs: {
          value: '8px',
        },
        sm: {
          value: '12px',
        },
        md: {
          value: '15px',
        },
        lg: {
          value: '18px',
        },
        xl: {
          value: '21px',
        },
        '2xl': {
          value: '24px',
        },
        panel: {
          value: '24px',
        },
        panelLg: {
          value: '24px',
        },
        subpanel: {
          value: '24px',
        },
      },
    },
  },
  globalCss: {
    '*': {
      boxSizing: 'border-box',
    },
    'html, body, #root': {
      minHeight: '100%',
    },
    '.bottom-progressive-blur': {
      insetInline: '0',
      width: '100%',
      height: '100%',
    },
    html: {
      colorScheme: 'light',
      _osDark: {
        colorScheme: 'dark',
      },
    },
    body: {
      margin: 0,
      color: '#1d1d1f',
      fontFamily: 'body',
      background: '#f5f5f7',
      transitionProperty: 'background-color, color',
      transitionDuration: '180ms',
      _osDark: {
        color: '#f4f4f5',
        background: '#080808',
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
