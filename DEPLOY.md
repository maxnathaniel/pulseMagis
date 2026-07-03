# Deploying PulseMagis to the Linode

This app shares the Linode's existing host-level Caddy instance (the one
already proxying `weddings.stignatius.org.sg` and
`ministry-finder.stignatius.org.sg`) rather than running its own — Caddy
already owns ports 80/443 on that box, so a second Caddy container/process
would conflict with it.

## One-time server setup

1. On the server, add the block from this repo's `Caddyfile` to the
   **existing** Caddyfile (the same file with the weddings/ministry-finder
   blocks) — it reverse-proxies `pulse.stignatius.org.sg` to
   `localhost:3003`, the host port PulseMagis's container publishes.
2. Reload Caddy so it picks up the new site and requests a TLS cert for it
   (`caddy reload --config /path/to/Caddyfile`, or restart the service/
   container running it — whatever the existing setup uses).
3. Point DNS for `pulse.stignatius.org.sg` at the Linode's IP, if not
   already done.
4. Make sure nothing else on the server is already using port 3003 (3001
   and 3002 are taken by the other two apps). Change the port in both
   `docker-compose.yml` and the Caddyfile block if it needs to be different.

## Deploying

From this project on your machine (Docker Desktop running, `.env` filled
in with your Supabase values):

```powershell
./deploy.ps1
```

This builds the image locally (baking in `VITE_SUPABASE_URL`/
`VITE_SUPABASE_ANON_KEY` from `.env`, since Vite inlines them at build
time), saves it to a tar, copies the tar + `docker-compose.yml` to
`/opt/pulsemagis` on the server, then loads the image and restarts the
container there. No source code, Node, or npm is needed on the server —
only Docker.

Re-run the same script for every future deploy.
