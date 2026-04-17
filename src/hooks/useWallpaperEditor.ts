import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { defaultTemplate, layoutTemplates } from '../layouts';
import {
  clamp,
  createRoundedRectPath,
  getBoundedPosition,
  getDeviceOptions,
  getExportFileName,
  getInitialTemplateId,
  getMinScale,
  getTemplateLabel,
  getTemplatePreviewAssetPath,
  getWatchfaceOptions,
  loadImage,
  previewOverlayAssets,
  type DragStartState,
  type ImageMetrics,
  type Position,
} from '../wallpaperEditor';

export function useWallpaperEditor() {
  const [templateId, setTemplateId] = useState(getInitialTemplateId);
  const template = useMemo(
    () => layoutTemplates.find((item) => item.id === templateId) ?? defaultTemplate,
    [templateId],
  );
  const templateLabel = useMemo(() => getTemplateLabel(template), [template]);
  const watchfaceOptions = useMemo(() => getWatchfaceOptions(), []);
  const deviceOptions = useMemo(
    () => getDeviceOptions(template.watchface.previewKey),
    [template.watchface.previewKey],
  );
  const canvasAspectRatio = template.canvas.width / template.canvas.height;

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageMetrics, setImageMetrics] = useState<ImageMetrics | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [isFineTuneOpen, setIsFineTuneOpen] = useState(false);
  const [isDesktopLayout, setIsDesktopLayout] = useState(false);
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
    };
  }, [imageUrl]);

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
      const root = document.documentElement;
      const scrollableDistance = Math.max(root.scrollHeight - root.clientHeight, 0);
      const scrollEnd = Math.max(scrollableDistance * 0.3, 1);
      setScrollProgress(clamp(window.scrollY / scrollEnd, 0, 1));
    };

    updateScrollProgress();
    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    window.addEventListener('resize', updateScrollProgress);

    return () => {
      window.removeEventListener('scroll', updateScrollProgress);
      window.removeEventListener('resize', updateScrollProgress);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const media = window.matchMedia('(min-width: 80rem)');
    const updateDesktopLayout = (event?: MediaQueryListEvent) => {
      const matches = event?.matches ?? media.matches;
      setIsDesktopLayout(matches);
      if (matches) {
        setIsFineTuneOpen(false);
      }
    };

    updateDesktopLayout();
    media.addEventListener('change', updateDesktopLayout);

    return () => media.removeEventListener('change', updateDesktopLayout);
  }, []);

  const frameBoxStyle = useMemo<CSSProperties>(
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

  const renderedImageStyle = useMemo<CSSProperties | undefined>(() => {
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
  const backgroundOverlayOpacity = useMemo(() => scrollProgress, [scrollProgress]);

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

    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = getExportFileName(template.id);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
  }

  return {
    template,
    templateLabel,
    watchfaceOptions,
    deviceOptions,
    canvasAspectRatio,
    imageUrl,
    imageMetrics,
    scale,
    scaleBounds,
    dragging,
    isFineTuneOpen,
    isDesktopLayout,
    showFrameOverlay,
    backgroundOverlayOpacity,
    previewAssetPath,
    previewOverlaySrc,
    frameBoxStyle,
    frameBorderRadius,
    previewBorderRadius,
    renderedImageStyle,
    fileInputRef,
    previewViewportRef,
    fineTuneViewportRef,
    handleWatchfaceChange,
    handleDeviceChange,
    handleFileChange,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    applyScale,
    handleScaleNudge,
    handleRecenter,
    handleExport,
    openFineTune: () => setIsFineTuneOpen(true),
    closeFineTune: () => setIsFineTuneOpen(false),
    setFineTuneOpen: (open: boolean) => setIsFineTuneOpen(open),
    toggleFrameOverlay: () => setShowFrameOverlay((current) => !current),
  };
}
