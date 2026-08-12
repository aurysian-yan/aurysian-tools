import {
  constrainWallpaperTransform,
  getWallpaperScaleBounds,
  type ResolvedWallpaperTemplate,
  type WallpaperEditorState,
  type WallpaperImageMetrics,
  type WallpaperLayerState,
  type WallpaperResources,
  type WallpaperTransformState,
} from '@claralight-design/wallpaper-engine';
import {
  getInitialWallpaperEditorState,
  loadWallpaperImage,
  renderWallpaperToBlob,
} from '@claralight-design/wallpaper-engine/render';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';
import { defaultTemplate, layoutTemplates } from '../layouts';
import {
  getDeviceOptions,
  getExportFileName,
  getInitialTemplateId,
  getTemplateLabel,
} from '../wallpaperEditor';

const emptyResources: WallpaperResources = {
  assets: {},
  masks: {},
};

async function loadTemplateResources(template: ResolvedWallpaperTemplate) {
  const imageCache = new Map<string, Promise<HTMLImageElement>>();
  const getImage = (url: string) => {
    const cachedImage = imageCache.get(url);
    if (cachedImage) {
      return cachedImage;
    }

    const imagePromise = loadWallpaperImage(url);
    imageCache.set(url, imagePromise);
    return imagePromise;
  };
  const assets: WallpaperResources['assets'] = {};
  const masks: WallpaperResources['masks'] = {};

  await Promise.all(
    template.layers.flatMap((layer) => {
      const tasks: Promise<void>[] = [];

      if (layer.type === 'asset' && layer.assetUrl) {
        tasks.push(getImage(layer.assetUrl).then((image) => void (assets[layer.id] = image)));
      }

      if (layer.maskUrl) {
        tasks.push(getImage(layer.maskUrl).then((image) => void (masks[layer.id] = image)));
      }

      return tasks;
    }),
  );

  return { assets, masks };
}

function getImageMetrics(image: HTMLImageElement | null): WallpaperImageMetrics | null {
  if (!image) {
    return null;
  }

  return {
    width: image.naturalWidth,
    height: image.naturalHeight,
  };
}

export function useWallpaperEditor() {
  const [templateId, setTemplateId] = useState(getInitialTemplateId);
  const template = useMemo(
    () => layoutTemplates.find((item) => item.id === templateId) ?? defaultTemplate,
    [templateId],
  );
  const templateLabel = useMemo(() => getTemplateLabel(template), [template]);
  const deviceOptions = useMemo(getDeviceOptions, []);
  const [inputImage, setInputImage] = useState<HTMLImageElement | null>(null);
  const imageMetrics = useMemo(() => getImageMetrics(inputImage), [inputImage]);
  const [editorState, setEditorState] = useState<WallpaperEditorState>(() =>
    getInitialWallpaperEditorState(defaultTemplate),
  );
  const [resources, setResources] = useState<WallpaperResources>(emptyResources);
  const [resourcesTemplateId, setResourcesTemplateId] = useState<string>();
  const [resourceError, setResourceError] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [actionMessage, setActionMessage] = useState<string>();
  const [isExporting, setIsExporting] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlRef = useRef<string | undefined>(undefined);
  const imageRequestRef = useRef(0);

  useEffect(() => {
    setEditorState(getInitialWallpaperEditorState(template, inputImage ?? undefined));
    setPreviewError(false);
  }, [inputImage, template]);

  useEffect(() => {
    let cancelled = false;

    setResources(emptyResources);
    setResourcesTemplateId(undefined);
    setResourceError(false);

    loadTemplateResources(template)
      .then((nextResources) => {
        if (cancelled) {
          return;
        }

        setResources(nextResources);
        setResourcesTemplateId(template.id);
      })
      .catch(() => {
        if (!cancelled) {
          setResourceError(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [template]);

  useEffect(() => {
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set('watchface', 'jiangge');
    nextUrl.searchParams.set('device', template.deviceKey);
    nextUrl.searchParams.delete('template');
    window.history.replaceState({}, '', `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
  }, [template.deviceKey]);

  useEffect(() => {
    const updateScrollProgress = () => {
      const root = document.documentElement;
      const scrollableDistance = Math.max(root.scrollHeight - root.clientHeight, 0);
      const scrollEnd = Math.max(scrollableDistance * 0.3, 1);
      setScrollProgress(Math.min(1, Math.max(0, window.scrollY / scrollEnd)));
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
    return () => {
      imageRequestRef.current += 1;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const photoLayer = useMemo(
    () => template.layers.find((layer) => layer.type === 'wallpaper'),
    [template.layers],
  );
  const glassLayer = useMemo(
    () => template.layers.find((layer) => layer.id === 'glass'),
    [template.layers],
  );
  const borderLayer = useMemo(
    () => template.layers.find((layer) => layer.id === 'border'),
    [template.layers],
  );
  const scaleBounds = useMemo(
    () =>
      imageMetrics
        ? getWallpaperScaleBounds(imageMetrics, template, editorState.transform.rotation)
        : {
            min: template.wallpaperTransform.scale.min,
            max: template.wallpaperTransform.scale.max,
          },
    [editorState.transform.rotation, imageMetrics, template],
  );
  const scaleStep = useMemo(
    () => Math.max(0.05, Number((scaleBounds.min * 0.08).toFixed(2))),
    [scaleBounds.min],
  );
  const resourcesReady = resourcesTemplateId === template.id && !resourceError;

  function updateLayerState(layerId: string | undefined, patch: Partial<WallpaperLayerState>) {
    if (!layerId) {
      return;
    }

    setEditorState((current) => {
      const currentLayer = current.layers[layerId];
      if (!currentLayer) {
        return current;
      }

      return {
        ...current,
        layers: {
          ...current.layers,
          [layerId]: {
            ...currentLayer,
            ...patch,
          },
        },
      };
    });
  }

  function applyTransform(nextTransform: WallpaperTransformState) {
    if (!imageMetrics) {
      return;
    }

    setEditorState((current) => ({
      ...current,
      transform: constrainWallpaperTransform(nextTransform, imageMetrics, template),
    }));
  }

  function applyScale(nextScale: number) {
    applyTransform({
      ...editorState.transform,
      scale: nextScale,
    });
  }

  function handleScaleNudge(direction: 1 | -1) {
    const nextScale = Math.min(
      scaleBounds.max,
      Math.max(scaleBounds.min, editorState.transform.scale + scaleStep * direction),
    );
    applyScale(nextScale);
  }

  function handleRecenter() {
    applyTransform({
      ...editorState.transform,
      x: 0,
      y: 0,
    });
  }

  function handleDeviceChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextTemplate = layoutTemplates.find((item) => item.deviceKey === event.target.value);
    if (nextTemplate) {
      setTemplateId(nextTemplate.id);
    }
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    const requestId = imageRequestRef.current + 1;
    imageRequestRef.current = requestId;
    const nextUrl = URL.createObjectURL(file);
    setActionMessage(undefined);

    try {
      const nextImage = await loadWallpaperImage(nextUrl);
      if (imageRequestRef.current !== requestId) {
        URL.revokeObjectURL(nextUrl);
        return;
      }

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }

      objectUrlRef.current = nextUrl;
      setInputImage(nextImage);
    } catch {
      URL.revokeObjectURL(nextUrl);
      setActionMessage('图片读取失败，请选择其他图片后重试。');
    }
  }

  async function handleExport() {
    if (!inputImage || !resourcesReady || isExporting) {
      return;
    }

    setActionMessage(undefined);
    setIsExporting(true);

    try {
      const blob = await renderWallpaperToBlob(template, editorState, inputImage, resources);
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = getExportFileName(template.id);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    } catch {
      setActionMessage('壁纸导出失败，请稍后重试。');
    } finally {
      setIsExporting(false);
    }
  }

  const handleTransformChange = useCallback(
    (nextTransform: WallpaperTransformState) => {
      if (!imageMetrics) {
        return;
      }

      setEditorState((current) => ({
        ...current,
        transform: constrainWallpaperTransform(nextTransform, imageMetrics, template),
      }));
    },
    [imageMetrics, template],
  );

  const handleRenderError = useCallback((message?: string) => {
    setPreviewError(Boolean(message));
  }, []);

  return {
    template,
    templateLabel,
    deviceOptions,
    editorState,
    inputImage,
    imageMetrics,
    resources,
    resourcesReady,
    resourceError,
    previewError,
    actionMessage,
    isExporting,
    scale: editorState.transform.scale,
    scaleBounds,
    imageBlur: photoLayer ? editorState.layers[photoLayer.id]?.blur ?? 0 : 0,
    imageBlurBounds: photoLayer?.blur ?? { min: 0, max: 0, step: 1 },
    glassBlendMode: glassLayer
      ? editorState.layers[glassLayer.id]?.blendMode ?? glassLayer.blendMode.default
      : 'normal',
    borderBlendMode: borderLayer
      ? editorState.layers[borderLayer.id]?.blendMode ?? borderLayer.blendMode.default
      : 'normal',
    backgroundOverlayOpacity: scrollProgress,
    fileInputRef,
    handleDeviceChange,
    handleFileChange,
    handleExport,
    handleTransformChange,
    handleRenderError,
    applyScale,
    handleScaleNudge,
    handleRecenter,
    setImageBlur: (blur: number) => updateLayerState(photoLayer?.id, { blur }),
    setGlassBlendMode: (blendMode: string) =>
      updateLayerState(glassLayer?.id, { blendMode }),
    setBorderBlendMode: (blendMode: string) =>
      updateLayerState(borderLayer?.id, { blendMode }),
  };
}
