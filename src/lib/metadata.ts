// src/lib/metadata.ts
import { Metadata } from "next";

interface MetadataProps {
  title: string;
  description: string;
  path: string;
  image?: string;
}

export function generateSiteMetadata({ title, description, path, image }: MetadataProps): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://arcbase.io";
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const fullUrl = `${baseUrl}${cleanPath}`;
  const metaImage = image ?? `${baseUrl}/media/thumbnails/og-default.png`;

  return {
    title: `${title} | Arcbase`,
    description,
    alternates: {
      canonical: fullUrl,
    },
    openGraph: {
      title: `${title} | Arcbase`,
      description,
      url: fullUrl,
      siteName: "Arcbase",
      images: [
        {
          url: metaImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Arcbase`,
      description,
      images: [metaImage],
    },
  };
}
