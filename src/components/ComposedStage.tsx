import { Box, Flex, Image as ChakraImage } from '@chakra-ui/react';
import type { CSSProperties, PointerEvent as ReactPointerEvent, RefObject } from 'react';
import { StagePlaceholderText } from './AppText';
import { checkerboardDark, checkerboardLight, type ImageMetrics } from '../wallpaperEditor';

export type ComposedStageProps = {
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
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onDoubleClick?: () => void;
  placeholderTitle: string;
  placeholderText?: string;
  width?: string;
  maxWidth: string;
  maxHeight?: string;
};

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

export function ComposedStage({
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
              <StagePlaceholderText title={placeholderTitle} description={placeholderText} />
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
