import { Box, Card, Container, Grid, Stack } from '@chakra-ui/react';
import {
  BackgroundLayers,
  BrandMark,
  FloatingActionBar,
  PrivacyPanel,
} from './components/AppChrome';
import { PreviewSectionHeader } from './components/AppText';
import { ComposedStage } from './components/ComposedStage';
import { PreviewAdjustmentContent, TemplateSelectorFields } from './components/EditorControls';
import { FineTuneDialog } from './components/FineTuneDialog';
import { useWallpaperEditor } from './hooks/useWallpaperEditor';
import {
  CONTENT_CARD_PADDING,
  PREVIEW_CANVAS_MAX_VIEWPORT_HEIGHT,
  PREVIEW_CANVAS_MAX_WIDTH,
  surfaceCardProps,
} from './wallpaperEditor';

type AppProps = {
  appearance: 'light' | 'dark';
};

function App({ appearance }: AppProps) {
  const editor = useWallpaperEditor();

  const previewStageProps = {
    canvasAspectRatio: editor.canvasAspectRatio,
    canvasBackgroundColor: editor.template.canvas.background,
    frameBoxStyle: editor.frameBoxStyle,
    frameBorderRadius: editor.frameBorderRadius,
    previewBorderRadius: editor.previewBorderRadius,
    showOverlay: editor.showFrameOverlay,
    overlaySrc: editor.previewOverlaySrc,
    overlayAlt: `${editor.templateLabel} preview overlay`,
    imageUrl: editor.imageUrl,
    imageMetrics: editor.imageMetrics,
    renderedImageStyle: editor.renderedImageStyle,
    dragging: editor.dragging,
    onPointerDown: editor.handlePointerDown,
    onPointerMove: editor.handlePointerMove,
    onPointerUp: editor.handlePointerUp,
  };

  const previewAdjustmentProps = {
    scale: editor.scale,
    scaleBounds: editor.scaleBounds,
    imageMetrics: editor.imageMetrics,
    previewOverlaySrc: editor.previewOverlaySrc,
    showFrameOverlay: editor.showFrameOverlay,
    showFineTuneButton: !editor.isDesktopLayout,
    previewAssetPath: editor.previewAssetPath,
    onScaleChange: editor.applyScale,
    onScaleDown: () => editor.handleScaleNudge(-1),
    onRecenter: editor.handleRecenter,
    onScaleUp: () => editor.handleScaleNudge(1),
    onOpenFineTune: editor.openFineTune,
    onToggleOverlay: editor.toggleFrameOverlay,
  };

  return (
    <>
      <BackgroundLayers
        appearance={appearance}
        backgroundOverlayOpacity={editor.backgroundOverlayOpacity}
      />

      <Box
        as="main"
        position="relative"
        zIndex={2}
        py={{ base: 4, md: 8 }}
        pb={{ base: '168px', md: '188px' }}
      >
        <Container maxW="7xl" px="16px">
          <Stack gap={{ base: 4, md: 6 }}>
            <BrandMark />

            <Card.Root {...surfaceCardProps} borderRadius="panel" display={{ base: 'block', xl: 'none' }}>
              <Card.Body p={CONTENT_CARD_PADDING}>
                <TemplateSelectorFields
                  layout="grid"
                  watchfaceValue={editor.template.watchface.previewKey}
                  deviceValue={editor.template.deviceKey}
                  watchfaceOptions={editor.watchfaceOptions}
                  deviceOptions={editor.deviceOptions}
                  onWatchfaceChange={editor.handleWatchfaceChange}
                  onDeviceChange={editor.handleDeviceChange}
                />
              </Card.Body>
            </Card.Root>

            <Grid
              templateColumns={{ base: '1fr', xl: 'minmax(0, 1.35fr) minmax(300px, 360px)' }}
              gap={{ base: 4, md: 6 }}
            >
              <Card.Root {...surfaceCardProps} borderRadius="panel">
                <Card.Body p={CONTENT_CARD_PADDING}>
                  <Stack gap={5}>
                    <PreviewSectionHeader
                      isDesktopLayout={editor.isDesktopLayout}
                      canvasWidth={editor.template.canvas.width}
                      canvasHeight={editor.template.canvas.height}
                      frameWidth={editor.template.frame.width}
                      frameHeight={editor.template.frame.height}
                      templateLabel={editor.templateLabel}
                    />

                    <ComposedStage
                      {...previewStageProps}
                      viewportRef={editor.previewViewportRef}
                      onDoubleClick={
                        editor.imageMetrics && !editor.isDesktopLayout
                          ? editor.openFineTune
                          : undefined
                      }
                      placeholderTitle="请先导入图片"
                      maxWidth={`min(100%, ${PREVIEW_CANVAS_MAX_WIDTH}px, calc(${PREVIEW_CANVAS_MAX_VIEWPORT_HEIGHT} * ${editor.canvasAspectRatio}))`}
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
                        <PreviewAdjustmentContent {...previewAdjustmentProps} />
                      </Card.Body>
                    </Card.Root>
                  </Stack>
                </Card.Body>
              </Card.Root>

              <Stack gap={{ base: 4, md: 6 }}>
                <Card.Root {...surfaceCardProps} borderRadius="panel" display={{ base: 'none', xl: 'block' }}>
                  <Card.Body p={CONTENT_CARD_PADDING}>
                    <TemplateSelectorFields
                      layout="stack"
                      watchfaceValue={editor.template.watchface.previewKey}
                      deviceValue={editor.template.deviceKey}
                      watchfaceOptions={editor.watchfaceOptions}
                      deviceOptions={editor.deviceOptions}
                      onWatchfaceChange={editor.handleWatchfaceChange}
                      onDeviceChange={editor.handleDeviceChange}
                    />
                  </Card.Body>
                </Card.Root>

                <Card.Root
                  {...surfaceCardProps}
                  borderRadius="subpanel"
                  display={{ base: 'none', xl: 'block' }}
                >
                  <Card.Body p={CONTENT_CARD_PADDING}>
                    <PreviewAdjustmentContent {...previewAdjustmentProps} />
                  </Card.Body>
                </Card.Root>
              </Stack>
            </Grid>

            <PrivacyPanel />
          </Stack>
        </Container>
      </Box>

      <FloatingActionBar
        imageMetrics={editor.imageMetrics}
        fileInputRef={editor.fileInputRef}
        onFileChange={editor.handleFileChange}
        onExport={editor.handleExport}
      />

      <FineTuneDialog
        appearance={appearance}
        open={!editor.isDesktopLayout && editor.isFineTuneOpen}
        onOpenChange={editor.setFineTuneOpen}
        onClose={editor.closeFineTune}
        stageProps={{
          ...previewStageProps,
          viewportRef: editor.fineTuneViewportRef,
        }}
        scale={editor.scale}
        scaleBounds={editor.scaleBounds}
        imageMetrics={editor.imageMetrics}
        onScaleChange={editor.applyScale}
        onScaleDown={() => editor.handleScaleNudge(-1)}
        onRecenter={editor.handleRecenter}
        onScaleUp={() => editor.handleScaleNudge(1)}
      />
    </>
  );
}

export default App;
