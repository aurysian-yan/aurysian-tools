import { WallpaperStage } from '@claralight-design/wallpaper-engine/react';
import { Box, Card, Container, Flex, Grid, Spinner, Stack, Text } from '@chakra-ui/react';
import { BackgroundLayers, BrandMark, FloatingActionBar, PrivacyPanel } from './components/AppChrome';
import { PreviewSectionHeader } from './components/AppText';
import { DeviceSelectorField, PreviewAdjustmentContent } from './components/EditorControls';
import { useWallpaperEditor } from './hooks/useWallpaperEditor';
import { CONTENT_CARD_PADDING, surfaceCardProps } from './wallpaperEditor';

type AppProps = {
  appearance: 'light' | 'dark';
};

function App({ appearance }: AppProps) {
  const editor = useWallpaperEditor();
  const adjustmentProps = {
    scale: editor.scale,
    scaleBounds: editor.scaleBounds,
    imageMetrics: editor.imageMetrics,
    imageBlur: editor.imageBlur,
    imageBlurBounds: editor.imageBlurBounds,
    glassBlendMode: editor.glassBlendMode,
    borderBlendMode: editor.borderBlendMode,
    onScaleChange: editor.applyScale,
    onScaleDown: () => editor.handleScaleNudge(-1),
    onRecenter: editor.handleRecenter,
    onScaleUp: () => editor.handleScaleNudge(1),
    onImageBlurChange: editor.setImageBlur,
    onGlassBlendModeChange: editor.setGlassBlendMode,
    onBorderBlendModeChange: editor.setBorderBlendMode,
  };
  const statusMessage = editor.resourceError
    ? '表盘资源加载失败，请刷新页面后重试。'
    : editor.previewError
      ? '壁纸预览失败，请重新导入图片。'
      : editor.actionMessage;

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

            <Card.Root
              {...surfaceCardProps}
              borderRadius="panel"
              display={{ base: 'block', xl: 'none' }}
            >
              <Card.Body p={CONTENT_CARD_PADDING}>
                <DeviceSelectorField
                  deviceValue={editor.template.deviceKey}
                  deviceOptions={editor.deviceOptions}
                  onDeviceChange={editor.handleDeviceChange}
                />
              </Card.Body>
            </Card.Root>

            <Grid
              templateColumns={{
                base: '1fr',
                xl: 'minmax(0, 1.35fr) minmax(300px, 360px)',
              }}
              gap={{ base: 4, md: 6 }}
            >
              <Card.Root {...surfaceCardProps} borderRadius="panel">
                <Card.Body p={CONTENT_CARD_PADDING}>
                  <Stack gap={5}>
                    <PreviewSectionHeader
                      canvasWidth={editor.template.canvas.width}
                      canvasHeight={editor.template.canvas.height}
                      templateLabel={editor.templateLabel}
                    />

                    {statusMessage ? (
                      <Text color="fg.error" role="alert">
                        {statusMessage}
                      </Text>
                    ) : null}

                    <Flex
                      minH={{ base: '360px', md: '520px' }}
                      align="center"
                      justify="center"
                    >
                      {editor.resourcesReady ? (
                        <Box position="relative" w="full">
                          <WallpaperStage
                            template={editor.template}
                            editorState={editor.editorState}
                            inputImage={editor.inputImage ?? undefined}
                            resources={editor.resources}
                            onTransformChange={editor.handleTransformChange}
                            onRenderError={editor.handleRenderError}
                          />

                          {!editor.inputImage ? (
                            <Flex
                              position="absolute"
                              inset="0"
                              align="center"
                              justify="center"
                              pointerEvents="none"
                            >
                              <Text
                                bg="bg.panel"
                                color="fg.muted"
                                px={4}
                                py={2}
                                borderRadius="full"
                                fontWeight="600"
                              >
                                请先导入图片
                              </Text>
                            </Flex>
                          ) : null}
                        </Box>
                      ) : editor.resourceError ? null : (
                        <Stack align="center" gap={3} color="fg.muted">
                          <Spinner />
                          <Text>正在加载表盘资源</Text>
                        </Stack>
                      )}
                    </Flex>

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
                        <PreviewAdjustmentContent {...adjustmentProps} />
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
                    <DeviceSelectorField
                      deviceValue={editor.template.deviceKey}
                      deviceOptions={editor.deviceOptions}
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
                    <PreviewAdjustmentContent {...adjustmentProps} />
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
    </>
  );
}

export default App;
