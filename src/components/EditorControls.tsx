import {
  Button,
  Field,
  HStack,
  NativeSelect,
  Slider,
  Stack,
} from '@chakra-ui/react';
import { Minus, Plus } from 'phosphor-react';
import type { ChangeEvent } from 'react';
import { blendModeOptions, type ImageMetrics, type SelectOption } from '../wallpaperEditor';
import { ScaleSectionHeader } from './AppText';

type DeviceSelectorFieldProps = {
  deviceValue: string;
  deviceOptions: SelectOption[];
  onDeviceChange: (event: ChangeEvent<HTMLSelectElement>) => void;
};

type PreviewAdjustmentContentProps = {
  scale: number;
  scaleBounds: { min: number; max: number };
  imageMetrics: ImageMetrics | null;
  imageBlur: number;
  imageBlurBounds: { min: number; max: number; step: number };
  glassBlendMode: string;
  borderBlendMode: string;
  onScaleChange: (nextValue: number) => void;
  onScaleDown: () => void;
  onRecenter: () => void;
  onScaleUp: () => void;
  onImageBlurChange: (value: number) => void;
  onGlassBlendModeChange: (value: string) => void;
  onBorderBlendModeChange: (value: string) => void;
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

export function DeviceSelectorField({
  deviceValue,
  deviceOptions,
  onDeviceChange,
}: DeviceSelectorFieldProps) {
  return (
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
  );
}

export function PreviewAdjustmentContent({
  scale,
  scaleBounds,
  imageMetrics,
  imageBlur,
  imageBlurBounds,
  glassBlendMode,
  borderBlendMode,
  onScaleChange,
  onScaleDown,
  onRecenter,
  onScaleUp,
  onImageBlurChange,
  onGlassBlendModeChange,
  onBorderBlendModeChange,
}: PreviewAdjustmentContentProps) {
  return (
    <Stack gap={5}>
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
      </Stack>

      <Field.Root disabled={!imageMetrics}>
        <Field.Label>模糊度 · {imageBlur}px</Field.Label>
        <Slider.Root
          size="lg"
          w="full"
          value={[imageBlur]}
          min={imageBlurBounds.min}
          max={imageBlurBounds.max}
          step={imageBlurBounds.step}
          disabled={!imageMetrics}
          onValueChange={(details) => onImageBlurChange(details.value[0] ?? imageBlur)}
        >
          <Slider.Control>
            <Slider.Track>
              <Slider.Range />
            </Slider.Track>
            <Slider.Thumbs />
          </Slider.Control>
        </Slider.Root>
      </Field.Root>

      <Field.Root>
        <Field.Label>玻璃层混合模式</Field.Label>
        <NativeSelect.Root size="lg">
          <NativeSelect.Field
            value={glassBlendMode}
            onChange={(event) => onGlassBlendModeChange(event.target.value)}
          >
            {blendModeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      </Field.Root>

      <Field.Root>
        <Field.Label>分割线混合模式</Field.Label>
        <NativeSelect.Root size="lg">
          <NativeSelect.Field
            value={borderBlendMode}
            onChange={(event) => onBorderBlendModeChange(event.target.value)}
          >
            {blendModeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      </Field.Root>
    </Stack>
  );
}
