import { useState } from "react";
import Image from "next/image";

export function SmartImage({
  src,
  fb,
  alt,
  style = {},
  loading = "lazy",
  fetchPriority = "auto",
  sizes = "100vw",
  width = 1600,
  height = 900,
}) {
  const [error, setError] = useState(false);
  if (error) return <div style={{ width: "100%", height: "100%", background: fb, ...style }} />;

  const priority = loading === "eager" || fetchPriority === "high";

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      priority={priority}
      loading={loading === "eager" ? undefined : loading}
      fetchPriority={fetchPriority}
      onError={() => setError(true)}
      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", ...style }}
    />
  );
}
