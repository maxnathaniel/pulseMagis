$REMOTE_DIR = "/opt/pulsemagis"
$IMAGE = "pulsemagis-app"
$TAR = "pulsemagis-app.tar"

# Vite bakes VITE_* vars into the JS bundle at build time, so they must be
# passed as --build-arg here rather than left for the remote to inject.
if (-not (Test-Path .env)) { Write-Error ".env not found - copy .env.example and fill in your Supabase and deploy values"; exit 1 }
$envVars = @{}
Get-Content .env | ForEach-Object {
  if ($_ -match '^\s*([A-Z_]+)\s*=\s*(.*?)\s*$') { $envVars[$matches[1]] = $matches[2] }
}
if (-not $envVars['VITE_SUPABASE_URL'] -or -not $envVars['VITE_SUPABASE_ANON_KEY']) {
  Write-Error ".env is missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY"; exit 1
}
if (-not $envVars['DEPLOY_SERVER']) {
  Write-Error ".env is missing DEPLOY_SERVER (e.g. user@your-server-ip)"; exit 1
}
$SERVER = $envVars['DEPLOY_SERVER']

Write-Host "Building Docker image..."
docker build -t $IMAGE `
  --build-arg VITE_SUPABASE_URL=$($envVars['VITE_SUPABASE_URL']) `
  --build-arg VITE_SUPABASE_ANON_KEY=$($envVars['VITE_SUPABASE_ANON_KEY']) `
  .
if ($LASTEXITCODE -ne 0) { Write-Error "Build failed"; exit 1 }

Write-Host "Saving image to $TAR..."
docker save $IMAGE -o $TAR
if ($LASTEXITCODE -ne 0) { Write-Error "Save failed"; exit 1 }

Write-Host "Ensuring remote directory exists..."
ssh $SERVER "mkdir -p $REMOTE_DIR"
if ($LASTEXITCODE -ne 0) { Write-Error "Remote directory setup failed"; exit 1 }

Write-Host "Transferring to $SERVER..."
scp $TAR "${SERVER}:${REMOTE_DIR}/"
if ($LASTEXITCODE -ne 0) { Write-Error "Transfer failed"; exit 1 }

Write-Host "Syncing docker-compose.yml..."
scp docker-compose.yml "${SERVER}:${REMOTE_DIR}/docker-compose.yml"
if ($LASTEXITCODE -ne 0) { Write-Error "Compose file transfer failed"; exit 1 }

Write-Host "Loading image and restarting app on server..."
ssh $SERVER "cd $REMOTE_DIR && docker load < $TAR && docker compose up -d --remove-orphans"
if ($LASTEXITCODE -ne 0) { Write-Error "Remote deploy failed"; exit 1 }

Write-Host "Cleaning up local tar..."
Remove-Item $TAR

Write-Host "Done. App is live at https://pulse.stignatius.org.sg (once the Caddyfile site block from Caddyfile is added on the server - see DEPLOY.md)."
