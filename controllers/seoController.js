import { SEOData } from '../models/SEOData.js';

export const getSEOData = async (req, res) => {
  try {
    let seo = await SEOData.findOne();
    if (!seo) {
      seo = await SEOData.create({
        siteTitle: 'Klanvision IT Solutions',
        metaDescription: 'Professional and Expert Engineers. Certified IT products trusted by enterprise clients worldwide.',
        keywords: 'Engineering, Design, Software Development, IT Consulting, API Integration',
        sitemapUrl: 'https://klanvision.com/sitemap.xml',
        googleConsoleId: 'G-KLANVISION',
        robotsTxt: 'User-agent: *\nAllow: /'
      });
    }
    res.json(seo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateSEOData = async (req, res) => {
  try {
    const { siteTitle, metaDescription, keywords, sitemapUrl, googleConsoleId, robotsTxt } = req.body;
    let seo = await SEOData.findOne();
    if (seo) {
      await seo.update({
        siteTitle,
        metaDescription,
        keywords,
        sitemapUrl,
        googleConsoleId,
        robotsTxt
      });
    } else {
      seo = await SEOData.create({
        siteTitle,
        metaDescription,
        keywords,
        sitemapUrl,
        googleConsoleId,
        robotsTxt
      });
    }
    res.json(seo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
