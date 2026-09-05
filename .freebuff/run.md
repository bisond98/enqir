# Run Doc

## Reproduce uncommitted artifacts
No extra artifacts needed — dependencies are in `node_modules/` and `.env` is already present in the workspace.

## Run the dev server

```bash
# From the project root:
npx vite --port 5174 --host
```

Or via a detached launchd job (macOS, survives terminal close):

```bash
cat > /tmp/vite-serve.sh << 'SCRIPT'
#!/bin/bash
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:$PATH"
cd "<PROJECT_ROOT>"
exec node node_modules/vite/bin/vite.js --port 5174 --host
SCRIPT
chmod +x /tmp/vite-serve.sh
launchctl submit -l com.freebuff.vite2 -- /tmp/vite-serve.sh
```

Teardown:
```bash
launchctl remove com.freebuff.vite2 2>/dev/null
```
