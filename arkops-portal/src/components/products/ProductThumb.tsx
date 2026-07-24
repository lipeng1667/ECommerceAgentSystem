/**
 * File: ProductThumb.tsx
 * Purpose: Product image thumbnail that degrades gracefully. If the image is missing or
 * fails to load (e.g. an external URL that can't be reached), it falls back to a neutral
 * placeholder tile instead of the browser's broken-image chrome.
 *
 * Author: Michael Lee
 * Created: 2026-07-24
 *
 * Main exports:
 * - ProductThumb: square product thumbnail with a picture-icon fallback.
 */
import { PictureOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';

interface ProductThumbProps {
  src?: string;
  /** Square edge length in px. */
  size?: number;
}

/**
 * Renders a square product thumbnail, falling back to a neutral placeholder tile
 * when the source is empty or fails to load.
 *
 * @param src - Image URL; may be undefined.
 * @param size - Square edge length in px (default 40).
 * @returns React element with the image or a placeholder tile.
 */
export function ProductThumb({ src, size = 40 }: ProductThumbProps) {
  const [failed, setFailed] = useState(false);

  // Reset the failed state if the source changes (e.g. list re-renders with new data).
  useEffect(() => setFailed(false), [src]);

  const box = { width: size, height: size, borderRadius: 4, flexShrink: 0 } as const;

  if (!src || failed) {
    return (
      <div
        style={{
          ...box,
          display: 'grid',
          placeItems: 'center',
          background: 'var(--ark-panel-soft)',
          color: 'var(--ark-muted)',
          fontSize: Math.round(size * 0.4),
        }}
        aria-hidden
      >
        <PictureOutlined />
      </div>
    );
  }

  return <img src={src} alt="" onError={() => setFailed(true)} style={{ ...box, objectFit: 'cover' }} />;
}
