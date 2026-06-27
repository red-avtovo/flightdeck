# Flightdeck — Production Readiness Extensions

> **Scope:** These specs extend the base Flightdeck assignment beyond the interview prototype. They describe how the system would be hardened, containerised, and deployed in a real organisation.

---

## 1. Error Monitoring — Sentry Integration

### Goal
Capture runtime errors and performance traces from the React SPA, with org-level context attached to every event so incidents can be attributed to specific teams and agents.

### Requirements

**FR-SENTRY-01 — SDK initialisation**
Sentry must be initialised before the React tree mounts. Initialise in `src/main.tsx` before `ReactDOM.createRoot`:

```typescript
import * as Sentry from '@sentry/react'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,          // 'production' | 'development'
  release: import.meta.env.VITE_APP_VERSION,  // injected by CI as git SHA
  tracesSampleRate: 0.1,                       // 10% of sessions
  replaysOnErrorSampleRate: 1.0,               // 100% replays on errors
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
  ],
})
```

**FR-SENTRY-02 — Error boundary**
Wrap the router tree in `Sentry.ErrorBoundary` with a fallback UI:

```tsx
<Sentry.ErrorBoundary fallback={<ErrorPage />} showDialog>
  <BrowserRouter basename="/flightdeck">
    ...
  </BrowserRouter>
</Sentry.ErrorBoundary>
```

**FR-SENTRY-03 — User context**
Set the Sentry user scope after SSO authentication succeeds (in `LoginPage`):

```typescript
Sentry.setUser({ id: userId, email: userEmail, orgId })
```

Clear on logout: `Sentry.setUser(null)`.

**FR-SENTRY-04 — Custom tags**
Tag every event with the active dashboard filters so support can reproduce the exact view:

```typescript
Sentry.setTag('filter.period', period)
Sentry.setTag('filter.teamId', teamId ?? 'all')
Sentry.setTag('filter.model', model ?? 'all')
```

Set these tags inside a `useEffect` in `FilterProvider` whenever filter state changes.

**FR-SENTRY-05 — Performance tracing**
Each mock API call should be wrapped in a Sentry span so p50/p95 latency per endpoint is visible in the Sentry Performance dashboard:

```typescript
async function withTrace<T>(name: string, fn: () => Promise<T>): Promise<T> {
  return Sentry.startSpan({ name, op: 'mock.api' }, fn)
}
```

**FR-SENTRY-06 — Source maps**
The Vite build must upload source maps to Sentry so stack traces show original TypeScript. Use `@sentry/vite-plugin`:

```typescript
// vite.config.ts
import { sentryVitePlugin } from '@sentry/vite-plugin'

plugins: [
  react(),
  sentryVitePlugin({
    authToken: process.env.SENTRY_AUTH_TOKEN,
    org: 'your-org',
    project: 'flightdeck',
    release: { name: process.env.VITE_APP_VERSION },
    sourcemaps: { filesToDeleteAfterUpload: ['dist/**/*.map'] },
  }),
]
```

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `VITE_SENTRY_DSN` | Yes | Sentry project DSN |
| `VITE_APP_VERSION` | Yes | Git SHA injected by CI |
| `SENTRY_AUTH_TOKEN` | CI only | Token for source-map upload |

---

## 2. Docker Image

### Goal
Produce a minimal, reproducible Docker image that serves the Flightdeck SPA as a static site via nginx, suitable for any container runtime.

### Multi-stage Dockerfile

```dockerfile
# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

# Enable corepack for pnpm version pinning
RUN corepack enable

WORKDIR /app

# Install dependencies (layer-cached unless lockfile changes)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Build the SPA
COPY . .
ARG VITE_APP_VERSION=local
ARG VITE_SENTRY_DSN=""
ENV VITE_APP_VERSION=${VITE_APP_VERSION}
ENV VITE_SENTRY_DSN=${VITE_SENTRY_DSN}
RUN pnpm build

# ── Stage 2: Serve ───────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Custom config: serve /flightdeck/ path, handle SPA deep-links
COPY docker/nginx.conf /etc/nginx/conf.d/flightdeck.conf

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html/flightdeck

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -qO- http://localhost/flightdeck/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

### nginx configuration (`docker/nginx.conf`)

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;

    # Serve SPA — all /flightdeck/* paths fall back to the SPA index
    location /flightdeck/ {
        try_files $uri $uri/ /flightdeck/index.html;
    }

    # Health check endpoint (used by k8s liveness probe)
    location /healthz {
        access_log off;
        return 200 "ok\n";
        add_header Content-Type text/plain;
    }

    # Security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://*.sentry.io;" always;

    gzip on;
    gzip_types text/plain application/javascript application/json text/css image/svg+xml;
    gzip_min_length 1024;
}
```

### Build commands

```bash
# Local build
docker build \
  --build-arg VITE_APP_VERSION=$(git rev-parse --short HEAD) \
  -t flightdeck:local .

# Run locally
docker run -p 8080:80 flightdeck:local
# Access at http://localhost:8080/flightdeck/

# Multi-platform build for CI (push to registry)
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --build-arg VITE_APP_VERSION=${{ github.sha }} \
  --build-arg VITE_SENTRY_DSN=${{ secrets.VITE_SENTRY_DSN }} \
  -t ghcr.io/${{ github.repository }}/flightdeck:${{ github.sha }} \
  -t ghcr.io/${{ github.repository }}/flightdeck:latest \
  --push .
```

### CI additions (`.github/workflows/ci.yml`)

Add a `docker` job that runs after the `build` job:

```yaml
docker:
  needs: [build]
  runs-on: ubuntu-latest
  permissions:
    packages: write
    contents: read
  steps:
    - uses: actions/checkout@v4
    - uses: docker/setup-buildx-action@v3
    - uses: docker/login-action@v3
      with:
        registry: ghcr.io
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    - uses: docker/build-push-action@v6
      with:
        context: .
        platforms: linux/amd64,linux/arm64
        push: ${{ github.ref == 'refs/heads/main' }}
        build-args: |
          VITE_APP_VERSION=${{ github.sha }}
          VITE_SENTRY_DSN=${{ secrets.VITE_SENTRY_DSN }}
        tags: |
          ghcr.io/${{ github.repository }}/flightdeck:${{ github.sha }}
          ghcr.io/${{ github.repository }}/flightdeck:latest
        cache-from: type=gha
        cache-to: type=gha,mode=max
```

---

## 3. Production Deployment

### 3a. Docker Compose (local / staging)

`docker-compose.yml` for running Flightdeck alongside a reverse proxy in a single-server staging environment:

```yaml
version: '3.9'

services:
  flightdeck:
    image: ghcr.io/your-org/flightdeck:latest
    restart: unless-stopped
    environment:
      - VITE_SENTRY_DSN=${VITE_SENTRY_DSN:-}
    ports:
      - "8080:80"
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost/healthz"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.flightdeck.rule=PathPrefix(`/flightdeck`)"
      - "traefik.http.routers.flightdeck.entrypoints=websecure"
      - "traefik.http.routers.flightdeck.tls.certresolver=letsencrypt"

  traefik:
    image: traefik:v3.1
    restart: unless-stopped
    command:
      - --api.dashboard=false
      - --providers.docker=true
      - --providers.docker.exposedByDefault=false
      - --entrypoints.web.address=:80
      - --entrypoints.web.http.redirections.entrypoint.to=websecure
      - --entrypoints.websecure.address=:443
      - --certificatesresolvers.letsencrypt.acme.email=${ACME_EMAIL}
      - --certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json
      - --certificatesresolvers.letsencrypt.acme.tlschallenge=true
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - letsencrypt:/letsencrypt

volumes:
  letsencrypt:
```

### 3b. Kubernetes manifests

#### `k8s/namespace.yaml`
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: flightdeck
  labels:
    app.kubernetes.io/name: flightdeck
```

#### `k8s/deployment.yaml`
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: flightdeck
  namespace: flightdeck
  labels:
    app: flightdeck
spec:
  replicas: 2
  selector:
    matchLabels:
      app: flightdeck
  template:
    metadata:
      labels:
        app: flightdeck
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 101  # nginx user
        fsGroup: 101
      containers:
        - name: flightdeck
          image: ghcr.io/your-org/flightdeck:latest
          imagePullPolicy: Always
          ports:
            - containerPort: 80
              name: http
          resources:
            requests:
              cpu: 10m
              memory: 32Mi
            limits:
              cpu: 100m
              memory: 64Mi
          livenessProbe:
            httpGet:
              path: /healthz
              port: 80
            initialDelaySeconds: 5
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /healthz
              port: 80
            initialDelaySeconds: 3
            periodSeconds: 5
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop: [ALL]
          volumeMounts:
            - mountPath: /tmp
              name: tmp
            - mountPath: /var/cache/nginx
              name: nginx-cache
            - mountPath: /var/run
              name: nginx-run
      volumes:
        - name: tmp
          emptyDir: {}
        - name: nginx-cache
          emptyDir: {}
        - name: nginx-run
          emptyDir: {}
```

#### `k8s/service.yaml`
```yaml
apiVersion: v1
kind: Service
metadata:
  name: flightdeck
  namespace: flightdeck
spec:
  selector:
    app: flightdeck
  ports:
    - name: http
      port: 80
      targetPort: 80
  type: ClusterIP
```

#### `k8s/ingress.yaml`
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: flightdeck
  namespace: flightdeck
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /$2
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - your-org.example.com
      secretName: flightdeck-tls
  rules:
    - host: your-org.example.com
      http:
        paths:
          - path: /flightdeck(/|$)(.*)
            pathType: Prefix
            backend:
              service:
                name: flightdeck
                port:
                  number: 80
```

#### `k8s/hpa.yaml` (Horizontal Pod Autoscaler)
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: flightdeck
  namespace: flightdeck
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: flightdeck
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

### 3c. Helm chart

```
helm/flightdeck/
├── Chart.yaml
├── values.yaml
├── templates/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── hpa.yaml
│   └── _helpers.tpl
```

**`helm/flightdeck/Chart.yaml`:**
```yaml
apiVersion: v2
name: flightdeck
description: Org-level AI coding agent analytics dashboard
type: application
version: 0.1.0
appVersion: "0.1.0"
```

**`helm/flightdeck/values.yaml`:**
```yaml
replicaCount: 2

image:
  repository: ghcr.io/your-org/flightdeck
  pullPolicy: Always
  tag: ""  # Overridden by CI with git SHA

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: true
  className: nginx
  host: your-org.example.com
  path: /flightdeck
  tls:
    enabled: true
    secretName: flightdeck-tls

resources:
  requests:
    cpu: 10m
    memory: 32Mi
  limits:
    cpu: 100m
    memory: 64Mi

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70

sentry:
  dsn: ""  # Set via --set sentry.dsn=... or Helm secrets

podSecurityContext:
  runAsNonRoot: true
  runAsUser: 101
  fsGroup: 101
```

**Deploy commands:**
```bash
# Install
helm install flightdeck ./helm/flightdeck \
  --namespace flightdeck --create-namespace \
  --set image.tag=$GIT_SHA \
  --set sentry.dsn=$SENTRY_DSN

# Upgrade (rolling deploy, zero downtime)
helm upgrade flightdeck ./helm/flightdeck \
  --namespace flightdeck \
  --set image.tag=$GIT_SHA \
  --atomic --timeout 5m

# Rollback
helm rollback flightdeck --namespace flightdeck
```

---

## 4. Implementation Notes

| Feature | Effort | Blocking dependency |
|---|---|---|
| Sentry DSN + ErrorBoundary | 0.5 day | Sentry project created |
| Source map upload in CI | 0.5 day | `SENTRY_AUTH_TOKEN` secret |
| Dockerfile + nginx | 1 day | None |
| Docker CI job | 0.5 day | GHCR access token |
| docker-compose staging | 0.5 day | Domain + DNS |
| k8s manifests | 1 day | Cluster + cert-manager |
| Helm chart | 1 day | k8s manifests done |

None of these features modify the core SPA behaviour. All can be added in a separate `feat/production-hardening` branch after the base dashboard is shipped.
