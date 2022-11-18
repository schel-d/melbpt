import express from "express";
import { getNetwork } from "./network";

export function serveSitemapXml(app: express.Application) {
  app.get("/sitemap.xml", (_req, res: express.Response) => {
    const network = getNetwork();

    const xml = `<?xml version="1.0" encoding="utf-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url>
        <loc>https://trainquery.com/</loc>
        <priority>1.0</priority>
      </url>
      <url>
        <loc>https://trainquery.com/lines</loc>
        <priority>0.1</priority>
      </url>
      <url>
        <loc>https://trainquery.com/about</loc>
        <priority>0.1</priority>
      </url>

      ${network.lines.map(l => `
      <url>
        <loc>https://trainquery.com/lines/${l.id.toFixed()}</loc>
        <priority>0.8</priority>
      </url>
      `).join()}

      ${network.stops.map(s => `
      <url>
        <loc>https://trainquery.com/${s.urlName}</loc>
        <priority>0.6</priority>
      </url>
      `).join()}

    </urlset>
    `;

    res.set("Content-Type", "text/xml").send(xml);
  });

}
