import fs from "fs/promises";
import path from "path";
import { JobDescription, SalaryRecord } from "@/types";
import { normalize, lowercaseKeys } from "./utils";

let jobDescriptions: JobDescription[] | null = null;
let salaries: SalaryRecord[] | null = null;

const invertedIndex = new Map<string, Set<number>>();

const PREFIX_WORDS = new Set(['assistant', 'associate', 'junior', 'senior']);

async function loadData() {
  if (jobDescriptions && salaries) return;

  const [jobsData, salariesData] = await Promise.all([
    fs.readFile(path.join(process.cwd(), "data", "job-descriptions.json"), "utf-8"),
    fs.readFile(path.join(process.cwd(), "data", "salaries.json"), "utf-8")
  ]);

  jobDescriptions = JSON.parse(jobsData);
  const rawSalaries = JSON.parse(salariesData);
  
  salaries = rawSalaries.map(lowercaseKeys) as SalaryRecord[];

  jobDescriptions!.forEach((job, index) => {
    const words = normalize(job.title).split(/\s+/);
    words.forEach((word) => {
      if (!invertedIndex.has(word)) invertedIndex.set(word, new Set());
      invertedIndex.get(word)!.add(index);
    });
  });
}

export async function getKnownJurisdictions(): Promise<string[]> {
  await loadData();
  const jurisdictions = new Set([
    ...jobDescriptions!.map(j => j.jurisdiction),
    ...salaries!.map(s => s.jurisdiction)
  ]);
  return Array.from(jurisdictions);
}

// runtime matching using an inverted index and weighted scoring.
export async function findRelevantJobData(query: string) {
  await loadData();
  const normalizedQuery = normalize(query);
  const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 2);

  const knownJurisdictions = await getKnownJurisdictions();
  let matchedJurisdiction: string | undefined;

  // check all possible word combinations joined together (longest first)
  for (let len = queryWords.length; len >= 1; len--) {
    for (let i = 0; i <= queryWords.length - len; i++) {
      const joined = queryWords.slice(i, i + len).join("");
      const found = knownJurisdictions.find(kj => kj.toLowerCase() === joined);
      if (found) {
        matchedJurisdiction = found;
        break;
      }
    }
    if (matchedJurisdiction) break;
  }

  const jobScores = new Map<number, number>();

  // set scores
  queryWords.forEach(word => {
    const matchingJobIndices = invertedIndex.get(word);
    if (!matchingJobIndices) return;

    matchingJobIndices.forEach(idx => {
      const job = jobDescriptions![idx];
      const titleWords = normalize(job.title).split(/\s+/);

      let weight = 1.0;

      // lower weight for first word if it is one of Assistant/Associate/etc.
      if (titleWords[0] === word && PREFIX_WORDS.has(word)) {
        weight = 0.5;
      }

      jobScores.set(idx, (jobScores.get(idx) || 0) + weight);
    });
  });

  const rankedIndices = Array.from(jobScores.entries())
    .sort((a, b) => b[1] - a[1]);

  if (rankedIndices.length === 0) return null;

  const topIdx = rankedIndices[0][0];
  const bestJobMatch = jobDescriptions![topIdx];

  const targetJurisdiction = matchedJurisdiction || bestJobMatch.jurisdiction;

  const salary = salaries!.find(s => 
    s.jurisdiction === targetJurisdiction && 
    s["job code"] === bestJobMatch.code
  );

  return {
    job: bestJobMatch,
    salary,
    matchedJurisdiction: targetJurisdiction
  };
}

