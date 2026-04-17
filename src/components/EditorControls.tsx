import {
  Button,
  Field,
  Grid,
  HStack,
  NativeSelect,
  Slider,
  Stack,
} from '@chakra-ui/react';
import { Minus, Plus } from 'phosphor-react';
import type { ChangeEvent } from 'react';
import { OverlayAssetHint, ScaleSectionHeader } from './AppText';
import type { ImageMetrics, SelectOption } from '../wallpaperEditor';

type TemplateSelectorFieldsProps = {
  watchfaceValue: string;
  deviceValue: string;
  watchfaceOptions: SelectOption[];
  deviceOptions: SelectOption[];
  onWatchfaceChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  onDeviceChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  layout: 'grid' | 'stack';
};

type PreviewAdjustmentContentProps = {
  scale: number;
  scaleBounds: { min: number; max: number };
  imageMetrics: ImageMetrics | null;
  previewOverlaySrc: string | null;
  showFrameOverlay: boolean;
  showFineTuneButton: boolean;
  previewAssetPath: string;
  onScaleChange: (nextValue: number) => void;
  onScaleDown: () => void;
  onRecenter: () => void;
  onScaleUp: () => void;
  onOpenFineTune: () => void;
  onToggleOverlay: () => void;
};

function ScaleControlRow({
  imageMetrics,
  onScaleDown,
  onRecenter,
  onScaleUp,
}: Pick<
  PreviewAdjustmentContentProps,
  'imageMetrics' | 'onScaleDown' | 'onRecenter' | 'onScaleUp'
>) {
  const isDisabled = !imageMetrics;

  return (
    <HStack gap={3} align="center">
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
  showFineTuneButton,
  onOpenFineTune,
  onToggleOverlay,
}: Pick<
  PreviewAdjustmentContentProps,
  | 'imageMetrics'
  | 'previewOverlaySrc'
  | 'showFrameOverlay'
  | 'showFineTuneButton'
  | 'onOpenFineTune'
  | 'onToggleOverlay'
>) {
  return (
    <Grid templateColumns={showFineTuneButton ? 'repeat(2, minmax(0, 1fr))' : '1fr'} gap={3}>
      {showFineTuneButton ? (
        <Button
          size="lg"
          colorPalette="gray"
          variant="subtle"
          onClick={onOpenFineTune}
          disabled={!imageMetrics}
        >
          放大微调
        </Button>
      ) : null}
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

export function TemplateSelectorFields({
  watchfaceValue,
  deviceValue,
  watchfaceOptions,
  deviceOptions,
  onWatchfaceChange,
  onDeviceChange,
  layout,
}: TemplateSelectorFieldsProps) {
  const fieldContent = (
    <>
      <Field.Root>
        <Field.Label>表盘</Field.Label>
        <NativeSelect.Root size="lg">
          <NativeSelect.Field value={watchfaceValue} onChange={onWatchfaceChange}>
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
          <NativeSelect.Field value={deviceValue} onChange={onDeviceChange}>
            {deviceOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      </Field.Root>
    </>
  );

  if (layout === 'grid') {
    return (
      <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={{ base: 4, md: 5 }} alignItems="end">
        {fieldContent}
      </Grid>
    );
  }

  return <Stack gap={4}>{fieldContent}</Stack>;
}

export function PreviewAdjustmentContent({
  scale,
  scaleBounds,
  imageMetrics,
  previewOverlaySrc,
  showFrameOverlay,
  showFineTuneButton,
  previewAssetPath,
  onScaleChange,
  onScaleDown,
  onRecenter,
  onScaleUp,
  onOpenFineTune,
  onToggleOverlay,
}: PreviewAdjustmentContentProps) {
  return (
    <Stack gap={4}>
      <ScaleSectionHeader scale={scale} />

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
      <PreviewActionRow
        imageMetrics={imageMetrics}
        previewOverlaySrc={previewOverlaySrc}
        showFrameOverlay={showFrameOverlay}
        showFineTuneButton={showFineTuneButton}
        onOpenFineTune={onOpenFineTune}
        onToggleOverlay={onToggleOverlay}
      />
      {!previewOverlaySrc ? (
        <OverlayAssetHint fileName={previewAssetPath.replace('./preview/', '')} />
      ) : null}
    </Stack>
  );
}
