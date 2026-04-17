import { ChakraProvider, Theme } from '@chakra-ui/react';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { system } from './theme';

function RootTheme() {
  const [appearance, setAppearance] = React.useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') {
      return 'light';
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  React.useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event: MediaQueryListEvent) => {
      setAppearance(event.matches ? 'dark' : 'light');
    };

    setAppearance(media.matches ? 'dark' : 'light');
    media.addEventListener('change', onChange);

    return () => media.removeEventListener('change', onChange);
  }, []);

  return (
    <Theme appearance={appearance} bg="page" minH="100dvh">
      <App appearance={appearance} />
    </Theme>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ChakraProvider value={system}>
      <RootTheme />
    </ChakraProvider>
  </React.StrictMode>,
);
