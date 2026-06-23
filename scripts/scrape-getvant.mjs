#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const BASE_URL = "https://getvant.com.br";
const USER_AGENT = "Mozilla/5.0 (compatible; VantContentAudit/1.0; +https://getvant.com.br/)";
const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, ...value] = arg.replace(/^--/, "").split("=");
    return [key, value.join("=") || true];
  }),
);
const outputDir = path.resolve(String(args.out || "scrape-output"));
const delayMs = Math.max(0, Number(args.delay || 300));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function decodeEntities(value = "") {
  const named = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name) => named[name.toLowerCase()] ?? match);
}

function stripHtml(value = "") {
  return decodeEntities(
    value
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

function matchOne(html, expression) {
  return decodeEntities(html.match(expression)?.[1]?.trim() || "");
}

function extractPage(html, url, type) {
  const title = matchOne(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const description =
    matchOne(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ||
    matchOne(html, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
  const canonical =
    matchOne(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i) ||
    matchOne(html, /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);
  const h1 = stripHtml(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "");
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] || html;
  const text = stripHtml(main);

  return { type, url, canonical, title, description, h1, text };
}

function parseLocs(xml) {
  return [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)].map((match) => decodeEntities(match[1].trim()));
}

async function fetchText(url, accept = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8") {
  const response = await fetch(url, { headers: { accept, "user-agent": USER_AGENT } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.text();
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { accept: "application/json", "user-agent": USER_AGENT },
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

function csvEscape(value) {
  if (value == null) return "";
  const text = typeof value === "object" ? JSON.stringify(value) : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toCsv(rows, columns) {
  return [columns.join(","), ...rows.map((row) => columns.map((column) => csvEscape(row[column])).join(","))].join("\n");
}

async function writeJson(filename, data) {
  await fs.writeFile(path.join(outputDir, filename), `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });
  const startedAt = new Date().toISOString();
  const sitemapIndex = await fetchText(`${BASE_URL}/sitemap.xml`, "application/xml");
  const sitemapUrls = parseLocs(sitemapIndex).filter((url) => !url.includes("agentic_discovery"));
  const discovered = [];

  for (const sitemapUrl of sitemapUrls) {
    const xml = await fetchText(sitemapUrl, "application/xml");
    const type = sitemapUrl.match(/sitemap_(products|pages|collections|blogs)_/)?.[1] || "other";
    for (const url of parseLocs(xml)) discovered.push({ type, url });
    await sleep(delayMs);
  }

  const unique = [...new Map(discovered.map((item) => [item.url, item])).values()];
  const products = [];
  const pages = [];
  const errors = [];

  for (let index = 0; index < unique.length; index += 1) {
    const item = unique[index];
    process.stdout.write(`[${index + 1}/${unique.length}] ${item.url}\n`);
    try {
      if (item.type === "products" && item.url.includes("/products/")) {
        const product = await fetchJson(`${item.url}.js`);
        products.push({
          id: product.id,
          handle: product.handle,
          url: item.url,
          title: product.title,
          vendor: product.vendor,
          type: product.type,
          available: product.available,
          price: product.price / 100,
          price_min: product.price_min / 100,
          price_max: product.price_max / 100,
          compare_at_price: product.compare_at_price == null ? null : product.compare_at_price / 100,
          description: stripHtml(product.description),
          featured_image: product.featured_image,
          images: product.images || [],
          options: product.options || [],
          variants: (product.variants || []).map((variant) => ({
            id: variant.id,
            title: variant.title,
            available: variant.available,
            price: variant.price / 100,
            compare_at_price: variant.compare_at_price == null ? null : variant.compare_at_price / 100,
            sku: variant.sku,
            option1: variant.option1,
            option2: variant.option2,
            option3: variant.option3,
          })),
          published_at: product.published_at,
        });
      } else {
        const html = await fetchText(item.url);
        const type = item.url === `${BASE_URL}/` ? "home" : item.type.replace(/s$/, "");
        pages.push(extractPage(html, item.url, type));
      }
    } catch (error) {
      errors.push({ url: item.url, error: error.message });
    }
    await sleep(delayMs);
  }

  products.sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
  pages.sort((a, b) => a.url.localeCompare(b.url));

  await writeJson("products.json", products);
  await writeJson("pages.json", pages);
  await writeJson("errors.json", errors);
  await fs.writeFile(
    path.join(outputDir, "products.csv"),
    `${toCsv(products.map((product) => ({
      ...product,
      images: product.images.join(" | "),
      options: product.options,
      variants: product.variants,
    })), [
      "id", "handle", "url", "title", "vendor", "type", "available", "price", "price_min",
      "price_max", "compare_at_price", "description", "featured_image", "images", "options", "variants", "published_at",
    ])}\n`,
    "utf8",
  );
  await fs.writeFile(
    path.join(outputDir, "pages.csv"),
    `${toCsv(pages, ["type", "url", "canonical", "title", "description", "h1", "text"])}\n`,
    "utf8",
  );

  const summary = {
    source: BASE_URL,
    started_at: startedAt,
    completed_at: new Date().toISOString(),
    delay_ms: delayMs,
    sitemap_count: sitemapUrls.length,
    discovered_urls: unique.length,
    products: products.length,
    pages: pages.length,
    errors: errors.length,
  };
  await writeJson("summary.json", summary);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
