import { NextResponse } from 'next/server';
import { execSync, spawnSync } from 'child_process';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  const websiteDir = path.join(process.cwd());

  try {
    const statusBefore = execSync('git status --porcelain', { cwd: websiteDir, encoding: 'utf-8' });
    
    // Add all modified files
    execSync('git add .', { cwd: websiteDir, encoding: 'utf-8' });

    // Commit changes
    let commitOutput = '';
    try {
      commitOutput = execSync('git commit -m "Update dev server network host, Meta Pixel integration, and direct Timely booking links"', {
        cwd: websiteDir,
        encoding: 'utf-8',
      });
    } catch (e) {
      commitOutput = 'Nothing to commit, working tree clean';
    }

    // Try push with a 5 second timeout
    const pushResult = spawnSync('git', ['push', 'origin', 'main'], {
      cwd: websiteDir,
      encoding: 'utf-8',
      timeout: 5000,
    });

    const statusAfter = execSync('git status', { cwd: websiteDir, encoding: 'utf-8' });

    return NextResponse.json({
      success: pushResult.status === 0,
      statusBefore,
      commitOutput,
      pushStdout: pushResult.stdout,
      pushStderr: pushResult.stderr,
      pushError: pushResult.error ? String(pushResult.error) : null,
      statusAfter
    });
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string; message?: string };
    return NextResponse.json({
      success: false,
      error: e.stderr || e.stdout || e.message || String(err)
    }, { status: 500 });
  }
}
