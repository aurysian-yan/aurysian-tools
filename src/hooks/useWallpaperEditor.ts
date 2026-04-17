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
  getPositionWithAnchor,
  getTemplateLabel,
  getTemplatePreviewAssetPath,
  getWatchfaceOptions,
  loadImage,
  previewOverlayAssets,
  type ImageMetrics,
  type Position,
  type TransformState,
} from '../wallpaperEditor';

type PointerSnapshot = {
  clientX: number;
  clientY: number;
};

type GestureFrame = {
  frameLeft: number;
  frameTop: number;
  frameWidth: number;
  frameHeight: number;
};

type PanGestureState = GestureFrame & {
  kind: 'pan';
  pointerId: number;
  startX: number;
  startY: number;
  startPosition: Position;
};

type PinchGestureState = GestureFrame & {
  kind: 'pinch';
  pointerIds: [number, number];
  startDistance: number;
  startScale: number;
  startPosition: Position;
  startAnchor: Position;
};

type GestureState = PanGestureState | PinchGestureState;

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
  const activePointersRef = useRef(new Map<number, PointerSnapshot>());
  const gestureRef = useRef<GestureState | null>(null);
  const transformRef = useRef<TransformState>({ scale: 1, position: { x: 0, y: 0 } });
  const pendingTransformRef = useRef<TransformState | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  function clonePosition(nextPosition: Position) {
    return { x: nextPosition.x, y: nextPosition.y };
  }

  function cloneTransform(nextTransform: TransformState): TransformState {
    return {
      scale: nextTransform.scale,
      position: clonePosition(nextTransform.position),
    };
  }

  function getViewportTransformStyle(
    nextTransform: TransformState,
    animated: boolean,
  ): CSSProperties | undefined {
    if (!imageMetrics) {
      return undefined;
    }

    const baseScale = getMinScale(imageMetrics, template.frame);
    const renderedWidth = imageMetrics.width * baseScale;
    const renderedHeight = imageMetrics.height * baseScale;

    return {
      '--stage-image-width': `${(renderedWidth / template.frame.width) * 100}%`,
      '--stage-image-height': `${(renderedHeight / template.frame.height) * 100}%`,
      '--stage-image-offset-x': `${(nextTransform.position.x / template.frame.width) * 100}%`,
      '--stage-image-offset-y': `${(nextTransform.position.y / template.frame.height) * 100}%`,
      '--stage-image-scale': `${nextTransform.scale / baseScale}`,
      '--stage-image-transition': animated
        ? 'transform 180ms cubic-bezier(0.22, 1, 0.36, 1)'
        : 'none',
    } as CSSProperties;
  }

  function syncViewportTransform(nextTransform: TransformState, animated: boolean) {
    const nextStyle = getViewportTransformStyle(nextTransform, animated);
    const viewportTargets = [previewViewportRef.current, fineTuneViewportRef.current];

    viewportTargets.forEach((viewport) => {
      if (!viewport || !nextStyle) {
        return;
      }

      Object.entries(nextStyle).forEach(([key, value]) => {
        if (typeof value === 'string') {
          viewport.style.setProperty(key, value);
        }
      });
    });
  }

  function flushPendingTransform() {
    animationFrameRef.current = null;

    const nextTransform = pendingTransformRef.current;
    if (!nextTransform) {
      return;
    }

    pendingTransformRef.current = null;
    syncViewportTransform(nextTransform, false);
  }

  function scheduleTransform(nextTransform: TransformState) {
    const normalizedTransform = cloneTransform(nextTransform);
    transformRef.current = normalizedTransform;
    pendingTransformRef.current = normalizedTransform;

    if (typeof window === 'undefined') {
      syncViewportTransform(normalizedTransform, false);
      return;
    }

    if (animationFrameRef.current !== null) {
      return;
    }

    animationFrameRef.current = window.requestAnimationFrame(flushPendingTransform);
  }

  function applyTransformImmediate(nextTransform: TransformState, animated = false) {
    const normalizedTransform = cloneTransform(nextTransform);
    transformRef.current = normalizedTransform;
    pendingTransformRef.current = null;

    if (typeof window !== 'undefined' && animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    syncViewportTransform(normalizedTransform, animated);
    setScale(normalizedTransform.scale);
    setPosition(normalizedTransform.position);
  }

  function getGestureFrame(element: HTMLDivElement): GestureFrame {
    const rect = element.getBoundingClientRect();

    return {
      frameLeft: rect.left,
      frameTop: rect.top,
      frameWidth: rect.width,
      frameHeight: rect.height,
    };
  }

  function getFramePoint(pointer: PointerSnapshot, frame: GestureFrame) {
    return {
      x: ((pointer.clientX - frame.frameLeft) / frame.frameWidth) * template.frame.width,
      y: ((pointer.clientY - frame.frameTop) / frame.frameHeight) * template.frame.height,
    };
  }

  function createPanGesture(
    pointerId: number,
    pointer: PointerSnapshot,
    frame: GestureFrame,
  ): PanGestureState {
    return {
      kind: 'pan',
      pointerId,
      startX: pointer.clientX,
      startY: pointer.clientY,
      startPosition: clonePosition(transformRef.current.position),
      ...frame,
    };
  }

  function createPinchGesture(
    pointerIds: [number, number],
    frame: GestureFrame,
  ): PinchGestureState | null {
    const [firstPointerId, secondPointerId] = pointerIds;
    const firstPointer = activePointersRef.current.get(firstPointerId);
    const secondPointer = activePointersRef.current.get(secondPointerId);

    if (!firstPointer || !secondPointer) {
      return null;
    }

    const midpoint = {
      clientX: (firstPointer.clientX + secondPointer.clientX) / 2,
      clientY: (firstPointer.clientY + secondPointer.clientY) / 2,
    };

    return {
      kind: 'pinch',
      pointerIds,
      startDistance: Math.max(
        Math.hypot(
          secondPointer.clientX - firstPointer.clientX,
          secondPointer.clientY - firstPointer.clientY,
        ),
        1,
      ),
      startScale: transformRef.current.scale,
      startPosition: clonePosition(transformRef.current.position),
      startAnchor: getFramePoint(midpoint, frame),
      ...frame,
    };
  }

  function rebaseGesture(element: HTMLDivElement) {
    const remainingPointerIds = Array.from(activePointersRef.current.keys());

    if (remainingPointerIds.length >= 2) {
      const nextGesture = createPinchGesture(
        [remainingPointerIds[0], remainingPointerIds[1]],
        getGestureFrame(element),
      );
      gestureRef.current = nextGesture;
      setDragging(Boolean(nextGesture));
      return;
    }

    if (remainingPointerIds.length === 1) {
      const pointerId = remainingPointerIds[0];
      const pointer = activePointersRef.current.get(pointerId);

      if (pointer) {
        gestureRef.current = createPanGesture(pointerId, pointer, getGestureFrame(element));
        setDragging(true);
        return;
      }
    }

    gestureRef.current = null;
    setDragging(false);
  }

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
    applyTransformImmediate({
      scale: minScale,
      position: { x: 0, y: 0 },
    });
    activePointersRef.current.clear();
    gestureRef.current = null;
    setDragging(false);
  }, [imageMetrics, template]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

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

  useEffect(() => {
    syncViewportTransform({ scale, position }, !dragging);
  }, [dragging, imageMetrics, position, scale, template]);

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

  const imageViewportStyle = useMemo<CSSProperties | undefined>(() => {
    if (!imageMetrics) {
      return undefined;
    }

    return getViewportTransformStyle({ scale, position }, !dragging);
  }, [dragging, imageMetrics, position, scale, template]);

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

    event.preventDefault();
    activePointersRef.current.set(event.pointerId, {
      clientX: event.clientX,
      clientY: event.clientY,
    });
    event.currentTarget.setPointerCapture(event.pointerId);

    const pointerIds = Array.from(activePointersRef.current.keys());
    if (pointerIds.length >= 2) {
      gestureRef.current = createPinchGesture(
        [pointerIds[0], pointerIds[1]],
        getGestureFrame(event.currentTarget),
      );
    } else {
      gestureRef.current = createPanGesture(
        event.pointerId,
        activePointersRef.current.get(event.pointerId)!,
        getGestureFrame(event.currentTarget),
      );
    }

    setDragging(Boolean(gestureRef.current));
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!imageMetrics || !activePointersRef.current.has(event.pointerId)) {
      return;
    }

    event.preventDefault();
    activePointersRef.current.set(event.pointerId, {
      clientX: event.clientX,
      clientY: event.clientY,
    });

    const gesture = gestureRef.current;
    if (!gesture) {
      return;
    }

    if (gesture.kind === 'pan') {
      if (gesture.pointerId !== event.pointerId) {
        return;
      }

      const deltaX = event.clientX - gesture.startX;
      const deltaY = event.clientY - gesture.startY;
      const frameScaleX = template.frame.width / gesture.frameWidth;
      const frameScaleY = template.frame.height / gesture.frameHeight;
      const nextPosition = getBoundedPosition(imageMetrics, template.frame, transformRef.current.scale, {
        x: gesture.startPosition.x + deltaX * frameScaleX,
        y: gesture.startPosition.y + deltaY * frameScaleY,
      });

      scheduleTransform({
        scale: transformRef.current.scale,
        position: nextPosition,
      });
      return;
    }

    const [firstPointerId, secondPointerId] = gesture.pointerIds;
    const firstPointer = activePointersRef.current.get(firstPointerId);
    const secondPointer = activePointersRef.current.get(secondPointerId);

    if (!firstPointer || !secondPointer) {
      return;
    }

    const nextScale = clamp(
      gesture.startScale *
        (Math.hypot(
          secondPointer.clientX - firstPointer.clientX,
          secondPointer.clientY - firstPointer.clientY,
        ) / gesture.startDistance),
      scaleBounds.min,
      scaleBounds.max,
    );
    const midpoint = {
      clientX: (firstPointer.clientX + secondPointer.clientX) / 2,
      clientY: (firstPointer.clientY + secondPointer.clientY) / 2,
    };
    const nextPosition = getBoundedPosition(
      imageMetrics,
      template.frame,
      nextScale,
      getPositionWithAnchor(
        gesture.startPosition,
        gesture.startScale,
        nextScale,
        template.frame,
        gesture.startAnchor,
        getFramePoint(midpoint, gesture),
      ),
    );

    scheduleTransform({
      scale: nextScale,
      position: nextPosition,
    });
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    activePointersRef.current.delete(event.pointerId);
    if (activePointersRef.current.size === 0) {
      gestureRef.current = null;
      setDragging(false);
      applyTransformImmediate(transformRef.current);
      return;
    }

    rebaseGesture(event.currentTarget);
  }

  function applyScale(nextScale: number) {
    if (!imageMetrics) {
      return;
    }

    applyTransformImmediate({
      scale: nextScale,
      position: getBoundedPosition(
        imageMetrics,
        template.frame,
        nextScale,
        transformRef.current.position,
      ),
    }, true);
  }

  function handleScaleNudge(direction: 1 | -1) {
    applyScale(clamp(scale + scaleStep * direction, scaleBounds.min, scaleBounds.max));
  }

  function handleRecenter() {
    applyTransformImmediate({
      scale: transformRef.current.scale,
      position: { x: 0, y: 0 },
    }, true);
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
    imageViewportStyle,
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
