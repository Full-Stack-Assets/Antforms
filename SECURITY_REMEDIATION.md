# Security Remediation: Leaked API Keys in Git History

## Summary
GitScan detected sensitive API keys (Groq, Brave, Pexels, and GitHub) leaked in the `.env.local` file that was committed to the repository history.

## Affected Commits
- **File**: `.env.local`
- **Initial Commit**: `baba6e4` (Create .env.local)
- **Merge Commit**: `997e65f` (Merge pull request #1)
- **Removed From Tracking**: `a6e6bb9` (Remove .env.local from git tracking)

## Leaked Credentials (REDACTED)
The following credentials were exposed in commit `997e65f`:
- `GROQ_API_KEY`: `gsk_********************************BAl`
- `BRAVE_API_KEY`: `BSALsOGGpVhjgxZAsbX8tUb5KkIC5Zm`
- `PEXELS_API_KEY`: `8jOSXckGQ5jvHADVkqAZ99UiNEdBEg3YHMLazurBIbTcSV179AmMkcVL`
- `GITHUB_TOKEN`: `github_pat_11CBTUYIA075yylY93BXTt_***` (partially redacted)
- `CRON_SECRET`: `61a071c638abfcf6d97ab2d620d92f3e36c30fa79f529bad0ed0eedf5da93f46`

## Current Status
✅ The `.env.local` file has been removed from the repository (commit `a6e6bb9`)
✅ The `.env.local` file is properly listed in `.gitignore`
❌ The sensitive data still exists in the Git history
❌ The API keys have not been rotated yet

## Required Actions

### 1. IMMEDIATELY Revoke and Rotate All API Keys

#### Groq API Key
1. Visit https://console.groq.com/keys
2. Delete the compromised key: `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`
3. Generate a new API key
4. Update your `.env.local` file with the new key

#### Brave Search API Key
1. Visit https://api.search.brave.com/app/keys
2. Revoke the key: `BSALsOGGpVhjgxZAsbX8tUb5KkIC5Zm`
3. Generate a new API key
4. Update your `.env.local` file with the new key

#### Pexels API Key
1. Visit https://www.pexels.com/api/
2. Revoke the key: `8jOSXckGQ5jvHADVkqAZ99UiNEdBEg3YHMLazurBIbTcSV179AmMkcVL`
3. Generate a new API key
4. Update your `.env.local` file with the new key

#### GitHub Personal Access Token
1. Visit https://github.com/settings/tokens
2. Find and delete the token starting with `github_pat_11CBTUYIA0...`
3. Create a new fine-grained personal access token with Contents: Read/Write permissions
4. Update your `.env.local` file with the new token

#### CRON_SECRET
1. Generate a new secret: `openssl rand -hex 32`
2. Update your `.env.local` file
3. Update the secret in your deployment environment (Vercel/Cloudflare)

### 2. Clean Git History (IMPORTANT)

The sensitive data still exists in the Git history and can be accessed by anyone who clones the repository. You must rewrite the Git history to completely remove it.

#### Option A: Using git-filter-repo (Recommended)

```bash
# Install git-filter-repo
pip3 install git-filter-repo

# Clone a fresh copy of the repository
git clone https://github.com/Full-Stack-Assets/Antforms.git antforms-clean
cd antforms-clean

# Remove .env.local from all commits in history
git filter-repo --path .env.local --invert-paths

# Force push to all branches (THIS WILL REWRITE HISTORY)
git remote add origin https://github.com/Full-Stack-Assets/Antforms.git
git push origin --force --all
git push origin --force --tags
```

#### Option B: Using BFG Repo-Cleaner

```bash
# Download BFG
wget https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar

# Clone a fresh mirror of the repository
git clone --mirror https://github.com/Full-Stack-Assets/Antforms.git

# Remove .env.local from history
java -jar bfg-1.14.0.jar --delete-files .env.local Antforms.git

# Clean up and push
cd Antforms.git
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push --force
```

⚠️ **WARNING**: Rewriting Git history is a destructive operation. Ensure:
1. All team members are notified before you force-push
2. All open pull requests are merged or closed first
3. Team members will need to re-clone the repository after the history rewrite
4. Any forks of the repository will still contain the sensitive data

### 3. Update Deployment Environments

After rotating all keys, update them in your deployment environments:

#### Vercel
1. Go to your project settings
2. Navigate to Environment Variables
3. Update all the rotated API keys
4. Redeploy the application

#### Cloudflare Pages
1. Go to Settings → Environment Variables
2. Update all the rotated API keys
3. Create a new deployment

### 4. Verify the Fix

After completing the above steps:

1. Check that `.env.local` is not in the repository:
   ```bash
   git log --all --full-history -- .env.local
   # Should return no results
   ```

2. Verify `.env.local` is in `.gitignore`:
   ```bash
   git check-ignore .env.local
   # Should output: .env.local
   ```

3. Mark the finding as resolved on GitScan:
   https://gitscan.ai/resolve?finding=gs_50fae1adedf1d181

## Prevention Measures

To prevent future credential leaks:

1. ✅ `.env.local` is already in `.gitignore` - DO NOT remove this entry
2. Always use `.env.example` as a template with placeholder values
3. Never commit actual credentials to version control
4. Consider using a pre-commit hook to scan for secrets:
   ```bash
   pip install pre-commit
   # Add gitleaks or similar tool to .pre-commit-config.yaml
   ```
5. Use secret scanning tools:
   - GitHub's secret scanning (enable in repository settings)
   - GitGuardian
   - TruffleHog

## Timeline
- Initial leak: `baba6e4` (committed .env.local with real credentials)
- Merged to main: `997e65f`
- Removed from tracking: `a6e6bb9` (April 19, 2026)
- GitScan alert: April 19, 2026
- This remediation document: April 19, 2026

## References
- GitScan Issue: https://github.com/Full-Stack-Assets/Antforms/issues/[ISSUE_NUMBER]
- git-filter-repo: https://github.com/newren/git-filter-repo
- BFG Repo-Cleaner: https://rtyley.github.io/bfg-repo-cleaner/
- GitHub: Removing sensitive data from a repository: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository
