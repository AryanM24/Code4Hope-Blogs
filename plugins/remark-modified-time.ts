/*
 * @Description: Automatically add last modified time
 */
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';

function findGitRoot(startPath: string): string | null {
  let currentPath = startPath;
  const root = '/';
  
  while (currentPath !== root) {
    const gitPath = join(currentPath, '.git');
    if (existsSync(gitPath)) {
      return currentPath;
    }
    currentPath = dirname(currentPath);
  }
  
  return null;
}

export function remarkModifiedTime() {
  return function (tree, file) {
    try {
      const filepath = file.history[0];
      
      // Check if we're in a git repository before attempting git command
      const gitRoot = findGitRoot(filepath);
      if (!gitRoot) {
        // Not in a git repo, skip setting lastModified
        return;
      }
      
      const result = execSync(`git log -1 --pretty="format:%cI" "${filepath}"`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: gitRoot,
      });
      
      const lastModified = result.toString().trim();
      if (lastModified) {
        file.data.astro.frontmatter.lastModified = lastModified;
      }
    } catch (error) {
      // If git command fails (git not installed, file not in git, etc.), 
      // just skip setting lastModified - it will fall back to pubDate
      // This prevents the build from failing
      // Silently ignore the error
    }
  };
}
