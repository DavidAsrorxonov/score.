After the implementation of the `context/feature/10-queue-setup.md` file, I have experiences some issues

### Issues

1. This first issue was the one written below:

```
 GET /app 200 in 7.2s (next.js: 50ms, proxy.ts: 1161ms, application-code: 6.0s)
 GET /app/scans/eee6171a-f9c3-457b-8576-ef0bd482ab6e 200 in 1810ms (next.js: 423ms, proxy.ts: 10ms, application-code: 1377ms)
 GET /app/new-scan 200 in 2.6s (next.js: 44ms, proxy.ts: 17ms, application-code: 2.5s)
Scan queue enqueue failed Error: Queue name cannot contain :
    at getScanQueue (lib/queue/scan-queue.ts:16:33)
    at enqueueScanRun (lib/queue/enqueue-scan.ts:13:22)
    at createScanForCurrentUser (lib/scans/create-scan.ts:186:13)
    at async POST (app/api/scans/route.ts:48:18)
  14 | ...ion getScanQueue() {
  15 | ...lThis.scoreScanQueue) {
> 16 | ...is.scoreScanQueue = new Queue<RunScanJobD...
     |                        ^
  17 | ...tion: getRedisConnection(),
  18 | ...tJobOptions: SCAN_QUEUE_DEFAULT_JOB_OPTIONS,
  19 | ...
 POST /api/scans 503 in 7.1s (next.js: 216ms, proxy.ts: 24ms, application-code: 6.8s)
```

It said that the queue name can't contain `:`, so I manually changed `score:scans` to `score-scans` in `lib/queue/names.ts` file and I also updated the `context/feature/10-queue-setup.md` file where it was mentioned
However, after that a second issue appeared which I will explain below as issue number 2.

2. This was the second issue that appeared after I manually fixed the issue above

```
 GET /app/new-scan 200 in 6.0s (next.js: 27ms, proxy.ts: 743ms, application-code: 5.3s)
Scan queue enqueue failed Error: Custom Id cannot contain :
    at async createScanForCurrentUser (lib/scans/create-scan.ts:186:7)
    at async POST (app/api/scans/route.ts:48:18)
  184 |
  185 |     try {
> 186 |       await enqueueScan(result.scan.id);
      |       ^
  187 |     } catch (error) {
  188 |       console.error("Scan queue enqueue failed", error);
  189 |
 POST /api/scans 503 in 5.8s (next.js: 7ms, proxy.ts: 41ms, application-code: 5.8s)
```
