import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  const websiteDir = path.join(process.cwd());

  try {
    const statusBefore = execSync('git status --porcelain', { cwd: websiteDir, encoding: 'utf-8' });
    
    // Add all modified files
    execSync('git add .', { cwd: websiteDir, encoding: 'utf-8' });

    // Check if there are changes to commit
    let commitOutput = 'No changes to commit';
    try {
      commitOutput = execSync('git commit -m "Update dev server network host, Meta Pixel integration, and direct Timely booking links"', {
        cwd: websiteDir,
        encoding: 'utf-8',
      });
    } catch (e) {
      commitOutput = 'Nothing to commit, working tree clean';
    }

    // Push to origin main
    let pushOutput = '';
    try {
      pushOutput = execSync('git push origin main', { cwd: websiteDir, encoding: 'utf-8' });
    } catch (e) {
      const err = e as { stdout?: string; stderr?: string; message?: string };
      pushOutput = err.stderr || err.stdout || err.message || String(err);
    }

    const statusAfter = execSync('git status', { cwd: websiteDir, encoding: 'utf-8' });

    return NextResponse.json({
      success: true,
      statusBefore,
      commitOutput,
      pushOutput,
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
