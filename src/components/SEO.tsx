import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title: string;
    description: string;
    url: string;
    image?: string;
    schema?: any; // JSON-LD object
}

const SEO: React.FC<SEOProps> = ({ title, description, url, image = '/app-logo.jpg', schema }) => {
    return (
        <Helmet>
            <title>{title}</title>
            <meta name="description" content={description} />

            {/* Canonical & Hreflang */}
            <link rel="canonical" href={url} />
            <link rel="alternate" hrefLang="fr" href={url} />
            <link rel="alternate" hrefLang="fr-CH" href={url} />
            <link rel="alternate" hrefLang="x-default" href={url} />

            {/* Open Graph */}
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:url" content={url} />
            <meta property="og:image" content={image} />
            <meta property="og:type" content="website" />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:title" content={title} />
            <meta property="twitter:description" content={description} />
            <meta property="twitter:image" content={image} />

            {/* Structured Data */}
            {schema && (
                <script type="application/ld+json">
                    {JSON.stringify(schema)}
                </script>
            )}
        </Helmet>
    );
};

export default SEO;
