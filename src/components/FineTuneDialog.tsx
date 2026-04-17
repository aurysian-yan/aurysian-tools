import {
  Box,
  Button,
  Card,
  Dialog,
  Flex,
  Portal,
  Slider,
  Stack,
  Theme,
} from '@chakra-ui/react';
import { Plus, Minus, X } from 'phosphor-react';
import { ScaleStatusBadge } from './AppText';
import { ComposedStage, type ComposedStageProps } from './ComposedStage';
import {
  DIALOG_VIEWPORT_MARGIN,
  STABLE_VIEWPORT_HEIGHT,
  type ImageMetrics,
} from '../wallpaperEditor';

type Appearance = 'light' | 'dark';

type FineTuneDialogProps = {
  appearance: Appearance;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  stageProps: Omit<ComposedStageProps, 'placeholderTitle' | 'width' | 'maxWidth'>;
  scale: number;
  scaleBounds: { min: number; max: number };
  imageMetrics: ImageMetrics | null;
  onScaleChange: (nextValue: number) => void;
  onScaleDown: () => void;
  onRecenter: () => void;
  onScaleUp: () => void;
};

function ScaleControlRow({
  imageMetrics,
  onScaleDown,
  onRecenter,
  onScaleUp,
}: Pick<
  FineTuneDialogProps,
  'imageMetrics' | 'onScaleDown' | 'onRecenter' | 'onScaleUp'
>) {
  const isDisabled = !imageMetrics;

  return (
    <Flex gap={3} align="center">
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
    </Flex>
  );
}

export function FineTuneDialog({
  appearance,
  open,
  onOpenChange,
  onClose,
  stageProps,
  scale,
  scaleBounds,
  imageMetrics,
  onScaleChange,
  onScaleDown,
  onRecenter,
  onScaleUp,
}: FineTuneDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(details) => onOpenChange(details.open)}>
      <Portal>
        <Theme appearance={appearance} hasBackground={false}>
          <Dialog.Backdrop bg="blackAlpha.700" backdropFilter="blur(6px)" />
          <Dialog.Positioner p={{ base: 3, md: 6 }} overflow="hidden">
            <Stack
              w="min(96vw, 1400px)"
              maxW="96vw"
              h={`calc(${STABLE_VIEWPORT_HEIGHT} - ${DIALOG_VIEWPORT_MARGIN})`}
              maxH={`calc(${STABLE_VIEWPORT_HEIGHT} - ${DIALOG_VIEWPORT_MARGIN})`}
              gap={{ base: 3, md: 4 }}
              align="stretch"
              margin="0"
            >
              <Flex
                align="center"
                justify="space-between"
                color="white"
                px={{ base: 2, md: 2 }}
                py={{ base: 1, md: 1 }}
                flexShrink={0}
              >
                <Dialog.Title
                  fontSize={{ base: '2xl', md: '4xl' }}
                  fontWeight="800"
                  letterSpacing="-0.04em"
                  m="0"
                  p="0 4px"
                >
                  放大微调
                </Dialog.Title>
                <Button
                  aria-label="关闭放大微调"
                  variant="ghost"
                  color="white"
                  minW={{ base: '40px', md: '40px' }}
                  w={{ base: '40px', md: '40px' }}
                  h={{ base: '40px', md: '40px' }}
                  p="0"
                  borderRadius="10px"
                  bg={{ base: 'transparent', md: 'transparent' }}
                  _hover={{ bg: 'whiteAlpha.100' }}
                  _active={{ bg: 'whiteAlpha.200' }}
                  onClick={onClose}
                >
                  <X size={28} weight="bold" aria-hidden="true" />
                </Button>
              </Flex>

              <Dialog.Content
                w="full"
                flex="1"
                minH="0"
                borderRadius="32px"
                bg="bg.panel"
                overflow="hidden"
                display="flex"
                flexDirection="column"
                margin="0"
              >
                <Dialog.Body
                  px={{ base: 0, md: 6 }}
                  py={{ base: 0, md: 5 }}
                  flex="1"
                  minH="0"
                  display="flex"
                  flexDirection="column"
                  gap={{ base: 0, md: 4 }}
                  overflow="hidden"
                  margin="0"
                >
                  <Box
                    flex="1"
                    minH="0"
                    minW="0"
                    overflow="auto"
                    overscrollBehavior="contain"
                    borderRadius={{ base: '0', md: 'panel' }}
                  >
                    <Box
                      display="flex"
                      justifyContent="center"
                      alignItems="flex-start"
                      minH="full"
                      w="full"
                      minW="0"
                      p={{ base: 0, md: 2 }}
                    >
                      <ComposedStage
                        {...stageProps}
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
                  >
                    <Card.Body p={{ base: 3, md: 4 }}>
                      <Stack gap={4}>
                        <Flex justify="center" align="center" gap={3} wrap="wrap">
                          <ScaleStatusBadge scale={scale} />
                        </Flex>

                        <Slider.Root
                          size="lg"
                          value={[scale]}
                          min={scaleBounds.min}
                          max={scaleBounds.max}
                          step={0.01}
                          disabled={!imageMetrics}
                          onValueChange={(details) => onScaleChange(details.value[0] ?? scale)}
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
                          onScaleDown={onScaleDown}
                          onRecenter={onRecenter}
                          onScaleUp={onScaleUp}
                        />
                      </Stack>
                    </Card.Body>
                  </Card.Root>
                </Dialog.Body>
              </Dialog.Content>
            </Stack>
          </Dialog.Positioner>
        </Theme>
      </Portal>
    </Dialog.Root>
  );
}
