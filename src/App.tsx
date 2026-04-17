import {
  Badge,
  Box,
  Button,
  Card,
  CloseButton,
  Container,
  Dialog,
  Field,
  Flex,
  Grid,
  Heading,
  HStack,
  Image as ChakraImage,
  Input,
  NativeSelect,
  Portal,
  Slider,
  Stack,
  Text,
  Theme,
} from '@chakra-ui/react';
import { Minus, Plus } from 'phosphor-react';
import {
  ChangeEvent,
  type CSSProperties,
  PointerEvent as ReactPointerEvent,
  type RefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { BgEffectBackground } from 'hyperos-bg';
import BlurEffect from 'react-progressive-blur';
import aurysianLogo from './assets/aurysian-logo.svg';
import { getDevicePreset } from './devices';
import { defaultTemplate, layoutTemplates, type LayoutTemplate } from './layouts';

type PreviewModule = string | { default: string };
type PreviewRequireContext = {
  (id: string): PreviewModule;
  keys: () => string[];
};

declare const require: {
  context: (directory: string, useSubdirectories: boolean, regExp: RegExp) => PreviewRequireContext;
};

const previewOverlayContext = require.context('./preview', false, /\.png$/);
const previewOverlayAssets = previewOverlayContext.keys().reduce<Record<string, string>>((assets, assetPath) => {
  const assetModule = previewOverlayContext(assetPath);
  assets[`./preview/${assetPath.replace('./', '')}`] =
    typeof assetModule === 'string' ? assetModule : assetModule.default;
  return assets;
}, {});

type ImageMetrics = {
  width: number;
  height: number;
};

type AppProps = {
  appearance: 'light' | 'dark';
};

type Position = {
  x: number;
  y: number;
};

type StageMetrics = {
  width: number;
  height: number;
};

type DragStartState = {
  pointerId: number;
  startX: number;
  startY: number;
  startPosition: Position;
  frameWidth: number;
  frameHeight: number;
};

type ComposedStageProps = {
  canvasAspectRatio: number;
  canvasBackgroundColor: string;
  frameBoxStyle: CSSProperties;
  frameBorderRadius: string;
  previewBorderRadius: string;
  showOverlay: boolean;
  overlaySrc: string | null;
  overlayAlt: string;
  imageUrl: string | null;
  imageMetrics: ImageMetrics | null;
  renderedImageStyle: CSSProperties | undefined;
  dragging: boolean;
  viewportRef?: RefObject<HTMLDivElement | null>;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>, frameWidth: number, frameHeight: number) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onDoubleClick?: () => void;
  placeholderTitle: string;
  placeholderText: string;
  width?: string;
  maxWidth: string;
  maxHeight?: string;
};

type ScaleControlRowProps = {
  imageMetrics: ImageMetrics | null;
  onScaleDown: () => void;
  onRecenter: () => void;
  onScaleUp: () => void;
};

type PreviewActionRowProps = {
  imageMetrics: ImageMetrics | null;
  previewOverlaySrc: string | null;
  showFrameOverlay: boolean;
  onOpenFineTune: () => void;
  onToggleOverlay: () => void;
};

const PREVIEW_CANVAS_MIN_WIDTH = 220;
const PREVIEW_CANVAS_MAX_WIDTH = 360;
const FINE_TUNE_CANVAS_MIN_WIDTH = 260;
const STABLE_VIEWPORT_HEIGHT = '100svh';
const PREVIEW_CANVAS_MAX_VIEWPORT_HEIGHT = '75svh';
const DIALOG_VIEWPORT_MARGIN = '24px';
const FLOATING_BAR_BLUR_HEIGHT = 108;
const BACKGROUND_VEIL_SCROLL_DISTANCE = 420;
const CONTENT_CARD_PADDING = { base: 5, md: 6 } as const;
const checkerboardLight = `
  linear-gradient(45deg, rgba(223, 228, 232, 0.88) 25%, transparent 25%),
  linear-gradient(-45deg, rgba(223, 228, 232, 0.88) 25%, transparent 25%),
  linear-gradient(45deg, transparent 75%, rgba(223, 228, 232, 0.88) 75%),
  linear-gradient(-45deg, transparent 75%, rgba(223, 228, 232, 0.88) 75%)
`;
const checkerboardDark = `
  linear-gradient(45deg, rgba(70, 77, 89, 0.72) 25%, transparent 25%),
  linear-gradient(-45deg, rgba(70, 77, 89, 0.72) 25%, transparent 25%),
  linear-gradient(45deg, transparent 75%, rgba(70, 77, 89, 0.72) 75%),
  linear-gradient(-45deg, transparent 75%, rgba(70, 77, 89, 0.72) 75%)
`;
const surfaceCardProps = {
  bg: 'bg.panel',
  borderWidth: '0',
  borderColor: 'transparent',
  boxShadow: 'none',
} as const;
const cardBadgeProps = {
  bg: 'bg.emphasized',
  color: 'fg',
  borderWidth: '1px',
  borderColor: 'border',
  fontWeight: '600',
  px: 3,
  py: 1,
  borderRadius: 'full',
} as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getMinScale(image: ImageMetrics, frame: LayoutTemplate['frame']) {
  return Math.max(frame.width / image.width, frame.height / image.height);
}

function getBoundedPosition(
  image: ImageMetrics,
  frame: LayoutTemplate['frame'],
  scale: number,
  position: Position,
) {
  const renderedWidth = image.width * scale;
  const renderedHeight = image.height * scale;
  const limitX = Math.max(0, (renderedWidth - frame.width) / 2);
  const limitY = Math.max(0, (renderedHeight - frame.height) / 2);

  return {
    x: clamp(position.x, -limitX, limitX),
    y: clamp(position.y, -limitY, limitY),
  };
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Image failed to load'));
    image.src = src;
  });
}

function createRoundedRectPath(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const limitedRadius = clamp(radius, 0, Math.min(width, height) / 2);

  context.beginPath();

  if (limitedRadius === 0) {
    context.rect(x, y, width, height);
    return;
  }

  context.moveTo(x + limitedRadius, y);
  context.arcTo(x + width, y, x + width, y + height, limitedRadius);
  context.arcTo(x + width, y + height, x, y + height, limitedRadius);
  context.arcTo(x, y + height, x, y, limitedRadius);
  context.arcTo(x, y, x + width, y, limitedRadius);
  context.closePath();
}

function getTemplateLabel(template: LayoutTemplate) {
  const device = getDevicePreset(template.deviceKey);
  return `${template.watchface.name} - ${device?.name ?? template.deviceKey}`;
}

function getTemplatePreviewAssetPath(template: LayoutTemplate) {
  const device = getDevicePreset(template.deviceKey);
  return `./preview/${template.watchface.previewKey}.${device?.key ?? template.deviceKey}.png`;
}

function getInitialTemplateId() {
  if (typeof window === 'undefined') {
    return defaultTemplate.id;
  }

  const searchParams = new URLSearchParams(window.location.search);
  const watchfaceKey = searchParams.get('watchface');
  const deviceKey = searchParams.get('device');
  const templateId = searchParams.get('template');

  if (watchfaceKey && deviceKey) {
    const exactMatch = layoutTemplates.find(
      (item) =>
        item.watchface.previewKey === watchfaceKey && item.deviceKey === deviceKey,
    );

    if (exactMatch) {
      return exactMatch.id;
    }
  }

  if (watchfaceKey) {
    const watchfaceMatch = layoutTemplates.find((item) => item.watchface.previewKey === watchfaceKey);

    if (watchfaceMatch) {
      return watchfaceMatch.id;
    }
  }

  if (deviceKey) {
    const deviceMatch = layoutTemplates.find((item) => item.deviceKey === deviceKey);

    if (deviceMatch) {
      return deviceMatch.id;
    }
  }

  if (templateId) {
    const templateMatch = layoutTemplates.find((item) => item.id === templateId);

    if (templateMatch) {
      return templateMatch.id;
    }
  }

  return defaultTemplate.id;
}

function RuleOfThirdsOverlay() {
  return (
    <Box position="absolute" inset="0" pointerEvents="none">
      <Box position="absolute" top="33.333%" left="0" right="0" h="1px" bg="whiteAlpha.800" />
      <Box position="absolute" top="66.666%" left="0" right="0" h="1px" bg="whiteAlpha.800" />
      <Box position="absolute" left="33.333%" top="0" bottom="0" w="1px" bg="whiteAlpha.800" />
      <Box position="absolute" left="66.666%" top="0" bottom="0" w="1px" bg="whiteAlpha.800" />
      <Box
        position="absolute"
        inset="0"
        boxShadow="inset 0 0 0 1px rgba(255, 255, 255, 0.65)"
      />
    </Box>
  );
}

function ComposedStage({
  canvasAspectRatio,
  canvasBackgroundColor,
  frameBoxStyle,
  frameBorderRadius,
  previewBorderRadius,
  showOverlay,
  overlaySrc,
  overlayAlt,
  imageUrl,
  imageMetrics,
  renderedImageStyle,
  dragging,
  viewportRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onDoubleClick,
  placeholderTitle,
  placeholderText,
  width,
  maxWidth,
  maxHeight,
}: ComposedStageProps) {
  return (
    <Box display="flex" justifyContent="center" w="full" minW="0">
      <Box
        ref={viewportRef}
        position="relative"
        w={width ?? 'full'}
        maxW={maxWidth}
        maxH={maxHeight}
        aspectRatio={`${canvasAspectRatio}`}
        borderRadius={previewBorderRadius}
        borderWidth="1px"
        borderColor="border"
        bg={canvasBackgroundColor}
        overflow="hidden"
        onDoubleClick={onDoubleClick}
      >
        <Box
          position="absolute"
          style={frameBoxStyle}
          borderRadius={frameBorderRadius}
          overflow="hidden"
          borderWidth="1px"
          borderColor={dragging ? 'fg' : 'border.emphasized'}
          bg="bg.muted"
          backgroundImage={{ _light: checkerboardLight, _dark: checkerboardDark }}
          backgroundSize="24px 24px"
          backgroundPosition="0 0, 0 12px, 12px -12px, -12px 0"
          touchAction="none"
          cursor={imageMetrics ? (dragging ? 'grabbing' : 'grab') : 'default'}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {imageUrl ? (
            <>
              <ChakraImage
                src={imageUrl}
                alt="Uploaded preview"
                draggable={false}
                position="absolute"
                top="50%"
                left="50%"
                userSelect="none"
                pointerEvents="none"
                maxW="none"
                style={renderedImageStyle}
              />
              {dragging ? <RuleOfThirdsOverlay /> : null}
            </>
          ) : (
            <Flex
              h="full"
              w="full"
              align="center"
              justify="center"
              direction="column"
              gap={2}
              px={4}
              textAlign="center"
              color="fg.muted"
            >
              <Text fontWeight="700">{placeholderTitle}</Text>
              <Text fontSize="sm">{placeholderText}</Text>
            </Flex>
          )}
        </Box>

        {showOverlay && overlaySrc ? (
          <ChakraImage
            src={overlaySrc}
            alt={overlayAlt}
            position="absolute"
            inset="0"
            w="full"
            h="full"
            objectFit="cover"
            pointerEvents="none"
            userSelect="none"
          />
        ) : null}
      </Box>
    </Box>
  );
}

function ScaleControlRow({
  imageMetrics,
  onScaleDown,
  onRecenter,
  onScaleUp,
}: ScaleControlRowProps) {
  const isDisabled = !imageMetrics;

  return (
    <HStack gap={3} align="stretch">
      <Button
        variant="outline"
        size="lg"
        borderRadius="full"
        minW="48px"
        w="48px"
        minH="48px"
        h="48px"
        px="0"
        aria-label="缩小"
        onClick={onScaleDown}
        disabled={isDisabled}
      >
        <Minus size={18} weight="bold" aria-hidden="true" />
      </Button>
      <Button variant="outline" size="lg" flex="1" onClick={onRecenter} disabled={isDisabled}>
        居中重置
      </Button>
      <Button
        variant="outline"
        size="lg"
        borderRadius="full"
        minW="48px"
        w="48px"
        minH="48px"
        h="48px"
        px="0"
        aria-label="放大"
        onClick={onScaleUp}
        disabled={isDisabled}
      >
        <Plus size={18} weight="bold" aria-hidden="true" />
      </Button>
    </HStack>
  );
}

function PreviewActionRow({
  imageMetrics,
  previewOverlaySrc,
  showFrameOverlay,
  onOpenFineTune,
  onToggleOverlay,
}: PreviewActionRowProps) {
  return (
    <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap={3}>
      <Button
        size="lg"
        colorPalette="gray"
        variant="subtle"
        onClick={onOpenFineTune}
        disabled={!imageMetrics}
      >
        放大微调
      </Button>
      <Button
        size="lg"
        variant={showFrameOverlay ? 'solid' : 'outline'}
        colorPalette="gray"
        disabled={!previewOverlaySrc}
        onClick={onToggleOverlay}
      >
        {showFrameOverlay ? '隐藏表盘预览图' : '叠加表盘预览图'}
      </Button>
    </Grid>
  );
}

function App({ appearance }: AppProps) {
  const [templateId, setTemplateId] = useState(getInitialTemplateId);
  const template = useMemo(
    () => layoutTemplates.find((item) => item.id === templateId) ?? defaultTemplate,
    [templateId],
  );
  const device = useMemo(() => getDevicePreset(template.deviceKey), [template.deviceKey]);
  const templateLabel = useMemo(() => getTemplateLabel(template), [template]);
  const watchfaceOptions = useMemo(() => {
    const options = new Map<string, string>();

    layoutTemplates.forEach((item) => {
      options.set(item.watchface.previewKey, item.watchface.name);
    });

    return Array.from(options.entries()).map(([value, label]) => ({ value, label }));
  }, []);
  const deviceOptions = useMemo(() => {
    const options = new Map<string, string>();

    layoutTemplates
      .filter((item) => item.watchface.previewKey === template.watchface.previewKey)
      .forEach((item) => {
        const itemDevice = getDevicePreset(item.deviceKey);
        options.set(item.deviceKey, itemDevice?.name ?? item.deviceKey);
      });

    return Array.from(options.entries()).map(([value, label]) => ({ value, label }));
  }, [template.watchface.previewKey]);
  const canvasAspectRatio = template.canvas.width / template.canvas.height;

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageMetrics, setImageMetrics] = useState<ImageMetrics | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [isFineTuneOpen, setIsFineTuneOpen] = useState(false);
  const [showFrameOverlay, setShowFrameOverlay] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewViewportRef = useRef<HTMLDivElement | null>(null);
  const fineTuneViewportRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<DragStartState | null>(null);

  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
      if (exportUrl) {
        URL.revokeObjectURL(exportUrl);
      }
    };
  }, [imageUrl, exportUrl]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set('watchface', template.watchface.previewKey);
    nextUrl.searchParams.set('device', template.deviceKey);
    nextUrl.searchParams.delete('template');
    window.history.replaceState({}, '', `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
  }, [template.deviceKey, template.watchface.previewKey]);

  useEffect(() => {
    if (!imageMetrics) {
      return;
    }

    const minScale = getMinScale(imageMetrics, template.frame);
    setScale(minScale);
    setPosition({ x: 0, y: 0 });
  }, [imageMetrics, template]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const updateScrollProgress = () => {
      setScrollProgress(clamp(window.scrollY / BACKGROUND_VEIL_SCROLL_DISTANCE, 0, 1));
    };

    updateScrollProgress();
    window.addEventListener('scroll', updateScrollProgress, { passive: true });

    return () => window.removeEventListener('scroll', updateScrollProgress);
  }, []);

  const frameBoxStyle = useMemo(
    () => ({
      left: `${(template.frame.x / template.canvas.width) * 100}%`,
      top: `${(template.frame.y / template.canvas.height) * 100}%`,
      width: `${(template.frame.width / template.canvas.width) * 100}%`,
      height: `${(template.frame.height / template.canvas.height) * 100}%`,
    }),
    [
      template.canvas.height,
      template.canvas.width,
      template.frame.height,
      template.frame.width,
      template.frame.x,
      template.frame.y,
    ],
  );

  const frameBorderRadius = useMemo(
    () =>
      `${(template.frame.radius / template.frame.width) * 100}% / ${(template.frame.radius / template.frame.height) * 100}%`,
    [template.frame.height, template.frame.radius, template.frame.width],
  );

  const previewBorderRadius = useMemo(
    () =>
      `${(template.preview.radius / template.canvas.width) * 100}% / ${(template.preview.radius / template.canvas.height) * 100}%`,
    [template.canvas.height, template.canvas.width, template.preview.radius],
  );

  const previewAssetPath = useMemo(() => getTemplatePreviewAssetPath(template), [template]);
  const previewOverlaySrc = useMemo(
    () => previewOverlayAssets[previewAssetPath] ?? null,
    [previewAssetPath],
  );

  const renderedImageStyle = useMemo(() => {
    if (!imageMetrics) {
      return undefined;
    }

    const renderedWidth = imageMetrics.width * scale;
    const renderedHeight = imageMetrics.height * scale;

    return {
      width: `${(renderedWidth / template.frame.width) * 100}%`,
      height: `${(renderedHeight / template.frame.height) * 100}%`,
      transform: `translate(calc(-50% + ${(position.x / template.frame.width) * 100}%), calc(-50% + ${(position.y / template.frame.height) * 100}%))`,
    };
  }, [
    imageMetrics,
    position.x,
    position.y,
    scale,
    template.frame.height,
    template.frame.width,
  ]);

  const scaleBounds = useMemo(() => {
    if (!imageMetrics) {
      return { min: 1, max: 3 };
    }

    const min = getMinScale(imageMetrics, template.frame);
    return {
      min,
      max: min * 4,
    };
  }, [imageMetrics, template.frame]);

  const scaleStep = useMemo(
    () => Math.max(0.05, Number((scaleBounds.min * 0.08).toFixed(2))),
    [scaleBounds.min],
  );
  const backgroundVeilOpacity = useMemo(() => 1 - scrollProgress * 0.82, [scrollProgress]);

  function handleWatchfaceChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextWatchfaceKey = event.target.value;
    const nextTemplate =
      layoutTemplates.find(
        (item) =>
          item.watchface.previewKey === nextWatchfaceKey &&
          item.deviceKey === template.deviceKey,
      ) ?? layoutTemplates.find((item) => item.watchface.previewKey === nextWatchfaceKey);

    if (nextTemplate) {
      setTemplateId(nextTemplate.id);
    }
  }

  function handleDeviceChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextDeviceKey = event.target.value;
    const nextTemplate = layoutTemplates.find(
      (item) =>
        item.watchface.previewKey === template.watchface.previewKey &&
        item.deviceKey === nextDeviceKey,
    );

    if (nextTemplate) {
      setTemplateId(nextTemplate.id);
    }
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }

    const nextUrl = URL.createObjectURL(file);
    const image = await loadImage(nextUrl);

    setImageUrl(nextUrl);
    setImageMetrics({
      width: image.naturalWidth,
      height: image.naturalHeight,
    });
    setExportUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return null;
    });
    event.target.value = '';
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!imageMetrics) {
      return;
    }

    const { width, height } = event.currentTarget.getBoundingClientRect();
    dragStartRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startPosition: position,
      frameWidth: width,
      frameHeight: height,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!imageMetrics || !dragStartRef.current || dragStartRef.current.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragStartRef.current.startX;
    const deltaY = event.clientY - dragStartRef.current.startY;
    const frameScaleX = template.frame.width / dragStartRef.current.frameWidth;
    const frameScaleY = template.frame.height / dragStartRef.current.frameHeight;
    const nextPosition = getBoundedPosition(imageMetrics, template.frame, scale, {
      x: dragStartRef.current.startPosition.x + deltaX * frameScaleX,
      y: dragStartRef.current.startPosition.y + deltaY * frameScaleY,
    });

    setPosition(nextPosition);
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragStartRef.current?.pointerId === event.pointerId) {
      dragStartRef.current = null;
    }

    setDragging(false);
  }

  function applyScale(nextScale: number) {
    if (!imageMetrics) {
      return;
    }

    setScale(nextScale);
    setPosition((current) => getBoundedPosition(imageMetrics, template.frame, nextScale, current));
  }

  function handleScaleNudge(direction: 1 | -1) {
    applyScale(clamp(scale + scaleStep * direction, scaleBounds.min, scaleBounds.max));
  }

  function handleRecenter() {
    setPosition({ x: 0, y: 0 });
  }

  async function handleExport() {
    if (!imageUrl || !imageMetrics) {
      return;
    }

    const image = await loadImage(imageUrl);
    const canvas = document.createElement('canvas');
    canvas.width = template.canvas.width;
    canvas.height = template.canvas.height;
    const context = canvas.getContext('2d');

    if (!context) {
      return;
    }

    context.fillStyle = template.canvas.background;
    context.fillRect(0, 0, canvas.width, canvas.height);

    const renderedWidth = imageMetrics.width * scale;
    const renderedHeight = imageMetrics.height * scale;
    const imageX = template.frame.x + (template.frame.width - renderedWidth) / 2 + position.x;
    const imageY = template.frame.y + (template.frame.height - renderedHeight) / 2 + position.y;

    context.save();
    createRoundedRectPath(
      context,
      template.frame.x,
      template.frame.y,
      template.frame.width,
      template.frame.height,
      template.frame.radius,
    );
    context.clip();
    context.drawImage(image, imageX, imageY, renderedWidth, renderedHeight);
    context.restore();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) {
      return;
    }

    setExportUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return URL.createObjectURL(blob);
    });
  }

  return (
    <>
      <Box
        position="fixed"
        inset="0"
        pointerEvents="none"
        zIndex={0}
        opacity={backgroundVeilOpacity}
        transition="opacity 120ms linear"
        overflow="hidden"
      >
        <BgEffectBackground
          dynamicBackground
          effectBackground
          isFullSize
          isOs3Effect
          deviceType="PAD"
          colorScheme={appearance}
          alpha={() => 1.00}
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

      <Box as="main" position="relative" zIndex={2} py={{ base: 4, md: 8 }} pb={{ base: '168px', md: '188px' }}>
        <Container maxW="7xl" px="16px">
          <Stack gap={{ base: 4, md: 6 }}>
            <Card.Root
              {...surfaceCardProps}
              borderRadius="panel"
              display={{ base: 'block', xl: 'none' }}
            >
              <Card.Body p={CONTENT_CARD_PADDING}>
                <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={{ base: 4, md: 5 }} alignItems="end">
                  <Field.Root>
                    <Field.Label>表盘</Field.Label>
                    <NativeSelect.Root size="lg">
                      <NativeSelect.Field
                        value={template.watchface.previewKey}
                        onChange={handleWatchfaceChange}
                      >
                        {watchfaceOptions.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>设备</Field.Label>
                    <NativeSelect.Root size="lg">
                      <NativeSelect.Field
                        value={template.deviceKey}
                        onChange={handleDeviceChange}
                      >
                        {deviceOptions.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                  </Field.Root>
                </Grid>
              </Card.Body>
            </Card.Root>

            <Grid templateColumns={{ base: '1fr', xl: 'minmax(0, 1.35fr) minmax(300px, 360px)' }} gap={{ base: 4, md: 6 }}>
              <Card.Root
                {...surfaceCardProps}
                borderRadius="panel"
              >
                <Card.Body p={CONTENT_CARD_PADDING}>
                  <Stack gap={5}>
                    <Flex justify="space-between" align="start" gap={3} wrap="wrap">
                      <Stack gap={2}>
                        <Heading as="h2" size="md">
                          壁纸预览
                        </Heading>
                        <Text color="fg.muted">
                          微调图片位置并预览效果，双击图片以放大
                        </Text>
                      </Stack>
                      <HStack gap={2} wrap="wrap">
                        <Badge {...cardBadgeProps}>
                          画布 {template.canvas.width} × {template.canvas.height}
                        </Badge>
                        <Badge {...cardBadgeProps}>
                          窗口 {template.frame.width} × {template.frame.height}
                        </Badge>
                        <Badge {...cardBadgeProps}>
                          {templateLabel}
                        </Badge>
                      </HStack>
                    </Flex>

                    <ComposedStage
                      canvasAspectRatio={canvasAspectRatio}
                      canvasBackgroundColor={template.canvas.background}
                      frameBoxStyle={frameBoxStyle}
                      frameBorderRadius={frameBorderRadius}
                      previewBorderRadius={previewBorderRadius}
                      showOverlay={showFrameOverlay}
                      overlaySrc={previewOverlaySrc}
                      overlayAlt={`${templateLabel} preview overlay`}
                      imageUrl={imageUrl}
                      imageMetrics={imageMetrics}
                      renderedImageStyle={renderedImageStyle}
                      dragging={dragging}
                      viewportRef={previewViewportRef}
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onDoubleClick={imageMetrics ? () => setIsFineTuneOpen(true) : undefined}
                      placeholderTitle="请先导入图片"
                      maxWidth={`min(100%, ${PREVIEW_CANVAS_MAX_WIDTH}px, calc(${PREVIEW_CANVAS_MAX_VIEWPORT_HEIGHT} * ${canvasAspectRatio}))`}
                    />

                    <Card.Root
                      {...surfaceCardProps}
                      borderRadius="subpanel"
                      display={{ base: 'block', xl: 'none' }}
                      bg={{ base: 'transparent', md: surfaceCardProps.bg }}
                      borderColor={{ base: 'transparent', md: surfaceCardProps.borderColor }}
                      borderWidth={{ base: '0', md: surfaceCardProps.borderWidth }}
                      boxShadow={{ base: 'none', md: surfaceCardProps.boxShadow }}
                    >
                      <Card.Body p={{ base: 0, md: CONTENT_CARD_PADDING.md }}>
                        <Stack gap={4}>
                          <Flex justify="space-between" align="center" gap={3} wrap="wrap">
                            <Text fontWeight="700">尺寸与微调</Text>
                            <Badge {...cardBadgeProps}>
                              当前缩放 {scale.toFixed(2)}x
                            </Badge>
                          </Flex>

                          <Slider.Root
                            size="lg"
                            value={[scale]}
                            min={scaleBounds.min}
                            max={scaleBounds.max}
                            step={0.01}
                            disabled={!imageMetrics}
                            onValueChange={(details) => applyScale(details.value[0] ?? scale)}
                          >
                            <Slider.Control>
                              <Slider.Track>
                                <Slider.Range />
                              </Slider.Track>
                              <Slider.Thumbs />
                            </Slider.Control>
                          </Slider.Root>

                          <ScaleControlRow
                            imageMetrics={imageMetrics}
                            onScaleDown={() => handleScaleNudge(-1)}
                            onRecenter={handleRecenter}
                            onScaleUp={() => handleScaleNudge(1)}
                          />
                          <PreviewActionRow
                            imageMetrics={imageMetrics}
                            previewOverlaySrc={previewOverlaySrc}
                            showFrameOverlay={showFrameOverlay}
                            onOpenFineTune={() => setIsFineTuneOpen(true)}
                            onToggleOverlay={() => setShowFrameOverlay((current) => !current)}
                          />
                          {!previewOverlaySrc ? (
                            <Text fontSize="sm" color="fg.muted">
                              当前模板未找到对应预览图，预期文件名是 `{previewAssetPath.replace('./preview/', '')}`。
                            </Text>
                          ) : null}
                        </Stack>
                      </Card.Body>
                    </Card.Root>
                  </Stack>
                </Card.Body>
              </Card.Root>

              <Stack gap={{ base: 4, md: 6 }}>
                <Card.Root
                  {...surfaceCardProps}
                  borderRadius="panel"
                  display={{ base: 'none', xl: 'block' }}
                >
                  <Card.Body p={CONTENT_CARD_PADDING}>
                    <Stack gap={4}>
                      <Field.Root>
                        <Field.Label>表盘</Field.Label>
                        <NativeSelect.Root size="lg">
                          <NativeSelect.Field
                            value={template.watchface.previewKey}
                            onChange={handleWatchfaceChange}
                          >
                            {watchfaceOptions.map((item) => (
                              <option key={item.value} value={item.value}>
                                {item.label}
                              </option>
                            ))}
                          </NativeSelect.Field>
                          <NativeSelect.Indicator />
                        </NativeSelect.Root>
                      </Field.Root>
                      <Field.Root>
                        <Field.Label>设备</Field.Label>
                        <NativeSelect.Root size="lg">
                          <NativeSelect.Field
                            value={template.deviceKey}
                            onChange={handleDeviceChange}
                          >
                            {deviceOptions.map((item) => (
                              <option key={item.value} value={item.value}>
                                {item.label}
                              </option>
                            ))}
                          </NativeSelect.Field>
                          <NativeSelect.Indicator />
                        </NativeSelect.Root>
                      </Field.Root>
                    </Stack>
                  </Card.Body>
                </Card.Root>

                <Card.Root
                  {...surfaceCardProps}
                  borderRadius="subpanel"
                  display={{ base: 'none', xl: 'block' }}
                >
                  <Card.Body p={CONTENT_CARD_PADDING}>
                    <Stack gap={4}>
                      <Flex justify="space-between" align="center" gap={3} wrap="wrap">
                        <Text fontWeight="700">尺寸与微调</Text>
                        <Badge {...cardBadgeProps}>
                          当前缩放 {scale.toFixed(2)}x
                        </Badge>
                      </Flex>

                      <Slider.Root
                        size="lg"
                        value={[scale]}
                        min={scaleBounds.min}
                        max={scaleBounds.max}
                        step={0.01}
                        disabled={!imageMetrics}
                        onValueChange={(details) => applyScale(details.value[0] ?? scale)}
                      >
                        <Slider.Control>
                          <Slider.Track>
                            <Slider.Range />
                          </Slider.Track>
                          <Slider.Thumbs />
                        </Slider.Control>
                      </Slider.Root>

                      <ScaleControlRow
                        imageMetrics={imageMetrics}
                        onScaleDown={() => handleScaleNudge(-1)}
                        onRecenter={handleRecenter}
                        onScaleUp={() => handleScaleNudge(1)}
                      />
                      <PreviewActionRow
                        imageMetrics={imageMetrics}
                        previewOverlaySrc={previewOverlaySrc}
                        showFrameOverlay={showFrameOverlay}
                        onOpenFineTune={() => setIsFineTuneOpen(true)}
                        onToggleOverlay={() => setShowFrameOverlay((current) => !current)}
                      />
                      {!previewOverlaySrc ? (
                        <Text fontSize="sm" color="fg.muted">
                          当前模板未找到对应预览图，预期文件名是 `{previewAssetPath.replace('./preview/', '')}`。
                        </Text>
                      ) : null}
                    </Stack>
                  </Card.Body>
                </Card.Root>
              </Stack>
            </Grid>

            <Flex justify="center" pt={{ base: 4, md: 6 }}>
              <Box
                role="img"
                aria-label="Aurysian"
                h="16px"
                w="142px"
                maxW="min(142px, 62vw)"
                opacity={0.92}
                userSelect="none"
                bg="fg"
                maskImage={`url(${aurysianLogo})`}
                maskRepeat="no-repeat"
                maskPosition="center"
                maskSize="contain"
                WebkitMaskImage={`url(${aurysianLogo})`}
                WebkitMaskRepeat="no-repeat"
                WebkitMaskPosition="center"
                WebkitMaskSize="contain"
              />
            </Flex>
          </Stack>
        </Container>
      </Box>

      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
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
          borderColor="border"
          backdropFilter="blur(18px)"
          boxShadow="floating"
        >
          <Card.Body p="10px">
            <Stack gap="10px">
              <Grid templateColumns={{ base: '1fr 1fr', md: exportUrl ? '1.1fr 1fr auto' : '1.1fr 1fr' }} gap="10px">
                <Button
                  size="lg"
                  variant="outline"
                  borderRadius="full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Text truncate>{imageMetrics ? '重新导入' : '导入图片'}</Text>
                </Button>

                <Button size="lg" colorPalette="gray" borderRadius="full" onClick={handleExport} disabled={!imageMetrics}>
                  保存 PNG
                </Button>

                {exportUrl ? (
                  <Button
                    as="a"
                    size="lg"
                    variant="subtle"
                    colorPalette="gray"
                    borderRadius="full"
                    href={exportUrl}
                    download={`${template.id}.png`}
                    gridColumn={{ base: '1 / -1', md: 'auto' }}
                  >
                    下载结果
                  </Button>
                ) : null}
              </Grid>
            </Stack>
          </Card.Body>
        </Card.Root>
      </Box>

      <Dialog.Root open={isFineTuneOpen} onOpenChange={(details) => setIsFineTuneOpen(details.open)}>
        <Portal>
          <Theme appearance={appearance} hasBackground={false}>
            <Dialog.Backdrop bg="blackAlpha.700" backdropFilter="blur(6px)" />
            <Dialog.Positioner p={{ base: 3, md: 6 }} overflow="hidden">
              <Dialog.Content
                w="min(96vw, 1400px)"
                maxW="96vw"
                h={`calc(${STABLE_VIEWPORT_HEIGHT} - var(--dialog-base-margin) - 24px)`}
                maxH={`calc(${STABLE_VIEWPORT_HEIGHT} - var(--dialog-base-margin) - 24px)`}
                borderRadius={"32px"}
                bg="bg.panel"
                overflow="hidden"
                display="flex"
                flexDirection="column"
              >
                <Box position={"fixed"} top={"34px"} left={"24px"}>
                  <Dialog.Title fontSize={{ base: 'lg', md: 'xl' }} m="0" color={"white"}>
                    放大微调
                  </Dialog.Title>
                </Box>
                <Dialog.Header px={{ base: 4, md: 6 }} pt={{ base: 4, md: 6 }} pb={3} flexShrink={0} position={"fixed"} zIndex={"10"} right={"12px"}>
                  <Card.Root
                    borderRadius="full"
                    bg="panelFloat"
                    borderColor="border"
                    backdropFilter="blur(18px)"
                    boxShadow="floating"
                    w="full"
                  >
                    <Card.Body p="4px">
                      <Flex justify="space-between" align="center" gap={3} w="full">
                        <CloseButton onClick={() => setIsFineTuneOpen(false)} />
                      </Flex>
                    </Card.Body>
                  </Card.Root>
                </Dialog.Header>

                <Dialog.Body
                  py={"0"}
                  px={{ base: 4, md: 6 }}
                  flex="1"
                  minH="0"
                  display="flex"
                  flexDirection="column"
                  gap={4}
                  overflow="hidden"
                >
                  <Box
                    flex="1"
                    minH="0"
                    minW="0"
                    overflow="auto"
                    overscrollBehavior="contain"
                    pb="172px"
                    pt="72px"
                  >
                    <Box
                      display="flex"
                      justifyContent="center"
                      alignItems="flex-start"
                      minH="full"
                      w="full"
                      minW="0"
                      p={{ base: 1, md: 2 }}
                    >
                      <ComposedStage
                        canvasAspectRatio={canvasAspectRatio}
                        canvasBackgroundColor={template.canvas.background}
                        frameBoxStyle={frameBoxStyle}
                        frameBorderRadius={frameBorderRadius}
                        previewBorderRadius={previewBorderRadius}
                        showOverlay={showFrameOverlay}
                        overlaySrc={previewOverlaySrc}
                        overlayAlt={`${templateLabel} preview overlay`}
                        imageUrl={imageUrl}
                        imageMetrics={imageMetrics}
                        renderedImageStyle={renderedImageStyle}
                        dragging={dragging}
                        viewportRef={fineTuneViewportRef}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        placeholderTitle="请先上传图片"
                        width="100%"
                        maxWidth="100%"
                      />
                    </Box>
                  </Box>
                  <Card.Root
                    borderRadius="panel"
                    bg="panelFloat"
                    borderColor="border"
                    backdropFilter="blur(18px)"
                    boxShadow="floating"
                    flexShrink={0}
                    position={"fixed"} zIndex={"10"} bottom={"28px"} w={"calc(100vw - 56px)"}
                  >
                    <Card.Body p={{ base: 3, md: 4 }}>
                      <Stack gap={4}>
                        <Flex justify="center" align="center" gap={3} wrap="wrap">
                          <Badge {...cardBadgeProps}>
                            当前缩放 {scale.toFixed(2)}x
                          </Badge>
                        </Flex>

                        <Slider.Root
                          size="lg"
                          value={[scale]}
                          min={scaleBounds.min}
                          max={scaleBounds.max}
                          step={0.01}
                          disabled={!imageMetrics}
                          onValueChange={(details) => applyScale(details.value[0] ?? scale)}
                        >
                          <Slider.Control>
                            <Slider.Track>
                              <Slider.Range />
                            </Slider.Track>
                            <Slider.Thumbs />
                          </Slider.Control>
                        </Slider.Root>

                        <ScaleControlRow
                          imageMetrics={imageMetrics}
                          onScaleDown={() => handleScaleNudge(-1)}
                          onRecenter={handleRecenter}
                          onScaleUp={() => handleScaleNudge(1)}
                        />
                      </Stack>
                    </Card.Body>
                  </Card.Root>
                </Dialog.Body>
              </Dialog.Content>
            </Dialog.Positioner>
          </Theme>
        </Portal>
      </Dialog.Root>
    </>
  );
}

export default App;
