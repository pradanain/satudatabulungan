#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const ckanBaseUrl = process.env.CKAN_BASE_URL?.trim() || "http://localhost:5000";
const packageName = process.env.CKAN_INFOGRAFIS_PACKAGE_NAME?.trim() || "infografis-dkip-bulungan";
const packageTitle = process.env.CKAN_INFOGRAFIS_PACKAGE_TITLE?.trim() || "Infografis DKIP Bulungan";
const ownerOrg = process.env.CKAN_INFOGRAFIS_OWNER_ORG?.trim() || "";

function resolveApiKey() {
  const fromEnv = process.env.CKAN_API_KEY?.trim();
  if (fromEnv) {
    return fromEnv;
  }

  const helperScript = resolve(scriptDir, "ensure-ckan-token.mjs");
  const created = execFileSync(process.execPath, [helperScript, "--format", "token"], {
    encoding: "utf8",
  }).trim();

  if (!created) {
    throw new Error("CKAN_API_KEY tidak ditemukan dan gagal dibuat otomatis.");
  }

  return created;
}

const apiKey = resolveApiKey();

async function callCkanAction(action, payload = {}) {
  const response = await fetch(`${ckanBaseUrl}/api/3/action/${action}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.success !== true) {
    const reason = data?.error ? JSON.stringify(data.error) : `${response.status} ${response.statusText}`;
    throw new Error(`${action} gagal: ${reason}`);
  }

  return data.result;
}

function normalizeImageOriginalCandidate(imageUrl) {
  try {
    const parsed = new URL(imageUrl);
    parsed.pathname = parsed.pathname.replace(/-(\d+)x(\d+)(\.[a-zA-Z0-9]+)$/i, "$3");
    return parsed.toString();
  } catch {
    return "";
  }
}

function normalizeText(value) {
  return (value ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchWordPressRestItems() {
  const endpoint =
    "https://diskominfo.bulungan.go.id/wp/wp-json/wp/v2/posts?search=infografis&per_page=100&page=1&_embed=1";

  const response = await fetch(endpoint, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; SatuDataBulunganSync/1.0)",
    },
  });

  if (!response.ok) {
    throw new Error(`WordPress REST gagal (${response.status}).`);
  }

  const posts = await response.json();
  return posts
    .map((post) => {
      const media = post?._embedded?.["wp:featuredmedia"]?.[0];
      const imageUrl = media?.source_url || media?.media_details?.sizes?.large?.source_url;

      if (!imageUrl || !post?.link) {
        return null;
      }

      return {
        title: normalizeText(post?.title?.rendered) || `Infografis ${post.id}`,
        postUrl: String(post.link),
        imageUrl: String(imageUrl),
        imageOriginalUrl: normalizeImageOriginalCandidate(String(imageUrl)),
        publishedDate: post?.date ? new Date(post.date).toISOString() : "",
        sourcePostId: String(post.id),
        source: "diskominfo_bulungan",
      };
    })
    .filter(Boolean);
}

async function fetchHtmlFallbackItems() {
  const endpoint = "https://diskominfo.bulungan.go.id/wp/infografis/";
  const response = await fetch(endpoint, {
    headers: {
      Accept: "text/html",
      "User-Agent": "Mozilla/5.0 (compatible; SatuDataBulunganSync/1.0)",
    },
  });

  if (!response.ok) {
    throw new Error(`HTML source gagal (${response.status}).`);
  }

  const html = await response.text();
  const items = [];
  const regex = /<div class="rt-col[^>]*rt-grid-item"[^>]*data-id="(\d+)"[\s\S]*?<a[^>]*href="([^"]+)"[^>]*class="tpg-post-link"[\s\S]*?<img[^>]*data-src="([^"]+)"[^>]*alt="([^"]*)"[\s\S]*?<h3 class="entry-title">[\s\S]*?<a[^>]*>([^<]+)<\/a>/gi;

  let match = regex.exec(html);
  while (match) {
    const [, sourcePostId, postUrl, imageUrl, alt, title] = match;
    items.push({
      title: normalizeText(title),
      postUrl,
      imageUrl,
      imageOriginalUrl: normalizeImageOriginalCandidate(imageUrl),
      publishedDate: "",
      sourcePostId,
      source: "diskominfo_bulungan",
      alt: normalizeText(alt),
    });

    match = regex.exec(html);
  }

  return items;
}

async function ensurePackage() {
  try {
    return await callCkanAction("package_show", { id: packageName });
  } catch {
    const payload = {
      name: packageName,
      title: packageTitle,
      notes:
        "Metadata infografis DKIP Bulungan yang disinkronkan otomatis dari sumber WordPress resmi.",
      private: false,
      tags: [{ name: "infografis" }, { name: "dkip-bulungan" }],
      extras: [{ key: "source", value: "diskominfo_bulungan" }],
    };

    if (ownerOrg) {
      payload.owner_org = ownerOrg;
    }

    return callCkanAction("package_create", payload);
  }
}

async function ensureDatastoreResource(pkg) {
  const existing = (pkg.resources || []).find((resource) =>
    [resource.name, resource.title].some((value) => String(value || "").toLowerCase() === "infografis-metadata"),
  );

  if (existing?.id) {
    return existing;
  }

  return callCkanAction("resource_create", {
    package_id: pkg.id,
    name: "infografis-metadata",
    description: "Record metadata infografis dari DKIP Bulungan",
    format: "JSON",
    url: "https://diskominfo.bulungan.go.id/wp/infografis/",
  });
}

async function upsertDatastore(resourceId, records) {
  await callCkanAction("datastore_create", {
    resource_id: resourceId,
    force: true,
    fields: [
      { id: "sourcePostId", type: "text" },
      { id: "title", type: "text" },
      { id: "postUrl", type: "text" },
      { id: "imageUrl", type: "text" },
      { id: "imageOriginalUrl", type: "text" },
      { id: "publishedDate", type: "text" },
      { id: "source", type: "text" },
    ],
    primary_key: ["sourcePostId"],
  });

  await callCkanAction("datastore_upsert", {
    resource_id: resourceId,
    method: "upsert",
    records,
    force: true,
  });
}

try {
  let items = [];

  try {
    items = await fetchWordPressRestItems();
  } catch {
    items = [];
  }

  if (!items.length) {
    items = await fetchHtmlFallbackItems();
  }

  if (!items.length) {
    throw new Error("Tidak ada metadata infografis yang berhasil diambil.");
  }

  const unique = Array.from(
    new Map(items.map((item) => [item.sourcePostId || item.postUrl, item])).values(),
  ).map((item, index) => ({
    sourcePostId: item.sourcePostId || `html-${index + 1}`,
    title: item.title,
    postUrl: item.postUrl,
    imageUrl: item.imageUrl,
    imageOriginalUrl: item.imageOriginalUrl || "",
    publishedDate: item.publishedDate || "",
    source: item.source,
  }));

  const pkg = await ensurePackage();
  const resource = await ensureDatastoreResource(pkg);
  await upsertDatastore(resource.id, unique);

  console.log("Sync infografis ke CKAN: OK");
  console.log(`Base URL: ${ckanBaseUrl}`);
  console.log(`Package: ${pkg.name}`);
  console.log(`Resource: ${resource.id}`);
  console.log(`Records upserted: ${unique.length}`);
} catch (error) {
  console.error("Sync infografis ke CKAN: FAILED");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
