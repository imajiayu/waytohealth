import 'server-only';
import { fetchWithTimeout } from './fetchWithTimeout';

const API = 'https://api.github.com';
// GitHub API p99 也在秒级；15s 超时已足够，悬挂请求不会阻塞整条 admin flow
const GITHUB_TIMEOUT_MS = 15_000;

function env() {
  const REPO = process.env.GITHUB_REPO;
  const BRANCH = process.env.GITHUB_BRANCH ?? 'main';
  const TOKEN = process.env.GITHUB_TOKEN;
  if (!REPO || !TOKEN) {
    throw new Error('Missing GITHUB_REPO or GITHUB_TOKEN env');
  }
  return { REPO, BRANCH, TOKEN };
}

async function gh(path: string, init?: RequestInit): Promise<unknown> {
  const { TOKEN } = env();
  const res = await fetchWithTimeout(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  }, GITHUB_TIMEOUT_MS);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub ${res.status}: ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

interface GhFileMeta {
  sha: string;
  content: string; // base64, newlines wrapped
  encoding: string;
}

// 获取文件的 sha 与原始 base64 内容；文件不存在时返回 null
export async function getFile(filePath: string): Promise<GhFileMeta | null> {
  const { REPO, BRANCH } = env();
  const url = `/repos/${REPO}/contents/${encodeURI(filePath)}?ref=${encodeURIComponent(BRANCH)}`;
  try {
    const data = (await gh(url)) as GhFileMeta;
    return data;
  } catch (err) {
    if (err instanceof Error && /GitHub 404/.test(err.message)) return null;
    throw err;
  }
}

// 创建或更新文件
export async function putFile(
  filePath: string,
  contentBase64: string,
  message: string
): Promise<void> {
  const { REPO, BRANCH } = env();
  const existing = await getFile(filePath);
  await gh(`/repos/${REPO}/contents/${encodeURI(filePath)}`, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content: contentBase64,
      branch: BRANCH,
      ...(existing ? { sha: existing.sha } : {}),
    }),
  });
}

// 删除文件（若不存在则忽略）
export async function deleteFile(filePath: string, message: string): Promise<void> {
  const { REPO, BRANCH } = env();
  const existing = await getFile(filePath);
  if (!existing) return;
  await gh(`/repos/${REPO}/contents/${encodeURI(filePath)}`, {
    method: 'DELETE',
    body: JSON.stringify({
      message,
      sha: existing.sha,
      branch: BRANCH,
    }),
  });
}

// 读文件文本（自动 base64 解码），不存在返回 null
export async function getFileText(filePath: string): Promise<string | null> {
  const f = await getFile(filePath);
  if (!f) return null;
  return Buffer.from(f.content, 'base64').toString('utf-8');
}

// ── 批量单次提交（Git Data API）─────────────────────────────────────
// 把多个文件变更塞进一个 commit，避免多次 push 触发多次 Vercel 部署

export interface FileChange {
  path: string;
  // 非 null 时创建/更新；null 时从仓库删除该路径
  contentBase64: string | null;
}

interface GhRef {
  object: { sha: string };
}
interface GhCommit {
  tree: { sha: string };
}
interface GhSha {
  sha: string;
}

export async function commitBatch(changes: FileChange[], message: string): Promise<void> {
  if (changes.length === 0) return;
  const { REPO, BRANCH } = env();

  // 1. 拿当前分支 HEAD
  const ref = (await gh(`/repos/${REPO}/git/ref/heads/${BRANCH}`)) as GhRef;
  const baseCommitSha = ref.object.sha;

  // 2. 拿 HEAD commit 的 tree sha
  const baseCommit = (await gh(`/repos/${REPO}/git/commits/${baseCommitSha}`)) as GhCommit;
  const baseTreeSha = baseCommit.tree.sha;

  // 3. 为每个新增/更新的文件创建 blob；删除用 sha: null
  const treeEntries: Array<{
    path: string;
    mode: '100644';
    type: 'blob';
    sha: string | null;
  }> = [];

  for (const change of changes) {
    if (change.contentBase64 === null) {
      treeEntries.push({ path: change.path, mode: '100644', type: 'blob', sha: null });
    } else {
      const blob = (await gh(`/repos/${REPO}/git/blobs`, {
        method: 'POST',
        body: JSON.stringify({ content: change.contentBase64, encoding: 'base64' }),
      })) as GhSha;
      treeEntries.push({ path: change.path, mode: '100644', type: 'blob', sha: blob.sha });
    }
  }

  // 4. 基于当前 tree 创建新 tree
  const newTree = (await gh(`/repos/${REPO}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({ base_tree: baseTreeSha, tree: treeEntries }),
  })) as GhSha;

  // 5. 创建 commit
  const newCommit = (await gh(`/repos/${REPO}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({
      message,
      tree: newTree.sha,
      parents: [baseCommitSha],
    }),
  })) as GhSha;

  // 6. 更新分支 ref 指向新 commit
  await gh(`/repos/${REPO}/git/refs/heads/${BRANCH}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: newCommit.sha, force: false }),
  });
}
