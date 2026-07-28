import { Metadata } from "next";
import { siteConfig } from "@/config/site";

interface MetadataProps {
  title: string;
  description: string;
  path: string;
  image?: string;
}

export function generateSiteMetadata({
  title,
  description,
  path,
  image,
}: MetadataProps): Metadata {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const fullUrl = `${siteConfig.url}${cleanPath}`;
  const metaImage =
    image ?? `${siteConfig.url}/media/thumbnails/og-default.png`;

  return {
    title: `${title} | ${siteConfig.name}`,
    description,
    alternates: {
      canonical: fullUrl,
    },
    openGraph: {
      title: `${title} | ${siteConfig.name}`,
      description,
      url: fullUrl,
      siteName: siteConfig.name,
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
      title: `${title} | ${siteConfig.name}`,
      description,
      images: [metaImage],
    },
  };
}
