import { Badge, Flex, Heading, HStack, Stack, Text } from '@chakra-ui/react';

const badgeProps = {
  bg: 'bg.emphasized',
  color: 'fg',
  borderWidth: '1px',
  borderColor: 'border',
  fontWeight: '600',
  px: 3,
  py: 1,
  borderRadius: 'full',
} as const;

type StagePlaceholderTextProps = {
  title: string;
  description?: string;
};

type PreviewSectionHeaderProps = {
  isDesktopLayout: boolean;
  canvasWidth: number;
  canvasHeight: number;
  frameWidth: number;
  frameHeight: number;
  templateLabel: string;
};

type ScaleSectionHeaderProps = {
  scale: number;
};

type OverlayAssetHintProps = {
  fileName: string;
};

export function StagePlaceholderText({ title, description }: StagePlaceholderTextProps) {
  return (
    <>
      <Text fontWeight="700">{title}</Text>
      {description ? <Text fontSize="sm">{description}</Text> : null}
    </>
  );
}

export function PreviewSectionHeader({
  isDesktopLayout,
  canvasWidth,
  canvasHeight,
  frameWidth,
  frameHeight,
  templateLabel,
}: PreviewSectionHeaderProps) {
  const description = isDesktopLayout
    ? '微调图片位置并预览效果'
    : '微调图片位置并预览效果，双击图片以放大';

  return (
    <Flex justify="space-between" align="start" gap={3} wrap="wrap">
      <Stack gap={2}>
        <Heading as="h2" size="md">
          壁纸预览
        </Heading>
        <Text color="fg.muted">{description}</Text>
      </Stack>
      <HStack gap={2} wrap="wrap">
        <Badge {...badgeProps}>
          画布 {canvasWidth} × {canvasHeight}
        </Badge>
        <Badge {...badgeProps}>
          窗口 {frameWidth} × {frameHeight}
        </Badge>
        <Badge {...badgeProps}>{templateLabel}</Badge>
      </HStack>
    </Flex>
  );
}

export function ScaleStatusBadge({ scale }: ScaleSectionHeaderProps) {
  return <Badge {...badgeProps}>当前缩放 {scale.toFixed(2)}x</Badge>;
}

export function ScaleSectionHeader({ scale }: ScaleSectionHeaderProps) {
  return (
    <Flex justify="space-between" align="center" gap={3} wrap="wrap">
      <Text fontWeight="700">尺寸与微调</Text>
      <ScaleStatusBadge scale={scale} />
    </Flex>
  );
}

export function OverlayAssetHint({ fileName }: OverlayAssetHintProps) {
  return (
    <Text fontSize="sm" color="fg.muted">
      当前模板未找到对应预览图，预期文件名是 `{fileName}`。
    </Text>
  );
}

export function PrivacyNoticeText() {
  return (
    <Stack gap={2}>
      <Heading as="h2" size="sm">
        隐私说明
      </Heading>
      <Text color="fg.muted">
        当前版本会在浏览器本地读取、预览并导出你选择的图片，不会把图片上传到项目服务器或第三方图片处理服务。
      </Text>
      <Text fontSize="sm" color="fg.muted">
        页面本身仍需要从当前部署站点加载前端代码与静态资源；如果你想自行核对实现，可以直接查看开源仓库。
      </Text>
    </Stack>
  );
}
