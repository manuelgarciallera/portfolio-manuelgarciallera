/* eslint-disable @next/next/no-img-element */
import { useState } from "react";

export function SmartImage({ src, fb, alt, style = {}, loading = "lazy", fetchPriority = "auto" }) {
  const [error, setError] = useState(false);
  if (error) return <div style={{ width: "100%", height: "100%", background: fb, ...style }} />;

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      fetchPriority={fetchPriority}
      onError={() => setError(true)}
      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", ...style }}
    />
  );
}
