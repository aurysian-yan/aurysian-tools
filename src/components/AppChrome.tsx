import {
  Box,
  Button,
  Card,
  Flex,
  Grid,
  Input,
  Text,
  Stack,
} from '@chakra-ui/react';
import type { ChangeEvent, RefObject } from 'react';
import BlurEffect from 'react-progressive-blur';
import { BgEffectBackground } from 'hyperos-bg';
import aurysianLogo from '../assets/aurysian-logo.svg';
import { PrivacyNoticeText } from './AppText';
import {
  CONTENT_CARD_PADDING,
  FLOATING_BAR_BLUR_HEIGHT,
  GITHUB_REPO_URL,
  surfaceCardProps,
  type ImageMetrics,
} from '../wallpaperEditor';

type Appearance = 'light' | 'dark';

type BackgroundLayersProps = {
  appearance: Appearance;
  backgroundOverlayOpacity: number;
};

type FloatingActionBarProps = {
  imageMetrics: ImageMetrics | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
};

export function BackgroundLayers({ appearance, backgroundOverlayOpacity }: BackgroundLayersProps) {
  return (
    <>
      <Box
        position="fixed"
        inset="0"
        pointerEvents="none"
        zIndex={0}
        overflow="hidden"
      >
        <BgEffectBackground
          dynamicBackground
          effectBackground
          isFullSize
          isOs3Effect
          deviceType="PAD"
          colorScheme={appearance}
          alpha={() => 1.0}
          style={{ width: '100%', height: '100%' }}
          bgStyle={{ opacity: 1 }}
        />

        <Box
          position="absolute"
          inset="0"
          background={{
            _light: 'linear-gradient(180deg, rgba(245, 245, 247, 0.18) 0%, rgba(245, 245, 247, 0.56) 32%, rgba(245, 245, 247, 0.94) 100%)',
            _dark: 'linear-gradient(180deg, rgba(13, 15, 19, 0.10) 0%, rgba(13, 15, 19, 0.44) 28%, rgba(13, 15, 19, 0.92) 100%)',
          }}
        />

        <Box
          position="absolute"
          inset="0"
          bg={{ _light: '#f5f5f7', _dark: '#080808' }}
          opacity={backgroundOverlayOpacity}
          transition="opacity 120ms linear"
        />
      </Box>

      <Box
        position="fixed"
        left="0"
        right="0"
        bottom="0"
        h={`${FLOATING_BAR_BLUR_HEIGHT}px`}
        pointerEvents="none"
        zIndex={15}
      >
        <Box
          position="relative"
          h="full"
          bgGradient={{
            _light: 'linear(to-t, rgba(245, 245, 247, 0.78), rgba(245, 245, 247, 0.48) 42%, rgba(245, 245, 247, 0))',
            _dark: 'linear(to-t, rgba(13, 15, 19, 0.82), rgba(13, 15, 19, 0.46) 42%, rgba(13, 15, 19, 0))',
          }}
        >
          <BlurEffect className="bottom-progressive-blur" intensity={120} position="bottom" />
        </Box>
      </Box>
    </>
  );
}

export function PrivacyPanel() {
  return (
    <Card.Root {...surfaceCardProps} borderRadius="panel">
      <Card.Body p={CONTENT_CARD_PADDING}>
        <Stack gap={4}>
          <PrivacyNoticeText />

          <Flex justify="flex-start">
            <Button
              as="a"
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noreferrer"
              variant="outline"
              borderRadius="full"
            >
              查看 GitHub 仓库
            </Button>
          </Flex>
        </Stack>
      </Card.Body>
    </Card.Root>
  );
}

export function BrandMark() {
  return (
    <Flex justify="center" pt={{ base: 3, md: 4 }} pb={{ base: 2, md: 3 }}>
      <Stack gap={2} align="center">
        <Box
          role="img"
          aria-label="Aurysian"
          h="24px"
          w="210px"
          maxW="min(210px, 72vw)"
          userSelect="none"
          bg={{
            _light: 'rgba(255, 255, 255, 0.74)',
            _dark: 'rgba(255, 255, 255, 0.74)',
          }}
          _light={{ mixBlendMode: 'difference' }}
          _dark={{ mixBlendMode: 'difference' }}
          maskImage={`url(${aurysianLogo})`}
          maskRepeat="no-repeat"
          maskPosition="center"
          maskSize="contain"
          WebkitMaskImage={`url(${aurysianLogo})`}
          WebkitMaskRepeat="no-repeat"
          WebkitMaskPosition="center"
          WebkitMaskSize="contain"
        />
        <Text
          fontSize="13px"
          fontWeight="600"
          lineHeight="1"
          letterSpacing="0.48em"
          textTransform="uppercase"
          color={{ _light: 'rgba(255, 255, 255, 0.66)', _dark: 'rgba(255, 255, 255, 0.66)' }}
          pl="0.48em"
          whiteSpace="nowrap"
          userSelect="none"
          _light={{ mixBlendMode: 'difference' }}
          _dark={{ mixBlendMode: 'difference' }}
        >
          表盘壁纸生成器
        </Text>
      </Stack>
    </Flex>
  );
}

export function FloatingActionBar({
  imageMetrics,
  fileInputRef,
  onFileChange,
  onExport,
}: FloatingActionBarProps) {
  return (
    <>
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFileChange}
        display="none"
      />

      <Box
        position="fixed"
        left="50%"
        bottom={{ base: 'calc(14px + env(safe-area-inset-bottom))', md: '14px' }}
        transform="translateX(-50%)"
        w="min(720px, calc(100vw - 28px))"
        zIndex={20}
      >
        <Card.Root
          borderRadius="full"
          bg="panelFloat"
          borderWidth="1px"
          borderColor={{ _light: 'rgba(0, 0, 0, 0.08)', _dark: 'rgba(255, 255, 255, 0.10)' }}
          backdropFilter="blur(18px) saturate(0.35)"
          boxShadow="floating"
        >
          <Card.Body p="10px">
            <Grid
              templateColumns={
                imageMetrics
                  ? { base: '1fr 1fr', md: '1.1fr 1fr' }
                  : '1fr'
              }
              gap="10px"
            >
              <Button
                size="lg"
                variant="outline"
                borderRadius="full"
                onClick={() => fileInputRef.current?.click()}
              >
                <Text truncate>{imageMetrics ? '重新导入' : '导入图片'}</Text>
              </Button>

              {imageMetrics ? (
                <Button size="lg" colorPalette="gray" borderRadius="full" onClick={onExport}>
                  保存 PNG
                </Button>
              ) : null}
            </Grid>
          </Card.Body>
        </Card.Root>
      </Box>
    </>
  );
}
