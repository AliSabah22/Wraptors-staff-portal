# Dev Server

## Running the app

1. **Stop any other dev servers**  
   In every terminal where `npm run dev` or `next dev` is running, press **Ctrl+C**.  
   If you see "Port 3000 is in use", another process is still running.

2. **Start once**
   ```bash
   npm run dev
   ```
   or after a full clean:
   ```bash
   npm run dev:clean
   ```

3. **Wait for "Ready"**  
   When you see `✓ Ready in ...` and the local URL (e.g. http://localhost:3000), open that URL in the browser.

4. **If you still get loading forever, 404, or 500**
   - Confirm you see: `[dev-with-manifests] Placeholder manifests ready...` (only one dev process).
   - Quit all other terminals that might be running Next.js, then run `npm run dev` again.
   - Try a hard refresh (Cmd+Shift+R / Ctrl+Shift+R) or a new incognito window.

## What the dev script does

`npm run dev` runs a wrapper that keeps minimal manifest files in `.next/server` so Next.js 15 dev doesn’t hit ENOENT. It only recreates a file when it’s missing; it never overwrites manifests that Next has already written.
