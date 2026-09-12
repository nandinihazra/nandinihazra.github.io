// ============================================================
// 1) SET YOUR ORCID iD HERE (format: 0000-0000-0000-0000)
// ============================================================
const ORCID_ID = "0000-0002-3870-1537"; // <-- TODO: replace with your real ORCID iD

document.getElementById("year").textContent = new Date().getFullYear();

// --- Publications, via the public ORCID API (no key needed) ---
async function loadPublications() {
  const list = document.getElementById("publications-list");
  const badge = document.getElementById("orcid-badge");
  badge.href = `https://orcid.org/${ORCID_ID}`;

  try {
    const res = await fetch(`https://pub.orcid.org/v3.0/${ORCID_ID}/works`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`ORCID API responded with ${res.status}`);

    const data = await res.json();
    const groups = data.group || [];

    // Sort most recent first
    groups.sort((a, b) => getYear(b) - getYear(a));

    if (groups.length === 0) {
      list.innerHTML = "<li>No publications found on ORCID yet.</li>";
      return;
    }

    list.innerHTML = "";
    groups.slice(0, 20).forEach((g) => {
      const summary = g["work-summary"][0];
      const title = summary.title && summary.title.title
        ? summary.title.title.value
        : "Untitled";
      const year = getYear(g);
      const journal = summary["journal-title"] ? summary["journal-title"].value : "";

      const doi = (summary["external-ids"] && summary["external-ids"]["external-id"] || [])
        .find((id) => id["external-id-type"] === "doi");
      const url = doi
        ? `https://doi.org/${doi["external-id-value"]}`
        : (summary.url ? summary.url.value : `https://orcid.org/${ORCID_ID}`);

      const li = document.createElement("li");
      li.innerHTML = `<a href="${url}" target="_blank" rel="noopener">${escapeHtml(title)}</a>` +
        (journal ? ` &mdash; <em>${escapeHtml(journal)}</em>` : "") +
        (year ? ` (${year})` : "");
      list.appendChild(li);
    });
  } catch (err) {
    list.innerHTML = "<li>Couldn't load publications from ORCID right now. " +
      `<a href="https://orcid.org/${ORCID_ID}" target="_blank" rel="noopener">View on ORCID directly</a>.</li>`;
    console.error("ORCID fetch failed:", err);
  }
}

function getYear(group) {
  const summary = group["work-summary"][0];
  return summary["publication-date"] && summary["publication-date"].year
    ? parseInt(summary["publication-date"].year.value, 10)
    : 0;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// --- Research interests, loaded from a separate markdown file you edit ---
async function loadInterests() {
  const el = document.getElementById("interests-content");
  try {
    const res = await fetch("interests.md", { cache: "no-store" });
    if (!res.ok) throw new Error("interests.md not found");
    const text = await res.text();
    el.innerHTML = marked.parse(text);
  } catch (err) {
    el.innerHTML = "<p><em>Interests coming soon.</em></p>";
    console.error("interests.md load failed:", err);
  }
}

loadPublications();
loadInterests();
